export type NodeType = 'HQ_CORE' | 'REGIONAL_HUB' | 'BRANCH_ROUTER' | 'CUSTOMER_EDGE';
export type NodeStatus = 'HEALTHY' | 'DEGRADED' | 'OFFLINE';

export type LinkStatus = 'ACTIVE' | 'CONGESTED' | 'SEVERED';

export type PacketType = 'SYN' | 'SYN_ACK' | 'ACK' | 'TXN_PAYLOAD' | 'TXN_CONFIRM' | 'FIN';

export type PacketStatus =
  | 'CREATED'
  | 'QUEUED'
  | 'TRANSMITTING'
  | 'DELIVERED'
  | 'LOST'
  | 'RETRANSMITTED'
  | 'FAILED';

export interface NetworkNode {
  id: string;
  nodeKey: string;
  name: string;
  nodeType: NodeType;
  regionId?: string | null;
  branchId?: string | null;
  ipAddress: string;
  macAddress: string;
  status: NodeStatus;
  posX: number;
  posY: number;
}

export interface NetworkLink {
  id: string;
  sourceNodeId: string;
  destNodeId: string;
  bandwidthMbps: number;
  baseLatencyMs: number;
  packetLossRate: number; // 0.00 to 1.00
  cost: number;
  status: LinkStatus;
}

export interface CalculatedRoute {
  sourceNodeId: string;
  destNodeId: string;
  path: string[]; // Ordered list of node IDs
  nodeKeys: string[];
  totalLatencyMs: number;
  estimatedRttMs: number;
  hopCount: number;
  totalCost: number;
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

export interface SimulationPacket {
  id: string;
  transactionId?: string;
  simulationId?: string;
  type: PacketType;
  protocol: 'TCP_EDUCATIONAL' | 'IP' | 'ETHERNET' | 'UDP';
  sourceNodeId: string;
  destNodeId: string;
  currentNodeId: string;
  nextHopNodeId?: string;
  sequenceNumber: number;
  ackNumber: number;
  flags: string;
  ttl: number;
  sizeBytes: number;
  payload: string;
  status: PacketStatus;
  hopIndex: number;
  totalHops: number;
  srcIp: string;
  dstIp: string;
  srcMac: string;
  dstMac: string;
  srcPort?: number;
  dstPort?: number;
  progressPercent?: number; // 0 to 100 along the link
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

export interface SimulationEvent {
  id?: number;
  transactionId?: string;
  simulationId?: string;
  eventType:
    | 'TRANSACTION_INITIATED'
    | 'SIMULATION_STARTED'
    | 'ROUTE_CALCULATED'
    | 'ROUTE_RECALCULATED'
    | 'HANDSHAKE_SYN'
    | 'HANDSHAKE_SYN_ACK'
    | 'HANDSHAKE_ACK'
    | 'PACKET_CREATED'
    | 'PACKET_QUEUED'
    | 'PACKET_TRANSMITTING'
    | 'PACKET_HOP_FORWARDED'
    | 'PACKET_LOST'
    | 'PACKET_TIMEOUT'
    | 'PACKET_RETRANSMITTED'
    | 'PACKET_DELIVERED'
    | 'PACKET_FAILED'
    | 'TRANSACTION_COMPLETED'
    | 'TRANSACTION_FAILED'
    | 'SIMULATION_COMPLETED'
    | 'SIMULATION_PAUSED'
    | 'SIMULATION_RESUMED'
    | 'SIMULATION_ABORTED'
    | 'ROUTER_STATE_CHANGED'
    | 'LINK_STATE_CHANGED'
    | 'DYNAMIC_FAILOVER_TRIGGERED';
  sourceNodeId?: string;
  destNodeId?: string;
  hopNumber?: number;
  description: string;
  latencyMs?: number;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  timestamp: string;
  metadata?: Record<string, any>;
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

export interface FaultInjectionParams {
  disabledNodeIds?: string[];
  severedLinkIds?: string[];
  globalLatencyMultiplier?: number;
  globalLossRateOverride?: number;
  ddosSimulationActive?: boolean;
  firewallActive?: boolean;
}


