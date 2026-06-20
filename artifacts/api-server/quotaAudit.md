# Quota & User Limits Audit — V7.0

Auditor: independent code review
Date: 2026-06-19
Scope: `src/limits/userLimits.ts`, `src/cost/tokenBudget.ts`, `src/cost/providerBudget.ts`, `src/routes/agents.ts:60-93`

---

## How Limits Are Applied (Live Code Path)

**File**: `src/routes/agents.ts:70-89`
```typescript
const userId = extractUserId(req);           // line 70
const limitCheck = checkBuildLimit(userId);  // line 71
if (!limitCheck.allowed) return res.status(429)...  // line 72

const budgetCheck = checkTokenBudget();      // line 74 — GLOBAL, not per-user
if (!budgetCheck.allowed) return res.status(503)...  // line 75

recordBuildStarted(userId);                  // line 77

// ... pipeline runs ...

recordBuildCompleted(userId);                // line 89 (in finally block)
```

---

## Finding 1: Per-User Build Limits — ENFORCED

**File**: `src/limits/userLimits.ts:54-63`

Concurrent build limit (default 2) and daily build quota (default 20) are enforced. The `check → record` sequence is synchronous within the same request handler with no `await` between them. Since Node.js is single-threaded, a second concurrent request from the same user will not interleave between lines 71 and 77. No race condition for these specific calls.

**Verified**: `recordBuildCompleted` is in `finally` block (agents.ts:89), so `activeBuilds` is always decremented even on pipeline exception.

---

## Finding 2: Per-User Token Quota — NOT ENFORCED

**File**: `src/limits/userLimits.ts:84-90` — `recordTokensUsed()` exists.

**File**: `src/routes/agents.ts:60-93` — `recordTokensUsed()` is **never called**.

**File**: `src/limits/userLimits.ts:17`
```typescript
dailyTokenQuota: Number(process.env['LIMIT_DAILY_TOKENS'] ?? 200_000),
```

This limit is configured and returned by `getUserQuotaStatus` but `dailyTokens` in every user's state is always 0. The enforcement check does not exist — `checkBuildLimit` does not check `dailyTokens` against `dailyTokenQuota`. The per-user token quota is dead code.

---

## Finding 3: Global Token Budget — ENFORCED BUT NOT WIRED TO ACTUAL USAGE

**File**: `src/cost/tokenBudget.ts:60-73` — `recordTokenUsage()` exists.

**File**: `src/routes/agents.ts` — `recordTokenUsage()` is **never called** from the build route.

**File**: `src/cost/providerBudget.ts:42-47` — `recordProviderTokens()` calls `recordTokenUsage()` but is also never called from agents.ts.

`checkTokenBudget()` is called on line 74 of agents.ts and enforces at the gate. But since no code ever calls `recordTokenUsage()`, the daily counters stay at 0 permanently. The budget gate will never block a build unless emergency shutdown is manually triggered.

**Verdict**: Both token budget enforcement checks exist and return the right 503. But token usage is never recorded, so the condition they guard against can never be reached through normal operation.

---

## Finding 4: extractUserId — Weak Identity

**File**: `src/limits/userLimits.ts:111-116`
```typescript
export function extractUserId(req: Request): string {
  const key = req.headers['x-api-key'];
  if (key && typeof key === 'string') return `key:${key.slice(0, 8)}`;
  const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  return `ip:${ip}`;
}
```

**Issues**:
1. Only the first 8 characters of the API key are used as the identifier. Two keys sharing a prefix share a quota bucket.
2. Without an API key, the identifier is the client IP. Multiple users behind NAT (university, office, mobile carrier) share a single quota.
3. A single user can bypass per-user limits by rotating IP addresses (VPN, proxies).
4. `req.ip` returns the Express-computed IP. If the server is behind a proxy and `trust proxy` is not configured, `req.ip` may be the proxy IP — meaning ALL users share a single quota bucket.

---

## Finding 5: Anonymous User Handling

Users without an API key receive `ip:{address}` as userId. They are subject to the same limits as named users. No distinction between authenticated and unauthenticated quotas. No separate anonymous tier.

---

## Finding 6: Quota Reset Is Lazy, Not Scheduled

**File**: `src/limits/userLimits.ts:40-51`
```typescript
if (state.dayStart < today) {
  state.dailyBuilds = 0;
  state.dailyTokens = 0;
  state.dayStart = today;
}
```

Daily quota resets only when `getUserState()` is called for that user after midnight UTC. A user who exhausts their daily quota will not be automatically unblocked at midnight — they must make a new request to trigger the reset. For low-traffic users this is fine; for automated retry loops it could cause confusion.

---

## Finding 7: _users Map Never Pruned

**File**: `src/limits/userLimits.ts:31`
```typescript
const _users = new Map<string, UserState>();
```

Every unique userId ever seen is added to this Map. There is no TTL, no eviction, no size cap. At scale (many unique IPs), this Map grows indefinitely. Each `UserState` entry is small (~100 bytes), but with millions of unique IPs over months this becomes a memory leak.

---

## Finding 8: No Bypass Audit Logging

When `checkBuildLimit` returns `{ allowed: false }`, the 429 is returned immediately. No structured log is emitted recording which userId was blocked, at what rate, for what reason. Rate limit events are invisible in metrics unless the telemetry endpoint is polled.

---

## Quota Enforcement Summary

| Limit | Implemented | Enforced | Notes |
|---|---|---|---|
| Max concurrent builds per user | YES | YES | Correct, no race |
| Max queued builds per user | YES | PARTIAL | `recordBuildQueued` never called from real path |
| Daily build quota per user | YES | YES | Lazy reset at midnight |
| Daily token quota per user | YES | NO | `recordTokensUsed` never called |
| Global daily Groq token budget | YES | GATE ONLY | `recordTokenUsage` never called; counter always 0 |
| Global daily OpenRouter budget | YES | GATE ONLY | Same as above |
| Global emergency shutdown | YES | GATE ONLY | Can never self-trigger; would need manual call |
| Per-provider RPM/TPM limits | YES | NO | `checkProviderBudget` never called from build route |
