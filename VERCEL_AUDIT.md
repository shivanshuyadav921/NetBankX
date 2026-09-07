# NetBankX — Comprehensive Vercel Deployment Audit

**Auditor:** Lead Systems Architect & DevOps Lead  
**Target Environments:** Local Development, Vercel Preview, Vercel Production  
**Runtime Target:** Node.js 20.x / 22.x LTS (Vercel Serverless Functions + Static SPA)  

---

## 1. Executive Summary & Stack Assessment

| Layer | Current Implementation | Vercel Serverless Evaluation | Action Required |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite 6, TypeScript, Tailwind CSS, Lucide | 100% Vercel compatible as a single-page application (SPA). | Ensure production Vite build outputs to `frontend/dist` with clean relative API routing (`/api/v1`) and HTML5 pushState rewrite rules in `vercel.json`. |
| **Backend** | Node.js, Express 4, TypeScript, MySQL2, Socket.IO | Stateful HTTP listener (`app.listen(PORT)`) must be adapted for Vercel Serverless Function handler (`/api/index.ts`). | Provide serverless-compatible Express export for Vercel while preserving standalone HTTP + WebSocket server for local execution. |
| **Database** | MySQL 8.0 connection pool + In-Memory Fallback | Direct pool creation must support serverless connection reuse and remote hosted MySQL (PlanetScale / AWS RDS / Aiven / TiDB / Railway). | Implement global connection pool caching across warm serverless invocations, with health check endpoint (`/api/health`, `/api/health/database`). |
| **Real-Time** | Socket.IO | Serverless functions are ephemeral and do not sustain long-lived bidirectional state across lambda invocations. | Implement a dual-mode strategy: Socket.IO for persistent local server + Server-Sent Events (SSE) / Event Streams & REST state replay for serverless. |
| **Security & Auth** | Bcrypt, JWT (HMAC-SHA256), RBAC | Production-ready with strict cookie/header support. | Ensure JWT secrets, database passwords, and API keys are strictly server-only with zero frontend exposure. |
| **Financial Safety**| `DECIMAL(15,2)`, ACID row locks, idempotency key | Robust double-entry ledger. | Add explicit idempotency testing and ensure idempotency key deduplication works across repeated client retries. |

---

## 2. Detailed Subsystem Audit

### A. Frontend Client & Routing
- **Vite & React Router:** The frontend is configured with `react-router-dom` using browser history (`BrowserRouter`). On Vercel, deep links (e.g. `/customer/transfer`, `/hq/network-lab`) will return HTTP 404 if rewrites are not configured.
  - **Resolution:** Add `"rewrites": [{ "source": "/api/(.*)", "destination": "/api/index.js" }, { "source": "/(.*)", "destination": "/index.html" }]` in `vercel.json`.
- **API Client:** Currently uses relative paths `const API_BASE = '/api/v1'`. This is optimal for single-project Vercel deployment where the API and frontend share the same origin.
- **Hardcoded URLs:** Verified zero hardcoded `localhost` or `127.0.0.1` URLs in the client source code.

### B. Backend Architecture & Vercel Serverless Handler
- Currently `backend/src/index.ts` calls `httpServer.listen(config.port)`.
- For Vercel deployment, we must provide an entrypoint (e.g., `api/index.ts` at the project root or configured via `vercel.json`) that exports the initialized Express application `export default app;`.
- **Database Initialization:** In a serverless environment, database initialization (`initDatabase()`) must be lazily awaited on the first request if not already ready, with pool reuse across invocations.

### C. Real-Time Network Simulation on Serverless
- On traditional servers, Socket.IO handles events.
- On Vercel Serverless, lambda execution is request-bound.
- **Vercel-Safe Strategy:**
  1. Local Node.js: Full Socket.IO WebSocket broadcasting.
  2. Vercel Serverless: Server-Sent Events (SSE) at `/api/v1/network/stream` and transactional simulation events persisted to the database (`network_events` table).
  3. Client Reconnect & Resilience: The client automatically polls or reconnects, fetching authoritative state from `/api/v1/network/events` and `/api/v1/network/topology`.

### D. Database & Connection Lifecycle
- `mysql2/promise` pool: In serverless, instantiating a new pool on every request can exhaust database connections.
- **Resolution:** Store `globalThis.__nbx_mysql_pool` to reuse pool instances across warm lambdas.
- Health Check Endpoints:
  - `GET /api/health` $\rightarrow$ `{ "status": "ok", "database": "connected", "version": "2.0.0" }`
  - `GET /api/health/database` $\rightarrow$ Detailed latency and connection status.

### E. Idempotency & Financial Concurrency
- `POST /api/v1/transactions/transfer` supports `idempotencyKey`.
- If an identical `idempotencyKey` is received, the server returns the existing transaction without executing a duplicate debit.
- Must be covered by explicit automated tests.

---

## 3. Required Architectural Changes & Files

1. **Root `vercel.json`:**
   - Configure builds, routes, rewrites, and headers.
2. **Root Entrypoint `/api/index.ts`:**
   - Serverless handler bridging Express to Vercel Serverless Functions.
3. **Database Layer (`backend/src/database/index.ts`):**
   - Implement serverless pool caching, health checks, and connection verification.
4. **Health Check Endpoints (`/api/health`, `/api/health/database`):**
   - Fast, non-blocking health checks without exposing internal credentials.
5. **Real-Time Adapter (`backend/src/modules/network/network.controller.ts` & SSE stream):**
   - Add SSE `/api/v1/network/stream` and event replay endpoints.
6. **Frontend Socket & Network Context (`frontend/src/context/NetworkSimContext.tsx` & `socket.ts`):**
   - Dual transport: WebSocket + SSE + polling fallback with seamless reconnection.
7. **Environment Variable Configurations:**
   - Create root `.env.example` with clear distinction between server secrets and optional public variables.
8. **Deployment Documentation (`DEPLOYMENT.md`):**
   - Step-by-step guide for MySQL setup, Vercel project configuration, environment variables, migrations, and troubleshooting.
9. **Final Verification Suite:**
   - Local unit/integration tests, build verification, and smoke tests.
