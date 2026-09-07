import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { AuditService } from './audit.service.js';

export class AuditController {
  static async getLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string || '50', 10);
    const logs = await AuditService.getLogs(limit);
    res.status(200).json({
      success: true,
      data: logs
    });
  }

  static async verifyIntegrity(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await AuditService.verifyIntegrity();
    res.status(result.valid ? 200 : 400).json({
      success: result.valid,
      data: result
    });
  }

  static async getSecurityOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
    const logs = await AuditService.getLogs(100);
    const integrity = await AuditService.verifyIntegrity();

    const failedLogins = logs.filter(l => l.action.startsWith('AUTH_LOGIN_') && l.status === 'DENIED').length;
    const mfaEvents = logs.filter(l => l.action.includes('MFA') || l.action.includes('AUTH_LOGIN_SUCCESS')).length;
    const blockedRequests = logs.filter(l => l.status === 'DENIED' || l.action.includes('BLOCKED') || l.action.includes('LOCKED')).length;
    const highRiskAlerts = logs.filter(l => l.details && (l.details.riskLevel === 'HIGH' || l.details.riskScore > 65)).length;

    res.status(200).json({
      success: true,
      data: {
        totalAuditLogs: logs.length,
        failedLogins,
        mfaEvents,
        blockedRequests,
        highRiskAlerts,
        integrityStatus: integrity.status,
        integrityValid: integrity.valid,
        latestHash: integrity.latestHash,
        recentEvents: logs.slice(0, 15)
      }
    });
  }
}
