/**
 * V8.0 — Agents Router (thin HTTP adapter)
 *
 * This file is intentionally minimal.  Each route:
 *   1. Validates the request (auth, rate limits, budget)
 *   2. Sets SSE headers
 *   3. Delegates to the appropriate agent module
 *   4. Closes the response
 *
 * All business logic lives in:
 *   src/orchestrator/     — AI Orchestrator + Tool Router
 *   src/agents/edit/      — Edit Agent
 *   src/agents/audit/     — Audit Agent
 *   src/runtime/          — Runtime Repair Agent + Autonomous Build
 */

import { Router } from "express";
import { strToU8, zipSync } from "fflate";

// ── Orchestration ─────────────────────────────────────────────────────────────
import { orchestrateBuild } from "../orchestrator/orchestrator.js";
import { createBuildContext } from "../context/contextBuilder.js";

// ── Agent Modules ─────────────────────────────────────────────────────────────
import { executeEdit } from "../agents/edit/editAgent.js";
import { executeAudit } from "../agents/audit/auditAgent.js";
import { executeRuntimeRepair } from "../runtime/runtimeRepairAgent.js";

// ── Autonomous Build ──────────────────────────────────────────────────────────
import { callAI } from "../agents/llm/aiService.js";
import { validateFiles } from "../runtime/runtimeValidator.js";
import * as runtimeManager from "../runtime/runtimeManager.js";
import {
  buildRuntimeDependencyGraph,
  resolveImports,
  resolveComponents,
  resolveRoutes,
  resolvePackages,
} from "../runtime/dependencyResolverV2.js";

// ── Template Endpoints ────────────────────────────────────────────────────────
import {
  TEMPLATE_LIBRARY_SERVER,
  TEMPLATE_MATCH_KEYWORDS,
  serverMatchTemplate,
  buildTemplateContextServer,
} from "../agents/templates/templateAgent.js";

// ── Infrastructure ────────────────────────────────────────────────────────────
import { sse } from "../agents/streaming/sseManager.js";
import { checkBuildLimit, extractUserId, recordBuildStarted, recordBuildCompleted } from "../limits/userLimits.js";
import { checkTokenBudget } from "../cost/tokenBudget.js";
import { createLogger } from "../lib/structuredLogger.js";
import type { ProjectFileSSE, ServerKnowledgeGraph } from "../agents/types.js";

const log = createLogger("AgentsRoute");
const router: Router = Router();

// ── Shared guard helpers ───────────────────────────────────────────────────────

function guardLimits(req: Parameters<typeof extractUserId>[0], res: Parameters<typeof sse>[0]): string | null {
  const userId = extractUserId(req);
  const limitCheck = checkBuildLimit(userId);
  if (!limitCheck.allowed) { res.status(429).json({ error: limitCheck.reason }); return null; }
  const budgetCheck = checkTokenBudget();
  if (!budgetCheck.allowed) { res.status(503).json({ error: budgetCheck.reason }); return null; }
  return userId;
}

function openSse(res: Parameters<typeof sse>[0]): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

// ── POST /agents/build ────────────────────────────────────────────────────────

router.post("/agents/build", async (req, res) => {
  const openrouterKey = process.env["OPENROUTER_API_KEY"];
  if (!openrouterKey) { res.status(500).json({ error: "OPENROUTER_API_KEY not set" }); return; }

  const { prompt, chatId: reqChatId } = req.body as { prompt: string; chatId?: string };
  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }

  const userId = extractUserId(req);
  const limitCheck = checkBuildLimit(userId);
  if (!limitCheck.allowed) { res.status(429).json({ error: limitCheck.reason }); return; }
  const budgetCheck = checkTokenBudget();
  if (!budgetCheck.allowed) { res.status(503).json({ error: budgetCheck.reason }); return; }

  const chatId = reqChatId ?? `build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ctx = createBuildContext({ prompt, chatId, userId, keys: { openrouterKey, groqKey: "" } });

  recordBuildStarted(userId);
  openSse(res);

  try {
    await orchestrateBuild(ctx, res);
  } finally {
    recordBuildCompleted(userId);
    res.end();
  }
});

// ── POST /agents/audit ────────────────────────────────────────────────────────

router.post("/agents/audit", async (req, res) => {
  const openrouterKey = process.env["OPENROUTER_API_KEY"];
  if (!openrouterKey) { res.status(500).json({ error: "OPENROUTER_API_KEY not set" }); return; }

  const { prompt } = req.body as { prompt: string };
  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }

  try {
    const report = await executeAudit({ prompt, openrouterKey });
    res.json(report);
  } catch (e: unknown) {
    const err = e as Error;
    log.error("AUDIT_ROUTE_ERROR", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ── POST /agents/export ───────────────────────────────────────────────────────

router.post("/agents/export", (req, res) => {
  try {
    const { files, projectName = "nexogen-project" } = req.body as {
      files: Array<{ path: string; name: string; content: string }>;
      projectName?: string;
    };
    if (!files || files.length === 0) { res.status(400).json({ error: "No files provided" }); return; }

    const safeName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const zipData: Record<string, Uint8Array> = {};
    for (const file of files) {
      const key = `${safeName}/${file.path || ""}${file.name}`.replace(/\/\//g, "/");
      zipData[key] = strToU8(file.content || "");
    }

    const zipped = zipSync(zipData, { level: 6 });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.zip"`);
    res.send(Buffer.from(zipped));
  } catch (e: unknown) {
    const err = e as Error;
    log.error("EXPORT_ZIP_ERROR", { error: String(err) });
    res.status(500).json({ error: err.message });
  }
});

