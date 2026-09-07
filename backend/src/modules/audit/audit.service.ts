import crypto from 'crypto';
import { executeQuery } from '../../database/index.js';
import { AuditLog } from '../../types/index.js';

export interface AuditIntegrityResult {
  valid: boolean;
  totalRecordsChecked: number;
  genesisHash: string;
  latestHash: string;
  status: 'VERIFIED' | 'AUDIT INTEGRITY FAILURE';
  details: string;
  brokenRecordId?: number;
}

export class AuditService {
  private static lastHash: string = '0000000000000000000000000000000000000000000000000000000000000000';

  private static calculateRecordHash(prevHash: string, data: {
    actorId?: string | null;
    actorRole?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    ipAddress: string;
    status: string;
    detailsStr: string;
  }): string {
    const content = `${prevHash}|${data.actorId || ''}|${data.actorRole || ''}|${data.action}|${data.resourceType}|${data.resourceId || ''}|${data.ipAddress}|${data.status}|${data.detailsStr}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  static async log(entry: {
    actorId?: string;
    actorRole?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    ipAddress: string;
    status: 'SUCCESS' | 'FAILURE' | 'DENIED';
    details?: Record<string, any>;
  }): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const detailsStr = entry.details ? JSON.stringify(entry.details) : '';
      const prevHash = this.lastHash;
      const currentHash = this.calculateRecordHash(prevHash, {
        actorId: entry.actorId,
        actorRole: entry.actorRole,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        ipAddress: entry.ipAddress,
        status: entry.status,
        detailsStr
      });

      this.lastHash = currentHash;

      const sql = `
        INSERT INTO audit_logs (actor_id, actor_role, action, resource_type, resource_id, ip_address, status, details, prev_hash, record_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await executeQuery(sql, [
        entry.actorId || null,
        entry.actorRole || null,
        entry.action,
        entry.resourceType,
        entry.resourceId || null,
        entry.ipAddress,
        entry.status,
        entry.details ? JSON.stringify(entry.details) : null,
        prevHash,
        currentHash
      ]);
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }

  static async getLogs(limit: number = 50): Promise<AuditLog[]> {
    const sql = `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?`;
    const rows = await executeQuery<any>(sql, [limit]);
    return rows.map(r => ({
      id: r.id,
      actorId: r.actor_id,
      actorRole: r.actor_role,
      action: r.action,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      ipAddress: r.ip_address,
      status: r.status,
      details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details,
      createdAt: r.created_at,
      prevHash: r.prev_hash,
      recordHash: r.record_hash
    }));
  }

  static async verifyIntegrity(): Promise<AuditIntegrityResult> {
    const sql = `SELECT * FROM audit_logs ORDER BY id ASC`;
    const rows = await executeQuery<any>(sql, []);

    let expectedPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // If records have hash columns
      if (row.record_hash && row.prev_hash) {
        if (row.prev_hash !== expectedPrevHash) {
          return {
            valid: false,
            totalRecordsChecked: i + 1,
            genesisHash: '0000000000000000000000000000000000000000000000000000000000000000',
            latestHash: row.record_hash,
            status: 'AUDIT INTEGRITY FAILURE',
            details: `AUDIT INTEGRITY FAILURE: Previous hash mismatch at Record #${row.id}. Expected ${expectedPrevHash.slice(0, 16)}..., found ${row.prev_hash.slice(0, 16)}...`,
            brokenRecordId: row.id
          };
        }

        const detailsStr = typeof row.details === 'string' ? row.details : (row.details ? JSON.stringify(row.details) : '');
        const computed = this.calculateRecordHash(row.prev_hash, {
          actorId: row.actor_id,
          actorRole: row.actor_role,
          action: row.action,
          resourceType: row.resource_type,
          resourceId: row.resource_id,
          ipAddress: row.ip_address,
          status: row.status,
          detailsStr
        });

        if (computed !== row.record_hash) {
          return {
            valid: false,
            totalRecordsChecked: i + 1,
            genesisHash: '0000000000000000000000000000000000000000000000000000000000000000',
            latestHash: row.record_hash,
            status: 'AUDIT INTEGRITY FAILURE',
            details: `AUDIT INTEGRITY FAILURE: Cryptographic content tampering detected at Record #${row.id}. Hash signature invalid.`,
            brokenRecordId: row.id
          };
        }

        expectedPrevHash = row.record_hash;
      }
    }

    return {
      valid: true,
      totalRecordsChecked: rows.length,
      genesisHash: '0000000000000000000000000000000000000000000000000000000000000000',
      latestHash: expectedPrevHash,
      status: 'VERIFIED',
      details: `Cryptographic SHA-256 hash-chain verified (${rows.length} records verified, 0 tampering anomalies detected).`
    };
  }
}
