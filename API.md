# NETBANKX — REST API & WebSocket Event Specification

All REST endpoints are rooted under `/api/`. Requests requiring authentication require the HTTP Header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticates user credentials and issues a signed JSON Web Token (JWT).

- **Request Body:**
```json
{
  "username": "shivam",
  "password": "Password@123",
  "role": "CUSTOMER"
}
```

- **Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "u-cust-001",
    "roleId": "CUSTOMER",
    "username": "shivam",
    "email": "shivam.patel@netbankx.internal",
    "firstName": "Shivam",
    "lastName": "Patel",
    "status": "ACTIVE"
  }
}
```

### `GET /api/auth/me`
Retrieves currently authenticated user claims and session profile.

---

## 2. Core Banking Endpoints

### `GET /api/accounts/my`
Retrieves all bank accounts associated with the authenticated customer.

- **Response (200 OK):**
```json
[
  {
    "id": "acc-1001",
    "customerId": "cust-001",
    "branchId": "br-mum-01",
    "accountNumber": "ACC-100001",
    "accountType": "SAVINGS",
    "balance": "250000.00",
    "currency": "INR",
    "status": "ACTIVE"
  }
]
```

### `POST /api/transactions/transfer`
Executes an atomic funds transfer and initiates simulated network packet routing.

- **Request Body:**
```json
{
  "sourceAccountId": "acc-1001",
  "destinationAccountNumber": "ACC-100003",
  "amount": "15000.00",
  "description": "Enterprise consulting fees"
}
```

- **Response (201 Created):**
```json
{
  "message": "Transfer processed successfully",
  "transaction": {
    "id": "txn-5f8a92",
    "referenceNo": "TXN-2026-928172",
    "sourceAccountId": "acc-1001",
    "destinationAccountId": "acc-1003",
    "amount": "15000.00",
    "currency": "INR",
    "type": "TRANSFER",
    "state": "COMPLETED",
    "totalLatencyMs": 28,
    "packetsTransmitted": 7,
    "packetsLost": 0,
    "retransmissions": 0,
    "routingPath": ["MH-MUM", "MH-HUB", "HQ-CORE", "DL-HUB", "DL-DEL"],
    "createdAt": "2026-09-06T18:30:00.000Z"
  }
}
```

### `GET /api/transactions/account/:accountId`
Returns historical ledger activity for a specific account.

### `GET /api/transactions/all`
Returns global transaction journal (Requires `BRANCH_STAFF`, `REGIONAL_MANAGER`, or `HQ_ADMIN`).

---

## 3. Network Topology & Digital Twin Endpoints

### `GET /api/network/topology`
Fetches complete graph model consisting of all nodes, links, and active metrics.

- **Response (200 OK):**
```json
{
  "nodes": [
    {
      "id": "node-hq-core",
      "nodeKey": "DC-HQ",
      "name": "National Datacenter Core Router",
      "nodeType": "HQ_CORE",
      "ipAddress": "10.0.0.1",
      "macAddress": "00:1A:2B:3C:4D:01",
      "status": "HEALTHY",
      "posX": 400,
      "posY": 160
    }
  ],
  "links": [
    {
      "id": "link-hq-mh",
      "sourceNodeId": "node-hq-core",
      "destNodeId": "node-reg-mh",
      "bandwidthMbps": 10000,
      "baseLatencyMs": 8,
      "packetLossRate": 0.0,
      "cost": 8.1,
      "status": "ACTIVE"
    }
  ]
}
```

### `POST /api/network/route/calculate`
Calculates Dijkstra shortest path between arbitrary source and destination router nodes.

- **Request Body:**
```json
{
  "sourceNodeId": "node-br-mum-1",
  "destNodeId": "node-br-del-1"
}
```

- **Response (200 OK):**
```json
{
  "sourceNodeId": "node-br-mum-1",
  "destNodeId": "node-br-del-1",
  "path": ["node-br-mum-1", "node-reg-mh", "node-hq-core", "node-reg-dl", "node-br-del-1"],
  "nodeKeys": ["MH-MUM", "MH-HUB", "HQ-CORE", "DL-HUB", "DL-DEL"],
  "totalLatencyMs": 28,
  "estimatedRttMs": 56,
  "hopCount": 4,
  "totalCost": 28.4,
  "alternativeRouteFound": false,
  "routeReason": "Dijkstra computed primary lowest-cost WAN path"
}
```

### `POST /api/network/fault/node`
Injects or clears a hardware failure on a specific router node.
- **Request Body:** `{ "nodeId": "node-hq-core", "status": "OFFLINE" }`

### `POST /api/network/fault/link`
Toggles link degradation, congestion, or severing.
- **Request Body:** `{ "linkId": "link-hq-mh", "status": "SEVERED" }`

### `POST /api/network/fault/params`
Updates global lab simulation parameters (Loss Rate %, Latency Multiplier, SYN Flood DDoS mode).
- **Request Body:**
```json
{
  "globalLossRateOverride": 0.2,
  "globalLatencyMultiplier": 2.0,
  "ddosSimulationActive": true
}
```

### `POST /api/network/reset`
Restores all router nodes, links, and fault parameters to healthy operational baseline.

---

## 4. Security & Audit Endpoints

### `GET /api/audit/logs`
Returns cryptographically logged security events (Requires `HQ_ADMIN`).

---

## 5. Real-Time WebSocket Events Catalog (Socket.IO)

Clients connect to `ws://<host>:5000/socket.io/`.

| Event Channel | Direction | Payload Description |
| :--- | :--- | :--- |
| `simulation:packet` | Server ? Client | Individual packet hop telemetry: current node, next hop, TCP flags, sequence/ACK, TTL, L2 MAC addresses. |
| `simulation:event` | Server ? Client | Major transaction lifecycle and network events (`ROUTE_CALCULATED`, `PACKET_LOSS`, `TCP_RETRANSMISSION`, `LEDGER_POSTED`). |
| `topology:updated` | Server ? Client | Instant notification when router node or WAN link status changes. |
| `metrics:updated` | Server ? Client | Telemetry broadcast with cumulative packets sent, delivered, lost, RTT, and throughput. |
