// ── V7.2.9 Motion Intelligence Engine — Motion Telemetry ─────────────────────

import { globalMetrics } from './metricsProvider.js';

interface MotionRetrievalRecord {
  sectionType: string;
  designLanguage: string;
  motionDNA: string;
  count: number;
  intensity: string;
}

interface MotionScoreRecord {
  buildId: string;
  motionScore: number;
  dnaCompliant: boolean;
  reducedMotionSupported: boolean;
  animationCount: number;
  averageDuration: number;
  recordedAt: number;
}

let totalRetrievals = 0;
let totalScores = 0;
let sumMotionScore = 0;
let dnaCompliantCount = 0;
let reducedMotionSupportCount = 0;
let sumAnimationCount = 0;
let sumDuration = 0;

const dnaUsage = new Map<string, number>();
const sectionUsage = new Map<string, number>();
const intensityUsage = new Map<string, number>();
const scoreRecords: MotionScoreRecord[] = [];

// V7.3.5: Motion pattern outcome tracking
const motionPatternScores = new Map<string, { sum: number; count: number; avg: number }>();

const MAX_RECORDS = 100;

function cappedPush<T>(arr: T[], val: T): void {
  arr.push(val);
  if (arr.length > MAX_RECORDS) arr.shift();
}

export interface MotionRetrievalInput {
  sectionType: string;
  designLanguage: string;
  motionDNA: string;
  count: number;
  intensity: string;
}

export function recordMotionRetrieval(input: MotionRetrievalInput): void {
  totalRetrievals++;
  dnaUsage.set(input.motionDNA, (dnaUsage.get(input.motionDNA) ?? 0) + 1);
  sectionUsage.set(input.sectionType, (sectionUsage.get(input.sectionType) ?? 0) + 1);
  intensityUsage.set(input.intensity, (intensityUsage.get(input.intensity) ?? 0) + 1);
  globalMetrics.increment('motion.retrievals');
}

export interface MotionScoreInput {
  buildId: string;
  motionScore: number;
  dnaCompliant: boolean;
  reducedMotionSupported: boolean;
  animationCount: number;
  averageDuration: number;
}

export function recordMotionScore(input: MotionScoreInput): void {
  const record: MotionScoreRecord = { ...input, recordedAt: Date.now() };
  cappedPush(scoreRecords, record);
  totalScores++;
  sumMotionScore += input.motionScore;
  if (input.dnaCompliant) dnaCompliantCount++;
  if (input.reducedMotionSupported) reducedMotionSupportCount++;
  sumAnimationCount += input.animationCount;
  sumDuration += input.averageDuration;

  globalMetrics.increment('motion.scored');
  if (input.motionScore >= 9.0) globalMetrics.increment('motion.highScore');
  if (input.dnaCompliant) globalMetrics.increment('motion.dnaCompliant');
  if (input.reducedMotionSupported) globalMetrics.increment('motion.accessibilitySafe');
}

export function getMotionQualityMetrics() {
  const n = totalScores;
  const avg = (sum: number) => (n > 0 ? Math.round((sum / n) * 100) / 100 : 0);

  return {
    motionUsage: {
      totalRetrievals,
      totalScored: n,
      topDNA: [...dnaUsage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([dna, count]) => ({ dna, count })),
      topSections: [...sectionUsage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([section, count]) => ({ section, count })),
      intensityDistribution: Object.fromEntries(intensityUsage),
    },
    dnaMotionCompliance: n > 0 ? `${Math.round((dnaCompliantCount / n) * 100)}%` : 'n/a',
    reducedMotionSupport: n > 0 ? `${Math.round((reducedMotionSupportCount / n) * 100)}%` : 'n/a',
    averages: {
      motionScore:     avg(sumMotionScore),
      animationCount:  avg(sumAnimationCount),
      averageDuration: avg(sumDuration),
    },
    recentScores: scoreRecords.slice(-20).map(r => ({
      buildId:               r.buildId,
      motionScore:           r.motionScore,
      dnaCompliant:          r.dnaCompliant,
      reducedMotionSupported: r.reducedMotionSupported,
      animationCount:        r.animationCount,
    })),
  };
}

// V7.3.5: Motion pattern outcome recording
export function recordMotionPatternOutcome(refId: string, score: number): void {
  let entry = motionPatternScores.get(refId);
  if (!entry) {
    entry = { sum: 0, count: 0, avg: 0 };
    motionPatternScores.set(refId, entry);
  }
  entry.sum += score;
  entry.count++;
  entry.avg = entry.sum / entry.count;
  globalMetrics.increment('motion.patternOutcomes');
}

export function getTopMotionPatterns(limit = 10): Array<{ refId: string; avgScore: number; count: number }> {
  return [...motionPatternScores.entries()]
    .filter(([, v]) => v.count > 0)
    .sort((a, b) => b[1].avg - a[1].avg)
    .slice(0, limit)
    .map(([refId, v]) => ({ refId, avgScore: Math.round(v.avg * 100) / 100, count: v.count }));
}

export function resetMotionMetrics(): void {
  totalRetrievals = 0;
  totalScores = 0;
  sumMotionScore = 0;
  dnaCompliantCount = 0;
  reducedMotionSupportCount = 0;
  sumAnimationCount = 0;
  sumDuration = 0;
  dnaUsage.clear();
  sectionUsage.clear();
  intensityUsage.clear();
  scoreRecords.length = 0;
  motionPatternScores.clear();
}
