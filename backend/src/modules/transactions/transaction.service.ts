import { beginTransaction, executeQuery } from '../../database/index.js';
import { Transaction, TransactionState, TransactionEvent } from '../../types/index.js';
import { NetworkService } from '../network/network.service.js';
import { PacketSimulator } from '../network/packet.simulator.js';
import { AuditService } from '../audit/audit.service.js';
import crypto from 'crypto';

export interface TransferRequestDTO {
  sourceAccountId: string;
  destinationAccountNumber: string;
  amount: number;
  description?: string;
  idempotencyKey?: string;
  speedMultiplier?: number;
}

export interface TransactionRiskAssessment {
  riskScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  requiredAction: 'ALLOW' | 'NOTIFY' | 'FLAG_FOR_REVIEW';
  evaluatedAt: string;
}

function toMinorUnits(amount: number, allowZero = false): number {
  const minorUnits = Math.round(amount * 100);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(minorUnits) || Math.abs(amount * 100 - minorUnits) > 1e-8 || minorUnits < 0 || (!allowZero && minorUnits === 0)) {
    throw new Error('INVALID_AMOUNT');
  }
  return minorUnits;
}

function decimalFromMinorUnits(minorUnits: number): string {
  return (minorUnits / 100).toFixed(2);
}

function isDuplicateIdempotencyError(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string };
  return candidate?.code === 'ER_DUP_ENTRY' || /idempotency_key/i.test(candidate?.message || '');
}

