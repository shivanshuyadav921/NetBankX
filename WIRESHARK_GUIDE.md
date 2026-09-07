# NETBANKX — Network Traffic & Wireshark Analysis Guide

## 1. Comparing Real-World Wireshark vs NETBANKX Twin

In physical computer networks, engineers use **Wireshark** to capture raw network frames from Network Interface Cards (NICs) in promiscuous mode. In NETBANKX, we have engineered an integrated **in-browser digital twin** that reproduces real Wireshark dissector telemetry in real time.

| Field | Real Wireshark Equivalent | NETBANKX Digital Twin Implementation |
| :--- | :--- | :--- |
| **Packet Capture Filter** | `tcp.port == 443 && ip.addr == 10.0.0.1` | Instant filter by Node ID or Transaction Reference |
| **TCP Stream Tracking** | `Follow TCP Stream` | Complete transaction event lifecycle modal |
| **Retransmission Flags** | `[TCP Retransmission] / [TCP Spurious]` | `[RTX]` Badge & animated orange packet pulse |
| **3-Way Handshake** | `[SYN]`, `[SYN, ACK]`, `[ACK]` | Displayed in chronological packet inspector sequence |
| **Round Trip Time (RTT)** | `tcp.analysis.initial_rtt` | Live calculated RTT displayed on NOC metrics dashboard |

---

## 2. Wireshark Capture Comparison Flow

### Phase 1: TCP Handshake
```
Frame 1: Source (10.1.1.5:51244) -> Dest (10.0.0.1:443) [SYN] Seq=0 Win=64240 Len=0
Frame 2: Source (10.0.0.1:443) -> Dest (10.1.1.5:51244) [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0
Frame 3: Source (10.1.1.5:51244) -> Dest (10.0.0.1:443) [ACK] Seq=1 Ack=1 Win=64240 Len=0
```

### Phase 2: Application Data & Retransmission under Degraded WAN
```
Frame 4: Source (10.1.1.5) -> Dest (10.0.0.1) [PSH, ACK] Seq=1 Ack=1 Len=412 (Banking Payload)
*** PACKET LOST ON LINK MH-HUB -> DC-HQ ***
Frame 5: Source (10.1.1.5) -> Dest (10.0.0.1) [TCP Retransmission] Seq=1 Ack=1 Len=412 [RTX]
Frame 6: Source (10.0.0.1) -> Dest (10.1.1.5) [ACK] Seq=1 Ack=413 Win=65123 Len=0
```

---

## 3. How to Demonstrate in a Viva

1. Open the **Network Operations Lab** (`/hq/network-lab`).
2. Slide the **Simulated Packet Loss** slider to `40%`.
3. In a separate tab (or mobile view), initiate a transfer of `?5,000` from customer `shivam`.
4. Observe the **Live Packet Inspector** in the Lab:
   - Point out the `[RTX]` flags on dropped segments.
   - Explain how sequence numbers ensure idempotent, duplicate-free ledger posting.
