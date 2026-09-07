import { Request, Response } from 'express';
import { z } from 'zod';
import { NetworkService } from './network.service.js';
import { PacketSimulator } from './packet.simulator.js';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';

const RouteQuerySchema = z.object({
  sourceId: z.string().min(1),
  destId: z.string().min(1)
});

const NodeStatusSchema = z.object({
  nodeId: z.string().min(1),
  status: z.enum(['HEALTHY', 'DEGRADED', 'OFFLINE'])
});

const LinkStatusSchema = z.object({
  linkId: z.string().min(1),
  status: z.enum(['ACTIVE', 'CONGESTED', 'SEVERED']),
  packetLossRate: z.number().min(0).max(1).optional(),
  baseLatencyMs: z.number().min(1).max(5000).optional()
});

const FaultParamsSchema = z.object({
  globalLatencyMultiplier: z.number().min(0.1).max(10).optional(),
  globalLossRateOverride: z.number().min(0).max(1).optional(),
  ddosSimulationActive: z.boolean().optional(),
  firewallActive: z.boolean().optional()
});

export class NetworkController {
  static async getTopology(req: Request, res: Response): Promise<void> {
    const topology = await NetworkService.getTopology();
    res.status(200).json({
      success: true,
      data: topology
    });
  }

  static async calculateRoute(req: Request, res: Response): Promise<void> {
    const parse = RouteQuerySchema.safeParse(req.query);
    if (!parse.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'sourceId and destId required' } });
      return;
    }

    try {
      const route = await NetworkService.calculateRoute(parse.data.sourceId, parse.data.destId);
      res.status(200).json({
        success: true,
        data: route
      });
    } catch (err: any) {
      res.status(404).json({
        success: false,
        error: { code: 'ROUTE_ERROR', message: err.message }
      });
    }
  }

  static async setNodeStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parse = NodeStatusSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid node status payload' } });
      return;
    }

    await NetworkService.setNodeStatus(parse.data.nodeId, parse.data.status, req.user?.userId);
    res.status(200).json({
      success: true,
      data: { message: `Node ${parse.data.nodeId} status set to ${parse.data.status}` }
    });
  }

  static async setLinkStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parse = LinkStatusSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid link status payload' } });
      return;
    }

    await NetworkService.setLinkStatus(
      parse.data.linkId,
      parse.data.status,
      parse.data.packetLossRate,
      parse.data.baseLatencyMs,
      req.user?.userId
    );

    res.status(200).json({
      success: true,
      data: { message: `Link ${parse.data.linkId} status updated to ${parse.data.status}` }
    });
  }

  static async resetTopology(req: AuthenticatedRequest, res: Response): Promise<void> {
    await NetworkService.resetTopology(req.user?.userId);
    res.status(200).json({
      success: true,
      data: { message: 'Network topology successfully reset to healthy baseline' }
    });
  }

  static async setFaultParams(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parse = FaultParamsSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid fault params payload' } });
      return;
    }

    PacketSimulator.setFaultParams(parse.data);
    res.status(200).json({
      success: true,
      data: { message: 'Fault injection parameters updated', params: PacketSimulator.getFaultParams() }
    });
  }

  static async simulateTraffic(req: Request, res: Response): Promise<void> {
    try {
      const config = req.body;
      const session = await NetworkService.startTrafficSimulation(config);
      res.status(200).json({
        success: true,
        data: session
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'SIMULATION_ERROR', message: err.message }
      });
    }
  }

  static async controlSimulation(req: Request, res: Response): Promise<void> {
    const { simId } = req.params;
    const { action } = req.body; // 'PAUSE' | 'RESUME' | 'ABORT'

    if (!['PAUSE', 'RESUME', 'ABORT'].includes(action)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ACTION', message: 'Action must be PAUSE, RESUME, or ABORT' } });
      return;
    }

    const success = NetworkService.controlSimulation(simId, action);
    if (!success) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Simulation session not found' } });
      return;
    }

    res.status(200).json({
      success: true,
      data: { message: `Simulation ${simId} action ${action} executed.` }
    });
  }

  static async getSimulation(req: Request, res: Response): Promise<void> {
    const { simId } = req.params;
    const session = NetworkService.getSimulationSession(simId);
    if (!session) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Simulation session not found' } });
      return;
    }
    res.status(200).json({
      success: true,
      data: session
    });
  }

  static async getActiveSessions(req: Request, res: Response): Promise<void> {
    const sessions = PacketSimulator.getActiveSessions();
    res.status(200).json({
      success: true,
      data: sessions
    });
  }

  static async getTransactionJourney(req: Request, res: Response): Promise<void> {
    const { transactionId } = req.params;
    try {
      const journey = await NetworkService.getTransactionJourney(transactionId);
      res.status(200).json({
        success: true,
        data: journey
      });
    } catch (err: any) {
      res.status(404).json({
        success: false,
        error: { code: 'JOURNEY_ERROR', message: err.message }
      });
    }
  }

  static async getMetrics(req: Request, res: Response): Promise<void> {
    const metrics = NetworkService.getMetrics();
    res.status(200).json({
      success: true,
      data: metrics
    });
  }

  static async getEvents(req: Request, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string || '50', 10);
    const txnId = req.query.transactionId as string | undefined;
    const events = await NetworkService.getEvents(limit, txnId);
    res.status(200).json({
      success: true,
      data: events
    });
  }

  static async streamEvents(req: Request, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Send initial connected event
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    const { SocketManager } = await import('../../websocket/socket.manager.js');
    SocketManager.addSseClient(res);

    // Keepalive ping every 15s
    const pingInterval = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${Date.now()}\n\n`);
      } catch (err) {
        clearInterval(pingInterval);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(pingInterval);
      SocketManager.removeSseClient(res);
    });
  }
}

