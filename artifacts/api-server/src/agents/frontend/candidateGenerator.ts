// ── V7.2.0 Design Candidate Generator — Phase 1–3 ────────────────────────────
// Generates Candidates B (design-forward) and C (experimental) in parallel.
// Candidate A is the existing FrontendOutput from runFrontendStep.
// All candidates share the same DNA, RAG context, registry selection.
// Only the codegen layout directive varies — brand/content never changes.

import { callAI } from "../llm/aiService.js";
import { CODEFIX_SYSTEM } from "../llm/prompts.js";
import { buildCodeSystem } from "../frontend/codeSystem.js";
import { buildServerProjectFiles } from "../frontend/frontendAgent.js";
import { truncateForGroq } from "../../contextManager.js";
import type { ProjectFileSSE } from "../types.js";
import type { FrontendOutput, PipelineKeys } from "../pipeline/pipelineTypes.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("CandidateGenerator");

// ── Variant directives ────────────────────────────────────────────────────────
// Each directive is appended to the codegenUserPrompt as a layout instruction.
// It varies layout style, hero variant, card layout, and CTA structure.
// It must NOT vary business content, brand colours, or DNA tokens.

const VARIANT_DIRECTIVES: Record<'B' | 'C', string> = {
  B: `
LAYOUT VARIANT: Design-forward — maximise visual impact.
- HERO: prefer split-layout (copy left, product visual right) or large-visual with product mockup.
- FEATURES: use bento grid or 2+1 asymmetric card arrangement instead of a plain 3-col grid.
- SECTIONS: apply stronger visual contrast between alternating sections (alternate light/dark backgrounds).
- CTA: use a full-width banner with a high-contrast background colour.
- TYPOGRAPHY: increase heading scale; apply gradient text on the primary <h1>.
- DECORATION: add one decorative element (gradient blob, mesh, or subtle pattern) behind the hero.
Do NOT change the business copy, brand colour tokens, or DNA values. Layout only.`.trim(),

  C: `
LAYOUT VARIANT: Experimental — maximise layout diversity and hierarchy.
- HERO: full-viewport centered with minimal decoration, very large text scale (h1 ≥ 72px equivalent).
- FEATURES: alternating left-right split layout for each feature row (text left on odd, right on even).
- CTA: embed a compact inline CTA card directly after the features section (in addition to the main CTA).
- TYPOGRAPHY: aggressive heading hierarchy — major headings dominate, body text is restrained.
- CARD LAYOUT: use horizontal cards with icon on the left and copy on the right where applicable.
- SPACING: increase vertical whitespace between major sections for editorial feel.
Do NOT change the business copy, brand colour tokens, or DNA values. Layout only.`.trim(),
};

// ── Internal: generate one candidate from a variant directive ─────────────────

