/**
 * V8.0 — Unified BuildContext
 *
 * One immutable object carries every piece of context a pipeline step may need.
 * No downstream system may independently recreate context — they receive this
 * object and enrich it via `enrichContext()`.
 */

import type {
  PageBlueprint,
  ProjectBlueprint,
  DesignDNA,
  DNAComposition,
  ServerKnowledgeGraph,
} from "../agents/types.js";
import type { PageTree } from "../component-tree/componentTreeTypes.js";
import type { TokenSet } from "../design-tokens/tokenTypes.js";
import type { PlannerOutput, ArchitectureOutput, FrontendOutput } from "../agents/pipeline/pipelineTypes.js";

// ── Keys ─────────────────────────────────────────────────────────────────────

export interface BuildKeys {
  readonly openrouterKey: string;
  readonly groqKey: string;
}

// ── Core Context ─────────────────────────────────────────────────────────────

export interface BuildContext {
  // Identity
  readonly buildId: string;
  readonly chatId: string;
  readonly userId: string;
  readonly startedAt: number;

  // Input
  readonly prompt: string;

  // API keys (never serialised to SSE)
  readonly keys: Readonly<BuildKeys>;

  // Planning layer
  readonly plan?: PlannerOutput;

  // Design Intelligence
  readonly dna?: DesignDNA;
  readonly dnaComposition?: DNAComposition;
  readonly dnaOwnership?: Record<string, string>;
  readonly dnaTheme?: Record<string, unknown> | null;
  readonly dnaMotion?: Record<string, unknown> | null;
  readonly industry?: string;
  readonly authNeeded?: boolean;
  readonly navbarVariant?: string;

  // Blueprint layer
  readonly blueprint?: PageBlueprint;
  readonly projectBlueprint?: ProjectBlueprint;

  // Architecture layer
  readonly architecture?: ArchitectureOutput;

  // Component Tree
  readonly componentTree?: PageTree;

  // Design Tokens
  readonly tokenSet?: TokenSet;

  // Frontend output
  readonly frontend?: FrontendOutput;

  // Knowledge Graph
  readonly knowledgeGraph?: ServerKnowledgeGraph;

  // Retrieval
  readonly retrievalReferenceIds?: string[];
  readonly retrievalContext?: string;

  // Telemetry / tracing
  readonly traceId?: string;
}

// ── Serialisable snapshot (safe to log / SSE) ─────────────────────────────────

export type BuildContextSnapshot = Omit<BuildContext, "keys">;

export function snapshotContext(ctx: BuildContext): BuildContextSnapshot {
  const { keys: _keys, ...rest } = ctx;
  return rest;
}
