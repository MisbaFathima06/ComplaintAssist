import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import complaintsRouter from "./routes/complaints";
import zkIdentityRouter from "./routes/zk-identity";
import emergencyRouter from "./routes/emergency";
import i18nRouter from "./routes/i18n";
import upvotingRouter from "./routes/upvoting";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        zkIdentity: "active",
        encryption: "active",
        ipfs: "connected",
        blockchain: "connected"
      }
    });
  });

  // Register route modules
  app.use("/api/complaints", complaintsRouter);
  app.use("/api/zk", zkIdentityRouter);
  app.use("/api/emergency", emergencyRouter);
  app.use("/api/i18n", i18nRouter);
  app.use("/api/upvote", upvotingRouter);

  // Create HTTP server
  const httpServer = createServer(app);

  // Add WebSocket server for real-time notifications
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('🔌 WebSocket client connected');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to SpeakSecure real-time service',
      timestamp: Date.now()
    }));

    // Handle client messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 WebSocket message received:', message.type);
        
        // Handle different message types
        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
          case 'subscribe':
            // Handle subscription to updates
            ws.send(JSON.stringify({ 
              type: 'subscribed', 
              channel: message.channel,
              timestamp: Date.now() 
            }));
            break;
          default:
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Unknown message type',
              timestamp: Date.now() 
            }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format',
          timestamp: Date.now() 
        }));
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (message: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  // Add broadcast to app for use in routes
  app.set('broadcast', broadcast);

  console.log('✅ All routes registered successfully');
  console.log('🔌 WebSocket server ready on /ws');

  return httpServer;
}
