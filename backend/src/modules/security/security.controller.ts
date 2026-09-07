import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { SecurityService } from './security.service.js';
import { TotpService } from './totp.service.js';
import { IncidentStatus, SecuritySeverity } from './security.types.js';

export class SecurityController {
  /**
   * GET /api/v1/security/overview
   * Consolidated SOC dashboard metrics, live threat level, and incident overview
   */
  static async getOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const threatAssessment = SecurityService.getThreatLevel();
      const events = SecurityService.getEvents({ limit: 15 });
      const incidents = SecurityService.getIncidents();
      const activeSessions = SecurityService.getActiveSessions();

      res.status(200).json({
        success: true,
        data: {
          threatAssessment,
          recentEvents: events,
          activeIncidents: incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'FALSE_POSITIVE'),
          allIncidentsCount: incidents.length,
          activeSessionsCount: activeSessions.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SECURITY_ERROR', message: err.message || 'Failed to retrieve SOC overview' }
      });
    }
  }

  /**
   * GET /api/v1/security/events
   * Filtered stream of security telemetry events
   */
  static async getEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { severity, category, actor, correlationId, limit } = req.query;
      const events = SecurityService.getEvents({
        severity: severity as string,
        category: category as string,
        actor: actor as string,
        correlationId: correlationId as string,
        limit: limit ? parseInt(limit as string, 10) : 100
      });

      res.status(200).json({
        success: true,
        data: events
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SECURITY_ERROR', message: err.message || 'Failed to fetch security events' }
      });
    }
  }

  /**
   * GET /api/v1/security/incidents
   */
  static async getIncidents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const incidents = SecurityService.getIncidents(status as string);
      res.status(200).json({
        success: true,
        data: incidents
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SECURITY_ERROR', message: err.message || 'Failed to fetch incidents' }
      });
    }
  }

  /**
   * PATCH /api/v1/security/incidents/:id/status
   */
  static async updateIncidentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, resolution, assignedTo } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Status field is required' }
        });
        return;
      }

      const updated = SecurityService.updateIncidentStatus(
        id,
        status as IncidentStatus,
        resolution,
        assignedTo || req.user?.username
      );

      if (!updated) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Incident ${id} not found` }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SECURITY_ERROR', message: err.message || 'Failed to update incident' }
      });
    }
  }

  /**
   * POST /api/v1/security/incidents/:id/action
   * Execute incident mitigation actions (REVOKE_SESSION, REQUIRE_MFA, HOLD_TRANSACTION, BLOCK_TRANSACTION)
   */
  static async handleIncidentAction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action, targetResource, note } = req.body;

      if (!action) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Action parameter is required' }
        });
        return;
      }

      const incident = SecurityService.getIncidents().find(i => i.incidentId === id);
      if (!incident) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Incident ${id} not found` }
        });
        return;
      }

      // Execute response policy
      if (action === 'REVOKE_SESSION' && targetResource) {
        SecurityService.revokeSession(targetResource, `Incident Action (${id}) by ${req.user?.username}`);
      }

      const resolutionMsg = note || `Action [${action}] applied to resource [${targetResource || 'N/A'}] by ${req.user?.username || 'SOC Lead'}`;
      const updated = SecurityService.updateIncidentStatus(id, 'CONTAINED', resolutionMsg, req.user?.username);

      res.status(200).json({
        success: true,
        data: {
          incident: updated,
          actionExecuted: action,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SECURITY_ERROR', message: err.message || 'Failed to execute incident action' }
      });
    }
  }

  /**
   * GET /api/v1/security/sessions
   */
  static async getSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sessions = SecurityService.getActiveSessions();
      res.status(200).json({
        success: true,
        data: sessions
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SECURITY_ERROR', message: err.message || 'Failed to fetch sessions' }
      });
    }
  }

  /**
   * POST /api/v1/security/sessions/:id/revoke
   */
  static async revokeSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = SecurityService.revokeSession(id, req.user?.username || 'User/Admin');
      if (!success) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Session ${id} not found` }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { sessionId: id, status: 'REVOKED' }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SECURITY_ERROR', message: err.message || 'Failed to revoke session' }
      });
    }
  }

  /**
   * GET /api/v1/security/devices
   */
  static async getDevices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const devices = SecurityService.getUserDevices(req.user?.userId);
      res.status(200).json({
        success: true,
        data: devices
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SECURITY_ERROR', message: err.message || 'Failed to fetch devices' }
      });
    }
  }

  /**
   * ANY /api/v1/security/decoy/*
   * Honeypot / Deception trap interceptor
   */
  static async handleDecoyAccess(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const actor = authReq.user?.username || 'unauthenticated.scanner';
      const actorRole = authReq.user?.roleId || 'ANONYMOUS';

      await SecurityService.triggerDecoyAccess({
        path: req.originalUrl || req.path,
        method: req.method,
        actor,
        actorRole,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('user-agent') || 'UnknownClient/1.0',
        sessionId: req.headers['x-session-id'] as string
      });

      // Return deceptive generic forbidden
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_RESTRICTED',
          message: 'Access to protected system diagnostics is forbidden. Telemetry event logged.'
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'ERROR', message: 'Internal error' }
      });
    }
  }

  /**
   * POST /api/v1/security/mfa/setup
   */
  static async setupMfa(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
        return;
      }

      const secret = TotpService.generateSecret();
      const keyUri = TotpService.generateProvisioningUri(user.username, secret, 'NetBankX-Core');

      // Store secret provisionally
      SecurityService.setupUserMfa(user.userId, secret);

      res.status(200).json({
        success: true,
        data: {
          secret,
          keyUri,
          issuer: 'NetBankX Enterprise',
          account: user.username,
          message: 'Scan the TOTP secret key in Google Authenticator or Microsoft Authenticator'
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'MFA_ERROR', message: err.message || 'Failed to initialize MFA' }
      });
    }
  }

  /**
   * POST /api/v1/security/mfa/verify
   */
  static async verifyMfa(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token, secret } = req.body;
      const user = req.user;

      if (!token || typeof token !== 'string') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: '6-digit TOTP token required' }
        });
        return;
      }

      const effectiveSecret = secret || (user ? SecurityService.getUserMfaSecret(user.userId) : null);
      if (!effectiveSecret) {
        res.status(400).json({
          success: false,
          error: { code: 'MFA_NOT_CONFIGURED', message: 'No MFA secret found for user. Please setup MFA first.' }
        });
        return;
      }

      const isValid = TotpService.verifyToken(effectiveSecret, token);

      if (user) {
        await SecurityService.recordEvent({
          severity: isValid ? 'INFO' : 'MEDIUM',
          category: 'AUTHENTICATION',
          eventType: isValid ? 'MFA_SUCCESS' : 'MFA_FAILURE',
          actor: user.username,
          actorRole: user.roleId,
          source: 'TOTP Gateway',
          action: 'VERIFY_TOTP',
          resource: 'MFA_AUTH',
          status: isValid ? 'SUCCESS' : 'DENIED',
          ipAddress: req.ip
        });
      }

      if (!isValid) {
        res.status(401).json({
          success: false,
          error: { code: 'MFA_FAILED', message: 'Invalid or expired 6-digit TOTP authentication code' }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          verified: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'MFA_ERROR', message: err.message || 'MFA verification failed' }
      });
    }
  }

  /**
   * POST /api/v1/security/lab/simulate
   * Triggers deterministic educational attack -> detection -> response simulation
   */
  static async runCyberLabScenario(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { scenario } = req.body;
      const actor = req.user?.username || 'analyst.demo';
      const ipAddress = req.ip || '198.51.100.77';

      const result = await SecurityService.runCyberLabScenario(scenario || 'brute_force', actor, ipAddress);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SIMULATION_ERROR', message: err.message || 'Simulation execution failed' }
      });
    }
  }

  /**
   * GET /api/v1/security/forensics
   */
  static async searchForensics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { q, correlationId, userId, transactionId } = req.query;
      const result = SecurityService.searchForensics({
        q: q as string,
        correlationId: correlationId as string,
        userId: userId as string,
        transactionId: transactionId as string
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FORENSICS_ERROR', message: err.message || 'Forensics query failed' }
      });
    }
  }
}
