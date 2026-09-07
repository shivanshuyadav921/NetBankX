import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Layers, Lock, Globe, Server, Cpu } from 'lucide-react';

interface OSITraceProps {
  amount?: number;
  fromAccount?: string;
  toAccount?: string;
  senderBranch?: string;
  receiverBranch?: string;
  hopCount?: number;
  currentHop?: number;
}

export const OSITraceAccordion: React.FC<OSITraceProps> = ({
  amount = 5000,
  fromAccount = 'ACC-100001',
  toAccount = 'ACC-100003',
  senderBranch = 'Mumbai Main (MH-MUM-001)',
  receiverBranch = 'Bangalore Koramangala (KA-BLR-001)',
  hopCount = 6,
  currentHop = 1
}) => {
  const [openLayer, setOpenLayer] = useState<number | null>(7);

  const layers = [
    {
      num: 7,
      name: 'Application Layer',
      pdu: 'HTTP / JSON Data',
      color: 'text-luxury-slate border-luxury-borderSubtle bg-luxury-slateLight',
      icon: <Globe className="w-4 h-4 text-luxury-slate" />,
      action: 'Generates Banking API Request',
      details: {
        Protocol: 'HTTPS (REST API)',
        Endpoint: 'POST /api/v1/transactions/transfer',
        Payload: `{"sourceAccountId":"${fromAccount}","destinationAccount":"${toAccount}","amount":${amount},"currency":"INR"}`,
        Host: 'netbankx.internal'
      }
    },
    {
      num: 6,
      name: 'Presentation Layer',
      pdu: 'Formatted / Encrypted Syntax',
      color: 'text-luxury-teal border-luxury-borderSubtle bg-luxury-subtle',
      icon: <Lock className="w-4 h-4 text-luxury-teal" />,
      action: 'TLS 1.3 Cryptographic Encryption & Serialization',
      details: {
        Encryption: 'TLS 1.3 (AES-256-GCM)',
        CipherSuite: 'TLS_AES_256_GCM_SHA384',
        Serialization: 'UTF-8 JSON encoding',
        Compression: 'gzip / brotli stream'
      }
    },
    {
      num: 5,
      name: 'Session Layer',
      pdu: 'Session State & Nonce',
      color: 'text-luxury-slate border-luxury-borderSubtle bg-luxury-subtle',
      icon: <Server className="w-4 h-4 text-luxury-slate" />,
      action: 'Session Management & Authentication Context',
      details: {
        SessionType: 'JWT Stateful Bearer Session',
        KeepAlive: 'TCP Keep-Alive (60s timeout)',
        SyncState: 'Full Duplex Transaction Handshake'
      }
    },
    {
      num: 4,
      name: 'Transport Layer',
      pdu: 'TCP Segment',
      color: 'text-luxury-teal border-luxury-borderSubtle bg-luxury-subtle',
      icon: <Layers className="w-4 h-4 text-luxury-teal" />,
      action: 'End-to-End Reliability, Sequencing & Flow Control',
      details: {
        Protocol: 'TCP (Transmission Control Protocol)',
        SrcPort: '54122 (Ephemeral)',
        DstPort: '443 (HTTPS Secure Port)',
        SequenceNo: '1001',
        AckNo: '5001',
        Flags: 'PSH, ACK',
        WindowSize: '65,535 bytes'
      }
    },
    {
      num: 3,
      name: 'Network Layer',
      pdu: 'IPv4 Packet',
      color: 'text-luxury-forest border-luxury-successBorder bg-luxury-successBg',
      icon: <Globe className="w-4 h-4 text-luxury-forest" />,
      action: 'Dijkstra Logical Routing & IP Packet Forwarding',
      details: {
        Protocol: 'IPv4 (Internet Protocol v4)',
        SrcIP: '10.1.1.1 (Source Branch LAN)',
        DstIP: '10.3.1.1 (Dest Branch LAN)',
        TTL: `${64 - currentHop} (Decremented by 1 at every router hop)`,
        NAT: 'Branch Private 10.x.x.x ➔ Regional Public 203.0.113.x Gateway'
      }
    },
    {
      num: 2,
      name: 'Data Link Layer',
      pdu: 'Ethernet II Frame',
      color: 'text-luxury-leather border-luxury-amberBorder bg-luxury-amberBg',
      icon: <Layers className="w-4 h-4 text-luxury-leather" />,
      action: 'Hop-by-Hop MAC Address Rewriting & CRC Verification',
      details: {
        Protocol: 'IEEE 802.3 Ethernet II',
        SrcMAC: '00:1A:2B:MH:11:01 (Current Router Interface)',
        DstMAC: '00:1A:2B:MH:01:00 (Next-Hop Gateway)',
        MACRewrite: '✅ MAC addresses are hop-local and rewritten at every intermediate router interface',
        Checksum: '0x8F92A10B (CRC32 Frame Check Sequence)'
      }
    },
    {
      num: 1,
      name: 'Physical Layer',
      pdu: 'Bits & Signals',
      color: 'text-luxury-burgundy border-luxury-burgundyBorder bg-luxury-burgundyBg',
      icon: <Cpu className="w-4 h-4 text-luxury-burgundy" />,
      action: 'Optical / Electrical Bitstream Transmission',
      details: {
        Medium: 'Single-mode Optical Fiber (DWDM Core Backbone)',
        Bandwidth: '5 Gbps National Inter-Regional Carrier',
        Signal: '1310 nm Laser Infrared Pulses',
        Encoding: '8B/10B Line Code (01001000 01010100...)'
      }
    }
  ];

  return (
    <div className="luxury-card p-5">
      <div className="flex items-center justify-between border-b border-luxury-borderSubtle pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-luxury-slateLight border border-luxury-borderSubtle text-luxury-slate">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-luxury-text text-sm">📡 7-Layer OSI Architectural Trace</h3>
            <p className="text-xs text-luxury-textMuted">Hop-by-Hop Protocol Data Unit (PDU) Transformation</p>
          </div>
        </div>
        <div className="text-xs font-mono text-luxury-slate bg-luxury-slateLight px-2.5 py-1 rounded-full border border-luxury-borderSubtle font-semibold">
          Hop {currentHop} of {hopCount} · {senderBranch} ➔ {receiverBranch}
        </div>
      </div>

      <div className="space-y-2">
        {layers.map(layer => {
          const isOpen = openLayer === layer.num;
          return (
            <div
              key={layer.num}
              className={`border rounded-xl transition-all overflow-hidden ${
                isOpen ? 'border-luxury-slate bg-luxury-surface shadow-luxury-sm' : 'border-luxury-borderSubtle bg-luxury-subtle/60 hover:border-luxury-border'
              }`}
            >
              <button
                onClick={() => setOpenLayer(isOpen ? null : layer.num)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${layer.color}`}>
                    L{layer.num}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-luxury-text">{layer.name}</div>
                    <div className="text-[11px] text-luxury-textMuted font-mono">{layer.pdu}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-xs text-luxury-textSecondary">{layer.action}</span>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-luxury-textMuted" /> : <ChevronRight className="w-4 h-4 text-luxury-textMuted" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-luxury-borderSubtle font-mono text-xs text-luxury-textSecondary">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-luxury-subtle p-3 rounded-lg border border-luxury-borderSubtle">
                    {Object.entries(layer.details).map(([k, v]) => (
                      <div key={k} className="flex flex-col">
                        <span className="text-luxury-textMuted text-[10px] uppercase font-sans font-semibold">{k}</span>
                        <span className="text-luxury-text font-semibold break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

