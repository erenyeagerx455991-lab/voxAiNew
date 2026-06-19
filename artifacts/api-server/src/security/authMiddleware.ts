// ── V6.4.6: Authentication Middleware (Phase 3) ───────────────────────────────
// Validates x-api-key header against process.env.API_KEY.
// If API_KEY is not configured, auth is disabled (dev-safe graceful degradation).

import type { Request, Response, NextFunction } from 'express';
import { recordAuthSuccess, recordAuthFailure } from './securityMetrics.js';

const CONFIGURED_KEY = process.env['API_KEY'];
const AUTH_ENABLED = Boolean(CONFIGURED_KEY);

if (!AUTH_ENABLED) {
  console.warn('[AUTH] API_KEY not set — authentication disabled (dev mode). Set API_KEY to enforce auth.');
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Auth disabled in dev if no key configured
  if (!AUTH_ENABLED) {
    next();
    return;
  }

  const provided = req.headers['x-api-key'];

  if (!provided || provided !== CONFIGURED_KEY) {
    recordAuthFailure();
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  recordAuthSuccess();
  next();
}
