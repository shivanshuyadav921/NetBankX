# NETBANKX — Vercel Deployment & Architecture Guide

## 1. Overview
NetBankX is structured as a unified monorepo deployed on **Vercel** with:
- **Frontend**: Vite + React single-page application built to `frontend/dist` and served statically via edge CDN with client-side SPA routing.
- **Backend**: Express TypeScript REST API and network simulation engine packaged as a Vercel Serverless Function (`/api/index.ts`) handling all `/api/v1/*` routes and health checks (`/health`).

---

## 2. Directory Structure & Entrypoints

```
NETBANKX ROOT
├── frontend/               # Vite + React Single-Page Application
│   ├── dist/               # Static production build directory
│   ├── src/                # UI components, state, hooks, simulation visualizers
│   └── package.json        # Frontend dependencies
├── backend/                # Express + TypeScript Core Engine
│   ├── dist/               # Compiled CJS modules for production runtime
│   ├── src/
│   │   ├── app.ts          # createApp() factory & route setup
│   │   ├── index.ts        # Local standalone HTTP + Socket.IO server
│   │   └── database/       # MySQL 8 + Transactional Relational Engine
│   └── package.json        # Backend dependencies
├── api/
│   └── index.ts            # Vercel Serverless Function entrypoint (imports backend app factory)
├── vercel.json             # Vercel deployment & routing configuration
└── package.json            # Root workspace orchestration and dependencies
```

---

## 3. Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index"
    },
    {
      "source": "/health",
      "destination": "/api/index"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 4. Environment Variables

Configure the following environment variables in your **Vercel Project Settings -> Environment Variables**:

| Variable | Required | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | Runtime environment mode | `production` |
| `JWT_SECRET` | Recommended | Secret key used for signing authentication tokens | 64+ char random hex string |
| `CORS_ORIGIN` | Optional | Allowed origins for cross-site access | `*` (or custom domains) |
| `DATABASE_URL` | Optional | Remote MySQL connection string | `mysql://user:pass@host:3306/netbankx_db` |
| `DB_HOST` | Optional | MySQL hostname | `aws.connect.psdb.cloud` |
| `DB_USER` | Optional | MySQL username | `admin` |
| `DB_PASSWORD` | Optional | MySQL password | `secret` |
| `DB_NAME` | Optional | MySQL database name | `netbankx_db` |
| `DB_PORT` | Optional | MySQL port | `3306` |
| `DB_SSL` | Optional | Enable TLS/SSL connection for cloud MySQL | `true` |
| `DB_REQUIRE_MYSQL` | Optional | Fail fast in production if MySQL connection fails | `false` (defaults to In-Memory Engine) |

> **Note on Database Storage**:
> If no remote MySQL database is configured, NetBankX seamlessly initializes its high-performance **Transactional In-Memory Relational Engine (ACID compliant)** with all seed data (Customers, Accounts, Routers, Links, LEDGER, SOC Incidents).

---

## 5. Deployment Instructions

### Deploying via Vercel Web Dashboard (GitHub / GitLab Integration)
1. Push repository to your Git provider (GitHub / GitLab / Bitbucket).
2. Go to **[vercel.com/new](https://vercel.com/new)**.
3. Import the `netbankx` repository.
4. Keep the **Root Directory** as `./` (do not change).
5. Framework Preset will automatically use `Vite` (defined in `vercel.json`).
6. Click **Deploy**.

### Deploying via Vercel CLI
```bash
# Link project to Vercel (first time only)
vercel link

# Deploy preview build
vercel

# Deploy to production
vercel --prod
```

---

## 6. Verification & Health Check Endpoints

Once deployed, you can verify your deployment with:

- **Health Check**: `https://<your-deployment>.vercel.app/health`
  ```json
  {
    "status": "ok",
    "service": "netbankx-backend",
    "database": "connected",
    "provider": "Transactional In-Memory Relational Engine",
    "usingFallback": true,
    "version": "2.0.0",
    "timestamp": "..."
  }
  ```
- **Network Topology API**: `https://<your-deployment>.vercel.app/api/v1/network/topology`
- **Frontend Application**: `https://<your-deployment>.vercel.app/`
