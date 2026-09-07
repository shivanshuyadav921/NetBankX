# NETBANKX — DEPLOYMENT ENGINEERING SCRATCHPAD

**Project**: NetBankX (Enterprise Banking Network Digital Twin & Real-Time Simulation Platform)  
**Target Platform**: Vercel (Edge CDN + Serverless Functions / Fluid Compute)  
**Production URL**: https://netbankx.vercel.app  
**Preview URL**: https://netbankx-6e1kmqlau-shivanshuyadav921s-projects.vercel.app  
**Date**: September 2026  
**FINAL STATUS**: DEPLOYED & OPERATIONAL ✅

---

## 1. Final Verified Architecture
- **Option A (Single Vercel Project)**:
  - **Frontend**: Vite 6 + React 18 SPA built into `frontend/dist`, distributed globally on Vercel Edge Network with gzip/brotli asset caching.
  - **Backend**: Express 5 application compiled to CommonJS in `backend/dist`, invoked via Vercel Serverless Function `@vercel/node` entrypoint `api/index.ts`.
  - **Routing Architecture**:
    - `/api/(.*)` $\rightarrow$ `/api/index` (Direct Serverless API routes)
    - `/health` $\rightarrow$ `/api/index` (Platform Health Check)
    - `/(.*)` $\rightarrow$ `/index.html` (Vite Client-Side Routing Fallback)

---

## 2. Root Cause Audit & Exact Fix Verification

| # | Hypothesized Root Cause | Verified on Repo / System | Exact Fix Applied |
| :--- | :--- | :--- | :--- |
| **1** | `api/index.ts` cross-boundary raw TS import causing missing `express` in serverless container | **CONFIRMED**: `@vercel/nft` trace lost `backend/node_modules/express` during isolated lambda bundling. | Updated `api/index.ts` to cleanly import `createApp` from compiled `backend/dist/app.js` and synchronized root dependencies with backend. |
| **2** | `backend/src/config/index.ts` fatal startup throws when `JWT_SECRET` / `CORS_ORIGIN` missing in Vercel settings | **CONFIRMED**: Boot crash threw unhandled 500 on cold start. | Added graceful defaults for same-origin Vercel deployments and preview wildcard domains (`*.vercel.app`) with diagnostic warning logs. |
| **3** | `frontend/src/services/api.ts` throwing unhandled `SyntaxError: Unexpected token 'A'` on 500 error pages | **CONFIRMED**: Unconditional `response.json()` failed on plain-text gateway error pages. | Implemented robust Content-Type parser safely handling `application/json`, `text/plain`, `text/html`, and HTTP 5xx errors. |
| **4** | Outdated / invalid `services` preset in `vercel.json` | **CONFIRMED**: Vercel project preset had `framework: "services"` which blocked standard static builds. | Updated Vercel project framework setting to `other` and wrote standard `vercel.json` configuration. |

---

## 3. Verified Baseline & Pipeline Commands
- **`npm install`**: PASS (157 packages audited, 0 vulnerabilities).
- **`npm run typecheck`**: PASS (0 backend errors, 0 frontend errors).
- **`npm run build`**: PASS (`backend/dist` + `frontend/dist` compiled in 3.65s).
- **`npm test`**: PASS (30/30 tests passing across 7 test suites).
- **`vercel deploy --dry`**: PASS (Clean build manifest generated).
- **`vercel` (Preview)**: PASS (`https://netbankx-6e1kmqlau-shivanshuyadav921s-projects.vercel.app`).
- **`vercel deploy --prod`**: PASS (`https://netbankx.vercel.app`).

---

## 4. Live Health Check & API Verification
- `GET https://netbankx.vercel.app/health`:
  ```json
  {
    "status": "ok",
    "service": "netbankx-backend",
    "database": "connected",
    "provider": "Transactional In-Memory Relational Engine",
    "usingFallback": true,
    "version": "2.0.0",
    "timestamp": "2026-09-07T18:14:03.096Z"
  }
  ```
- `GET https://netbankx.vercel.app/api/v1/network/topology`:
  - Returned 15 nodes (HQ core, regional gateways, branch routers) and 17 links with active metrics.

---

## 5. End-to-End Browser QA Verification
- **User Authentication**: Logged in as Retail Customer (`aisha.kapoor`).
- **Atomic Fund Transfer**:
  - Transferred ₹10,000 to `ACC-100003` (`REF-FAD2EA4AAA8A`, `TXN-f826ba3d-b1d2-40cf-81e1-999b33294a16`).
  - Balance updated atomically: ₹ 2,50,000.00 $\rightarrow$ ₹ 2,40,000.00.
- **Dijkstra Hop-by-Hop Packet Journey**:
  - Dynamic Dijkstra routing path calculated across 4 hops with 24ms estimated latency.
  - Recorded browser trace: `vercel_browser_qa_1788803896287.webp`.
