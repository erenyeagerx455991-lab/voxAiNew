/**
 * V8.0 — Context Builder
 *
 * Creates and enriches the immutable BuildContext.  Every pipeline step calls
 * `enrichContext()` to add its outputs — the original context is never mutated.
 */

import type { BuildContext, BuildKeys } from "./buildContext.js";

// ── Factory ───────────────────────────────────────────────────────────────────

export interface ContextBuilderInput {
  readonly prompt: string;
  readonly chatId: string;
  readonly userId: string;
  readonly keys: BuildKeys;
  readonly traceId?: string;
}

/**
 * Create the initial, immutable BuildContext from a raw request.
 * Downstream steps enrich it via `enrichContext()`.
 */
export function createBuildContext(input: ContextBuilderInput): BuildContext {
  return Object.freeze({
    buildId: input.chatId,
    chatId: input.chatId,
    userId: input.userId,
    startedAt: Date.now(),
    prompt: input.prompt,
    keys: Object.freeze({ ...input.keys }),
    traceId: input.traceId,
  } satisfies BuildContext);
}

// ── Enrichment ────────────────────────────────────────────────────────────────

/**
 * Return a new frozen BuildContext with `updates` merged in.
 * Never mutates the original — SOLID Open/Closed and immutability contract.
 */
export function enrichContext<K extends keyof BuildContext>(
  ctx: BuildContext,
  updates: Pick<BuildContext, K>,
): BuildContext {
  return Object.freeze({ ...ctx, ...updates });
}

// ── Validation ────────────────────────────────────────────────────────────────

export interface ContextValidation {
  valid: boolean;
  missing: string[];
}

/** Verify that a context has all fields required before entering the pipeline. */
export function validateBuildContext(ctx: BuildContext): ContextValidation {
  const missing: string[] = [];
  if (!ctx.prompt) missing.push("prompt");
  if (!ctx.chatId) missing.push("chatId");
  if (!ctx.userId) missing.push("userId");
  if (!ctx.keys.openrouterKey) missing.push("keys.openrouterKey");
  return { valid: missing.length === 0, missing };
}