async function generateVariantCandidate(
  candidateLabel: 'B' | 'C',
  frontend: FrontendOutput,
  prompt: string,
  keys: PipelineKeys,
): Promise<FrontendOutput> {
  const { openrouterKey } = keys;
  const { design, architecture, registrySelection, retrievalContext, retrievalReferenceIds } = frontend;
  const { plan, projectBlueprint } = architecture;
  const { blueprint, cleanPlan } = plan;

  const sectionCount = blueprint.sectionOrder.length;
  const directive = VARIANT_DIRECTIVES[candidateLabel];

  const isMultiPageApp = projectBlueprint.pages.length > 1;

  const baseUserPrompt = isMultiPageApp
    ? `Build a ${projectBlueprint.projectType} with these pages: ${projectBlueprint.pages.join(', ')}.\n\nPrompt: ${prompt}\nPlan: ${cleanPlan}\n\nApply the design DNA above to ALL pages. Do not truncate.`
    : `Build a complete landing page for: ${prompt}\n\nPlan context:\n${cleanPlan}\n\nBUILD EXACTLY ${sectionCount} SECTIONS in this order: ${blueprint.sectionOrder.join(' → ')}. Apply the design DNA precisely. Do not truncate.`;

  const variantUserPrompt = `${baseUserPrompt}\n\n${directive}`;

  const componentContext = '';

  const systemContent = retrievalContext
    ? `${buildCodeSystem(design, blueprint, componentContext, projectBlueprint, registrySelection)}\n\n${retrievalContext}`
    : buildCodeSystem(design, blueprint, componentContext, projectBlueprint, registrySelection);

  let generatedCode = '';
  try {
    generatedCode = await callAI(
      openrouterKey,
      [
        { role: 'system', content: systemContent },
        { role: 'user',   content: variantUserPrompt },
      ],
      { label: `codegen:candidate${candidateLabel}`, maxTokens: 8000 }
    );
    generatedCode = generatedCode
      .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();
  } catch (e) {
    log.error(`CANDIDATE_${candidateLabel}_CODEGEN_FAILED`, { error: String(e) });
    generatedCode = frontend.fixedCode; // fall back to candidate A's code
  }

  // Code-fix pass
  let fixedCode = generatedCode;
  try {
    const codeFix_userRaw = `Fix this React website code (keep all ${sectionCount} sections intact — do NOT add or remove any sections):\n\n${generatedCode}`;
    const { system: cfSystem, user: cfUser } = truncateForGroq(CODEFIX_SYSTEM, codeFix_userRaw, 5_000);
    const fixed = await callAI(
      openrouterKey,
      [{ role: 'system', content: cfSystem }, { role: 'user', content: cfUser }],
      { label: `codefix:candidate${candidateLabel}`, maxTokens: 5_000 }
    );
    if (fixed && fixed.length > 200) {
      fixedCode = fixed
        .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();
    }
  } catch (e) {
    log.warn(`CANDIDATE_${candidateLabel}_CODEFIX_FAILED`, { error: String(e) });
  }

  const projectFiles = buildServerProjectFiles(fixedCode, projectBlueprint, blueprint.sectionOrder);

  log.info(`CANDIDATE_${candidateLabel}_GENERATED`, {
    chars: fixedCode.length,
    files: projectFiles.length,
  });

  return {
    ...frontend,
    fixedCode,
    projectFiles: projectFiles as ProjectFileSSE[],
    retrievalReferenceIds, // same as candidate A (same RAG retrieval)
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface GeneratedCandidates {
  candidates: FrontendOutput[]; // 1–3 candidates depending on requested count
  generationMs: number;
}

/**
 * V9.0: `count` comes from RuntimeIntelligence's CandidateStrategy —
 * Fast/Safe modes request 1 (skip B/C generation entirely, saving 2 LLM
 * calls), Balanced requests 2 (B only), Quality/Enterprise/Strict/
 * Experimental/Creative request 3 (B+C, the max variant set currently
 * authored — CandidateCount 5 is capped to 3 until D/E directives exist).
 */
export async function generateCandidates(
  candidateA: FrontendOutput,
  prompt: string,
  keys: PipelineKeys,
  count: 1 | 2 | 3 | 5 = 3,
): Promise<GeneratedCandidates> {
  const t0 = Date.now();

  if (count <= 1) {
    log.info('CANDIDATE_GENERATION_SKIPPED', { reason: 'runtime strategy requested single candidate' });
    return { candidates: [candidateA], generationMs: Date.now() - t0 };
  }

  if (count === 2) {
    log.info('CANDIDATE_GENERATION_START', { variant: 'B only' });
    const candidateB = await generateVariantCandidate('B', candidateA, prompt, keys);
    const generationMs = Date.now() - t0;
    log.info('CANDIDATE_GENERATION_DONE', { generationMs });
    return { candidates: [candidateA, candidateB], generationMs };
  }

  // count === 3 or 5 (capped to 3)
  log.info('CANDIDATE_GENERATION_START', { variant: 'B+C parallel' });

  const [candidateB, candidateC] = await Promise.all([
    generateVariantCandidate('B', candidateA, prompt, keys),
    generateVariantCandidate('C', candidateA, prompt, keys),
  ]);

  const generationMs = Date.now() - t0;
  log.info('CANDIDATE_GENERATION_DONE', { generationMs });

  return {
    candidates: [candidateA, candidateB, candidateC],
    generationMs,
  };
}
