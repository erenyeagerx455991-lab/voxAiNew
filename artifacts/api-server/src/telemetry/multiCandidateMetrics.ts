// ── V7.2.0 Multi-Candidate Telemetry — Phase 7 ───────────────────────────────

export interface MultiCandidateRecord {
  buildId: string;
  candidateCount: number;
  candidateScores: number[];
  winnerIndex: number;
  winnerScore: number;
  averageCandidateScore: number;
  selectionDelta: number; // winnerScore - averageCandidateScore
  recordedAt: number;
}

const records: MultiCandidateRecord[] = [];
const MAX_RECORDS = 200;

let totalSelections = 0;
let sumWinnerScore = 0;
let sumAverageScore = 0;
let sumDelta = 0;

export function recordMultiCandidateSelection(input: Omit<MultiCandidateRecord, 'recordedAt'>): void {
  const record: MultiCandidateRecord = { ...input, recordedAt: Date.now() };
  records.push(record);
  if (records.length > MAX_RECORDS) records.shift();

  totalSelections++;
  sumWinnerScore   += record.winnerScore;
  sumAverageScore  += record.averageCandidateScore;
  sumDelta         += record.selectionDelta;
}

export function getMultiCandidateMetrics() {
  const n = totalSelections;
  const avg = (s: number) => n > 0 ? Math.round((s / n) * 100) / 100 : 0;

  const recent = records.slice(-10).map(r => ({
    buildId:             r.buildId,
    candidateCount:      r.candidateCount,
    candidateScores:     r.candidateScores,
    winnerIndex:         r.winnerIndex,
    winnerScore:         r.winnerScore,
    averageCandidateScore: r.averageCandidateScore,
    selectionDelta:      r.selectionDelta,
  }));

  return {
    totalSelections,
    averageWinnerScore:     avg(sumWinnerScore),
    averageCandidateScore:  avg(sumAverageScore),
    averageSelectionDelta:  avg(sumDelta),
    recent,
  };
}

export function resetMultiCandidateMetrics(): void {
  records.length   = 0;
  totalSelections  = 0;
  sumWinnerScore   = 0;
  sumAverageScore  = 0;
  sumDelta         = 0;
}
