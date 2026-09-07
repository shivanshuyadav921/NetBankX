# NetBankX — Enterprise Banking & Network Infrastructure

## 1. Project Overview
**NetBankX** is a purely frontend, client-side web application designed for a university-level **Computer Networks (CN)** project. It dual-functions as a professional multi-role banking dashboard and a highly advanced, custom-built packet-switching network simulator.

**Tech Stack:** 
*   **HTML5 / CSS3** (Custom variables, flexbox/grid, CSS animations, dark mode banking theme)
*   **Vanilla JavaScript (ES6)** (Canvas API for network rendering, DOM manipulation, state management)
*   *No external libraries, frameworks, or dependencies (No React, No Node server, No external canvas libs).*

---

## 2. File Structure & Architecture
The project strictly separates concerns between UI routing, mock database, and the simulation engine.

```text
netbankx/
├── index.html                   # Landing page
├── context.md                   # This documentation file
├── css/
│   ├── main.css                 # Global variables, typography, utility classes
│   ├── auth.css                 # Login screen styling & glassmorphism
│   ├── dashboard.css            # Sidebar, grid layouts, KPI cards
│   └── network.css              # Canvas overlay, floating controls, logs
├── js/
│   ├── mock-data.js             # "Database": Users, Branches, Hubs, Transactions
│   ├── auth.js                  # Login/Logout logic and session guard
│   ├── router.js                # URL param reading and UI state management
│   ├── utils.js                 # Helpers (Toast notifications, formatting)
│   └── network-sim.js           # THE CORE: Canvas rendering & packet routing engine
└── pages/
    ├── login.html               # 4-Role unified login portal
    ├── hq/                      # Chief Executive / Admin dashboards
    ├── regional/                # Regional Hub Head dashboards
    ├── branch/                  # Local Branch Manager dashboards
    └── customer/                # End-user banking dashboards (Transfer, History)
```

---

## 3. The Network Simulation Engine (`network-sim.js`)
The crown jewel of the project is a custom-built 2D network simulator using the HTML5 `<canvas>` API.

**Core Capabilities:**
*   **Dynamic Topologies:** Renders different logical maps depending on the context (e.g., a 7-node WAN for inter-state transfers, a 5-node view for branch-to-branch, or a sprawling national map for HQ).
*   **Hop-by-Hop Animation:** Packets (`simulatePacket()`) travel at calculable speeds from `(x1,y1)` to `(x2,y2)`.
*   **Layer 2 / Layer 3 OSI Logic:** Calculates simulated MAC addresses (hashed from node IDs) and assigns realistic internal/public IPs (`10.x.x.x`, `203.0.113.x`).
*   **Live Packet Inspector:** An overlay that hooks into moving packets and dynamically displays their current Source/Dest IPs, changing Source/Dest MACs per hop, and decreasing TTL (Time To Live).

---

## 4. Implemented Syllabus Concepts (Computer Networks)
The simulation directly implements and visualizes the following academic CN concepts:

### A. Data Link Layer (Module 3)
*   **ARQ / Error Control:** Users can set a **Packet Loss %**. When packets drop due to simulated transmission impairment, the engine waits for a timeout and automatically generates a yellow `[RTX]` (Retransmission) packet, accurately demonstrating **Stop-and-Wait / Go-Back-N flow control**.
*   **Frame Rewriting:** The Live Inspector proves that Layer 2 MAC addresses are rewritten at every router interface.

### B. Network & Transport Layer (Module 2 & 4)
*   **Packet Switching:** Visualizes independent packets traversing regional routers rather than dedicated circuit lines.
*   **TCP 3-Way Handshake:** Before any data transfer, the simulation sends a `SYN` packet to HQ, receives a `SYN-ACK`, and establishes the connection before sending the `TXN` data.
*   **IP Addressing & NAT:** Simulates Private IPs at the branch level (`10.1.x.x`) being translated to Public IPs at the Regional Hub Gateway (`203.0.113.x`).
*   **ICMP Traceroute:** HQ can run a simulated ping/traceroute that returns the latency and IP of every hop across the country.

### C. Network Security (Module 8)
*   **Payload Encryption (TLS 1.3):** A toggle in HQ encrypts the simulation payloads. When OFF, packet logs show plaintext (`TXN: 500 INR`). When ON, logs show hashed ciphertext.
*   **Firewalls & ACLs (Intrusion Prevention):** A "Simulate Rogue Traffic" button fires an SQL injection packet. If the Firewall is ON, the edge router inspects the payload and drops it before it hits the core network.
*   **QoS / Rate Limiting (DDoS Mitigation):** Floods the network with UDP packets. Rate limiting forces the edge routers to drop 85% of malicious traffic to keep bandwidth available.

---

## 5. UI Features & User Roles
*   **HQ (Admin):** Global view of all regions. Can run security simulations (DDoS, Firewalls). Can send direct ICMP pings and targeted transmission data to any specific branch.
*   **Regional Hubs:** Mid-tier view. Monitors aggregated traffic from their specific state (e.g., Maharashtra, Delhi).
*   **Branch Managers:** Local view. Can initiate **Inter-Branch Secure Syncs** (Branch-to-Branch WAN communication) to fetch data from branches in other states.
*   **Customers:** Standard banking UI. Can initiate fund transfers. The UI calculates whether the recipient is in the same state or a different state and dynamically draws the accurate 7-hop routing path to deliver the funds.
