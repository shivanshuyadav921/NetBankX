export type UserRole = 'HQ_ADMIN' | 'REGIONAL_MANAGER' | 'BRANCH_STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  roleId: UserRole;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

export interface Account {
  id: string;
  customerId: string;
  branchId: string;
  accountNumber: string;
  accountType: string;
  balance: string;
  currency: string;
  status: string;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  referenceNo: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: string;
  currency: string;
  type: string;
  state: string;
  description?: string;
  routingPath?: string[];
  totalLatencyMs: number;
  packetsTransmitted: number;
  packetsLost: number;
  retransmissions: number;
  createdAt: string;
  updatedAt: string;
  source_acc_number?: string;
  dest_acc_number?: string;
  src_first_name?: string;
  src_last_name?: string;
  dst_first_name?: string;
  dst_last_name?: string;
  source_branch_name?: string;
  dest_branch_name?: string;
}

export interface NetworkNode {
  id: string;
  nodeKey: string;
  name: string;
  nodeType: 'HQ_CORE' | 'REGIONAL_HUB' | 'BRANCH_ROUTER' | 'CUSTOMER_EDGE';
  regionId?: string | null;
  branchId?: string | null;
  ipAddress: string;
  macAddress: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  posX: number;
  posY: number;
}

export interface NetworkLink {
  id: string;
  sourceNodeId: string;
  destNodeId: string;
  bandwidthMbps: number;
  baseLatencyMs: number;
  packetLossRate: number;
  cost: number;
  status: 'ACTIVE' | 'CONGESTED' | 'SEVERED';
}

export interface CalculatedRoute {
  sourceNodeId?: string;
  destNodeId?: string;
  path: string[];
  nodeKeys: string[];
  totalLatencyMs: number;
  estimatedRttMs?: number;
  hopCount: number;
  totalCost: number;
  bottleneckBandwidthMbps?: number;
  alternativeRouteFound: boolean;
  routeReason: string;
}

export interface OSILayerData {
  layer7_application: {
    protocol: string;
    payloadSummary: string;
    dataSizeBytes: number;
    securityContext?: string;
  };
  layer6_presentation: {
    encoding: string;
    encryption: string;
    compression?: string;
  };
  layer5_session: {
    sessionId: string;
    dialogControl: string;
    state: string;
  };
  layer4_transport: {
    protocol: 'TCP' | 'UDP';
    srcPort: number;
    dstPort: number;
    sequenceNumber: number;
    ackNumber: number;
    flags: string;
    windowSize: number;
  };
  layer3_network: {
    protocol: 'IPv4';
    srcIp: string;
    dstIp: string;
    ttl: number;
    headerLengthBytes: number;
    packetSizeBytes: number;
  };
  layer2_datalink: {
    protocol: 'Ethernet II';
    srcMac: string;
    dstMac: string;
    hopRewrite: boolean;
    fcs: string;
  };
  layer1_physical: {
    medium: string;
    bitRateMbps: number;
    signalType: string;
  };
}

export interface SimulationEvent {
  id?: number;
  transactionId?: string;
  simulationId?: string;
  eventType: string;
  sourceNodeId?: string;
  destNodeId?: string;
  hopNumber?: number;
  description: string;
  latencyMs?: number;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SimulationPacket {
  id: string;
  transactionId?: string;
  simulationId?: string;
  type: string;
  protocol: string;
  sourceNodeId: string;
  destNodeId: string;
  currentNodeId: string;
  currentNode?: string;
  nextHopNodeId?: string;
  nextHop?: string;
  sequenceNumber: number;
  ackNumber: number;
  flags: string;
  ttl: number;
  sizeBytes: number;
  payload: string;
  status: string;
  hopIndex: number;
  totalHops: number;
  srcIp: string;
  dstIp: string;
  srcMac: string;
  dstMac: string;
  srcPort?: number;
  dstPort?: number;
  progressPercent?: number;
  latencyMs?: number;
  osi?: OSILayerData;
  createdAt: string;
}

export interface SimulationSession {
  id: string;
  name: string;
  type: 'TRANSACTION' | 'TRAFFIC_SIMULATION';
  transactionId?: string;
  sourceNodeId: string;
  destNodeId: string;
  sourceBranchName?: string;
  destBranchName?: string;
  route: CalculatedRoute;
  status: 'QUEUED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ABORTED' | 'FAILED';
  config: TrafficSimulationConfig;
  packetsTotal: number;
  packetsSent: number;
  packetsDelivered: number;
  packetsLost: number;
  retransmissions: number;
  totalBytesDelivered: number;
  elapsedMs: number;
  averageLatencyMs: number;
  averageRttMs: number;
  throughputKbps: number;
  activePackets: SimulationPacket[];
  events: SimulationEvent[];
  startedAt: string;
  completedAt?: string;
}

export interface TrafficSimulationConfig {
  sourceBranchId?: string;
  destBranchId?: string;
  sourceNodeId?: string;
  destNodeId?: string;
  packetCount: number;
  packetSizeBytes: number;
  protocol: 'TCP' | 'UDP';
  speedMultiplier: number; // 0.5, 1.0, 2.0, 5.0, 10.0
  scenario?:
    | 'NORMAL'
    | 'PACKET_LOSS'
    | 'HIGH_LATENCY'
    | 'CONGESTION'
    | 'ROUTER_FAILURE'
    | 'LINK_FAILURE'
    | 'FAILOVER'
    | 'BURST_TRAFFIC'
    | 'DEMO_NORMAL'
    | 'DEMO_PACKET_LOSS'
    | 'DEMO_ROUTER_FAILURE'
    | 'DEMO_LINK_FAILURE'
    | 'DEMO_FAILOVER';
  lossRateOverride?: number;
  latencyMultiplier?: number;
  failNodeKey?: string;
  severLinkId?: string;
}

export interface NetworkMetrics {
  packetsSent: number;
  packetsDelivered: number;
  packetsLost: number;
  retransmissions: number;
  packetLossPercentage: number;
  averageLatencyMs: number;
  averageRttMs: number;
  throughputKbps: number;
  activeTransactions: number;
  totalTransactions: number;
  successfulTransactions: number;
  transactionSuccessRate: number;
  failedNodesCount: number;
  failedLinksCount: number;
  lastUpdated: string;
}

