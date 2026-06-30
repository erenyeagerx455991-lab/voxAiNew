/**
 * V8.0 — Edit Agent
 *
 * Extracted from routes/agents.ts.  Executes the 5-step surgical edit pipeline:
 *   Step 0: Intent Detection
 *   Step 1: File Resolution (KG-aware)
 *   Step 2: Patch Generation (locked-component-safe, up to 3 attempts)
 *   Step 3: Quality Gate
 *   Step 4: Merge Engine
 *
 * The Express route handler owns SSE headers; this module owns the logic.
 */

import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { callAI } from "../llm/aiService.js";
import { EDIT_SYSTEM, INTENT_SYSTEM } from "../llm/prompts.js";
import {
  buildMinimalEditContext,
  compressProjectMemory,
  truncateForGroq,
  estimateTokenCount,
  logCompressionReport,
  GROQ_TOKEN_BUDGET,
} from "../../contextManager.js";
import {
  resolveAffectedFiles,
  validateEditFiles,
  extractEditFiles,
  extractDeletedPaths,
  mergeProjectFiles,
} from "../context/editHelpers.js";
import { resolveEditTargetsServer } from "../knowledge/knowledgeGraph.js";
import type { ProjectFileSSE, ServerKnowledgeGraph } from "../types.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("EditAgent");

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EditAgentInput {
  prompt: string;
  projectFiles: ProjectFileSSE[];
  projectMemory?: Record<string, unknown>;
  componentRegistry?: Record<string, string>;
  themeTokens?: Record<string, unknown>;
  knowledgeGraph?: ServerKnowledgeGraph;
  lockedComponents: string[];
  registryFileMap: Record<string, string[]>;
  openrouterKey: string;
}

export interface EditAgentResult {
  mergedFiles: ProjectFileSSE[];
  diff: {
    changedFiles: string[];
    createdFiles: string[];
    deletedFiles: string[];
  };
  intentResult: {
    editType: string;
    targetFiles: string[];
    newFiles: string[];
    reason: string;
  };
  qualityScore: number;
  editSafetyScore: number;
}

// ── Locked-Component System Builder ──────────────────────────────────────────

export function buildEditSystem(
  lockedComponents: string[],
  isRetry = false,
  prevViolations = "",
): string {
  if (lockedComponents.length === 0) return EDIT_SYSTEM;

  const lockedList = lockedComponents.map((c) => `  • ${c.toUpperCase()}`).join("\n");
  const violationNote = prevViolations
    ? `\nPREVIOUS ATTEMPT INCORRECTLY MODIFIED: ${prevViolations}\nDo NOT output FILE blocks for these.`
    : "";
  const strictNote = isRetry
    ? "\nFINAL WARNING — any locked file output causes complete edit rejection."
    : "";

  return (
    EDIT_SYSTEM +
    `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT LOCK ENFORCEMENT (V5.5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LOCKED SECTIONS — DO NOT TOUCH:
${lockedList}
${violationNote}
ABSOLUTE RULES:
1. DO NOT output a FILE block for any file that belongs to a locked section
2. DO NOT refactor, rename, or restructure locked component files
3. If the edit request targets a locked section, edit around it instead
4. Only unlocked sections may appear in your output${strictNote}

These rules override all other instructions. Violation = failed edit.`
  );
}

// ── Edit Impact Analyser ──────────────────────────────────────────────────────

export function analyzeEditImpact(
  prompt: string,
  registryFileMap: Record<string, string[]>,
  lockedComponents: string[],
): {
  affectedSections: string[];
  affectedFiles: string[];
  lockedConflicts: string[];
  replacementMode: string | null;
} {
  const p = prompt.toLowerCase();
  const SECTION_KEYWORDS: Record<string, string[]> = {
    hero:         ["hero", "headline", "banner", "above the fold", "main heading"],
    pricing:      ["pricing", "price", "plan", "billing", "subscription", "yearly", "monthly", "tier"],
    navbar:       ["navbar", "nav bar", "navigation menu", "top menu", "header nav"],
    features:     ["feature", "benefit", "what we offer", "capability", "functionality"],
    faq:          ["faq", "frequently asked", "question"],
    testimonials: ["testimonial", "review", "social proof", "customer quote"],
    cta:          ["call to action", " cta", "get started button", "sign up button"],
    footer:       ["footer", "bottom section", "bottom of page"],
    dashboard:    ["dashboard", "analytics page", "metrics page", "stats page"],
    auth:         ["login page", "signup page", "auth page", "sign in page"],
  };

  const replaceMatch = /\breplace\s+(?:the\s+)?(\w+)/i.exec(prompt);
  const replacementMode = replaceMatch ? replaceMatch[1]!.toLowerCase() : null;

  const affectedSections: string[] = [];
  const affectedFiles: string[] = [];

  for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (keywords.some((kw) => p.includes(kw))) {
      affectedSections.push(section);
      affectedFiles.push(...(registryFileMap[section] ?? []));
    }
  }

  if (replacementMode && !affectedSections.includes(replacementMode)) {
    affectedSections.push(replacementMode);
  }

  const lockedConflicts = affectedSections.filter((s) => lockedComponents.includes(s));

  return {
    affectedSections,
    affectedFiles: [...new Set(affectedFiles)],
    lockedConflicts,
    replacementMode,
  };
}

