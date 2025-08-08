import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { zkIdentityService } from '../services/zk-identity';
import { encryptionService } from '../services/encryption';
import { ipfsService } from '../services/ipfs';
import { blockchainService } from '../services/blockchain';
import { insertComplaintSchema } from '@shared/schema';

const router = Router();

// Submit a new complaint
router.post('/', async (req, res) => {
  try {
    console.log('📝 Processing complaint submission...');
    
    // Validate request body
    const validationResult = insertComplaintSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid complaint data',
        details: validationResult.error.errors
      });
    }

    const complaintData = validationResult.data;

    // Verify ZK identity
    const identityValid = await zkIdentityService.verifyIdentity(complaintData.zkCommitment);
    if (!identityValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid zero-knowledge identity'
      });
    }

    // Generate reference ID
    const referenceId = encryptionService.generateReferenceId();

    // Create complaint in database
    const complaint = await storage.createComplaint({
      ...complaintData,
      referenceId
    });

    console.log(`✅ Complaint created: ${complaint.id}`);

    // Background processing for IPFS and blockchain
    setImmediate(async () => {
      try {
        // Store encrypted content in IPFS
        const ipfsResult = await ipfsService.uploadJSON({
          referenceId: complaint.referenceId,
          category: complaint.category,
          encryptedContent: complaint.encryptedContent,
          priority: complaint.priority,
          isEmergency: complaint.isEmergency,
          tags: complaint.tags,
          metadata: {
            timestamp: complaint.createdAt,
            zkCommitment: complaint.zkCommitment
          }
        });

        await storage.updateComplaintIPFS(complaint.id, ipfsResult.hash);
        console.log(`📁 Complaint stored in IPFS: ${ipfsResult.hash}`);

        // Log hash to blockchain
        const complaintHash = encryptionService.generateHash(complaint.encryptedContent);
        const blockchainResult = await blockchainService.logComplaintHash(
          complaintHash,
          complaint.zkCommitment
        );

        await storage.updateComplaintBlockchain(complaint.id, blockchainResult.transactionHash);
        console.log(`⛓️ Complaint logged to blockchain: ${blockchainResult.transactionHash}`);

        // Update status to processed
        await storage.updateComplaintStatus(complaint.id, 'under_review');
      } catch (error) {
        console.error('Background processing failed:', error);
        await storage.updateComplaintStatus(complaint.id, 'processing_error');
      }
    });

    res.json({
      success: true,
      referenceId: complaint.referenceId,
      status: complaint.status,
      message: 'Complaint submitted successfully and is being processed'
    });

  } catch (error) {
    console.error('Complaint submission failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit complaint',
      message: 'Internal server error occurred'
    });
  }
});

// Get complaint status by reference ID
router.get('/status/:referenceId', async (req, res) => {
  try {
    const { referenceId } = req.params;

    if (!referenceId || referenceId.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reference ID'
      });
    }

    const complaint = await storage.getComplaintByReferenceId(referenceId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    // Return status information (without encrypted content)
    res.json({
      success: true,
      complaint: {
        referenceId: complaint.referenceId,
        category: complaint.category,
        status: complaint.status,
        priority: complaint.priority,
        isEmergency: complaint.isEmergency,
        isPublic: complaint.isPublic,
        upvotes: complaint.upvotes,
        tags: complaint.tags,
        ipfsHash: complaint.ipfsHash,
        blockchainHash: complaint.blockchainHash,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt
      }
    });

  } catch (error) {
    console.error('Failed to get complaint status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve complaint status'
    });
  }
});

// Get public complaints
router.get('/public', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string;
    const status = req.query.status as string;

    // Get public complaints
    let complaints = await storage.getPublicComplaints(limit, offset);

    // Apply filters
    if (category && category !== 'all') {
      complaints = complaints.filter(c => c.category === category);
    }

    if (status && status !== 'all') {
      complaints = complaints.filter(c => c.status === status);
    }

    // Return sanitized data (no encrypted content)
    const publicComplaints = complaints.map(complaint => ({
      referenceId: complaint.referenceId,
      category: complaint.category,
      status: complaint.status,
      priority: complaint.priority,
      upvotes: complaint.upvotes,
      tags: complaint.tags,
      isEmergency: complaint.isEmergency,
      createdAt: complaint.createdAt,
      // Note: encrypted content is not returned for privacy
    }));

    res.json({
      success: true,
      complaints: publicComplaints,
      pagination: {
        limit,
        offset,
        hasMore: complaints.length === limit
      }
    });

  } catch (error) {
    console.error('Failed to get public complaints:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve public complaints'
    });
  }
});

// Update complaint status (admin only - would need auth in production)
router.patch('/:referenceId/status', async (req, res) => {
  try {
    const { referenceId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'under_review', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    const complaint = await storage.getComplaintByReferenceId(referenceId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    await storage.updateComplaintStatus(complaint.id, status);

    res.json({
      success: true,
      message: 'Complaint status updated',
      status
    });

  } catch (error) {
    console.error('Failed to update complaint status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update complaint status'
    });
  }
});

// Get complaint statistics
router.get('/stats', async (req, res) => {
  try {
    // In a real implementation, you'd have proper aggregation queries
    // For now, we'll return mock stats structure
    res.json({
      success: true,
      stats: {
        total: 0,
        byCategory: {},
        byStatus: {},
        recentActivity: [],
        emergencyCount: 0
      }
    });
  } catch (error) {
    console.error('Failed to get complaint stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
});

export default router;
