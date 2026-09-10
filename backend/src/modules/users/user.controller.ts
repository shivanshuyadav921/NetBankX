import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { UserService } from './user.service.js';
import { AuditService } from '../audit/audit.service.js';

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

  static async getServiceRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const requests = await UserService.getServiceRequests(req.user.userId);
    res.status(200).json({
      success: true,
      data: requests
    });
  }

  static async createServiceRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const { category, title, description, priority } = req.body;
    if (!category || !description) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Category and description are required.' }
      });
      return;
    }

    const readableTitle = title || `${category.replace(/_/g, ' ')} Request`;
    const serviceReq = await UserService.createServiceRequest(
      req.user.userId,
      category,
      readableTitle,
      description,
      priority || 'MEDIUM'
    );

    await AuditService.log({
      actorId: req.user.userId,
      actorRole: req.user.roleId,
      action: 'CREATE_SERVICE_REQUEST',
      resourceType: 'SERVICE_REQUEST',
      resourceId: serviceReq.id,
      ipAddress: req.ip || '127.0.0.1',
      status: 'SUCCESS',
      details: { category, title: readableTitle, ticketId: serviceReq.id }
    });

    res.status(201).json({
      success: true,
      data: serviceReq
    });
  }
}

