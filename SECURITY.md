# NetBankX — Security & Cryptographic Architecture

**Version**: 2.0.0-PROD  
**Compliance & Hardening Level**: Enterprise Defense-in-Depth  

---

## 1. Authentication & Session Architecture

* **Cryptographic Password Hashing**: All authentication credentials are salted and hashed using `bcrypt` (cost factor 10). Plain-text passwords and legacy demo bypasses are completely prohibited across all database models and authentication controllers.
* **JSON Web Token (JWT) Security**:
  * **Production Guard**: Backend startup strictly validates that `JWT_SECRET` is configured and sufficiently complex (minimum 256-bit entropy).
  * **Development Isolation**: In non-production environments, ephemeral cryptographically random keys (`crypto.randomBytes(32)`) are generated per process to prevent any checked-in default secret from signing valid tokens.
* **Progressive Login Lockout Protection**:
  * Failed authentication attempts are tracked per actor/IP address.
  * Repeated credential failures trigger progressive temporary account lockouts and emit audited `AUTH_LOGIN_FAILED` and `AUTH_LOCKOUT_TRIGGERED` events.

---

## 2. Cryptographic Tamper-Evident Audit Hash Chain

NetBankX implements a blockchain-inspired cryptographic hash chain across the audit log infrastructure:

```
[Genesis Hash: 0000...0000]
         │
         ▼
┌──────────────────────────────────┐
│ Audit Record #1                  │
│ prev_hash: 0000...0000           │
│ payload: Actor, Action, IP, Data │
│ record_hash: SHA256(Record #1)   │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│ Audit Record #2                  │
│ prev_hash: SHA256(Record #1)     │
│ payload: Actor, Action, IP, Data │
│ record_hash: SHA256(Record #2)   │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│ Audit Record #N                  │
│ prev_hash: SHA256(Record #N-1)   │
│ record_hash: SHA256(Record #N)   │
└──────────────────────────────────┘
```

* **Integrity Proof Engine**: The endpoint `GET /api/v1/audit/verify` executes a full cryptographic proof check across all historical records (`ORDER BY id ASC`).
* **Tamper Detection**: If any record content or previous hash link is altered, the verification engine detects the anomaly immediately and returns `AUDIT INTEGRITY FAILURE` with the exact compromised record identifier.

---

## 3. Educational Transaction Risk Scoring Engine

Every fund transfer execution passes through the real-time Risk Scoring Engine before ledger finalization:

| Evaluation Factor | Operational Criteria | Risk Weight |
|---|---|---|
| **Monetary Value** | Transfers > ₹1,00,000 | +45 (High Value Threshold) |
| **Monetary Value** | Transfers between ₹25,000 and ₹1,00,000 | +20 (Moderate Value) |
| **Monetary Value** | Transfers <= ₹25,000 | +5 (Baseline) |
| **WAN Route Complexity** | Inter-Branch / Cross-Regional Route | +15 (Inter-State Hop Traversal) |
| **WAN Route Complexity** | Intra-Branch Synchronous Transfer | +0 (Local Synchronization) |

* **Risk Levels**:
  * `LOW` (Score < 35) -> Action: `ALLOW`
  * `MEDIUM` (Score 35–69) -> Action: `NOTIFY`
  * `HIGH` (Score >= 70) -> Action: `FLAG_FOR_REVIEW`

---

## 4. API & Transport Hardening

* **CORS Allowlist Security**: Express CORS middleware enforces explicit domain allowlists and rejects wildcard origins (`*`) in production.
* **HTTP Security Headers**: `helmet` enforces strict HTTP security headers (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security).
* **Reverse Proxy Client IP Resolution**: `app.set('trust proxy', 1)` enables accurate client IP extraction behind Vercel edge networks and load balancers.
* **Rate Limiting**: Global rate limiter restricts abusive traffic (600 requests/minute baseline).

---

## 5. Ledger Integrity & ACID Guarantees

* **Minor-Unit Integer Arithmetic**: Eliminates IEEE-754 floating-point rounding errors. All balances are maintained in integer units (cents/pennies).
* **Transactional Concurrency Locking**: Executes `SELECT ... FOR UPDATE` on database rows during fund transfers to guarantee serializability.
* **Idempotency Protection**: Enforces unique `Idempotency-Key` headers on all state-mutating financial endpoints to prevent duplicate processing on network retries.
