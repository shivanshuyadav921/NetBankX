import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { UserService } from './user.service.js';

export class UserController {
  static async getCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const customers = await UserService.getAllCustomers();
    res.status(200).json({
      success: true,
      data: customers
    });
  }

  static async getCustomerProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const customer = await UserService.getCustomerByUserId(req.user.userId);
    if (!customer) {
      res.status(404).json({ success: false, error: { code: 'CUSTOMER_NOT_FOUND', message: 'Customer profile not found' } });
      return;
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  }

  static async getBranches(req: AuthenticatedRequest, res: Response): Promise<void> {
    const branches = await UserService.getAllBranches();
    res.status(200).json({
      success: true,
      data: branches
    });
  }

  static async getRegions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const regions = await UserService.getAllRegions();
    res.status(200).json({
      success: true,
      data: regions
    });
  }
}
