// ── V10.2 Hot Reload Planner — Deterministic ──────────────────────────────────
//
// Plans hot-reload coordination and module invalidation strategies.
// Zero LLM calls. Never throws.

export type ModuleStatus = 'fresh' | 'stale' | 'error' | 'loading';

export interface ModuleEntry {
  path:       string;
  status:     ModuleStatus;
  dependents: string[];
  deps:       string[];
  lastUpdate: number;
}

export interface HotReloadState {
  modules:      Map<string, ModuleEntry>;
  pendingReload: Set<string>;
  reloadQueue:  string[];
  isReloading:  boolean;
}

export function createHotReloadState(): HotReloadState {
  return {
    modules:      new Map(),
    pendingReload: new Set(),
    reloadQueue:  [],
    isReloading:  false,
  };
}

// ── Module registration ────────────────────────────────────────────────────────

export function registerModule(
  state: HotReloadState,
  path:  string,
  deps:  string[],
): HotReloadState {
  const existing  = state.modules.get(path);
  const entry: ModuleEntry = {
    path,
    status:     existing?.status ?? 'fresh',
    dependents: existing?.dependents ?? [],
    deps,
    lastUpdate: Date.now(),
  };
  const modules = new Map(state.modules).set(path, entry);

  // Update reverse deps
  for (const dep of deps) {
    const depEntry = modules.get(dep);
    if (depEntry && !depEntry.dependents.includes(path)) {
      modules.set(dep, { ...depEntry, dependents: [...depEntry.dependents, path] });
    }
  }
  return { ...state, modules };
}

// ── Invalidation ──────────────────────────────────────────────────────────────

export function invalidateModule(
  state: HotReloadState,
  path:  string,
): { state: HotReloadState; invalidated: string[] } {
  const invalidated = new Set<string>();
  const queue = [path];
  const modules = new Map(state.modules);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (invalidated.has(current)) continue;
    invalidated.add(current);

    const entry = modules.get(current);
    if (entry) {
      modules.set(current, { ...entry, status: 'stale' });
      // Propagate to dependents
      for (const dep of entry.dependents) {
        if (!invalidated.has(dep)) queue.push(dep);
      }
    }
  }

  const pendingReload = new Set([...state.pendingReload, ...invalidated]);
  return {
    state:       { ...state, modules, pendingReload },
    invalidated: [...invalidated],
  };
}

// ── Reload planning ────────────────────────────────────────────────────────────

export interface HotReloadPlan {
  canHotReload:   boolean;
  modulesToReload: string[];
  requiresFullReload: boolean;
  reason:         string;
}

export function planHotReload(
  state:        HotReloadState,
  changedPath:  string,
  language:     string,
): HotReloadPlan {
  // Config files always require full reload
  if (/vite\.config|tailwind\.config|tsconfig|\.env/.test(changedPath)) {
    return {
      canHotReload:      false,
      modulesToReload:   [],
      requiresFullReload: true,
      reason:            'Config file change requires full reload',
    };
  }

  // CSS/style changes are always hot-reloadable
  if (/\.(css|scss|sass)$/.test(changedPath)) {
    return {
      canHotReload:      true,
      modulesToReload:   [changedPath],
      requiresFullReload: false,
      reason:            'CSS hot reload',
    };
  }

  // React component changes — hot reload if module is registered
  const entry = state.modules.get(changedPath);
  if (!entry) {
    return {
      canHotReload:      true,
      modulesToReload:   [changedPath],
      requiresFullReload: false,
      reason:            'New module — hot reload',
    };
  }

  const { invalidated } = invalidateModule(state, changedPath);
  const tooMany = invalidated.length > 20;

  return {
    canHotReload:      !tooMany,
    modulesToReload:   tooMany ? [] : invalidated,
    requiresFullReload: tooMany,
    reason:            tooMany
      ? `Cascade too large (${invalidated.length} modules) — full reload`
      : `Hot reload ${invalidated.length} module(s)`,
  };
}

// ── Batching ───────────────────────────────────────────────────────────────────

export function batchPendingReloads(
  state:      HotReloadState,
  maxBatchMs: number,
): { state: HotReloadState; batch: string[] } {
  const batch = [...state.pendingReload];
  const pendingReload = new Set<string>();
  const reloadQueue = [...state.reloadQueue, ...batch];
  return {
    state: { ...state, pendingReload, reloadQueue, isReloading: batch.length > 0 },
    batch,
  };
}

export function markReloadComplete(
  state: HotReloadState,
  paths: string[],
): HotReloadState {
  const modules = new Map(state.modules);
  for (const path of paths) {
    const entry = modules.get(path);
    if (entry) modules.set(path, { ...entry, status: 'fresh', lastUpdate: Date.now() });
  }
  const reloadQueue = state.reloadQueue.filter(p => !paths.includes(p));
  return { ...state, modules, reloadQueue, isReloading: reloadQueue.length > 0 };
}
