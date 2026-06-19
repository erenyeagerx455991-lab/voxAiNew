// ── V6.4.6: CORS Configuration (Phase 6) ─────────────────────────────────────
// Replaces the open cors() default with an explicit allowlist.
// Dev: localhost + Replit preview domains. Prod: configured env values.

import cors from 'cors';
import { recordCorsViolation } from './securityMetrics.js';

// ── Allowlist ─────────────────────────────────────────────────────────────────

const DEV_ORIGINS: RegExp[] = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  // Replit preview domains: *.replit.app, *.repl.co, *.repl.run, *.replit.dev
  /^https?:\/\/[a-zA-Z0-9-]+\.replit\.app$/,
  /^https?:\/\/[a-zA-Z0-9-]+\.repl\.co$/,
  /^https?:\/\/[a-zA-Z0-9-]+\.repl\.run$/,
  /^https?:\/\/[a-zA-Z0-9-]+\.replit\.dev$/,
  // Replit workspace proxy domains
  /^https?:\/\/[a-zA-Z0-9-]+-[a-zA-Z0-9]+\.replit\.app$/,
];

// Additional production origins from env (comma-separated)
function getProdOrigins(): string[] {
  const raw = process.env['ALLOWED_ORIGINS'] ?? '';
  return raw.split(',').map(o => o.trim()).filter(Boolean);
}

function isAllowed(origin: string): boolean {
  // Check dev patterns
  if (DEV_ORIGINS.some(re => re.test(origin))) return true;
  // Check prod env list
  if (getProdOrigins().includes(origin)) return true;
  return false;
}

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow requests with no origin (same-origin, curl, server-to-server)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (isAllowed(origin)) {
      callback(null, true);
    } else {
      recordCorsViolation();
      console.warn(`[CORS_VIOLATION] Blocked origin: ${origin}`);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
});
