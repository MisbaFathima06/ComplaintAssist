import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertComplaintSchema, insertEmergencyAlertSchema } from "@shared/schema";
import { ZkIdentityService } from "./services/zk-identity";
import { EncryptionService } from "./services/encryption";
import { IPFSService } from "./services/ipfs";
import { BlockchainService } from "./services/blockchain";
import { EmergencyService } from "./services/emergency";
import { AnalyticsService } from "./services/analytics";
import { NotificationService } from "./services/notifications";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const zkService = new ZkIdentityService();
  const encryptionService = new EncryptionService();
  const ipfsService = new IPFSService();
  const blockchainService = new BlockchainService();
  const emergencyService = new EmergencyService();
  const analyticsService = new AnalyticsService();
  const notificationService = new NotificationService();

  // ZK Identity endpoints
  app.post("/api/zk/identity", async (req, res) => {
    try {
      const identity = await zkService.generateIdentity();
      await storage.createZkIdentity({
        commitment: identity.commitment,
        nullifierHash: identity.nullifierHash,
        groupId: identity.groupId || 'speaksecure-v1'
      });
      
      await analyticsService.recordEvent('zk_identity_generated', {
        groupId: identity.groupId
      });

      res.json({ 
        commitment: identity.commitment,
        success: true 
      });
    } catch (error) {
      console.error('ZK Identity generation failed:', error);
      res.status(500).json({ error: 'Failed to generate ZK identity' });
    }
  });

  app.post("/api/zk/verify", async (req, res) => {
    try {
      const { commitment, nullifierHash, topic } = req.body;
      
      // Verify commitment exists
      const identity = await storage.getZkIdentity(commitment);
      if (!identity) {
        return res.status(400).json({ error: 'Invalid commitment' });
      }

      // Verify nullifier hasn't been used for this action
      const isValid = await storage.verifyNullifierHash(nullifierHash);
      if (!isValid) {
        return res.status(400).json({ error: 'Nullifier already used' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('ZK verification failed:', error);
      res.status(500).json({ error: 'ZK verification failed' });
    }
  });

  app.post("/api/zk/proof", async (req, res) => {
    try {
      const { commitment, action, topic } = req.body;
      
      const identity = await storage.getZkIdentity(commitment);
      if (!identity) {
        return res.status(400).json({ error: 'Invalid commitment' });
      }

      const proof = await zkService.generateProof(identity, action, topic);
      res.json(proof);
    } catch (error) {
      console.error('ZK proof generation failed:', error);
      res.status(500).json({ error: 'Failed to generate ZK proof' });
    }
  });

  // Complaint endpoints
  app.post("/api/complaints", async (req, res) => {
    try {
      const validatedData = insertComplaintSchema.parse(req.body);
      
      // Encrypt complaint content
      const encrypted = await encryptionService.encrypt(
        JSON.stringify({
          text: req.body.complaintText,
          files: req.body.files || [],
          metadata: req.body.metadata || {}
        })
      );

      // Store on IPFS
      const ipfsHash = await ipfsService.store(encrypted.encryptedData);

      // Create complaint
      const complaint = await storage.createComplaint({
        ...validatedData,
        encryptedContent: encrypted.encryptedData,
        encryptionKey: encrypted.key,
        ipfsHash
      });

      // Log to blockchain
      const blockchainHash = await blockchainService.logComplaint(complaint.id, ipfsHash);
      await storage.updateComplaint(complaint.id, { blockchainHash });

      // Handle emergency alerts
      if (validatedData.isEmergency && validatedData.emergencyContact) {
        await emergencyService.sendAlert({
          complaintId: complaint.id,
          contact: validatedData.emergencyContact,
          location: validatedData.location || undefined
        });
      }

      // Record analytics
      await analyticsService.recordEvent('complaint_submitted', {
        category: validatedData.category,
        priority: req.body.priority,
        isEmergency: validatedData.isEmergency,
        isPublic: validatedData.isPublic
      });

      res.json({
        success: true,
        referenceId: complaint.referenceId,
        blockchainHash,
        ipfsHash
      });
    } catch (error) {
      console.error('Complaint submission failed:', error);
      res.status(500).json({ 
        error: error instanceof z.ZodError ? 'Invalid complaint data' : 'Failed to submit complaint' 
      });
    }
  });

  app.get("/api/complaints/:referenceId", async (req, res) => {
    try {
      const { referenceId } = req.params;
      const complaint = await storage.getComplaint(referenceId);
      
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      // Get complaint updates
      const updates = await storage.getComplaintUpdates(complaint.id);

      res.json({
        ...complaint,
        updates,
        // Don't return sensitive encryption data
        encryptedContent: undefined,
        encryptionKey: undefined
      });
    } catch (error) {
      console.error('Failed to fetch complaint:', error);
      res.status(500).json({ error: 'Failed to fetch complaint' });
    }
  });

  app.get("/api/complaints", async (req, res) => {
    try {
      const { 
        limit = 20, 
        offset = 0, 
        category, 
        status, 
        search 
      } = req.query;

      let complaints;
      
      if (search) {
        complaints = await storage.searchComplaints(search as string);
      } else {
        complaints = await storage.getPublicComplaints(
          parseInt(limit as string),
          parseInt(offset as string),
          { category, status }
        );
      }

      // Remove sensitive data
      const sanitizedComplaints = complaints.map(complaint => ({
        ...complaint,
        encryptedContent: undefined,
        encryptionKey: undefined
      }));

      res.json(sanitizedComplaints);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      res.status(500).json({ error: 'Failed to fetch complaints' });
    }
  });

  app.post("/api/complaints/:id/upvote", async (req, res) => {
    try {
      const { id } = req.params;
      const { zkProof, nullifierHash } = req.body;

      // Verify ZK proof for upvoting
      const isValidProof = await zkService.verifyProof(zkProof, 'upvote', id);
      if (!isValidProof) {
        return res.status(400).json({ error: 'Invalid ZK proof' });
      }

      // Check if already upvoted
      const hasUpvoted = await storage.hasUpvoted(id, nullifierHash);
      if (hasUpvoted) {
        return res.status(400).json({ error: 'Already upvoted' });
      }

      // Add upvote
      await storage.addUpvote({
        complaintId: id,
        nullifierHash,
        zkProof: JSON.stringify(zkProof)
      });

      const upvoteCount = await storage.getUpvoteCount(id);

      await analyticsService.recordEvent('complaint_upvoted', {
        complaintId: id
      });

      res.json({ success: true, upvotes: upvoteCount });
    } catch (error) {
      console.error('Failed to upvote complaint:', error);
      res.status(500).json({ error: 'Failed to upvote complaint' });
    }
  });

  app.post("/api/complaints/:id/update", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, message, updatedBy } = req.body;

      // Add complaint update
      await storage.addComplaintUpdate({
        complaintId: id,
        status,
        message,
        updatedBy: updatedBy || 'system'
      });

      // Update complaint status
      const updatedComplaint = await storage.updateComplaint(id, { status });

      await analyticsService.recordEvent('complaint_updated', {
        complaintId: id,
        newStatus: status
      });

      res.json({ success: true, complaint: updatedComplaint });
    } catch (error) {
      console.error('Failed to update complaint:', error);
      res.status(500).json({ error: 'Failed to update complaint' });
    }
  });

  // Emergency endpoints
  app.post("/api/emergency/alert", async (req, res) => {
    try {
      const validatedData = insertEmergencyAlertSchema.parse(req.body);
      
      // Encrypt emergency content
      const encrypted = await encryptionService.encrypt(
        JSON.stringify(req.body.description || 'Emergency alert')
      );

      const alert = await storage.createEmergencyAlert({
        ...validatedData,
        encryptedContent: encrypted.encryptedData
      });

      // Send emergency notifications
      await emergencyService.sendAlert({
        alertId: alert.id,
        contact: validatedData.emergencyContact,
        location: validatedData.location || undefined
      });

      await analyticsService.recordEvent('emergency_alert_sent', {
        alertId: alert.id,
        hasLocation: !!validatedData.location
      });

      res.json({ success: true, alertId: alert.id });
    } catch (error) {
      console.error('Emergency alert failed:', error);
      res.status(500).json({ error: 'Failed to send emergency alert' });
    }
  });

  app.get("/api/emergency/alerts", async (req, res) => {
    try {
      const alerts = await storage.getActiveEmergencyAlerts();
      
      // Remove sensitive data for public endpoint
      const sanitizedAlerts = alerts.map(alert => ({
        id: alert.id,
        createdAt: alert.createdAt,
        status: alert.status,
        hasLocation: !!alert.location
      }));

      res.json(sanitizedAlerts);
    } catch (error) {
      console.error('Failed to fetch emergency alerts:', error);
      res.status(500).json({ error: 'Failed to fetch emergency alerts' });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics", async (req, res) => {
    try {
      const { eventType, days = 30 } = req.query;
      const analytics = await storage.getAnalytics(
        eventType as string, 
        parseInt(days as string)
      );

      res.json(analytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  app.get("/api/analytics/summary", async (req, res) => {
    try {
      const summary = await analyticsService.getSummary();
      res.json(summary);
    } catch (error) {
      console.error('Failed to fetch analytics summary:', error);
      res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
  });

  // Internationalization endpoint
  app.get("/api/i18n/:language", async (req, res) => {
    try {
      const { language } = req.params;
      
      // In a real implementation, load from database or files
      const translations = {
        en: {
          'hero.title': 'Your Voice, Your Safety',
          'hero.subtitle': 'Completely Anonymous',
          // ... other translations
        },
        hi: {
          'hero.title': 'आपकी आवाज़, आपकी सुरक्षा',
          'hero.subtitle': 'पूर्णतः गुमनाम',
          // ... other translations
        }
        // Add other languages
      };

      res.json(translations[language as keyof typeof translations] || translations.en);
    } catch (error) {
      console.error('Failed to fetch translations:', error);
      res.status(500).json({ error: 'Failed to fetch translations' });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'subscribe_complaint') {
          // Subscribe to complaint updates
          notificationService.subscribe(ws, 'complaint_update', data.complaintId);
        } else if (data.type === 'subscribe_emergency') {
          // Subscribe to emergency alerts
          notificationService.subscribe(ws, 'emergency_alert');
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      notificationService.unsubscribe(ws);
    });
  });

  return httpServer;
}
