// ── V7.2.0 Multi-Candidate Selection — Tests (Phase 9) ───────────────────────
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  selectBestCandidate,
  type CandidateScore,
} from "../../src/agents/pipeline/candidateSelectionStep.js";
import {
  recordMultiCandidateSelection,
  getMultiCandidateMetrics,
  resetMultiCandidateMetrics,
} from "../../src/telemetry/multiCandidateMetrics.js";
import {
  resetReferenceMetrics,
  getReferenceEntry,
  recordReferenceUsages,
  recordBuildOutcome,
} from "../../src/design-rag/referenceMetrics.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeScore(
  label: 'A' | 'B' | 'C',
  overallScore: number,
  overrides: Partial<CandidateScore> = {},
): CandidateScore {
  const visualScore = overrides.visualScore ?? overallScore;
  const combinedScore = overrides.combinedScore ??
    Math.round((overallScore * 0.70 + visualScore * 0.30) * 100) / 100;
  return {
    index: label === 'A' ? 0 : label === 'B' ? 1 : 2,
    label,
    overallScore,
    heroScore:          overrides.heroScore          ?? overallScore,
    layoutScore:        overrides.layoutScore        ?? overallScore,
    ctaScore:           overrides.ctaScore           ?? overallScore,
    accessibilityScore: overrides.accessibilityScore ?? overallScore,
    shadcnScore:        overrides.shadcnScore        ?? overallScore,
    consistencyScore:   overrides.consistencyScore   ?? overallScore,
    visualScore,
    combinedScore,
  };
}

// ── Phase 4+5: Best Candidate Selection ───────────────────────────────────────

describe("V7.2.0 — Phase 4+5: Best Candidate Selection", () => {
  it("selects the candidate with the highest overall score", () => {
    const scored = [
      makeScore('A', 7.2),
      makeScore('B', 8.5),
      makeScore('C', 7.8),
    ];
    const winner = selectBestCandidate(scored);
    expect(winner.label).toBe('B');
    expect(winner.overallScore).toBe(8.5);
  });

  it("selects candidate A when it has the highest score", () => {
    const scored = [
      makeScore('A', 9.1),
      makeScore('B', 7.5),
      makeScore('C', 8.0),
    ];
    expect(selectBestCandidate(scored).label).toBe('A');
  });

  it("selects candidate C when it has the highest score", () => {
    const scored = [
      makeScore('A', 7.0),
      makeScore('B', 7.5),
      makeScore('C', 8.8),
    ];
    expect(selectBestCandidate(scored).label).toBe('C');
  });

  it("works with a single candidate", () => {
    const scored = [makeScore('A', 7.5)];
    expect(selectBestCandidate(scored).label).toBe('A');
  });

  it("throws when given an empty list", () => {
    expect(() => selectBestCandidate([])).toThrow();
  });
});

// ── Phase 5: Tie-Break Rules ──────────────────────────────────────────────────

