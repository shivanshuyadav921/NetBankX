import { executeQuery } from '../../database/index.js';
import { Account } from '../../types/index.js';

export class AccountService {
  static async getAccountsByUserId(userId: string): Promise<Account[]> {
    const sql = `
      SELECT a.id, a.customer_id, a.branch_id, a.account_number, a.account_type, a.balance, a.currency, a.status, a.created_at
      FROM accounts a
      JOIN customers c ON a.customer_id = c.id
      WHERE c.user_id = ?
    `;
    const rows = await executeQuery<any>(sql, [userId]);
    return rows.map(r => ({
      id: r.id,
      customerId: r.customer_id,
      branchId: r.branch_id,
      accountNumber: r.account_number,
      accountType: r.account_type,
      balance: String(r.balance),
      currency: r.currency,
      status: r.status,
      createdAt: r.created_at
    }));
  }

  static async getAccountByNumber(accountNumber: string): Promise<any | null> {
    const sql = `
      SELECT a.id, a.customer_id, a.branch_id, a.account_number, a.account_type, a.balance, a.currency, a.status,
             c.customer_code, c.phone,
             u.first_name, u.last_name, u.email,
             b.name as branch_name, b.code as branch_code, b.ifsc,
             r.code as region_code, r.name as region_name
      FROM accounts a
      JOIN customers c ON a.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN branches b ON a.branch_id = b.id
      JOIN regions r ON b.region_id = r.id
      WHERE a.account_number = ?
      LIMIT 1
    `;
    const rows = await executeQuery<any>(sql, [accountNumber]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async getAllAccounts(): Promise<any[]> {
    const sql = `
      SELECT a.id, a.customer_id, a.branch_id, a.account_number, a.account_type, a.balance, a.currency, a.status,
             u.first_name, u.last_name, u.email,
             b.name as branch_name, r.code as region_code
      FROM accounts a
      JOIN customers c ON a.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN branches b ON a.branch_id = b.id
      JOIN regions r ON b.region_id = r.id
    `;
    return await executeQuery<any>(sql);
  }

  static async isAccountOwnedByUser(accountId: string, userId: string): Promise<boolean> {
    const rows = await executeQuery<{ id: string }>(
      `SELECT a.id
       FROM accounts a
       JOIN customers c ON a.customer_id = c.id
       WHERE a.id = ? AND c.user_id = ?
       LIMIT 1`,
      [accountId, userId]
    );
    return rows.length > 0;
  }
}
