# NETBANKX — WAN Routing Engine & Dynamic Dijkstra Graph Theory

## 1. Mathematical Graph Model

The enterprise banking WAN is modeled as a directed, edge-weighted graph:
$$G = (V, E)$$
where:
- $V$: Set of routing nodes $\{ \text{DC-HQ}, \text{MH-HUB}, \text{DL-HUB}, \text{KA-HUB}, \text{MH-MUM-001}, \dots \}$
- $E$: Set of active physical and virtual point-to-point communication links.

### Composite Dynamic Link Cost Metric
Link weight $W(u, v)$ is calculated based on bandwidth, latency, and packet loss:
$$W(u, v) = \left( \frac{1000}{\text{Bandwidth}_{\text{Mbps}}} \right) + \text{Latency}_{\text{ms}} + (\text{LossRate} \times 50)$$

- A high-speed $10\text{ Gbps}$ fiber link with $8\text{ ms}$ latency has cost $\approx 8.1$.
- A congested or degraded link with $20\%$ packet loss adds $+10$ to its cost metric, causing Dijkstra to automatically divert traffic to cleaner alternative paths.

---

## 2. Dijkstra's Algorithm Implementation

The pathfinding algorithm finds the shortest path $P = (v_0, v_1, \dots, v_k)$ minimizing total cost:
$$\min \sum_{i=0}^{k-1} W(v_i, v_{i+1})$$

```typescript
// Dijkstra Pseudocode in GraphEngine
const distances: Record<string, number> = {};
const previous: Record<string, string | null> = {};
const unvisited = new Set<string>();

// 1. Initialization
for (const node of nodes) {
  distances[node.id] = (node.id === sourceId) ? 0 : Infinity;
  previous[node.id] = null;
  if (node.status !== 'OFFLINE') unvisited.add(node.id);
}

// 2. Main Relaxation Loop
while (unvisited.size > 0) {
  const current = getMinDistanceNode(unvisited, distances);
  if (!current || distances[current] === Infinity) break;
  if (current === destId) break;

  unvisited.delete(current);

  for (const neighbor of getHealthyNeighbors(current)) {
    const link = getActiveLink(current, neighbor);
    const alt = distances[current] + link.cost;
    if (alt < distances[neighbor]) {
      distances[neighbor] = alt;
      previous[neighbor] = current;
    }
  }
}
```

---

## 3. Automated WAN Dynamic Failover

### Scenario: Primary HQ Datacenter Router (`DC-HQ`) Outage
1. An administrator or examiner toggles `DC-HQ` to `OFFLINE` in the Fault Injection Lab.
2. The `GraphEngine` marks `DC-HQ` as unavailable for vertex traversal.
3. When a transfer from Mumbai (`MH-MUM-001`) to Delhi (`DL-DEL-001`) is initiated:
   - **Baseline Primary Route:**
     $$\text{MH-MUM} \longrightarrow \text{MH-HUB} \longrightarrow \mathbf{\text{DC-HQ}} \longrightarrow \text{DL-HUB} \longrightarrow \text{DL-DEL}$$
   - **Dynamic Failover Route (Regional Mesh Interconnect):**
     $$\text{MH-MUM} \longrightarrow \text{MH-HUB} \longrightarrow \mathbf{\text{KA-HUB}} \longrightarrow \mathbf{\text{DL-HUB}} \longrightarrow \text{DL-DEL}$$
4. The system broadcasts `alternativeRouteFound: true` and animates the failover bypass path seamlessly on the NOC map.
