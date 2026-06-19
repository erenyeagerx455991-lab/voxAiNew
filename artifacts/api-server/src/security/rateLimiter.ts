// ── V6.4.6: Rate Limiter (Phase 4) ───────────────────────────────────────────
// Separate limits for BUILD, CHAT, and GENERAL routes.
// Conservative defaults — update via env vars once baseline is established.

import rateLimit from 'express-rate-limit';
import { recordRateLimitHit, recordBlockedRequest } from './securityMetrics.js';

function onLimitReached(route: string) {
  return () => {
    recordRateLimitHit();
    recordBlockedRequest();
    console.warn(`[RATE_LIMIT] Limit hit on ${route}`);
  };
}

// ── BUILD routes: /api/agents/* ───────────────────────────────────────────────
// AI builds are expensive — strict window
export const buildRateLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minute window
  max: Number(process.env['RATE_LIMIT_BUILD'] ?? 10),
  message: { error: 'Too many build requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res, next, options) {
    recordRateLimitHit();
    recordBlockedRequest();
    console.warn(`[RATE_LIMIT] Build limit hit — ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

// ── CHAT routes: /api/chat/* ──────────────────────────────────────────────────
// Conversational — slightly more lenient
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env['RATE_LIMIT_CHAT'] ?? 30),
  message: { error: 'Too many chat requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res, next, options) {
    recordRateLimitHit();
    recordBlockedRequest();
    console.warn(`[RATE_LIMIT] Chat limit hit — ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

// ── GENERAL routes: all other /api/* ─────────────────────────────────────────
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env['RATE_LIMIT_GENERAL'] ?? 60),
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res, next, options) {
    recordRateLimitHit();
    recordBlockedRequest();
    console.warn(`[RATE_LIMIT] General limit hit — ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

// Expose rate limit metrics
export function getRateLimitMetrics() {
  return {
    buildLimit: Number(process.env['RATE_LIMIT_BUILD'] ?? 10),
    chatLimit: Number(process.env['RATE_LIMIT_CHAT'] ?? 30),
    generalLimit: Number(process.env['RATE_LIMIT_GENERAL'] ?? 60),
    windowMs: 60_000,
  };
}