export class TransactionService {
  /**
   * Educational Transaction Risk Engine
   * Evaluates velocity, value thresholds, cross-regional routes, and anomalies
   */
  static assessRisk(amount: number, sourceBranchId: string, destBranchId: string, hopCount: number): TransactionRiskAssessment {
    let score = 10;
    const reasons: string[] = [];

    if (amount > 100000) {
      score += 45;
      reasons.push('High monetary value exceeds ₹1,00,000 threshold');
    } else if (amount > 25000) {
      score += 20;
      reasons.push('Moderate transaction value above ₹25,000');
    } else {
      reasons.push('Standard transaction value within expected operational baseline');
    }

    if (sourceBranchId !== destBranchId) {
      score += 15;
      reasons.push(`Inter-branch WAN transmission spanning ${hopCount} network hops`);
    } else {
      reasons.push('Intra-branch local ledger synchronization');
    }

    const riskScore = Math.min(100, Math.max(0, score));
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let requiredAction: 'ALLOW' | 'NOTIFY' | 'FLAG_FOR_REVIEW' = 'ALLOW';

    if (riskScore >= 70) {
      riskLevel = 'HIGH';
      requiredAction = 'FLAG_FOR_REVIEW';
    } else if (riskScore >= 35) {
      riskLevel = 'MEDIUM';
      requiredAction = 'NOTIFY';
    }

    return {
      riskScore,
      riskLevel,
      reasons,
      requiredAction,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Execute an atomic banking transfer coupled with server network digital twin
   */
  static async executeTransfer(
    userId: string,
    userRole: string,
    ipAddress: string,
    dto: TransferRequestDTO
  ): Promise<{ transaction: Transaction; simResult: any; riskAssessment?: TransactionRiskAssessment }> {
    const { sourceAccountId, destinationAccountNumber, amount, description, idempotencyKey, speedMultiplier = 1.0 } = dto;
    const amountMinorUnits = toMinorUnits(amount);
    const amountDecimal = decimalFromMinorUnits(amountMinorUnits);
    const validIdemKey = idempotencyKey || `IDEM-${crypto.randomUUID()}`;

    // A replay can return immediately and never starts a second simulation.
    const priorTransaction = await this.getTransactionByIdempotencyKey(validIdemKey);
    if (priorTransaction) return { transaction: priorTransaction, simResult: { idempotentReplay: true } };

    // Resolve the simulated path before changing financial state. The simulator is
    // educational telemetry only; it cannot later reverse a committed transfer.
    const sourceRows = await executeQuery<any>(
      `SELECT a.*, c.user_id FROM accounts a JOIN customers c ON a.customer_id = c.id WHERE a.id = ? LIMIT 1`,
      [sourceAccountId]
    );
    const destinationRows = await executeQuery<any>(
      `SELECT a.*, c.user_id AS dst_user_id FROM accounts a JOIN customers c ON a.customer_id = c.id WHERE a.account_number = ? LIMIT 1`,
      [destinationAccountNumber]
    );
    const sourceForRoute = sourceRows[0];
    const destinationForRoute = destinationRows[0];
    if (!sourceForRoute) throw new Error('SOURCE_ACCOUNT_NOT_FOUND');
    if (!destinationForRoute) throw new Error('DESTINATION_ACCOUNT_NOT_FOUND');

    const topology = await NetworkService.getTopology();
    const srcBranchNode = topology.nodes.find(n => n.branchId === sourceForRoute.branch_id);
    const dstBranchNode = topology.nodes.find(n => n.branchId === destinationForRoute.branch_id);
    if (!srcBranchNode || !dstBranchNode) throw new Error('NETWORK_ENDPOINT_NOT_FOUND');
    const calculatedRoute = await NetworkService.calculateRoute(srcBranchNode.id, dstBranchNode.id);

    const txnId = `TXN-${crypto.randomUUID()}`;
    const referenceNo = `REF-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const dbTx = await beginTransaction();

    try {
      const existing = await dbTx.query<any>('SELECT * FROM transactions WHERE idempotency_key = ? LIMIT 1 FOR UPDATE', [validIdemKey]);
      if (existing.length) {
        await dbTx.rollback();
        const replay = await this.getTransactionById(existing[0].id);
        return { transaction: replay!, simResult: { idempotentReplay: true } };
      }

      // Lock both accounts and use their values from inside this transaction.
      const srcRows = await dbTx.query<any>(
        `SELECT a.*, c.user_id FROM accounts a JOIN customers c ON a.customer_id = c.id WHERE a.id = ? LIMIT 1 FOR UPDATE`,
        [sourceAccountId]
      );
      const dstRows = await dbTx.query<any>(
        `SELECT a.*, c.user_id AS dst_user_id FROM accounts a JOIN customers c ON a.customer_id = c.id WHERE a.account_number = ? LIMIT 1 FOR UPDATE`,
        [destinationAccountNumber]
      );
      const srcAccount = srcRows[0];
      const dstAccount = dstRows[0];
      if (!srcAccount) throw new Error('SOURCE_ACCOUNT_NOT_FOUND');
      if (!dstAccount) throw new Error('DESTINATION_ACCOUNT_NOT_FOUND');
      if (userRole === 'CUSTOMER' && srcAccount.user_id !== userId) throw new Error('UNAUTHORIZED_ACCOUNT_ACCESS');
      if (srcAccount.status !== 'ACTIVE') throw new Error('SOURCE_ACCOUNT_INACTIVE');
      if (dstAccount.status !== 'ACTIVE') throw new Error('DESTINATION_ACCOUNT_INACTIVE');
      if (srcAccount.id === dstAccount.id) throw new Error('CANNOT_TRANSFER_TO_SELF');

      const sourceBalanceMinorUnits = toMinorUnits(Number(srcAccount.balance), true);
      const destinationBalanceMinorUnits = toMinorUnits(Number(dstAccount.balance), true);
      if (sourceBalanceMinorUnits < amountMinorUnits) throw new Error('INSUFFICIENT_FUNDS');
      await dbTx.query('UPDATE accounts SET balance = ? WHERE id = ?', [decimalFromMinorUnits(sourceBalanceMinorUnits - amountMinorUnits), srcAccount.id]);
      await dbTx.query('UPDATE accounts SET balance = ? WHERE id = ?', [decimalFromMinorUnits(destinationBalanceMinorUnits + amountMinorUnits), dstAccount.id]);

      // Record Transaction
      await dbTx.query(
        `INSERT INTO transactions 
         (id, reference_no, idempotency_key, source_account_id, destination_account_id, amount, currency, type, state, description, routing_path, total_latency_ms, packets_transmitted, packets_lost, retransmissions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          txnId,
          referenceNo,
          validIdemKey,
          srcAccount.id,
          dstAccount.id,
          amountDecimal,
          'INR',
          'INTER_BANK_TRANSFER',
          'COMPLETED',
          description || 'Online Fund Transfer',
          JSON.stringify(calculatedRoute.nodeKeys),
          calculatedRoute.totalLatencyMs,
          0,
          0,
          0
        ]
      );

      // Record State Event
      await dbTx.query(
        `INSERT INTO transaction_events (transaction_id, previous_state, new_state, message, metadata)
         VALUES (?, ?, ?, ?, ?)`,
        [
          txnId,
          'INITIATED',
          'COMPLETED',
          'Atomic debit and credit committed; educational network telemetry will follow.',
          JSON.stringify({ path: calculatedRoute.nodeKeys, totalCost: calculatedRoute.totalCost })
        ]
      );

      await dbTx.commit();
    } catch (err: any) {
      await dbTx.rollback();
      if (isDuplicateIdempotencyError(err)) {
        const replay = await this.getTransactionByIdempotencyKey(validIdemKey);
        if (replay) return { transaction: replay, simResult: { idempotentReplay: true } };
      }
      throw err;
    }

    const finalTxn = await this.getTransactionById(txnId);
    let simResult: any = { success: false, telemetryUnavailable: true };
    try {
      const nodeMap = await NetworkService.getNodeMap();
      const linkMap = await NetworkService.getLinkMap();
      simResult = await PacketSimulator.simulateTransactionFlow(txnId, calculatedRoute, nodeMap, linkMap, `TXN: ${amountDecimal} INR`, speedMultiplier);
      await executeQuery(`UPDATE transactions SET state = ?, total_latency_ms = ?, packets_transmitted = ?, packets_lost = ?, retransmissions = ? WHERE id = ?`, ['COMPLETED', simResult.totalLatencyMs, simResult.packetsTransmitted, simResult.packetsLost, simResult.retransmissions, txnId]);
    } catch (error) {
      // The ledger is already safely committed; telemetry cannot undo it.
      await AuditService.log({ actorId: userId, actorRole: userRole, action: 'NETWORK_SIMULATION_ERROR', resourceType: 'TRANSACTION', resourceId: txnId, ipAddress, status: 'FAILURE', details: { error: error instanceof Error ? error.message : 'Unknown simulation error' } });
    }

    const riskAssessment = this.assessRisk(amount, sourceForRoute.branch_id, destinationForRoute.branch_id, calculatedRoute.hopCount);

    await AuditService.log({
      actorId: userId,
      actorRole: userRole,
      action: 'FUND_TRANSFER_SUCCESS',
      resourceType: 'TRANSACTION',
      resourceId: txnId,
      ipAddress,
      status: 'SUCCESS',
      details: {
        referenceNo,
        amount: amountDecimal,
        route: calculatedRoute.nodeKeys,
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel
      }
    });

    return { transaction: (await this.getTransactionById(txnId)) || finalTxn!, simResult, riskAssessment };
  }

