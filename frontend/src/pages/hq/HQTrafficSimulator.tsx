import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { TopologyMap } from '../../components/network/TopologyMap';
import { OSIPacketInspector } from '../../components/network/OSIPacketInspector';
import { RouteAnalysisPanel } from '../../components/network/RouteAnalysisPanel';
import { EventTimeline } from '../../components/lab/EventTimeline';
import { ApiClient } from '../../services/api';
import { getSocket } from '../../services/socket';
import { SimulationPacket, SimulationSession, CalculatedRoute, SimulationEvent } from '../../types';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Sliders,
  Radio,
  CheckCircle2,
  Flame
} from 'lucide-react';

export const HQTrafficSimulator: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [sourceBranchId, setSourceBranchId] = useState<string>('');
  const [destBranchId, setDestBranchId] = useState<string>('');
  const [packetCount, setPacketCount] = useState<number>(20);
  const [packetSize, setPacketSize] = useState<number>(512);
  const [protocol, setProtocol] = useState<'TCP' | 'UDP'>('TCP');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [selectedScenario, setSelectedScenario] = useState<string>('NORMAL');

  const [activeSession, setActiveSession] = useState<SimulationSession | null>(null);
  const [calculatedRoute, setCalculatedRoute] = useState<CalculatedRoute | null>(null);
  const [packets, setPackets] = useState<SimulationPacket[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<SimulationPacket | null>(null);
  const [simulationEvents, setSimulationEvents] = useState<SimulationEvent[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load branches
  useEffect(() => {
    async function loadData() {
      try {
        const brs = await ApiClient.getBranches();
        if (brs && brs.length > 0) {
          setBranches(brs);
          // Default to Inter-Regional National Backbone: Mumbai (MH) -> Bengaluru (KA)
          const defaultSrc = brs.find((b: any) => b.code === 'MUM01' || b.id === 'MH-MUM-001') || brs[0];
          const defaultDst = brs.find((b: any) => b.code === 'BLR01' || b.id === 'KA-BLR-001') || 
                             brs.find((b: any) => b.region_id !== defaultSrc.region_id) || 
                             (brs.length > 1 ? brs[1] : brs[0]);
          setSourceBranchId(defaultSrc.id);
          setDestBranchId(defaultDst.id);
        }
      } catch (err) {
        console.error('Error loading branches:', err);
      }
    }
    loadData();
  }, []);

  // Compute Dijkstra route when endpoints change
  useEffect(() => {
    async function updateRoute() {
      if (!sourceBranchId || !destBranchId) return;
      try {
        const topology = await ApiClient.getTopology();
        const srcNode = topology.nodes.find((n: any) => n.branchId === sourceBranchId);
        const dstNode = topology.nodes.find((n: any) => n.branchId === destBranchId);
        if (srcNode && dstNode) {
          const route = await ApiClient.calculateRoute(srcNode.id, dstNode.id);
          setCalculatedRoute(route);
        }
      } catch (err) {
        console.error('Route calculation error:', err);
      }
    }
    updateRoute();
  }, [sourceBranchId, destBranchId]);

  // Real-time socket event listener for multi-packet animation
  useEffect(() => {
    const socket = getSocket();

    const handlePacket = (packet: SimulationPacket) => {
      setPackets(prev => {
        const existingIdx = prev.findIndex(p => p.id === packet.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = packet;
          return updated;
        }
        return [...prev.slice(-40), packet];
      });

      if (selectedPacket?.id === packet.id) {
        setSelectedPacket(packet);
      }
    };

    const handleEvent = (event: SimulationEvent) => {
      setSimulationEvents(prev => [event, ...prev.slice(0, 99)]);

      if (event.eventType === 'SIMULATION_COMPLETED' || event.eventType === 'SIMULATION_ABORTED') {
        setIsRunning(false);
        setIsPaused(false);
        if (event.eventType === 'SIMULATION_COMPLETED') {
          setShowSummaryModal(true);
        }
      } else if (event.eventType === 'DYNAMIC_FAILOVER_TRIGGERED') {
        // Update active route dynamically if failover occurred
        ApiClient.getTopology().then(async (top: any) => {
          const srcNode = top.nodes.find((n: any) => n.branchId === sourceBranchId);
          const dstNode = top.nodes.find((n: any) => n.branchId === destBranchId);
          if (srcNode && dstNode) {
            const newRoute = await ApiClient.calculateRoute(srcNode.id, dstNode.id);
            setCalculatedRoute(newRoute);
          }
        });
      }
    };

    socket.on('simulation:packet', handlePacket);
    socket.on('simulation:event', handleEvent);

    return () => {
      socket.off('simulation:packet', handlePacket);
      socket.off('simulation:event', handleEvent);
    };
  }, [selectedPacket, sourceBranchId, destBranchId]);

  // Preset scenarios handler
  const handleScenarioChange = (scen: string) => {
    setSelectedScenario(scen);
    if (scen === 'PACKET_LOSS' || scen === 'DEMO_PACKET_LOSS') {
      setPacketCount(20);
      setProtocol('TCP');
    } else if (scen === 'HIGH_LATENCY') {
      setSpeedMultiplier(0.5);
    } else if (scen === 'BURST_TRAFFIC') {
      setPacketCount(40);
      setSpeedMultiplier(2.0);
    }
  };

  // Start Simulation
  const handleStartSimulation = async () => {
    try {
      setIsRunning(true);
      setIsPaused(false);
      setPackets([]);
      setSelectedPacket(null);
      setSimulationEvents([]);
      setShowSummaryModal(false);
      setErrorMessage(null);

      const session = await ApiClient.simulateTraffic({
        sourceBranchId,
        destBranchId,
        packetCount,
        packetSizeBytes: packetSize,
        protocol,
        speedMultiplier,
        scenario: selectedScenario
      });

      setActiveSession(session);
      if (session?.route) {
        setCalculatedRoute(session.route);
      }
    } catch (err: any) {
      console.error('Failed to start traffic simulation:', err);
      setIsRunning(false);
      setErrorMessage(`Simulation failed: ${err.message || 'Unable to start simulation session'}`);
    }
  };

  // Pause / Resume / Stop
  const handlePauseToggle = async () => {
    if (!activeSession) return;
    const nextAction = isPaused ? 'RESUME' : 'PAUSE';
    await ApiClient.controlSimulation(activeSession.id, nextAction);
    setIsPaused(!isPaused);
  };

  const handleStopSimulation = async () => {
    if (!activeSession) return;
    await ApiClient.controlSimulation(activeSession.id, 'ABORT');
    setIsRunning(false);
    setIsPaused(false);
  };

  const handleResetTopology = async () => {
    await ApiClient.resetTopology();
    setPackets([]);
    setSelectedPacket(null);
    if (sourceBranchId && destBranchId) {
      const top = await ApiClient.getTopology();
      const srcNode = top.nodes.find((n: any) => n.branchId === sourceBranchId);
      const dstNode = top.nodes.find((n: any) => n.branchId === destBranchId);
      if (srcNode && dstNode) {
        const route = await ApiClient.calculateRoute(srcNode.id, dstNode.id);
        setCalculatedRoute(route);
      }
    }
  };

  // Quick Mid-Flight Failure Triggers (for Demo C & D)
  const handleFailHQCore = async () => {
    const top = await ApiClient.getTopology();
    const hqCore = top.nodes.find((n: any) => n.nodeType === 'HQ_CORE');
    if (hqCore) {
      await ApiClient.setNodeStatus(hqCore.id, hqCore.status === 'OFFLINE' ? 'HEALTHY' : 'OFFLINE');
    }
  };

  const handleSeverLink = async () => {
    const top = await ApiClient.getTopology();
    if (top.links && top.links.length > 0) {
      const activeLink = top.links.find((l: any) => l.status === 'ACTIVE');
      if (activeLink) {
        await ApiClient.setLinkStatus(activeLink.id, 'SEVERED');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-luxury-bg">
      <Header
        title="Computer Networks Laboratory · Branch-to-Branch Traffic Simulator"
        subtitle="Educational multi-packet transmission, graph-based Dijkstra routing, dynamic failover rerouting & 7-layer OSI encapsulation inspection"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetTopology}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-luxury-surface border border-luxury-border text-luxury-textSecondary hover:bg-luxury-surfaceHover hover:text-luxury-text transition-colors shadow-luxury-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Topology</span>
            </button>
          </div>
        }
      />

      <div className="p-8 space-y-8 flex-1 max-w-7xl mx-auto w-full">
        {/* Educational Layer Paradigm Callout */}
        <div className="luxury-card p-4 border-l-4 border-l-luxury-slate flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-luxury-slate uppercase tracking-wider mb-0.5">
              <Radio className="w-4 h-4 text-luxury-leather" />
              <span>Two-Layer Architecture Principle</span>
            </div>
            <p className="text-xs text-luxury-textSecondary max-w-3xl">
              <strong>Real Application Traffic</strong> (Browser → HTTPS REST API → Database) is separate from the <strong>Simulated Enterprise WAN Digital Twin</strong> (Customer Branch → Regional Hub → HQ Core → Destination Branch). The simulation below models enterprise network packets mathematically and authoritative hop-by-hop events in real time.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded bg-luxury-surfaceControl border border-luxury-borderStrong text-luxury-text text-[11px] font-mono font-bold">
              Dijkstra SPF Active
            </span>
            <span className="px-2.5 py-1 rounded bg-luxury-successBg text-luxury-forest border border-luxury-successBorder text-[11px] font-mono font-bold">
              Socket.IO Live
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-luxury-dangerBg border border-luxury-dangerBorder text-luxury-burgundy text-xs flex items-center justify-between font-mono">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-luxury-burgundy font-bold hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Control Panel & Scenario Presets */}
        <div className="luxury-card p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-luxury-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-luxury-surfaceControl border border-luxury-border text-luxury-slate">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-luxury-text text-sm">Traffic Generator Configuration</h3>
                <p className="text-xs text-luxury-textMuted">Configure branch endpoints, protocol headers, packet count & impairment scenarios</p>
              </div>
            </div>

            {/* Simulation Action Buttons */}
            <div className="flex items-center gap-2">
              {!isRunning ? (
                <button
                  onClick={handleStartSimulation}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-luxury-slate text-luxury-bg hover:bg-luxury-slateDark font-semibold text-xs transition-all shadow-luxury-md active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Network Simulation</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePauseToggle}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-luxury-surfaceControl border border-luxury-borderStrong text-luxury-text hover:bg-luxury-surfaceHover font-semibold text-xs transition-all"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={handleStopSimulation}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-luxury-burgundyBg text-luxury-burgundy border border-luxury-burgundyBorder hover:bg-luxury-burgundy hover:text-white font-semibold text-xs transition-all"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick National Trunk Presets Bar */}
          <div className="space-y-1.5 font-sans">
            <div className="text-[11px] font-bold text-luxury-textMuted uppercase tracking-wider">
              Quick National WAN Trunk Presets (Multi-Hop Routing)
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              {[
                { label: '🚀 Mumbai → Bengaluru (National 4-Hop Trunk)', srcCode: 'MUM01', dstCode: 'BLR01' },
                { label: '🚀 Delhi → Bengaluru (North-South Trunk)', srcCode: 'NDL01', dstCode: 'BLR01' },
                { label: '🚀 Mumbai → Delhi (West-North Trunk)', srcCode: 'MUM01', dstCode: 'NDL01' },
                { label: '📍 Mumbai → Nagpur (Intra-State Mesh)', srcCode: 'MUM01', dstCode: 'NGP01' }
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    const src = branches.find(b => b.code === preset.srcCode);
                    const dst = branches.find(b => b.code === preset.dstCode);
                    if (src) setSourceBranchId(src.id);
                    if (dst) setDestBranchId(dst.id);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-luxury-subtle hover:bg-luxury-surfaceHover border border-luxury-borderSubtle text-luxury-textSecondary hover:text-luxury-text text-[11px] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            {/* Source Branch */}
            <div className="space-y-1.5">
              <label className="text-luxury-textMuted font-sans block text-[11px] font-semibold">SOURCE BRANCH</label>
              <select
                value={sourceBranchId}
                onChange={e => setSourceBranchId(e.target.value)}
                disabled={isRunning}
                className="w-full p-2.5 rounded-lg bg-luxury-surfaceControl border border-luxury-border text-luxury-text focus:border-luxury-slate outline-none disabled:opacity-50"
              >
                <optgroup label="📍 Maharashtra Region (MH)">
                  {branches.filter(b => b.region_id === 'MH' || b.id.startsWith('MH')).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="📍 Delhi NCR Region (DL)">
                  {branches.filter(b => b.region_id === 'DL' || b.id.startsWith('DL')).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="📍 Karnataka Region (KA)">
                  {branches.filter(b => b.region_id === 'KA' || b.id.startsWith('KA')).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Destination Branch */}
            <div className="space-y-1.5">
              <label className="text-luxury-textMuted font-sans block text-[11px] font-semibold">DESTINATION BRANCH</label>
              <select
                value={destBranchId}
                onChange={e => setDestBranchId(e.target.value)}
                disabled={isRunning}
                className="w-full p-2.5 rounded-lg bg-luxury-surfaceControl border border-luxury-border text-luxury-text focus:border-luxury-slate outline-none disabled:opacity-50"
              >
                <optgroup label="📍 Karnataka Region (KA)">
                  {branches.filter(b => b.region_id === 'KA' || b.id.startsWith('KA')).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="📍 Delhi NCR Region (DL)">
                  {branches.filter(b => b.region_id === 'DL' || b.id.startsWith('DL')).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="📍 Maharashtra Region (MH)">
                  {branches.filter(b => b.region_id === 'MH' || b.id.startsWith('MH')).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Packet Count & MTU */}
            <div className="space-y-1.5">
              <label className="text-luxury-textMuted font-sans block text-[11px] font-semibold">PACKET COUNT & MTU</label>
              <div className="flex gap-2">
                <select
                  value={packetCount}
                  onChange={e => setPacketCount(parseInt(e.target.value, 10))}
                  disabled={isRunning}
                  className="flex-1 p-2.5 rounded-lg bg-luxury-surfaceControl border border-luxury-border text-luxury-text focus:border-luxury-slate outline-none disabled:opacity-50"
                >
                  {[5, 10, 20, 30, 50].map(c => (
                    <option key={c} value={c}>{c} Packets</option>
                  ))}
                </select>
                <select
                  value={packetSize}
                  onChange={e => setPacketSize(parseInt(e.target.value, 10))}
                  disabled={isRunning}
                  className="flex-1 p-2.5 rounded-lg bg-luxury-surfaceControl border border-luxury-border text-luxury-text focus:border-luxury-slate outline-none disabled:opacity-50"
                >
                  {[128, 256, 512, 1024, 1500].map(s => (
                    <option key={s} value={s}>{s}B</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Protocol & Speed */}
            <div className="space-y-1.5">
              <label className="text-luxury-textMuted font-sans block text-[11px] font-semibold">PROTOCOL & SPEED</label>
              <div className="flex gap-2">
                <select
                  value={protocol}
                  onChange={e => setProtocol(e.target.value as any)}
                  disabled={isRunning}
                  className="flex-1 p-2.5 rounded-lg bg-luxury-surfaceControl border border-luxury-border text-luxury-text focus:border-luxury-slate outline-none disabled:opacity-50 font-bold"
                >
                  <option value="TCP">TCP (ARQ)</option>
                  <option value="UDP">UDP (Stream)</option>
                </select>
                <select
                  value={speedMultiplier}
                  onChange={e => setSpeedMultiplier(parseFloat(e.target.value))}
                  className="flex-1 p-2.5 rounded-lg bg-luxury-surfaceControl border border-luxury-border text-luxury-text focus:border-luxury-slate outline-none font-bold"
                >
                  <option value={0.25}>0.25x Ultra Slow</option>
                  <option value={0.5}>0.5x Slow Motion</option>
                  <option value={1.0}>1.0x Normal</option>
                  <option value={2.0}>2.0x Fast</option>
                  <option value={5.0}>5.0x High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preset Scenarios Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-luxury-textMuted font-sans text-[11px] font-bold uppercase tracking-wider">
                Preset Network Condition & Demonstration Scenarios
              </label>
              <span className="text-[11px] text-luxury-slate font-mono">
                Active Scenario: <strong>{selectedScenario}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 font-mono text-[11px]">
              {[
                { id: 'NORMAL', label: 'Normal Clean', desc: '0% Loss · 1x Latency' },
                { id: 'PACKET_LOSS', label: 'Loss & RTX', desc: '20% Drop · TCP ARQ' },
                { id: 'HIGH_LATENCY', label: 'High Latency', desc: '3x Propagation delay' },
                { id: 'CONGESTION', label: 'WAN Congestion', desc: '4.5x Jitter + Loss' },
                { id: 'BURST_TRAFFIC', label: 'Burst Flow', desc: '40 Concurrent Packets' },
                { id: 'DEMO_FAILOVER', label: 'Dijkstra Failover', desc: 'Mid-flight Rerouting' }
              ].map(scen => (
                <button
                  key={scen.id}
                  onClick={() => handleScenarioChange(scen.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedScenario === scen.id
                      ? 'bg-luxury-slate/20 border-luxury-slate text-luxury-text shadow-luxury-sm'
                      : 'bg-luxury-surfaceControl border-luxury-border text-luxury-textMuted hover:text-luxury-text hover:bg-luxury-surfaceHover'
                  }`}
                >
                  <div className="font-bold text-luxury-text truncate">{scen.label}</div>
                  <div className="text-[9px] text-luxury-textSecondary mt-0.5">{scen.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mid-Flight Fault Injection Controls (for live classroom demos) */}
          <div className="p-3 rounded-lg bg-luxury-surfaceControl border border-luxury-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-luxury-textSecondary">
              <Flame className="w-4 h-4 text-luxury-amber" />
              <span><strong>Live Fault Impairment & Failover Lab:</strong> Toggle router status or sever links to demonstrate instant Dijkstra path recalculation:</span>
            </div>
            <div className="flex items-center gap-2 font-sans flex-wrap">
              <button
                onClick={handleFailHQCore}
                className="px-3 py-1.5 rounded bg-luxury-burgundyBg border border-luxury-burgundyBorder text-luxury-burgundy hover:bg-luxury-burgundy hover:text-white text-xs font-semibold transition-colors"
              >
                🚫 Toggle HQ Core Router
              </button>
              <button
                onClick={handleSeverLink}
                className="px-3 py-1.5 rounded bg-luxury-amberBg border border-luxury-amberBorder text-luxury-amber hover:bg-luxury-amber hover:text-white text-xs font-semibold transition-colors"
              >
                ✂️ Sever Active WAN Link
              </button>
              <button
                onClick={handleResetTopology}
                className="px-3 py-1.5 rounded bg-luxury-forestBg border border-luxury-forestBorder text-luxury-forest hover:bg-luxury-forest hover:text-white text-xs font-semibold transition-colors"
              >
                🔗 Reconnect All Links (Reset)
              </button>
            </div>
          </div>
        </div>

        {/* 2. Real-Time Topology Map Canvas with Multiple Moving Packets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-luxury-text text-sm">Active Network Topology & Dynamic Packet Flows</h3>
              <p className="text-xs text-luxury-textMuted">
                Packets travel hop-by-hop along calculated Dijkstra paths. Click any moving packet to inspect full 7-Layer OSI frame headers.
              </p>
            </div>
            {packets.length > 0 && (
              <div className="flex items-center gap-2 font-mono text-xs text-luxury-textSecondary">
                <span className="w-2 h-2 rounded-full bg-luxury-slateSubtle animate-ping" />
                <span>Active Packets in Flight: <strong>{packets.filter(p => p.status === 'TRANSMITTING').length}</strong></span>
              </div>
            )}
          </div>

          <TopologyMap
            height={480}
            highlightPath={calculatedRoute?.path}
            packets={packets}
            onSelectPacket={pkt => setSelectedPacket(pkt)}
            onPacketSelect={pkt => setSelectedPacket(pkt)}
            selectedPacketId={selectedPacket?.id}
          />
        </div>

        {/* 3. Real-Time Packet Inspector & Route Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <OSIPacketInspector packet={selectedPacket || (packets.length > 0 ? packets[packets.length - 1] : null)} />
            <RouteAnalysisPanel route={calculatedRoute} nodes={branches} />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <EventTimeline />
            {simulationEvents.length > 0 && (
              <div className="text-[10px] font-mono text-luxury-textMuted text-right px-2">
                Simulated Events Logged: {simulationEvents.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simulation Summary Modal */}
      {showSummaryModal && activeSession && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="luxury-card p-6 max-w-lg w-full space-y-5 border-2 border-luxury-slate shadow-luxury-lg animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-luxury-border pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-luxury-forest" />
                <h3 className="font-bold text-luxury-text text-base">Network Simulation Completed</h3>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-luxury-textMuted hover:text-luxury-text text-sm p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 rounded-lg bg-luxury-surfaceControl border border-luxury-border space-y-1.5">
                <div className="flex justify-between"><span className="text-luxury-textMuted font-sans">Stream:</span><span className="font-bold text-luxury-text">{activeSession.name}</span></div>
                <div className="flex justify-between"><span className="text-luxury-textMuted font-sans">Protocol:</span><span className="font-bold text-luxury-slate">{activeSession.config.protocol} ({activeSession.config.packetSizeBytes}B MTU)</span></div>
                <div className="flex justify-between"><span className="text-luxury-textMuted font-sans">Route:</span><span className="font-bold text-luxury-leather">{activeSession.route.nodeKeys.join(' → ')}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-luxury-surfaceControl border border-luxury-border">
                  <span className="text-luxury-textMuted text-[10px] uppercase block">Packets Sent</span>
                  <span className="text-lg font-bold text-luxury-text mt-0.5">{activeSession.packetsTotal}</span>
                </div>
                <div className="p-3 rounded-lg bg-luxury-surfaceControl border border-luxury-border">
                  <span className="text-luxury-textMuted text-[10px] uppercase block">Delivered</span>
                  <span className="text-lg font-bold text-luxury-forest mt-0.5">{activeSession.packetsDelivered}</span>
                </div>
                <div className="p-3 rounded-lg bg-luxury-surfaceControl border border-luxury-border">
                  <span className="text-luxury-textMuted text-[10px] uppercase block">Lost / Dropped</span>
                  <span className="text-lg font-bold text-luxury-burgundy mt-0.5">{activeSession.packetsLost}</span>
                </div>
                <div className="p-3 rounded-lg bg-luxury-surfaceControl border border-luxury-border">
                  <span className="text-luxury-textMuted text-[10px] uppercase block">Retransmissions</span>
                  <span className="text-lg font-bold text-luxury-amber mt-0.5">{activeSession.retransmissions}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-luxury-surfaceControl border border-luxury-border space-y-1 text-luxury-textSecondary">
                <div className="flex justify-between"><span className="text-luxury-textMuted font-sans">Average Latency:</span><span className="text-luxury-text font-bold">{activeSession.averageLatencyMs} ms</span></div>
                <div className="flex justify-between"><span className="text-luxury-textMuted font-sans">Average RTT:</span><span className="text-luxury-text font-bold">{activeSession.averageRttMs} ms</span></div>
                <div className="flex justify-between"><span className="text-luxury-textMuted font-sans">Throughput:</span><span className="text-luxury-forest font-bold">{activeSession.throughputKbps} Kbps</span></div>
                <div className="flex justify-between"><span className="text-luxury-textMuted font-sans">Packet Loss:</span><span className={activeSession.packetsLost > 0 ? 'text-luxury-burgundy font-bold' : 'text-luxury-forest font-bold'}>{((activeSession.packetsLost / Math.max(1, activeSession.packetsTotal)) * 100).toFixed(1)}%</span></div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 rounded-lg bg-luxury-slate text-luxury-bg font-semibold text-xs hover:bg-luxury-slateDark transition-colors"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
