import { executeQuery } from '../../database/index.js';
import { NetworkNode, NetworkLink, CalculatedRoute, NetworkMetrics, SimulationEvent } from './network.types.js';
import { GraphEngine } from './graph.engine.js';
import { PacketSimulator } from './packet.simulator.js';
import { SocketManager } from '../../websocket/socket.manager.js';
import { AuditService } from '../audit/audit.service.js';

export class NetworkService {
  private static cachedNodes: NetworkNode[] = [];
  private static cachedLinks: NetworkLink[] = [];
  private static graphEngine: GraphEngine | null = null;

  public static async initializeTopology(): Promise<void> {
    await this.refreshTopologyCache();
  }

  public static async refreshTopologyCache(): Promise<void> {
    const nodeRows = await executeQuery<any>('SELECT * FROM network_nodes');
    const linkRows = await executeQuery<any>('SELECT * FROM network_links');

    this.cachedNodes = nodeRows.map(r => ({
      id: r.id,
      nodeKey: r.node_key,
      name: r.name,
      nodeType: r.node_type,
      regionId: r.region_id,
      branchId: r.branch_id,
      ipAddress: r.ip_address,
      macAddress: r.mac_address,
      status: r.status,
      posX: parseFloat(r.pos_x),
      posY: parseFloat(r.pos_y)
    }));

    this.cachedLinks = linkRows.map(r => ({
      id: r.id,
      sourceNodeId: r.source_node_id,
      destNodeId: r.dest_node_id,
      bandwidthMbps: r.bandwidth_mbps,
      baseLatencyMs: r.base_latency_ms,
      packetLossRate: parseFloat(r.packet_loss_rate),
      cost: r.cost,
      status: r.status
    }));

    this.graphEngine = new GraphEngine(this.cachedNodes, this.cachedLinks);

    const failedNodes = this.cachedNodes.filter(n => n.status === 'OFFLINE').length;
    const failedLinks = this.cachedLinks.filter(l => l.status === 'SEVERED').length;
    PacketSimulator.updateFailedCounts(failedNodes, failedLinks);

    // Notify active running simulations to recalculate routes dynamically if a path was severed
    const nodeMap = new Map<string, NetworkNode>();
    for (const n of this.cachedNodes) nodeMap.set(n.id, n);
    PacketSimulator.onTopologyChanged((src, dst) => this.calculateRoute(src, dst), nodeMap).catch(err => {
      console.warn('Error during dynamic failover check:', err);
    });

    SocketManager.emitTopologyUpdate({
      nodes: this.cachedNodes,
      links: this.cachedLinks
    });
  }

  public static async getTopology(): Promise<{ nodes: NetworkNode[]; links: NetworkLink[] }> {
    if (this.cachedNodes.length === 0) {
      await this.refreshTopologyCache();
    }
    return {
      nodes: this.cachedNodes,
      links: this.cachedLinks
    };
  }

  public static async getNodeMap(): Promise<Map<string, NetworkNode>> {
    if (this.cachedNodes.length === 0) {
      await this.refreshTopologyCache();
    }
    const map = new Map<string, NetworkNode>();
    for (const node of this.cachedNodes) {
      map.set(node.id, node);
      map.set(node.nodeKey, node);
    }
    return map;
  }

  public static async getLinkMap(): Promise<Map<string, NetworkLink>> {
    if (this.cachedLinks.length === 0) {
      await this.refreshTopologyCache();
    }
    const map = new Map<string, NetworkLink>();
    for (const link of this.cachedLinks) {
      map.set(link.id, link);
      map.set(`${link.sourceNodeId}-${link.destNodeId}`, link);
    }
    return map;
  }

