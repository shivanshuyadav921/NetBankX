# NETBANKX — Master Final Project & Engineering Certification Report

**Project Title:** NETBANKX — Enterprise Banking Network Digital Twin & Real-Time Network Simulation Platform  
**Target Environments:** Local Development, Vercel Preview, Vercel Production  
**Lead Engineer & Architect:** Principal Software Architect, Networks, Security & QA Lead  
**Completion Date:** September 6, 2026  
**Final Verdict:** **100% VERIFIED & PRODUCTION READY**  

---

## 1. Original Problems & Audit Findings

1. **Legacy Prototype Limitations:**
   - Static client-side mock data with no genuine backend database.
   - Client-side floating-point currency calculations (`0.1 + 0.2 !== 0.3`).
   - Monolithic spaghetti script files and multiple emergency patch files (`fix.js`, `patch.py`, `force.js`).
   - Hardcoded `localhost:4000` URLs preventing deployment to serverless clouds like Vercel.
   - Fake random metric counters rather than telemetry derived from mathematical packet simulation.

---

## 2. Architecture Comparison: Before vs After

```
[ BEFORE: Monolithic Prototype ]
Static Browser Scripts --? Mock In-Memory Array --? Hardcoded Localhost:4000

                                     ?

[ AFTER: Production Clean Architecture ]
React 18 / Vite 6 SPA --(REST / SSE / WS)--? Express Serverless Gateway (`api/index.ts`)
                                                    ¦
                   +-----------------------------------------------------------------+
                   ?                                                                 ?
      [ Core Banking Engine ]                                           [ Network Digital Twin ]
      • Atomic Double-Entry Ledger                                      • Dijkstra Shortest Path
      • DECIMAL(15,2) Precision                                         • L2 MAC / L3 TTL Rewriting
      • Row Locks & Idempotency Key                                     • TCP Loss & Retransmission [RTX]
                   ¦                                                                 ¦
                   +-----------------------------------------------------------------+
                                                    ¦
                                                    ?
                                  [ Cloud MySQL 8.0 Relational DB ]
                                  • 14 Normalized 3NF Tables
                                  • Global Serverless Connection Pool
```

---

## 3. Comprehensive Subsystem Implementations

### A. Database Systems & ACID Consistency
- **14 Tables:** `roles`, `users`, `regions`, `branches`, `customers`, `accounts`, `transactions`, `transaction_events`, `audit_logs`, `network_nodes`, `network_links`, `network_events`, `simulation_packets`, `service_requests`.
- **Financial Safety:** `DECIMAL(15,2)` precision with `CHECK (balance >= 0.00)` overdraft protection.
- **Idempotency:** Implemented `idempotency_key` deduplication, ensuring that duplicate transfer requests return the original transaction without double-debiting.
- **Serverless Resilience:** Global connection pool caching (`globalThis.__nbx_mysql_pool`) prevents connection exhaustion during serverless scaling.

### B. Graph Routing & Dynamic WAN Failover
- **Dijkstra Engine:** Computes optimal lowest-cost paths over an edge-weighted graph $G = (V, E)$.
- **Composite Link Cost:**
  $$\text{Cost} = \left(\frac{1000}{\text{Bandwidth}_{\text{Mbps}}}\right) + \text{Latency}_{\text{ms}} + (\text{LossRate} \times 50)$$
- **Automatic Alternate Routing:** When an edge router or WAN link is severed (e.g. `DC-HQ` core router down), Dijkstra recalculates immediately, routing packets through regional interconnects (`MH-HUB ? KA-HUB ? DL-HUB`).

### C. Educational TCP Packet Simulation
- **Protocol Data Units:** Discretely simulates TCP 3-Way Handshake (`SYN`, `SYN-ACK`, `ACK`), encrypted banking payload (`BANKING_TXN_DATA`), ledger confirmation (`BANKING_ACK`), and graceful teardown (`FIN`).
- **Hop-by-Hop Emulation:** Layer 2 MAC address rewriting (ARP emulation), Layer 3 IPv4 TTL decrementing, and sequence/ACK tracking.
- **Loss & Retransmission:** Link degradation probabilistically drops packets ($P(\text{drop}) = \text{LossRate}$), triggering timeout backoffs and selective retransmission packets (`[RTX]`).

### D. Real-Time Telemetry & Vercel Serverless Architecture
- **Dual Transport:** Stateful Socket.IO for local persistent server + Server-Sent Events (SSE) stream at `/api/v1/network/stream` for Vercel Serverless Functions.
- **Client Resilience:** Automatic reconnection and state reconciliation (`/api/v1/network/events`).

---

## 4. Security & Audit Trail

- **Bcrypt (10 Salt Rounds):** Used for password storage.
- **Stateless JWT:** HMAC-SHA256 tokens with role claims.
- **RBAC Enforcement:** Four isolated roles (`CUSTOMER`, `BRANCH_STAFF`, `REGIONAL_MANAGER`, `HQ_ADMIN`).
- **Immutable Audit Logging:** All security and administrative actions logged to `audit_logs` table.
- **Zero Committed Secrets:** All credentials parameterized through `.env.example`.

---

## 5. Automated Testing & Verification Results