// ── Main Execute Function ─────────────────────────────────────────────────────

export async function executeEdit(
  input: EditAgentInput,
  res: Response,
): Promise<EditAgentResult> {
  const {
    prompt,
    projectFiles,
    projectMemory,
    componentRegistry,
    themeTokens,
    knowledgeGraph,
    lockedComponents,
    registryFileMap,
    openrouterKey,
  } = input;

  // ── STEP 0: Intent Detection ────────────────────────────────────────────────
  sse(res, { type: "step", step: 0, agent: "Intent Detector", status: "active" });

  const fileList = projectFiles.map((f) => f.path + f.name).join("\n");
  let intentResult = {
    editType: "component",
    targetFiles: [] as string[],
    newFiles: [] as string[],
    reason: prompt,
  };

  try {
    const { system: intentSys, user: intentUser } = truncateForGroq(
      INTENT_SYSTEM,
      `PROJECT FILES:\n${fileList}\n\nEDIT REQUEST: ${prompt}`,
      600,
    );
    const intentRaw = await callAI(
      openrouterKey,
      [
        { role: "system", content: intentSys },
        { role: "user", content: intentUser },
      ],
      { label: "edit-intent", maxTokens: 600 },
    );
    const parsed = JSON.parse(intentRaw.replace(/```json\n?|\n?```/g, "").trim());
    intentResult = { ...intentResult, ...parsed };
  } catch {
    /* keep defaults */
  }

  sse(res, { type: "intent_detected", ...intentResult });
  sse(res, { type: "step", step: 0, agent: "Intent Detector", status: "done" });

  // ── Edit Impact Analysis ────────────────────────────────────────────────────
  const editImpact = analyzeEditImpact(prompt, registryFileMap, lockedComponents);
  sse(res, {
    type: "edit_impact",
    affectedSections: editImpact.affectedSections,
    affectedFiles: editImpact.affectedFiles,
    lockedConflicts: editImpact.lockedConflicts,
    replacementMode: editImpact.replacementMode,
  });
  if (editImpact.lockedConflicts.length > 0) {
    log.info("EDIT_LOCKED_CONFLICTS", { conflicts: editImpact.lockedConflicts });
  }

  // ── STEP 1: File Resolution ─────────────────────────────────────────────────
  sse(res, { type: "step", step: 1, agent: "File Resolver", status: "active" });

  const depGraph = (projectMemory?.dependencyGraph as Record<string, string[]>) ?? {};
  const resolvedFiles = resolveAffectedFiles(intentResult.targetFiles, depGraph, projectFiles);

  if (knowledgeGraph && knowledgeGraph.components.length > 0) {
    const graphResolution = resolveEditTargetsServer(knowledgeGraph, prompt, projectFiles);
    if (graphResolution.resolved && graphResolution.targetFiles.length > 0) {
      const graphFiles = graphResolution.targetFiles.map((f) => f.path + f.name);
      sse(res, {
        type: "graph_context",
        filesLoaded: graphResolution.filesLoaded,
        filesSkipped: graphResolution.filesSkipped,
        tokensSaved: graphResolution.tokensSaved,
        resolvedNodes: graphResolution.graphNodes,
      });
      log.info("KNOWLEDGE_GRAPH_EDIT_CONTEXT", {
        filesLoaded: graphResolution.filesLoaded,
        tokensSaved: graphResolution.tokensSaved,
      });
      for (const gf of graphFiles) {
        if (!intentResult.targetFiles.includes(gf)) intentResult.targetFiles.push(gf);
      }
    }
  }

  sse(res, { type: "file_targets", files: resolvedFiles, originalTargets: intentResult.targetFiles });
  sse(res, { type: "step", step: 1, agent: "File Resolver", status: "done" });

  // ── Locked Component Enforcement ────────────────────────────────────────────
  const lockedFilePaths = new Set<string>();
  for (const cat of lockedComponents) {
    for (const fp of registryFileMap[cat] ?? []) lockedFilePaths.add(fp);
  }

  const filteredResolvedFiles =
    lockedFilePaths.size > 0
      ? resolvedFiles.filter((fp) => !lockedFilePaths.has(fp))
      : resolvedFiles;

  if (filteredResolvedFiles.length < resolvedFiles.length) {
    const excluded = resolvedFiles.filter((fp) => lockedFilePaths.has(fp));
    sse(res, { type: "locked_excluded", excluded, preservedCategories: lockedComponents });
    log.info("EDIT_LOCKED_EXCLUDED", { excluded: excluded.length, categories: lockedComponents });
  }

  // ── STEP 2: Patch Generation ────────────────────────────────────────────────
  sse(res, { type: "step", step: 2, agent: "Patch Generator", status: "active" });

  const EDIT_RESPONSE_TOKENS = 4_000;
  const sysTokens = estimateTokenCount(EDIT_SYSTEM);
  const fileContextBudget = GROQ_TOKEN_BUDGET - EDIT_RESPONSE_TOKENS - sysTokens - 400;
  const compressedMem = projectMemory ? compressProjectMemory(projectMemory) : null;

  const projectSummary = compressedMem
    ? `Project: ${compressedMem["projectType"] || "App"} | Pages: ${((compressedMem["pages"] as string[]) || []).join(", ")} | Entities: ${((compressedMem["entities"] as string[]) || []).join(", ")}\n`
    : `Files: ${projectFiles.map((f) => f.path + f.name).join(", ")}\n`;

  const designCtx = themeTokens
    ? `\nDesign tokens (PRESERVE): primary=${(themeTokens as Record<string, string>)["primary"]}, surface=${(themeTokens as Record<string, string>)["surface"]}, isDark=${(themeTokens as Record<string, string>)["isDark"]}`
    : "";

  const registryCtx =
    componentRegistry && Object.keys(componentRegistry).length > 0
      ? `\nComponents: ${Object.keys(componentRegistry).slice(0, 20).join(", ")}`
      : "";

  let modifiedFiles: ProjectFileSSE[] = [];
  let deletedPaths: string[] = [];
  let qualityResult: ReturnType<typeof validateEditFiles> = {
    score: 0,
    passed: false,
    issues: [],
    warnings: [],
  };

  for (let diffAttempt = 0; diffAttempt < 3; diffAttempt++) {
    const prevViolations =
      diffAttempt > 0
        ? modifiedFiles
            .filter((f) => lockedFilePaths.has(f.path + f.name))
            .map((f) => f.name)
            .join(", ")
        : "";
    const dynamicEditSystem = buildEditSystem(lockedComponents, diffAttempt > 0, prevViolations);

    const allTargets = [...filteredResolvedFiles, ...(intentResult.newFiles ?? []), "App.tsx"];
    const { context: fileContext, meta: ctxMeta } = buildMinimalEditContext(
      projectFiles,
      allTargets,
      fileContextBudget,
    );
    if (diffAttempt === 0) logCompressionReport("EditPatch", ctxMeta);

    const userMessageRaw = `${projectSummary}${designCtx}${registryCtx}
EDIT REQUEST: ${prompt}
INTENT: ${intentResult.editType} — ${intentResult.reason}
TARGET FILES: ${filteredResolvedFiles.join(", ")}${intentResult.newFiles?.length ? `\nNEW FILES: ${intentResult.newFiles.join(", ")}` : ""}
ALL PROJECT FILES (do not modify unless listed above): ${projectFiles.map((f) => f.path + f.name).join(", ")}

CURRENT FILE CONTEXT:
${fileContext}`;

    const { system: editSystem, user: userMessage, truncated: wasTruncated } = truncateForGroq(
      dynamicEditSystem,
      userMessageRaw,
      EDIT_RESPONSE_TOKENS,
    );

    if (wasTruncated && diffAttempt === 0) {
      log.warn("EDIT_CONTEXT_TRUNCATED", { attempt: diffAttempt });
      sse(res, { type: "debug", message: "context_compressed" });
    }

    const editRaw = await callAI(
      openrouterKey,
      [
        { role: "system", content: editSystem },
        { role: "user", content: userMessage },
      ],
      { label: "edit-patch", maxTokens: EDIT_RESPONSE_TOKENS },
    );

    modifiedFiles = extractEditFiles(editRaw);
    deletedPaths = extractDeletedPaths(editRaw);
    qualityResult = validateEditFiles(modifiedFiles, projectFiles, filteredResolvedFiles);

    if (lockedFilePaths.size > 0) {
      const violations = modifiedFiles.filter((f) => lockedFilePaths.has(f.path + f.name));
      if (violations.length > 0 && diffAttempt < 2) {
        sse(res, {
          type: "locked_protection",
          retryAttempt: diffAttempt + 1,
          violations: violations.map((f) => f.path + f.name),
        });
        log.warn("EDIT_LOCKED_VIOLATION_RETRY", {
          attempt: diffAttempt + 1,
          violations: violations.map((f) => f.name),
        });
        continue;
      }
      modifiedFiles = modifiedFiles.filter((f) => !lockedFilePaths.has(f.path + f.name));
      deletedPaths = deletedPaths.filter((fp) => !lockedFilePaths.has(fp));
    }
    break;
  }

  sse(res, { type: "step", step: 2, agent: "Patch Generator", status: "done" });

  // ── STEP 3: Quality Gate ────────────────────────────────────────────────────
  sse(res, { type: "step", step: 3, agent: "Quality Gate", status: "active" });
  log.info("EDIT_AGENT_DONE", {
    modified: modifiedFiles.length,
    deleted: deletedPaths.length,
    quality: qualityResult.score,
  });
  sse(res, { type: "quality_check", ...qualityResult });
  sse(res, {
    type: "step",
    step: 3,
    agent: "Quality Gate",
    status: qualityResult.passed ? "done" : "warn",
  });

  // ── STEP 4: Merge Engine ────────────────────────────────────────────────────
  sse(res, { type: "step", step: 4, agent: "Merge Engine", status: "active" });

  const mergedFiles = mergeProjectFiles(projectFiles, modifiedFiles, deletedPaths);
  const existingPaths = new Set(projectFiles.map((f) => f.path + f.name));
  const diff = {
    changedFiles: modifiedFiles
      .filter((f) => existingPaths.has(f.path + f.name))
      .map((f) => f.path + f.name),
    createdFiles: modifiedFiles
      .filter((f) => !existingPaths.has(f.path + f.name))
      .map((f) => f.path + f.name),
    deletedFiles: deletedPaths,
  };

  // Registry Health V2
  const preservedComponents = lockedComponents.filter((cat) => {
    const catFiles = registryFileMap[cat] ?? [];
    return (
      catFiles.length > 0 &&
      catFiles.every((fp) => !diff.changedFiles.includes(fp) && !diff.deletedFiles.includes(fp))
    );
  });
  const replacedComponents = lockedComponents.filter((cat) => {
    const catFiles = registryFileMap[cat] ?? [];
    return catFiles.some((fp) => diff.changedFiles.includes(fp));
  });
  const editSafetyScore =
    lockedComponents.length > 0
      ? Math.round((preservedComponents.length / lockedComponents.length) * 100)
      : 100;

  sse(res, {
    type: "registry_health_v2",
    registryCoverage: Object.keys(registryFileMap).length,
    lockedComponents: lockedComponents.length,
    preservedComponents: preservedComponents.length,
    replacedComponents: replacedComponents.length,
    editSafetyScore,
    preservedList: preservedComponents,
    replacedList: replacedComponents,
    modifiedSections: diff.changedFiles
      .map((fp) => {
        for (const [cat, files] of Object.entries(registryFileMap)) {
          if (files.includes(fp)) return cat;
        }
        return null;
      })
      .filter(Boolean),
  });

  log.info("EDIT_REGISTRY_HEALTH_V2", {
    safety: editSafetyScore,
    preserved: preservedComponents.length,
    replaced: replacedComponents.length,
  });

  sse(res, {
    type: "edit_identified",
    modifiedCount: modifiedFiles.length,
    deletedCount: deletedPaths.length,
    files: modifiedFiles.map((f) => f.path + f.name),
  });

  sse(res, { type: "step", step: 4, agent: "Merge Engine", status: "done" });

  sse(res, { type: "edit_done", files: mergedFiles, diff, intentResult });

  return {
    mergedFiles,
    diff,
    intentResult,
    qualityScore: qualityResult.score,
    editSafetyScore,
  };
}
