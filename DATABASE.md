# NETBANKX — Relational Database Specification & Schema Design

## 1. Relational Design & Entity-Relationship Architecture

The NETBANKX relational schema is strictly 3NF normalized and enforces referential integrity across 14 tables.

```
       +-----------+         +-----------+
       ¦   ROLES   ¦         ¦  REGIONS  ¦
       +-----------+         +-----------+
             ¦ 1                   ¦ 1
             ¦                     ¦
             ? *                   ? *
       +-----------+         +-----------+
       ¦   USERS   +--------?¦  BRANCHES ¦
       +-----------+ *     1 +-----------+
             ¦ 1                   ¦ 1
             ¦                     ¦
             ? 1                   ? *
       +-----------+         +-----------+
       ¦ CUSTOMERS ¦?--------¦ ACCOUNTS  ¦
       +-----------+ 1     * +-----------+
                                   ¦ 1
                                   ¦
                                   ? *
                             +--------------+
                             ¦ TRANSACTIONS ¦
                             +--------------+
                                    ¦ 1
                                    ¦
                                    ? *
                             +--------------+
                             ¦ SIM_PACKETS  ¦
                             +--------------+
```

---

## 2. Core Tables Overview

### 1. `roles` & `users`
- System actors with role assignments: `HQ_ADMIN`, `REGIONAL_MANAGER`, `BRANCH_STAFF`, `CUSTOMER`.
- Passwords hashed using industry-standard **Bcrypt (10 salt rounds)**.

### 2. `regions` & `branches`
- Hierarchical banking network structure:
  - Regions: `REG-MH` (Maharashtra), `REG-DL` (Delhi NCR), `REG-KA` (Karnataka).
  - Branches: Assigned unique IFSC codes, subnet IP blocks (e.g. `10.1.1.0/24`), and router links.

### 3. `customers` & `accounts`
- KYC-verified retail banking entities.
- **Financial Precision:** Account balances are declared as `DECIMAL(15,2) NOT NULL DEFAULT 0.00`.
- **Integrity Checks:** `CHECK (balance >= 0.00)` ensures overdraft protection at the relational storage engine level.

### 4. `transactions` & `transaction_events`
- Double-entry ledger records with atomic source and destination account mappings.
- Stores simulated telemetry metrics: `total_latency_ms`, `packets_transmitted`, `packets_lost`, `retransmissions`, and JSON-encoded `routing_path`.

### 5. `network_nodes` & `network_links`
- Persistent topology store for the enterprise WAN digital twin.
- Captures physical/logical attributes: IP addresses, MAC addresses, link bandwidth (Mbps), base propagation latency (ms), and loss rates.

### 6. `simulation_packets` & `audit_logs`
- Detailed hop-by-hop packet logs and immutable compliance audit trail.

---

## 3. Financial Decimal Precision Guarantee

In financial systems, binary floating-point types (`FLOAT`, `DOUBLE`, JavaScript `Number`) suffer from round-off anomalies:
```javascript
// Floating point flaw:
0.1 + 0.2 === 0.30000000000000004 // true (Danger in banking!)
```

NETBANKX enforces strict exact-precision decimal arithmetic:
1. **Database:** Stored as fixed-point binary representation `DECIMAL(15,2)`.
2. **Backend Engine:** Handled via string-serialized fixed-precision calculations (`Number.toFixed(2)` and exact decimal comparison routines) during atomic transaction execution.
3. **API Contracts:** Transferred across REST and WebSocket boundaries as exact decimal strings (e.g., `"15000.00"`).

---

## 4. Transaction Isolation & Atomicity

Fund transfers are executed inside strict database transactions:
```sql
START TRANSACTION;

-- 1. Lock and verify source account balance
SELECT balance, status FROM accounts WHERE id = ? FOR UPDATE;

-- 2. Lock destination account
SELECT status FROM accounts WHERE id = ? FOR UPDATE;

-- 3. Execute atomic balance updates
UPDATE accounts SET balance = balance - 15000.00 WHERE id = ?;
UPDATE accounts SET balance = balance + 15000.00 WHERE id = ?;

-- 4. Record transaction log
INSERT INTO transactions (id, reference_no, source_account_id, destination_account_id, amount, state)
VALUES (?, ?, ?, ?, 15000.00, 'COMPLETED');

COMMIT;
```

---

## 5. Indexing & Query Optimization

| Table | Index Name | Indexed Columns | Justification |
| :--- | :--- | :--- | :--- |
| `accounts` | `idx_accounts_cust` | `(customer_id)` | Fast lookup of accounts during login and dashboard loading. |
| `accounts` | `idx_accounts_no` | `(account_number)` | $O(1)$ indexed recipient lookup during fund transfers. |
| `transactions` | `idx_txn_src` | `(source_account_id, created_at)` | High-throughput statement generation. |
| `transactions` | `idx_txn_dst` | `(destination_account_id, created_at)` | Fast incoming transfer querying. |
| `audit_logs` | `idx_audit_actor` | `(actor_id, created_at)` | Rapid compliance filtering. |
