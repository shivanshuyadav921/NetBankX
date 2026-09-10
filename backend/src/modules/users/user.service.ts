import { executeQuery } from '../../database/index.js';
import { User } from '../../types/index.js';

export class UserService {
  static async getAllCustomers(): Promise<any[]> {
    const sql = `
      SELECT c.id as customer_id, c.customer_code, c.kyc_status, c.phone, c.address, c.dob,
             u.id as user_id, u.username, u.email, u.first_name, u.last_name, u.status,
             b.id as branch_id, b.name as branch_name, b.code as branch_code, b.city as branch_city,
             r.id as region_id, r.name as region_name,
             a.id as account_id, a.account_number, a.account_type, a.balance, a.currency, a.status as account_status
      FROM customers c
      JOIN users u ON c.user_id = u.id
      JOIN branches b ON c.branch_id = b.id
      JOIN regions r ON b.region_id = r.id
      LEFT JOIN accounts a ON a.customer_id = c.id
    `;
    const rows = await executeQuery<any>(sql);
    return rows;
  }

  static async getCustomerByUserId(userId: string): Promise<any> {
    const sql = `
      SELECT c.id as customer_id, c.customer_code, c.kyc_status, c.phone, c.address, c.dob,
             u.id as user_id, u.username, u.email, u.first_name, u.last_name, u.status,
             b.id as branch_id, b.name as branch_name, b.code as branch_code, b.city as branch_city, b.ifsc,
             r.id as region_id, r.name as region_name, r.state as region_state
      FROM customers c
      JOIN users u ON c.user_id = u.id
      JOIN branches b ON c.branch_id = b.id
      JOIN regions r ON b.region_id = r.id
      WHERE u.id = ?
      LIMIT 1
    `;
    const rows = await executeQuery<any>(sql, [userId]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async getAllBranches(): Promise<any[]> {
    const sql = `
      SELECT b.id, b.region_id, b.name, b.code, b.city, b.state, b.ifsc, b.address, b.phone, b.status,
             r.name as region_name,
             u.first_name as manager_first_name, u.last_name as manager_last_name, u.email as manager_email
      FROM branches b
      JOIN regions r ON b.region_id = r.id
      LEFT JOIN users u ON b.manager_user_id = u.id
    `;
    return await executeQuery<any>(sql);
  }

  static async getAllRegions(): Promise<any[]> {
    const sql = `
      SELECT r.id, r.name, r.code, r.city, r.state, r.status,
             u.first_name as head_first_name, u.last_name as head_last_name, u.email as head_email
      FROM regions r
      LEFT JOIN users u ON r.head_user_id = u.id
    `;
    return await executeQuery<any>(sql);
  }

  static async getServiceRequests(userId: string): Promise<any[]> {
    const sql = `
      SELECT id, user_id, category, title, description, status, priority, created_at, updated_at
      FROM service_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    const rows = await executeQuery<any>(sql, [userId]);
    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      category: r.category,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  static async createServiceRequest(
    userId: string,
    category: string,
    title: string,
    description: string,
    priority: string = 'MEDIUM'
  ): Promise<any> {
    const id = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;
    const sql = `
      INSERT INTO service_requests (id, user_id, category, title, description, status, priority, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'IN_REVIEW', ?, NOW(), NOW())
    `;
    await executeQuery(sql, [id, userId, category, title, description, 'IN_REVIEW', priority]);

    return {
      id,
      userId,
      category,
      title,
      description,
      status: 'IN_REVIEW',
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