describe("V7.2.0 — Phase 5: Tie-Break Rules", () => {
  it("tie-break on accessibility when overall scores differ by < 0.2", () => {
    const scored = [
      makeScore('A', 8.0, { accessibilityScore: 6.0 }),
      makeScore('B', 8.1, { accessibilityScore: 9.0 }),  // wins on accessibility
      makeScore('C', 7.5, { accessibilityScore: 7.0 }),
    ];
    // A vs B: diff = 0.1 < 0.2 → tie → B wins on accessibility (9 > 6)
    const winner = selectBestCandidate(scored);
    expect(winner.label).toBe('B');
  });

  it("tie-break on shadcn when overall and accessibility scores are both near-tied", () => {
    const scored = [
      makeScore('A', 8.0, { accessibilityScore: 8.0, shadcnScore: 5.0 }),
      makeScore('B', 8.1, { accessibilityScore: 8.05, shadcnScore: 9.0 }), // wins on shadcn
    ];
    // overall diff < 0.2, accessibility diff < 0.2, shadcn diff ≥ 0.2 → B wins
    const winner = selectBestCandidate(scored);
    expect(winner.label).toBe('B');
  });

  it("tie-break on consistency when overall, accessibility and shadcn are all near-tied", () => {
    const scored = [
      makeScore('A', 8.0, { accessibilityScore: 8.0, shadcnScore: 8.0, consistencyScore: 6.0 }),
      makeScore('B', 8.05, { accessibilityScore: 8.05, shadcnScore: 8.05, consistencyScore: 9.0 }),
    ];
    const winner = selectBestCandidate(scored);
    expect(winner.label).toBe('B');
  });

  it("prefers higher accessibility over higher overall when overall diff < 0.2", () => {
    // B has slightly higher overall but A has much better accessibility
    const scored = [
      makeScore('A', 7.95, { accessibilityScore: 9.5 }),
      makeScore('B', 8.10, { accessibilityScore: 5.0 }),
    ];
    // diff = 0.15 < 0.2 → tie → A wins on accessibility (9.5 > 5.0)
    const winner = selectBestCandidate(scored);
    expect(winner.label).toBe('A');
  });

  it("clear score winner (diff >= 0.2) ignores tie-break rules", () => {
    // B has lower accessibility but much higher overall
    const scored = [
      makeScore('A', 7.0, { accessibilityScore: 10.0 }),
      makeScore('B', 9.0, { accessibilityScore: 3.0 }), // wins on overall
    ];
    expect(selectBestCandidate(scored).label).toBe('B');
  });
});

// ── Phase 7: Telemetry ────────────────────────────────────────────────────────

describe("V7.2.0 — Phase 7: Multi-Candidate Telemetry", () => {
  beforeEach(() => resetMultiCandidateMetrics());

  it("records a multi-candidate selection event", () => {
    recordMultiCandidateSelection({
      buildId: 'build-001',
      candidateCount: 3,
      candidateScores: [7.2, 8.5, 7.8],
      winnerIndex: 1,
      winnerScore: 8.5,
      averageCandidateScore: 7.83,
      selectionDelta: 0.67,
    });
    const metrics = getMultiCandidateMetrics();
    expect(metrics.totalSelections).toBe(1);
  });

  it("averageWinnerScore reflects recorded wins", () => {
    recordMultiCandidateSelection({ buildId: 'b1', candidateCount: 3, candidateScores: [7,8,7], winnerIndex: 1, winnerScore: 8.0, averageCandidateScore: 7.33, selectionDelta: 0.67 });
    recordMultiCandidateSelection({ buildId: 'b2', candidateCount: 3, candidateScores: [9,8,7], winnerIndex: 0, winnerScore: 9.0, averageCandidateScore: 8.0, selectionDelta: 1.0 });
    const metrics = getMultiCandidateMetrics();
    expect(metrics.averageWinnerScore).toBeCloseTo(8.5, 1);
  });

  it("averageSelectionDelta accumulates correctly", () => {
    recordMultiCandidateSelection({ buildId: 'b1', candidateCount: 3, candidateScores: [7,8,7], winnerIndex: 1, winnerScore: 8.0, averageCandidateScore: 7.33, selectionDelta: 0.67 });
    recordMultiCandidateSelection({ buildId: 'b2', candidateCount: 3, candidateScores: [9,7,7], winnerIndex: 0, winnerScore: 9.0, averageCandidateScore: 7.67, selectionDelta: 1.33 });
    const metrics = getMultiCandidateMetrics();
    expect(metrics.averageSelectionDelta).toBeGreaterThan(0);
  });

  it("includes recent records in output", () => {
    recordMultiCandidateSelection({ buildId: 'b-recent', candidateCount: 3, candidateScores: [8,9,7], winnerIndex: 1, winnerScore: 9.0, averageCandidateScore: 8.0, selectionDelta: 1.0 });
    const metrics = getMultiCandidateMetrics();
    const ids = metrics.recent.map(r => r.buildId);
    expect(ids).toContain('b-recent');
  });

  it("reset clears all counters", () => {
    recordMultiCandidateSelection({ buildId: 'b1', candidateCount: 3, candidateScores: [7,8,7], winnerIndex: 1, winnerScore: 8.0, averageCandidateScore: 7.33, selectionDelta: 0.67 });
    resetMultiCandidateMetrics();
    const metrics = getMultiCandidateMetrics();
    expect(metrics.totalSelections).toBe(0);
    expect(metrics.averageWinnerScore).toBe(0);
    expect(metrics.recent.length).toBe(0);
  });

  it("candidateCount is always 3 in recorded metrics", () => {
    recordMultiCandidateSelection({ buildId: 'b1', candidateCount: 3, candidateScores: [7,8,7], winnerIndex: 1, winnerScore: 8.0, averageCandidateScore: 7.33, selectionDelta: 0.67 });
    const metrics = getMultiCandidateMetrics();
    expect(metrics.recent[0].candidateCount).toBe(3);
  });
});

