import React, { useState } from 'react';
import { SimulationPacket } from '../../types';
import { Layers, ShieldCheck, Cpu, Network, HardDrive, Radio, Binary, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

interface OSIPacketInspectorProps {
  packet: SimulationPacket | null;
  onClose?: () => void;
  title?: string;
}

export const OSIPacketInspector: React.FC<OSIPacketInspectorProps> = ({ packet, onClose, title }) => {
  // Default all 7 layers to EXPANDED so the inspector is never empty
  const [expandedLayers, setExpandedLayers] = useState<Set<number>>(new Set([7, 6, 5, 4, 3, 2, 1]));

  const isMockPacket = !packet;

  const currentPacket: SimulationPacket = packet || {
    id: 'PKT-TX-TRANSFER-HOP01',
    simulationId: 'SIM-PREVIEW',
    transactionId: 'TX-10042',
    type: 'TXN_PAYLOAD',
    protocol: 'TCP_EDUCATIONAL',
    sourceNodeId: 'NODE-BR-MH01',
    destNodeId: 'NODE-BR-KA01',
    currentNodeId: 'NODE-MH-HUB',
    nextHopNodeId: 'NODE-HQ-CORE',
    sequenceNumber: 1001,
    ackNumber: 5001,
    flags: 'PSH, ACK',
    ttl: 63,
    sizeBytes: 512,
    payload: '{"type":"TRANSFER","amount":10000,"currency":"INR","src":"ACC-100001","dst":"ACC-100003"}',
    status: 'TRANSMITTING',
    hopIndex: 1,
    totalHops: 4,
    srcIp: '10.1.1.1',
    dstIp: '10.3.1.1',
    srcMac: '02:42:0a:01:01:02',
    dstMac: '02:42:0c:00:00:01',
    progressPercent: 75,
    createdAt: new Date().toISOString()
  };

  const osi = currentPacket.osi || {
    layer7_application: {
      protocol: 'HTTPS (HTTP/2.0 over TLS 1.3)',
      payloadSummary: currentPacket.payload || '{"type":"TRANSFER","amount":10000,"src":"ACC-100001","dst":"ACC-100003"}',
      dataSizeBytes: currentPacket.sizeBytes || 512,
      securityContext: 'Mutual TLS (mTLS) Verified · AES-256-GCM · Signature Valid'
    },
    layer6_presentation: {
      encoding: 'JSON / UTF-8',
      encryption: 'TLS 1.3 (Cipher: TLS_AES_256_GCM_SHA384)',
      compression: 'gzip (RFC 1952 deflate)'
    },
    layer5_session: {
      sessionId: `SESS-NBX-${currentPacket.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`,
      dialogControl: 'Full-Duplex Synchronous Session State',
      state: 'ESTABLISHED / AUTHENTICATED'
    },
    layer4_transport: {
      protocol: currentPacket.protocol === 'UDP' ? 'UDP' : 'TCP',
      srcPort: currentPacket.srcPort || 54128,
      dstPort: currentPacket.dstPort || 443,
      sequenceNumber: currentPacket.sequenceNumber || 1001,
      ackNumber: currentPacket.ackNumber || 5001,
      flags: currentPacket.flags || 'PSH, ACK',
      windowSize: 65535
    },
    layer3_network: {
      protocol: 'IPv4 (RFC 791)',
      srcIp: currentPacket.srcIp || '10.1.1.1',
      dstIp: currentPacket.dstIp || '10.3.1.1',
      ttl: currentPacket.ttl || 63,
      headerLengthBytes: 20,
      packetSizeBytes: (currentPacket.sizeBytes || 512) + 40
    },
    layer2_datalink: {
      protocol: 'IEEE 802.3 / Ethernet II',
      srcMac: currentPacket.srcMac || '02:42:0a:01:01:02',
      dstMac: currentPacket.dstMac || '02:42:0c:00:00:01',
      hopRewrite: currentPacket.hopIndex > 0,
      fcs: '0x3F89A12B (CRC-32 Valid)'
    },
    layer1_physical: {
      medium: '100G Optical Fiber (DWDM) / 10G Carrier Ethernet WAN',
      bitRateMbps: 100000,
      signalType: 'NRZ Optical Laser Pulse (850nm / Single-Mode Fiber)'
    }
  };

  const toggleLayer = (layerNum: number) => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerNum)) {
        next.delete(layerNum);
      } else {
        next.add(layerNum);
      }
      return next;
    });
  };

  const toggleAllLayers = () => {
    if (expandedLayers.size > 0) {
      setExpandedLayers(new Set());
    } else {
      setExpandedLayers(new Set([7, 6, 5, 4, 3, 2, 1]));
    }
  };

  const layers = [
    {
      num: 7,
      name: 'Application Layer',
      shortTag: 'L7 APP',
      icon: <Cpu className="w-4 h-4 text-luxury-slate" />,
      accent: 'border-l-luxury-slate',
      badgeColor: 'bg-luxury-slateLight text-luxury-slate border-luxury-slate',
      summary: `${osi.layer7_application.protocol} · Payload: ${osi.layer7_application.dataSizeBytes}B`,
      details: (
        <div className="space-y-2 text-xs text-luxury-textSecondary">
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Application Protocol:</span>
            <span className="font-mono text-luxury-text font-bold">{osi.layer7_application.protocol}</span>
          </div>
          <div className="flex justify-between items-start py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">JSON Payload Data:</span>
            <span className="font-mono text-luxury-leather font-medium max-w-md text-right break-all bg-luxury-bg p-1.5 rounded border border-luxury-borderSubtle">
              {osi.layer7_application.payloadSummary}
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Security Context:</span>
            <span className="font-mono text-luxury-forest font-semibold">{osi.layer7_application.securityContext}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-luxury-textMuted">Payload Size:</span>
            <span className="font-mono text-luxury-text">{osi.layer7_application.dataSizeBytes} bytes</span>
          </div>
        </div>
      )
    },
    {
      num: 6,
      name: 'Presentation Layer',
      shortTag: 'L6 PRES',
      icon: <ShieldCheck className="w-4 h-4 text-luxury-forest" />,
      accent: 'border-l-luxury-forest',
      badgeColor: 'bg-luxury-forestBg text-luxury-forest border-luxury-forestBorder',
      summary: `${osi.layer6_presentation.encryption} · Encoding: ${osi.layer6_presentation.encoding}`,
      details: (
        <div className="space-y-2 text-xs text-luxury-textSecondary">
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Cipher Suite:</span>
            <span className="font-mono text-luxury-forest font-bold">{osi.layer6_presentation.encryption}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Serialization / Encoding:</span>
            <span className="font-mono text-luxury-text">{osi.layer6_presentation.encoding}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-luxury-textMuted">Compression Stream:</span>
            <span className="font-mono text-luxury-text">{osi.layer6_presentation.compression || 'gzip (rfc1952)'}</span>
          </div>
        </div>
      )
    },
    {
      num: 5,
      name: 'Session Layer',
      shortTag: 'L5 SESS',
      icon: <HardDrive className="w-4 h-4 text-luxury-leather" />,
      accent: 'border-l-luxury-leather',
      badgeColor: 'bg-luxury-subtle text-luxury-leather border-luxury-borderSubtle',
      summary: `${osi.layer5_session.dialogControl} · ${osi.layer5_session.state}`,
      details: (
        <div className="space-y-2 text-xs text-luxury-textSecondary">
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">mTLS Session ID:</span>
            <span className="font-mono text-luxury-text font-bold">{osi.layer5_session.sessionId}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Dialog Control:</span>
            <span className="font-mono text-luxury-text">{osi.layer5_session.dialogControl}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-luxury-textMuted">Session Lifecycle State:</span>
            <span className="font-mono text-luxury-forest font-semibold">{osi.layer5_session.state}</span>
          </div>
        </div>
      )
    },
    {
      num: 4,
      name: 'Transport Layer',
      shortTag: 'L4 TRANS',
      icon: <Network className="w-4 h-4 text-luxury-teal" />,
      accent: 'border-l-luxury-teal',
      badgeColor: 'bg-luxury-slateLight text-luxury-slate border-luxury-slate',
      summary: `${osi.layer4_transport.protocol} · Port ${osi.layer4_transport.srcPort} → ${osi.layer4_transport.dstPort} [${osi.layer4_transport.flags}]`,
      details: (
        <div className="space-y-2 text-xs text-luxury-textSecondary">
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Transport Protocol:</span>
            <span className="font-mono text-luxury-slate font-bold">{osi.layer4_transport.protocol} (Reliable Full-Duplex Byte-Stream)</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Source Port (Client):</span>
            <span className="font-mono text-luxury-text font-bold">{osi.layer4_transport.srcPort}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Destination Port (Service):</span>
            <span className="font-mono text-luxury-text font-bold">{osi.layer4_transport.dstPort} (HTTPS/REST)</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Sequence Number (Seq):</span>
            <span className="font-mono text-luxury-leather font-bold">{osi.layer4_transport.sequenceNumber}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Acknowledgment Number (Ack):</span>
            <span className="font-mono text-luxury-forest font-bold">{osi.layer4_transport.ackNumber}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">TCP Control Flags:</span>
            <span className="font-mono text-luxury-burgundy font-bold">{osi.layer4_transport.flags}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-luxury-textMuted">Receive Window Size:</span>
            <span className="font-mono text-luxury-text">{osi.layer4_transport.windowSize.toLocaleString()} bytes</span>
          </div>
        </div>
      )
    },
    {
      num: 3,
      name: 'Network Layer',
      shortTag: 'L3 NET',
      icon: <Layers className="w-4 h-4 text-luxury-amber" />,
      accent: 'border-l-luxury-amber',
      badgeColor: 'bg-luxury-amberBg text-luxury-amber border-luxury-amberBorder',
      summary: `IPv4 · ${osi.layer3_network.srcIp} → ${osi.layer3_network.dstIp} · TTL: ${osi.layer3_network.ttl}`,
      details: (
        <div className="space-y-2 text-xs text-luxury-textSecondary">
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Network Protocol:</span>
            <span className="font-mono text-luxury-text font-bold">IPv4 (RFC 791)</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Source IP (End-to-End):</span>
            <span className="font-mono text-luxury-forest font-bold">{osi.layer3_network.srcIp}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Destination IP (End-to-End):</span>
            <span className="font-mono text-luxury-slate font-bold">{osi.layer3_network.dstIp}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Time to Live (TTL):</span>
            <span className="font-mono text-luxury-amber font-bold">{osi.layer3_network.ttl} hops</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-luxury-textMuted">Total Packet Size (Headers + Data):</span>
            <span className="font-mono text-luxury-text">{osi.layer3_network.packetSizeBytes} bytes</span>
          </div>
          <div className="p-2.5 rounded bg-luxury-bg border border-luxury-borderSubtle text-[11px] text-luxury-textMuted font-sans">
            💡 <strong>Routing Principle:</strong> End-to-end Layer 3 IP addresses remain constant across the entire WAN path, driving Dijkstra hop routing decisions.
          </div>
        </div>
      )
    },
    {
      num: 2,
      name: 'Data Link Layer',
      shortTag: 'L2 LINK',
      icon: <Binary className="w-4 h-4 text-luxury-slateSubtle" />,
      accent: 'border-l-luxury-slateSubtle',
      badgeColor: 'bg-luxury-subtle text-luxury-textSecondary border-luxury-borderSubtle',
      summary: `Ethernet II · Hop MAC: ${osi.layer2_datalink.srcMac} → ${osi.layer2_datalink.dstMac}`,
      details: (
        <div className="space-y-2 text-xs text-luxury-textSecondary">
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Framing Standard:</span>
            <span className="font-mono text-luxury-text font-bold">IEEE 802.3 / Ethernet II</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Current Hop Source MAC:</span>
            <span className="font-mono text-luxury-text font-semibold">{osi.layer2_datalink.srcMac}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Next Hop Destination MAC:</span>
            <span className="font-mono text-luxury-text font-semibold">{osi.layer2_datalink.dstMac}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Layer 2 MAC Rewrite:</span>
            <span className="font-mono text-luxury-forest font-semibold">{osi.layer2_datalink.hopRewrite ? '✓ Rewritten by Router Interface' : '○ Initial Source Frame'}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-luxury-textMuted">Frame Check Sequence (FCS):</span>
            <span className="font-mono text-luxury-text">{osi.layer2_datalink.fcs} (CRC-32 Valid)</span>
          </div>
          <div className="p-2.5 rounded bg-luxury-bg border border-luxury-borderSubtle text-[11px] text-luxury-textMuted font-sans">
            💡 <strong>Educational Notice:</strong> Unlike Layer 3 IP, Layer 2 MAC addresses are <em>rewritten at every router hop</em> as the frame traverses physical link segments.
          </div>
        </div>
      )
    },
    {
      num: 1,
      name: 'Physical Layer',
      shortTag: 'L1 PHYS',
      icon: <Radio className="w-4 h-4 text-luxury-textMuted" />,
      accent: 'border-l-luxury-textMuted',
      badgeColor: 'bg-luxury-subtle text-luxury-textMuted border-luxury-borderSubtle',
      summary: `${osi.layer1_physical.medium} · ${(osi.layer1_physical.bitRateMbps / 1000).toFixed(0)} Gbps`,
      details: (
        <div className="space-y-2 text-xs text-luxury-textSecondary">
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Transmission Medium:</span>
            <span className="font-mono text-luxury-text">{osi.layer1_physical.medium}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-luxury-borderSubtle">
            <span className="text-luxury-textMuted">Link Bandwidth:</span>
            <span className="font-mono text-luxury-forest font-bold">{osi.layer1_physical.bitRateMbps.toLocaleString()} Mbps</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-luxury-textMuted">Physical Signaling:</span>
            <span className="font-mono text-luxury-text">{osi.layer1_physical.signalType}</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="luxury-card p-5 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-luxury-border pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-luxury-slateLight border border-luxury-borderSubtle text-luxury-slate">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-luxury-text text-sm font-mono">
                {title || currentPacket.id}
              </h3>
              <span className="px-2 py-0.5 rounded bg-luxury-surfaceControl border border-luxury-borderStrong text-luxury-leather font-mono text-[10px] font-bold">
                {currentPacket.type}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                currentPacket.status === 'DELIVERED' ? 'bg-luxury-forestBg text-luxury-forest border border-luxury-forestBorder' :
                currentPacket.status === 'LOST' ? 'bg-luxury-burgundyBg text-luxury-burgundy border border-luxury-burgundyBorder' :
                currentPacket.status === 'RETRANSMITTED' ? 'bg-luxury-amberBg text-luxury-amber border border-luxury-amberBorder' :
                'bg-luxury-slateLight text-luxury-slate border border-luxury-slate'
              }`}>
                {currentPacket.status}
              </span>
              {isMockPacket && (
                <span className="px-2 py-0.5 rounded bg-luxury-amberBg text-luxury-amber border border-luxury-amberBorder text-[10px] font-mono font-bold">
                  Active Topology Frame View
                </span>
              )}
            </div>
            <p className="text-xs text-luxury-textMuted font-mono mt-0.5">
              Hop #{currentPacket.hopIndex + 1}/{currentPacket.totalHops} · Protocol: {currentPacket.protocol} · Seq: {currentPacket.sequenceNumber} · ACK: {currentPacket.ackNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleAllLayers}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-luxury-surface border border-luxury-border text-luxury-textSecondary hover:text-luxury-text hover:bg-luxury-surfaceHover transition-colors"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            <span>{expandedLayers.size > 0 ? 'Collapse All' : 'Expand All Layers'}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-luxury-textMuted hover:text-luxury-text px-2.5 py-1.5 rounded-lg bg-luxury-subtle hover:bg-luxury-surfaceHover"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Interactive 7-Layer OSI Stack Diagram Header */}
      <div className="p-3 rounded-lg bg-luxury-subtle border border-luxury-borderSubtle">
        <div className="text-[10px] font-mono uppercase tracking-wider text-luxury-textMuted font-bold mb-2 flex items-center justify-between">
          <span>7-Layer OSI Encapsulation Flow (Application → Physical)</span>
          <span className="text-luxury-slate">Click layer badge to toggle</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 font-mono text-[10px]">
          {layers.map(layer => {
            const isOpen = expandedLayers.has(layer.num);
            return (
              <button
                key={layer.num}
                onClick={() => toggleLayer(layer.num)}
                className={`p-2 rounded border text-center transition-all ${
                  isOpen
                    ? `${layer.badgeColor} shadow-luxury-sm font-bold scale-[1.02]`
                    : 'bg-luxury-bg border-luxury-borderSubtle text-luxury-textMuted hover:text-luxury-text'
                }`}
              >
                <div className="font-bold">{layer.shortTag}</div>
                <div className="text-[9px] truncate opacity-90">{layer.name.replace(' Layer', '')}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7-Layer Detailed Breakdown Accordion */}
      <div className="space-y-2 font-sans">
        {layers.map(layer => {
          const isExpanded = expandedLayers.has(layer.num);

          return (
            <div
              key={layer.num}
              className={`rounded-lg bg-luxury-surface border border-luxury-border overflow-hidden border-l-4 ${layer.accent} transition-all`}
            >
              <button
                onClick={() => toggleLayer(layer.num)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-luxury-surfaceHover transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                  <div className="font-mono text-xs font-bold text-luxury-textMuted shrink-0 w-16">
                    Layer {layer.num}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {layer.icon}
                    <span className="text-xs font-bold text-luxury-text">{layer.name}</span>
                  </div>
                  <span className="text-[11px] text-luxury-textSecondary font-mono hidden md:inline truncate">
                    — {layer.summary}
                  </span>
                </div>
                <div className="text-luxury-textMuted shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 bg-luxury-subtle border-t border-luxury-borderSubtle animate-fadeIn">
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
