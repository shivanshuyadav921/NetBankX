import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { TransactionService } from './transaction.service.js';
import { AccountService } from '../accounts/account.service.js';

const TransferSchema = z.object({
  sourceAccountId: z.string().min(1, 'Source account is required'),
  destinationAccountNumber: z.string().min(1, 'Destination account number is required'),
  amount: z.number().finite().positive('Amount must be positive').refine(
    value => Number.isSafeInteger(Math.round(value * 100)) && Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
    'Amount must have at most two decimal places'
  ),
  description: z.string().max(255).optional(),
  idempotencyKey: z.string().min(1).max(128).optional(),
  speedMultiplier: z.number().min(0.1).max(5).optional()
});

export class TransactionController {
  static async transfer(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const parse = TransferSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid transfer payload',
          details: parse.error.errors
        }
      });
      return;
    }

    const headerKey = req.header('Idempotency-Key');
    const idempotencyKey = headerKey || parse.data.idempotencyKey;
    if (!idempotencyKey) {
      res.status(400).json({ success: false, error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'An Idempotency-Key header is required for transfers.' } });
      return;
    }
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    try {
      const result = await TransactionService.executeTransfer(
        req.user.userId,
        req.user.roleId,
        ipAddress,
        { ...parse.data, idempotencyKey }
      );

      res.status(200).json({
        success: true,
        data: {
          transaction: result.transaction,
          simulation: result.simResult
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (err: any) {
      const code = err.message || 'TRANSFER_FAILED';
      const status = code === 'UNAUTHORIZED_ACCOUNT_ACCESS' ? 403 :
        ['INSUFFICIENT_FUNDS', 'CANNOT_TRANSFER_TO_SELF', 'INVALID_AMOUNT', 'SOURCE_ACCOUNT_INACTIVE', 'DESTINATION_ACCOUNT_INACTIVE'].includes(code) ? 400 :
        ['SOURCE_ACCOUNT_NOT_FOUND', 'DESTINATION_ACCOUNT_NOT_FOUND'].includes(code) ? 404 : 500;
      res.status(status).json({
        success: false,
        error: {
          code,
          message: err.message
        }
      });
    }
  }

  static async getTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const txnId = req.params.id;
    const txn = await TransactionService.getTransactionById(txnId);
    if (!txn) {
      res.status(404).json({ success: false, error: { code: 'TRANSACTION_NOT_FOUND', message: 'Transaction not found' } });
      return;
    }

    if (req.user?.roleId === 'CUSTOMER') {
      const canRead = await AccountService.isAccountOwnedByUser(txn.sourceAccountId, req.user.userId) ||
        await AccountService.isAccountOwnedByUser(txn.destinationAccountId, req.user.userId);
      if (!canRead) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You cannot access this transaction.' } });
        return;
      }
    }

    const events = await TransactionService.getTransactionEvents(txnId);

    res.status(200).json({
      success: true,
      data: {
        ...txn,
        events
      }
    });
  }

  static async getAccountTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const accountId = req.params.accountId;
    if (req.user?.roleId === 'CUSTOMER' && !await AccountService.isAccountOwnedByUser(accountId, req.user.userId)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You cannot access this account history.' } });
      return;
    }
    const txns = await TransactionService.getTransactionsForAccount(accountId);
    res.status(200).json({
      success: true,
      data: txns
    });
  }

  static async getAllTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string || '50', 10);
    const txns = await TransactionService.getAllTransactions(limit);
    res.status(200).json({
      success: true,
      data: txns
    });
  }
}
