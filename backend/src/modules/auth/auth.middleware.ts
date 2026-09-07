import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { AuthTokenPayload, UserRole } from '../../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header. Bearer token required.'
      }
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = AuthService.verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication token is invalid or has expired.'
      }
    });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required.'
        }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.roleId)) {
      // Asynchronously trigger privilege escalation security telemetry
      import('../security/security.service.js').then(({ SecurityService }) => {
        SecurityService.recordEvent({
          severity: 'HIGH',
          category: 'AUTHORIZATION',
          eventType: 'PRIVILEGE_ESCALATION_ATTEMPT',
          actor: req.user?.username || 'unknown',
          actorRole: req.user?.roleId || 'UNKNOWN',
          source: 'API RBAC Firewall',
          action: `${req.method} ${req.originalUrl || req.path}`,
          resource: req.originalUrl || req.path,
          status: 'DENIED',
          ipAddress: req.ip,
          metadata: {
            requiredRoles: allowedRoles,
            userRole: req.user?.roleId
          }
        }).catch(err => console.error('Failed to log privilege escalation event:', err));
      }).catch(() => {});

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}].`
        }
      });
      return;
    }

    next();
  };
}
