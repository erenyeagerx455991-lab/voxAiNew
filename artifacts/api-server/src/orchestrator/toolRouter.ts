/**
 * V8.0 — Tool Router
 *
 * Maps an incoming request intent to a named pipeline strategy.
 * The orchestrator uses this decision to choose which pipeline to invoke.
 * Contains zero business logic — only routing rules.
 */

// ── Strategy Registry ─────────────────────────────────────────────────────────

export type BuildStrategy =
  | "full-build"        // Generate a complete new project from a prompt
  | "edit"              // Incremental surgical edit of existing project
  | "audit"             // Design + architecture audit (read-only)
  | "runtime-repair"    // Fix a runtime error reported from the preview
  | "autonomous-build"  // Self-healing build loop for pre-existing files
  | "export";           // ZIP export of project files

export interface RouteDecision {
  readonly strategy: BuildStrategy;
  readonly reason: string;
}

// ── Path → Strategy ───────────────────────────────────────────────────────────

const PATH_RULES: Array<{ test: (path: string) => boolean; strategy: BuildStrategy; reason: string }> = [
  { test: (p) => p.endsWith("/build"),           strategy: "full-build",      reason: "New project generation from prompt" },
  { test: (p) => p.endsWith("/edit"),            strategy: "edit",            reason: "Incremental edit of existing project" },
  { test: (p) => p.endsWith("/audit"),           strategy: "audit",           reason: "Design and architecture audit" },
  { test: (p) => p.includes("/runtime-repair"),  strategy: "runtime-repair",  reason: "Runtime error repair from preview" },
  { test: (p) => p.includes("/autonomous-build"),strategy: "autonomous-build", reason: "Autonomous multi-pass build loop" },
  { test: (p) => p.endsWith("/export"),          strategy: "export",          reason: "Project ZIP export" },
];

/**
 * Determine the pipeline strategy from an Express request path.
 */
export function routeToStrategy(requestPath: string): RouteDecision {
  for (const rule of PATH_RULES) {
    if (rule.test(requestPath)) {
      return { strategy: rule.strategy, reason: rule.reason };
    }
  }
  return { strategy: "full-build", reason: "Default fallback" };
}

// ── Intent → Strategy (for chat-level routing) ────────────────────────────────

const EDIT_INTENT_KEYWORDS = [
  "change", "update", "fix", "modify", "edit", "adjust", "replace",
  "remove", "add to", "tweak", "improve", "refactor", "rename",
];

const AUDIT_INTENT_KEYWORDS = [
  "audit", "review", "analyse", "analyze", "check", "evaluate",
  "score", "inspect", "diagnose",
];

/**
 * Heuristically classify a natural-language prompt as a build vs edit vs audit intent.
 * Used by the AI Orchestrator when the request type is ambiguous.
 */
export function classifyPromptIntent(
  prompt: string,
  hasExistingFiles: boolean,
): RouteDecision {
  const lower = prompt.toLowerCase();

  if (AUDIT_INTENT_KEYWORDS.some((kw) => lower.startsWith(kw))) {
    return { strategy: "audit", reason: "Prompt starts with audit keyword" };
  }

  if (hasExistingFiles && EDIT_INTENT_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { strategy: "edit", reason: "Edit keyword detected with existing project" };
  }

  return { strategy: "full-build", reason: "No specialised intent detected — full build" };
}
