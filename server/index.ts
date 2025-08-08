import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// CORS headers for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const responsePreview = JSON.stringify(capturedJsonResponse).substring(0, 100);
        logLine += ` :: ${responsePreview}${responsePreview.length >= 100 ? '...' : ''}`;
      }

      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize database and services
(async () => {
  try {
    // Import and initialize database
    const { db } = await import("./db");
    console.log('✅ Database connection established');

    // Register API routes
    const server = await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('❌ Server error:', err);

      res.status(status).json({ 
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler for API routes
    app.use('/api/*', (_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        timestamp: new Date().toISOString()
      });
    });

    // Setup Vite in development or serve static files in production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`🚀 SpeakSecure server running on port ${port}`);
      log(`📡 API endpoints available at http://localhost:${port}/api`);
      log(`🔌 WebSocket server available at ws://localhost:${port}/ws`);
      log(`🔐 Zero-Knowledge Identity service: ACTIVE`);
      log(`🔒 Encryption service: ACTIVE`);
      log(`📁 IPFS storage service: ${process.env.IPFS_API_URL ? 'CONNECTED' : 'FALLBACK'}`);
      log(`⛓️  Blockchain service: ${process.env.BLOCKCHAIN_RPC_URL ? 'CONNECTED' : 'FALLBACK'}`);
      log(`🚨 Emergency service: ACTIVE`);
      log(`🌐 Multi-language support: ACTIVE`);
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
})();
