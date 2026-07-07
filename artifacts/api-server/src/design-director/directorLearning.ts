// ── V8.3 Autonomous AI Design Director — Learning Loop ─────────────────────────
// Records director outcomes and feeds improvements into Design DNA.
// Patterns with consistently high director scores improve DNA quality.
// Patterns consistently rejected are demoted.

import type { DirectorLearningInput, DirectorLearningRecord, DirectorCategory } from './directorTypes.js';
import { learnFromBuild } from '../design-dna/designDNA.js';
import { createLogger } from '../lib/structuredLogger.js';
import { saveDirectorSnapshot } from './directorPersistence.js';

const log = createLogger('DirectorLearning');

// ── In-memory history (last 500 records) ──────────────────────────────────────

const _learningHistory: DirectorLearningRecord[] = [];
const MAX_HISTORY = 500;

// ── Debounced persistence ─────────────────────────────────────────────────────

let _saveTimer: ReturnType<typeof setTimeout> | null = null;

function _scheduleSave(): void {
  if (_saveTimer) return;
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    saveDirectorSnapshot([..._learningHistory]).catch(() => { /* logged inside */ });
  }, 30_000);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * learnFromDirector — Phase 11.
 * Called after every build. High-scoring patterns improve DNA. Low-scoring demoted.
 */
export function learnFromDirector(input: DirectorLearningInput): void {
  const { buildId, directorReview, dnaId, evaluatorScore } = input;

  const categoryScores = Object.fromEntries(
    directorReview.categoryReviews.map(r => [r.category, r.score])
  ) as Record<DirectorCategory, number>;

  const criticalCount = directorReview.categoryReviews.filter(r => r.severity === 'Critical').length;
  const improved = directorReview.overallScore >= 7.0 && criticalCount === 0;

  const record: DirectorLearningRecord = {
    buildId,
    overallScore:  directorReview.overallScore,
    categoryScores,
    criticalCount,
    dnaId:         dnaId ?? 'generic',
    improved,
    recordedAt:    Date.now(),
  };

  _learningHistory.push(record);
  if (_learningHistory.length > MAX_HISTORY) _learningHistory.shift();

  _scheduleSave();

  // Map director score → conversion proxy for DNA system
  const conversionScore = directorScoreToConversion(directorReview.overallScore);

  const effectiveDnaId = dnaId ?? 'director-default';
  try {
    learnFromBuild({
      dnaId:               effectiveDnaId,
      evaluatorScore:      evaluatorScore ?? directorReview.overallScore,
      criticScore:         directorReview.overallScore,   // director acts as strategic critic
      accessibilityScore:  categoryScores.accessibility   ?? 5,
      optimizationScore:   categoryScores.performance     ?? 5,
      visualScore:         categoryScores.visualHierarchy ?? 5,
      repairTriggered:     criticalCount > 0,
      repairLoops:         criticalCount > 0 ? 1 : 0,
      conversionScore,
      success:             improved,
    });

    log.info('DIRECTOR_LEARNING_DNA_UPDATED', {
      buildId,
      directorScore:  directorReview.overallScore,
      criticalCount,
      dnaId:          effectiveDnaId,
      improved,
    });
  } catch (err) {
    log.warn('DIRECTOR_LEARNING_DNA_FAILED', { error: String(err) });
  }
}

// ── Trend analysis ─────────────────────────────────────────────────────────────

export function getDirectorLearningTrend(): 'rising' | 'stable' | 'falling' {
  const recent = _learningHistory.slice(-10);
  const older  = _learningHistory.slice(-20, -10);
  if (recent.length < 3 || older.length < 3) return 'stable';
  const avgR = recent.reduce((s, r) => s + r.overallScore, 0) / recent.length;
  const avgO = older.reduce((s, r) => s + r.overallScore, 0) / older.length;
  const delta = avgR - avgO;
  if (delta > 0.3) return 'rising';
  if (delta < -0.3) return 'falling';
  return 'stable';
}

export function getDirectorLearningHistory(): DirectorLearningRecord[] {
  return [..._learningHistory];
}

export function resetDirectorLearning(): void {
  _learningHistory.length = 0;
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
}

/**
 * hydrateDirectorLearning — called at server start to restore persisted history.
 */
export function hydrateDirectorLearning(records: DirectorLearningRecord[]): void {
  _learningHistory.length = 0;
  const hydrated = records.slice(-MAX_HISTORY);
  _learningHistory.push(...hydrated);
  log.info('DIRECTOR_LEARNING_HYDRATED', { count: hydrated.length });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function directorScoreToConversion(score: number): number {
  if (score >= 9.0) return 9.5;
  if (score >= 7.5) return 7.5;
  if (score >= 6.0) return 5.5;
  if (score >= 4.0) return 3.5;
  return 1.5;
}
