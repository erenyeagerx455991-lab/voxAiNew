// ── V7.3.4 Visual Screenshot History ─────────────────────────────────────────
// Stores per-build visual deltas, repair outcomes, and candidate records.
// In-memory store with a bounded size for the current process lifetime.

import type { VisualCandidate, VisualValidationResult } from "./visualTypes.js";

interface HistoryEntry {
  buildId: string;
  timestamp: string;
  candidates: Array<{ label: string; visualScore: number }>;
  winnerScore: number;
  repairOutcome?: VisualValidationResult;
  visualDelta?: number; // winner vs repaired
}

const MAX_HISTORY = 200;
const history: HistoryEntry[] = [];

// ── Write ──────────────────────────────────────────────────────────────────────

export function recordVisualBuild(
  buildId: string,
  candidates: VisualCandidate[],
  winnerScore: number,
  repairOutcome?: VisualValidationResult,
): void {
  const entry: HistoryEntry = {
    buildId,
    timestamp: new Date().toISOString(),
    candidates: candidates.map(c => ({ label: c.label, visualScore: c.visualScore })),
    winnerScore,
    repairOutcome,
    visualDelta: repairOutcome ? repairOutcome.delta : undefined,
  };

  history.unshift(entry); // most recent first

  // Bounded size
  if (history.length > MAX_HISTORY) {
    history.splice(MAX_HISTORY);
  }
}

// ── Read ───────────────────────────────────────────────────────────────────────

export function getVisualHistory(limit = 20): HistoryEntry[] {
  return history.slice(0, limit);
}

export function getLastBuild(): HistoryEntry | undefined {
  return history[0];
}

export function getRepairOutcomes(): VisualValidationResult[] {
  return history
    .filter(e => e.repairOutcome !== undefined)
    .map(e => e.repairOutcome!);
}

export function getVisualRegressionRate(): number {
  const outcomes = getRepairOutcomes();
  if (outcomes.length === 0) return 0;
  const regressions = outcomes.filter(o => o.regression).length;
  return Math.round((regressions / outcomes.length) * 100) / 100;
}

export function getRepairImprovementRate(): number {
  const outcomes = getRepairOutcomes();
  if (outcomes.length === 0) return 0;
  const improved = outcomes.filter(o => o.delta > 0).length;
  return Math.round((improved / outcomes.length) * 100) / 100;
}

export function resetVisualHistory(): void {
  history.splice(0);
}
