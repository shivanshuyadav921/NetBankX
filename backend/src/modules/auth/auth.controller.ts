import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { AuthenticatedRequest } from './auth.middleware.js';
import { AuditService } from '../audit/audit.service.js';

const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  expectedRole: z.enum(['HQ_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_STAFF', 'CUSTOMER']).optional()
});

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.errors
        }
      });
      return;
    }

    const { username, password, expectedRole } = parseResult.data;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    try {
      const result = await AuthService.login(username, password, ipAddress, expectedRole);
      res.status(200).json({
        success: true,
        data: {
          token: result.token,
          user: result.user,
          role: result.role
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (err: any) {
      const code = err.message || 'AUTH_FAILED';
      const status = code === 'ROLE_UNAUTHORIZED' ? 403 : 401;
      res.status(status).json({
        success: false,
        error: {
          code,
          message: code === 'ROLE_UNAUTHORIZED'
            ? 'Account does not possess privileges for the requested portal role.'
            : 'Invalid credentials or inactive account.'
        }
      });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  }

  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    if (req.user) {
      await AuditService.log({
        actorId: req.user.userId,
        actorRole: req.user.roleId,
        action: 'AUTH_LOGOUT',
        resourceType: 'USER',
        resourceId: req.user.userId,
        ipAddress,
        status: 'SUCCESS'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    });
  }
}
