# NETBANKX — 7-Layer OSI Reference Model Educational Mapping

The NETBANKX platform maps every transaction step to the ISO/OSI 7-Layer Computer Networking Reference Model. This enables instructors and viva examiners to inspect protocol stack encapsulation and decapsulation in an enterprise context.

---

## ??? Comprehensive 7-Layer Protocol Stack Mapping

| Layer # | Layer Name | Protocol Data Unit (PDU) | NETBANKX Implementation | Headers / Fields Inspected in Simulator |
| :--- | :--- | :--- | :--- | :--- |
| **Layer 7** | **Application** | Data / Message | Core Banking Double-Entry Engine | `POST /api/transactions/transfer`, Payload: `{ amount, from, to }` |
| **Layer 6** | **Presentation** | Data / Syntax | JSON Serialization & TLS 1.3 | AES-256-GCM symmetric cipher, Byte-level encoding |
| **Layer 5** | **Session** | Data / Dialogue | WebSocket (Socket.IO) & JWT Session | Persistent bidirectional duplex channel, Auth token claims |
| **Layer 4** | **Transport** | Segment | TCP Simulation Engine | Sequence #, ACK #, Flags (`SYN`, `ACK`, `FIN`, `RTX`), Port 443 |
| **Layer 3** | **Network** | Packet | IPv4 Graph Routing (Dijkstra) | Source IP (`10.1.1.5`), Dest IP (`10.2.1.8`), TTL (`64`), Protocol (`0x06`) |
| **Layer 2** | **Data Link** | Frame | Ethernet Frame & ARP Rewriting | Source MAC (`00:1A:...`), Dest MAC (`00:1B:...`), EtherType (`0x0800`) |
| **Layer 1** | **Physical** | Bits | Optical Fiber (OFC) / WAN Media | Bandwidth (`10000 Mbps`), Propagation Delay (`8ms`), Jitter |

---

## ?? Educational PDU Inspection Example

When inspecting a simulated banking packet in the **Live Packet Inspector**:

```json
{
  "layer7_application": {
    "action": "DEBIT_CREDIT_LEDGER_POST",
    "amount": "15000.00",
    "currency": "INR",
    "signature": "RSA-SHA256-VALID"
  },
  "layer6_presentation": {
    "encryption": "TLS_AES_256_GCM_SHA384",
    "encoding": "UTF-8 JSON"
  },
  "layer5_session": {
    "sessionId": "sess-9a81f3",
    "transportProtocol": "WSS / TLS over TCP"
  },
  "layer4_transport": {
    "protocol": "TCP",
    "srcPort": 51244,
    "dstPort": 443,
    "sequenceNumber": 1001,
    "ackNumber": 1,
    "flags": ["ACK", "PSH"]
  },
  "layer3_network": {
    "version": "IPv4",
    "srcIp": "10.1.1.5",
    "dstIp": "10.2.1.8",
    "ttl": 61,
    "headerChecksum": "0xA4F2"
  },
  "layer2_dataLink": {
    "frameType": "Ethernet II",
    "srcMac": "00:1A:2B:3C:4D:01",
    "dstMac": "00:1A:2B:3C:4D:02",
    "fcs": "0x38F921"
  },
  "layer1_physical": {
    "medium": "Single-Mode Optical Fiber Cable (SM-OFC)",
    "nominalSpeed": "10 Gbps",
    "currentHopLatency": "8.4 ms"
  }
}
```
