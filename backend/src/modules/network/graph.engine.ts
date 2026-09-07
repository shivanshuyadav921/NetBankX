import { NetworkNode, NetworkLink, CalculatedRoute } from './network.types.js';

export interface GraphEdge {
  linkId: string;
  sourceId: string;
  targetId: string;
  weight: number;
  latencyMs: number;
  bandwidthMbps: number;
  lossRate: number;
  status: string;
}

export class GraphEngine {
  private nodes: Map<string, NetworkNode> = new Map();
  private adjacency: Map<string, GraphEdge[]> = new Map();

  constructor(nodes: NetworkNode[], links: NetworkLink[]) {
    this.buildGraph(nodes, links);
  }

  public buildGraph(nodes: NetworkNode[], links: NetworkLink[]): void {
    this.nodes.clear();
    this.adjacency.clear();

    for (const node of nodes) {
      this.nodes.set(node.id, node);
      this.adjacency.set(node.id, []);
    }

    for (const link of links) {
      // Compute realistic dynamic edge weight
      const weight = this.calculateEdgeWeight(link);

      // Bidirectional enterprise WAN links
      const forwardEdge: GraphEdge = {
        linkId: link.id,
        sourceId: link.sourceNodeId,
        targetId: link.destNodeId,
        weight,
        latencyMs: link.baseLatencyMs,
        bandwidthMbps: link.bandwidthMbps,
        lossRate: link.packetLossRate,
        status: link.status
      };

      const reverseEdge: GraphEdge = {
        linkId: link.id,
        sourceId: link.destNodeId,
        targetId: link.sourceNodeId,
        weight,
        latencyMs: link.baseLatencyMs,
        bandwidthMbps: link.bandwidthMbps,
        lossRate: link.packetLossRate,
        status: link.status
      };

      if (this.adjacency.has(link.sourceNodeId)) {
        this.adjacency.get(link.sourceNodeId)!.push(forwardEdge);
      }
      if (this.adjacency.has(link.destNodeId)) {
        this.adjacency.get(link.destNodeId)!.push(reverseEdge);
      }
    }
  }

  private calculateEdgeWeight(link: NetworkLink): number {
    // If link is severed, weight is infinite
    if (link.status === 'SEVERED') {
      return Infinity;
    }

    const targetNode = this.nodes.get(link.destNodeId);
    if (targetNode && targetNode.status === 'OFFLINE') {
      return Infinity;
    }

    // Weight metric: cost * 10 + latency + loss penalty + degradation penalty
    let weight = (link.cost * 10) + link.baseLatencyMs + (link.packetLossRate * 500);

    if (link.status === 'CONGESTED') {
      weight += 100;
    }

    if (targetNode && targetNode.status === 'DEGRADED') {
      weight += 200;
    }

    return Math.max(1, weight);
  }

  /**
   * Dijkstra Shortest Path Algorithm
   */
  public findShortestPath(sourceId: string, destId: string): CalculatedRoute {
    if (!this.nodes.has(sourceId) || !this.nodes.has(destId)) {
      throw new Error(`Invalid source (${sourceId}) or destination (${destId}) node in topology`);
    }

    const distances: Map<string, number> = new Map();
    const previous: Map<string, { nodeId: string; edge: GraphEdge } | null> = new Map();
    const unvisited: Set<string> = new Set();

    for (const nodeId of this.nodes.keys()) {
      distances.set(nodeId, Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }

    distances.set(sourceId, 0);

    while (unvisited.size > 0) {
      // Find unvisited node with lowest distance
      let currentId: string | null = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId)!;
        if (dist < minDistance) {
          minDistance = dist;
          currentId = nodeId;
        }
      }

      if (currentId === null || minDistance === Infinity) {
        break; // Destination unreachable or all reachable nodes processed
      }

      if (currentId === destId) {
        break; // Reached destination
      }

      unvisited.delete(currentId);

      // Check current node status
      const currentNode = this.nodes.get(currentId);
      if (currentNode && currentNode.status === 'OFFLINE' && currentId !== sourceId) {
        continue;
      }

      const neighbors = this.adjacency.get(currentId) || [];
      for (const edge of neighbors) {
        if (!unvisited.has(edge.targetId)) continue;
        if (edge.weight === Infinity) continue;

        const targetNode = this.nodes.get(edge.targetId);
        if (targetNode && targetNode.status === 'OFFLINE' && edge.targetId !== destId) {
          continue;
        }

        const altDistance = distances.get(currentId)! + edge.weight;
        if (altDistance < distances.get(edge.targetId)!) {
          distances.set(edge.targetId, altDistance);
          previous.set(edge.targetId, { nodeId: currentId, edge });
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    const usedEdges: GraphEdge[] = [];
    let curr: string | null = destId;

    if (distances.get(destId) === Infinity) {
      throw new Error(`No viable network route between ${sourceId} and ${destId} (Link/Router severed)`);
    }

    while (curr) {
      path.unshift(curr);
      const prevInfo = previous.get(curr);
      if (prevInfo) {
        usedEdges.unshift(prevInfo.edge);
        curr = prevInfo.nodeId;
      } else {
        curr = null;
      }
    }

    if (path.length === 0 || path[0] !== sourceId) {
      throw new Error(`Failed to calculate valid path from ${sourceId} to ${destId}`);
    }

    // Compute latency and cost
    let totalLatencyMs = 0;
    let totalCost = 0;
    let alternativeRouteFound = false;

    for (const edge of usedEdges) {
      totalLatencyMs += edge.latencyMs;
      totalCost += edge.weight;
    }

    // Inspect if backup routes were utilized (bypassing HQ core)
    const nodeKeys = path.map(id => this.nodes.get(id)?.nodeKey || id);
    const usesInterRegionalBackup = !path.some(id => id.toUpperCase().includes('HQ')) && path.filter(p => p.toUpperCase().includes('HUB')).length >= 2;

    let routeReason = 'Optimal primary national backbone route selected by Dijkstra algorithm.';
    if (usesInterRegionalBackup) {
      alternativeRouteFound = true;
      routeReason = 'Primary direct HQ link unavailable or degraded. Routing engine diverted through Inter-Regional Mesh Gateway.';
    }

    return {
      sourceNodeId: sourceId,
      destNodeId: destId,
      path,
      nodeKeys,
      totalLatencyMs,
      estimatedRttMs: totalLatencyMs * 2,
      hopCount: path.length - 1,
      totalCost: Math.round(totalCost),
      alternativeRouteFound,
      routeReason
    };
  }
}
