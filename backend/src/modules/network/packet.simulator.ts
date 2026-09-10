import {
  CalculatedRoute,
  NetworkNode,
  NetworkLink,
  SimulationPacket,
  SimulationEvent,
  NetworkMetrics,
  FaultInjectionParams,
  SimulationSession,
  TrafficSimulationConfig,
  OSILayerData
} from './network.types.js';
import { SocketManager } from '../../websocket/socket.manager.js';
import { executeQuery } from '../../database/index.js';
import crypto from 'crypto';

export class PacketSimulator {
  private static metrics: NetworkMetrics = {
    packetsSent: 0,
    packetsDelivered: 0,
    packetsLost: 0,
    retransmissions: 0,
    packetLossPercentage: 0,
    averageLatencyMs: 0,
    averageRttMs: 0,
    throughputKbps: 0,
    activeTransactions: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    transactionSuccessRate: 100,
    failedNodesCount: 0,
    failedLinksCount: 0,
    lastUpdated: new Date().toISOString()
  };

  private static cumulativeLatencyMs: number = 0;
  private static cumulativeBytesDelivered: number = 0;
  private static simulationStartTime: number = Date.now();

  private static faultParams: FaultInjectionParams = {
    disabledNodeIds: [],
    severedLinkIds: [],
    globalLatencyMultiplier: 1.0,
    globalLossRateOverride: 0.0,
    ddosSimulationActive: false,
    firewallActive: true
  };

  // Active simulation session registry
  private static activeSessions: Map<string, SimulationSession> = new Map();
  // Paused session signals
  private static pausedSessions: Set<string> = new Set();
  // Aborted session signals
  private static abortedSessions: Set<string> = new Set();

  public static setFaultParams(params: Partial<FaultInjectionParams>): void {
    this.faultParams = { ...this.faultParams, ...params };
  }

  public static getFaultParams(): FaultInjectionParams {
    return this.faultParams;
  }

  public static getMetrics(): NetworkMetrics {
    return this.metrics;
  }

  public static getActiveSessions(): SimulationSession[] {
    return Array.from(this.activeSessions.values());
  }

  public static getSession(sessionId: string): SimulationSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  public static getSessionByTransactionId(transactionId: string): SimulationSession | undefined {
    return Array.from(this.activeSessions.values()).find(s => s.transactionId === transactionId);
  }

  public static updateFailedCounts(nodesCount: number, linksCount: number): void {
    this.metrics.failedNodesCount = nodesCount;
    this.metrics.failedLinksCount = linksCount;
    this.metrics.lastUpdated = new Date().toISOString();
    SocketManager.emitMetrics(this.metrics);
  }

