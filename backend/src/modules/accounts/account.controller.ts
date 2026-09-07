import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { AccountService } from './account.service.js';

export class AccountController {
  static async getMyAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const accounts = await AccountService.getAccountsByUserId(req.user.userId);
    res.status(200).json({
      success: true,
      data: accounts
    });
  }

  static async lookupAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const accNumber = req.params.accountNumber;
    if (!accNumber) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Account number required' } });
      return;
    }

    const account = await AccountService.getAccountByNumber(accNumber);
    if (!account) {
      res.status(404).json({
        success: false,
        error: { code: 'ACCOUNT_NOT_FOUND', message: 'Target account does not exist in registry.' }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        accountNumber: account.account_number,
        accountType: account.account_type,
        holderName: `${account.first_name} ${account.last_name}`,
        branchName: account.branch_name,
        branchCode: account.branch_code,
        regionCode: account.region_code,
        regionName: account.region_name,
        ifsc: account.ifsc,
        status: account.status
      }
    });
  }

  static async getAllAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const accounts = await AccountService.getAllAccounts();
    res.status(200).json({
      success: true,
      data: accounts
    });
  }
}
