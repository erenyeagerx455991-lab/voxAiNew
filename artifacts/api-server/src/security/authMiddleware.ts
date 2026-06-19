import type { Request, Response, NextFunction } from 'express';
import { recordAuthSuccess, recordAuthFailure } from './securityMetrics.js';
import { createLogger } from '../lib/structuredLogger.js';

const log = createLogger("AuthMiddleware");
const CONFIGURED_KEY = process.env['API_KEY'];
const AUTH_ENABLED = Boolean(CONFIGURED_KEY);

if (!AUTH_ENABLED) {
  log.warn("AUTH_DISABLED", { reason: "API_KEY not set — authentication disabled (dev mode). Set API_KEY to enforce auth." });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!AUTH_ENABLED) { next(); return; }
  const provided = req.headers['x-api-key'];
  if (!provided || provided !== CONFIGURED_KEY) {
    recordAuthFailure();
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  recordAuthSuccess();
  next();
}
