// ── V7.3.0 Critic Repair Agent ────────────────────────────────────────────────
// Targeted repair pass guided by Design Critic issues only.
// Hard rules: never alter business content, DNA, or section structure.

import { callAI } from "../llm/aiService.js";
import type { DesignDNA } from "../types.js";
import type { CritiqueIssue } from "./designCritic.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("CriticRepairAgent");

const CRITIC_REPAIR_SYSTEM = `You are a Critic Repair Agent. You receive React JSX code with specific design quality issues identified by a senior product designer, and you MUST fix ONLY those issues.

ABSOLUTE RULES:
1. Fix ONLY the listed critic issues. Do NOT redesign, restructure, or improve anything else.
2. Do NOT remove any section functions, components, or JSX structure.
3. Do NOT alter business content, copy, product names, metric numbers, or pricing.
4. Do NOT change the DNA color scheme, fonts, or design language.
5. Return the COMPLETE corrected code — no markdown fences, no truncation, no explanation.
6. Each fix must be the minimal change needed to address the critic's feedback.
7. If adding elements (trust signals, badges, etc.), insert inline in the correct semantic location.
8. Preserve all shadcn globals, Lucide icons, Framer Motion elements, and accessibility attributes.
9. Critic repair is AESTHETIC only — layout structure, hierarchy, and trust signal placement.`;

export interface CriticRepairInput {
  code:           string;
  issues:         CritiqueIssue[];
  designDNA:      DesignDNA;
  openrouterKey:  string;
  criticScore:    number;
}

export interface CriticRepairOutput {
  code:      string;
  attempted: boolean;
  error:     string | null;
}

export async function runCriticRepair(input: CriticRepairInput): Promise<CriticRepairOutput> {
  const { code, issues, designDNA, openrouterKey, criticScore } = input;

  // Take top 5 highest-severity issues
  const prioritized = [
    ...issues.filter(i => i.severity === 'critical'),
    ...issues.filter(i => i.severity === 'major'),
    ...issues.filter(i => i.severity === 'minor'),
  ].slice(0, 5);

  if (prioritized.length === 0) {
    return { code, attempted: false, error: null };
  }

  const cs      = designDNA.colorSystem ?? {};
  const primary = cs.primary ?? designDNA.primaryColor ?? '#ffffff';
  const accent  = cs.accent ?? designDNA.accentColor ?? primary;
  const bg      = cs.background ?? designDNA.bgColor ?? '#0a0a0a';
  const border  = cs.border ?? '#2a2a2a';
  const radius  = designDNA.buttonStyle ?? 'rounded-lg';

  const issueList = prioritized
    .map((issue, i) => `${i + 1}. [${issue.category.toUpperCase()} / ${issue.severity.toUpperCase()}]\n   Problem: ${issue.message}\n   Fix: ${issue.suggestion}`)
    .join('\n\n');

  const userPrompt = `=== DESIGN CRITIC REPAIR ===

Critic Score: ${criticScore}/10 (target ≥ 8.5)
Fix ONLY these ${prioritized.length} issues:

${issueList}

=== DESIGN TOKENS (use when adding elements) ===
Primary: ${primary} | Accent: ${accent} | Background: ${bg}
Border: ${border} | Button radius: ${radius}
Theme: ${designDNA.theme ?? 'dark'}

=== RULE ===
Do NOT alter any business content, copy, pricing, or structure.
Return the COMPLETE repaired code:

${code}`;

  try {
    const repaired = await callAI(
      openrouterKey,
      [
        { role: 'system', content: CRITIC_REPAIR_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      { label: 'critic-repair', maxTokens: 8000 }
    );

    if (!repaired || repaired.length < code.length * 0.5) {
      log.warn("CRITIC_REPAIR_TOO_SHORT", { inputLen: code.length, outputLen: repaired?.length ?? 0 });
      return { code, attempted: true, error: `Critic repair output too short (${repaired?.length ?? 0} chars) — keeping original` };
    }

    const cleaned = repaired
      .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    log.info("CRITIC_REPAIR_SUCCESS", { inputChars: code.length, outputChars: cleaned.length, issueCount: prioritized.length });
    return { code: cleaned, attempted: true, error: null };
  } catch (e) {
    const err = `Critic repair failed: ${e instanceof Error ? e.message : String(e)}`;
    log.error("CRITIC_REPAIR_FAILED", { error: err });
    return { code, attempted: true, error: err };
  }
}
