/**
 * V8.0 — Runtime Repair Agent
 *
 * Extracted from routes/agents.ts.  Implements the 6.1 self-healing loop:
 *   1. Classify the runtime error (9 categories)
 *   2. Resolve affected files via Knowledge Graph
 *   3. Repair loop (up to maxLoopAttempts passes)
 *   4. Quality gate (score ≥ 80)
 *   5. Record repair history in runtimeManager
 *
 * The Express route handler owns SSE headers; this module owns the logic.
 */

import type { Response } from "express";
import { sse } from "../agents/streaming/sseManager.js";
import { callAI } from "../agents/llm/aiService.js";
import { classifyRuntimeError, REPAIR_PROMPTS } from "./repairStrategies.js";
import * as runtimeManager from "./runtimeManager.js";
import { validateFiles, computeRepairQuality } from "./runtimeValidator.js";
import type { ProjectFileSSE } from "../agents/types.js";
import { createLogger } from "../lib/structuredLogger.js";

const log = createLogger("RuntimeRepairAgent");

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RuntimeRepairInput {
  files: ProjectFileSSE[];
  error: {
    file: string;
    message: string;
    stack?: string;
    component?: string;
  };
  repairAttempt: number;
  knowledgeGraph?: Record<string, unknown>;
  lockedComponents: string[];
  chatId?: string;
  openrouterKey: string;
}

export interface RuntimeRepairResult {
  files: ProjectFileSSE[];
  repaired: boolean;
  repairedFile: string;
  category: string;
  qualityScore: number;
  durationMs: number;
}

// ── File Resolution ───────────────────────────────────────────────────────────

export function resolveAffectedFilesFromGraph(
  error: { file: string; message: string },
  files: ProjectFileSSE[],
  knowledgeGraph?: Record<string, unknown>,
): string[] {
  const result: string[] = [];

  const directFile = files.find(
    (f) =>
      f.name === error.file ||
      (f.path + f.name).includes(error.file) ||
      (error.file && error.file.includes(f.name)),
  );
  if (directFile) result.push(directFile.path + directFile.name);

  if (knowledgeGraph && directFile) {
    const baseName = directFile.name.replace(/\.(tsx?|jsx?)$/, "");
    const components = (knowledgeGraph["components"] as Array<{ name: string; file: string; usedBy?: string[] }>) ?? [];
    const usedBy = components
      .filter((c) => c.name === baseName || (c.usedBy ?? []).includes(baseName))
      .flatMap((c) => [c.file, ...(c.usedBy ?? [])]);

    for (const fp of usedBy) {
      const f = files.find((fi) => fi.path + fi.name === fp || fi.name === fp);
      if (f && !result.includes(f.path + f.name)) result.push(f.path + f.name);
    }
  }

  // Fallback to App.tsx
  if (result.length === 0) {
    const appFile = files.find((f) => f.name === "App.tsx");
    if (appFile) result.push(appFile.path + appFile.name);
  }

  return result;
}

// ── Main Execute Function ─────────────────────────────────────────────────────

const REPAIR_SYSTEM = `You are NexoGen Runtime Repair Agent V6.1 — precision surgical code repair.

MANDATORY SAFE CODING RULES:
- Replace arr.map(…) with (Array.isArray(arr) ? arr : []).map(…)
- Replace obj.prop with obj?.prop for all nullable access
- Replace useState() with typed defaults: useState([]), useState({}), useState(null)
- Add prop defaults: function Comp({ items = [], title = '' })
- NEVER call hooks conditionally or inside loops

Return ONLY the complete corrected file. No markdown, no explanation, no truncation.`;

