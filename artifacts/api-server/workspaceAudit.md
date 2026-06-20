# Workspace Cleanup Audit — V7.0

Auditor: independent code review
Date: 2026-06-19
Scope: `src/workspace/workspaceRegistry.ts`, `src/workspace/workspaceManager.ts`, `src/security/workspaceCleanup.ts`, `src/app.ts`

---

## Two Cleanup Systems Exist — Only One Is Active

### System A: Security Cleanup (filesystem-based)

**File**: `src/security/workspaceCleanup.ts`  
**Started by**: `src/app.ts:84` — `startCleanupScheduler()`  
**Interval**: 15 minutes (env `WORKSPACE_CLEANUP_INTERVAL_MS`)  
**Method**: `readdir('/tmp/nexogen-runs')` → `stat()` each entry → `rm()` if `mtime > MAX_AGE_MS`

This system **is active** and **does run**.

### System B: Registry Cleanup (registry-based)

**File**: `src/workspace/workspaceManager.ts:66-86` — `cleanStaleWorkspaces()`  
**Started by**: nothing  
**Method**: `getStaleWorkspaces(maxAgeMs)` → `rm()` → `unregisterWorkspace()`

`cleanStaleWorkspaces()` is never called from `app.ts`, any route, or any scheduler. It exists only in tests. **System B is dead code in production.**

---

## Finding 1: `allocateWorkspace` Is Never Called From the Real Build Path

**File**: `src/routes/agents.ts:60-93` — `runBuildPipeline` is called directly. No call to `allocateWorkspace()` exists in agents.ts.

**File**: `src/workspace/workspaceManager.ts:21-64` — `allocateWorkspace` creates a real directory, calls `markWorkspaceActive`, and registers an entry. But since it is never invoked from the build route, the workspace registry always has zero entries in production.

**Consequence**: `getRegistryStats()`, workspace telemetry, and all registry-based metrics show 0 for every field. The registry is not tracking real builds.

---

## Finding 2: `done()` Does Not Delete the Directory

**File**: `src/workspace/workspaceManager.ts:46-51`
```typescript
async done() {
  markWorkspaceDone(path);
  setWorkspaceStatus(workspaceId, 'deleted');
  unregisterWorkspace(workspaceId);
  log.info('WORKSPACE_RELEASED', { workspaceId });
},
```

`done()` marks the entry deleted and removes it from the registry. It does NOT call `rm(path)`. The directory remains on disk until the filesystem-level cleanup (System A) sweeps it after the TTL expires.

`fail()` (lines 52-63) does call `rm(path)` — so failed builds clean up immediately, but successful builds rely on the scheduler.

---

## Finding 3: Active Build Protection Relies on System A, Not Registry

**File**: `src/security/workspaceCleanup.ts:8-12`
```typescript
const _activeWorkspaces = new Set<string>();
export function markWorkspaceActive(dir: string): void { _activeWorkspaces.add(dir); }
export function markWorkspaceDone(dir: string): void   { _activeWorkspaces.delete(dir); }
```

**File**: `src/security/workspaceCleanup.ts:34`
```typescript
if (isWorkspaceActive(fullPath)) { result.skipped++; continue; }
```

System A correctly skips directories that have been marked active. This protection works — but only because `markWorkspaceActive` and `markWorkspaceDone` are called in `workspaceManager.ts:29, 47, 53`. Since `allocateWorkspace` is never called in production, `_activeWorkspaces` is always empty.

If `allocateWorkspace` were wired in, the protection would function correctly.

---

## Finding 4: Cleanup Scheduler Runs and Is Verified

Server log at startup (confirmed from workflow output):
```
{"level":"info","component":"WorkspaceCleanup","event":"SCHEDULER_STARTED","intervalSeconds":900,"maxAgeSeconds":3600}
{"level":"info","component":"WorkspaceCleanup","event":"CLEANUP_RUN_COMPLETE","scanned":0,"deleted":0,"skipped":0,"durationMs":0}
```

The scheduler fires 5 seconds after startup, then every 15 minutes. It scans `/tmp/nexogen-runs`. Currently returns 0 entries because real builds do not use the workspace system.

---

## Finding 5: Stale Detection Logic Is Correct (Registry-Based)

**File**: `src/workspace/workspaceRegistry.ts:56-61`
```typescript
export function getStaleWorkspaces(maxAgeMs: number): WorkspaceEntry[] {
  const cutoff = Date.now() - maxAgeMs;
  return Array.from(_registry.values()).filter(
    (e) => e.lastAccessedAt <= cutoff && e.status !== 'creating'
  );
}
```

Uses `<=` (corrected during this session). The `creating` status exclusion prevents active allocation from being cleaned. Logic is correct. Dead in production because registry has zero entries.

---

## Finding 6: Memory Leak Risk in Registry

**File**: `src/workspace/workspaceRegistry.ts:16`
```typescript
const _registry = new Map<string, WorkspaceEntry>();
```

If `allocateWorkspace` were called and `unregisterWorkspace` not called (e.g., due to an exception in `done()` or `fail()`), entries would accumulate. In practice this is moot since `allocateWorkspace` is unreachable from production. `clearRegistry()` exists at line 76 but is only called from tests.

---

## Finding 7: Telemetry Queue Endpoint — Workspace Section Is Always 0

**File**: `src/routes/telemetry.ts:46-54`
```typescript
router.get("/telemetry/queue", authMiddleware, (_req, res) => {
  res.json({
    queue:   getQueueMetrics(),
    budget:  getBudgetMetrics(),
    usage:   getBudgetUsage(),
    users:   getAllUserStats(),
    ...
  });
});
```

The telemetry response previously described in `scalabilityReport.md` includes a `workspace` field. This field does not appear in the actual telemetry endpoint response. The schema in the report is incorrect.

**Correction**: `getWorkspaceStats()` is not called from the telemetry route. No workspace data is included in the queue telemetry response.

---

## Workspace Audit Summary

| Claim | Verified? | Notes |
|---|---|---|
| Cleanup actually runs | YES | System A (filesystem) runs every 15 min |
| Stale detection logic correct | YES | `<= cutoff` and `!= 'creating'` |
| Active build protection works | PARTIAL | Correct logic; never triggered (allocateWorkspace not called) |
| Registry tracks real builds | NO | Registry always empty in production |
| `done()` deletes directory | NO | Only marks status; relies on scheduler for actual rm |
| Memory leak risk | LOW | Registry empty in practice; risk if ever wired |
| Workspace telemetry accurate | NO | Registry stats always 0/0/0 |
