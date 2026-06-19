import { Router } from "express";
import { strToU8, zipSync } from "fflate";
import {
  buildMinimalEditContext,
  compressProjectMemory,
  truncateForGroq,
  estimateTokenCount,
  logCompressionReport,
  GROQ_TOKEN_BUDGET,
} from "../contextManager";
import { validateFiles, computeRepairQuality } from "../runtime/runtimeValidator.js";
import * as runtimeManager from "../runtime/runtimeManager.js";
import { classifyRuntimeError, REPAIR_PROMPTS } from "../runtime/repairStrategies.js";
import { buildRuntimeDependencyGraph, resolveImports, resolveComponents, resolveRoutes, resolvePackages } from "../runtime/dependencyResolverV2.js";

// ── Extracted module imports ──────────────────────────────────────────────────
import type { ProjectFileSSE, ProjectBlueprint, DesignDNA, PageBlueprint } from "../agents/types.js";
import { sse } from "../agents/streaming/sseManager.js";
import {
  callGroq,
  BACKEND_MODEL, REPAIR_MODEL,
} from "../agents/llm/llmClient.js";
import {
  EDIT_SYSTEM, INTENT_SYSTEM,
} from "../agents/llm/prompts.js";
import {
  type DNAComposition,
} from "../agents/dna/dnaAgent.js";
import {
  buildKnowledgeGraphServer, resolveEditTargetsServer,
  type ServerKnowledgeGraph,
} from "../agents/knowledge/knowledgeGraph.js";
import {
  resolveAffectedFiles, validateEditFiles, extractEditFiles, extractDeletedPaths, mergeProjectFiles,
} from "../agents/context/editHelpers.js";
import {
  TEMPLATE_LIBRARY_SERVER, TEMPLATE_MATCH_KEYWORDS,
  serverMatchTemplate, buildTemplateContextServer,
} from "../agents/templates/templateAgent.js";
import { getTemplatesByCategory, getRegistryCatalogue, selectTemplatesForPrompt, buildContextFromTemplates } from "../components/registry";
import { runBuildPipeline } from "../agents/pipeline/buildPipeline.js";

// ── Local types ───────────────────────────────────────────────────────────────
interface OpenRouterError extends Error {
  status?: number;
  requestId?: string;
  model?: string;
  body?: unknown;
}

const router: Router = Router();

