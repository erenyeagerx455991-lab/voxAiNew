# Memory Baseline — V7.0.3

Captured before fixes. Documents pre-hardening worst-case growth for each structure.

---

## Structure 1: `_localJobs` (buildQueue.ts:15)

```typescript
const _localJobs = new Map<string, JobInfo>();
```

**Growth**: O(total builds) — entries added on every `enqueueBuild()`, never removed until `closeQueue()`.

**Per-entry size**: ~300 bytes (jobId string + JobInfo fields + Map overhead)

**Worst-case estimates**:

| Load | Duration | Entries | Memory |
|---|---|---|---|
| 1 build/min | 1 day | 1,440 | ~430 KB |
| 1 build/min | 1 week | 10,080 | ~3 MB |
| 10 builds/min | 1 day | 14,400 | ~4.3 MB |
| 10 builds/min | 30 days | 432,000 | ~130 MB |

**Terminal condition**: Grows until process restart or `closeQueue()`.

---

## Structure 2: `tpmWindow` (providerBudget.ts:11)

```typescript
tpmWindow: number[];  // one push per TOKEN, not per request
```

**Growth**: O(tokens consumed in last 60 seconds) — each call to `recordProviderTokens(provider, N)` pushes N timestamps.

**Per-entry size**: 8 bytes (64-bit float timestamp)

**Worst-case estimates**:

| Scenario | Tokens/request | Requests/min | Window entries | Memory |
|---|---|---|---|---|
| Normal (Groq) | 2,000 avg | 10 | 20,000 | ~160 KB |
| Spike (Groq) | 4,000 max | 10 | 40,000 | ~320 KB |
| Max pressure | 4,000 | 30 (RPM limit) | 120,000 | ~960 KB |
| Adversarial | 4,000 | 30 | 120,000 | ~960 KB |
| Default Groq MAX_TPM = 6,000 | any | any | ≤6,000 after purge | ~48 KB |

**Note**: purge removes expired entries, so in steady state entries are bounded by RPM × max_tokens_per_request. With MAX_RPM=30 and 4,000 tokens/request, peak = 120,000 entries. Not bounded by MAX_TPM (the gate checks length, not entry token counts).

**Terminal condition**: Bounded only by RPM × tokens_per_request × 60 seconds.

---

## Structure 3: `enqueueTimes` (queueMetrics.ts:29)

```typescript
const enqueueTimes = new Map<string, number>();
// recordJobEnqueued stores: `${Date.now()}-${Math.random()}` → Date.now()
// recordJobStarted looks up:  jobId → never matches
// Result: entries never deleted
```

**Growth**: O(total builds) — one entry added per build, never removed.

**Per-entry size**: ~80 bytes (random key string + timestamp)

**Worst-case**: Same as `_localJobs` — unbounded growth across process lifetime.

---

## Structures that are already bounded

| Structure | Bound | How |
|---|---|---|
| `waitTimes` | 500 entries | `cappedPush` shifts oldest |
| `durations` | 500 entries | `cappedPush` shifts oldest |
| `recentFailures` | 50 entries | shift on overflow |
| `rpmWindow` | MAX_RPM (30/60) | timestamps purged after 60 s |
| `startTimes` | active jobs only | deleted on complete/fail |
| `byUser` | unique user count | not yet bounded (low-risk) |

---

## Post-Hardening Targets (V7.0.3)

| Structure | Target |
|---|---|
| `_localJobs` | ≤ 1,000 entries (TTL 1 h + hard cap) |
| `tpmWindow` | O(requests) — 1 entry per request, not per token |
| `enqueueTimes` | O(active jobs) — deleted on start/fail/cancel/complete |
