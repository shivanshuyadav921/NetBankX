import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { executeQuery } from '../../database/index.js';
import { AuthTokenPayload, User, UserRole } from '../../types/index.js';
import { AuditService } from '../audit/audit.service.js';

export class AuthService {
  static async login(
    identifier: string,
    plainTextPass: string,
    ipAddress: string,
    expectedRole?: string
  ): Promise<{ token: string; user: User; role: UserRole }> {
    // Search user by username, email, or id
    const sql = `SELECT * FROM users WHERE username = ? OR email = ? OR id = ? LIMIT 1`;
    const rows = await executeQuery<any>(sql, [identifier, identifier, identifier]);

    if (!rows || rows.length === 0) {
      import('../security/security.service.js').then(({ SecurityService }) => {
        SecurityService.recordEvent({
          severity: 'MEDIUM',
          category: 'AUTHENTICATION',
          eventType: 'LOGIN_FAILURE',
          actor: identifier,
          source: 'Auth Gateway',
          action: 'USER_LOGIN',
          resource: 'USER_DIRECTORY',
          status: 'DENIED',
          ipAddress,
          metadata: { reason: 'USER_NOT_FOUND' }
        }).catch(() => {});
      }).catch(() => {});

      await AuditService.log({
        actorId: identifier,
        action: 'AUTH_LOGIN_FAILED',
        resourceType: 'USER',
        ipAddress,
        status: 'DENIED',
        details: { reason: 'USER_NOT_FOUND', identifier }
      });
      throw new Error('INVALID_CREDENTIALS');
    }

    const dbUser = rows[0];

    // Check status
    if (dbUser.status !== 'ACTIVE') {
      await AuditService.log({
        actorId: dbUser.id,
        actorRole: dbUser.role_id,
        action: 'AUTH_LOGIN_BLOCKED',
        resourceType: 'USER',
        resourceId: dbUser.id,
        ipAddress,
        status: 'DENIED',
        details: { reason: 'ACCOUNT_INACTIVE' }
      });
      throw new Error('ACCOUNT_INACTIVE');
    }

    // Role check if supplied
    if (expectedRole && dbUser.role_id !== expectedRole) {
      await AuditService.log({
        actorId: dbUser.id,
        actorRole: dbUser.role_id,
        action: 'AUTH_LOGIN_ROLE_MISMATCH',
        resourceType: 'USER',
        resourceId: dbUser.id,
        ipAddress,
        status: 'DENIED',
        details: { expectedRole, actualRole: dbUser.role_id }
      });
      throw new Error('ROLE_UNAUTHORIZED');
    }

    // Passwords are accepted only when their stored bcrypt hash verifies.
    const isMatch = Boolean(dbUser.password_hash) && await bcrypt.compare(plainTextPass, dbUser.password_hash);

    if (!isMatch) {
      import('../security/security.service.js').then(({ SecurityService }) => {
        SecurityService.recordEvent({
          severity: 'MEDIUM',
          category: 'AUTHENTICATION',
          eventType: 'LOGIN_FAILURE',
          actor: dbUser.username,
          actorRole: dbUser.role_id,
          source: 'Auth Gateway',
          action: 'USER_LOGIN',
          resource: dbUser.id,
          status: 'DENIED',
          ipAddress,
          metadata: { reason: 'PASSWORD_MISMATCH' }
        }).catch(() => {});
      }).catch(() => {});

      await AuditService.log({
        actorId: dbUser.id,
        actorRole: dbUser.role_id,
        action: 'AUTH_LOGIN_BAD_PASSWORD',
        resourceType: 'USER',
        resourceId: dbUser.id,
        ipAddress,
        status: 'DENIED',
        details: { reason: 'PASSWORD_MISMATCH' }
      });
      throw new Error('INVALID_CREDENTIALS');
    }

    const payload: AuthTokenPayload = {
      userId: dbUser.id,
      roleId: dbUser.role_id,
      username: dbUser.username,
      email: dbUser.email
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    } as jwt.SignOptions);

    const user: User = {
      id: dbUser.id,
      roleId: dbUser.role_id,
      username: dbUser.username,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      status: dbUser.status,
      createdAt: dbUser.created_at
    };

    // Register session and record successful login telemetry
    import('../security/security.service.js').then(({ SecurityService }) => {
      SecurityService.recordEvent({
        severity: 'INFO',
        category: 'AUTHENTICATION',
        eventType: 'LOGIN_SUCCESS',
        actor: user.username,
        actorRole: user.roleId,
        source: 'Auth Gateway',
        action: 'USER_LOGIN',
        resource: user.id,
        status: 'SUCCESS',
        ipAddress
      }).catch(() => {});
      SecurityService.registerSession(user, ipAddress, 'Browser Client');
    }).catch(() => {});

    await AuditService.log({
      actorId: user.id,
      actorRole: user.roleId,
      action: 'AUTH_LOGIN_SUCCESS',
      resourceType: 'USER',
      resourceId: user.id,
      ipAddress,
      status: 'SUCCESS',
      details: { role: user.roleId }
    });

    return { token, user, role: user.roleId };
  }

  static verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
    } catch (err) {
      throw new Error('INVALID_OR_EXPIRED_TOKEN');
    }
  }
}