// ── /agents/build — thin orchestrator ─────────────────────────────────────────
router.post("/agents/build", async (req, res) => {
  const groqKey = process.env["GROQ_API_KEY"];
  const openrouterKey = process.env["OPENROUTER_API_KEY"];
  const { prompt, chatId: reqChatId } = req.body as { prompt: string; chatId?: string; selectedTemplateId?: string };
  const chatId = reqChatId ?? `build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });
  if (!openrouterKey) return res.status(500).json({ error: "OPENROUTER_API_KEY not set" });
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    await runBuildPipeline({ prompt, chatId, keys: { groqKey, openrouterKey } }, res);
  } catch (err: any) {
    sse(res, { type: "error", error: err?.message ?? "Multi-agent pipeline failed" });
  }

  res.end();
});

// ── DESIGN AUDIT ENDPOINT ─────────────────────────────────────────────────────
router.post("/agents/audit", async (req, res) => {
  const groqKey = process.env["GROQ_API_KEY"];
  const openrouterKey = process.env["OPENROUTER_API_KEY"];
  const { prompt } = req.body as { prompt: string };

  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });
  if (!openrouterKey) return res.status(500).json({ error: "OPENROUTER_API_KEY not set" });
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const audit: Record<string, any> = {
    prompt,
    models: { planner: PLANNER_MODEL, design: DESIGN_MODEL, codegen: CODEGEN_MODEL, codefix: CODEFIX_MODEL },
  };

  try {
    let planText = "";
    await callGroq(groqKey, PLANNER_MODEL,
      [{ role: "system", content: PLANNER_SYSTEM }, { role: "user", content: prompt }],
      true, 2500, (token) => { planText += token; }
    );
    audit.plannerOutput = { raw: planText };

    const briefMatch = planText.match(/---DESIGN_BRIEF---([\s\S]*?)---END_BRIEF---/);
    const briefText = briefMatch ? briefMatch[1].trim() : "";
    const refMatch = briefText.match(/referenceSites:\s*(.+)/);
    const referenceSites = refMatch ? refMatch[1].trim() : "none";

    let auditPrimaryRef = "none";
    const auditPrimaryRefMatch = briefText.match(/primaryReference:\s*(.+)/);
    if (auditPrimaryRefMatch) auditPrimaryRef = auditPrimaryRefMatch[1].trim();
    if (auditPrimaryRef === "none" && referenceSites !== "none") {
      auditPrimaryRef = referenceSites.split(',')[0].trim();
    }

    let auditSecondaryRefs: string[] = [];
    const auditSecondaryMatch = briefText.match(/secondaryReferences:\s*(.+)/);
    if (auditSecondaryMatch && auditSecondaryMatch[1].trim() !== "none") {
      auditSecondaryRefs = auditSecondaryMatch[1].trim().split(',').map(s => s.trim());
    }

    const blueprintMatch = planText.match(/---PAGE_BLUEPRINT---([\s\S]*?)---END_BLUEPRINT---/);
    let blueprint: PageBlueprint = { websiteType: "Generic", sectionOrder: ["Navbar", "Hero", "Features", "CTA", "Footer"] };
    if (blueprintMatch) {
      try { blueprint = JSON.parse(blueprintMatch[1].trim()); } catch {}
    }
    audit.plannerOutput.brief = briefText;
    audit.plannerOutput.referenceSites = referenceSites;
    audit.plannerOutput.primaryReference = auditPrimaryRef;
    audit.plannerOutput.secondaryReferences = auditSecondaryRefs;
    audit.plannerOutput.blueprint = blueprint;

    const designPrompt = [
      `Website brief:\n${briefText || prompt}`,
      `Website type: ${blueprint.websiteType}`,
      referenceSites !== "none" ? `Design references: ${referenceSites}` : "",
      `\nGenerate the complete design DNA JSON for this site.`,
    ].filter(Boolean).join('\n');

    audit.designAgentInput = { systemPromptLength: DESIGN_SYSTEM.length, userPrompt: designPrompt };

    let designAgentRawOutput = "";
    let parsedDNA: Partial<DesignDNA> | null = null;
    let finalDNA: DesignDNA = { ...DEFAULT_DESIGN };
    let designAgentStatus = "not_run";
    let designAgentError: string | null = null;

    try {
      designAgentRawOutput = await callOpenRouter(openrouterKey, DESIGN_MODEL,
        [{ role: "system", content: DESIGN_SYSTEM }, { role: "user", content: designPrompt }],
        1500
      );
      designAgentStatus = "success";
      const jsonMatch = designAgentRawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedDNA = JSON.parse(jsonMatch[0]);
        finalDNA = { ...DEFAULT_DESIGN, ...(parsedDNA as any) };
        if ((parsedDNA as any).colorSystem) finalDNA.colorSystem = { ...DEFAULT_DESIGN.colorSystem, ...(parsedDNA as any).colorSystem };
        if ((parsedDNA as any).typographySystem) finalDNA.typographySystem = { ...DEFAULT_DESIGN.typographySystem, ...(parsedDNA as any).typographySystem };
        if ((parsedDNA as any).spacingSystem) finalDNA.spacingSystem = { ...DEFAULT_DESIGN.spacingSystem, ...(parsedDNA as any).spacingSystem };
      } else {
        designAgentStatus = "parse_failed";
        designAgentError = "Model response contained no JSON object";
      }
    } catch (e: any) {
      designAgentStatus = "failed";
      const orErr = e as OpenRouterError;
      designAgentError = e.message;
      audit.designAgentError = {
        message: e.message,
        model: orErr.model ?? DESIGN_MODEL,
        status: orErr.status ?? null,
        requestId: orErr.requestId ?? null,
        body: orErr.body ?? null,
      };
    }

    const KEY_FIELDS = [
      ["designLanguage"],
      ["layoutStyle"],
      ["animationPersonality"],
      ["decorationLevel"],
      ["heroStyle"],
      ["cardStyle"],
      ["colorSystem", "background"],
      ["colorSystem", "surface"],
      ["colorSystem", "primary"],
      ["colorSystem", "accent"],
      ["colorSystem", "textMuted"],
      ["colorSystem", "border"],
      ["typographySystem", "headingWeight"],
      ["typographySystem", "scale"],
      ["spacingSystem", "sectionPadding"],
    ] as const;

    const get = (obj: any, path: readonly string[]) => path.reduce((o, k) => o?.[k], obj);
    const dnaDiff: Record<string, { default: any; actual: any; changed: boolean }> = {};
    for (const path of KEY_FIELDS) {
      const key = path.join(".");
      const def = get(DEFAULT_DESIGN, path);
      const act = get(finalDNA, path);
      dnaDiff[key] = { default: def, actual: act, changed: def !== act };
    }
    const changedFields = Object.values(dnaDiff).filter(v => v.changed).length;

    audit.designAgentOutput = { raw: designAgentRawOutput, status: designAgentStatus, error: designAgentError };
    audit.parsedDNA = parsedDNA;
    audit.finalDNA = finalDNA;
    audit.dnaDiff = { fields: dnaDiff, changedFromDefault: changedFields, totalFields: KEY_FIELDS.length, collapsed: changedFields === 0 };

    const AUDIT_HERO_MAP: Record<string, string> = {
      stripe: 'hero-centered-v1', linear: 'hero-editorial-v1', vercel: 'hero-asymmetric-v1',
      framer: 'hero-bento-v1', notion: 'hero-editorial-v1', cursor: 'hero-asymmetric-v1',
    };
    const selectedTemplates = selectTemplatesForPrompt(prompt, blueprint.sectionOrder, finalDNA, referenceSites, auditPrimaryRef);
    const componentContext = buildContextFromTemplates(selectedTemplates);
    const codeGenSystemPrompt = buildCodeSystem(finalDNA, blueprint, componentContext);

    const selectedHero = selectedTemplates.find(t => t.category === 'hero')?.id ?? 'none';
    const expectedHero = AUDIT_HERO_MAP[auditPrimaryRef.toLowerCase()] ?? 'unknown';
    const heroMatch = expectedHero === 'unknown' || selectedHero === expectedHero;
    const dnaVerifiers: Record<string, (d: DesignDNA) => boolean> = {
      stripe: (d) => d.designLanguage === "premium-gradient" && d.heroStyle === "centered-gradient",
      linear: (d) => d.designLanguage === "minimal-flat" && d.heroStyle === "editorial-large",
      vercel:  (d) => d.designLanguage === "monochrome" && d.heroStyle === "split-layout",
    };
    const dnaVerifier = dnaVerifiers[auditPrimaryRef.toLowerCase()];
    const dnaPass = dnaVerifier ? dnaVerifier(finalDNA) : true;
    const validationStatus = heroMatch && dnaPass ? "pass" : !heroMatch ? "fail:hero_mismatch" : "fail:dna_mismatch";

    const SECTION_EXPECTED_FEATURES: Record<string, string> = {
      stripe: 'features-stripe-v1', paypal: 'features-stripe-v1',
      linear: 'features-editorial-v1', notion: 'features-editorial-v1',
      vercel: 'features-split-v1', netlify: 'features-split-v1',
      framer: 'features-framer-v1', webflow: 'features-framer-v1', figma: 'features-framer-v1',
    };
    const SECTION_EXPECTED_DASHBOARD: Record<string, string> = {
      stripe: 'dashboard-revenue-v1', paypal: 'dashboard-revenue-v1',
      linear: 'dashboard-kanban-v1', notion: 'dashboard-kanban-v1',
      vercel: 'dashboard-vercel-v1', netlify: 'dashboard-vercel-v1',
      framer: 'dashboard-aiflow-v1', webflow: 'dashboard-aiflow-v1',
    };
    const SECTION_EXPECTED_PRICING: Record<string, string> = {
      stripe: 'pricing-comparison-v1', paypal: 'pricing-comparison-v1',
      linear: 'pricing-minimal-v1', notion: 'pricing-minimal-v1',
      vercel: 'pricing-horizontal-v1', netlify: 'pricing-horizontal-v1',
      framer: 'pricing-cardstack-v1', webflow: 'pricing-cardstack-v1', figma: 'pricing-cardstack-v1',
    };

    const ref = auditPrimaryRef.toLowerCase();
    const selectedFeatures = selectedTemplates.find((t: any) => t.category === 'features')?.id ?? 'none';
    const selectedDashboard = selectedTemplates.find((t: any) => t.category === 'dashboard-preview')?.id ?? 'none';
    const selectedPricing = selectedTemplates.find((t: any) => t.category === 'pricing')?.id ?? 'none';
    const expectedFeatures = SECTION_EXPECTED_FEATURES[ref] ?? 'unknown';
    const expectedDashboard = SECTION_EXPECTED_DASHBOARD[ref] ?? 'unknown';
    const expectedPricing = SECTION_EXPECTED_PRICING[ref] ?? 'unknown';
    const featuresMatch = selectedFeatures === 'none' ? null : (expectedFeatures === 'unknown' || selectedFeatures === expectedFeatures);
    const dashboardMatch = selectedDashboard === 'none' ? null : (expectedDashboard === 'unknown' || selectedDashboard === expectedDashboard);
    const pricingMatch = selectedPricing === 'none' ? null : (expectedPricing === 'unknown' || selectedPricing === expectedPricing);
    const activeChecks = ([heroMatch, featuresMatch, dashboardMatch, pricingMatch] as (boolean | null)[]).filter(m => m !== null) as boolean[];
    const matchPoints = activeChecks.filter(Boolean).length;
    const architectureMatchScore = activeChecks.length > 0 ? Math.round((matchPoints / activeChecks.length) * 100) : 100;

    const diversityCounts = {
      hero:         getTemplatesByCategory('hero').length,
      features:     getTemplatesByCategory('features').length,
      pricing:      getTemplatesByCategory('pricing').length,
      dashboard:    getTemplatesByCategory('dashboard-preview').length,
      navbar:       getTemplatesByCategory('navbar').length,
      bento:        getTemplatesByCategory('bento').length,
      cta:          getTemplatesByCategory('cta').length,
      faq:          getTemplatesByCategory('faq').length,
      testimonials: getTemplatesByCategory('testimonials').length,
    };
    const catScore = (n: number) => Math.min(100, Math.round((n / 6) * 100));
    const categoryScores: Record<string, number> = {};
    for (const [cat, count] of Object.entries(diversityCounts)) {
      categoryScores[cat] = catScore(count);
    }
    const overallArchitectureScore = Math.round(
      Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.values(categoryScores).length
    );
    const routingMaps = ['hero', 'features', 'dashboard', 'pricing', 'navbar', 'bento', 'cta', 'faq'];
    const routingCoverage = [heroMatch, featuresMatch, dashboardMatch, pricingMatch]
      .filter(m => m !== null).length;

    audit.referenceRouting = {
      primaryReference: auditPrimaryRef,
      secondaryReferences: auditSecondaryRefs,
      selectedHero, selectedFeatures, selectedDashboard, selectedPricing,
      expectedHero, expectedFeatures, expectedDashboard, expectedPricing,
      heroMatch, featuresMatch, dashboardMatch, pricingMatch,
      architectureMatchScore, dnaPass, validationStatus,
    };

    audit.architectureDiversity = {
      templateCounts: diversityCounts,
      categoryScores,
      overallArchitectureScore,
      routingCoverage,
      routingMapsCount: routingMaps.length,
      target: 90,
      passing: overallArchitectureScore >= 90,
      note: overallArchitectureScore >= 90
        ? `PASS — system diversity ≥ 90 (${overallArchitectureScore})`
        : `FAIL — system diversity ${overallArchitectureScore} < 90 target. Low categories: ${Object.entries(categoryScores).filter(([,s]) => s < 90).map(([c,s]) => `${c}(${s})`).join(', ')}`,
    };

    audit.codeGeneratorPrompt = {
      systemPromptLength: codeGenSystemPrompt.length,
      systemPromptPreview: codeGenSystemPrompt.slice(0, 1200) + (codeGenSystemPrompt.length > 1200 ? "\n...[truncated]" : ""),
      userPrompt: `Build a complete landing page for: ${prompt} — ${blueprint.sectionOrder.length} sections: ${blueprint.sectionOrder.join(' → ')}`,
      selectedTemplates: selectedTemplates.map(t => t.id),
    };

    audit.summary = {
      referenceSites,
      designAgentStatus,
      dnaCollapsed: changedFields === 0,
      changedFieldsFromDefault: changedFields,
      dominantColor: finalDNA.colorSystem.primary,
      background: finalDNA.colorSystem.background,
      designLanguage: finalDNA.designLanguage,
      animationPersonality: finalDNA.animationPersonality,
    };

  } catch (e: any) {
    audit.fatalError = e.message;
  }

  res.json(audit);
});

// ── ZIP EXPORT ────────────────────────────────────────────────────────────────
router.post("/agents/export", (req, res) => {
  try {
    const { files, projectName = "nexogen-project" } = req.body as {
      files: Array<{ path: string; name: string; content: string }>;
      projectName?: string;
    };

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

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
  } catch (e: any) {
    console.error("[Export] ZIP error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ── V5.5: DYNAMIC EDIT SYSTEM (locked component injection) ───────────────────
function buildEditSystem(lockedComponents: string[], isRetry = false, prevViolations = ''): string {
  if (lockedComponents.length === 0) return EDIT_SYSTEM;
  const lockedList = lockedComponents.map(c => `  • ${c.toUpperCase()}`).join('\n');
  const violationNote = prevViolations
    ? `\nPREVIOUS ATTEMPT INCORRECTLY MODIFIED: ${prevViolations}\nDo NOT output FILE blocks for these.`
    : '';
  const strictNote = isRetry
    ? '\nFINAL WARNING — any locked file output causes complete edit rejection.'
    : '';
  return EDIT_SYSTEM + `

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

These rules override all other instructions. Violation = failed edit.`;
}

// ── V5.5: EDIT IMPACT ANALYZER ───────────────────────────────────────────────
function analyzeEditImpactServer(
  prompt: string,
  registryFileMap: Record<string, string[]>,
  lockedComponents: string[]
): { affectedSections: string[]; affectedFiles: string[]; lockedConflicts: string[]; replacementMode: string | null } {
  const p = prompt.toLowerCase();
  const SECTION_KEYWORDS: Record<string, string[]> = {
    hero:         ['hero', 'headline', 'banner', 'above the fold', 'main heading'],
    pricing:      ['pricing', 'price', 'plan', 'billing', 'subscription', 'yearly', 'monthly', 'tier'],
    navbar:       ['navbar', 'nav bar', 'navigation menu', 'top menu', 'header nav'],
    features:     ['feature', 'benefit', 'what we offer', 'capability', 'functionality'],
    faq:          ['faq', 'frequently asked', 'question'],
    testimonials: ['testimonial', 'review', 'social proof', 'customer quote'],
    cta:          ['call to action', ' cta', 'get started button', 'sign up button'],
    footer:       ['footer', 'bottom section', 'bottom of page'],
    dashboard:    ['dashboard', 'analytics page', 'metrics page', 'stats page'],
    auth:         ['login page', 'signup page', 'auth page', 'sign in page'],
  };
  const replaceMatch = /\breplace\s+(?:the\s+)?(\w+)/i.exec(prompt);
  const replacementMode = replaceMatch ? replaceMatch[1].toLowerCase() : null;
  const affectedSections: string[] = [];
  const affectedFiles: string[] = [];
  for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (keywords.some(kw => p.includes(kw))) {
      affectedSections.push(section);
      affectedFiles.push(...(registryFileMap[section] ?? []));
    }
  }
  if (replacementMode && !affectedSections.includes(replacementMode)) affectedSections.push(replacementMode);
  const lockedConflicts = affectedSections.filter(s => lockedComponents.includes(s));
  return { affectedSections, affectedFiles: [...new Set(affectedFiles)], lockedConflicts, replacementMode };
}

// ── EDIT AGENT ────────────────────────────────────────────────────────────────
router.post("/agents/edit", async (req, res) => {
  const groqKey = process.env["GROQ_API_KEY"];
  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });

  const { prompt, projectFiles = [], projectMemory, componentRegistry, themeTokens, knowledgeGraph, lockedComponents = [], registryFileMap = {} } = req.body as {
    prompt: string;
    projectFiles: ProjectFileSSE[];
    projectMemory?: Record<string, any>;
    componentRegistry?: Record<string, string>;
    themeTokens?: Record<string, any>;
    knowledgeGraph?: ServerKnowledgeGraph;
    lockedComponents?: string[];
    registryFileMap?: Record<string, string[]>;
  };

  if (!prompt) return res.status(400).json({ error: "prompt required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // ── STEP 0: Intent Detection ────────────────────────────────────────────
    sse(res, { type: "step", step: 0, agent: "Intent Detector", status: "active" });

    const fileList = projectFiles.map((f) => f.path + f.name).join("\n");
    let intentResult = { editType: "component", targetFiles: [] as string[], newFiles: [] as string[], reason: prompt };

    try {
      const { system: intentSys, user: intentUser } = truncateForGroq(
        INTENT_SYSTEM,
        `PROJECT FILES:\n${fileList}\n\nEDIT REQUEST: ${prompt}`,
        600
      );
      const intentRaw = await callGroq(
        groqKey, PLANNER_MODEL,
        [
          { role: "system", content: intentSys },
          { role: "user", content: intentUser },
        ],
        false, 600
      );
      const cleaned = intentRaw.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      intentResult = { ...intentResult, ...parsed };
    } catch { /* keep defaults */ }

    sse(res, { type: "intent_detected", ...intentResult });
    sse(res, { type: "step", step: 0, agent: "Intent Detector", status: "done" });

    // ── V5.5: Edit Impact Analysis ──────────────────────────────────────────
    const editImpact = analyzeEditImpactServer(prompt, registryFileMap, lockedComponents);
    sse(res, { type: "edit_impact", affectedSections: editImpact.affectedSections, affectedFiles: editImpact.affectedFiles, lockedConflicts: editImpact.lockedConflicts, replacementMode: editImpact.replacementMode });
    if (editImpact.lockedConflicts.length > 0) {
      console.log(`[V5.5] Impact: locked conflicts detected — ${editImpact.lockedConflicts.join(', ')}`);
    }

    // ── STEP 1: File Resolution ─────────────────────────────────────────────
    sse(res, { type: "step", step: 1, agent: "File Resolver", status: "active" });

    const depGraph = (projectMemory?.dependencyGraph as Record<string, string[]>) ?? {};
    const resolvedFiles = resolveAffectedFiles(intentResult.targetFiles, depGraph, projectFiles);

    let graphResolvedFiles: string[] = [];
    if (knowledgeGraph && knowledgeGraph.components.length > 0) {
      const graphResolution = resolveEditTargetsServer(knowledgeGraph, prompt, projectFiles);
      if (graphResolution.resolved && graphResolution.targetFiles.length > 0) {
        graphResolvedFiles = graphResolution.targetFiles.map(f => f.path + f.name);
        sse(res, { type: "graph_context", filesLoaded: graphResolution.filesLoaded, filesSkipped: graphResolution.filesSkipped, tokensSaved: graphResolution.tokensSaved, resolvedNodes: graphResolution.graphNodes });
        console.log(`[KnowledgeGraph] Edit context: loaded=${graphResolution.filesLoaded} skipped=${graphResolution.filesSkipped} saved≈${graphResolution.tokensSaved} tokens`);
        for (const gf of graphResolvedFiles) { if (!intentResult.targetFiles.includes(gf)) intentResult.targetFiles.push(gf); }
      }
    }

    sse(res, { type: "file_targets", files: resolvedFiles, originalTargets: intentResult.targetFiles });
    sse(res, { type: "step", step: 1, agent: "File Resolver", status: "done" });

    // ── V5.5: Locked Component Enforcement ──────────────────────────────────
    const lockedFilePaths = new Set<string>();
    for (const cat of lockedComponents) {
      for (const fp of (registryFileMap[cat] ?? [])) lockedFilePaths.add(fp);
    }
    const filteredResolvedFiles = lockedFilePaths.size > 0
      ? resolvedFiles.filter(fp => !lockedFilePaths.has(fp))
      : resolvedFiles;
    if (filteredResolvedFiles.length < resolvedFiles.length) {
      const excluded = resolvedFiles.filter(fp => lockedFilePaths.has(fp));
      sse(res, { type: "locked_excluded", excluded, preservedCategories: lockedComponents });
      console.log(`[V5.5] Locked enforcement: excluded ${excluded.length} locked files from context`);
    }

    // ── STEP 2: Patch Generation ──────────────────────────────────────────────
    sse(res, { type: "step", step: 2, agent: "Patch Generator", status: "active" });

    const EDIT_RESPONSE_TOKENS = 4_000;
    const sysTokens = estimateTokenCount(EDIT_SYSTEM);
    const fileContextBudget = GROQ_TOKEN_BUDGET - EDIT_RESPONSE_TOKENS - sysTokens - 400;
    const compressedMem = projectMemory ? compressProjectMemory(projectMemory) : null;
    const projectSummary = compressedMem
      ? `Project: ${compressedMem["projectType"] || "App"} | Pages: ${(compressedMem["pages"] as string[] || []).join(", ")} | Entities: ${(compressedMem["entities"] as string[] || []).join(", ")}\n`
      : `Files: ${projectFiles.map((f) => f.path + f.name).join(", ")}\n`;
    const designCtx = themeTokens
      ? `\nDesign tokens (PRESERVE): primary=${themeTokens.primary}, surface=${themeTokens.surface}, isDark=${themeTokens.isDark}`
      : "";
    const registryCtx = componentRegistry && Object.keys(componentRegistry).length > 0
      ? `\nComponents: ${Object.keys(componentRegistry).slice(0, 20).join(", ")}`
      : "";

    let modifiedFiles: ProjectFileSSE[] = [];
    let deletedPaths: string[] = [];
    let qualityResult: ReturnType<typeof validateEditFiles> = { score: 0, passed: false, issues: [], warnings: [] };

    for (let diffAttempt = 0; diffAttempt < 3; diffAttempt++) {
      const prevViolations = diffAttempt > 0
        ? modifiedFiles.filter(f => lockedFilePaths.has(f.path + f.name)).map(f => f.name).join(', ')
        : '';
      const dynamicEditSystem = buildEditSystem(lockedComponents, diffAttempt > 0, prevViolations);

      const allTargets = [...filteredResolvedFiles, ...(intentResult.newFiles ?? []), "App.tsx"];
      const { context: fileContext, meta: ctxMeta } = buildMinimalEditContext(projectFiles, allTargets, fileContextBudget);
      if (diffAttempt === 0) logCompressionReport("EditPatch", ctxMeta);

      const userMessageRaw = `${projectSummary}${designCtx}${registryCtx}
EDIT REQUEST: ${prompt}
INTENT: ${intentResult.editType} — ${intentResult.reason}
TARGET FILES: ${filteredResolvedFiles.join(", ")}${intentResult.newFiles?.length ? `\nNEW FILES: ${intentResult.newFiles.join(", ")}` : ""}
ALL PROJECT FILES (do not modify unless listed above): ${projectFiles.map((f) => f.path + f.name).join(", ")}

CURRENT FILE CONTEXT:
${fileContext}`;

      const { system: editSystem, user: userMessage, truncated: wasTruncated } =
        truncateForGroq(dynamicEditSystem, userMessageRaw, EDIT_RESPONSE_TOKENS);
      if (wasTruncated && diffAttempt === 0) {
        console.warn("[EditPatch] Context truncated by safety net");
        sse(res, { type: "debug", message: "context_compressed" });
      }

      const editRaw = await callGroq(
        groqKey, BACKEND_MODEL,
        [{ role: "system", content: editSystem }, { role: "user", content: userMessage }],
        false, EDIT_RESPONSE_TOKENS
      );

      modifiedFiles = extractEditFiles(editRaw);
      deletedPaths  = extractDeletedPaths(editRaw);
      qualityResult = validateEditFiles(modifiedFiles, projectFiles, filteredResolvedFiles);

      if (lockedFilePaths.size > 0) {
        const violations = modifiedFiles.filter(f => lockedFilePaths.has(f.path + f.name));
        if (violations.length > 0 && diffAttempt < 2) {
          sse(res, { type: "locked_protection", retryAttempt: diffAttempt + 1, violations: violations.map(f => f.path + f.name) });
          console.log(`[V5.5] Diff protection retry ${diffAttempt + 1}: ${violations.map(f => f.name).join(', ')} violated`);
          continue;
        }
        modifiedFiles = modifiedFiles.filter(f => !lockedFilePaths.has(f.path + f.name));
        deletedPaths  = deletedPaths.filter(fp => !lockedFilePaths.has(fp));
      }
      break;
    }

    sse(res, { type: "step", step: 2, agent: "Patch Generator", status: "done" });

    // ── STEP 3: Quality Gate ────────────────────────────────────────────────
    sse(res, { type: "step", step: 3, agent: "Quality Gate", status: "active" });

    console.log(`[EditAgent V5.5] modified=${modifiedFiles.length} deleted=${deletedPaths.length} quality=${qualityResult.score}`);
    sse(res, { type: "quality_check", ...qualityResult });
    sse(res, { type: "step", step: 3, agent: "Quality Gate", status: qualityResult.passed ? "done" : "warn" });

    // ── STEP 4: Merge Engine ────────────────────────────────────────────────
    sse(res, { type: "step", step: 4, agent: "Merge Engine", status: "active" });

    const mergedFiles = mergeProjectFiles(projectFiles, modifiedFiles, deletedPaths);

    const existingPaths = new Set(projectFiles.map((f) => f.path + f.name));
    const diff = {
      changedFiles: modifiedFiles.filter((f) => existingPaths.has(f.path + f.name)).map((f) => f.path + f.name),
      createdFiles: modifiedFiles.filter((f) => !existingPaths.has(f.path + f.name)).map((f) => f.path + f.name),
      deletedFiles: deletedPaths,
    };

    // ── V5.5: Registry Health V2 ───────────────────────────────────────────
    const preservedComponents = lockedComponents.filter(cat => {
      const catFiles = registryFileMap[cat] ?? [];
      return catFiles.length > 0 && catFiles.every(fp =>
        !diff.changedFiles.includes(fp) && !diff.deletedFiles.includes(fp)
      );
    });
    const replacedComponents = lockedComponents.filter(cat => {
      const catFiles = registryFileMap[cat] ?? [];
      return catFiles.some(fp => diff.changedFiles.includes(fp));
    });
    const editSafetyScore = lockedComponents.length > 0
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
      modifiedSections: diff.changedFiles.map(fp => {
        for (const [cat, files] of Object.entries(registryFileMap)) {
          if (files.includes(fp)) return cat;
        }
        return null;
      }).filter(Boolean),
    });
    console.log(`[V5.5] Registry Health V2: safety=${editSafetyScore}% preserved=${preservedComponents.length} replaced=${replacedComponents.length}`);

    sse(res, {
      type: "edit_identified",
      modifiedCount: modifiedFiles.length,
      deletedCount: deletedPaths.length,
      files: modifiedFiles.map((f) => f.path + f.name),
    });

    sse(res, { type: "step", step: 4, agent: "Merge Engine", status: "done" });

    sse(res, {
      type: "edit_done",
      files: mergedFiles,
      diff,
      intentResult,
    });

    res.end();
  } catch (e: any) {
    console.error("[EditAgent V5] Error:", e);
    sse(res, { type: "error", error: e.message });
    res.end();
  }
});

// ── V6.1: RUNTIME REPAIR & SELF-HEALING ENGINE ───────────────────────────────
function resolveAffectedFilesFromGraph(
  error: { file: string; message: string },
  files: ProjectFileSSE[],
  knowledgeGraph?: any
): string[] {
  const result: string[] = [];

  const directFile = files.find(f =>
    f.name === error.file ||
    (f.path + f.name).includes(error.file) ||
    (error.file && error.file.includes(f.name))
  );
  if (directFile) result.push(directFile.path + directFile.name);

  if (knowledgeGraph && directFile) {
    const baseName = directFile.name.replace(/\.(tsx?|jsx?)$/, '');
    const usedBy = (knowledgeGraph.components ?? [])
      .filter((c: any) => c.name === baseName || (c.usedBy ?? []).includes(baseName))
      .flatMap((c: any) => [c.file, ...(c.usedBy ?? [])]);
    for (const fp of usedBy) {
      const f = files.find(fi => fi.path + fi.name === fp || fi.name === fp);
      if (f && !result.includes(f.path + f.name)) result.push(f.path + f.name);
    }
  }

  if (result.length === 0) {
    const appFile = files.find(f => f.name === 'App.tsx');
    if (appFile) result.push(appFile.path + appFile.name);
  }

  return result;
}

router.post("/agents/runtime-repair", async (req, res) => {
  const groqKey = process.env["GROQ_API_KEY"];
  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });

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
    knowledgeGraph?: any;
    lockedComponents?: string[];
    chatId?: string;
  };

  if (!files || !error) return res.status(400).json({ error: "files and error required" });

  if (repairAttempt >= 3) {
    return res.status(200).json({ files, repaired: false, message: "Max repair attempts (3) reached" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const maxLoopAttempts = 3 - repairAttempt;
  const startTime = Date.now();

  try {
    sse(res, {
      type: "repair_start",
      attempt: repairAttempt + 1,
      maxAttempts: 3,
      errorMessage: error.message?.slice(0, 200) ?? "Unknown error",
    });

    const classified = classifyRuntimeError(error);
    sse(res, {
      type: "repair_classify",
      category: classified.category,
      confidence: classified.confidence,
      hint: classified.hint,
    });
    console.log(`[RuntimeRepair V6.1] category="${classified.category}" confidence=${classified.confidence}%`);

    const allAffected = resolveAffectedFilesFromGraph(error, files, knowledgeGraph);

    const lockedFilePaths = new Set<string>();
    for (const cat of lockedComponents) {
      const catLower = cat.toLowerCase();
      for (const f of files) {
        const fp = f.path + f.name;
        if (f.name.toLowerCase().includes(catLower) || fp.toLowerCase().includes(catLower)) {
          lockedFilePaths.add(fp);
        }
      }
    }

    const safeAffected = allAffected.filter(fp => !lockedFilePaths.has(fp));
    sse(res, {
      type: "repair_targets",
      affectedFiles: safeAffected,
      totalResolved: allAffected.length,
      skippedLocked: allAffected.length - safeAffected.length,
    });
    console.log(`[RuntimeRepair V6.1] targets=${safeAffected.length} locked_skipped=${lockedFilePaths.size}`);

    let currentFiles = [...files];
    let repairedSuccessfully = false;
    let lastRepairedFile = '';
    let lastQualityScore = 0;
    const repairStrategy = REPAIR_PROMPTS[classified.category];

    for (let loop = 0; loop < maxLoopAttempts && !repairedSuccessfully; loop++) {
      const attemptNumber = repairAttempt + loop + 1;

      sse(res, {
        type: "repair_generate",
        attempt: attemptNumber,
        category: classified.category,
        strategy: classified.hint ?? '',
      });

      const failingFile = currentFiles.find(f =>
        f.name === error.file ||
        (f.path + f.name).includes(error.file) ||
        (error.file && error.file.includes(f.name))
      ) ?? currentFiles.find(f => f.name === 'App.tsx');

      if (!failingFile) {
        sse(res, { type: "repair_failed", reason: `File "${error.file}" not found`, attempt: attemptNumber });
        break;
      }

      if (lockedFilePaths.has(failingFile.path + failingFile.name)) {
        sse(res, { type: "repair_failed", reason: `"${failingFile.name}" is locked`, attempt: attemptNumber });
        break;
      }

      const depContext = currentFiles
        .filter(f =>
          (f.lang === 'tsx' || f.lang === 'ts') &&
          f !== failingFile &&
          (safeAffected.includes(f.path + f.name) || f.name === 'App.tsx')
        )
        .slice(0, 3)
        .map(f => `// ${f.path}${f.name}\n${f.content.slice(0, 500)}`)
        .join('\n\n');

      const repairSystem = `You are NexoGen Runtime Repair Agent V6.1 — precision surgical code repair.
Error Category: ${classified.category.toUpperCase()} (attempt ${loop + 1}/${maxLoopAttempts})

REPAIR STRATEGY:
${repairStrategy}

MANDATORY SAFE CODING RULES:
- Replace arr.map(…) with (Array.isArray(arr) ? arr : []).map(…)
- Replace obj.prop with obj?.prop for all nullable access
- Replace useState() with typed defaults: useState([]), useState({}), useState(null)
- Add prop defaults: function Comp({ items = [], title = '' })
- NEVER call hooks conditionally or inside loops

Return ONLY the complete corrected file. No markdown, no explanation, no truncation.`;

      const repairPrompt = `Error (${classified.category}): "${error.message}"
${error.stack ? `Stack: ${error.stack.slice(0, 500)}` : ''}
${error.component ? `Component: ${error.component.slice(0, 200)}` : ''}

FILE TO REPAIR (${failingFile.name}):
${failingFile.content}
${depContext ? `\nCONTEXT FILES:\n${depContext}` : ''}

Return the complete repaired file:`;

      const repairedRaw = await callGroq(
        groqKey, REPAIR_MODEL,
        [{ role: "system", content: repairSystem }, { role: "user", content: repairPrompt }],
        false, 3000
      );

      sse(res, { type: "repair_apply", attempt: attemptNumber, file: failingFile.name });

      if (repairedRaw && repairedRaw.trim().length > 80) {
        const cleaned = repairedRaw
          .replace(/^```[a-z]*\r?\n?/im, '')
          .replace(/\r?\n?```$/m, '')
          .trim();

        currentFiles = currentFiles.map(f => f === failingFile ? { ...f, content: cleaned } : f);
        lastRepairedFile = failingFile.name;

        const qualityScore = computeRepairQuality(cleaned, failingFile.content, classified.category);
        lastQualityScore = qualityScore;

        sse(res, {
          type: "repair_validate",
          score: qualityScore,
          passed: qualityScore >= 80,
          attempt: attemptNumber,
          file: failingFile.name,
          checks: {
            hasCode: cleaned.includes('function') || cleaned.includes('const') || cleaned.includes('=>'),
            noMarkdown: !cleaned.includes('```'),
            hasReturn: cleaned.includes('return'),
            sizeRatio: Math.round((cleaned.length / Math.max(1, failingFile.content.length)) * 100),
          },
        });
        console.log(`[RuntimeRepair V6.1] attempt=${attemptNumber} quality=${qualityScore} file=${failingFile.name}`);

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
        sse(res, { type: "repair_failed", reason: "Repair agent returned insufficient output", attempt: attemptNumber });
      }
    }

    if (chatId) {
      runtimeManager.addRepairRecord(chatId, {
        id: `repair-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: startTime,
        errorType: classified.category,
        errorMessage: (error.message ?? '').slice(0, 200),
        filesChanged: repairedSuccessfully ? [lastRepairedFile] : [],
        attempt: repairAttempt + 1,
        success: repairedSuccessfully,
        qualityScore: lastQualityScore,
        duration: Date.now() - startTime,
      });
    }

    const repairMetrics = chatId ? runtimeManager.getRepairMetrics(chatId) : null;

    sse(res, {
      type: "repair_complete",
      repaired: repairedSuccessfully,
      totalAttempts: repairAttempt + 1,
      category: classified.category,
      file: lastRepairedFile,
      qualityScore: lastQualityScore,
      duration: Date.now() - startTime,
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

    res.end();
  } catch (e: any) {
    console.error("[RuntimeRepair V6.1] Error:", e);
    sse(res, { type: "error", error: e.message ?? "Runtime repair failed" });
    res.end();
  }
});

// GET /agents/repair-history/:chatId
router.get("/agents/repair-history/:chatId", (req, res) => {
  const { chatId } = req.params;
  const history = runtimeManager.getRepairHistory(chatId);
  const metrics = runtimeManager.getRepairMetrics(chatId);
  const healthV2 = runtimeManager.computeHealthV2(runtimeManager.getState(chatId));
  res.json({ history, metrics, healthV2 });
});

// ── NexoGen V5.6: Template Marketplace API ────────────────────────────────────
router.get("/agents/templates", (_req, res) => {
  res.json({ templates: TEMPLATE_LIBRARY_SERVER });
});

router.get("/agents/templates/:id", (req, res) => {
  const template = TEMPLATE_LIBRARY_SERVER.find(t => t.id === req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  return res.json({ template });
});

router.post("/agents/templates/match", (req, res) => {
  const { prompt } = req.body as { prompt: string };
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const result = serverMatchTemplate(prompt);
  const allResults = TEMPLATE_LIBRARY_SERVER.map(t => {
    const lower = prompt.toLowerCase();
    let score = 0;
    for (const kw of TEMPLATE_MATCH_KEYWORDS[t.id] ?? []) { if (lower.includes(kw)) score += kw.split(' ').length > 1 ? 20 : 10; }
    return { templateId: t.id, confidence: Math.min(99, Math.max(10, 50 + score * 3)), template: t };
  }).sort((a, b) => b.confidence - a.confidence);
  return res.json({ best: result, all: allResults });
});

router.post("/agents/templates/preview", (req, res) => {
  const { templateId } = req.body as { templateId: string };
  const template = TEMPLATE_LIBRARY_SERVER.find(t => t.id === templateId);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  const pages = template.pages.length;
  const apis = template.apis.length;
  const tables = template.databaseTables.length;
  const overallScore = Math.round(
    (Math.min(100, pages * 10) * 0.3) + (Math.min(100, (apis / 8) * 100) * 0.35) + (Math.min(100, (tables / 8) * 100) * 0.35)
  );
  return res.json({ template, health: { overallScore, passed: overallScore >= 70, pages, apis, tables }, context: buildTemplateContextServer(template) });
});

router.post("/agents/templates/merge", (req, res) => {
  const { templateIds, weights } = req.body as { templateIds: string[]; weights?: Record<string, number> };
  if (!templateIds?.length) return res.status(400).json({ error: 'templateIds required' });
  const templates = templateIds.map(id => TEMPLATE_LIBRARY_SERVER.find(t => t.id === id)).filter(Boolean) as typeof TEMPLATE_LIBRARY_SERVER;
  if (!templates.length) return res.status(404).json({ error: 'No templates found' });
  const totalWeight = templateIds.reduce((acc, id) => acc + (weights?.[id] ?? 50), 0);
  const templateDna: Record<string, number> = {};
  for (const id of templateIds) templateDna[id] = Math.round(((weights?.[id] ?? 50) / totalWeight) * 100);
  const merged = {
    pages: [...new Set(templates.flatMap(t => t.pages))],
    routes: [...new Set(templates.flatMap(t => t.routes))],
    apis: [...new Set(templates.flatMap(t => t.apis))],
    databaseTables: [...new Set(templates.flatMap(t => t.databaseTables))],
    features: [...new Set(templates.flatMap(t => t.features))],
    authRequired: templates.some(t => t.authRequired),
    templateDna,
  };
  const dnaStr = Object.entries(merged.templateDna).map(([id, pct]) => `${id} (${pct}%)`).join(' + ');
  const context = `HYBRID TEMPLATE DNA: ${dnaStr}\nMerged architecture:\n- Pages: ${merged.pages.join(', ')}\n- APIs: ${merged.apis.join(', ')}\n- Database Tables: ${merged.databaseTables.join(', ')}\n- Features: ${merged.features.join(', ')}`;
  return res.json({ merged, context });
});

// ── V6.2: AUTONOMOUS RUNTIME BUILDER ─────────────────────────────────────────
router.post("/agents/autonomous-build", async (req, res) => {
  const groqKey = process.env["GROQ_API_KEY"];
  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });

  const {
    chatId,
    files: rawFiles = [],
    resolvedDeps: rawResolvedDeps,
  } = req.body as {
    chatId?: string;
    files: Array<{ name: string; content: string; lang: string; path?: string }>;
    resolvedDeps?: { packages: string[]; devPackages: string[]; packageJson: string; warnings: string[] };
  };

  if (!rawFiles.length) return res.status(400).json({ error: "files required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sseAB = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const resolvedDeps = rawResolvedDeps ?? { packages: [], devPackages: [], packageJson: '{}', warnings: [] };
    let workingFiles = rawFiles.map(f => ({ ...f }));

    const cid = chatId ?? `anon-${Date.now()}`;
    runtimeManager.initTimeline(cid);

    // ── Phase 1: Dependency Intelligence ──────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "deps", label: "Dependency Intelligence Engine" });
    const depGraph = buildRuntimeDependencyGraph(workingFiles, resolvedDeps);
    runtimeManager.addTimelineEvent(cid, { phase: 'deps', label: 'Dependency Intelligence', status: depGraph.healthScore >= 80 ? 'pass' : 'warn', score: depGraph.healthScore, detail: `${depGraph.totalImports} imports, ${depGraph.totalComponents} components, ${depGraph.totalRoutes} routes` });
    sseAB({
      type: "dependency_plan",
      depGraph,
      summary: {
        imports: `${depGraph.resolvedImports}/${depGraph.totalImports} resolved`,
        components: `${depGraph.resolvedComponents}/${depGraph.totalComponents} resolved`,
        routes: `${depGraph.resolvedRoutes}/${depGraph.totalRoutes} resolved`,
        packages: `${depGraph.resolvedPackages}/${depGraph.totalPackages} resolved`,
        health: depGraph.healthScore,
        injected: depGraph.injectedImports,
      }
    });
    console.log(`[AutonomousBuild] Dep graph — health:${depGraph.healthScore} imports:${depGraph.totalImports} components:${depGraph.totalComponents} routes:${depGraph.totalRoutes}`);

    // ── Phase 2: Import Resolver ───────────────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "imports", label: "Import Resolver" });
    const { resolutions: importResolutions, patchedFiles: afterImports } = resolveImports(workingFiles, resolvedDeps);
    workingFiles = afterImports;
    const autoInjected = importResolutions.filter(r => r.autoInjected).length;
    runtimeManager.addTimelineEvent(cid, { phase: 'imports', label: 'Import Resolver', status: autoInjected > 0 ? 'warn' : 'pass', score: undefined, detail: `${autoInjected} imports auto-injected` });
    sseAB({ type: "imports_resolved", resolutions: importResolutions.slice(0, 50), autoInjected, total: importResolutions.length });

    // ── Phase 3: Component Resolver ────────────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "components", label: "Component Resolver" });
    const { resolutions: compResolutions } = resolveComponents(workingFiles);
    const missingComps = compResolutions.filter(c => !c.resolved).length;
    runtimeManager.addTimelineEvent(cid, { phase: 'components', label: 'Component Resolver', status: missingComps > 0 ? 'warn' : 'pass', detail: `${missingComps} unresolved components` });
    sseAB({ type: "components_resolved", resolutions: compResolutions.slice(0, 50), missing: missingComps, total: compResolutions.length });

    // ── Phase 4: Route Resolver ────────────────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "routes", label: "Route Resolver" });
    const { resolutions: routeResolutions } = resolveRoutes(workingFiles);
    const missingRoutes = routeResolutions.filter(r => !r.resolved).length;
    runtimeManager.addTimelineEvent(cid, { phase: 'routes', label: 'Route Resolver', status: missingRoutes > 0 ? 'warn' : 'pass', detail: `${routeResolutions.length} routes, ${missingRoutes} missing` });
    sseAB({ type: "routes_resolved", resolutions: routeResolutions, missing: missingRoutes, total: routeResolutions.length });

    // ── Phase 5: Package Resolver ──────────────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "packages", label: "Package Resolver" });
    const pkgResolutions = resolvePackages(workingFiles, resolvedDeps);
    const missingPkgs = pkgResolutions.filter(p => !p.inResolved).length;
    runtimeManager.addTimelineEvent(cid, { phase: 'packages', label: 'Package Resolver', status: missingPkgs > 0 ? 'warn' : 'pass', detail: `${pkgResolutions.length} detected, ${missingPkgs} missing from resolved` });
    sseAB({ type: "packages_resolved", resolutions: pkgResolutions, missing: missingPkgs, total: pkgResolutions.length });

    // ── Phase 6: Runtime Sandbox ───────────────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "sandbox", label: "Runtime Sandbox Validation" });
    let sandboxResult = validateFiles(workingFiles as Array<{ name: string; content: string; lang: string }>);
    runtimeManager.addTimelineEvent(cid, {
      phase: 'sandbox',
      label: 'Runtime Sandbox',
      status: sandboxResult.passed ? 'pass' : 'fail',
      score: sandboxResult.score,
      detail: `${sandboxResult.filesPassed}/${sandboxResult.filesChecked} files passed`,
    });
    sseAB({ type: "sandbox_result", passed: sandboxResult.passed, runtimeScore: sandboxResult.score, filesPassed: sandboxResult.filesPassed, filesChecked: sandboxResult.filesChecked, errors: sandboxResult.errors.slice(0, 5) });

    // ── Phase 7: Autonomous Build Loop (max 5 passes, stop at ≥95) ────────────
    sseAB({ type: "autonomous_phase", phase: "loop", label: "Autonomous Build Loop" });
    const MAX_AUTO_PASSES = 5;
    const PASS_TARGET = 95;
    const REPAIR_SYSTEM_AB = 'You are a React JSX repair agent. Fix ONLY the reported issues. Return the COMPLETE corrected file — no markdown fences, no explanation, no truncation.';
    let passScores: number[] = [];
    let currentHealth = sandboxResult.score;

    for (let pass = 0; pass < MAX_AUTO_PASSES; pass++) {
      const failures = workingFiles.filter(f =>
        (f.lang === 'tsx' || f.lang === 'jsx') &&
        f.name !== 'main.tsx' &&
        !validateFiles([f] as Array<{ name: string; content: string; lang: string }>).passed
      );

      if (failures.length === 0 && currentHealth >= PASS_TARGET) {
        passScores.push(currentHealth);
        runtimeManager.addTimelineEvent(cid, { phase: `loop_pass_${pass + 1}`, label: `Pass ${pass + 1} — Target reached`, status: 'pass', score: currentHealth });
        sseAB({ type: "autonomous_build_pass", pass: pass + 1, health: currentHealth, repairedCount: 0, status: "target_reached", passScores });
        break;
      }

      if (failures.length === 0) {
        passScores.push(currentHealth);
        runtimeManager.addTimelineEvent(cid, { phase: `loop_pass_${pass + 1}`, label: `Pass ${pass + 1} — No failures`, status: 'pass', score: currentHealth });
        sseAB({ type: "autonomous_build_pass", pass: pass + 1, health: currentHealth, repairedCount: 0, status: "no_failures", passScores });
        break;
      }

      sseAB({ type: "autonomous_build_pass", pass: pass + 1, health: currentHealth, repairedCount: failures.length, status: "repairing", passScores });
      let repairedCount = 0;

      await Promise.all(failures.slice(0, 4).map(async (file) => {
        const validation = validateFiles([file] as Array<{ name: string; content: string; lang: string }>);
        const issues = validation.errors.slice(0, 3).map(e => e.message).join('; ') || 'JSX/syntax errors';
        try {
          const repaired = await callGroq(groqKey, REPAIR_MODEL,
            [
              { role: 'system', content: REPAIR_SYSTEM_AB },
              { role: 'user', content: `File: ${file.name}\nIssues: ${issues}\n\nFull file:\n${file.content.slice(0, 3000)}` },
            ],
            false, 1500
          );
          if (repaired && repaired.length > 80) {
            const cleaned = repaired.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
            if (cleaned.length > file.content.length * 0.3) {
              file.content = cleaned;
              repairedCount++;
            }
          }
        } catch (e) {
          console.error(`[AutonomousBuild:pass${pass + 1}] repair failed for ${file.name}:`, e);
        }
      }));

      const postRepair = validateFiles(workingFiles as Array<{ name: string; content: string; lang: string }>);
      currentHealth = postRepair.score;
      passScores.push(currentHealth);

      runtimeManager.addTimelineEvent(cid, {
        phase: `loop_pass_${pass + 1}`,
        label: `Pass ${pass + 1} — ${repairedCount} files repaired`,
        status: currentHealth >= PASS_TARGET ? 'pass' : currentHealth >= 80 ? 'warn' : 'fail',
        score: currentHealth,
        detail: `${repairedCount}/${failures.length} repaired`,
      });
      sseAB({ type: "autonomous_build_pass", pass: pass + 1, health: currentHealth, repairedCount, status: currentHealth >= PASS_TARGET ? "target_reached" : "pass_complete", passScores });
      sandboxResult = postRepair;

      if (currentHealth >= PASS_TARGET) break;
    }

    const tl = runtimeManager.getTimeline(cid);
    if (tl) tl.totalPasses = passScores.length;

    // ── Phase 8: Compute RuntimeHealthV3 ──────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "health", label: "Runtime Health V3" });
    const runtimeStateForV3 = runtimeManager.getState(cid);
    const healthV3 = runtimeManager.computeHealthV3(runtimeStateForV3, depGraph);
    if (currentHealth > 0) {
      const blendedOverall = Math.round((healthV3.overall * 0.6) + (currentHealth * 0.4));
      (healthV3 as { overall: number }).overall = Math.min(100, blendedOverall);
    }

    runtimeManager.addTimelineEvent(cid, { phase: 'health_v3', label: 'Runtime Health V3', status: healthV3.overall >= 90 ? 'pass' : healthV3.overall >= 70 ? 'warn' : 'fail', score: healthV3.overall });
    sseAB({ type: "runtime_health_v3", healthV3, passScores, finalHealth: healthV3.overall });
    console.log(`[AutonomousBuild] HealthV3 overall:${healthV3.overall} compile:${healthV3.compile} runtime:${healthV3.runtime} imports:${healthV3.imports} packages:${healthV3.packages} components:${healthV3.components}`);

    // ── Phase 9: Runtime Timeline ──────────────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "timeline", label: "Runtime Timeline" });
    const finalTimeline = runtimeManager.finalizeTimeline(cid, healthV3.overall);
    if (finalTimeline) {
      sseAB({ type: "runtime_timeline", timeline: finalTimeline });
    }

    // ── Phase 10: Autonomous Preview Gate ─────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "gate", label: "Preview Gate" });
    const gatePass = healthV3.overall >= 90;

    if (!gatePass) {
      const criticalFiles = workingFiles.filter(f =>
        (f.lang === 'tsx' || f.lang === 'jsx') &&
        !validateFiles([f] as Array<{ name: string; content: string; lang: string }>).passed
      );
      if (criticalFiles.length > 0) {
        sseAB({ type: "preview_gate_fail", health: healthV3.overall, threshold: 90, repairingFiles: criticalFiles.length });
        await Promise.all(criticalFiles.slice(0, 3).map(async (file) => {
          try {
            const repaired = await callGroq(groqKey, REPAIR_MODEL,
              [
                { role: 'system', content: REPAIR_SYSTEM_AB },
                { role: 'user', content: `CRITICAL: Fix ALL errors in this file for production preview.\nFile: ${file.name}\n\nFull file:\n${file.content.slice(0, 3000)}` },
              ],
              false, 1500
            );
            if (repaired && repaired.length > 80) {
              const cleaned = repaired.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
              if (cleaned.length > file.content.length * 0.3) file.content = cleaned;
            }
          } catch { /* best effort */ }
        }));
        const afterGate = validateFiles(workingFiles as Array<{ name: string; content: string; lang: string }>);
        healthV3.overall = Math.min(100, Math.round((healthV3.overall * 0.6) + (afterGate.score * 0.4)));
        runtimeManager.addTimelineEvent(cid, { phase: 'gate', label: 'Preview Gate — Repaired', status: healthV3.overall >= 90 ? 'pass' : 'warn', score: healthV3.overall });
        sseAB({ type: "preview_gate_repaired", health: healthV3.overall, gatePass: healthV3.overall >= 90 });
      } else {
        sseAB({ type: "preview_gate_fail", health: healthV3.overall, threshold: 90, repairingFiles: 0 });
      }
    } else {
      runtimeManager.addTimelineEvent(cid, { phase: 'gate', label: 'Preview Gate — Passed', status: 'pass', score: healthV3.overall });
      sseAB({ type: "preview_gate_pass", health: healthV3.overall });
    }

    sseAB({
      type: "autonomous_build_done",
      chatId: cid,
      healthV3,
      depGraph,
      passScores,
      timeline: runtimeManager.getTimeline(cid),
      gatePass: healthV3.overall >= 90,
      files: workingFiles,
    });

    console.log(`[AutonomousBuild] Done — final health:${healthV3.overall} passes:${passScores.length} gate:${healthV3.overall >= 90}`);

  } catch (err: any) {
    sseAB({ type: "autonomous_build_error", error: err?.message ?? "Autonomous build failed" });
  }

  res.end();
});

export default router;