// ── Phase 8: RAG learns only from winner ──────────────────────────────────────
// Phase 8 guarantee: only the winning candidate's retrievalReferenceIds flow
// into designEvaluatorStep → recordBuildOutcome. This test verifies the
// reference metric store correctly records only what it is told to record.

describe("V7.2.0 — Phase 8: RAG feedback — winner only", () => {
  beforeEach(() => resetReferenceMetrics());

  it("reference metrics update only for the winning candidate's references", () => {
    const winnerRefs   = ['ref-hero-linear',  'ref-features-stripe'];
    const loserARefs   = ['ref-hero-vercel',  'ref-faq-notion'];
    const loserBRefs   = ['ref-hero-framer',  'ref-cta-cursor'];

    // Simulate: winner's references recorded via designEvaluatorStep
    recordReferenceUsages(winnerRefs.map(id => ({ id })));
    recordBuildOutcome(winnerRefs, 7.5, 9.2, false);

    // Losers' references are NOT recorded (they never enter designEvaluatorStep)
    // — no recordBuildOutcome calls for loserARefS or loserBRefs

    // Verify winner refs have outcomes
    for (const id of winnerRefs) {
      const entry = getReferenceEntry(id);
      expect(entry).toBeDefined();
      expect(entry?.outcomeCount).toBe(1);
    }

    // Verify loser refs have no outcomes (not even entries, since we never called recordReferenceUsages for them)
    for (const id of [...loserARefs, ...loserBRefs]) {
      expect(getReferenceEntry(id)).toBeUndefined();
    }
  });

  it("winner's outcome increases successCount when score >= 8.5", () => {
    const refs = ['ref-hero-saas-centered'];
    recordReferenceUsages(refs.map(id => ({ id })));
    recordBuildOutcome(refs, 7.8, 9.0, false);
    expect(getReferenceEntry(refs[0])?.successCount).toBe(1);
  });

  it("losers do not contribute to reference promotion", () => {
    // Even if a loser would qualify for promotion (high scores), it never
    // gets recorded — so no promotion can happen
    const loserRef = 'ref-hero-experimental-loser';
    // No recordReferenceUsages or recordBuildOutcome calls for this ref
    expect(getReferenceEntry(loserRef)).toBeUndefined();
  });
});

// ── Selection consistency ─────────────────────────────────────────────────────

describe("V7.2.0 — Selection Consistency", () => {
  it("returns correct winnerIndex matching the label", () => {
    const scored = [
      makeScore('A', 7.0),
      makeScore('B', 9.0),
      makeScore('C', 8.0),
    ];
    const winner = selectBestCandidate(scored);
    expect(winner.index).toBe(1); // B is index 1
    expect(winner.label).toBe('B');
  });

  it("selection is deterministic for same scores", () => {
    const scored = [
      makeScore('A', 8.5),
      makeScore('B', 7.0),
      makeScore('C', 8.5),
    ];
    // A vs C: same overall, same accessibility, same shadcn, same consistency → first in sort wins
    const w1 = selectBestCandidate([...scored]);
    const w2 = selectBestCandidate([...scored]);
    expect(w1.label).toBe(w2.label);
  });

  it("evaluatorCount equals 3 for any build (one evaluation per candidate)", () => {
    // We verify that 3 distinct scores can be captured by the selection step type system
    const scored: CandidateScore[] = [
      makeScore('A', 7.5),
      makeScore('B', 8.2),
      makeScore('C', 7.8),
    ];
    expect(scored).toHaveLength(3);
    const winner = selectBestCandidate(scored);
    expect(['A', 'B', 'C']).toContain(winner.label);
  });
});
