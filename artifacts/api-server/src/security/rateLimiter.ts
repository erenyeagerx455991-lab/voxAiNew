import rateLimit from 'express-rate-limit';
import { recordRateLimitHit, recordBlockedRequest } from './securityMetrics.js';
import { createLogger } from '../lib/structuredLogger.js';

const log = createLogger("RateLimiter");

export const buildRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env['RATE_LIMIT_BUILD'] ?? 10),
  message: { error: 'Too many build requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res, _next, options) {
    recordRateLimitHit();
    recordBlockedRequest();
    log.warn("RATE_LIMIT_BUILD", { ip: req.ip });
    res.status(options.statusCode).json(options.message);
  },
});

export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env['RATE_LIMIT_CHAT'] ?? 30),
  message: { error: 'Too many chat requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res, _next, options) {
    recordRateLimitHit();
    recordBlockedRequest();
    log.warn("RATE_LIMIT_CHAT", { ip: req.ip });
    res.status(options.statusCode).json(options.message);
  },
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env['RATE_LIMIT_GENERAL'] ?? 60),
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res, _next, options) {
    recordRateLimitHit();
    recordBlockedRequest();
    log.warn("RATE_LIMIT_GENERAL", { ip: req.ip });
    res.status(options.statusCode).json(options.message);
  },
});

export function getRateLimitMetrics() {
  return {
    buildLimit: Number(process.env['RATE_LIMIT_BUILD'] ?? 10),
    chatLimit: Number(process.env['RATE_LIMIT_CHAT'] ?? 30),
    generalLimit: Number(process.env['RATE_LIMIT_GENERAL'] ?? 60),
    windowMs: 60_000,
  };
}