  public static async calculateRoute(sourceId: string, destId: string): Promise<CalculatedRoute> {
    if (!this.graphEngine) {
      await this.refreshTopologyCache();
    }

    // Resolve node key or ID or branch ID
    const srcNode = this.cachedNodes.find(n => n.id === sourceId || n.nodeKey === sourceId || n.branchId === sourceId);
    const dstNode = this.cachedNodes.find(n => n.id === destId || n.nodeKey === destId || n.branchId === destId);

    if (!srcNode || !dstNode) {
      throw new Error(`Invalid source (${sourceId}) or destination (${destId}) node identifier`);
    }

    return this.graphEngine!.findShortestPath(srcNode.id, dstNode.id);
  }

  public static async startTrafficSimulation(config: any): Promise<any> {
    if (this.cachedNodes.length === 0) {
      await this.refreshTopologyCache();
    }

    // Resolve source & dest nodes
    let srcNode = this.cachedNodes.find(n => n.id === config.sourceNodeId || n.nodeKey === config.sourceNodeId);
    let dstNode = this.cachedNodes.find(n => n.id === config.destNodeId || n.nodeKey === config.destNodeId);

    if (!srcNode && config.sourceBranchId) {
      srcNode = this.cachedNodes.find(n => n.branchId === config.sourceBranchId);
    }
    if (!dstNode && config.destBranchId) {
      dstNode = this.cachedNodes.find(n => n.branchId === config.destBranchId);
    }

    if (!srcNode) {
      srcNode = this.cachedNodes.find(n => n.nodeType === 'BRANCH_ROUTER') || this.cachedNodes[0];
    }
    if (!dstNode) {
      dstNode = this.cachedNodes.filter(n => n.nodeType === 'BRANCH_ROUTER' && n.id !== srcNode?.id)[0] || this.cachedNodes[1];
    }

    if (!srcNode || !dstNode) {
      throw new Error('Unable to resolve source and destination endpoints in network topology');
    }

    // Apply scenario overrides if specified
    if (config.scenario === 'HIGH_LATENCY') {
      config.latencyMultiplier = 3.0;
    } else if (config.scenario === 'CONGESTION') {
      config.latencyMultiplier = 4.5;
      config.lossRateOverride = 0.10;
    } else if (config.scenario === 'PACKET_LOSS' || config.scenario === 'DEMO_PACKET_LOSS') {
      config.lossRateOverride = 0.20;
    }

    const route = await this.calculateRoute(srcNode.id, dstNode.id);
    const nodeMap = await this.getNodeMap();
    const linkMap = await this.getLinkMap();

    const session = await PacketSimulator.simulateBranchTraffic(
      {
        ...config,
        sourceNodeId: srcNode.id,
        destNodeId: dstNode.id
      },
      route,
      nodeMap,
      linkMap,
      (s, d) => this.calculateRoute(s, d)
    );

    return session;
  }

  public static controlSimulation(sessionId: string, action: 'PAUSE' | 'RESUME' | 'ABORT'): boolean {
    return PacketSimulator.controlSession(sessionId, action);
  }

  public static getSimulationSession(sessionId: string): any {
    return PacketSimulator.getSession(sessionId);
  }

  public static async getTransactionJourney(transactionId: string): Promise<any> {
    const session = PacketSimulator.getSessionByTransactionId(transactionId);
    const events = await this.getEvents(50, transactionId);

    // Fetch transaction details from database
    const txnRows = await executeQuery<any>(
      `SELECT t.*, sa.account_number as src_acc, da.account_number as dst_acc,
              sb.name as src_branch_name, db.name as dst_branch_name,
              sb.id as src_branch_id, db.id as dst_branch_id
       FROM transactions t
       LEFT JOIN accounts sa ON t.source_account_id = sa.id
       LEFT JOIN accounts da ON t.dest_account_id = da.id
       LEFT JOIN branches sb ON sa.branch_id = sb.id
       LEFT JOIN branches db ON da.branch_id = db.id
       WHERE t.id = ? OR t.reference_no = ?
       LIMIT 1`,
      [transactionId, transactionId]
    );

    const txn = txnRows[0];
    let route = session?.route;

    if (!route && txn && txn.src_branch_id && txn.dst_branch_id) {
      const topology = await this.getTopology();
      const srcNode = topology.nodes.find(n => n.branchId === txn.src_branch_id);
      const dstNode = topology.nodes.find(n => n.branchId === txn.dst_branch_id);
      if (srcNode && dstNode) {
        route = await this.calculateRoute(srcNode.id, dstNode.id);
      }
    }

    return {
      transaction: txn || null,
      session: session || null,
      route: route || null,
      events: events || []
    };
  }