// ── POST /agents/edit ─────────────────────────────────────────────────────────

router.post("/agents/edit", async (req, res) => {
  const userId = guardLimits(req, res);
  if (!userId) return;

  const openrouterKey = process.env["OPENROUTER_API_KEY"];
  if (!openrouterKey) { res.status(500).json({ error: "OPENROUTER_API_KEY not set" }); return; }

  const {
    prompt,
    projectFiles = [],
    projectMemory,
    componentRegistry,
    themeTokens,
    knowledgeGraph,
    lockedComponents = [],
    registryFileMap = {},
  } = req.body as {
    prompt: string;
    projectFiles: ProjectFileSSE[];
    projectMemory?: Record<string, unknown>;
    componentRegistry?: Record<string, string>;
    themeTokens?: Record<string, unknown>;
    knowledgeGraph?: ServerKnowledgeGraph;
    lockedComponents?: string[];
    registryFileMap?: Record<string, string[]>;
  };

  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }

  recordBuildStarted(userId);
  openSse(res);

  try {
    await executeEdit(
      {
        prompt,
        projectFiles,
        projectMemory,
        componentRegistry,
        themeTokens,
        knowledgeGraph,
        lockedComponents,
        registryFileMap,
        openrouterKey,
      },
      res,
    );
  } catch (e: unknown) {
    const err = e as Error;
    log.error("EDIT_AGENT_ERROR", { error: String(err) });
    sse(res, { type: "error", error: err.message });
  } finally {
    recordBuildCompleted(userId);
    res.end();
  }
});

// ── POST /agents/runtime-repair ───────────────────────────────────────────────

router.post("/agents/runtime-repair", async (req, res) => {
  const userId = guardLimits(req, res);
  if (!userId) return;

  const openrouterKey = process.env["OPENROUTER_API_KEY"];
  if (!openrouterKey) { res.status(500).json({ error: "OPENROUTER_API_KEY not set" }); return; }

  const {
    files,
    error,
    repairAttempt = 0,
    knowledgeGraph,
    lockedComponents = [],
    chatId,
  } = req.body as {
    files: ProjectFileSSE[];
    error: { file: string; message: string; stack?: string; component?: string };
    repairAttempt: number;
    knowledgeGraph?: unknown;
    lockedComponents?: string[];
    chatId?: string;
  };

  if (!files || !error) { res.status(400).json({ error: "files and error required" }); return; }

  if (repairAttempt >= 3) {
    res.status(200).json({ files, repaired: false, message: "Max repair attempts (3) reached" });
    return;
  }

  recordBuildStarted(userId);
  openSse(res);

  try {
    await executeRuntimeRepair(
      {
        files,
        error,
        repairAttempt,
        knowledgeGraph: knowledgeGraph as Record<string, unknown> | undefined,
        lockedComponents,
        chatId,
        openrouterKey,
      },
      res,
    );
  } catch (e: unknown) {
    const err = e as Error;
    log.error("RUNTIME_REPAIR_ERROR", { error: String(err) });
    sse(res, { type: "error", error: err.message ?? "Runtime repair failed" });
  } finally {
    recordBuildCompleted(userId);
    res.end();
  }
});

// ── GET /agents/repair-history/:chatId ────────────────────────────────────────

