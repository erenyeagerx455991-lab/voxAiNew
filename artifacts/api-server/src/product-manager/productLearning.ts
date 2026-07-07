// ── V8.4 Product Manager — Learning Loop ─────────────────────────────────────
// Records product plan outcomes and feeds them into Design DNA for improvement.

import type { ProductLearningInput, ProductLearningRecord, ProductGoal } from './productTypes.js';
import { learnFromBuild } from '../design-dna/designDNA.js';
import { createLogger } from '../lib/structuredLogger.js';
import { saveProductSnapshot } from './productPersistence.js';

const log = createLogger('ProductLearning');

const _learningHistory: ProductLearningRecord[] = [];
const MAX_HISTORY = 500;

let _saveTimer: ReturnType<typeof setTimeout> | null = null;

function _scheduleSave(): void {
  if (_saveTimer) return;
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    saveProductSnapshot([..._learningHistory]).catch(() => { /* logged inside */ });
  }, 30_000);
}

// ── Public API ────────────────────────────────────────────────────────────────

export function learnFromProduct(input: ProductLearningInput): void {
  const { buildId, productPlan, evaluatorScore } = input;

  const riskCount    = productPlan.detectedRisks.length;
  const featureCount = productPlan.plannedFeatures.length;
  const improved     = productPlan.overallProductScore >= 7.0 && riskCount < 3;

  const record: ProductLearningRecord = {
    buildId,
    productGoal:       productPlan.productGoal,
    businessObjective: productPlan.businessObjective,
    overallScore:      productPlan.overallProductScore,
    riskCount,
    featureCount,
    personaCount:      productPlan.userPersonas.length,
    improved,
    recordedAt:        Date.now(),
  };

  _learningHistory.push(record);
  if (_learningHistory.length > MAX_HISTORY) _learningHistory.shift();
  _scheduleSave();

  // Map product score → conversion proxy for DNA system
  const conversionScore = productScoreToConversion(productPlan.overallProductScore);

  const dnaId = `product-${productPlan.productGoal.toLowerCase()}`;

  try {
    learnFromBuild({
      dnaId,
      evaluatorScore:     evaluatorScore ?? productPlan.overallProductScore,
      criticScore:        productPlan.overallProductScore,
      accessibilityScore: 5,
      optimizationScore:  5,
      visualScore:        5,
      repairTriggered:    riskCount > 3,
      repairLoops:        riskCount > 3 ? 1 : 0,
      conversionScore,
      success:            improved,
    });

    log.info('PRODUCT_LEARNING_DNA_UPDATED', {
      buildId,
      productGoal:  productPlan.productGoal,
      productScore: productPlan.overallProductScore,
      riskCount,
      improved,
    });
  } catch (err) {
    log.warn('PRODUCT_LEARNING_DNA_FAILED', { error: String(err) });
  }
}

// ── Trend Analysis ─────────────────────────────────────────────────────────────

export function getProductLearningTrend(): 'rising' | 'stable' | 'falling' {
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

export function getProductLearningHistory(): ProductLearningRecord[] {
  return [..._learningHistory];
}

export function resetProductLearning(): void {
  _learningHistory.length = 0;
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
}

export function hydrateProductLearning(records: ProductLearningRecord[]): void {
  _learningHistory.length = 0;
  const hydrated = records.slice(-MAX_HISTORY);
  _learningHistory.push(...hydrated);
  log.info('PRODUCT_LEARNING_HYDRATED', { count: hydrated.length });
}

// ── Helper ────────────────────────────────────────────────────────────────────

function productScoreToConversion(score: number): number {
  if (score >= 9.0) return 9.5;
  if (score >= 7.5) return 7.5;
  if (score >= 6.0) return 5.5;
  if (score >= 4.0) return 3.5;
  return 1.5;
}
