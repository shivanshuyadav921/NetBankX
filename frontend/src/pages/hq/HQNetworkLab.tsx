import React from 'react';
import { Header } from '../../components/layout/Header';
import { TopologyMap } from '../../components/network/TopologyMap';
import { FaultInjectionConsole } from '../../components/lab/FaultInjectionConsole';
import { LivePacketInspector } from '../../components/network/LivePacketInspector';
import { EventTimeline } from '../../components/lab/EventTimeline';
import { useNetworkSim } from '../../context/NetworkSimContext';

export const HQNetworkLab: React.FC = () => {
  const { metrics } = useNetworkSim();

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Network Operations Center (NOC) & Simulation Lab"
        subtitle="Real-time enterprise network digital twin, graph-based Dijkstra routing & educational TCP reliability laboratory"
      />

      <div className="p-8 space-y-8 flex-1 bg-luxury-bg">
        {/* Real-time Telemetry KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          <div className="luxury-card p-4">
            <span className="text-luxury-textMuted block text-[10px] uppercase">Packets Sent</span>
            <div className="text-xl font-bold text-luxury-text mt-1">{metrics?.packetsSent || 0}</div>
          </div>
          <div className="luxury-card p-4">
            <span className="text-luxury-textMuted block text-[10px] uppercase">Delivered</span>
            <div className="text-xl font-bold text-luxury-forest mt-1">{metrics?.packetsDelivered || 0}</div>
          </div>
          <div className="luxury-card p-4">
            <span className="text-luxury-textMuted block text-[10px] uppercase">Lost / Dropped</span>
            <div className="text-xl font-bold text-luxury-burgundy mt-1">{metrics?.packetsLost || 0}</div>
          </div>
          <div className="luxury-card p-4">
            <span className="text-luxury-textMuted block text-[10px] uppercase">Retransmissions [RTX]</span>
            <div className="text-xl font-bold text-luxury-amber mt-1">{metrics?.retransmissions || 0}</div>
          </div>
          <div className="luxury-card p-4">
            <span className="text-luxury-textMuted block text-[10px] uppercase">Average RTT</span>
            <div className="text-xl font-bold text-luxury-slate mt-1">
              {metrics && typeof metrics.averageRttMs === 'number' ? `${metrics.averageRttMs} ms` : '0 ms'}
            </div>
          </div>
          <div className="luxury-card p-4">
            <span className="text-luxury-textMuted block text-[10px] uppercase">WAN Throughput</span>
            <div className="text-xl font-bold text-luxury-teal mt-1">
              {metrics && typeof metrics.throughputKbps === 'number' ? `${metrics.throughputKbps} Kbps` : '0 Kbps'}
            </div>
          </div>
        </div>

        {/* Fault Injection Console */}
        <FaultInjectionConsole />

        {/* Topology Map + Live Packet Inspector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <TopologyMap height={500} />
            <LivePacketInspector />
          </div>

          <div className="lg:col-span-4">
            <EventTimeline />
          </div>
        </div>
      </div>
    </div>
  );
};

