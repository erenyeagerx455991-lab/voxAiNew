// ── V7.2.0 Candidate Selection Step — Phase 4–6 ───────────────────────────────
// Evaluates all 3 candidates, selects the best using score + tie-break rules.
// Only the winning candidate proceeds to the repair loop (Phase 6).
// Losing candidates are discarded — reference metrics track winner only (Phase 8).

import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { evaluateDesign } from "../designEvaluator/evaluator.js";
import { generateCandidates } from "../frontend/candidateGenerator.js";
import { recordMultiCandidateSelection } from "../../telemetry/multiCandidateMetrics.js";
import { analyzeVisuals } from "../../visual-diff/visualAnalyzer.js";
import { compareAllCandidates } from "../../visual-diff/pixelDiff.js";
import type { FrontendOutput, PipelineKeys } from "./pipelineTypes.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("CandidateSelectionStep");

// ── Types ─────────────────────────────────────────────────────────────────────

// V7.3.4: Visual score weights for combined ranking
const EVALUATOR_WEIGHT = 0.70;
const VISUAL_WEIGHT    = 0.30;

export interface CandidateScore {
  index: number;
  label: 'A' | 'B' | 'C';
  overallScore: number;
  heroScore: number;
  layoutScore: number;
  ctaScore: number;
  accessibilityScore: number;
  shadcnScore: number;
  consistencyScore: number;
  visualScore: number;     // V7.3.4: visual analysis score 0–10
  combinedScore: number;   // V7.3.4: 70% evaluator + 30% visual
}

export interface CandidateSelectionResult {
  winner: FrontendOutput;
  selectionMetrics: {
    candidateCount: number;
    candidateScores: number[];
    winnerIndex: number;
    winnerLabel: 'A' | 'B' | 'C';
    winnerScore: number;
    averageCandidateScore: number;
    selectionDelta: number;
  };
}

// ── Pure selection logic (testable) ──────────────────────────────────────────
// Phase 5 rules (V7.3.4 updated):
//   1. Highest combinedScore (70% evaluator + 30% visual) wins.
//   2. If combined score difference < 0.2 → prefer higher visualScore (tie-break).
//   3. Still tied → prefer higher accessibilityScore.
//   4. Still tied → prefer higher shadcnScore.
//   5. Still tied → prefer higher consistencyScore.

export function selectBestCandidate(scored: CandidateScore[]): CandidateScore {
  if (scored.length === 0) throw new Error("selectBestCandidate: empty candidate list");

  const NEAR_TIE_THRESHOLD = 0.2;

  const sorted = [...scored].sort((a, b) => {
    const combinedDiff = b.combinedScore - a.combinedScore;
    if (Math.abs(combinedDiff) >= NEAR_TIE_THRESHOLD) return combinedDiff;

    // Tie-break 1: visual score wins (V7.3.4 spec)
    const visualDiff = b.visualScore - a.visualScore;
    if (Math.abs(visualDiff) >= NEAR_TIE_THRESHOLD) return visualDiff;

    // Tie-break 2: accessibility
    const accessDiff = b.accessibilityScore - a.accessibilityScore;
    if (Math.abs(accessDiff) >= NEAR_TIE_THRESHOLD) return accessDiff;

    // Tie-break 3: shadcn usage
    const shadcnDiff = b.shadcnScore - a.shadcnScore;
    if (Math.abs(shadcnDiff) >= NEAR_TIE_THRESHOLD) return shadcnDiff;

    // Tie-break 4: consistency
    return b.consistencyScore - a.consistencyScore;
  });

  return sorted[0];
}

// ── Main step ─────────────────────────────────────────────────────────────────

export async function runCandidateSelectionStep(
  candidateA: FrontendOutput,
  prompt: string,
  keys: PipelineKeys,
  res: Response,
  buildId = 'unknown',
): Promise<CandidateSelectionResult> {
  const { plan } = candidateA.architecture;
  const { blueprint } = plan;

  sse(res, { type: "step", step: 3, agent: "Candidate Generator", status: "active" });

  // Phase 3: generate B and C in parallel (A already exists)
  const { candidates, generationMs } = await generateCandidates(candidateA, prompt, keys);
  const [candA, candB, candC] = candidates;
  const LABELS: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];

  log.info("CANDIDATES_GENERATED", { generationMs, count: candidates.length });

  // Phase 4: evaluate all 3 independently (synchronous — no LLM call needed)
  // V7.3.4: also run visual analysis for each candidate
  const scored: CandidateScore[] = candidates.map((cand, i) => {
    const result = evaluateDesign({
      code: cand.fixedCode,
      sectionOrder: blueprint.sectionOrder,
      designDNA: cand.design,
    });
    const visualResult = analyzeVisuals(cand.fixedCode, blueprint.sectionOrder, `cand-${LABELS[i]}`, buildId);
    // Combined score: 70% evaluator + 30% visual
    const combinedScore = Math.round(
      (result.overallScore * EVALUATOR_WEIGHT + visualResult.visualScore * VISUAL_WEIGHT) * 100
    ) / 100;
    return {
      index: i,
      label: LABELS[i],
      overallScore:      result.overallScore,
      heroScore:         result.heroScore,
      layoutScore:       result.layoutScore,
      ctaScore:          result.ctaScore,
      accessibilityScore: result.accessibilityScore,
      shadcnScore:       result.shadcnScore,
      consistencyScore:  result.consistencyScore,
      visualScore:       visualResult.visualScore,
      combinedScore,
    };
  });

  scored.forEach(s => {
    log.info(`CANDIDATE_${s.label}_EVALUATED`, {
      overall: s.overallScore,
      hero: s.heroScore,
      layout: s.layoutScore,
      accessibility: s.accessibilityScore,
    });
  });

  // Phase 5: select best candidate
  const winner = selectBestCandidate(scored);
  const winnerFrontend = candidates[winner.index];

  const candidateScores = scored.map(s => s.overallScore);
  const avgScore = Math.round(
    (candidateScores.reduce((a, b) => a + b, 0) / candidateScores.length) * 100
  ) / 100;
  const selectionDelta = Math.round((winner.overallScore - avgScore) * 100) / 100;

  log.info("CANDIDATE_SELECTED", {
    winner: winner.label,
    winnerScore: winner.overallScore,
    avgScore,
    selectionDelta,
  });

  sse(res, { type: "step", step: 3, agent: "Candidate Generator", status: "done" });

  // Emit selection summary (new SSE type — additive, does not change existing events)
  sse(res, {
    type: "candidates_evaluated",
    candidateCount: 3,
    scores: scored.map(s => ({ label: s.label, score: s.overallScore })),
    winner: winner.label,
    winnerScore: winner.overallScore,
    averageScore: avgScore,
    selectionDelta,
  });

  // Phase 7: record telemetry
  recordMultiCandidateSelection({
    buildId,
    candidateCount: 3,
    candidateScores,
    winnerIndex: winner.index,
    winnerScore: winner.overallScore,
    averageCandidateScore: avgScore,
    selectionDelta,
  });

  // Phase 6: only winner proceeds (A, B, or C — losers are discarded here)
  // Phase 8: winner's retrievalReferenceIds flow into designEvaluatorStep
  //          which calls recordBuildOutcome — losers' IDs never recorded.
  return {
    winner: winnerFrontend,
    selectionMetrics: {
      candidateCount: 3,
      candidateScores,
      winnerIndex: winner.index,
      winnerLabel: winner.label,
      winnerScore: winner.overallScore,
      averageCandidateScore: avgScore,
      selectionDelta,
    },
  };
}
