import { GraphEngine } from '../modules/network/graph.engine.js';
import { NetworkNode, NetworkLink } from '../modules/network/network.types.js';

describe('GraphEngine & Dijkstra Routing Suite', () => {
  const mockNodes: NetworkNode[] = [
    { id: 'N-CUST', nodeKey: 'CUST-1', name: 'Customer Device', nodeType: 'CUSTOMER_EDGE', ipAddress: '192.168.1.10', macAddress: '00:1A:2B:00:00:01', status: 'HEALTHY', posX: 0.1, posY: 0.5 },
    { id: 'N-BR1', nodeKey: 'BR-MUM', name: 'Mumbai Router', nodeType: 'BRANCH_ROUTER', ipAddress: '10.1.1.1', macAddress: '00:1A:2B:00:00:02', status: 'HEALTHY', posX: 0.25, posY: 0.5 },
    { id: 'N-HUB1', nodeKey: 'MH-HUB', name: 'MH Regional Gateway', nodeType: 'REGIONAL_HUB', ipAddress: '203.0.113.1', macAddress: '00:1A:2B:00:00:03', status: 'HEALTHY', posX: 0.4, posY: 0.5 },
    { id: 'N-HQ', nodeKey: 'HQ-CORE', name: 'HQ Core Router', nodeType: 'HQ_CORE', ipAddress: '12.0.0.1', macAddress: '00:1A:2B:00:00:04', status: 'HEALTHY', posX: 0.5, posY: 0.2 },
    { id: 'N-HUB2', nodeKey: 'KA-HUB', name: 'KA Regional Gateway', nodeType: 'REGIONAL_HUB', ipAddress: '203.0.113.2', macAddress: '00:1A:2B:00:00:05', status: 'HEALTHY', posX: 0.6, posY: 0.5 },
    { id: 'N-BR2', nodeKey: 'BR-BLR', name: 'Bangalore Router', nodeType: 'BRANCH_ROUTER', ipAddress: '10.2.1.1', macAddress: '00:1A:2B:00:00:06', status: 'HEALTHY', posX: 0.75, posY: 0.5 },
    { id: 'N-RECIP', nodeKey: 'CUST-2', name: 'Recipient Device', nodeType: 'CUSTOMER_EDGE', ipAddress: '192.168.2.20', macAddress: '00:1A:2B:00:00:07', status: 'HEALTHY', posX: 0.9, posY: 0.5 }
  ];

  const mockLinks: NetworkLink[] = [
    { id: 'L-1', sourceNodeId: 'N-CUST', destNodeId: 'N-BR1', bandwidthMbps: 100, baseLatencyMs: 2, packetLossRate: 0, cost: 1, status: 'ACTIVE' },
    { id: 'L-2', sourceNodeId: 'N-BR1', destNodeId: 'N-HUB1', bandwidthMbps: 1000, baseLatencyMs: 3, packetLossRate: 0, cost: 1, status: 'ACTIVE' },
    { id: 'L-3', sourceNodeId: 'N-HUB1', destNodeId: 'N-HQ', bandwidthMbps: 5000, baseLatencyMs: 6, packetLossRate: 0, cost: 2, status: 'ACTIVE' },
    { id: 'L-4', sourceNodeId: 'N-HQ', destNodeId: 'N-HUB2', bandwidthMbps: 5000, baseLatencyMs: 8, packetLossRate: 0, cost: 2, status: 'ACTIVE' },
    { id: 'L-5', sourceNodeId: 'N-HUB2', destNodeId: 'N-BR2', bandwidthMbps: 1000, baseLatencyMs: 2, packetLossRate: 0, cost: 1, status: 'ACTIVE' },
    { id: 'L-6', sourceNodeId: 'N-BR2', destNodeId: 'N-RECIP', bandwidthMbps: 100, baseLatencyMs: 2, packetLossRate: 0, cost: 1, status: 'ACTIVE' },
    // Direct inter-regional backup link bypassing HQ (higher cost than primary route)
    { id: 'L-BACKUP', sourceNodeId: 'N-HUB1', destNodeId: 'N-HUB2', bandwidthMbps: 2500, baseLatencyMs: 12, packetLossRate: 0, cost: 6, status: 'ACTIVE' }
  ];

  it('should calculate shortest path via primary HQ route under normal conditions', () => {
    const engine = new GraphEngine(mockNodes, mockLinks);
    const route = engine.findShortestPath('N-CUST', 'N-RECIP');

    expect(route).toBeDefined();
    expect(route.hopCount).toBe(6);
    expect(route.path).toEqual(['N-CUST', 'N-BR1', 'N-HUB1', 'N-HQ', 'N-HUB2', 'N-BR2', 'N-RECIP']);
    expect(route.totalLatencyMs).toBe(2 + 3 + 6 + 8 + 2 + 2); // 23ms
    expect(route.alternativeRouteFound).toBe(false);
  });

  it('should dynamically reroute via backup link when HQ core router fails', () => {
    const nodesWithHQFailed = mockNodes.map(n => n.id === 'N-HQ' ? { ...n, status: 'OFFLINE' as const } : n);
    const engine = new GraphEngine(nodesWithHQFailed, mockLinks);

    const route = engine.findShortestPath('N-CUST', 'N-RECIP');

    expect(route).toBeDefined();
    // Should bypass N-HQ and take N-HUB1 -> N-HUB2 directly
    expect(route.path).toEqual(['N-CUST', 'N-BR1', 'N-HUB1', 'N-HUB2', 'N-BR2', 'N-RECIP']);
    expect(route.hopCount).toBe(5);
    expect(route.totalLatencyMs).toBe(2 + 3 + 12 + 2 + 2); // 21ms
    expect(route.alternativeRouteFound).toBe(true);
  });

  it('should throw an error when a critical link is severed with no alternative path', () => {
    const severedLinks = mockLinks.map(l => l.id === 'L-1' ? { ...l, status: 'SEVERED' as const } : l);
    const engine = new GraphEngine(mockNodes, severedLinks);

    expect(() => {
      engine.findShortestPath('N-CUST', 'N-RECIP');
    }).toThrow(/No viable network route/);
  });
});
