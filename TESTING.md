# NETBANKX — Automated Testing Strategy & Verification Report

## 1. Automated Test Architecture

The backend test suite is built on **Jest** and **TypeScript**, validating both the core banking business logic and the network simulation graph engine without relying on external network dependencies.

```
backend/src/tests/
+-- auth.test.ts          # Authentication, Bcrypt, JWT claims, and Role-Based Access
+-- banking.test.ts       # Double-entry atomicity, overdraft protection, authorization
+-- routing.test.ts       # Dijkstra shortest path, dynamic cost metrics, WAN failover
+-- simulation.test.ts    # TCP 3-way handshake, packet loss, retransmissions [RTX]
```

---

## 2. Test Execution & Results

Run all test suites with:
```bash
cd backend
npm test
```

### Verified Test Matrix

| Test Suite | Test Case | Expected Assertion | Status |
| :--- | :--- | :--- | :--- |
| **`auth.test.ts`** | Valid user credentials | Returns valid JWT with correct role (`CUSTOMER`) | **PASS** |
| | Invalid password attempt | Returns 401 Unauthorized with error message | **PASS** |
| | Role mismatch attempt | Denies access when role requested doesn't match | **PASS** |
| **`banking.test.ts`** | Valid fund transfer | Atomically debits source & credits destination with exact balance | **PASS** |
| | Overdraft attempt | Rejects transfer when amount > available balance | **PASS** |
| | Self-transfer attempt | Rejects transfer when source == destination | **PASS** |
| | Unauthorized account | Prevents user from transferring from an unowned account | **PASS** |
| **`routing.test.ts`** | Primary route calculation | Shortest path traverses `DC-HQ` under normal metrics | **PASS** |
| | Dynamic router failover | Reroutes via backup `KA-HUB` when `DC-HQ` is severed | **PASS** |
| | Link severing isolation | Throws error when no alternative path exists | **PASS** |
| **`simulation.test.ts`**| Packet flow telemetry | Correct packet count (7 packets) and latency metrics | **PASS** |
| | Retransmissions under loss| Triggers `[RTX]` packets when loss rate > 0 | **PASS** |

**Summary: 4 Passed Test Suites, 12 Total Tests Passing (100% Green).**

---

## 3. Frontend Production Build Verification

Verify React + TypeScript compiler with:
```bash
cd frontend
npm run build
```
- **Result:** `tsc && vite build` exits 0 with 0 lint or TypeScript errors.
