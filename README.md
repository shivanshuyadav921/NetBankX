# NETBANKX — Enterprise Banking Network Digital Twin & Simulation Platform

> **Final-Year Computer Science & Engineering Capstone Project**  
> *A production-grade educational core banking system unified with an enterprise WAN graph routing and TCP reliability digital twin.*

---

## ??? Executive Summary

Modern core banking systems depend critically on low-latency, resilient enterprise Wide Area Networks (WANs). **NETBANKX** bridges distributed systems engineering, transactional database consistency, and computer networking theory into an interactive full-stack platform.

Unlike standard CRUD projects, every fund transfer executed in NETBANKX is mapped to simulated Layer 2–7 Protocol Data Units (PDUs) traversing an active network graph. Pathfinding is computed dynamically using **Dijkstra's Shortest Path Algorithm** with real-time WAN metrics (bandwidth, propagation delay, and jitter). Students, faculty, and viva examiners can inject live network impairments—such as router crashes, link severing, packet loss, and DDoS SYN floods—and observe automated dynamic failover and TCP retransmission behavior in real time.

---

## ?? Key Engineering Capabilities

1. **Enterprise Banking Core (ACID-Compliant)**
   - Double-entry atomic fund transfers using `DECIMAL(15,2)` precision to eliminate IEEE 754 floating-point errors.
   - Dual-engine architecture: Native MySQL 8.0 connection pool with an embedded zero-setup Transactional In-Memory Relational Engine fallback for instant demonstrations.
   - Comprehensive multi-tenant RBAC (`HQ_ADMIN`, `REGIONAL_MANAGER`, `BRANCH_STAFF`, `CUSTOMER`).

2. **Network Digital Twin & Graph Routing**
   - In-memory graph model modeling National HQ Core Routers, Regional Gateway Hubs (MH, DL, KA), and Branch Routers.
   - Dynamic Dijkstra routing with composite link cost function:
     $$\text{Cost} = \left(\frac{1000}{\text{Bandwidth}_{\text{Mbps}}}\right) + \text{Latency}_{\text{ms}} + (\text{LossRate} \times 50)$$
   - Automated path recalculation upon link/node failure with instant failover routing.

3. **Layer 2–7 Educational Packet Simulator**
   - Simulates TCP 3-Way Handshake (`SYN`, `SYN-ACK`, `ACK`), payload segmentation, sequence/acknowledgement numbers, and Layer 4 teardown (`FIN`).
   - Hop-by-hop Layer 2 MAC address rewriting (ARP emulation) and Layer 3 TTL decrement.
   - Educational TCP reliability model with configurable packet loss, timeout detection, and selective retransmissions (`[RTX]`).

4. **Interactive Real-Time Operations Lab (React 18 + SVG)**
   - Dark-mode NOC (Network Operations Center) dashboard rendered in 60fps SVG with animated packet flow pulses.
   - Full 7-Layer OSI packet inspector detailing headers and payload at every hop.
   - Interactive fault injection: adjust global loss rate, latency multipliers, toggle node/link states, or trigger SYN flood attacks.

---

## ?? Quickstart Guide

### Prerequisites
- **Node.js** (v18.0.0 or later)
- **npm** (v9.0.0 or later)
- *(Optional)* MySQL 8.0 (The system automatically runs in zero-setup in-memory relational mode if MySQL is not configured).

### 1. Repository Setup & Dependencies
```bash
# Clone or navigate to the repository root
cd netbankx

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
The backend comes pre-configured with a zero-setup fallback. To customize environment variables:
```bash
cp backend/.env.example backend/.env
```

### 3. Run Automated Test Suite
Verify system integrity, transaction atomicity, Dijkstra failover, and TCP retransmissions:
```bash
cd backend
npm test
```
*Expected Result: 4 test suites passed, 12 unit & integration tests green.*

### 4. Launch the Platform
In separate terminal windows:

**Terminal 1 (Backend API & WebSocket Server):**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000 (WebSocket listening)
```

