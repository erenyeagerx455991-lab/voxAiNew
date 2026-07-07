// ── V8.5 Frontend Architect — Architecture Learning ───────────────────────────

import type { ArchitectureLearningInput, ArchitectureLearningRecord } from './frontendTypes.js';
import { recordArchitectureBuild, getArchitectureMetrics } from './architectureMetrics.js';
import { persistArchitectureRecord } from './architecturePersistence.js';

const LEARNING_HISTORY: ArchitectureLearningRecord[] = [];

export function learnFromArchitecture(input: ArchitectureLearningInput): void {
  const { buildId, blueprint, evaluatorScore } = input;
  const improved = (evaluatorScore ?? blueprint.overallScore) >= 7.5;

  const record: ArchitectureLearningRecord = {
    buildId,
    projectType:   blueprint.projectType,
    overallScore:  blueprint.overallScore,
    routeCount:    blueprint.routingArchitecture.routeCount,
    stateStrategy: blueprint.stateArchitecture.primaryStrategy,
    improved,
    recordedAt:    Date.now(),
  };

  LEARNING_HISTORY.push(record);
  if (LEARNING_HISTORY.length > 500) LEARNING_HISTORY.shift();

  // Feed telemetry
  recordArchitectureBuild(blueprint);

  // Persist async — non-blocking
  setImmediate(() => {
    persistArchitectureRecord(record).catch(() => {});
  });
}

export function getArchitectureLearningHistory(): ArchitectureLearningRecord[] {
  return [...LEARNING_HISTORY];
}

export function getSuccessfulPatterns(): { projectType: string; stateStrategy: string; avgScore: number }[] {
  const byType = new Map<string, { scores: number[]; strategies: string[] }>();

  for (const r of LEARNING_HISTORY) {
    if (!r.improved) continue;
    const key = r.projectType;
    if (!byType.has(key)) byType.set(key, { scores: [], strategies: [] });
    const entry = byType.get(key)!;
    entry.scores.push(r.overallScore);
    entry.strategies.push(r.stateStrategy);
  }

  return [...byType.entries()].map(([projectType, data]) => ({
    projectType,
    stateStrategy: mostCommon(data.strategies),
    avgScore: parseFloat((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(2)),
  }));
}

function mostCommon(arr: string[]): string {
  const freq = new Map<string, number>();
  for (const v of arr) freq.set(v, (freq.get(v) ?? 0) + 1);
  let best = arr[0] ?? '';
  let max = 0;
  for (const [k, v] of freq) if (v > max) { max = v; best = k; }
  return best;
}

export function hydrateArchitectureLearning(records: ArchitectureLearningRecord[]): void {
  for (const r of records) {
    LEARNING_HISTORY.push(r);
  }
}
