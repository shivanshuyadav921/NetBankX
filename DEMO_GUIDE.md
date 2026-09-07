# NETBANKX — Final-Year Viva Presentation & Examiner Demonstration Guide

This guide is a step-by-step script for conducting a live project demonstration and answering tough examiner questions during your final-year engineering viva.

---

## ?? Step-by-Step Viva Presentation Script (5–10 Minutes)

### Phase 1: Problem Statement & Architecture Intro (2 Mins)
1. **Explain the Motivation:**
   - *"Most banking projects are simple CRUD forms. In reality, modern enterprise banking relies on mission-critical Wide Area Networks (WANs) spanning multiple branches and datacenters."*
   - *"NETBANKX connects a production-style, ACID-compliant double-entry banking system with an interactive Layer 2–7 network digital twin and Dijkstra graph routing engine."*
2. **Show the Clean Architecture:**
   - Mention Node.js/Express/TypeScript backend, in-memory graph model, WebSocket real-time telemetry, and React 18 frontend.

---

### Phase 2: Live Core Banking & Packet Flow (3 Mins)
1. **Log in as Retail Customer:**
   - Open browser at `http://localhost:5173`.
   - Select **Customer Portal**, login as `shivam` / `Password@123`.
   - Point out KYC status, account number `ACC-100001`, and current balance.
2. **Execute an Instant Fund Transfer:**
   - Click **Instant Transfer**.
   - Destination Account: `ACC-100003` (Aarav Sharma in Delhi Branch).
   - Amount: `?15,000`.
   - Click **Send Transfer**.
3. **Inspect the Real-Time Packet Flow:**
   - Watch the animated SVG pulse route through `MH-MUM` ? `MH-HUB` ? `DC-HQ` ? `DL-HUB` ? `DL-DEL`.
   - Show the **Live Packet Inspector** and **7-Layer OSI Accordion**:
     - *Layer 4:* TCP Handshake sequence/ACK numbers.
     - *Layer 3:* IPv4 TTL decrementing per hop.
     - *Layer 2:* Next-hop MAC address rewriting.

---

### Phase 3: Network Operations Lab & Fault Injection (3 Mins)
1. **Log in as HQ Administrator:**
   - Logout and login as `admin` / `Password@123`.
   - Open **Network Lab** (`/hq/network-lab`).
2. **Demonstrate Dynamic Dijkstra Failover:**
   - Click the button **"Toggle HQ Core Failure"** to take `DC-HQ` offline.
   - Point out that `DC-HQ` turns red (OFFLINE) on the topology map.
   - Run a route calculation or new transfer from Mumbai to Delhi.
   - Show that Dijkstra recalculates instantly, routing via the regional backup path `MH-HUB` ? `KA-HUB` ? `DL-HUB`!
3. **Demonstrate TCP Retransmissions & Packet Loss:**
   - Move the **Simulated Packet Loss** slider to `40%`.
   - Execute a transfer.
   - Point out the dropped packets and the corresponding `[RTX]` retransmission packets with identical sequence numbers.

---

## ?? Top Viva Examiner Questions & Model Answers

### Q1: Why did you not use IEEE 754 floating-point numbers for account balances?
> **Model Answer:**  
> *"Binary floating-point types (`float`/`double`) cannot accurately represent decimal fractions like 0.1 or 0.2, leading to catastrophic round-off errors over millions of transactions. In NETBANKX, we use `DECIMAL(15,2)` in the relational database, string-serialized exact fixed-point arithmetic in the backend services, and integer-precision smallest currency units during calculation."*

### Q2: How is the shortest path computed across the network topology?
> **Model Answer:**  
> *"We implemented Dijkstra's Single-Source Shortest Path Algorithm on an edge-weighted graph $G=(V, E)$. The link cost function combines propagation delay, bandwidth inverse ($1000 / \text{Mbps}$), and packet loss penalty. When a link or node fails, its cost becomes infinite or it is removed from the unvisited vertex set, causing Dijkstra to immediately find the next lowest-cost alternate route."*

### Q3: How do you prevent double-spending if two requests arrive simultaneously?
> **Model Answer:**  
> *"All transfer operations are wrapped inside an ACID database transaction. We apply row-level pessimistic locking (`SELECT ... FOR UPDATE`) on the source and destination account records, ensuring serialized execution. Furthermore, a database `CHECK (balance >= 0.00)` constraint provides low-level enforcement."*

### Q4: How does your packet simulator map to the OSI model?
> **Model Answer:**  
> *"Each transaction creates simulated PDUs across all 7 layers: Layer 7 holds the banking transfer action; Layer 6 encrypts with TLS 1.3; Layer 5 maintains WebSocket session state; Layer 4 manages TCP SYN/ACK/FIN and sequence numbers; Layer 3 tracks IP routing and decrements TTL; Layer 2 rewrites MAC addresses per hop; Layer 1 models physical propagation delay and loss."*
