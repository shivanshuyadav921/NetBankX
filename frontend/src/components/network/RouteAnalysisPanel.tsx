import React from 'react';
import { CalculatedRoute, NetworkNode } from '../../types';
import { Network, Route, Zap, CheckCircle, AlertTriangle } from 'lucide-react';

export interface RouteAnalysisPanelProps {
  route?: CalculatedRoute | null;
  routePath?: string[];
  sourceBranchName?: string;
  destBranchName?: string;
  totalCost?: number;
  estimatedLatencyMs?: number;
  algorithm?: string;
  status?: string;
  nodes?: NetworkNode[];
  activeNodeId?: string;
  sourceLabel?: string;
  destLabel?: string;
}

export const RouteAnalysisPanel: React.FC<RouteAnalysisPanelProps> = ({
  route,
  routePath,
  sourceBranchName,
  destBranchName,
  totalCost,
  estimatedLatencyMs,
  nodes = [],
  activeNodeId
}) => {
  const activeRoute: CalculatedRoute | null = route || (routePath && routePath.length > 0 ? {
    path: routePath,
    nodeKeys: routePath,
    totalCost: totalCost || (routePath.length - 1) * 4,
    totalLatencyMs: estimatedLatencyMs || (routePath.length - 1) * 5,
    hopCount: routePath.length - 1,
    bottleneckBandwidthMbps: 1000,
    alternativeRouteFound: false,
    routeReason: `Computed via Dijkstra Shortest Path: ${sourceBranchName || 'Source'} → ${destBranchName || 'Destination'}`
  } : null);

  if (!activeRoute) {
    return (
      <div className="luxury-card p-5 text-center text-luxury-textMuted">
        <Route className="w-6 h-6 mx-auto mb-2 opacity-40 text-luxury-slate" />
        <div className="text-xs font-semibold text-luxury-text">No Active Route Calculated</div>
        <div className="text-[11px] text-luxury-textMuted mt-0.5">
          Select source and destination endpoints to compute dynamic Dijkstra shortest path.
        </div>
      </div>
    );
  }

  const nodeMap = new Map<string, NetworkNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  return (
    <div className="luxury-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-luxury-border pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-luxury-surfaceControl text-luxury-slate border border-luxury-border">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-luxury-text text-xs uppercase tracking-wider">
              Dijkstra Route Analysis
            </h4>
            <p className="text-[11px] text-luxury-textMuted font-mono">
              Graph Shortest-Path Engine · Cost: {activeRoute.totalCost} · {activeRoute.hopCount} Hops
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activeRoute.alternativeRouteFound ? (
            <span className="px-2 py-0.5 rounded bg-luxury-amberBg text-luxury-amber border border-luxury-amberBorder text-[10px] font-mono font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>FAILOVER ACTIVE</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-luxury-successBg text-luxury-forest border border-luxury-successBorder text-[10px] font-mono font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>OPTIMAL PATH</span>
            </span>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
        <div className="p-2.5 rounded-lg bg-luxury-surfaceControl border border-luxury-border">
          <span className="text-luxury-textMuted text-[10px] uppercase block">Total Hops</span>
          <span className="text-luxury-text font-bold text-sm">{activeRoute.hopCount}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-luxury-surfaceControl border border-luxury-border">
          <span className="text-luxury-textMuted text-[10px] uppercase block">Graph Cost</span>
          <span className="text-luxury-leather font-bold text-sm">{activeRoute.totalCost}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-luxury-surfaceControl border border-luxury-border">
          <span className="text-luxury-textMuted text-[10px] uppercase block">Est. Latency</span>
          <span className="text-luxury-slate font-bold text-sm">{activeRoute.totalLatencyMs} ms</span>
        </div>
        <div className="p-2.5 rounded-lg bg-luxury-surfaceControl border border-luxury-border">
          <span className="text-luxury-textMuted text-[10px] uppercase block">Round-Trip RTT</span>
          <span className="text-luxury-forest font-bold text-sm">{activeRoute.estimatedRttMs || activeRoute.totalLatencyMs * 2} ms</span>
        </div>
      </div>

      {/* Node Path Hop List */}
      <div className="space-y-1.5 font-mono text-xs">
        <div className="text-[10px] text-luxury-textMuted uppercase font-semibold px-1 mb-1">
          Dynamic Hop Sequence (Dijkstra Traversal)
        </div>

        <div className="relative pl-4 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-luxury-border">
          {activeRoute.path.map((nodeId, idx) => {
            const node = nodeMap.get(nodeId);
            const isFirst = idx === 0;
            const isLast = idx === activeRoute.path.length - 1;
            const isCurrent = activeNodeId === nodeId;

            return (
              <div key={nodeId} className="relative flex items-center justify-between group">
                {/* Node Bullet */}
                <div
                  className={`absolute -left-4 w-2.5 h-2.5 rounded-full border ${
                    isCurrent
                      ? 'bg-luxury-leather border-luxury-text animate-ping'
                      : isFirst || isLast
                      ? 'bg-luxury-slate border-luxury-text'
                      : 'bg-luxury-surface border-luxury-slate'
                  }`}
                />

                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-luxury-textMuted w-4">#{idx + 1}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold ${isCurrent ? 'text-luxury-leather' : 'text-luxury-text'}`}>
                        {node?.name || activeRoute.nodeKeys[idx] || nodeId}
                      </span>
                      {isFirst && <span className="text-[9px] px-1 rounded bg-luxury-slate text-luxury-bg font-bold font-sans">SRC</span>}
                      {isLast && <span className="text-[9px] px-1 rounded bg-luxury-forest text-luxury-bg font-bold font-sans">DST</span>}
                    </div>
                    <div className="text-[10px] text-luxury-textMuted font-mono">
                      {node?.ipAddress || '10.x.x.x'} · {node?.nodeType || 'ROUTER'} · MAC: {node?.macAddress || '52:54:00:xx'}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-luxury-textMuted">
                    {idx === 0 ? '0 ms' : `+${Math.round(activeRoute.totalLatencyMs / Math.max(1, activeRoute.hopCount))}ms`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeRoute.routeReason && (
        <div className="p-2.5 rounded-lg bg-luxury-surfaceControl border border-luxury-borderSubtle text-[11px] text-luxury-textSecondary font-mono flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-luxury-leather shrink-0" />
          <span>{activeRoute.routeReason}</span>
        </div>
      )}
    </div>
  );
};
