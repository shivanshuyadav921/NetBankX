import { AuthService } from '../modules/auth/auth.service.js';
import { seedMemoryStore } from '../database/index.js';

describe('AuthService & Cryptographic Verification Suite', () => {
  beforeAll(async () => {
    await seedMemoryStore();
  });

  it('should authenticate user with valid credentials and return JWT with correct role', async () => {
    const result = await AuthService.login('arjun.mehta', 'Password@123', '127.0.0.1');

    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.user.username).toBe('arjun.mehta');
    expect(result.role).toBe('HQ_ADMIN');

    // Verify token
    const decoded = AuthService.verifyToken(result.token);
    expect(decoded.userId).toBe(result.user.id);
    expect(decoded.roleId).toBe('HQ_ADMIN');
  });

  it('should reject login with wrong password', async () => {
    await expect(
      AuthService.login('arjun.mehta', 'WrongPassword123!', '127.0.0.1')
    ).rejects.toThrow('INVALID_CREDENTIALS');
  });

  it('should reject login when user role does not match expected role', async () => {
    await expect(
      AuthService.login('aisha.kapoor', 'Password@123', '127.0.0.1', 'HQ_ADMIN')
    ).rejects.toThrow('ROLE_UNAUTHORIZED');
  });
});
