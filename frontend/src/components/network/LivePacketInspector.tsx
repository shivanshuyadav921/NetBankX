import React from 'react';
import { useNetworkSim } from '../../context/NetworkSimContext';
import { Radio } from 'lucide-react';

export const LivePacketInspector: React.FC = () => {
  const { activePacket, tlsEnabled } = useNetworkSim();

  if (!activePacket) {
    return (
      <div className="luxury-card p-5 text-center text-luxury-textMuted">
        <Radio className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse text-luxury-slate" />
        <div className="text-sm font-semibold text-luxury-text">Live Packet Inspector Idle</div>
        <div className="text-xs text-luxury-textMuted mt-1">
          Initiate a transfer or network ping to inspect real-time frame headers
        </div>
      </div>
    );
  }

  return (
    <div className="luxury-card p-5 relative overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between border-b border-luxury-borderSubtle pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-luxury-leather animate-ping"></span>
          <span className="font-bold text-luxury-leather uppercase tracking-wider text-sm">
            📡 Live Packet Frame #{activePacket.sequenceNumber}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-luxury-amberBg text-luxury-amber border border-luxury-amberBorder font-bold">
          {activePacket.type}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Layer 3 - Network (IPv4) */}
        <div className="bg-luxury-subtle p-3 rounded-lg border border-luxury-borderSubtle">
          <div className="text-[10px] font-bold text-luxury-slate uppercase tracking-widest mb-2">
            🌐 Layer 3 — Network (IPv4)
          </div>
          <div className="space-y-1 text-luxury-textSecondary">
            <div className="flex justify-between">
              <span className="text-luxury-textMuted">Source IP:</span>
              <span className="text-luxury-text font-bold">{activePacket.srcIp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-luxury-textMuted">Dest IP:</span>
              <span className="text-luxury-text font-bold">{activePacket.dstIp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-luxury-textMuted">TTL Remaining:</span>
              <span className="text-luxury-amber font-bold">{activePacket.ttl} hops</span>
            </div>
            <div className="flex justify-between">
              <span className="text-luxury-textMuted">Protocol:</span>
              <span className="text-luxury-text">6 (TCP)</span>
            </div>
          </div>
        </div>

        {/* Layer 2 - Data Link (Ethernet Frame) */}
        <div className="bg-luxury-subtle p-3 rounded-lg border border-luxury-borderSubtle">
          <div className="text-[10px] font-bold text-luxury-leather uppercase tracking-widest mb-2">
            🔗 Layer 2 — Data Link (Ethernet)
          </div>
          <div className="space-y-1 text-luxury-textSecondary">
            <div className="flex justify-between">
              <span className="text-luxury-textMuted">Source MAC:</span>
              <span className="text-luxury-text">{activePacket.srcMac}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-luxury-textMuted">Next-Hop MAC:</span>
              <span className="text-luxury-text">{activePacket.dstMac}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-luxury-textMuted">MAC Rewrite:</span>
              <span className="text-luxury-forest font-semibold">✓ Rewritten at router interface</span>
            </div>
            <div className="flex justify-between">
              <span className="text-luxury-textMuted">Frame Size:</span>
              <span className="text-luxury-text">{activePacket.sizeBytes} bytes</span>
            </div>
          </div>
        </div>

        {/* Layer 4 - Transport (TCP) */}
        <div className="bg-luxury-subtle p-3 rounded-lg border border-luxury-borderSubtle">
          <div className="text-[10px] font-bold text-luxury-teal uppercase tracking-widest mb-2">
            📦 Layer 4 — Transport (TCP)
          </div>
          <div className="space-y-1 text-luxury-textSecondary">
            <div className="flex justify-between">
              <span className="text-luxury-textMuted">Seq Number:</span>
              <span className="text-luxury-text font-bold">{activePacket.sequenceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-luxury-textMuted">Ack Number:</span>
              <span className="text-luxury-text font-bold">{activePacket.ackNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-luxury-textMuted">TCP Flags:</span>
              <span className="text-luxury-burgundy font-bold">{activePacket.flags}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-luxury-textMuted">Window Size:</span>
              <span className="text-luxury-text">65,535 bytes</span>
            </div>
          </div>
        </div>

        {/* Layer 7 - Application / TLS Payload */}
        <div className="bg-luxury-subtle p-3 rounded-lg border border-luxury-borderSubtle">
          <div className="text-[10px] font-bold text-luxury-forest uppercase tracking-widest mb-2">
            💻 Layer 7 — Application Payload
          </div>
          <div className="space-y-1 text-luxury-textSecondary">
            <div className="flex justify-between">
              <span className="text-luxury-textMuted">Encryption:</span>
              <span className={tlsEnabled ? 'text-luxury-forest font-bold' : 'text-luxury-burgundy font-bold'}>
                {tlsEnabled ? '🔒 TLS 1.3 (AES-256-GCM)' : '⚠️ PLAINTEXT'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-luxury-text bg-luxury-surface p-2 rounded border border-luxury-borderSubtle break-all">
              {tlsEnabled ? btoa(activePacket.payload).substring(0, 32) + '... [Encrypted Ciphertext]' : activePacket.payload}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

