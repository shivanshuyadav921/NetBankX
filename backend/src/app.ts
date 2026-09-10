import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { requireAuth, requireRole } from './modules/auth/auth.middleware.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { UserController } from './modules/users/user.controller.js';
import { AccountController } from './modules/accounts/account.controller.js';
import { TransactionController } from './modules/transactions/transaction.controller.js';
import { NetworkController } from './modules/network/network.controller.js';
import { AuditController } from './modules/audit/audit.controller.js';
import { SecurityController } from './modules/security/security.controller.js';

import { initDatabase, checkDatabaseHealth } from './database/index.js';

let dbInitPromise: Promise<void> | null = null;

export function createApp(): express.Application {
  const app = express();

  // Configure reverse proxy trust for Vercel/production real client IP extraction
  app.set('trust proxy', 1);

  // Ensure DB is initialized (Serverless-safe lazy initialization)
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (!dbInitPromise) {
      dbInitPromise = initDatabase();
    }
    try {
      await dbInitPromise;
      next();
    } catch (err) {
      next(err);
    }
  });

  // 1. Security Headers & CORS
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  app.use(cors({
    origin: (origin, callback) => {
      // Allow server-to-server, same-origin, configured origins, wildcard, or Vercel preview domains
      if (!origin || config.corsOrigins.includes('*') || config.corsOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: false
  }));

  // 2. Logging & Parsing
  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 3. Global Rate Limiter
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please slow down.' }
    }
  });
  app.use(limiter);

  // 4. Base Health Endpoints
  const healthHandler = async (req: Request, res: Response) => {
    const dbHealth = await checkDatabaseHealth();
    res.status(200).json({
      status: 'ok',
      service: 'netbankx-backend',
      database: dbHealth.status,
      provider: dbHealth.provider,
      usingFallback: dbHealth.usingFallback,
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);
  app.get('/api/v1/health', healthHandler);
  app.get('/v1/health', healthHandler);
  app.get('/api/health/database', async (req: Request, res: Response) => {
    const dbHealth = await checkDatabaseHealth();
    res.status(200).json({
      success: true,
      data: dbHealth
    });
  });

  const api = express.Router();

  // Auth Routes
  api.post('/auth/login', AuthController.login);
  api.get('/auth/profile', requireAuth, AuthController.getProfile);
  api.post('/auth/logout', requireAuth, AuthController.logout);

  // User & Directory Routes
  api.get('/users/customers', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_STAFF']), UserController.getCustomers);
  api.get('/users/customer-profile', requireAuth, UserController.getCustomerProfile);
  api.get('/users/branches', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_STAFF']), UserController.getBranches);
  api.get('/users/regions', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER']), UserController.getRegions);
  api.get('/users/service-requests', requireAuth, UserController.getServiceRequests);
  api.post('/users/service-requests', requireAuth, UserController.createServiceRequest);

  // Account Routes
  api.get('/accounts/my-accounts', requireAuth, AccountController.getMyAccounts);
  api.get('/accounts/lookup/:accountNumber', requireAuth, AccountController.lookupAccount);
  api.get('/accounts/all', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_STAFF']), AccountController.getAllAccounts);

  // Transaction Routes
  api.post('/transactions/transfer', requireAuth, TransactionController.transfer);
  api.get('/transactions/account/:accountId', requireAuth, TransactionController.getAccountTransactions);
  api.get('/transactions/all', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_STAFF']), TransactionController.getAllTransactions);
  api.get('/transactions/:id', requireAuth, TransactionController.getTransaction);

  // Network Digital Twin & Simulation Routes
  api.get('/network/topology', NetworkController.getTopology);
  api.get('/network/route', NetworkController.calculateRoute);
  api.get('/network/stream', NetworkController.streamEvents);
  api.post('/network/simulate-traffic', NetworkController.simulateTraffic);
  api.post('/network/simulation/:simId/control', NetworkController.controlSimulation);
  api.get('/network/simulation/active', NetworkController.getActiveSessions);
  api.get('/network/simulation/:simId', NetworkController.getSimulation);
  api.get('/network/transaction-journey/:transactionId', NetworkController.getTransactionJourney);
  api.post('/network/node-status', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER']), NetworkController.setNodeStatus);
  api.post('/network/link-status', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER']), NetworkController.setLinkStatus);
  api.post('/network/reset-topology', requireAuth, requireRole(['HQ_ADMIN']), NetworkController.resetTopology);
  api.post('/network/fault-params', requireAuth, requireRole(['HQ_ADMIN']), NetworkController.setFaultParams);
  api.get('/network/metrics', NetworkController.getMetrics);
  api.get('/network/events', NetworkController.getEvents);

  // Audit & Security Overview (HQ Admin & Privileged Roles)
  api.get('/audit/logs', requireAuth, requireRole(['HQ_ADMIN']), AuditController.getLogs);
  api.get('/audit/verify', requireAuth, requireRole(['HQ_ADMIN']), AuditController.verifyIntegrity);
  
  // Security Operations Center (SOC) & Telemetry Routes
  api.get('/security/overview', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER']), SecurityController.getOverview);
  api.get('/security/events', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER']), SecurityController.getEvents);
  api.get('/security/incidents', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER']), SecurityController.getIncidents);
  api.patch('/security/incidents/:id/status', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER']), SecurityController.updateIncidentStatus);
  api.post('/security/incidents/:id/action', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER']), SecurityController.handleIncidentAction);
  api.get('/security/sessions', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER']), SecurityController.getSessions);
  api.post('/security/sessions/:id/revoke', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER']), SecurityController.revokeSession);
  api.get('/security/devices', requireAuth, SecurityController.getDevices);
  api.post('/security/mfa/setup', requireAuth, SecurityController.setupMfa);
  api.post('/security/mfa/verify', requireAuth, SecurityController.verifyMfa);
  api.post('/security/lab/simulate', requireAuth, requireRole(['HQ_ADMIN']), SecurityController.runCyberLabScenario);
  api.get('/security/forensics', requireAuth, requireRole(['HQ_ADMIN', 'REGIONAL_MANAGER']), SecurityController.searchForensics);

  // Educational Honeypot / Decoy Deception Endpoints
  api.use('/security/decoy', SecurityController.handleDecoyAccess);
  api.all('/internal/diagnostics', SecurityController.handleDecoyAccess);
  api.all('/internal/vault-keys', SecurityController.handleDecoyAccess);
  api.all('/internal/shadow-admin', SecurityController.handleDecoyAccess);

  // Mount API prefix for /api/v1, /v1, and /api to ensure total routing reliability across serverless rewrites
  app.use(config.apiPrefix, api);
  app.use('/v1', api);
  app.use('/api', api);

  // 5. 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found on this server.`
      }
    });
  });

  // 6. Structured Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Server Error:', err);
    const status = Number.isInteger(err.status) ? err.status : 500;
    res.status(status).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: status >= 500 ? 'An unexpected internal server error occurred.' : (err.message || 'Request failed.')
      }
    });
  });

  return app;
}
