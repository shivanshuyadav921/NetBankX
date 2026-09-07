# NetBankX — Enterprise Production Deployment Guide (Vercel + Remote MySQL)

This guide documents the complete end-to-end production deployment procedure for **NetBankX** on Vercel with a remote MySQL database instance.

---

## ??? 1. Architecture Overview on Vercel

```
[ Web Browser / Client ]
           ¦
           ¦ HTTPS (TLS 1.3)
           ?
[ Vercel Edge Network ]
  +-- Static Single-Page Application (React 18 + Vite 6)
  +-- Serverless Functions (Node.js 20+ Runtime)
  ¦     +-- Express API Gateway (`/api/index.ts`)
  ¦           +-- Core Banking Engine (ACID Transactions)
  ¦           +-- Dijkstra Graph Routing Engine
  ¦           +-- Educational Packet Simulator & TCP Reliability
  ¦           +-- Server-Sent Events (SSE) Stream (`/api/v1/network/stream`)
  +-- Health Check Endpoints (`/api/health`, `/api/health/database`)
           ¦
           ¦ TLS / TCP Connection Pool
           ?
[ Remote MySQL 8.0 Cloud Database ] (AWS RDS / Aiven / PlanetScale / TiDB / Railway)
  +-- 14 Relational Tables (InnoDB, Foreign Keys, Indexes)
  +-- Double-Entry Atomic Ledgers (DECIMAL 15,2 Precision)
```

---

## ??? 2. Remote MySQL Database Setup & Initialization

### Step 1: Provision a MySQL 8.0 Instance
Provision a cloud-hosted MySQL 8.0 database from any provider:
- **AWS RDS** (MySQL 8.0 engine)
- **Aiven MySQL**
- **Railway MySQL**
- **TiDB Cloud / PlanetScale**
- **DigitalOcean Managed Databases**

### Step 2: Execute Schema & Seed Scripts
Connect to your remote database using the MySQL CLI or a GUI (e.g. MySQL Workbench, DBeaver):
```bash
mysql -h <YOUR_DB_HOST> -P <YOUR_DB_PORT> -u <YOUR_DB_USER> -p <YOUR_DB_NAME> < schema.sql
mysql -h <YOUR_DB_HOST> -P <YOUR_DB_PORT> -u <YOUR_DB_USER> -p <YOUR_DB_NAME> < seed.sql
```

This creates all 14 relational tables (`roles`, `users`, `regions`, `branches`, `customers`, `accounts`, `transactions`, `network_nodes`, `network_links`, `audit_logs`, etc.) with initial demo accounts.

---

## ?? 3. Environment Variables Configuration

Set these environment variables in your Vercel Project Settings (**Project Settings ? Environment Variables**):

| Variable Name | Environment | Example Value | Purpose |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Production, Preview | `production` | Enables production optimizations |
| `DATABASE_URL` | Production, Preview | `mysql://user:pass@host:3306/netbankx_db?ssl={"rejectUnauthorized":true}` | Primary MySQL connection URI |
| `DB_USE_EMBEDDED_FALLBACK`| Production | `false` | Mandates live remote database in production |
| `JWT_SECRET` | Production, Preview | *(Random 32+ character string)* | Secret for HMAC-SHA256 JWT signing |
| `JWT_EXPIRES_IN` | Production, Preview | `24h` | Token expiration duration |
| `API_PREFIX` | Production, Preview | `/api/v1` | Base API route prefix |
| `CORS_ORIGIN` | Production, Preview | `*` | Allowed CORS origins |

> [!IMPORTANT]
> Never expose `DATABASE_URL`, `DB_PASSWORD`, or `JWT_SECRET` to client-side code.

---

## ?? 4. Deploying to Vercel

### Method A: Deploy via Vercel CLI
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to your Vercel Account
vercel login

# 3. Link and deploy
vercel
```

### Method B: Deploy via GitHub / GitLab Repository Integration
1. Push this repository to GitHub or GitLab.
2. In the Vercel Dashboard, click **Add New ? Project** and import the repository.
3. Configure the build settings (Vercel automatically detects `vercel.json`):
   - **Framework Preset:** Other / None
   - **Build Command:** `npm run build`
   - **Output Directory:** `frontend/dist`
4. Add all Environment Variables from Section 3.
5. Click **Deploy**.

---

## ?? 5. Post-Deployment Verification & Health Checks

Once deployed, verify that the application and database connectivity are healthy:

1. **Service & Database Health:**
   ```bash
   curl -s https://<YOUR_VERCEL_DOMAIN>/api/health
   ```
   **Expected Response:**
   ```json
   {
     "status": "ok",
     "database": "connected",
     "version": "2.0.0",
     "timestamp": "2026-09-06T13:35:00.000Z"
   }
   ```

2. **Detailed Database Health:**
   ```bash
   curl -s https://<YOUR_VERCEL_DOMAIN>/api/health/database
   ```
   **Expected Response:**
   ```json
   {
     "success": true,
     "data": {
       "status": "connected",
       "latencyMs": 14,
       "provider": "Remote MySQL",
       "usingFallback": false,
       "version": "8.0.36"
     }
   }
   ```

3. **Smoke Test Login & Transfer:**
   - Open `https://<YOUR_VERCEL_DOMAIN>` in your browser.
   - Login as Customer `shivam` with password `Password@123`.
   - Perform an instant transfer of `?5,000` to account `ACC-100003`.
   - Inspect the real-time animated packet trace and 7-layer OSI breakdown.

---

## ??? 6. Troubleshooting & Rollback Procedures

### Common Issues & Solutions

1. **Database Connection Timeout / Refused:**
   - **Cause:** Cloud MySQL security group or IP allowlist blocking Vercel serverless IPs.
   - **Fix:** Enable `Allow access from any IP (0.0.0.0/0)` or configure database provider's Vercel integration (e.g. PlanetScale, AWS RDS SSL).
   - Verify `DB_SSL=true` is set if connecting to cloud providers requiring TLS certificates.

2. **Frontend 404 on Deep Routes (e.g. `/customer/transfer`):**
   - **Cause:** Missing SPA rewrite rules.
   - **Fix:** Verify `vercel.json` includes the rewrite rule `{ "source": "/(.*)", "destination": "/index.html" }`.

3. **Rollback Procedure:**
   - In the Vercel Dashboard, navigate to **Deployments**.
   - Select the previous stable deployment and click **Promote to Production** for instantaneous zero-downtime rollback.
