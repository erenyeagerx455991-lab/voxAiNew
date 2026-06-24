// ── V7.3.1 Conversion Repair Agent ───────────────────────────────────────────
// Targeted repair guided by conversion issues only.
// Never alters business identity, DNA, or core content.

import { callAI } from "../llm/aiService.js";
import type { DesignDNA } from "../types.js";
import type { ConversionIssue } from "./conversionAnalyzer.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("ConversionRepairAgent");

const CONVERSION_REPAIR_SYSTEM = `You are a Conversion Rate Optimization (CRO) Repair Agent. You receive React JSX landing page code with specific conversion issues identified by a CRO specialist, and MUST fix ONLY those issues.

ABSOLUTE RULES:
1. Fix ONLY the listed conversion issues. Do NOT redesign, refactor, or improve anything else.
2. Do NOT remove sections, components, or JSX structure.
3. Do NOT alter business copy, product names, pricing figures, or metric numbers.
4. Do NOT change the DNA color scheme, fonts, or animation personality.
5. Return the COMPLETE corrected code — no markdown fences, no truncation, no explanation.
6. Each fix is the minimum change needed — add elements inline, do not restructure.
7. Trust signals: add a <p> or <div> with the suggested trust copy using existing text tokens.
8. CTA fixes: change variant prop or remove duplicate buttons — do not rewrite sections.
9. Pricing: add ring-2 and Badge("Most Popular") to the mid-tier card only.
10. Preserve all shadcn globals, Lucide icons, motion elements, and accessibility attributes.`;

export interface ConversionRepairInput {
  code:           string;
  issues:         ConversionIssue[];
  designDNA:      DesignDNA;
  openrouterKey:  string;
  conversionScore: number;
}

export interface ConversionRepairOutput {
  code:      string;
  attempted: boolean;
  error:     string | null;
}

export async function runConversionRepair(input: ConversionRepairInput): Promise<ConversionRepairOutput> {
  const { code, issues, designDNA, openrouterKey, conversionScore } = input;

  const prioritized = [
    ...issues.filter(i => i.severity === 'critical'),
    ...issues.filter(i => i.severity === 'major'),
    ...issues.filter(i => i.severity === 'minor'),
  ].slice(0, 5);

  if (prioritized.length === 0) return { code, attempted: false, error: null };

  const cs     = designDNA.colorSystem ?? {};
  const primary = cs.primary ?? designDNA.primaryColor ?? '#ffffff';
  const accent  = cs.accent  ?? designDNA.accentColor  ?? primary;
  const bg      = cs.background ?? designDNA.bgColor    ?? '#0a0a0a';
  const muted   = cs.textMuted ?? '#888888';

  const issueList = prioritized
    .map((issue, i) =>
      `${i + 1}. [${issue.category.toUpperCase()} / ${issue.severity.toUpperCase()}]\n   Problem: ${issue.message}\n   Fix: ${issue.suggestion}`
    ).join('\n\n');

  const userPrompt = `=== CRO REPAIR ===

Conversion Score: ${conversionScore}/10 (target ≥ 8.5)
Fix ONLY these ${prioritized.length} conversion issues:

${issueList}

=== DESIGN TOKENS (use when adding trust/CTA elements) ===
Primary text: ${primary}
Accent: ${accent}
Background: ${bg}
Muted text: ${muted}
Theme: ${designDNA.theme ?? 'dark'}
Button radius: ${designDNA.buttonStyle ?? 'rounded-lg'}

=== ABSOLUTE CONSTRAINTS ===
- Never change business copy, product names, or prices.
- Never restructure sections or remove existing components.
- Add trust signals as a short <p> or <div> immediately after the CTA button.
- Mark a pricing card as recommended with ring-2 ring-blue-500 + Badge.

Return the COMPLETE repaired code:

${code}`;

  try {
    const repaired = await callAI(
      openrouterKey,
      [
        { role: 'system', content: CONVERSION_REPAIR_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      { label: 'conversion-repair', maxTokens: 8000 }
    );

    if (!repaired || repaired.length < code.length * 0.5) {
      log.warn("CONVERSION_REPAIR_TOO_SHORT", { inputLen: code.length, outputLen: repaired?.length ?? 0 });
      return { code, attempted: true, error: `Conversion repair output too short — keeping original` };
    }

    const cleaned = repaired
      .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    log.info("CONVERSION_REPAIR_SUCCESS", { inputChars: code.length, outputChars: cleaned.length, issueCount: prioritized.length });
    return { code: cleaned, attempted: true, error: null };
  } catch (e) {
    const err = `Conversion repair failed: ${e instanceof Error ? e.message : String(e)}`;
    log.error("CONVERSION_REPAIR_FAILED", { error: err });
    return { code, attempted: true, error: err };
  }
}
