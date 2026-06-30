/**
 * V8.0 — AI Orchestrator
 *
 * Central coordinator for all pipeline executions.  Responsibilities:
 *   - Accept a BuildContext and dispatch to the correct pipeline
 *   - Manage state, retry failed stages, handle events
 *   - Provide streaming updates via SSE
 *   - Never contain business logic — only coordination
 *
 * The orchestrator is intentionally a thin coordinator.  Every business-logic
 * decision lives inside the pipeline steps themselves.
 */

import type { Response } from "express";
import { runBuildPipeline } from "../agents/pipeline/buildPipeline.js";
import { enqueueBuild } from "../queue/buildQueue.js";
import { sse } from "../agents/streaming/sseManager.js";
import { createLogger } from "../lib/structuredLogger.js";
import type { BuildContext } from "../context/buildContext.js";
import type { BuildStrategy } from "./toolRouter.js";

const log = createLogger("Orchestrator");

// ── Execution Result ──────────────────────────────────────────────────────────

export interface OrchestratorResult {
  readonly success: boolean;
  readonly strategy: BuildStrategy;
  readonly durationMs: number;
  readonly error?: string;
}

// ── Orchestrator Config ───────────────────────────────────────────────────────

export interface OrchestratorConfig {
  /** Use the BullMQ queue (true) or execute inline (false, useful in tests) */
  readonly useQueue: boolean;
  /** Max retry attempts for a failed pipeline stage */
  readonly maxRetries: number;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  useQueue: true,
  maxRetries: 0, // Retry logic lives inside individual pipeline steps
};

// ── Main Orchestrator ─────────────────────────────────────────────────────────

/**
 * Execute a full-build pipeline for the given context.
 *
 * Uses the BullMQ queue in production (fire-and-forget + SSE bridge).
 * Falls back to inline execution when `config.useQueue` is false.
 */
export async function orchestrateBuild(
  ctx: BuildContext,
  res: Response,
  config: OrchestratorConfig = DEFAULT_CONFIG,
): Promise<OrchestratorResult> {
  const start = Date.now();

  log.info("ORCHESTRATOR_BUILD_START", {
    buildId: ctx.buildId,
    userId: ctx.userId,
    useQueue: config.useQueue,
  });

  try {
    if (config.useQueue) {
      // ── Queue path: SSE bridge losslessly forwards BullMQ job events ──
      await enqueueBuild({
        prompt: ctx.prompt,
        chatId: ctx.chatId,
        userId: ctx.userId,
        groqKey: ctx.keys.groqKey,
        openrouterKey: ctx.keys.openrouterKey,
        onEvent: (event) => sse(res, event as Record<string, unknown>),
      });
    } else {
      // ── Inline path: used in tests and when queue is unavailable ──
      await runBuildPipeline(
        { prompt: ctx.prompt, chatId: ctx.chatId, keys: ctx.keys },
        res,
      );
    }

    const durationMs = Date.now() - start;
    log.info("ORCHESTRATOR_BUILD_DONE", { buildId: ctx.buildId, durationMs });
    return { success: true, strategy: "full-build", durationMs };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - start;

    log.error("ORCHESTRATOR_BUILD_ERROR", { buildId: ctx.buildId, error, durationMs });

    sse(res, { type: "error", error });

    return { success: false, strategy: "full-build", durationMs, error };
  }
}

/**
 * Emit a named progress event to the SSE stream without containing any
 * business logic.  Steps call this when they want to update orchestrator-level
 * state (e.g. retry countdown, queue position).
 */
export function emitOrchestratorEvent(
  res: Response,
  event: Record<string, unknown>,
): void {
  sse(res, { source: "orchestrator", ...event });
}