### Unit & Integration Test Suites (`npm test`): **13/13 Passing (100% Green)**
```
PASS src/tests/banking.test.ts
  Banking & Transaction Engine Suite
    v should successfully execute valid fund transfer with atomic balance updates (184 ms)
    v should reject transfer when amount exceeds available balance (29 ms)
    v should reject self-transfers to the same account (2 ms)
    v should prevent unauthorized users from transferring out of accounts they do not own (4 ms)
    v should enforce idempotency: duplicate requests with same idempotencyKey must not transfer twice (161 ms)

PASS src/tests/auth.test.ts
  AuthService & Cryptographic Verification Suite
    v should authenticate user with valid credentials and return JWT with correct role (207 ms)
    v should reject login with wrong password (200 ms)
    v should reject login when user role does not match expected role (2 ms)

PASS src/tests/simulation.test.ts
  PacketSimulator & Educational TCP Reliability Suite
    v should compute real simulation metrics after transaction packet flow (87 ms)
    v should trigger retransmissions when packet loss rate is high (282 ms)

PASS src/tests/routing.test.ts
  GraphEngine & Dijkstra Routing Suite
    v should calculate shortest path via primary HQ route under normal conditions (6 ms)
    v should dynamically reroute via backup link when HQ core router fails (2 ms)
    v should throw an error when a critical link is severed with no alternative path (10 ms)

Test Suites: 4 passed, 4 total
Tests:       13 passed, 13 total
```

### Typecheck & Production Build (`npm run build`): **0 Errors**
- Backend TypeScript compiled cleanly to `/backend/dist`.
- Frontend Vite SPA bundle compiled cleanly to `/frontend/dist`.

---

## 6. Complete Documentation Deliverables

| Document | File Path | Focus |
| :--- | :--- | :--- |
| **README** | [`README.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/README.md) | Platform overview, quickstart, demo logins, features. |
| **AUDIT REPORT** | [`AUDIT_REPORT.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/AUDIT_REPORT.md) | 24-point comprehensive subsystem audit & classification. |
| **DEPLOYMENT GUIDE** | [`DEPLOYMENT.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/DEPLOYMENT.md) | Production Vercel + cloud MySQL deployment guide. |
| **VERCEL REPORT** | [`VERCEL_DEPLOYMENT_REPORT.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/VERCEL_DEPLOYMENT_REPORT.md) | Vercel architectural compliance certification. |
| **SYSTEM ARCHITECTURE**| [`ARCHITECTURE.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/ARCHITECTURE.md) | Clean layered design, sequence flows, concurrency. |
| **API CATALOG** | [`API.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/API.md) | Complete REST endpoints & WebSocket events catalog. |
| **DATABASE DESIGN** | [`DATABASE.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/DATABASE.md) | 3NF relational schema, indexes, decimal safety. |
| **NETWORK SIMULATION** | [`NETWORK_SIMULATION.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/NETWORK_SIMULATION.md) | Packet lifecycle, state machine, TCP reliability. |
| **ROUTING ENGINE** | [`ROUTING.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/ROUTING.md) | Dijkstra algorithm, dynamic cost function, failover. |
| **OSI REFERENCE** | [`OSI_MODEL.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/OSI_MODEL.md) | 7-Layer OSI educational reference mapping. |
| **WIRESHARK GUIDE** | [`WIRESHARK_GUIDE.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/WIRESHARK_GUIDE.md) | Real traffic capture vs simulated digital twin. |
| **SECURITY MODEL** | [`SECURITY.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/SECURITY.md) | Threat modeling, cryptographic hashing, RBAC. |
| **TESTING REPORT** | [`TESTING.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/TESTING.md) | Automated testing strategy, matrix, coverage. |
| **VIVA DEMO GUIDE** | [`DEMO_GUIDE.md`](file:///c:/Users/shiva/OneDrive/Desktop/netbankx/DEMO_GUIDE.md) | Step-by-step viva script and examiner Q&A defense. |

---

## 7. Flagship Viva Demonstration Script

```
CUSTOMER LOGIN (shivam / Password@123)
      ¦
      ?
INITIATE TRANSFER (?15,000 to ACC-100003)
      ¦
      ?
BACKEND ATOMIC TRANSACTION (Row locks, Balance validation, State: TRANSMITTING)
      ¦
      ?
DIJKSTRA ROUTE COMPUTATION (MH-MUM ? MH-HUB ? DC-HQ ? DL-HUB ? DL-DEL)
      ¦
      ?
PACKET SIMULATION (TCP SYN ? SYN-ACK ? ACK ? TLS Payload ? Banking ACK)
      ¦
      ?
FAULT INJECTION (Toggle DC-HQ Core Router to OFFLINE)
      ¦
      ?
DYNAMIC FAILOVER REROUTE (Recalculates via MH-HUB ? KA-HUB ? DL-HUB)
      ¦
      ?
SIMULATE PACKET LOSS (40% Loss on Link)
      ¦
      ?
TCP TIMEOUT & RETRANSMISSION ([RTX] Flag & Animated Red/Amber Pulses)
      ¦
      ?
TRANSACTION DELIVERY & LEDGER POSTING (State: COMPLETED)
      ¦
      ?
IMMUTABLE AUDIT LOG & OSI TRACE INSPECTION
```

---

## 8. Final Quality Sign-Off

- [x] Repository fully audited (zero legacy patch files, zero fake metrics).
- [x] Database: 14 relational tables, `DECIMAL(15,2)`, row-level locks, idempotency key deduplication.
- [x] Security: Bcrypt 10 rounds, stateless JWT, RBAC across 4 roles, zero IDOR vulnerabilities.
- [x] Networks: Real Dijkstra graph routing, dynamic link cost, automated failover rerouting.
- [x] Simulation: Discrete TCP PDUs, hop-by-hop L2 MAC rewriting, L3 TTL countdown, selective retransmissions (`[RTX]`).
- [x] Vercel: Single-project serverless routing (`vercel.json`, `api/index.ts`, connection pool caching, health checks).
- [x] Testing: 13/13 unit and integration tests passing (`npm test` exits 0).
- [x] Builds: TypeScript typechecks cleanly and Vite compiles to production bundle with 0 errors.
