/**
 * V8.0 — Audit Agent
 *
 * Extracted from routes/agents.ts.  Provides a read-only design + architecture
 * audit of a prompt without executing the full build pipeline.
 *
 * Analyses:
 *   - Design DNA quality vs. default
 *   - Reference site routing accuracy
 *   - Section template selection
 *   - Architecture diversity score
 *   - Code generation prompt preview
 */

import { callAI } from "../llm/aiService.js";
import { PLANNER_SYSTEM, DESIGN_SYSTEM } from "../llm/prompts.js";
import { DESIGN_MODEL } from "../llm/llmClient.js";
import { DEFAULT_DESIGN, buildCodeSystem } from "../frontend/codeSystem.js";
import { retrieveComponents } from "../../components/retrieval/retrieveComponents.js";
import { buildCompressedCatalogue } from "../../components/retrieval/buildRegistryContext.js";
import { getTemplatesByCategory, selectTemplatesForPrompt } from "../../components/registry.js";
import type { DesignDNA, PageBlueprint } from "../types.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("AuditAgent");

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuditAgentInput {
  prompt: string;
  openrouterKey: string;
}

export type AuditReport = Record<string, unknown>;

// ── Internal helpers ──────────────────────────────────────────────────────────

interface OpenRouterError extends Error {
  status?: number;
  requestId?: string;
  model?: string;
  body?: unknown;
}

const AUDIT_HERO_MAP: Record<string, string> = {
  stripe: "hero-centered-v1",
  linear: "hero-editorial-v1",
  vercel: "hero-asymmetric-v1",
  framer: "hero-bento-v1",
  notion: "hero-editorial-v1",
  cursor: "hero-asymmetric-v1",
};

const SECTION_EXPECTED_FEATURES: Record<string, string> = {
  stripe:  "features-stripe-v1",   paypal:   "features-stripe-v1",
  linear:  "features-editorial-v1", notion:  "features-editorial-v1",
  vercel:  "features-split-v1",    netlify:  "features-split-v1",
  framer:  "features-framer-v1",   webflow:  "features-framer-v1", figma: "features-framer-v1",
};

const SECTION_EXPECTED_DASHBOARD: Record<string, string> = {
  stripe:  "dashboard-revenue-v1",  paypal:  "dashboard-revenue-v1",
  linear:  "dashboard-kanban-v1",   notion:  "dashboard-kanban-v1",
  vercel:  "dashboard-vercel-v1",   netlify: "dashboard-vercel-v1",
  framer:  "dashboard-aiflow-v1",   webflow: "dashboard-aiflow-v1",
};

const SECTION_EXPECTED_PRICING: Record<string, string> = {
  stripe:  "pricing-comparison-v1", paypal:   "pricing-comparison-v1",
  linear:  "pricing-minimal-v1",    notion:   "pricing-minimal-v1",
  vercel:  "pricing-horizontal-v1", netlify:  "pricing-horizontal-v1",
  framer:  "pricing-cardstack-v1",  webflow:  "pricing-cardstack-v1", figma: "pricing-cardstack-v1",
};

const DNA_VERIFIERS: Record<string, (d: DesignDNA) => boolean> = {
  stripe: (d) => d.designLanguage === "premium-gradient" && d.heroStyle === "centered-gradient",
  linear: (d) => d.designLanguage === "minimal-flat" && d.heroStyle === "editorial-large",
  vercel:  (d) => d.designLanguage === "monochrome" && d.heroStyle === "split-layout",
};

// ── Execute Audit ─────────────────────────────────────────────────────────────

