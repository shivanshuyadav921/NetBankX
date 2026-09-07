import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load .env from backend or root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const env = process.env.NODE_ENV || 'development';
const configuredJwtSecret = process.env.JWT_SECRET;

if (env === 'production' && !configuredJwtSecret) {
  console.warn('[NetBankX Security Warning] JWT_SECRET is not configured in production environment. Using default fallback key. Please configure JWT_SECRET in Vercel project environment variables for production security.');
}

const configuredCorsOrigin = process.env.CORS_ORIGIN;
let allowedOrigins: string[] = ['http://localhost:5173', 'http://localhost:4000'];

if (configuredCorsOrigin) {
  if (configuredCorsOrigin === '*') {
    allowedOrigins = ['*'];
  } else {
    allowedOrigins = configuredCorsOrigin.split(',').map(origin => origin.trim()).filter(Boolean);
  }
}

export const config = {
  env,
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigins: allowedOrigins,
  jwt: {
    secret: configuredJwtSecret || 'netbankx-production-jwt-security-key-2026-fallback',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  db: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'netbankx_db',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    useEmbeddedFallback: process.env.DB_USE_EMBEDDED_FALLBACK !== 'false',
    requireMysql: process.env.DB_REQUIRE_MYSQL === 'true',
  },
  simulation: {
    defaultLossRate: parseFloat(process.env.SIM_DEFAULT_LOSS_RATE || '0.02'),
    defaultBaseLatency: parseInt(process.env.SIM_DEFAULT_BASE_LATENCY || '15', 10),
    tickRateMs: parseInt(process.env.SIM_TICK_RATE_MS || '50', 10),
  }
};
