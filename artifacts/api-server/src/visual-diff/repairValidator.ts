// ── V7.3.4 Repair Validation Layer ───────────────────────────────────────────
// Compares winner candidate vs final repaired build.
// Flags visual regressions: repair must not ship if it degrades visuals.

import { analyzeVisuals } from "./visualAnalyzer.js";
import type { VisualValidationResult } from "./visualTypes.js";

const REGRESSION_THRESHOLD = -0.5; // score must not drop by more than 0.5

export function validateRepairVisuals(
  winnerCode: string,
  repairedCode: string,
  sectionOrder: string[] = [],
  buildId = 'unknown',
): VisualValidationResult {
  const winnerResult  = analyzeVisuals(winnerCode, sectionOrder, 'winner', buildId);
  const repairedResult = analyzeVisuals(repairedCode, sectionOrder, 'repaired', buildId);

  const delta = repairedResult.visualScore - winnerResult.visualScore;

  // Detect specific regression types
  const ctaDrop    = repairedResult.ctaScore - winnerResult.ctaScore;
  const layoutDrop = repairedResult.layoutScore - winnerResult.layoutScore;

  let regressionType: VisualValidationResult['regressionType'] | undefined;
  let regression = false;

  if (delta <= REGRESSION_THRESHOLD) {
    regression = true;
    regressionType = 'visual';
  } else if (layoutDrop <= -1.5) {
    regression = true;
    regressionType = 'layout';
  } else if (ctaDrop <= -1.5) {
    regression = true;
    regressionType = 'cta';
  }

  const details = regression
    ? `Visual regression detected: ${regressionType} degraded. Winner=${winnerResult.visualScore}, Repaired=${repairedResult.visualScore}, Δ=${delta.toFixed(2)}`
    : `Repair OK. Winner=${winnerResult.visualScore}, Repaired=${repairedResult.visualScore}, Δ=${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`;

  return {
    passed:        !regression,
    regression,
    regressionType,
    winnerScore:   winnerResult.visualScore,
    repairedScore: repairedResult.visualScore,
    delta:         Math.round(delta * 100) / 100,
    details,
  };
}