export async function executeAudit(input: AuditAgentInput): Promise<AuditReport> {
  const { prompt, openrouterKey } = input;

  const audit: AuditReport = {
    prompt,
    models: { primary: DESIGN_MODEL },
  };

  try {
    // ── Step 1: Planner ──────────────────────────────────────────────────────
    let planText = "";
    await callAI(
      openrouterKey,
      [{ role: "system", content: PLANNER_SYSTEM }, { role: "user", content: prompt }],
      {
        label: "audit-planner",
        maxTokens: 2500,
        stream: true,
        onToken: (token: string) => { planText += token; },
      },
    );
    audit["plannerOutput"] = { raw: planText };

    // Parse brief + references
    const briefMatch = planText.match(/---DESIGN_BRIEF---([\s\S]*?)---END_BRIEF---/);
    const briefText = briefMatch ? briefMatch[1]!.trim() : "";
    const refMatch = briefText.match(/referenceSites:\s*(.+)/);
    const referenceSites = refMatch ? refMatch[1]!.trim() : "none";

    let auditPrimaryRef = "none";
    const primaryRefMatch = briefText.match(/primaryReference:\s*(.+)/);
    if (primaryRefMatch) auditPrimaryRef = primaryRefMatch[1]!.trim();
    if (auditPrimaryRef === "none" && referenceSites !== "none") {
      auditPrimaryRef = referenceSites.split(",")[0]!.trim();
    }

    let auditSecondaryRefs: string[] = [];
    const secondaryMatch = briefText.match(/secondaryReferences:\s*(.+)/);
    if (secondaryMatch && secondaryMatch[1]!.trim() !== "none") {
      auditSecondaryRefs = secondaryMatch[1]!.trim().split(",").map((s) => s.trim());
    }

    const blueprintMatch = planText.match(/---PAGE_BLUEPRINT---([\s\S]*?)---END_BLUEPRINT---/);
    let blueprint: PageBlueprint = {
      websiteType: "Generic",
      sectionOrder: ["Navbar", "Hero", "Features", "CTA", "Footer"],
    };
    if (blueprintMatch) {
      try { blueprint = JSON.parse(blueprintMatch[1]!.trim()); } catch { /* use default */ }
    }

    (audit["plannerOutput"] as Record<string, unknown>)["brief"] = briefText;
    (audit["plannerOutput"] as Record<string, unknown>)["referenceSites"] = referenceSites;
    (audit["plannerOutput"] as Record<string, unknown>)["primaryReference"] = auditPrimaryRef;
    (audit["plannerOutput"] as Record<string, unknown>)["secondaryReferences"] = auditSecondaryRefs;
    (audit["plannerOutput"] as Record<string, unknown>)["blueprint"] = blueprint;

    // ── Step 2: Design Agent ─────────────────────────────────────────────────
    const designPrompt = [
      `Website brief:\n${briefText || prompt}`,
      `Website type: ${blueprint.websiteType}`,
      referenceSites !== "none" ? `Design references: ${referenceSites}` : "",
      `\nGenerate the complete design DNA JSON for this site.`,
    ].filter(Boolean).join("\n");

    audit["designAgentInput"] = {
      systemPromptLength: DESIGN_SYSTEM.length,
      userPrompt: designPrompt,
    };

    let designAgentRawOutput = "";
    let parsedDNA: Partial<DesignDNA> | null = null;
    let finalDNA: DesignDNA = { ...DEFAULT_DESIGN };
    let designAgentStatus = "not_run";
    let designAgentError: string | null = null;

    try {
      designAgentRawOutput = await callAI(
        openrouterKey,
        [
          { role: "system", content: DESIGN_SYSTEM },
          { role: "user", content: designPrompt },
        ],
        { label: "audit-design", maxTokens: 1500 },
      );
      designAgentStatus = "success";

      const jsonMatch = designAgentRawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedDNA = JSON.parse(jsonMatch[0]);
        finalDNA = { ...DEFAULT_DESIGN, ...(parsedDNA as DesignDNA) };
        if ((parsedDNA as Record<string, unknown>)["colorSystem"])
          finalDNA.colorSystem = { ...DEFAULT_DESIGN.colorSystem, ...(parsedDNA as Record<string, unknown>)["colorSystem"] as typeof DEFAULT_DESIGN.colorSystem };
        if ((parsedDNA as Record<string, unknown>)["typographySystem"])
          finalDNA.typographySystem = { ...DEFAULT_DESIGN.typographySystem, ...(parsedDNA as Record<string, unknown>)["typographySystem"] as typeof DEFAULT_DESIGN.typographySystem };
        if ((parsedDNA as Record<string, unknown>)["spacingSystem"])
          finalDNA.spacingSystem = { ...DEFAULT_DESIGN.spacingSystem, ...(parsedDNA as Record<string, unknown>)["spacingSystem"] as typeof DEFAULT_DESIGN.spacingSystem };
      } else {
        designAgentStatus = "parse_failed";
        designAgentError = "Model response contained no JSON object";
      }
    } catch (e) {
      designAgentStatus = "failed";
      const orErr = e as OpenRouterError;
      designAgentError = (e as Error).message;
      audit["designAgentError"] = {
        message: (e as Error).message,
        model: orErr.model ?? DESIGN_MODEL,
        status: orErr.status ?? null,
        requestId: orErr.requestId ?? null,
        body: orErr.body ?? null,
      };
    }

    // DNA diff
    type DnaPath = [keyof DesignDNA] | [keyof DesignDNA, string];
    const KEY_FIELDS: DnaPath[] = [
      ["designLanguage"], ["layoutStyle"], ["animationPersonality"],
      ["decorationLevel"], ["heroStyle"], ["cardStyle"],
      ["colorSystem", "background"], ["colorSystem", "surface"],
      ["colorSystem", "primary"], ["colorSystem", "accent"],
      ["colorSystem", "textMuted"], ["colorSystem", "border"],
      ["typographySystem", "headingWeight"], ["typographySystem", "scale"],
      ["spacingSystem", "sectionPadding"],
    ];

    const get = (obj: unknown, path: string[]): unknown =>
      path.reduce((o, k) => (o as Record<string, unknown>)?.[k], obj);

    const dnaDiff: Record<string, { default: unknown; actual: unknown; changed: boolean }> = {};
    for (const path of KEY_FIELDS) {
      const key = path.join(".");
      const def = get(DEFAULT_DESIGN, path as string[]);
      const act = get(finalDNA, path as string[]);
      dnaDiff[key] = { default: def, actual: act, changed: def !== act };
    }
    const changedFields = Object.values(dnaDiff).filter((v) => v.changed).length;

    audit["designAgentOutput"] = { raw: designAgentRawOutput, status: designAgentStatus, error: designAgentError };
    audit["parsedDNA"] = parsedDNA;
    audit["finalDNA"] = finalDNA;
    audit["dnaDiff"] = {
      fields: dnaDiff,
      changedFromDefault: changedFields,
      totalFields: KEY_FIELDS.length,
      collapsed: changedFields === 0,
    };

    // ── Step 3: Template + Component Routing ────────────────────────────────
    const selectedTemplates = selectTemplatesForPrompt(
      prompt,
      blueprint.sectionOrder,
      finalDNA,
      referenceSites,
      auditPrimaryRef,
    );
    const ragResult = await retrieveComponents(prompt, blueprint.sectionOrder, 15);
    const componentContext = buildCompressedCatalogue(ragResult);
    const codeGenSystemPrompt = buildCodeSystem(finalDNA, blueprint, componentContext);

    const ref = auditPrimaryRef.toLowerCase();
    const selectedHero     = selectedTemplates.find((t) => t.category === "hero")?.id ?? "none";
    const selectedFeatures = selectedTemplates.find((t: { category: string }) => t.category === "features")?.id ?? "none";
    const selectedDashboard= selectedTemplates.find((t: { category: string }) => t.category === "dashboard-preview")?.id ?? "none";
    const selectedPricing  = selectedTemplates.find((t: { category: string }) => t.category === "pricing")?.id ?? "none";

    const expectedHero     = AUDIT_HERO_MAP[ref] ?? "unknown";
    const expectedFeatures = SECTION_EXPECTED_FEATURES[ref] ?? "unknown";
    const expectedDashboard= SECTION_EXPECTED_DASHBOARD[ref] ?? "unknown";
    const expectedPricing  = SECTION_EXPECTED_PRICING[ref] ?? "unknown";

    const heroMatch      = expectedHero === "unknown"      || selectedHero === expectedHero;
    const featuresMatch  = selectedFeatures === "none"  ? null : (expectedFeatures === "unknown"  || selectedFeatures === expectedFeatures);
    const dashboardMatch = selectedDashboard === "none" ? null : (expectedDashboard === "unknown" || selectedDashboard === expectedDashboard);
    const pricingMatch   = selectedPricing === "none"   ? null : (expectedPricing === "unknown"   || selectedPricing === expectedPricing);

    const dnaVerifier = DNA_VERIFIERS[ref];
    const dnaPass = dnaVerifier ? dnaVerifier(finalDNA) : true;
    const validationStatus =
      heroMatch && dnaPass
        ? "pass"
        : !heroMatch
        ? "fail:hero_mismatch"
        : "fail:dna_mismatch";

    const activeChecks = (
      [heroMatch, featuresMatch, dashboardMatch, pricingMatch] as (boolean | null)[]
    ).filter((m) => m !== null) as boolean[];
    const matchPoints = activeChecks.filter(Boolean).length;
    const architectureMatchScore =
      activeChecks.length > 0 ? Math.round((matchPoints / activeChecks.length) * 100) : 100;

    audit["referenceRouting"] = {
      primaryReference: auditPrimaryRef,
      secondaryReferences: auditSecondaryRefs,
      selectedHero, selectedFeatures, selectedDashboard, selectedPricing,
      expectedHero, expectedFeatures, expectedDashboard, expectedPricing,
      heroMatch, featuresMatch, dashboardMatch, pricingMatch,
      architectureMatchScore, dnaPass, validationStatus,
    };

    // Architecture diversity
    const diversityCounts = {
      hero:         getTemplatesByCategory("hero").length,
      features:     getTemplatesByCategory("features").length,
      pricing:      getTemplatesByCategory("pricing").length,
      dashboard:    getTemplatesByCategory("dashboard-preview").length,
      navbar:       getTemplatesByCategory("navbar").length,
      bento:        getTemplatesByCategory("bento").length,
      cta:          getTemplatesByCategory("cta").length,
      faq:          getTemplatesByCategory("faq").length,
      testimonials: getTemplatesByCategory("testimonials").length,
    };
    const catScore = (n: number) => Math.min(100, Math.round((n / 6) * 100));
    const categoryScores: Record<string, number> = {};
    for (const [cat, count] of Object.entries(diversityCounts)) {
      categoryScores[cat] = catScore(count);
    }
    const overallArchitectureScore = Math.round(
      Object.values(categoryScores).reduce((a, b) => a + b, 0) /
        Object.values(categoryScores).length,
    );
    const routingMaps = ["hero", "features", "dashboard", "pricing", "navbar", "bento", "cta", "faq"];
    const routingCoverage = [heroMatch, featuresMatch, dashboardMatch, pricingMatch].filter(
      (m) => m !== null,
    ).length;

    audit["architectureDiversity"] = {
      templateCounts: diversityCounts,
      categoryScores,
      overallArchitectureScore,
      routingCoverage,
      routingMapsCount: routingMaps.length,
      target: 90,
      passing: overallArchitectureScore >= 90,
      note:
        overallArchitectureScore >= 90
          ? `PASS — system diversity ≥ 90 (${overallArchitectureScore})`
          : `FAIL — system diversity ${overallArchitectureScore} < 90 target. Low categories: ${Object.entries(categoryScores)
              .filter(([, s]) => s < 90)
              .map(([c, s]) => `${c}(${s})`)
              .join(", ")}`,
    };

    audit["codeGeneratorPrompt"] = {
      systemPromptLength: codeGenSystemPrompt.length,
      systemPromptPreview:
        codeGenSystemPrompt.slice(0, 1200) +
        (codeGenSystemPrompt.length > 1200 ? "\n...[truncated]" : ""),
      userPrompt: `Build a complete landing page for: ${prompt} — ${blueprint.sectionOrder.length} sections: ${blueprint.sectionOrder.join(" → ")}`,
      selectedTemplates: selectedTemplates.map((t) => t.id),
    };

    audit["summary"] = {
      referenceSites,
      designAgentStatus,
      dnaCollapsed: changedFields === 0,
      changedFieldsFromDefault: changedFields,
      dominantColor: finalDNA.colorSystem.primary,
      background: finalDNA.colorSystem.background,
      designLanguage: finalDNA.designLanguage,
      animationPersonality: finalDNA.animationPersonality,
    };

    log.info("AUDIT_COMPLETE", {
      ref: auditPrimaryRef,
      dnaStatus: designAgentStatus,
      architectureScore: overallArchitectureScore,
    });
  } catch (e) {
    const err = e as Error;
    audit["fatalError"] = err.message;
    log.error("AUDIT_FATAL_ERROR", { error: err.message });
  }

  return audit;
}