  public static async setNodeStatus(nodeId: string, status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE', actorId?: string): Promise<void> {
    const node = this.cachedNodes.find(n => n.id === nodeId || n.nodeKey === nodeId);
    if (!node) throw new Error('Node not found');

    const sql = `UPDATE network_nodes SET status = ? WHERE id = ?`;
    await executeQuery(sql, [status, node.id]);

    await AuditService.log({
      actorId: actorId || 'SYSTEM',
      action: 'NETWORK_NODE_STATUS_CHANGE',
      resourceType: 'NETWORK_NODE',
      resourceId: node.id,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      details: { nodeKey: node.nodeKey, previousStatus: node.status, newStatus: status }
    });

    await this.refreshTopologyCache();
  }

  public static async setLinkStatus(
    linkId: string,
    status: 'ACTIVE' | 'CONGESTED' | 'SEVERED',
    packetLossRate?: number,
    baseLatencyMs?: number,
    actorId?: string
  ): Promise<void> {
    const link = this.cachedLinks.find(l => l.id === linkId);
    if (!link) throw new Error('Link not found');

    const loss = packetLossRate !== undefined ? packetLossRate.toFixed(4) : link.packetLossRate.toFixed(4);
    const lat = baseLatencyMs !== undefined ? baseLatencyMs : link.baseLatencyMs;

    const sql = `UPDATE network_links SET status = ?, packet_loss_rate = ?, base_latency_ms = ? WHERE id = ?`;
    await executeQuery(sql, [status, loss, lat, link.id]);

    await AuditService.log({
      actorId: actorId || 'SYSTEM',
      action: 'NETWORK_LINK_STATUS_CHANGE',
      resourceType: 'NETWORK_LINK',
      resourceId: link.id,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      details: { linkId, status, packetLossRate: loss, baseLatencyMs: lat }
    });

    await this.refreshTopologyCache();
  }

  public static async resetTopology(actorId?: string): Promise<void> {
    await executeQuery("UPDATE network_nodes SET status = 'HEALTHY'");
    await executeQuery("UPDATE network_links SET status = 'ACTIVE', packet_loss_rate = 0.0010");

    PacketSimulator.setFaultParams({
      disabledNodeIds: [],
      severedLinkIds: [],
      globalLatencyMultiplier: 1.0,
      globalLossRateOverride: 0.0,
      ddosSimulationActive: false
    });

    await AuditService.log({
      actorId: actorId || 'SYSTEM',
      action: 'NETWORK_TOPOLOGY_RESET',
      resourceType: 'NETWORK_TOPOLOGY',
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      details: { message: 'All routers and links restored to healthy state' }
    });

    await this.refreshTopologyCache();
  }

  public static async getEvents(limit: number = 50, transactionId?: string): Promise<SimulationEvent[]> {
    let sql = `SELECT * FROM network_events`;
    const params: any[] = [];

    if (transactionId) {
      sql += ` WHERE transaction_id = ?`;
      params.push(transactionId);
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const rows = await executeQuery<any>(sql, params);
    return rows.map(r => ({
      id: r.id,
      transactionId: r.transaction_id,
      eventType: r.event_type,
      sourceNodeId: r.source_node_id,
      destNodeId: r.dest_node_id,
      hopNumber: r.hop_number,
      description: r.payload_summary,
      latencyMs: r.latency_ms,
      severity: r.severity,
      timestamp: r.created_at
    }));
  }

  public static getMetrics(): NetworkMetrics {
    return PacketSimulator.getMetrics();
  }
}