**Terminal 2 (Frontend Client Application):**
```bash
cd frontend
npm run dev
# Vite dev server starts on http://localhost:5173
```

Open your browser at `http://localhost:5173` to access the portal.

---

## ?? Demo Credentials (Viva & Examiner Logins)

All pre-seeded demo accounts use the standard password: `Password@123`

| Role | Username | Region / Branch | Focus Area for Demo |
| :--- | :--- | :--- | :--- |
| **HQ Administrator** | `admin` | National HQ (DC-HQ) | NOC Dashboard, Full Network Lab, Global Audit Trail |
| **Regional Manager** | `rm_west` | Western Region (MH-HUB) | Regional branch traffic aggregation, WAN link health |
| **Branch Staff** | `staff_mumbai` | Mumbai Main (MH-MUM-001) | Branch retail customers, local router status |
| **Customer** | `shivam` | Mumbai Main (MH-MUM-001) | Instant fund transfer, live packet trace inspection |
| **Customer** | `aarav` | Delhi North (DL-DEL-001) | Inter-regional counterparty recipient |

---

## ??? High-Level Architecture

```
                                  [ REACT 18 + VITE FRONTEND ]
                                                ¦
                          +-------------------------------------------+
                     REST ¦ (Axios / Bearer JWT)             WebSocket¦ (Socket.IO Real-Time)
                          ?                                           ?
             +------------------------------------------------------------------+
             ¦                   NODE.JS / EXPRESS BACKEND                      ¦
             +------------------------------------------------------------------¦
             ¦       CORE BANKING ENGINE        ¦    NETWORK SIMULATION ENGINE  ¦
             ¦  • AuthService (JWT / Bcrypt)    ¦  • GraphEngine (Dijkstra)     ¦
             ¦  • TransactionService (Atomic)   ¦  • PacketSimulator (TCP Sim)  ¦
             ¦  • AccountService (Decimal 15,2) ¦  • Real-Time Telemetry Hub    ¦
             +------------------------------------------------------------------+
                               ¦                                ¦
                               ?                                ?
                     +-------------------+            +-------------------+
                     ¦ RELATIONAL SCHEMA ¦            ¦ TOPOLOGY & EVENTS ¦
                     ¦ MySQL 8.0 Pool /  ¦            ¦ In-Memory WAN     ¦
                     ¦ In-Memory ACID    ¦            ¦ Graph Twin (10+   ¦
                     ¦ Relational Engine ¦            ¦ Nodes & Links)    ¦
                     +-------------------+            +-------------------+
```

---

## ?? Documentation Suite Index

Detailed architectural and theoretical guides are available in the repository:

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — System architecture, module boundaries, concurrency, and event-driven design.
- [`API.md`](./API.md) — Complete REST endpoint definitions and WebSocket event catalog.
- [`DATABASE.md`](./DATABASE.md) — Relational schema design, normalization, decimal safety, and indexing.
- [`NETWORK_SIMULATION.md`](./NETWORK_SIMULATION.md) — Discrete-event packet simulator, state transitions, and TCP modeling.
- [`ROUTING.md`](./ROUTING.md) — Graph theory formulation, Dijkstra's algorithm, and dynamic WAN failover.
- [`OSI_MODEL.md`](./OSI_MODEL.md) — Educational mapping of all 7 OSI layers to banking transaction flow.
- [`WIRESHARK_GUIDE.md`](./WIRESHARK_GUIDE.md) — Comparison guide between real packet captures and simulated telemetry.
- [`SECURITY.md`](./SECURITY.md) — Threat modeling, cryptographic hashing, RBAC, and parameter validation.
- [`TESTING.md`](./TESTING.md) — Automated testing matrix, unit/integration test specifications, and coverage.
- [`DEMO_GUIDE.md`](./DEMO_GUIDE.md) — Step-by-step viva presentation script and examiner Q&A defense guide.
- [`AUDIT.md`](./AUDIT.md) — Legacy code audit and architectural refactoring record.

---

## ?? License
Developed for Academic Evaluation & Final-Year Capstone Viva Examination. Released under the MIT License.
