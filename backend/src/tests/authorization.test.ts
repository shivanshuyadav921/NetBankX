import request from 'supertest';
import { createApp } from '../app.js';
import { initDatabase } from '../database/index.js';
import { AuthService } from '../modules/auth/auth.service.js';

describe('Authorization boundary checks', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  it('rejects legacy demo-password bypass attempts', async () => {
    await expect(AuthService.login('aisha.kapoor', 'cust@2024', 'test')).rejects.toThrow('INVALID_CREDENTIALS');
  });

  it('prevents a customer from reading another customer\'s account history and transaction', async () => {
    const app = createApp();
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'ravi.menon', password: 'Password@123' });
    const token = login.body.data.token;

    const accountHistory = await request(app)
      .get('/api/v1/transactions/account/ACC-100001')
      .set('Authorization', `Bearer ${token}`);
    expect(accountHistory.status).toBe(403);

    const transaction = await request(app)
      .get('/api/v1/transactions/TXN-INIT-001')
      .set('Authorization', `Bearer ${token}`);
    expect(transaction.status).toBe(403);
  });
});
