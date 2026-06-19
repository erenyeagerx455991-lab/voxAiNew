# Telemetry Endpoint Security Report

> Measured directly from `src/routes/telemetry.ts` and `src/telemetry/` source.
> Date: 2026-06-19

---

## Endpoint Under Review

```
GET /api/telemetry/metrics
```

---

## 1. Authentication

**File**: `src/routes/telemetry.ts:7`

```typescript
router.get("/telemetry/metrics", authMiddleware, (_req, res) => {
```

`authMiddleware` is passed as the **second argument** directly in the route definition.

**Assessment**: ✅ PASS

- Auth check cannot be bypassed by middleware ordering at app level
- `authMiddleware` reads `process.env['API_KEY']` at module load
- If `API_KEY` is not set: auth is disabled (dev-safe graceful degradation, logged via structuredLogger at startup)
- If `API_KEY` is set: requests without matching `x-api-key` header receive HTTP 401

---

## 2. Response Content — Secrets

**File**: `src/routes/telemetry.ts:8–24`

The response is built exclusively from `globalMetrics.snapshot()`. Inspecting every field:

| Response Field | Source | Contains Secrets? |
|---|---|---|
| `builds` | `buildMetrics.syncSnapshot()` | ❌ No |
| `agents` | `agentMetrics.syncSnapshot()` | ❌ No |
| `tokens` | `tokenMetrics.syncSnapshot()` | ❌ No |
| `repairs` | `repairMetrics.syncSnapshot()` | ❌ No |
| `runtime` | `runtimeMetrics.syncSnapshot()` | ❌ No |
| `counters` | `globalMetrics.counters` (Map) | ❌ No |
| `gauges` | `globalMetrics.gauges` (Map) | ❌ No |
| `histograms` | Aggregates only | ❌ No |
| `generatedAt` | `new Date().toISOString()` | ❌ No |

**Assessment**: ✅ PASS — no secrets reachable via any code path.

---

## 3. API Keys

The telemetry route does not import or reference:

- `process.env['GROQ_API_KEY']` ❌ not present
- `process.env['OPENROUTER_API_KEY']` ❌ not present
- `process.env['API_KEY']` ❌ not present (authMiddleware reads it but does not forward it)

`buildMetrics.ts` stores `prompt: prompt.slice(0, 80)` in BuildRecord but this field is **NOT** included in the `recentBuilds` array emitted to the snapshot:

```typescript
// buildMetrics.ts:73-77
recentBuilds: [...builds.values()].slice(-10).map(b => ({
  buildId: b.buildId,
  status: b.status,
  durationMs: b.durationMs,   // ← prompt intentionally omitted
})),
```

**Assessment**: ✅ PASS — no API keys, no prompt text reachable.

---

## 4. Request Body

The endpoint handler is:

```typescript
router.get("/telemetry/metrics", authMiddleware, (_req, res) => {
```

The `req` parameter is named `_req` — it is deliberately unused. No access to `req.body`, `req.query`, `req.headers` (beyond what authMiddleware consumes), or `req.params` in the response body.

**Assessment**: ✅ PASS

---

## 5. Prompt Contents

Checked all sync paths:

- `buildMetrics.syncSnapshot()` → `recentBuilds` map explicitly excludes the `prompt` field
- `agentMetrics.syncSnapshot()` → only agent names, call counts, latencies
- `tokenMetrics.syncSnapshot()` → only provider stats, model names (no prompt text)
- `repairMetrics.syncSnapshot()` → buildId + filePath + attempt counts (no prompt)
- `runtimeMetrics.syncSnapshot()` → numeric counters and histograms only

**Assessment**: ✅ PASS — no prompt text reachable.

---

## 6. Source Code

No telemetry module imports from `src/agents/llm/prompts.ts` or any other source-code file.

**Assessment**: ✅ PASS

---

## 7. Histogram Raw Values

`metricsProvider.ts:91` stores raw duration values:

```typescript
values: sorted.slice(-100),   // last 100 values stored in snapshot
```

The endpoint **strips `values`** from the histogram output:

```typescript
// telemetry.ts:17-21
Object.entries(snap.histograms).map(([k, v]) => [
  k,
  { count: v.count, avg: ..., p50: v.p50, p95: v.p95, p99: v.p99, min: v.min, max: v.max },
  // ← `values` is omitted
])
```

Raw duration arrays are not exposed. Percentiles only.

**Assessment**: ✅ PASS

---

## 8. Counter/Gauge Key Names

Counter keys are derived from agent names and provider names (e.g. `agents.Planner.calls`, `tokens.groq.requests`). These are hard-coded strings, not user-controlled data.

**Assessment**: ✅ PASS

---

## 9. Identified Risk

| Issue | Severity | Description |
|---|---|---|
| `builds` Map stores truncated prompt (80 chars) | LOW | Stored in memory but NOT exposed in endpoint. Risk only if prompt is PII. |
| Auth bypass when `API_KEY` unset | ACCEPTABLE | Intentional dev-mode behavior, logged at startup. |

---

## Summary

| Check | Result |
|---|---|
| authMiddleware attached | ✅ PASS |
| No secrets exposed | ✅ PASS |
| No API keys exposed | ✅ PASS |
| No request body reflected | ✅ PASS |
| No prompt contents exposed | ✅ PASS |
| No source code exposed | ✅ PASS |
| Raw histogram values stripped | ✅ PASS |

**Verdict**: The endpoint is secure. No data leakage vectors identified at the HTTP response layer.