  private static async getTransactionByIdempotencyKey(idempotencyKey: string): Promise<Transaction | null> {
    const rows = await executeQuery<any>('SELECT * FROM transactions WHERE idempotency_key = ? LIMIT 1', [idempotencyKey]);
    return rows.length ? this.getTransactionById(rows[0].id) : null;
  }

  static async getTransactionById(txnId: string): Promise<Transaction | null> {
    const rows = await executeQuery<any>('SELECT * FROM transactions WHERE id = ? LIMIT 1', [txnId]);
    if (!rows || rows.length === 0) return null;
    const t = rows[0];
    return {
      id: t.id,
      referenceNo: t.reference_no,
      idempotencyKey: t.idempotency_key,
      sourceAccountId: t.source_account_id,
      destinationAccountId: t.destination_account_id,
      amount: String(t.amount),
      currency: t.currency,
      type: t.type,
      state: t.state,
      description: t.description,
      routingPath: typeof t.routing_path === 'string' ? JSON.parse(t.routing_path) : t.routing_path,
      totalLatencyMs: t.total_latency_ms,
      packetsTransmitted: t.packets_transmitted,
      packetsLost: t.packets_lost,
      retransmissions: t.retransmissions,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    };
  }

  static async getTransactionsForAccount(accountId: string): Promise<any[]> {
    const sql = `
      SELECT t.*, 
             sa.account_number as source_acc_number, da.account_number as dest_acc_number,
             su.first_name as src_first_name, su.last_name as src_last_name,
             du.first_name as dst_first_name, du.last_name as dst_last_name
      FROM transactions t
      JOIN accounts sa ON t.source_account_id = sa.id
      JOIN accounts da ON t.destination_account_id = da.id
      JOIN customers sc ON sa.customer_id = sc.id
      JOIN users su ON sc.user_id = su.id
      JOIN customers dc ON da.customer_id = dc.id
      JOIN users du ON dc.user_id = du.id
      WHERE t.source_account_id = ? OR t.destination_account_id = ?
      ORDER BY t.created_at DESC
    `;
    return await executeQuery<any>(sql, [accountId, accountId]);
  }

  static async getAllTransactions(limit: number = 50): Promise<any[]> {
    const sql = `
      SELECT t.*, 
             sa.account_number as source_acc_number, da.account_number as dest_acc_number,
             sb.name as source_branch_name, db.name as dest_branch_name
      FROM transactions t
      JOIN accounts sa ON t.source_account_id = sa.id
      JOIN accounts da ON t.destination_account_id = da.id
      JOIN branches sb ON sa.branch_id = sb.id
      JOIN branches db ON da.branch_id = db.id
      ORDER BY t.created_at DESC
      LIMIT ?
    `;
    return await executeQuery<any>(sql, [limit]);
  }

  static async getTransactionEvents(txnId: string): Promise<TransactionEvent[]> {
    const rows = await executeQuery<any>(
      'SELECT * FROM transaction_events WHERE transaction_id = ? ORDER BY created_at ASC',
      [txnId]
    );
    return rows.map(r => ({
      id: r.id,
      transactionId: r.transaction_id,
      previousState: r.previous_state,
      newState: r.new_state,
      message: r.message,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
      createdAt: r.created_at
    }));
  }
}