router.get("/agents/repair-history/:chatId", (req, res) => {
  const { chatId } = req.params;
  const history  = runtimeManager.getRepairHistory(chatId!);
  const metrics  = runtimeManager.getRepairMetrics(chatId!);
  const healthV2 = runtimeManager.computeHealthV2(runtimeManager.getState(chatId!));
  res.json({ history, metrics, healthV2 });
});

// ── Template Marketplace ──────────────────────────────────────────────────────

router.get("/agents/templates", (_req, res) => {
  res.json({ templates: TEMPLATE_LIBRARY_SERVER });
});

router.get("/agents/templates/:id", (req, res) => {
  const template = TEMPLATE_LIBRARY_SERVER.find((t) => t.id === req.params["id"]);
  if (!template) { res.status(404).json({ error: "Template not found" }); return; }
  res.json({ template });
});

router.post("/agents/templates/match", (req, res) => {
  const { prompt } = req.body as { prompt: string };
  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }
  const result = serverMatchTemplate(prompt);
  const allResults = TEMPLATE_LIBRARY_SERVER.map((t) => {
    const lower = prompt.toLowerCase();
    let score = 0;
    for (const kw of TEMPLATE_MATCH_KEYWORDS[t.id] ?? []) {
      if (lower.includes(kw)) score += kw.split(" ").length > 1 ? 20 : 10;
    }
    return { templateId: t.id, confidence: Math.min(99, Math.max(10, 50 + score * 3)), template: t };
  }).sort((a, b) => b.confidence - a.confidence);
  res.json({ best: result, all: allResults });
});

router.post("/agents/templates/preview", (req, res) => {
  const { templateId } = req.body as { templateId: string };
  const template = TEMPLATE_LIBRARY_SERVER.find((t) => t.id === templateId);
  if (!template) { res.status(404).json({ error: "Template not found" }); return; }
  const pages = template.pages.length;
  const apis  = template.apis.length;
  const tables= template.databaseTables.length;
  const overallScore = Math.round(
    (Math.min(100, pages * 10) * 0.3) +
    (Math.min(100, (apis / 8) * 100) * 0.35) +
    (Math.min(100, (tables / 8) * 100) * 0.35),
  );
  res.json({
    template,
    health: { overallScore, passed: overallScore >= 70, pages, apis, tables },
    context: buildTemplateContextServer(template),
  });
});

router.post("/agents/templates/merge", (req, res) => {
  const { templateIds, weights } = req.body as { templateIds: string[]; weights?: Record<string, number> };
  if (!templateIds?.length) { res.status(400).json({ error: "templateIds required" }); return; }
  const templates = templateIds
    .map((id) => TEMPLATE_LIBRARY_SERVER.find((t) => t.id === id))
    .filter(Boolean) as typeof TEMPLATE_LIBRARY_SERVER;
  if (!templates.length) { res.status(404).json({ error: "No templates found" }); return; }
  const totalWeight = templateIds.reduce((acc, id) => acc + (weights?.[id] ?? 50), 0);
  const templateDna: Record<string, number> = {};
  for (const id of templateIds) {
    templateDna[id] = Math.round(((weights?.[id] ?? 50) / totalWeight) * 100);
  }
  const merged = {
    pages:          [...new Set(templates.flatMap((t) => t.pages))],
    routes:         [...new Set(templates.flatMap((t) => t.routes))],
    apis:           [...new Set(templates.flatMap((t) => t.apis))],
    databaseTables: [...new Set(templates.flatMap((t) => t.databaseTables))],
    features:       [...new Set(templates.flatMap((t) => t.features))],
    authRequired:   templates.some((t) => t.authRequired),
    templateDna,
  };
  const dnaStr = Object.entries(merged.templateDna)
    .map(([id, pct]) => `${id} (${pct}%)`)
    .join(" + ");
  const context = `HYBRID TEMPLATE DNA: ${dnaStr}\nMerged architecture:\n- Pages: ${merged.pages.join(", ")}\n- APIs: ${merged.apis.join(", ")}\n- Database Tables: ${merged.databaseTables.join(", ")}\n- Features: ${merged.features.join(", ")}`;
  res.json({ merged, context });
});

// ── POST /agents/autonomous-build ─────────────────────────────────────────────

