---
name: VoxAI V6.4.6 Security Baseline
description: Production security hardening — helmet, CORS allowlist, rate limiting, auth middleware, workspace cleanup scheduler, security metrics.
---

## What was built

7 new files in `artifacts/api-server/src/security/`:
- `securityMetrics.ts` — in-memory counters (authSuccess/Failure, rateLimitHits, corsViolations, cleanupRuns)
- `authMiddleware.ts` — x-api-key validation; if API_KEY env not set → auth disabled (dev-safe)
- `rateLimiter.ts` — 3 separate limiters: buildRateLimiter (10/min), chatRateLimiter (30/min), generalRateLimiter (60/min)
- `corsConfig.ts` — allowlist: localhost, *.replit.app, *.repl.co, *.replit.dev; ALLOWED_ORIGINS env for prod
- `workspaceCleanup.ts` — scheduler (15 min interval, 1h max age); markWorkspaceActive/Done registry; never deletes active builds
- `securityBaseline.ts` — request rate tracker for data-driven limit recommendations
- `validation/securityBaselineValidation.ts` — 11 automated test cases

`artifacts/api-server/src/routes/security.ts` — GET /api/security/metrics (public, no auth)

## Key decisions

**Why auth is disabled when API_KEY not set:** Prevents breaking dev environment before env var is configured. Set API_KEY + VITE_API_KEY env vars to activate.

**How to enable auth:** Set `API_KEY` secret on backend, set `VITE_API_KEY` env var on frontend (voxai artifact). Auth activates automatically on next restart.

**Frontend apiHeaders():** Single function in mockAiService.ts reads `import.meta.env.VITE_API_KEY` and attaches to all /api/* fetch calls. No duplication.

**Route protection:** /api/agents/* and /api/chat/* get rate limiting + auth. /api/healthz and /api/security/metrics are public (no auth middleware applied to them).

**app.ts middleware order:** helmet → CORS → pinoHttp → json parser → baseline recorder → per-route rate limit + auth → router → cleanup scheduler start

## How to apply

- Do NOT add auth middleware to /api route generically (breaks healthz). Apply only to /api/agents and /api/chat prefixes.
- Cleanup scheduler auto-starts on server boot; uses markWorkspaceActive(dir)/markWorkspaceDone(dir) to protect live builds.
- Rate limits configurable via env vars: RATE_LIMIT_BUILD, RATE_LIMIT_CHAT, RATE_LIMIT_GENERAL (all per minute).