export async function executeRuntimeRepair(
  input: RuntimeRepairInput,
  res: Response,
): Promise<RuntimeRepairResult> {
  const {
    files,
    error,
    repairAttempt,
    knowledgeGraph,
    lockedComponents,
    chatId,
    openrouterKey,
  } = input;

  const startTime = Date.now();
  const maxLoopAttempts = 3 - repairAttempt;

  sse(res, {
    type: "repair_start",
    attempt: repairAttempt + 1,
    maxAttempts: 3,
    errorMessage: error.message?.slice(0, 200) ?? "Unknown error",
  });

  // Classify error
  const classified = classifyRuntimeError(error);
  sse(res, {
    type: "repair_classify",
    category: classified.category,
    confidence: classified.confidence,
    hint: classified.hint,
  });
  log.info("RUNTIME_REPAIR_CLASSIFY", {
    category: classified.category,
    confidence: classified.confidence,
  });

  const allAffected = resolveAffectedFilesFromGraph(
    error,
    files,
    knowledgeGraph as Record<string, unknown> | undefined,
  );

  // Enforce locked components
  const lockedFilePaths = new Set<string>();
  for (const cat of lockedComponents) {
    const catLower = cat.toLowerCase();
    for (const f of files) {
      const fp = f.path + f.name;
      if (
        f.name.toLowerCase().includes(catLower) ||
        fp.toLowerCase().includes(catLower)
      ) {
        lockedFilePaths.add(fp);
      }
    }
  }

  const safeAffected = allAffected.filter((fp) => !lockedFilePaths.has(fp));
  sse(res, {
    type: "repair_targets",
    affectedFiles: safeAffected,
    totalResolved: allAffected.length,
    skippedLocked: allAffected.length - safeAffected.length,
  });
  log.info("RUNTIME_REPAIR_TARGETS", {
    targets: safeAffected.length,
    lockedSkipped: lockedFilePaths.size,
  });

  let currentFiles = [...files];
  let repairedSuccessfully = false;
  let lastRepairedFile = "";
  let lastQualityScore = 0;
  const repairStrategy = REPAIR_PROMPTS[classified.category];

  for (let loop = 0; loop < maxLoopAttempts && !repairedSuccessfully; loop++) {
    const attemptNumber = repairAttempt + loop + 1;

    sse(res, {
      type: "repair_generate",
      attempt: attemptNumber,
      category: classified.category,
      strategy: classified.hint ?? "",
    });

    const failingFile =
      currentFiles.find(
        (f) =>
          f.name === error.file ||
          (f.path + f.name).includes(error.file) ||
          (error.file && error.file.includes(f.name)),
      ) ?? currentFiles.find((f) => f.name === "App.tsx");

    if (!failingFile) {
      sse(res, {
        type: "repair_failed",
        reason: `File "${error.file}" not found`,
        attempt: attemptNumber,
      });
      break;
    }

    if (lockedFilePaths.has(failingFile.path + failingFile.name)) {
      sse(res, {
        type: "repair_failed",
        reason: `"${failingFile.name}" is locked`,
        attempt: attemptNumber,
      });
      break;
    }

    const depContext = currentFiles
      .filter(
        (f) =>
          (f.lang === "tsx" || f.lang === "ts") &&
          f !== failingFile &&
          (safeAffected.includes(f.path + f.name) || f.name === "App.tsx"),
      )
      .slice(0, 3)
      .map((f) => `// ${f.path}${f.name}\n${f.content.slice(0, 500)}`)
      .join("\n\n");

    const repairSystem = `${REPAIR_SYSTEM}
Error Category: ${classified.category.toUpperCase()} (attempt ${loop + 1}/${maxLoopAttempts})

REPAIR STRATEGY:
${repairStrategy}`;

    const repairPrompt = `Error (${classified.category}): "${error.message}"
${error.stack ? `Stack: ${error.stack.slice(0, 500)}` : ""}
${error.component ? `Component: ${error.component.slice(0, 200)}` : ""}

FILE TO REPAIR (${failingFile.name}):
${failingFile.content}
${depContext ? `\nCONTEXT FILES:\n${depContext}` : ""}

Return the complete repaired file:`;

    const repairedRaw = await callAI(
      openrouterKey,
      [
        { role: "system", content: repairSystem },
        { role: "user", content: repairPrompt },
      ],
      { label: "runtime-repair", maxTokens: 3000 },
    );

    sse(res, { type: "repair_apply", attempt: attemptNumber, file: failingFile.name });

    if (repairedRaw && repairedRaw.trim().length > 80) {
      const cleaned = repairedRaw
        .replace(/^```[a-z]*\r?\n?/im, "")
        .replace(/\r?\n?```$/m, "")
        .trim();

      currentFiles = currentFiles.map((f) =>
        f === failingFile ? { ...f, content: cleaned } : f,
      );
      lastRepairedFile = failingFile.name;

      const qualityScore = computeRepairQuality(
        cleaned,
        failingFile.content,
        classified.category,
      );
      lastQualityScore = qualityScore;

      sse(res, {
        type: "repair_validate",
        score: qualityScore,
        passed: qualityScore >= 80,
        attempt: attemptNumber,
        file: failingFile.name,
        checks: {
          hasCode:
            cleaned.includes("function") ||
            cleaned.includes("const") ||
            cleaned.includes("=>"),
          noMarkdown: !cleaned.includes("```"),
          hasReturn: cleaned.includes("return"),
          sizeRatio: Math.round(
            (cleaned.length / Math.max(1, failingFile.content.length)) * 100,
          ),
        },
      });
      log.info("RUNTIME_REPAIR_ATTEMPT", {
        attempt: attemptNumber,
        quality: qualityScore,
        file: failingFile.name,
      });

      if (qualityScore >= 80) {
        repairedSuccessfully = true;
        sse(res, {
          type: "repair_success",
          attempt: attemptNumber,
          file: failingFile.name,
          score: qualityScore,
          duration: Date.now() - startTime,
          category: classified.category,
        });
      } else {
        sse(res, {
          type: "repair_failed",
          reason: `Quality score ${qualityScore} below 80 threshold`,
          attempt: attemptNumber,
        });
      }
    } else {
      sse(res, {
        type: "repair_failed",
        reason: "Repair agent returned insufficient output",
        attempt: attemptNumber,
      });
    }
  }

  // Record repair history
  if (chatId) {
    runtimeManager.addRepairRecord(chatId, {
      id: `repair-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: startTime,
      errorType: classified.category,
      errorMessage: (error.message ?? "").slice(0, 200),
      filesChanged: repairedSuccessfully ? [lastRepairedFile] : [],
      attempt: repairAttempt + 1,
      success: repairedSuccessfully,
      qualityScore: lastQualityScore,
      duration: Date.now() - startTime,
    });
  }

  const repairMetrics = chatId ? runtimeManager.getRepairMetrics(chatId) : null;
  const durationMs = Date.now() - startTime;

  sse(res, {
    type: "repair_complete",
    repaired: repairedSuccessfully,
    totalAttempts: repairAttempt + 1,
    category: classified.category,
    file: lastRepairedFile,
    qualityScore: lastQualityScore,
    duration: durationMs,
    metrics: repairMetrics,
  });

  sse(res, {
    type: "runtime_repair_done",
    files: currentFiles,
    repaired: repairedSuccessfully,
    repairedFile: lastRepairedFile,
    category: classified.category,
    qualityScore: lastQualityScore,
    message: repairedSuccessfully
      ? `Repaired ${lastRepairedFile} (quality: ${lastQualityScore})`
      : "Repair unsuccessful after all attempts",
  });

  return {
    files: currentFiles,
    repaired: repairedSuccessfully,
    repairedFile: lastRepairedFile,
    category: classified.category,
    qualityScore: lastQualityScore,
    durationMs,
  };
}
