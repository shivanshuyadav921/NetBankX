import React, { useState } from 'react';
import { SimulationPacket } from '../../types';
import { Layers, ShieldCheck, Cpu, Network, HardDrive, Radio, Binary, ChevronDown, ChevronUp } from 'lucide-react';

interface OSIPacketInspectorProps {
  packet: SimulationPacket | null;
  onClose?: () => void;
}

export const OSIPacketInspector: React.FC<OSIPacketInspectorProps> = ({ packet, onClose }) => {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);

  if (!packet) {
    return (
      <div className="luxury-card p-6 text-center text-luxury-textMuted">
        <Radio className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse text-luxury-slate" />
        <div className="text-sm font-semibold text-luxury-text">OSI Encapsulation Inspector Idle</div>
        <div className="text-xs text-luxury-textMuted mt-1">
          Click any traveling packet in the topology or initiate a transfer to inspect real-time frame headers & 7-layer encapsulation.
        </div>
      </div>
    );
  }

  const osi = packet.osi || {
    layer7_application: {
      protocol: 'HTTPS (HTTP/2.0 over TLS 1.3)',
      payloadSummary: packet.payload || 'Banking Payload Data',
      dataSizeBytes: packet.sizeBytes || 512,
      securityContext: 'Mutual TLS (mTLS) Verified · AES-256-GCM'
    },
    layer6_presentation: {
      encoding: 'JSON / UTF-8',
      encryption: 'TLS 1.3 (Cipher: TLS_AES_256_GCM_SHA384)',
      compression: 'gzip (rfc1952)'
    },
    layer5_session: {
      sessionId: `SESS-${packet.id.slice(-6)}`,
      dialogControl: 'Full-Duplex Synchronous State',
      state: 'ESTABLISHED / AUTHENTICATED'
    },
    layer4_transport: {
      protocol: packet.protocol === 'UDP' ? 'UDP' : 'TCP',
      srcPort: packet.srcPort || 49152,
      dstPort: packet.dstPort || 443,
      sequenceNumber: packet.sequenceNumber,
      ackNumber: packet.ackNumber,
      flags: packet.flags || 'PSH, ACK',
      windowSize: 65535
    },
    layer3_network: {
      protocol: 'IPv4',
      srcIp: packet.srcIp,
      dstIp: packet.dstIp,
      ttl: packet.ttl,
      headerLengthBytes: 20,
      packetSizeBytes: (packet.sizeBytes || 512) + 40
    },
    layer2_datalink: {
      protocol: 'Ethernet II',
      srcMac: packet.srcMac,
      dstMac: packet.dstMac,
      hopRewrite: packet.hopIndex > 0,
      fcs: '0x3F89A12B'
    },
    layer1_physical: {
      medium: '10G / 100G Carrier Ethernet & Optical Fiber (DWDM)',
      bitRateMbps: 10000,
      signalType: 'NRZ Optical Laser Pulse (850nm)'
    }
  };

  const toggleLayer = (layerNum: number) => {
    setExpandedLayer(prev => (prev === layerNum ? null : layerNum));
  };

  const layers = [
    {
      num: 7,
      name: 'Application Layer',
      icon: <Cpu className="w-4 h-4 text-luxury-slate" />,
      accent: 'border-l-luxury-slate',
      summary: `${osi.layer7_application.protocol} · Payload: ${osi.layer7_application.dataSizeBytes}B`,
      details: (
        <div className="space-y-1.5 text-xs text-luxury-textSecondary">
          <div className="flex justify-between"><span className="text-luxury-textMuted">Protocol:</span><span className="font-mono text-luxury-text font-bold">{osi.layer7_application.protocol}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Payload Summary:</span><span className="font-mono text-luxury-leather font-medium">{osi.layer7_application.payloadSummary}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Security Context:</span><span className="font-mono text-luxury-forest font-semibold">{osi.layer7_application.securityContext}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Data Size:</span><span className="font-mono text-luxury-text">{osi.layer7_application.dataSizeBytes} bytes</span></div>
        </div>
      )
    },
    {
      num: 6,
      name: 'Presentation Layer',
      icon: <ShieldCheck className="w-4 h-4 text-luxury-forest" />,
      accent: 'border-l-luxury-forest',
      summary: `${osi.layer6_presentation.encryption} · Encoding: ${osi.layer6_presentation.encoding}`,
      details: (
        <div className="space-y-1.5 text-xs text-luxury-textSecondary">
          <div className="flex justify-between"><span className="text-luxury-textMuted">Cipher Suite:</span><span className="font-mono text-luxury-forest font-bold">{osi.layer6_presentation.encryption}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Data Encoding:</span><span className="font-mono text-luxury-text">{osi.layer6_presentation.encoding}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Compression:</span><span className="font-mono text-luxury-text">{osi.layer6_presentation.compression || 'None'}</span></div>
        </div>
      )
    },
    {
      num: 5,
      name: 'Session Layer',
      icon: <HardDrive className="w-4 h-4 text-luxury-leather" />,
      accent: 'border-l-luxury-leather',
      summary: `${osi.layer5_session.dialogControl} · ${osi.layer5_session.state}`,
      details: (
        <div className="space-y-1.5 text-xs text-luxury-textSecondary">
          <div className="flex justify-between"><span className="text-luxury-textMuted">Session ID:</span><span className="font-mono text-luxury-text font-bold">{osi.layer5_session.sessionId}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Dialog Control:</span><span className="font-mono text-luxury-text">{osi.layer5_session.dialogControl}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Session State:</span><span className="font-mono text-luxury-forest font-semibold">{osi.layer5_session.state}</span></div>
        </div>
      )
    },
    {
      num: 4,
      name: 'Transport Layer',
      icon: <Network className="w-4 h-4 text-luxury-teal" />,
      accent: 'border-l-luxury-teal',
      summary: `${osi.layer4_transport.protocol} · Src Port ${osi.layer4_transport.srcPort} → Dst Port ${osi.layer4_transport.dstPort} [${osi.layer4_transport.flags}]`,
      details: (
        <div className="space-y-1.5 text-xs text-luxury-textSecondary">
          <div className="flex justify-between"><span className="text-luxury-textMuted">Protocol:</span><span className="font-mono text-luxury-slate font-bold">{osi.layer4_transport.protocol} (Reliable Byte-Stream)</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Source Port:</span><span className="font-mono text-luxury-text font-bold">{osi.layer4_transport.srcPort} (Ephemeral Client)</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Destination Port:</span><span className="font-mono text-luxury-text font-bold">{osi.layer4_transport.dstPort} (HTTPS Service)</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Sequence Number:</span><span className="font-mono text-luxury-leather font-bold">{osi.layer4_transport.sequenceNumber}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Acknowledgment Number:</span><span className="font-mono text-luxury-forest font-bold">{osi.layer4_transport.ackNumber}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">TCP Control Flags:</span><span className="font-mono text-luxury-burgundy font-bold">{osi.layer4_transport.flags}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Receive Window Size:</span><span className="font-mono text-luxury-text">{osi.layer4_transport.windowSize.toLocaleString()} bytes</span></div>
        </div>
      )
    },
    {
      num: 3,
      name: 'Network Layer',
      icon: <Layers className="w-4 h-4 text-luxury-amber" />,
      accent: 'border-l-luxury-amber',
      summary: `IPv4 · ${osi.layer3_network.srcIp} → ${osi.layer3_network.dstIp} · TTL: ${osi.layer3_network.ttl}`,
      details: (
        <div className="space-y-1.5 text-xs text-luxury-textSecondary">
          <div className="flex justify-between"><span className="text-luxury-textMuted">Protocol:</span><span className="font-mono text-luxury-text font-bold">IPv4 (RFC 791)</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Source IP (End-to-End):</span><span className="font-mono text-luxury-forest font-bold">{osi.layer3_network.srcIp}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Destination IP (End-to-End):</span><span className="font-mono text-luxury-slate font-bold">{osi.layer3_network.dstIp}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Time to Live (TTL):</span><span className="font-mono text-luxury-amber font-bold">{osi.layer3_network.ttl} hops</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Total Packet Size:</span><span className="font-mono text-luxury-text">{osi.layer3_network.packetSizeBytes} bytes (Header: 20B)</span></div>
          <div className="mt-2 p-2 rounded bg-luxury-bg border border-luxury-borderSubtle text-[11px] text-luxury-textMuted font-sans">
            💡 <strong>Routing Principle:</strong> Layer 3 IP addressing remains constant across the entire end-to-end WAN path, guiding routers at each Dijkstra hop.
          </div>
        </div>
      )
    },
    {
      num: 2,
      name: 'Data Link Layer',
      icon: <Binary className="w-4 h-4 text-luxury-slateSubtle" />,
      accent: 'border-l-luxury-slateSubtle',
      summary: `Ethernet II · Hop MAC: ${osi.layer2_datalink.srcMac} → ${osi.layer2_datalink.dstMac}`,
      details: (
        <div className="space-y-1.5 text-xs text-luxury-textSecondary">
          <div className="flex justify-between"><span className="text-luxury-textMuted">Framing Standard:</span><span className="font-mono text-luxury-text font-bold">IEEE 802.3 / Ethernet II</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Current Hop Source MAC:</span><span className="font-mono text-luxury-text">{osi.layer2_datalink.srcMac}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Next Hop Destination MAC:</span><span className="font-mono text-luxury-text">{osi.layer2_datalink.dstMac}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Layer 2 MAC Rewrite:</span><span className="font-mono text-luxury-forest font-semibold">{osi.layer2_datalink.hopRewrite ? '✓ Rewritten by Router Interface' : '○ Initial Source Frame'}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Frame Check Sequence (FCS):</span><span className="font-mono text-luxury-text">{osi.layer2_datalink.fcs} (CRC-32 Valid)</span></div>
          <div className="mt-2 p-2 rounded bg-luxury-bg border border-luxury-borderSubtle text-[11px] text-luxury-textMuted font-sans">
            💡 <strong>Educational Notice:</strong> Unlike Layer 3 IP, Layer 2 MAC addresses are <em>rewritten at each router interface hop</em> as the frame traverses individual physical links.
          </div>
        </div>
      )
    },
    {
      num: 1,
      name: 'Physical Layer',
      icon: <Radio className="w-4 h-4 text-luxury-textMuted" />,
      accent: 'border-l-luxury-textMuted',
      summary: `${osi.layer1_physical.medium} · ${(osi.layer1_physical.bitRateMbps / 1000).toFixed(0)} Gbps`,
      details: (
        <div className="space-y-1.5 text-xs text-luxury-textSecondary">
          <div className="flex justify-between"><span className="text-luxury-textMuted">Transmission Medium:</span><span className="font-mono text-luxury-text">{osi.layer1_physical.medium}</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Link Bandwidth:</span><span className="font-mono text-luxury-forest font-bold">{osi.layer1_physical.bitRateMbps.toLocaleString()} Mbps</span></div>
          <div className="flex justify-between"><span className="text-luxury-textMuted">Physical Encoding:</span><span className="font-mono text-luxury-text">{osi.layer1_physical.signalType}</span></div>
        </div>
      )
    }
  ];

  return (
    <div className="luxury-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-luxury-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-luxury-subtle border border-luxury-border text-luxury-slate">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-luxury-text text-sm font-mono">
                {packet.id}
              </h3>
              <span className="px-2 py-0.5 rounded bg-luxury-surfaceControl border border-luxury-borderStrong text-luxury-leather font-mono text-[10px] font-bold">
                {packet.type}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                packet.status === 'DELIVERED' ? 'bg-luxury-successBg text-luxury-forest border border-luxury-successBorder' :
                packet.status === 'LOST' ? 'bg-luxury-burgundyBg text-luxury-burgundy border border-luxury-burgundyBorder' :
                packet.status === 'RETRANSMITTED' ? 'bg-luxury-amberBg text-luxury-amber border border-luxury-amberBorder' :
                'bg-luxury-surfaceControl text-luxury-slate border border-luxury-border'
              }`}>
                {packet.status}
              </span>
            </div>
            <p className="text-xs text-luxury-textMuted font-mono mt-0.5">
              Hop #{packet.hopIndex + 1}/{packet.totalHops} · Protocol: {packet.protocol} · Seq: {packet.sequenceNumber} · ACK: {packet.ackNumber}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-luxury-textMuted hover:text-luxury-text px-2 py-1 rounded bg-luxury-subtle hover:bg-luxury-surfaceHover"
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Dual Traffic Paradigm Callout */}
      <div className="p-3 rounded-lg bg-luxury-surfaceControl border border-luxury-border text-xs">
        <div className="flex items-center justify-between font-mono text-[11px] mb-1">
          <span className="text-luxury-slate font-bold">🌐 LAYER DISTINCTION</span>
          <span className="text-luxury-textMuted">Enterprise Educational Twin</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-luxury-textSecondary">
          <div className="p-2 rounded bg-luxury-bg border border-luxury-borderSubtle">
            <span className="text-luxury-leather font-semibold block mb-0.5">REAL APPLICATION TRAFFIC</span>
            <span className="text-luxury-textMuted">Chrome Browser → HTTPS API → Backend Ledger DB</span>
          </div>
          <div className="p-2 rounded bg-luxury-bg border border-luxury-borderSubtle">
            <span className="text-luxury-forest font-semibold block mb-0.5">SIMULATED NETWORK TRAFFIC</span>
            <span className="text-luxury-textMuted">Branch Router → Gateway Hub → HQ Core → WAN Hops</span>
          </div>
        </div>
      </div>

      {/* 7-Layer OSI Encapsulation Stack */}
      <div className="space-y-2 font-sans">
        <div className="text-xs font-mono uppercase tracking-wider text-luxury-textMuted font-bold px-1">
          7-Layer OSI Stack Encapsulation Breakdown
        </div>

        {layers.map(layer => {
          const isExpanded = expandedLayer === layer.num;

          return (
            <div
              key={layer.num}
              className={`rounded-lg bg-luxury-surface border border-luxury-border overflow-hidden border-l-4 ${layer.accent} transition-all`}
            >
              <button
                onClick={() => toggleLayer(layer.num)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-luxury-surfaceHover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="font-mono text-xs font-bold text-luxury-textMuted w-16">
                    Layer {layer.num}
                  </div>
                  <div className="flex items-center gap-2">
                    {layer.icon}
                    <span className="text-xs font-bold text-luxury-text">{layer.name}</span>
                  </div>
                  <span className="text-[11px] text-luxury-textSecondary font-mono hidden md:inline truncate max-w-xs">
                    {layer.summary}
                  </span>
                </div>
                <div className="text-luxury-textMuted">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 bg-luxury-subtle border-t border-luxury-borderSubtle">
                  {layer.details}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