router.post("/agents/autonomous-build", async (req, res) => {
  const userId = guardLimits(req, res);
  if (!userId) return;

  const openrouterKey = process.env["OPENROUTER_API_KEY"];
  if (!openrouterKey) { res.status(500).json({ error: "OPENROUTER_API_KEY not set" }); return; }

  const {
    chatId,
    files: rawFiles = [],
    resolvedDeps: rawResolvedDeps,
  } = req.body as {
    chatId?: string;
    files: Array<{ name: string; content: string; lang: string; path?: string }>;
    resolvedDeps?: { packages: string[]; devPackages: string[]; packageJson: string; warnings: string[] };
  };

  if (!rawFiles.length) { res.status(400).json({ error: "files required" }); return; }

  recordBuildStarted(userId);
  openSse(res);

  const sseAB = (data: Record<string, unknown>): void => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const resolvedDeps = rawResolvedDeps ?? { packages: [], devPackages: [], packageJson: "{}", warnings: [] };
    let workingFiles = rawFiles.map((f) => ({ ...f }));
    const cid = chatId ?? `anon-${Date.now()}`;
    runtimeManager.initTimeline(cid);

    const REPAIR_SYSTEM_AB =
      "You are a React JSX repair agent. Fix ONLY the reported issues. Return the COMPLETE corrected file — no markdown fences, no explanation, no truncation.";

    // Phase 1: Dependency Intelligence
    sseAB({ type: "autonomous_phase", phase: "deps", label: "Dependency Intelligence Engine" });
    const depGraph = buildRuntimeDependencyGraph(workingFiles, resolvedDeps);
    runtimeManager.addTimelineEvent(cid, { phase: "deps", label: "Dependency Intelligence", status: depGraph.healthScore >= 80 ? "pass" : "warn", score: depGraph.healthScore, detail: `${depGraph.totalImports} imports, ${depGraph.totalComponents} components, ${depGraph.totalRoutes} routes` });
    sseAB({ type: "dependency_plan", depGraph, summary: { imports: `${depGraph.resolvedImports}/${depGraph.totalImports} resolved`, components: `${depGraph.resolvedComponents}/${depGraph.totalComponents} resolved`, routes: `${depGraph.resolvedRoutes}/${depGraph.totalRoutes} resolved`, packages: `${depGraph.resolvedPackages}/${depGraph.totalPackages} resolved`, health: depGraph.healthScore, injected: depGraph.injectedImports } });

    // Phase 2: Import Resolver
    sseAB({ type: "autonomous_phase", phase: "imports", label: "Import Resolver" });
    const { resolutions: importResolutions, patchedFiles: afterImports } = resolveImports(workingFiles, resolvedDeps);
    workingFiles = afterImports;
    const autoInjected = importResolutions.filter((r) => r.autoInjected).length;
    runtimeManager.addTimelineEvent(cid, { phase: "imports", label: "Import Resolver", status: autoInjected > 0 ? "warn" : "pass", score: undefined, detail: `${autoInjected} imports auto-injected` });
    sseAB({ type: "imports_resolved", resolutions: importResolutions.slice(0, 50), autoInjected, total: importResolutions.length });

    // Phase 3: Component Resolver
    sseAB({ type: "autonomous_phase", phase: "components", label: "Component Resolver" });
    const { resolutions: compResolutions } = resolveComponents(workingFiles);
    const missingComps = compResolutions.filter((c) => !c.resolved).length;
    runtimeManager.addTimelineEvent(cid, { phase: "components", label: "Component Resolver", status: missingComps > 0 ? "warn" : "pass", detail: `${missingComps} unresolved components` });
    sseAB({ type: "components_resolved", resolutions: compResolutions.slice(0, 50), missing: missingComps, total: compResolutions.length });

    // Phase 4: Route Resolver
    sseAB({ type: "autonomous_phase", phase: "routes", label: "Route Resolver" });
    const { resolutions: routeResolutions } = resolveRoutes(workingFiles);
    const missingRoutes = routeResolutions.filter((r) => !r.resolved).length;
    runtimeManager.addTimelineEvent(cid, { phase: "routes", label: "Route Resolver", status: missingRoutes > 0 ? "warn" : "pass", detail: `${routeResolutions.length} routes, ${missingRoutes} missing` });
    sseAB({ type: "routes_resolved", resolutions: routeResolutions, missing: missingRoutes, total: routeResolutions.length });

    // Phase 5: Package Resolver
    sseAB({ type: "autonomous_phase", phase: "packages", label: "Package Resolver" });
    const pkgResolutions = resolvePackages(workingFiles, resolvedDeps);
    const missingPkgs = pkgResolutions.filter((p) => !p.inResolved).length;
    runtimeManager.addTimelineEvent(cid, { phase: "packages", label: "Package Resolver", status: missingPkgs > 0 ? "warn" : "pass", detail: `${pkgResolutions.length} detected, ${missingPkgs} missing from resolved` });
    sseAB({ type: "packages_resolved", resolutions: pkgResolutions, missing: missingPkgs, total: pkgResolutions.length });

    // Phase 6: Runtime Sandbox
    sseAB({ type: "autonomous_phase", phase: "sandbox", label: "Runtime Sandbox Validation" });
    let sandboxResult = validateFiles(workingFiles as Array<{ name: string; content: string; lang: string }>);
    runtimeManager.addTimelineEvent(cid, { phase: "sandbox", label: "Runtime Sandbox", status: sandboxResult.passed ? "pass" : "fail", score: sandboxResult.score, detail: `${sandboxResult.filesPassed}/${sandboxResult.filesChecked} files passed` });
    sseAB({ type: "sandbox_result", passed: sandboxResult.passed, runtimeScore: sandboxResult.score, filesPassed: sandboxResult.filesPassed, filesChecked: sandboxResult.filesChecked, errors: sandboxResult.errors.slice(0, 5) });

    // Phase 7: Autonomous Build Loop (max 5 passes, stop at ≥95)
    sseAB({ type: "autonomous_phase", phase: "loop", label: "Autonomous Build Loop" });
    const MAX_AUTO_PASSES = 5;
    const PASS_TARGET = 95;
    const passScores: number[] = [];
    let currentHealth = sandboxResult.score;

    for (let pass = 0; pass < MAX_AUTO_PASSES; pass++) {
      const failures = workingFiles.filter(
        (f) =>
          (f.lang === "tsx" || f.lang === "jsx") &&
          f.name !== "main.tsx" &&
          !validateFiles([f] as Array<{ name: string; content: string; lang: string }>).passed,
      );

      if (failures.length === 0 || currentHealth >= PASS_TARGET) {
        passScores.push(currentHealth);
        runtimeManager.addTimelineEvent(cid, { phase: `loop_pass_${pass + 1}`, label: `Pass ${pass + 1} — ${failures.length === 0 ? "No failures" : "Target reached"}`, status: "pass", score: currentHealth });
        sseAB({ type: "autonomous_build_pass", pass: pass + 1, health: currentHealth, repairedCount: 0, status: failures.length === 0 ? "no_failures" : "target_reached", passScores });
        break;
      }

      sseAB({ type: "autonomous_build_pass", pass: pass + 1, health: currentHealth, repairedCount: failures.length, status: "repairing", passScores });
      let repairedCount = 0;

      await Promise.all(
        failures.slice(0, 4).map(async (file) => {
          const validation = validateFiles([file] as Array<{ name: string; content: string; lang: string }>);
          const issues = validation.errors.slice(0, 3).map((e) => e.message).join("; ") || "JSX/syntax errors";
          try {
            const repaired = await callAI(
              openrouterKey,
              [
                { role: "system", content: REPAIR_SYSTEM_AB },
                { role: "user", content: `File: ${file.name}\nIssues: ${issues}\n\nFull file:\n${file.content.slice(0, 3000)}` },
              ],
              { label: `autonomous-repair:${file.name}`, maxTokens: 1500 },
            );
            if (repaired && repaired.length > 80) {
              const cleaned = repaired.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
              if (cleaned.length > file.content.length * 0.3) {
                file.content = cleaned;
                repairedCount++;
              }
            }
          } catch (e) {
            log.error("AUTONOMOUS_BUILD_REPAIR_FAILED", { pass: pass + 1, file: file.name, error: String(e) });
          }
        }),
      );

      const postRepair = validateFiles(workingFiles as Array<{ name: string; content: string; lang: string }>);
      currentHealth = postRepair.score;
      passScores.push(currentHealth);
      runtimeManager.addTimelineEvent(cid, { phase: `loop_pass_${pass + 1}`, label: `Pass ${pass + 1} — ${repairedCount} files repaired`, status: currentHealth >= PASS_TARGET ? "pass" : currentHealth >= 80 ? "warn" : "fail", score: currentHealth, detail: `${repairedCount}/${failures.length} repaired` });
      sseAB({ type: "autonomous_build_pass", pass: pass + 1, health: currentHealth, repairedCount, status: currentHealth >= PASS_TARGET ? "target_reached" : "pass_complete", passScores });
      sandboxResult = postRepair;
      if (currentHealth >= PASS_TARGET) break;
    }

    const tl = runtimeManager.getTimeline(cid);
    if (tl) tl.totalPasses = passScores.length;

    // Phase 8: Runtime Health V3
    sseAB({ type: "autonomous_phase", phase: "health", label: "Runtime Health V3" });
    const runtimeStateForV3 = runtimeManager.getState(cid);
    const healthV3 = runtimeManager.computeHealthV3(runtimeStateForV3, depGraph);
    if (currentHealth > 0) {
      const blended = Math.round((healthV3.overall * 0.6) + (currentHealth * 0.4));
      (healthV3 as { overall: number }).overall = Math.min(100, blended);
    }
    runtimeManager.addTimelineEvent(cid, { phase: "health_v3", label: "Runtime Health V3", status: healthV3.overall >= 90 ? "pass" : healthV3.overall >= 70 ? "warn" : "fail", score: healthV3.overall });
    sseAB({ type: "runtime_health_v3", healthV3, passScores, finalHealth: healthV3.overall });

    // Phase 9: Runtime Timeline
    sseAB({ type: "autonomous_phase", phase: "timeline", label: "Runtime Timeline" });
    const finalTimeline = runtimeManager.finalizeTimeline(cid, healthV3.overall);
    if (finalTimeline) sseAB({ type: "runtime_timeline", timeline: finalTimeline });

    // Phase 10: Preview Gate
    sseAB({ type: "autonomous_phase", phase: "gate", label: "Preview Gate" });
    const gatePass = healthV3.overall >= 90;
    if (!gatePass) {
      const criticalFiles = workingFiles.filter(
        (f) =>
          (f.lang === "tsx" || f.lang === "jsx") &&
          !validateFiles([f] as Array<{ name: string; content: string; lang: string }>).passed,
      );
      if (criticalFiles.length > 0) {
        sseAB({ type: "preview_gate_fail", health: healthV3.overall, threshold: 90, repairingFiles: criticalFiles.length });
        await Promise.all(
          criticalFiles.slice(0, 3).map(async (file) => {
            try {
              const repaired = await callAI(
                openrouterKey,
                [
                  { role: "system", content: REPAIR_SYSTEM_AB },
                  { role: "user", content: `CRITICAL: Fix ALL errors in this file for production preview.\nFile: ${file.name}\n\nFull file:\n${file.content.slice(0, 3000)}` },
                ],
                { label: `autonomous-gate-repair:${file.name}`, maxTokens: 1500 },
              );
              if (repaired && repaired.length > 80) {
                const cleaned = repaired.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
                if (cleaned.length > file.content.length * 0.3) file.content = cleaned;
              }
            } catch { /* best effort */ }
          }),
        );
        const afterGate = validateFiles(workingFiles as Array<{ name: string; content: string; lang: string }>);
        healthV3.overall = Math.min(100, Math.round((healthV3.overall * 0.6) + (afterGate.score * 0.4)));
        runtimeManager.addTimelineEvent(cid, { phase: "gate", label: "Preview Gate — Repaired", status: healthV3.overall >= 90 ? "pass" : "warn", score: healthV3.overall });
        sseAB({ type: "preview_gate_repaired", health: healthV3.overall, gatePass: healthV3.overall >= 90 });
      } else {
        sseAB({ type: "preview_gate_fail", health: healthV3.overall, threshold: 90, repairingFiles: 0 });
      }
    } else {
      runtimeManager.addTimelineEvent(cid, { phase: "gate", label: "Preview Gate — Passed", status: "pass", score: healthV3.overall });
      sseAB({ type: "preview_gate_pass", health: healthV3.overall });
    }

    sseAB({ type: "autonomous_build_done", chatId: cid, healthV3, depGraph, passScores, timeline: runtimeManager.getTimeline(cid), gatePass: healthV3.overall >= 90, files: workingFiles });
    log.info("AUTONOMOUS_BUILD_DONE", { finalHealth: healthV3.overall, passes: passScores.length, gate: healthV3.overall >= 90 });
  } catch (err: unknown) {
    const e = err as Error;
    sseAB({ type: "autonomous_build_error", error: e?.message ?? "Autonomous build failed" });
  } finally {
    recordBuildCompleted(userId);
    res.end();
  }
});

export default router;
