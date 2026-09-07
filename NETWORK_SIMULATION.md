# NETBANKX — Discrete-Event Network Simulation & TCP Reliability Engine

## 1. Simulation Objectives

The NETBANKX simulation engine translates abstract high-level banking operations into physical and transport-layer network events. It allows computer science students and examiners to inspect:
1. Connection establishment via TCP 3-Way Handshake.
2. Layer 2 Frame encapsulation & MAC address rewriting across router hops.
3. Layer 3 IPv4 TTL decrementing and loop prevention.
4. Transport Layer (TCP) sequence numbers, acknowledgement numbers, and selective retransmission upon packet loss.
5. Application Layer TLS payload encryption and double-entry ledger execution.

---

## 2. Discrete Packet Flow Lifecycle

```mermaid
stateDiagram-v2
    [*] --> TCP_SYN: Customer Initiates Transfer
    TCP_SYN --> TCP_SYN_ACK: Routed to Branch/Regional Hub
    TCP_SYN_ACK --> TCP_ACK: Client Acknowledges Connection
    TCP_ACK --> BANKING_TXN_DATA: Layer 7 Encrypted PDU Dispatched
    
    state Transmission_Hops {
        [*] --> Hop_Processing
        Hop_Processing --> L2_MAC_Rewrite: Next-Hop ARP Lookup
        L2_MAC_Rewrite --> L3_TTL_Decrement: Check TTL > 0
        L3_TTL_Decrement --> Jitter_Delay: Link Latency Calculated
        Jitter_Delay --> Loss_Check: Loss Probability Evaluated
        
        Loss_Check --> Delivered: Random >= LossRate
        Loss_Check --> Dropped: Random < LossRate
        Dropped --> Retransmission: Timeout & Resend [RTX]
        Retransmission --> Hop_Processing
    }
    
    BANKING_TXN_DATA --> Transmission_Hops
    Delivered --> BANKING_ACK: Core Banking Ledger Confirmed
    BANKING_ACK --> TCP_FIN: Graceful Teardown
    TCP_FIN --> [*]: Transfer Completed
```

---

## 3. TCP Reliability & Loss Model

### Mathematical Loss Formulation
For each packet traversing a link $e = (u, v)$ with link loss rate $p_e \in [0, 1]$:
$$\text{Dropped} = \begin{cases} \text{true}, & \text{if } \text{random}(0, 1) < p_e \\ \text{false}, & \text{otherwise} \end{cases}$$

### Educational Retransmission Algorithm
When a packet drop occurs:
1. The simulator increments the connection's `packetsLost` counter.
2. An event `PACKET_LOSS` is broadcast over WebSockets, displaying a red pulse on the SVG topology.
3. The simulator pauses for a simulated Retransmission Timeout ($\text{RTO} = 2 \times \text{RTT}$).
4. The packet is resent with flag `[RTX]` and same sequence number:
   $$\text{Seq}_{\text{RTX}} = \text{Seq}_{\text{Original}}$$
5. The `retransmissions` metric is incremented.

---

## 4. Layer 2 / Layer 3 Transformations Per Hop

As a packet transitions from node $N_i$ to $N_{i+1}$:
1. **Layer 2 (Data Link):**
   - Source MAC is rewritten to $N_i.\text{macAddress}$.
   - Destination MAC is rewritten to $N_{i+1}.\text{macAddress}$.
2. **Layer 3 (Network):**
   - Source IP ($10.x.x.x$) and Destination IP ($10.y.y.y$) remain unchanged (End-to-End).
   - $\text{TTL} \leftarrow \text{TTL} - 1$. If $\text{TTL} \le 0$, the packet is discarded and an ICMP Time Exceeded event is triggered.
