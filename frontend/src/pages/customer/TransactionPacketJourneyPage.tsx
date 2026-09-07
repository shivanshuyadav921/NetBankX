import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { TopologyMap } from '../../components/network/TopologyMap';
import { OSIPacketInspector } from '../../components/network/OSIPacketInspector';
import { RouteAnalysisPanel } from '../../components/network/RouteAnalysisPanel';
import { ApiClient } from '../../services/api';
import { getSocket } from '../../services/socket';
import { SimulationPacket, SimulationSession } from '../../types';
import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Layers,
  Network,
  Clock,
  Activity,
  Info,
  AlertTriangle
} from 'lucide-react';

export const TransactionPacketJourneyPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [journeyData, setJourneyData] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<SimulationSession | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<SimulationPacket | null>(null);
  const [activePackets, setActivePackets] = useState<SimulationPacket[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [speed] = useState<number>(1);

  // Load journey data from backend
  const fetchJourney = async () => {
    if (!transactionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ApiClient.getTransactionJourney(transactionId);
      setJourneyData(data);
      if (data.session) {
        setActiveSession(data.session);
        if (data.session.packets && data.session.packets.length > 0) {
          setActivePackets(data.session.packets);
          setSelectedPacket(data.session.packets[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load transaction journey:', err);
      setError(err.message || 'Transaction journey not found or simulation expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, [transactionId]);

  // Listen to Socket.IO simulation events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handlePacketEvent = (data: any) => {
      if (activeSession && data.simulationId && data.simulationId !== activeSession.id) {
        return;
      }

      setTimelineEvents(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          event: data.type || data.status || 'EVENT',
          details: data.details || `Packet ${data.packetId || ''} hop ${data.currentNode || ''} -> ${data.nextHop || ''}`,
          status: data.status
        },
        ...prev.slice(0, 49)
      ]);

      if (data.packet) {
        setActivePackets(prev => {
          const idx = prev.findIndex(p => p.id === data.packet.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...data.packet };
            return next;
          }
          return [...prev, data.packet];
        });

        if (!selectedPacket || selectedPacket.id === data.packet.id) {
          setSelectedPacket(data.packet);
        }
      }
    };

    const handleSessionCompleted = (data: any) => {
      if (activeSession && data.simulationId === activeSession.id) {
        setActiveSession(prev => prev ? { ...prev, status: 'COMPLETED', metrics: data.metrics } : null);
      }
    };

    socket.on('packet:event', handlePacketEvent);
    socket.on('simulation:event', handlePacketEvent);
    socket.on('simulation:completed', handleSessionCompleted);

    return () => {
      socket.off('packet:event', handlePacketEvent);
      socket.off('simulation:event', handlePacketEvent);
      socket.off('simulation:completed', handleSessionCompleted);
    };
  }, [activeSession, selectedPacket]);

  const handleReplay = async () => {
    if (!journeyData?.transaction) return;
    try {
      const resp = await ApiClient.startTrafficSimulation({
        sourceNodeId: journeyData.sourceNodeId || 'NODE-BR-MH01',
        destinationNodeId: journeyData.destinationNodeId || 'NODE-BR-KA01',
        packetCount: 3,
        packetSizeBytes: 512,
        protocol: 'TCP',
        speedMultiplier: speed,
        scenario: 'NORMAL',
        relatedTransactionId: transactionId
      });
      if (resp.session) {
        setActiveSession(resp.session);
        setActivePackets(resp.session.packets || []);
        if (resp.session.packets && resp.session.packets.length > 0) {
          setSelectedPacket(resp.session.packets[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to replay journey:', err);
    }
  };

  const currentRoute = journeyData?.route?.path || activeSession?.route?.path || [
    'NODE-BR-MH01',
    'NODE-MH-HUB',
    'NODE-HQ-CORE',
    'NODE-KA-HUB',
    'NODE-BR-KA01'
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-luxury-bg min-h-screen">
        <Header
          title="Transaction Network Journey"
          subtitle="Loading authoritative packet path..."
        />
        <div className="p-12 text-center text-luxury-slate font-mono text-sm flex items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Resolving transaction topology path & session state...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-luxury-bg min-h-screen">
      <Header
        title="Transaction Network Journey & Packet Visualizer"
        subtitle="Authoritative server-side packet path correlation for financial transaction"
      />

      <div className="p-6 lg:p-8 space-y-6 flex-1">
        {error && (
          <div className="p-4 rounded-xl bg-luxury-burgundyBg border border-luxury-burgundyBorder text-luxury-burgundy text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Navigation & Distinction Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-luxury-surface border border-luxury-border text-luxury-textSecondary hover:text-luxury-text hover:border-luxury-borderStrong transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-luxury-slateLight border border-luxury-borderSubtle text-luxury-slate font-bold">
                  TX ID: {transactionId || 'TX-UNKNOWN'}
                </span>
                {activeSession && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-luxury-subtle border border-luxury-borderSubtle text-luxury-leather">
                    SIM: {activeSession.id}
                  </span>
                )}
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-luxury-forestBg border border-luxury-forestBorder text-luxury-forest font-bold">
                  Dijkstra Dynamic Route
                </span>
              </div>
              <h2 className="text-lg font-bold text-luxury-text mt-1">
                Banking Transaction Packet Journey Trace
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReplay}
              className="px-3.5 py-2 rounded-lg bg-luxury-slate hover:bg-luxury-slateHover text-white text-xs font-bold flex items-center gap-1.5 shadow-luxury-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replay Packet Journey</span>
            </button>
            <Link
              to="/hq/traffic-simulator"
              className="px-3.5 py-2 rounded-lg bg-luxury-surface hover:bg-luxury-surfaceHover border border-luxury-border text-luxury-textSecondary hover:text-luxury-text text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Network className="w-3.5 h-3.5 text-luxury-leather" />
              <span>Open Network Lab Simulator</span>
            </Link>
          </div>
        </div>

        {/* Dual-Layer Educational Notice */}
        <div className="p-4 rounded-xl bg-luxury-surface border border-luxury-borderSubtle shadow-luxury-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-luxury-slateLight border border-luxury-borderSubtle text-luxury-slate flex-shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-bold text-luxury-text">Dual-Layer Architecture Demonstration</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-luxury-textSecondary pt-1">
                <div className="p-2.5 rounded-lg bg-luxury-subtle border border-luxury-borderSubtle">
                  <div className="font-mono font-bold text-luxury-forest flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-luxury-forest" />
                    Layer A: Real Application Traffic
                  </div>
                  <p className="text-[11px] text-luxury-textMuted">
                    Chrome Browser → HTTPS (TLS 1.3) → Node.js / Express API → PostgreSQL Double-Entry Ledger (ACID Transaction Complete).
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-luxury-subtle border border-luxury-borderSubtle">
                  <div className="font-mono font-bold text-luxury-slate flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-luxury-slate" />
                    Layer B: Simulated Enterprise WAN Digital Twin
                  </div>
                  <p className="text-[11px] text-luxury-textMuted">
                    Customer A Terminal → Mumbai Branch Router → MH Regional Gateway → HQ Core Router → KA Regional Gateway → Bengaluru Branch Router → Customer B.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Summary Card */}
        {journeyData?.transaction && (
          <div className="luxury-card p-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 font-mono text-xs">
              <div>
                <span className="text-[10px] text-luxury-textMuted uppercase block">Transfer Amount</span>
                <span className="text-lg font-bold text-luxury-leather">
                  ₹ {Number(journeyData.transaction.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-luxury-textMuted uppercase block">Source Account</span>
                <span className="font-bold text-luxury-text">{journeyData.transaction.sourceAccount || 'ACC-100001'}</span>
                <span className="text-[10px] text-luxury-textMuted block">{journeyData.sourceBranch?.name || 'Mumbai Main Branch'}</span>
              </div>
              <div>
                <span className="text-[10px] text-luxury-textMuted uppercase block">Destination Account</span>
                <span className="font-bold text-luxury-text">{journeyData.transaction.destinationAccount || 'ACC-100003'}</span>
                <span className="text-[10px] text-luxury-textMuted block">{journeyData.destBranch?.name || 'Bengaluru Tech Branch'}</span>
              </div>
              <div>
                <span className="text-[10px] text-luxury-textMuted uppercase block">Ledger Status</span>
                <span className="inline-flex items-center gap-1 font-bold text-luxury-forest">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {journeyData.transaction.state || 'COMPLETED'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-luxury-textMuted uppercase block">Correlation Trace</span>
                <span className="text-luxury-slate font-bold block">{currentRoute.length - 1} WAN Hops</span>
                <span className="text-[10px] text-luxury-textMuted block">Dijkstra Cost: {journeyData?.route?.totalCost || 23}</span>
              </div>
            </div>
          </div>
        )}

        {/* Middle: Live Topology Map + Route Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Network Canvas (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="luxury-card p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-luxury-borderSubtle">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-luxury-leather" />
                  <h3 className="font-bold text-luxury-text text-sm">Simulated Enterprise Network Topology</h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-luxury-textMuted">Active Packets:</span>
                  <span className="px-2 py-0.5 rounded bg-luxury-slateLight text-luxury-slate font-bold">
                    {activePackets.length}
                  </span>
                </div>
              </div>

              <TopologyMap
                highlightPath={currentRoute}
                packets={activePackets}
                onPacketSelect={packet => setSelectedPacket(packet)}
                selectedPacketId={selectedPacket?.id}
                height={460}
              />
            </div>

            {/* Packets Strip */}
            {activePackets.length > 0 && (
              <div className="luxury-card p-4">
                <div className="text-xs font-bold text-luxury-text mb-2 flex items-center justify-between">
                  <span>In-Flight / Delivered Simulation Packets</span>
                  <span className="text-[11px] text-luxury-textMuted font-mono">Click a packet to inspect OSI layers</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activePackets.map(pkt => {
                    const isSel = selectedPacket?.id === pkt.id;
                    return (
                      <button
                        key={pkt.id}
                        onClick={() => setSelectedPacket(pkt)}
                        className={`p-3 rounded-lg border text-left font-mono text-xs transition-all ${
                          isSel
                            ? 'bg-luxury-slateLight border-luxury-slate text-luxury-text shadow-luxury-sm'
                            : 'bg-luxury-subtle border-luxury-borderSubtle text-luxury-textSecondary hover:border-luxury-border hover:text-luxury-text'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-luxury-leather">{pkt.id}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                            pkt.status === 'DELIVERED'
                              ? 'bg-luxury-forestBg text-luxury-forest'
                              : pkt.status === 'LOST'
                              ? 'bg-luxury-burgundyBg text-luxury-burgundy'
                              : 'bg-luxury-slateLight text-luxury-slate'
                          }`}>
                            {pkt.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-luxury-textMuted">
                          Hop {pkt.hopIndex + 1} of {pkt.totalHops} ({pkt.currentNode})
                        </div>
                        <div className="text-[10px] text-luxury-textMuted mt-1">
                          Seq: {pkt.sequenceNumber} | Latency: {pkt.latencyMs}ms
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Route Analysis & Metrics (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <RouteAnalysisPanel
              routePath={currentRoute}
              sourceBranchName={journeyData?.sourceBranch?.name || 'Mumbai Main Branch'}
              destBranchName={journeyData?.destBranch?.name || 'Bengaluru Tech Branch'}
              totalCost={journeyData?.route?.totalCost || 23}
              estimatedLatencyMs={journeyData?.route?.estimatedLatencyMs || 24}
              algorithm="Dijkstra Shortest Path"
              status="ACTIVE_FORWARDING"
            />

            {/* Live Timeline */}
            <div className="luxury-card p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-luxury-borderSubtle">
                <Clock className="w-4 h-4 text-luxury-slate" />
                <h4 className="font-bold text-luxury-text text-xs uppercase tracking-wider">
                  Authoritative Event Stream
                </h4>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-[11px] pr-1">
                {timelineEvents.length === 0 ? (
                  <div className="text-luxury-textMuted italic py-4 text-center">
                    Awaiting network events...
                  </div>
                ) : (
                  timelineEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-luxury-subtle border border-luxury-borderSubtle flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-luxury-slate">{evt.event}</div>
                        <div className="text-luxury-textMuted text-[10px]">{evt.details}</div>
                      </div>
                      <span className="text-[9px] text-luxury-textMuted flex-shrink-0">{evt.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Deep-Dive 7-Layer OSI Packet Inspector */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-luxury-leather" />
            <h3 className="font-bold text-luxury-text text-sm">
              7-Layer OSI Encapsulation & Hop Inspection
            </h3>
          </div>
          <OSIPacketInspector packet={selectedPacket} />
        </div>
      </div>
    </div>
  );
};
