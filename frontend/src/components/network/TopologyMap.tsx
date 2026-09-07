import React, { useMemo } from 'react';
import { useNetworkSim } from '../../context/NetworkSimContext';
import { NetworkNode, NetworkLink, SimulationPacket } from '../../types';

interface TopologyMapProps {
  interactive?: boolean;
  highlightPath?: string[];
  filterRegion?: string;
  filterMode?: 'full' | 'regional' | 'branch' | 'transfer';
  height?: number;
  packets?: SimulationPacket[];
  onSelectPacket?: (packet: SimulationPacket) => void;
  onPacketSelect?: (packet: SimulationPacket) => void;
  selectedPacketId?: string;
}

export const TopologyMap: React.FC<TopologyMapProps> = ({
  interactive = true,
  highlightPath,
  filterRegion,
  height = 520,
  packets,
  onSelectPacket,
  onPacketSelect,
  selectedPacketId
}) => {
  const {
    nodes,
    links,
    activePacket,
    selectedNode,
    selectedLink,
    setSelectedNode,
    setSelectedLink,
    toggleNodeStatus,
    toggleLinkStatus
  } = useNetworkSim();

  // Consolidate packets to render
  const renderedPackets = useMemo(() => {
    if (packets && packets.length > 0) return packets;
    if (activePacket) return [activePacket];
    return [];
  }, [packets, activePacket]);

  // Filter nodes if region is selected
  const displayedNodes = useMemo(() => {
    if (!filterRegion) return nodes;
    return nodes.filter(
      n => n.nodeType === 'HQ_CORE' || n.regionId === filterRegion || !n.regionId
    );
  }, [nodes, filterRegion]);

  const displayedLinks = useMemo(() => {
    const nodeIds = new Set(displayedNodes.map(n => n.id));
    return links.filter(l => nodeIds.has(l.sourceNodeId) && nodeIds.has(l.destNodeId));
  }, [links, displayedNodes]);

  const pathSet = useMemo(() => new Set(highlightPath || []), [highlightPath]);

  // Exact Complete Color Archive Network Semantic Colors
  const getNodeColor = (node: NetworkNode) => {
    if (node.status === 'OFFLINE') return '#7B1E20'; // Failure burgundy
    if (node.status === 'DEGRADED') return '#B89F6A'; // Warning amber
    if (pathSet.has(node.id) || pathSet.has(node.nodeKey)) return '#4F6F73'; // Route highlight

    switch (node.nodeType) {
      case 'HQ_CORE':
        return '#4F6F73'; // Slate / Teal
      case 'REGIONAL_HUB':
        return '#6E8888'; // Secondary Slate
      case 'BRANCH_ROUTER':
        return '#607758'; // Sage / Forest Green
      default:
        return '#607758';
    }
  };

  const getLinkColor = (link: NetworkLink) => {
    if (link.status === 'SEVERED') return '#7B1E20'; // Failed link
    if (link.status === 'CONGESTED') return '#B89F6A'; // Congested link

    const isLinkInPath =
      (pathSet.has(link.sourceNodeId) && pathSet.has(link.destNodeId)) ||
      (highlightPath && highlightPath.includes(link.sourceNodeId) && highlightPath.includes(link.destNodeId));

    if (isLinkInPath) return '#4F6F73'; // Active route link
    return '#6E8888'; // Healthy link
  };

  const nodeMap = useMemo(() => {
    const map = new Map<string, NetworkNode>();
    for (const n of nodes) map.set(n.id, n);
    return map;
  }, [nodes]);

  return (
    <div className="relative w-full bg-[#15181B] border border-luxury-charcoalBorder rounded-xl overflow-hidden shadow-luxury-lg">
      {/* Background Matrix Grid */}
      <svg
        className="w-full"
        style={{ height: `${height}px` }}
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="netGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(79, 111, 115, 0.08)" strokeWidth="0.8" />
          </pattern>
          <radialGradient id="hqGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4F6F73" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4F6F73" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#netGrid)" />
        <circle cx="500" cy="90" r="140" fill="url(#hqGlow)" />

        {/* 1. Links / Edges */}
        <g className="links-layer">
          {displayedLinks.map(link => {
            const src = nodeMap.get(link.sourceNodeId);
            const dst = nodeMap.get(link.destNodeId);
            if (!src || !dst) return null;

            const x1 = src.posX * 1000;
            const y1 = src.posY * 600;
            const x2 = dst.posX * 1000;
            const y2 = dst.posY * 600;

            const isSelected = selectedLink?.id === link.id;
            const strokeColor = getLinkColor(link);
            const isPathActive = (pathSet.has(link.sourceNodeId) && pathSet.has(link.destNodeId));

            return (
              <g key={link.id} className="cursor-pointer" onClick={() => interactive && setSelectedLink(link)}>
                {/* Hit area */}
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="18" />

                {/* Visible link */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={isPathActive ? 3.5 : isSelected ? 2.5 : 1.5}
                  strokeDasharray={link.status === 'SEVERED' ? '6 6' : isPathActive ? '8 4' : 'none'}
                  opacity={isPathActive ? 1 : 0.7}
                />

                {/* Link Latency Badge (Center) */}
                <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                  <rect
                    x="-18"
                    y="-9"
                    width="36"
                    height="18"
                    rx="4"
                    fill="#15181B"
                    stroke={strokeColor}
                    strokeWidth="0.8"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isPathActive ? '#F2EEE9' : '#8FA3A6'}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {link.baseLatencyMs}ms
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* 2. Active Traveling Packets Layer */}
        <g className="packets-layer">
          {renderedPackets.map((pkt, idx) => {
            const currNode = nodeMap.get(pkt.currentNodeId);
            const nextNode = pkt.nextHopNodeId ? nodeMap.get(pkt.nextHopNodeId) : undefined;
            if (!currNode) return null;

            // Calculate interpolated coordinate along the link
            let px = currNode.posX * 1000;
            let py = currNode.posY * 600;

            if (nextNode && pkt.progressPercent && pkt.progressPercent > 0 && pkt.progressPercent < 100) {
              const nx = nextNode.posX * 1000;
              const ny = nextNode.posY * 600;
              const ratio = pkt.progressPercent / 100;
              px = px + (nx - px) * ratio;
              py = py + (ny - py) * ratio;
            } else if (renderedPackets.length > 1) {
              // Offset slightly for multi-packet visibility
              const angle = (idx / renderedPackets.length) * 2 * Math.PI;
              px += Math.cos(angle) * 8;
              py += Math.sin(angle) * 8;
            }

            const isSelected = selectedPacketId === pkt.id;
            const packetColor =
              pkt.status === 'DELIVERED' ? '#607758' :
              pkt.status === 'LOST' ? '#7B1E20' :
              pkt.status === 'RETRANSMITTED' ? '#B89F6A' : '#8FA3A6';

            return (
              <g
                key={pkt.id}
                transform={`translate(${px}, ${py})`}
                className="cursor-pointer group"
                onClick={() => (onPacketSelect || onSelectPacket)?.(pkt)}
              >
                {/* Ping pulse */}
                <circle r="12" fill={packetColor} opacity={isSelected ? 0.6 : 0.25} className="animate-ping" />

                {/* Packet Ball */}
                <circle
                  r={isSelected ? 8 : 6}
                  fill={packetColor}
                  stroke="#F2EEE9"
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* Packet Label Box */}
                <g transform="translate(0, -18)">
                  <rect
                    x="-28"
                    y="-9"
                    width="56"
                    height="18"
                    rx="4"
                    fill="#1F1F1E"
                    stroke={isSelected ? '#F2EEE9' : packetColor}
                    strokeWidth={isSelected ? 1.5 : 1}
                  />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#F2EEE9"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {pkt.id.replace(/^PKT-[^-]+-/, '')}
                  </text>
                </g>
              </g>
            );
          })}
        </g>


        {/* 3. Nodes */}
        <g className="nodes-layer">
          {displayedNodes.map(node => {
            const nx = node.posX * 1000;
            const ny = node.posY * 600;
            const isSelected = selectedNode?.id === node.id;
            const isPathActive = pathSet.has(node.id) || pathSet.has(node.nodeKey);
            const color = getNodeColor(node);

            const radius = node.nodeType === 'HQ_CORE' ? 24 : node.nodeType === 'REGIONAL_HUB' ? 20 : 15;

            return (
              <g
                key={node.id}
                className="cursor-pointer group"
                transform={`translate(${nx}, ${ny})`}
                onClick={() => interactive && setSelectedNode(node)}
              >
                {/* Node Outer Ring */}
                <circle
                  r={radius + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth={isPathActive ? 2.5 : isSelected ? 2 : 1}
                  strokeDasharray={node.status === 'OFFLINE' ? '4 4' : 'none'}
                  opacity={isPathActive ? 1 : 0.6}
                />

                {/* Node Core Body */}
                <circle
                  r={radius}
                  fill="#1C2024"
                  stroke={color}
                  strokeWidth="2"
                />

                {/* Node Icon / Type Symbol */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={color}
                  fontSize={radius > 18 ? '14' : '11'}
                  fontWeight="bold"
                >
                  {node.nodeType === 'HQ_CORE' ? '🏛' : node.nodeType === 'REGIONAL_HUB' ? '🌐' : '🏦'}
                </text>

                {/* Node Label */}
                <g transform={`translate(0, ${radius + 14})`}>
                  <rect
                    x="-45"
                    y="-8"
                    width="90"
                    height="16"
                    rx="3"
                    fill="rgba(21, 24, 27, 0.95)"
                    stroke="rgba(40, 45, 51, 0.8)"
                    strokeWidth="0.8"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#EDE6DE"
                    fontSize="9"
                    fontWeight="600"
                    className="font-sans"
                  >
                    {node.name.length > 15 ? node.name.substring(0, 14) + '…' : node.name}
                  </text>
                </g>

                {/* IP Label */}
                <text
                  y={radius + 30}
                  textAnchor="middle"
                  fill="#8B939C"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {node.ipAddress}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Topology Controls & Legend */}
      <div className="absolute top-4 left-4 bg-luxury-charcoalSurface/95 backdrop-blur-md border border-luxury-charcoalBorder rounded-lg p-3 text-xs flex flex-col gap-2 shadow-luxury-md">
        <div className="font-bold text-luxury-charcoalText uppercase tracking-wider text-[10px]">Topology Legend</div>
        <div className="flex items-center gap-2 text-luxury-charcoalMuted">
          <span className="w-2.5 h-2.5 rounded-full bg-luxury-slate"></span>
          <span>HQ National Core (12.0.0.x)</span>
        </div>
        <div className="flex items-center gap-2 text-luxury-charcoalMuted">
          <span className="w-2.5 h-2.5 rounded-full bg-luxury-teal"></span>
          <span>Regional Gateways (203.0.113.x)</span>
        </div>
        <div className="flex items-center gap-2 text-luxury-charcoalMuted">
          <span className="w-2.5 h-2.5 rounded-full bg-luxury-forest"></span>
          <span>Branch Routers (10.x.x.x)</span>
        </div>
        <div className="flex items-center gap-2 text-luxury-burgundy">
          <span className="w-2.5 h-2.5 rounded-full bg-luxury-burgundy"></span>
          <span>Severed / Offline</span>
        </div>
      </div>

      {/* Selected Node / Link Action Overlay */}
      {interactive && selectedNode && (
        <div className="absolute bottom-4 left-4 bg-luxury-charcoalSurface/95 backdrop-blur-md border border-luxury-charcoalBorder rounded-xl p-4 w-72 shadow-luxury-lg">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-bold text-luxury-charcoalText text-sm">{selectedNode.name}</div>
              <div className="text-[10px] font-mono text-luxury-teal">{selectedNode.ipAddress}</div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-luxury-charcoalMuted hover:text-luxury-charcoalText text-xs"
            >
              ✕
            </button>
          </div>
          <div className="text-xs space-y-1 text-luxury-charcoalMuted font-mono mb-3">
            <div>Type: <span className="text-luxury-charcoalText">{selectedNode.nodeType}</span></div>
            <div>MAC: <span className="text-luxury-leather">{selectedNode.macAddress}</span></div>
            <div>Status: <span className={selectedNode.status === 'HEALTHY' ? 'text-luxury-forest font-bold' : 'text-luxury-burgundy font-bold'}>{selectedNode.status}</span></div>
          </div>
          <button
            onClick={() => toggleNodeStatus(selectedNode.id, selectedNode.status)}
            className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedNode.status === 'OFFLINE'
                ? 'bg-luxury-forest/20 text-luxury-forest border border-luxury-forest/40 hover:bg-luxury-forest hover:text-white'
                : 'bg-luxury-burgundy/20 text-luxury-burgundy border border-luxury-burgundy/40 hover:bg-luxury-burgundy hover:text-white'
            }`}
          >
            {selectedNode.status === 'OFFLINE' ? '⚡ Restore Router' : '🚫 Disable Router (Fault Injection)'}
          </button>
        </div>
      )}

      {interactive && selectedLink && (
        <div className="absolute bottom-4 right-4 bg-luxury-charcoalSurface/95 backdrop-blur-md border border-luxury-charcoalBorder rounded-xl p-4 w-72 shadow-luxury-lg">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-bold text-luxury-charcoalText text-sm">WAN Edge Link</div>
              <div className="text-[10px] font-mono text-luxury-charcoalMuted">{selectedLink.id}</div>
            </div>
            <button
              onClick={() => setSelectedLink(null)}
              className="text-luxury-charcoalMuted hover:text-luxury-charcoalText text-xs"
            >
              ✕
            </button>
          </div>
          <div className="text-xs space-y-1 text-luxury-charcoalMuted font-mono mb-3">
            <div>Bandwidth: <span className="text-luxury-charcoalText">{selectedLink.bandwidthMbps} Mbps</span></div>
            <div>Base Latency: <span className="text-luxury-slate">{selectedLink.baseLatencyMs} ms</span></div>
            <div>Loss Rate: <span className="text-luxury-amber">{(selectedLink.packetLossRate * 100).toFixed(2)}%</span></div>
            <div>Status: <span className={selectedLink.status === 'ACTIVE' ? 'text-luxury-forest font-bold' : 'text-luxury-burgundy font-bold'}>{selectedLink.status}</span></div>
          </div>
          <button
            onClick={() => toggleLinkStatus(selectedLink.id, selectedLink.status)}
            className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedLink.status === 'SEVERED'
                ? 'bg-luxury-forest/20 text-luxury-forest border border-luxury-forest/40 hover:bg-luxury-forest hover:text-white'
                : 'bg-luxury-burgundy/20 text-luxury-burgundy border border-luxury-burgundy/40 hover:bg-luxury-burgundy hover:text-white'
            }`}
          >
            {selectedLink.status === 'SEVERED' ? '🔗 Reconnect Link' : '✂️ Sever Link (Fault Injection)'}
          </button>
        </div>
      )}
    </div>
  );
};

