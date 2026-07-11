// ── V8.6 Backend Architect — Authorization Planner ────────────────────────────
//
// Named alias required by the V8.6 specification module list.
// Delegates entirely to permissionPlanner.ts — no logic is duplicated.

export {
  planPermissionArchitecture as planAuthorizationArchitecture,
} from './permissionPlanner.js';