  /**
   * Helper to construct educational 7-Layer OSI model encapsulation
   */
  public static buildOSIData(
    srcNode: NetworkNode,
    dstNode: NetworkNode,
    currHopNode: NetworkNode,
    nextHopNode: NetworkNode | undefined,
    seqNo: number,
    ackNo: number,
    flags: string,
    ttl: number,
    payloadSummary: string,
    protocol: 'TCP' | 'UDP' = 'TCP',
    sizeBytes: number = 512,
    tlsEnabled: boolean = true
  ): OSILayerData {
    return {
      layer7_application: {
        protocol: tlsEnabled ? 'HTTPS (HTTP/2.0 over TLS 1.3)' : 'HTTP/1.1 (PLAINTEXT)',
        payloadSummary,
        dataSizeBytes: sizeBytes,
        securityContext: tlsEnabled ? 'Mutual TLS (mTLS) Verified · AES-256-GCM' : 'UNENCRYPTED'
      },
      layer6_presentation: {
        encoding: 'JSON / UTF-8',
        encryption: tlsEnabled ? 'TLS 1.3 (Cipher: TLS_AES_256_GCM_SHA384)' : 'None (Plaintext)',
        compression: 'gzip (rfc1952)'
      },
      layer5_session: {
        sessionId: `SESS-NBX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        dialogControl: 'Full-Duplex Synchronous State',
        state: 'ESTABLISHED / AUTHENTICATED'
      },
      layer4_transport: {
        protocol,
        srcPort: 49152 + (seqNo % 1000),
        dstPort: 443,
        sequenceNumber: seqNo,
        ackNumber: ackNo,
        flags,
        windowSize: 65535
      },
      layer3_network: {
        protocol: 'IPv4',
        srcIp: srcNode.ipAddress,
        dstIp: dstNode.ipAddress,
        ttl,
        headerLengthBytes: 20,
        packetSizeBytes: sizeBytes + 40 // Payload + IP/TCP headers
      },
      layer2_datalink: {
        protocol: 'Ethernet II',
        srcMac: currHopNode.macAddress,
        dstMac: nextHopNode ? nextHopNode.macAddress : dstNode.macAddress,
        hopRewrite: currHopNode.id !== srcNode.id,
        fcs: `0x${crypto.randomBytes(4).toString('hex')}`
      },
      layer1_physical: {
        medium: currHopNode.nodeType === 'HQ_CORE' ? '100G Optical Fiber (DWDM)' : '10G Carrier Ethernet WAN',
        bitRateMbps: currHopNode.nodeType === 'HQ_CORE' ? 100000 : 10000,
        signalType: 'NRZ Optical Laser Pulse (850nm)'
      }
    };
  }

  /**
   * Control an active simulation run
   */
  public static controlSession(sessionId: string, action: 'PAUSE' | 'RESUME' | 'ABORT'): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    if (action === 'PAUSE') {
      this.pausedSessions.add(sessionId);
      session.status = 'PAUSED';
      SocketManager.emitSimulationEvent({
        simulationId: sessionId,
        transactionId: session.transactionId,
        eventType: 'SIMULATION_PAUSED',
        description: `Simulation ${sessionId} paused by user control.`,
        severity: 'INFO',
        timestamp: new Date().toISOString()
      });
    } else if (action === 'RESUME') {
      this.pausedSessions.delete(sessionId);
      session.status = 'RUNNING';
      SocketManager.emitSimulationEvent({
        simulationId: sessionId,
        transactionId: session.transactionId,
        eventType: 'SIMULATION_RESUMED',
        description: `Simulation ${sessionId} resumed.`,
        severity: 'INFO',
        timestamp: new Date().toISOString()
      });
    } else if (action === 'ABORT') {
      this.abortedSessions.add(sessionId);
      this.pausedSessions.delete(sessionId);
      session.status = 'ABORTED';
      SocketManager.emitSimulationEvent({
        simulationId: sessionId,
        transactionId: session.transactionId,
        eventType: 'SIMULATION_ABORTED',
        description: `Simulation ${sessionId} aborted by user control.`,
        severity: 'WARNING',
        timestamp: new Date().toISOString()
      });
    }

    return true;
  }

  /**
   * Notify simulation engine of topology change during flight (Dynamic Dijkstra rerouting)
   */
  public static async onTopologyChanged(
    calculateRouteFn: (src: string, dst: string) => Promise<CalculatedRoute>,
    nodeMap: Map<string, NetworkNode>
  ): Promise<void> {
    for (const [simId, session] of this.activeSessions.entries()) {
      if (session.status !== 'RUNNING' && session.status !== 'PAUSED') continue;

      // Check if current route has an offline node or severed link ahead
      const currentPath = session.route.path;
      let pathSevered = false;

      for (const nodeId of currentPath) {
        const node = nodeMap.get(nodeId);
        if (node && node.status === 'OFFLINE') {
          pathSevered = true;
          break;
        }
      }

      if (pathSevered) {
        try {
          // Recalculate route from current active node or source node to destination
          const newRoute = await calculateRouteFn(session.sourceNodeId, session.destNodeId);
          session.route = newRoute;

          const failoverEvent: SimulationEvent = {
            simulationId: simId,
            transactionId: session.transactionId,
            eventType: 'DYNAMIC_FAILOVER_TRIGGERED',
            sourceNodeId: session.sourceNodeId,
            destNodeId: session.destNodeId,
            description: `[FAILOVER] Dynamic topology change detected! Dijkstra recomputed active route: ${newRoute.nodeKeys.join(' -> ')}. Cost: ${newRoute.totalCost}. Latency: ${newRoute.totalLatencyMs}ms.`,
            severity: 'WARNING',
            latencyMs: newRoute.totalLatencyMs,
            timestamp: new Date().toISOString(),
            metadata: {
              newPath: newRoute.nodeKeys,
              hopCount: newRoute.hopCount,
              reason: 'Node/Link offline during active transit'
            }
          };

          await this.recordAndEmitEvent(failoverEvent);
        } catch (err: any) {
          console.warn(`Could not find failover route for simulation ${simId}:`, err.message);
        }
      }
    }
  }

  /**
   * Execute independent Branch-to-Branch Multi-Packet Simulator
   */
  public static async simulateBranchTraffic(
    config: TrafficSimulationConfig,
    route: CalculatedRoute,
    nodeMap: Map<string, NetworkNode>,
    linkMap: Map<string, NetworkLink>,
    calculateRouteFn?: (src: string, dst: string) => Promise<CalculatedRoute>
  ): Promise<SimulationSession> {
    const simId = `SIM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const pathNodes = route.path.map(id => nodeMap.get(id)).filter(Boolean) as NetworkNode[];

    if (pathNodes.length < 2) {
      throw new Error('Calculated path requires at least 2 connected nodes.');
    }

    const srcNode = pathNodes[0];
    const dstNode = pathNodes[pathNodes.length - 1];

    const session: SimulationSession = {
      id: simId,
      name: `Branch Traffic: ${srcNode.name} -> ${dstNode.name}`,
      type: 'TRAFFIC_SIMULATION',
      sourceNodeId: srcNode.id,
      destNodeId: dstNode.id,
      sourceBranchName: srcNode.name,
      destBranchName: dstNode.name,
      route,
      status: 'RUNNING',
      config,
      packetsTotal: config.packetCount,
      packetsSent: 0,
      packetsDelivered: 0,
      packetsLost: 0,
      retransmissions: 0,
      totalBytesDelivered: 0,
      elapsedMs: 0,
      averageLatencyMs: 0,
      averageRttMs: 0,
      throughputKbps: 0,
      activePackets: [],
      events: [],
      startedAt: new Date().toISOString()
    };

    this.activeSessions.set(simId, session);

    // Run simulation asynchronously so API can return immediately or await as needed
    this.executeMultiPacketRun(session, nodeMap, linkMap, calculateRouteFn).catch(err => {
      console.error(`Simulation ${simId} error:`, err);
      session.status = 'FAILED';
    });

    return session;
  }

  /**
   * Internal async multi-packet simulation runner
   */
  private static async executeMultiPacketRun(
    session: SimulationSession,
    nodeMap: Map<string, NetworkNode>,
    linkMap: Map<string, NetworkLink>,
    calculateRouteFn?: (src: string, dst: string) => Promise<CalculatedRoute>
  ): Promise<void> {
    const simId = session.id;
    const speed = Math.max(0.1, session.config.speedMultiplier || 1.0);
    const hopBaseDelay = Math.max(60, Math.floor(550 / speed));
    const interPacketDelay = Math.max(60, Math.floor(300 / speed));

    const sleep = (ms: number) => new Promise(r => setTimeout(r, Math.max(5, ms)));

    const checkState = async () => {
      while (this.pausedSessions.has(simId)) {
        await sleep(100);
      }
      if (this.abortedSessions.has(simId)) {
        throw new Error('SIMULATION_ABORTED');
      }
    };

    // 1. Emission: Simulation Started
    const startEvent: SimulationEvent = {
      simulationId: simId,
      transactionId: session.transactionId,
      eventType: 'SIMULATION_STARTED',
      sourceNodeId: session.sourceNodeId,
      destNodeId: session.destNodeId,
      description: `[SIM START] Initializing ${session.config.protocol} stream (${session.config.packetCount} packets · ${session.config.packetSizeBytes}B MTU) from ${session.sourceBranchName} to ${session.destBranchName}. Dijkstra Route: ${session.route.nodeKeys.join(' -> ')}`,
      severity: 'INFO',
      timestamp: new Date().toISOString(),
      metadata: { config: session.config, route: session.route }
    };
    await this.recordAndEmitEvent(startEvent);

    const startTime = Date.now();
    let accumulatedLatency = 0;
    let seqCounter = 1000;
    let ackCounter = 5000;

    // Loss probability based on scenario / override
    let lossRate = session.config.lossRateOverride !== undefined
      ? session.config.lossRateOverride
      : (session.config.scenario === 'PACKET_LOSS' || session.config.scenario === 'DEMO_PACKET_LOSS' ? 0.20 : 0.0);

    // Multi-packet pipeline
    const packetPromises: Promise<void>[] = [];

    for (let pIdx = 0; pIdx < session.config.packetCount; pIdx++) {
      await checkState();

      const pktSeq = seqCounter + (pIdx * session.config.packetSizeBytes);
      const pktAck = ackCounter + (pIdx * session.config.packetSizeBytes);
      const pktId = `PKT-${simId}-${String(pIdx + 1).padStart(3, '0')}`;

      // Stagger packet transmissions
      await sleep(interPacketDelay);

      const packetTask = (async () => {
        let pathNodes = session.route.path.map(id => nodeMap.get(id)).filter(Boolean) as NetworkNode[];
        if (pathNodes.length < 2) return;

        const srcNode = pathNodes[0];
        const dstNode = pathNodes[pathNodes.length - 1];

        const initialPacket: SimulationPacket = {
          id: pktId,
          simulationId: simId,
          transactionId: session.transactionId,
          type: session.config.protocol === 'TCP' ? 'TXN_PAYLOAD' : 'TXN_PAYLOAD',
          protocol: session.config.protocol === 'TCP' ? 'TCP_EDUCATIONAL' : 'UDP',
          sourceNodeId: srcNode.id,
          destNodeId: dstNode.id,
          currentNodeId: srcNode.id,
          nextHopNodeId: pathNodes[1].id,
          sequenceNumber: pktSeq,
          ackNumber: pktAck,
          flags: 'PSH, ACK',
          ttl: 64,
          sizeBytes: session.config.packetSizeBytes,
          payload: `Branch Telemetry Data Frame #${pIdx + 1} [${session.config.protocol}]`,
          status: 'TRANSMITTING',
          hopIndex: 0,
          totalHops: session.route.hopCount,
          srcIp: srcNode.ipAddress,
          dstIp: dstNode.ipAddress,
          srcMac: srcNode.macAddress,
          dstMac: pathNodes[1].macAddress,
          progressPercent: 0,
          osi: this.buildOSIData(
            srcNode,
            dstNode,
            srcNode,
            pathNodes[1],
            pktSeq,
            pktAck,
            'PSH, ACK',
            64,
            `Frame #${pIdx + 1} (${session.config.packetSizeBytes}B)`,
            session.config.protocol,
            session.config.packetSizeBytes,
            true
          ),
          createdAt: new Date().toISOString()
        };

        session.packetsSent++;
        this.metrics.packetsSent++;
        session.activePackets.push(initialPacket);
        this.recordPacket(initialPacket);

        // Hop-by-hop forwarding
        for (let hIdx = 0; hIdx < pathNodes.length - 1; hIdx++) {
          await checkState();

          // Refresh path in case of mid-flight dynamic rerouting
          pathNodes = session.route.path.map(id => nodeMap.get(id)).filter(Boolean) as NetworkNode[];
          if (hIdx >= pathNodes.length - 1) break;

          const hopSrc = pathNodes[hIdx];
          const hopDst = pathNodes[hIdx + 1];

          const linkKey = `${hopSrc.id}-${hopDst.id}`;
          const reverseKey = `${hopDst.id}-${hopSrc.id}`;
          const link = linkMap.get(linkKey) || linkMap.get(reverseKey);

          // Check if downstream link or router is severed/offline
          const isSevered = !link || link.status === 'SEVERED' || (this.faultParams.severedLinkIds || []).includes(link?.id || '');
          const isOffline = hopDst.status === 'OFFLINE' || (this.faultParams.disabledNodeIds || []).includes(hopDst.id);

          if (isSevered || isOffline) {
            // Attempt Dijkstra dynamic failover rerouting from current hop
            if (calculateRouteFn) {
              try {
                const rerouted = await calculateRouteFn(hopSrc.id, dstNode.id);
                if (rerouted && rerouted.path.length >= 2) {
                  session.route = {
                    ...rerouted,
                    path: [...session.route.path.slice(0, hIdx), ...rerouted.path],
                    nodeKeys: [...session.route.nodeKeys.slice(0, hIdx), ...rerouted.nodeKeys]
                  };
                  pathNodes = session.route.path.map(id => nodeMap.get(id)).filter(Boolean) as NetworkNode[];

                  const failoverEvent: SimulationEvent = {
                    simulationId: simId,
                    transactionId: session.transactionId,
                    eventType: 'DYNAMIC_FAILOVER_TRIGGERED',
                    sourceNodeId: hopSrc.id,
                    destNodeId: hopDst.id,
                    hopNumber: hIdx + 1,
                    description: `[DYNAMIC FAILOVER] Link ${hopSrc.name} -> ${hopDst.name} is SEVERED/OFFLINE. Dijkstra dynamically rerouted in-flight packet ${pktId} via ${rerouted.nodeKeys.join(' -> ')}.`,
                    severity: 'WARNING',
                    timestamp: new Date().toISOString()
                  };
                  await this.recordAndEmitEvent(failoverEvent);

                  // Recalculate with new path
                  hIdx--;
                  continue;
                }
              } catch (rerouteErr) {
                // Unreachable
              }
            }

            // Severed link and cannot reach destination: drop packet
            session.packetsLost++;
            this.metrics.packetsLost++;
            initialPacket.status = 'LOST';
            this.recordPacket(initialPacket);

            const severedDropEvent: SimulationEvent = {
              simulationId: simId,
              transactionId: session.transactionId,
              eventType: 'PACKET_LOST',
              sourceNodeId: hopSrc.id,
              destNodeId: hopDst.id,
              hopNumber: hIdx + 1,
              description: `[SEVERED LINK DROP] Frame ${pktId} dropped at ${hopSrc.name}. Link to ${hopDst.name} is SEVERED and no viable alternate Dijkstra route exists.`,
              severity: 'ERROR',
              timestamp: new Date().toISOString()
            };
            await this.recordAndEmitEvent(severedDropEvent);
            return;
          }

          // Deterministic loss for DEMO_PACKET_LOSS or probabilistic loss
          const isDemoLoss = (session.config.scenario === 'DEMO_PACKET_LOSS' || session.config.scenario === 'PACKET_LOSS') && (pIdx === 2 || pIdx === 6);
          const isRandomLost = lossRate > 0 && Math.random() < lossRate;
          const isLost = isDemoLoss || isRandomLost;

          const hopLatency = link ? Math.round(link.baseLatencyMs * (this.faultParams.globalLatencyMultiplier || 1.0)) : 12;
          accumulatedLatency += hopLatency;

          // Animate link transit progress smoothly
          for (let prog = 25; prog <= 100; prog += 25) {
            await checkState();
            initialPacket.progressPercent = prog;
            initialPacket.currentNodeId = hopSrc.id;
            initialPacket.nextHopNodeId = hopDst.id;
            this.recordPacket(initialPacket);
            await sleep(Math.floor(hopBaseDelay / 4));
          }

          if (isLost && initialPacket.status !== 'RETRANSMITTED') {
            session.packetsLost++;
            this.metrics.packetsLost++;
            initialPacket.status = 'LOST';
            this.recordPacket(initialPacket);

            const lostEvent: SimulationEvent = {
              simulationId: simId,
              transactionId: session.transactionId,
              eventType: 'PACKET_LOST',
              sourceNodeId: hopSrc.id,
              destNodeId: hopDst.id,
              hopNumber: hIdx + 1,
              description: `[PACKET LOSS] Frame ${pktId} dropped on Link ${hopSrc.nodeKey} -> ${hopDst.nodeKey}. Buffer overflow / simulated link drop.`,
              latencyMs: hopLatency,
              severity: 'ERROR',
              timestamp: new Date().toISOString()
            };
            await this.recordAndEmitEvent(lostEvent);
            await sleep(hopBaseDelay * 2);

            // TCP ARQ Retransmission
            if (session.config.protocol === 'TCP') {
              session.retransmissions++;
              session.packetsSent++;
              this.metrics.retransmissions++;
              this.metrics.packetsSent++;

              const rtxId = `${pktId}-R1`;
              const rtxPacket: SimulationPacket = {
                ...initialPacket,
                id: rtxId,
                status: 'RETRANSMITTED',
                createdAt: new Date().toISOString()
              };
              this.recordPacket(rtxPacket);

              const rtxEvent: SimulationEvent = {
                simulationId: simId,
                transactionId: session.transactionId,
                eventType: 'PACKET_RETRANSMITTED',
                sourceNodeId: hopSrc.id,
                destNodeId: hopDst.id,
                hopNumber: hIdx + 1,
                description: `[RTX] TCP Retransmission Timer expired (2x RTT). Retransmitting Sequence #${pktSeq} (${rtxId}) to ${hopDst.nodeKey}.`,
                latencyMs: hopLatency * 2,
                severity: 'WARNING',
                timestamp: new Date().toISOString()
              };
              await this.recordAndEmitEvent(rtxEvent);
              accumulatedLatency += hopLatency * 2;
              await sleep(hopBaseDelay * 2);
            }
          }

          // Hop forwarded successfully
          initialPacket.status = 'TRANSMITTING';
          initialPacket.hopIndex = hIdx + 1;
          initialPacket.currentNodeId = hopDst.id;
          initialPacket.nextHopNodeId = hIdx + 2 < pathNodes.length ? pathNodes[hIdx + 2].id : undefined;
          initialPacket.srcMac = hopSrc.macAddress;
          initialPacket.dstMac = hopDst.macAddress; // Layer 2 MAC rewritten
          initialPacket.ttl = 64 - hIdx - 1;
          initialPacket.osi = this.buildOSIData(
            srcNode,
            dstNode,
            hopSrc,
            hopDst,
            pktSeq,
            pktAck,
            'PSH, ACK',
            64 - hIdx - 1,
            `Frame #${pIdx + 1} at Hop #${hIdx + 1}`,
            session.config.protocol,
            session.config.packetSizeBytes,
            true
          );

          this.recordPacket(initialPacket);

          const hopEvent: SimulationEvent = {
            simulationId: simId,
            transactionId: session.transactionId,
            eventType: 'PACKET_HOP_FORWARDED',
            sourceNodeId: hopSrc.id,
            destNodeId: hopDst.id,
            hopNumber: hIdx + 1,
            description: `[HOP #${hIdx + 1}] ${pktId} forwarded: ${hopSrc.name} -> ${hopDst.name} (L2 MAC Rewritten: ${hopSrc.macAddress} -> ${hopDst.macAddress}). TTL: ${64 - hIdx - 1}.`,
            latencyMs: hopLatency,
            severity: 'INFO',
            timestamp: new Date().toISOString()
          };
          await this.recordAndEmitEvent(hopEvent);
        }

        // Final delivery of this packet
        initialPacket.status = 'DELIVERED';
        initialPacket.progressPercent = 100;
        session.packetsDelivered++;
        session.totalBytesDelivered += session.config.packetSizeBytes;
        this.metrics.packetsDelivered++;
        this.recordPacket(initialPacket);
      })();

      packetPromises.push(packetTask);
    }

    try {
      await Promise.all(packetPromises);
    } catch (err: any) {
      if (err.message === 'SIMULATION_ABORTED') {
        session.status = 'ABORTED';
        this.activeSessions.delete(simId);
        return;
      }
      throw err;
    }

    // Wrap up session
    session.elapsedMs = Date.now() - startTime;
    session.status = 'COMPLETED';
    session.completedAt = new Date().toISOString();

    if (session.packetsDelivered > 0) {
      session.averageLatencyMs = parseFloat((accumulatedLatency / session.packetsDelivered).toFixed(1));
      session.averageRttMs = parseFloat((session.averageLatencyMs * 2).toFixed(1));
    }

    const elapsedSeconds = Math.max(0.5, session.elapsedMs / 1000);
    session.throughputKbps = parseFloat(((session.totalBytesDelivered * 8) / (elapsedSeconds * 1000)).toFixed(1));

    // Update global metrics
    this.metrics.packetLossPercentage = this.metrics.packetsSent > 0
      ? parseFloat(((this.metrics.packetsLost / this.metrics.packetsSent) * 100).toFixed(2))
      : 0;

    this.cumulativeLatencyMs += accumulatedLatency;
    if (this.metrics.packetsDelivered > 0) {
      this.metrics.averageLatencyMs = parseFloat((this.cumulativeLatencyMs / this.metrics.packetsDelivered).toFixed(1));
      this.metrics.averageRttMs = parseFloat((this.metrics.averageLatencyMs * 2).toFixed(1));
    }

    this.cumulativeBytesDelivered += session.totalBytesDelivered;
    const globalElapsed = Math.max(1, (Date.now() - this.simulationStartTime) / 1000);
    this.metrics.throughputKbps = parseFloat(((this.cumulativeBytesDelivered * 8) / (globalElapsed * 1000)).toFixed(1));
    this.metrics.lastUpdated = new Date().toISOString();

    SocketManager.emitMetrics(this.metrics);

    // Final Completion Event
    const completionEvent: SimulationEvent = {
      simulationId: simId,
      transactionId: session.transactionId,
      eventType: 'SIMULATION_COMPLETED',
      sourceNodeId: session.sourceNodeId,
      destNodeId: session.destNodeId,
      description: `[SIM COMPLETE] Stream ${simId} finished: ${session.packetsDelivered}/${session.packetsTotal} delivered (${session.retransmissions} RTX · Loss: ${((session.packetsLost / Math.max(1, session.packetsSent)) * 100).toFixed(1)}%). Avg Latency: ${session.averageLatencyMs}ms · Throughput: ${session.throughputKbps} Kbps.`,
      severity: 'SUCCESS',
      latencyMs: session.averageLatencyMs,
      timestamp: new Date().toISOString(),
      metadata: {
        sessionMetrics: {
          packetsSent: session.packetsSent,
          packetsDelivered: session.packetsDelivered,
          packetsLost: session.packetsLost,
          retransmissions: session.retransmissions,
          throughputKbps: session.throughputKbps,
          averageLatencyMs: session.averageLatencyMs,
          averageRttMs: session.averageRttMs,
          elapsedMs: session.elapsedMs
        }
      }
    };
    await this.recordAndEmitEvent(completionEvent);
  }

  /**
   * Execute hop-by-hop banking transaction simulation
   */
  public static async simulateTransactionFlow(
    transactionId: string,
    route: CalculatedRoute,
    nodeMap: Map<string, NetworkNode>,
    linkMap: Map<string, NetworkLink>,
    payloadData: string,
    speedMultiplier: number = 1.0
  ): Promise<{
    success: boolean;
    totalLatencyMs: number;
    packetsTransmitted: number;
    packetsLost: number;
    retransmissions: number;
  }> {
    this.metrics.activeTransactions++;
    this.metrics.totalTransactions++;

    let packetsSent = 0;
    let packetsDelivered = 0;
    let packetsLost = 0;
    let retransmissions = 0;
    let accumulatedLatency = 0;

    const baseDelay = Math.max(50, Math.floor(500 / speedMultiplier));
    const pathNodes = route.path.map(id => nodeMap.get(id)).filter(Boolean) as NetworkNode[];

    if (pathNodes.length < 2) {
      this.metrics.activeTransactions = Math.max(0, this.metrics.activeTransactions - 1);
      return { success: false, totalLatencyMs: 0, packetsTransmitted: 0, packetsLost: 0, retransmissions: 0 };
    }

    const srcNode = pathNodes[0];
    const dstNode = pathNodes[pathNodes.length - 1];
    const sleep = (ms: number) => new Promise(r => setTimeout(r, Math.max(10, ms)));

    // Create a transaction simulation session
    const simId = `SIM-TXN-${transactionId.replace(/^TXN-/, '').slice(0, 8)}`;
    const session: SimulationSession = {
      id: simId,
      name: `Banking Transaction ${transactionId}`,
      type: 'TRANSACTION',
      transactionId,
      sourceNodeId: srcNode.id,
      destNodeId: dstNode.id,
      sourceBranchName: srcNode.name,
      destBranchName: dstNode.name,
      route,
      status: 'RUNNING',
      config: {
        packetCount: 3, // SYN, SYN-ACK, Payload
        packetSizeBytes: 512,
        protocol: 'TCP',
        speedMultiplier
      },
      packetsTotal: 3,
      packetsSent: 0,
      packetsDelivered: 0,
      packetsLost: 0,
      retransmissions: 0,
      totalBytesDelivered: 0,
      elapsedMs: 0,
      averageLatencyMs: 0,
      averageRttMs: 0,
      throughputKbps: 0,
      activePackets: [],
      events: [],
      startedAt: new Date().toISOString()
    };
    this.activeSessions.set(simId, session);

    // 1. Initial Route Event
    const initEvent: SimulationEvent = {
      simulationId: simId,
      transactionId,
      eventType: 'ROUTE_CALCULATED',
      sourceNodeId: srcNode.id,
      destNodeId: dstNode.id,
      hopNumber: 0,
      description: `Calculated ${route.hopCount}-hop path via Dijkstra: ${route.nodeKeys.join(' -> ')}. Cost: ${route.totalCost}. Reason: ${route.routeReason}`,
      latencyMs: route.totalLatencyMs,
      severity: route.alternativeRouteFound ? 'WARNING' : 'INFO',
      timestamp: new Date().toISOString(),
      metadata: { path: route.nodeKeys, totalCost: route.totalCost }
    };
    await this.recordAndEmitEvent(initEvent);

    // 2. Educational TCP 3-Way Handshake
    // SYN (Src -> Dst)
    const synPacket: SimulationPacket = {
      id: `PKT-${transactionId}-SYN`,
      simulationId: simId,
      transactionId,
      type: 'SYN',
      protocol: 'TCP_EDUCATIONAL',
      sourceNodeId: srcNode.id,
      destNodeId: dstNode.id,
      currentNodeId: srcNode.id,
      nextHopNodeId: pathNodes[1].id,
      sequenceNumber: 1000,
      ackNumber: 0,
      flags: 'SYN',
      ttl: 64,
      sizeBytes: 64,
      payload: 'TCP SYN Handshake Initializer',
      status: 'TRANSMITTING',
      hopIndex: 0,
      totalHops: route.hopCount,
      srcIp: srcNode.ipAddress,
      dstIp: dstNode.ipAddress,
      srcMac: srcNode.macAddress,
      dstMac: pathNodes[1].macAddress,
      progressPercent: 50,
      osi: this.buildOSIData(srcNode, dstNode, srcNode, pathNodes[1], 1000, 0, 'SYN', 64, 'TCP Connection Request (SYN)', 'TCP', 64, true),
      createdAt: new Date().toISOString()
    };
    packetsSent++;
    this.recordPacket(synPacket);
    await sleep(baseDelay);
    synPacket.status = 'DELIVERED';
    synPacket.progressPercent = 100;
    this.recordPacket(synPacket);
    packetsDelivered++;

    // SYN-ACK (Dst -> Src)
    const synAckPacket: SimulationPacket = {
      id: `PKT-${transactionId}-SYN-ACK`,
      simulationId: simId,
      transactionId,
      type: 'SYN_ACK',
      protocol: 'TCP_EDUCATIONAL',
      sourceNodeId: dstNode.id,
      destNodeId: srcNode.id,
      currentNodeId: dstNode.id,
      nextHopNodeId: srcNode.id,
      sequenceNumber: 5000,
      ackNumber: 1001,
      flags: 'SYN, ACK',
      ttl: 64,
      sizeBytes: 64,
      payload: 'TCP SYN-ACK Connection Accepted',
      status: 'TRANSMITTING',
      hopIndex: route.hopCount,
      totalHops: route.hopCount,
      srcIp: dstNode.ipAddress,
      dstIp: srcNode.ipAddress,
      srcMac: dstNode.macAddress,
      dstMac: srcNode.macAddress,
      progressPercent: 50,
      osi: this.buildOSIData(dstNode, srcNode, dstNode, srcNode, 5000, 1001, 'SYN, ACK', 64, 'TCP Connection Acknowledgment (SYN-ACK)', 'TCP', 64, true),
      createdAt: new Date().toISOString()
    };
    packetsSent++;
    this.recordPacket(synAckPacket);
    await sleep(baseDelay);
    synAckPacket.status = 'DELIVERED';
    synAckPacket.progressPercent = 100;
    this.recordPacket(synAckPacket);
    packetsDelivered++;

    let totalBytesDelivered = 128; // 64 (SYN) + 64 (SYN-ACK)

    // 3. Hop-by-Hop Data Packet Transmission (Forwarding across path)
    let seqNo = 1001;
    let ackNo = 5001;

    for (let i = 0; i < pathNodes.length - 1; i++) {
      const hopSrc = pathNodes[i];
      const hopDst = pathNodes[i + 1];
      const linkKey = `${hopSrc.id}-${hopDst.id}`;
      const reverseLinkKey = `${hopDst.id}-${hopSrc.id}`;
      const link = linkMap.get(linkKey) || linkMap.get(reverseLinkKey);

      // Check if downstream link or router is severed/offline
      const isSevered = !link || link.status === 'SEVERED' || (this.faultParams.severedLinkIds || []).includes(link?.id || '');
      const isOffline = hopDst.status === 'OFFLINE' || (this.faultParams.disabledNodeIds || []).includes(hopDst.id);

      if (isSevered || isOffline) {
        packetsLost++;
        const dropPacket: SimulationPacket = {
          id: `PKT-${transactionId}-HOP-${i + 1}-DROPPED`,
          simulationId: simId,
          transactionId,
          type: 'TXN_PAYLOAD',
          protocol: 'TCP_EDUCATIONAL',
          sourceNodeId: srcNode.id,
          destNodeId: dstNode.id,
          currentNodeId: hopSrc.id,
          nextHopNodeId: hopDst.id,
          sequenceNumber: seqNo,
          ackNumber: ackNo,
          flags: 'RST',
          ttl: 64 - i,
          sizeBytes: 512,
          payload: payloadData,
          status: 'LOST',
          hopIndex: i,
          totalHops: route.hopCount,
          srcIp: srcNode.ipAddress,
          dstIp: dstNode.ipAddress,
          srcMac: hopSrc.macAddress,
          dstMac: hopDst.macAddress,
          progressPercent: 50,
          osi: this.buildOSIData(srcNode, dstNode, hopSrc, hopDst, seqNo, ackNo, 'RST', 64 - i, `Dropped Transfer Packet`, 'TCP', 512, true),
          createdAt: new Date().toISOString()
        };
        this.recordPacket(dropPacket);

        const dropEvent: SimulationEvent = {
          simulationId: simId,
          transactionId,
          eventType: 'PACKET_LOST',
          sourceNodeId: hopSrc.id,
          destNodeId: hopDst.id,
          hopNumber: i + 1,
          description: `[SEVERED LINK DROP] Financial payload packet dropped at ${hopSrc.name}. Downstream WAN Link to ${hopDst.name} is SEVERED.`,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        };
        await this.recordAndEmitEvent(dropEvent);
        break;
      }

      const hopLatency = link ? Math.round(link.baseLatencyMs * (this.faultParams.globalLatencyMultiplier || 1.0)) : 10;
      accumulatedLatency += hopLatency;

      const configuredLoss = link ? link.packetLossRate : 0.0;
      const linkLossRate = this.faultParams.globalLossRateOverride !== undefined && this.faultParams.globalLossRateOverride !== null
        ? this.faultParams.globalLossRateOverride
        : configuredLoss;

      const isLost = linkLossRate > 0 && Math.random() < linkLossRate;

      const dataPacket: SimulationPacket = {
        id: `PKT-${transactionId}-HOP-${i + 1}`,
        simulationId: simId,
        transactionId,
        type: 'TXN_PAYLOAD',
        protocol: 'TCP_EDUCATIONAL',
        sourceNodeId: srcNode.id,
        destNodeId: dstNode.id,
        currentNodeId: hopSrc.id,
        nextHopNodeId: hopDst.id,
        sequenceNumber: seqNo,
        ackNumber: ackNo,
        flags: 'PSH, ACK',
        ttl: 64 - i,
        sizeBytes: 512,
        payload: payloadData,
        status: isLost ? 'LOST' : 'TRANSMITTING',
        hopIndex: i,
        totalHops: route.hopCount,
        srcIp: srcNode.ipAddress,
        dstIp: dstNode.ipAddress,
        srcMac: hopSrc.macAddress,
        dstMac: hopDst.macAddress, // Layer 2 MAC rewritten per hop
        progressPercent: 25,
        osi: this.buildOSIData(
          srcNode,
          dstNode,
          hopSrc,
          hopDst,
          seqNo,
          ackNo,
          'PSH, ACK',
          64 - i,
          `Encrypted Banking Financial Transfer (${payloadData.slice(0, 32)}...)`,
          'TCP',
          512,
          true
        ),
        createdAt: new Date().toISOString()
      };

      packetsSent++;

      // Progress animation
      for (let prog = 25; prog <= 100; prog += 25) {
        dataPacket.progressPercent = prog;
        this.recordPacket(dataPacket);
        await sleep(Math.floor(baseDelay / 4));
      }

      if (isLost) {
        packetsLost++;
        dataPacket.status = 'LOST';
        this.recordPacket(dataPacket);

        const lostEvent: SimulationEvent = {
          simulationId: simId,
          transactionId,
          eventType: 'PACKET_LOST',
          sourceNodeId: hopSrc.id,
          destNodeId: hopDst.id,
          hopNumber: i + 1,
          description: `[DROPPED] Packet lost on Link [${hopSrc.nodeKey} -> ${hopDst.nodeKey}]. Simulated transmission impairment at ${(linkLossRate * 100).toFixed(1)}% loss rate.`,
          latencyMs: hopLatency,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        };
        await this.recordAndEmitEvent(lostEvent);
        await sleep(baseDelay * 2);

        // Educational TCP Retransmission (ARQ)
        retransmissions++;
        packetsSent++;

        const rtxPacket: SimulationPacket = {
          ...dataPacket,
          id: `PKT-${transactionId}-HOP-${i + 1}-R1`,
          status: 'RETRANSMITTED',
          createdAt: new Date().toISOString()
        };
        this.recordPacket(rtxPacket);

        const rtxEvent: SimulationEvent = {
          simulationId: simId,
          transactionId,
          eventType: 'PACKET_RETRANSMITTED',
          sourceNodeId: hopSrc.id,
          destNodeId: hopDst.id,
          hopNumber: i + 1,
          description: `[RTX] TCP Retransmission Timer fired (timeout 2x RTT). Retransmitting Sequence #${seqNo} to ${hopDst.nodeKey}.`,
          latencyMs: hopLatency * 2,
          severity: 'WARNING',
          timestamp: new Date().toISOString()
        };
        await this.recordAndEmitEvent(rtxEvent);
        accumulatedLatency += hopLatency * 2;
        await sleep(baseDelay * 2);
      }

      // Forwarded successfully
      dataPacket.status = 'DELIVERED';
      dataPacket.currentNodeId = hopDst.id;
      packetsDelivered++;
      totalBytesDelivered += 512;
      this.recordPacket(dataPacket);

      const hopEvent: SimulationEvent = {
        simulationId: simId,
        transactionId,
        eventType: 'PACKET_HOP_FORWARDED',
        sourceNodeId: hopSrc.id,
        destNodeId: hopDst.id,
        hopNumber: i + 1,
        description: `Hop #${i + 1}: Frame forwarded from ${hopSrc.name} (${hopSrc.macAddress}) to ${hopDst.name} (${hopDst.macAddress}). TTL: ${64 - i - 1}.`,
        latencyMs: hopLatency,
        severity: 'INFO',
        timestamp: new Date().toISOString(),
        metadata: {
          ttlRemaining: 64 - i - 1,
          srcMac: hopSrc.macAddress,
          dstMac: hopDst.macAddress,
          natApplied: hopSrc.nodeType === 'BRANCH_ROUTER' && hopDst.nodeType === 'REGIONAL_HUB'
        }
      };
      await this.recordAndEmitEvent(hopEvent);
      await sleep(baseDelay);
    }

    // 4. Final Delivery & Ledger Write
    const completionEvent: SimulationEvent = {
      simulationId: simId,
      transactionId,
      eventType: 'PACKET_DELIVERED',
      sourceNodeId: dstNode.id,
      destNodeId: srcNode.id,
      hopNumber: route.hopCount,
      description: `[DELIVERED] Final delivery confirmed at destination [${dstNode.name}]. TCP ACK #${seqNo + 512} received. Ledger write finalized.`,
      latencyMs: accumulatedLatency,
      severity: 'SUCCESS',
      timestamp: new Date().toISOString(),
      metadata: { totalLatency: accumulatedLatency, packetsSent, packetsLost, retransmissions }
    };
    await this.recordAndEmitEvent(completionEvent);

    // Update global metrics
    this.metrics.packetsSent += packetsSent;
    this.metrics.packetsDelivered += packetsDelivered;
    this.metrics.packetsLost += packetsLost;
    this.metrics.retransmissions += retransmissions;
    this.metrics.successfulTransactions++;
    this.metrics.activeTransactions = Math.max(0, this.metrics.activeTransactions - 1);

    this.metrics.packetLossPercentage = this.metrics.packetsSent > 0
      ? parseFloat(((this.metrics.packetsLost / this.metrics.packetsSent) * 100).toFixed(2))
      : 0;

    this.metrics.transactionSuccessRate = this.metrics.totalTransactions > 0
      ? parseFloat(((this.metrics.successfulTransactions / this.metrics.totalTransactions) * 100).toFixed(1))
      : 100;

    if (accumulatedLatency > 0) {
      this.cumulativeLatencyMs += accumulatedLatency;
      this.metrics.averageLatencyMs = parseFloat((this.cumulativeLatencyMs / this.metrics.successfulTransactions).toFixed(1));
      this.metrics.averageRttMs = parseFloat((this.metrics.averageLatencyMs * 2).toFixed(1));
    }

    this.cumulativeBytesDelivered += totalBytesDelivered;
    const elapsedSeconds = Math.max(1, (Date.now() - this.simulationStartTime) / 1000);
    this.metrics.throughputKbps = parseFloat(((this.cumulativeBytesDelivered * 8) / (elapsedSeconds * 1000)).toFixed(1));
    this.metrics.lastUpdated = new Date().toISOString();

    session.status = 'COMPLETED';
    session.packetsDelivered = packetsDelivered;
    session.packetsSent = packetsSent;
    session.packetsLost = packetsLost;
    session.retransmissions = retransmissions;
    session.totalBytesDelivered = totalBytesDelivered;
    session.averageLatencyMs = accumulatedLatency;
    session.averageRttMs = accumulatedLatency * 2;
    session.completedAt = new Date().toISOString();

    SocketManager.emitMetrics(this.metrics);

    return {
      success: true,
      totalLatencyMs: accumulatedLatency,
      packetsTransmitted: packetsSent,
      packetsLost,
      retransmissions
    };
  }

  private static async recordAndEmitEvent(event: SimulationEvent): Promise<void> {
    SocketManager.emitSimulationEvent(event);

    try {
      const sql = `
        INSERT INTO network_events (transaction_id, event_type, source_node_id, dest_node_id, hop_number, protocol, payload_summary, latency_ms, severity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await executeQuery(sql, [
        event.transactionId || null,
        event.eventType,
        event.sourceNodeId || null,
        event.destNodeId || null,
        event.hopNumber || 0,
        'TCP',
        event.description,
        event.latencyMs || 0,
        event.severity
      ]);
    } catch (err) {
      console.error('Error logging network event:', err);
    }
  }

  private static recordPacket(packet: SimulationPacket): void {
    SocketManager.emitPacketUpdate(packet);
  }
}




