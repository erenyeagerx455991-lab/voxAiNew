import { callAI } from "../llm/aiService.js";
import type { EvaluationIssue, EvaluationResult } from "./evaluator.js";
import type { DesignDNA } from "../types.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("DesignRepairAgent");

const REPAIR_SYSTEM = `You are a Design Repair Agent. You receive React JSX code with specific identified design quality issues and must fix ONLY those issues.

ABSOLUTE RULES:
1. Fix ONLY the issues explicitly listed. Do NOT redesign, restructure, or improve anything not listed.
2. Do NOT remove any section functions, components, or JSX structure.
3. Do NOT alter business content, copy, product names, or metric numbers.
4. Return the COMPLETE corrected code — no markdown fences, no truncation, no explanation.
5. Keep all existing function names, imports, and structure unchanged.
6. Each fix must be the minimal change needed to address the listed issue.
7. If an issue asks you to ADD something (badge, CTA, trust signal), add it in the correct location without removing anything.
8. Preserve all existing shadcn globals (Button, Card, Badge, Avatar, Input), Lucide icons, and accessibility attributes.`;

export interface RepairInput {
  code: string;
  issues: EvaluationIssue[];
  scores: EvaluationResult;
  openrouterKey: string;
  designDNA: DesignDNA;
  pass: number;
}

export interface RepairOutput {
  code: string;
  attempted: boolean;
  error: string | null;
}

export async function runDesignRepair(input: RepairInput): Promise<RepairOutput> {
  const { code, issues, scores, openrouterKey, designDNA, pass } = input;

  const prioritized = [
    ...issues.filter(i => i.severity === 'critical'),
    ...issues.filter(i => i.severity === 'major'),
    ...issues.filter(i => i.severity === 'minor'),
  ].slice(0, 8);

  if (prioritized.length === 0) {
    return { code, attempted: false, error: null };
  }

  const cs = designDNA.colorSystem ?? {};
  const bg = cs.background ?? designDNA.bgColor ?? '#0a0a0a';
  const surface = cs.surface ?? '#141414';
  const primary = cs.primary ?? designDNA.primaryColor ?? '#ffffff';
  const accent = cs.accent ?? designDNA.accentColor ?? primary;
  const border = cs.border ?? '#2a2a2a';
  const textMuted = cs.textMuted ?? '#888888';
  const radius = designDNA.buttonStyle ?? 'rounded-lg';

  const issueList = prioritized
    .map((issue, i) => `${i + 1}. [${issue.category.toUpperCase()} / ${issue.severity}] ${issue.message}`)
    .join('\n');

  const userPrompt = `=== REPAIR PASS ${pass}/2 ===

Fix ONLY these ${prioritized.length} issues. Do not change anything else:

${issueList}

=== DESIGN TOKENS (use these when adding elements) ===
Background: ${bg}
Surface: ${surface}
Primary/Text: ${primary}
Accent: ${accent}
Border: ${border}
Text muted: ${textMuted}
Button radius: ${radius}

=== SCORE CONTEXT ===
Hero: ${scores.heroScore}/10  |  Layout: ${scores.layoutScore}/10  |  CTA: ${scores.ctaScore}/10
Accessibility: ${scores.accessibilityScore}/10  |  Shadcn: ${scores.shadcnScore}/10  |  Consistency: ${scores.consistencyScore}/10

=== CODE TO REPAIR ===
${code}`;

  try {
    const repaired = await callAI(
      openrouterKey,
      [
        { role: 'system', content: REPAIR_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      { label: `design-repair:pass${pass}`, maxTokens: 8000 }
    );

    if (!repaired || repaired.length < code.length * 0.5) {
      log.warn("REPAIR_OUTPUT_TOO_SHORT", { pass, inputLen: code.length, outputLen: repaired?.length ?? 0 });
      return { code, attempted: true, error: `Repair pass ${pass} output was too short (${repaired?.length ?? 0} chars vs ${code.length} expected) — keeping original` };
    }

    const cleaned = repaired
      .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    log.info("REPAIR_PASS_SUCCESS", { pass, inputChars: code.length, outputChars: cleaned.length });
    return { code: cleaned, attempted: true, error: null };
  } catch (e) {
    const err = `Design repair pass ${pass} failed: ${e instanceof Error ? e.message : String(e)}`;
    log.error("REPAIR_PASS_FAILED", { pass, error: err });
    return { code, attempted: true, error: err };
  }
}
