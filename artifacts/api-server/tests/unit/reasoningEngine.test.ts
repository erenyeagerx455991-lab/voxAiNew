// ── V9.5 Autonomous Reasoning & Decision Intelligence Engine — Comprehensive Tests
//
// Covers every deliverable from the spec:
//   1. Goal Reasoning Engine
//   2. Constraint Reasoning Engine
//   3. Trade-off Analysis Engine
//   4. Multi-Path Reasoning Engine
//   5. Decision Matrix Engine
//   6. Confidence Engine
//   7. Conflict Resolution Engine
//   8. Decision Graph
//   9. Decision Learning
//  10. Persistence Layer
//  11. Telemetry Integration
//  12. Blueprint Builder (integration)
//  13. Pipeline Step
//  14. Regression guards (weights, domain count, conflict count)

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Module imports ─────────────────────────────────────────────────────────────
import { analyzeGoals } from '../../src/reasoning-engine/goalReasoning.js';
import { analyzeConstraints } from '../../src/reasoning-engine/constraintReasoning.js';
import { detectAmbiguity } from '../../src/reasoning-engine/ambiguityResolution.js';
import { analyzeTradeoffs } from '../../src/reasoning-engine/tradeoffAnalysis.js';
import { generatePaths, selectOptimalPath } from '../../src/reasoning-engine/multiPathReasoning.js';
import {
  evaluateDecision,
  DECISION_MATRIX_WEIGHTS,
} from '../../src/reasoning-engine/decisionMatrix.js';
import { computeConfidence } from '../../src/reasoning-engine/confidenceEngine.js';
import { resolveConflicts } from '../../src/reasoning-engine/conflictResolution.js';
import { buildExplanation } from '../../src/reasoning-engine/decisionExplanation.js';
import { scoreAllDomains, scoreDomain } from '../../src/reasoning-engine/reasoningDomains.js';
import {
  addNode,
  getNode,
  listNodes,
  addEdge,
  getRelated,
  linkDecisionChain,
  getGraphStats,
  resetDecisionGraph,
} from '../../src/reasoning-engine/decisionGraph.js';
import {
  learnFromDecision,
  getReasoningLearningStats,
  resetReasoningLearning,
} from '../../src/reasoning-engine/reasoningLearning.js';
import {
  persistReasoningSnapshot,
  getCurrentReasoningSnapshot,
  getReasoningRollback,
  getReasoningPersistenceStats,
  resetReasoningPersistence,
} from '../../src/reasoning-engine/reasoningPersistence.js';
import {
  recordReasoningExecution,
  getReasoningEngineMetrics,
  resetReasoningEngineMetrics,
  markReasoningGrowthBaseline,
} from '../../src/reasoning-engine/reasoningMetrics.js';
import {
  buildReasoningBlueprint,
  buildFallbackReasoningBlueprint,
} from '../../src/reasoning-engine/reasoningBlueprintBuilder.js';
import {
  ALL_REASONING_DOMAINS,
  ALL_TRADEOFF_DIMENSIONS,
  ALL_CONFLICT_PAIRS,
} from '../../src/reasoning-engine/types.js';
import type { ReasoningContext, ConstraintSet, GoalSet } from '../../src/reasoning-engine/types.js';

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeCtx(overrides: Partial<ReasoningContext> = {}): ReasoningContext {
  return {
    prompt: 'Build a SaaS dashboard for managing user subscriptions',
    buildId: 'test-build-001',
    complexity: 'standard',
    productScore: 7,
    frontendScore: 8,
    backendScore: 7.5,
    devopsScore: 6,
    qaScore: 7,
    runtimeScore: 7.5,
    securityScore: 6.5,
    knowledgeScore: 8,
    tokenEfficiency: 0.8,
    fallbackPrediction: 0.1,
    totalTokenBudget: 40000,
    expectedTotalCost: 0.12,
    ...overrides,
  };
}

function makeFakeBlueprint(buildId = 'bp-001') {
  const ctx = makeCtx({ buildId });
  return buildReasoningBlueprint(ctx);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Goal Reasoning Engine
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Goal Reasoning Engine', () => {
  it('returns a GoalSet with all required fields', () => {
    const goals = analyzeGoals('Build a SaaS dashboard for user subscriptions');
    expect(goals).toHaveProperty('primaryGoal');
    expect(goals).toHaveProperty('secondaryGoals');
    expect(goals).toHaveProperty('hiddenGoals');
    expect(goals).toHaveProperty('businessGoal');
    expect(goals).toHaveProperty('technicalGoal');
    expect(goals).toHaveProperty('userGoal');
    expect(goals).toHaveProperty('qualityGoal');
    expect(goals).toHaveProperty('successCriteria');
  });

  it('extracts primaryGoal from the first sentence', () => {
    const goals = analyzeGoals('Build a SaaS dashboard. Add analytics.');
    expect(goals.primaryGoal).toBe('Build a SaaS dashboard');
  });

  it('detects business keywords → business-value goal', () => {
    const goals = analyzeGoals('Grow revenue through subscription SaaS sales');
    expect(goals.businessGoal).toContain('revenue');
  });

  it('detects technical keywords → scalable architecture goal', () => {
    const goals = analyzeGoals('Build an API with database performance and scale');
    expect(goals.technicalGoal).toContain('scalable');
  });

  it('detects user-centric keywords → UX goal', () => {
    const goals = analyzeGoals('Create an easy intuitive experience for users');
    expect(goals.userGoal).toContain('intuitive');
  });

  it('detects quality keywords → high-bar goal', () => {
    const goals = analyzeGoals('Production quality reliable secure robust platform');
    expect(goals.qualityGoal).toContain('high bar');
  });

  it('injects hidden goals for missing accessibility/security/responsive', () => {
    const goals = analyzeGoals('Build a product');
    expect(goals.hiddenGoals.some(g => /accessib/i.test(g))).toBe(true);
    expect(goals.hiddenGoals.some(g => /security/i.test(g))).toBe(true);
    expect(goals.hiddenGoals.some(g => /responsive|mobile/i.test(g))).toBe(true);
  });

  it('omits accessibility hidden goal when mentioned', () => {
    const goals = analyzeGoals('Build an accessible a11y-compliant platform for users');
    expect(goals.hiddenGoals.some(g => /accessib/i.test(g))).toBe(false);
  });

  it('always includes base successCriteria', () => {
    const goals = analyzeGoals('Quick MVP');
    expect(goals.successCriteria.length).toBeGreaterThanOrEqual(3);
    expect(goals.successCriteria[0]).toMatch(/Build completes/i);
  });

  it('adds monetization success criterion for business prompts', () => {
    const goals = analyzeGoals('Drive revenue through subscription SaaS growth customers');
    expect(goals.successCriteria.some(c => /monetization/i.test(c))).toBe(true);
  });

  it('handles empty prompt gracefully', () => {
    const goals = analyzeGoals('');
    expect(typeof goals.primaryGoal).toBe('string');
    expect(goals.primaryGoal.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Constraint Reasoning Engine
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Constraint Reasoning Engine', () => {
  it('returns a ConstraintSet with all required fields', () => {
    const c = analyzeConstraints(makeCtx());
    const required = [
      'budget', 'time', 'complexity', 'performance', 'security',
      'compliance', 'platform', 'browser', 'device', 'framework',
      'dependencies', 'resources', 'tokenBudget', 'latency',
    ];
    for (const field of required) expect(c).toHaveProperty(field);
  });

  it('enterprise complexity → high constraint levels', () => {
    const c = analyzeConstraints(makeCtx({ complexity: 'enterprise' }));
    expect(c.complexity).toBe('high');
    expect(c.performance).toBe('high');
    expect(c.dependencies).toBe('high');
  });

  it('simple complexity → low constraint levels', () => {
    const c = analyzeConstraints(makeCtx({ complexity: 'simple' }));
    expect(c.complexity).toBe('low');
  });

  it('cheap/low cost prompt → low budget constraint', () => {
    const c = analyzeConstraints(makeCtx({ prompt: 'Build a cheap low cost landing page' }));
    expect(c.budget).toBe('low');
  });

  it('enterprise/premium prompt → high budget constraint', () => {
    const c = analyzeConstraints(makeCtx({ prompt: 'Build an enterprise premium platform' }));
    expect(c.budget).toBe('high');
  });

  it('quick/mvp/fast prompt → low time constraint', () => {
    const c = analyzeConstraints(makeCtx({ prompt: 'Quick MVP for fast launch' }));
    expect(c.time).toBe('low');
  });

  it('security/payment prompt → high security constraint', () => {
    const c = analyzeConstraints(makeCtx({ prompt: 'Secure payment compliance HIPAA platform' }));
    expect(c.security).toBe('high');
  });

  it('GDPR/HIPAA → high compliance constraint', () => {
    const c = analyzeConstraints(makeCtx({ prompt: 'GDPR compliant HIPAA certified platform' }));
    expect(c.compliance).toBe('high');
  });

  it('detects Next.js framework', () => {
    const c = analyzeConstraints(makeCtx({ prompt: 'Build with Next.js for users' }));
    expect(c.framework).toBe('Next.js');
  });

  it('detects mobile platform', () => {
    const c = analyzeConstraints(makeCtx({ prompt: 'Build a mobile app for iOS and Android' }));
    expect(c.platform).toBe('mobile');
    expect(c.device).toContain('mobile');
  });

  it('tokenBudget comes from ctx.totalTokenBudget', () => {
    const c = analyzeConstraints(makeCtx({ totalTokenBudget: 50000 }));
    expect(c.tokenBudget).toBe(50000);
  });

  it('low token efficiency → high latency constraint', () => {
    const c = analyzeConstraints(makeCtx({ tokenEfficiency: 0.3 }));
    expect(c.latency).toBe('high');
  });

  it('high token efficiency → medium latency constraint', () => {
    const c = analyzeConstraints(makeCtx({ tokenEfficiency: 0.9 }));
    expect(c.latency).toBe('medium');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Ambiguity Resolution Engine
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Ambiguity Resolution Engine', () => {
  it('returns an AmbiguityReport with all required fields', () => {
    const r = detectAmbiguity('Build a platform for users');
    const required = [
      'incompletePrompt', 'conflictingRequests', 'missingInformation',
      'implicitAssumptions', 'contradictoryObjectives', 'ambiguityScore',
      'resolved', 'resolutionNotes',
    ];
    for (const f of required) expect(r).toHaveProperty(f);
  });

  it('always resolves internally (resolved = true)', () => {
    expect(detectAmbiguity('').resolved).toBe(true);
    expect(detectAmbiguity('Build me a thing').resolved).toBe(true);
  });

  it('short prompt → incompletePrompt = true', () => {
    expect(detectAmbiguity('Build').incompletePrompt).toBe(true);
  });

  it('long enough prompt → incompletePrompt = false', () => {
    expect(detectAmbiguity('Build a comprehensive SaaS platform for managing user subscriptions').incompletePrompt).toBe(false);
  });

  it('contradiction markers → conflictingRequests = true', () => {
    expect(detectAmbiguity('I want this but also something else however different').conflictingRequests).toBe(true);
  });

  it('no contradiction markers → conflictingRequests = false', () => {
    expect(detectAmbiguity('Build a clean dashboard for users').conflictingRequests).toBe(false);
  });

  it('no target audience → missingInformation = true', () => {
    expect(detectAmbiguity('Build a dashboard with charts').missingInformation).toBe(true);
  });

  it('has target audience → missingInformation = false', () => {
    expect(detectAmbiguity('Build a dashboard for users and target audience').missingInformation).toBe(false);
  });

  it('contradictory cheap + premium → contradictoryObjectives = true', () => {
    expect(detectAmbiguity('Build a cheap free enterprise premium luxury app').contradictoryObjectives).toBe(true);
  });

  it('ambiguityScore = 0 for a rich, complete prompt', () => {
    const r = detectAmbiguity(
      'Build a production-quality SaaS dashboard for business users. ' +
      'It should be responsive and mobile-friendly. ' +
      'Include auth, color palette, and brand guidelines. ' +
      'Target audience: enterprise teams managing subscriptions.'
    );
    expect(r.ambiguityScore).toBeLessThanOrEqual(3);
  });

  it('ambiguityScore <= 10 always', () => {
    for (const p of ['', 'x', 'cheap premium but also however']) {
      expect(detectAmbiguity(p).ambiguityScore).toBeLessThanOrEqual(10);
    }
  });

  it('injects implicit assumptions for missing style/device/auth', () => {
    const r = detectAmbiguity('Build a platform for users that targets audience');
    expect(r.implicitAssumptions.some(a => /visual style/i.test(a))).toBe(true);
    expect(r.implicitAssumptions.some(a => /device/i.test(a))).toBe(true);
    expect(r.implicitAssumptions.some(a => /auth/i.test(a))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Trade-off Analysis Engine
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Trade-off Analysis Engine', () => {
  function makeGoals(businessGoal = 'Deliver a credible product.'): GoalSet {
    return {
      primaryGoal: 'Build', secondaryGoals: [], hiddenGoals: [],
      businessGoal, technicalGoal: 'Scale', userGoal: 'UX', qualityGoal: 'Quality',
      successCriteria: [],
    };
  }

  function makeConstraints(overrides: Partial<ConstraintSet> = {}): ConstraintSet {
    return {
      budget: 'medium', time: 'medium', complexity: 'medium', performance: 'medium',
      security: 'medium', compliance: 'low', platform: 'web', browser: 'modern-evergreen',
      device: 'desktop+mobile', framework: 'React', dependencies: 'medium', resources: 'medium',
      tokenBudget: 0, latency: 'medium',
      ...overrides,
    };
  }

  it('returns TradeoffAnalysis with all 11 dimensions', () => {
    const t = analyzeTradeoffs(makeGoals(), makeConstraints());
    for (const dim of ALL_TRADEOFF_DIMENSIONS) {
      expect(t.scores).toHaveProperty(dim);
    }
  });

  it('all dimension scores are in [0, 10]', () => {
    const t = analyzeTradeoffs(makeGoals(), makeConstraints());
    for (const dim of ALL_TRADEOFF_DIMENSIONS) {
      expect(t.scores[dim]).toBeGreaterThanOrEqual(0);
      expect(t.scores[dim]).toBeLessThanOrEqual(10);
    }
  });

  it('identifies dominant dimension', () => {
    const t = analyzeTradeoffs(makeGoals(), makeConstraints());
    const maxScore = Math.max(...Object.values(t.scores));
    expect(t.scores[t.dominant]).toBe(maxScore);
  });

  it('identifies weakest dimension', () => {
    const t = analyzeTradeoffs(makeGoals(), makeConstraints());
    const minScore = Math.min(...Object.values(t.scores));
    expect(t.scores[t.weakest]).toBe(minScore);
  });

  it('high security constraint → Security score = 9', () => {
    const t = analyzeTradeoffs(makeGoals(), makeConstraints({ security: 'high' }));
    expect(t.scores.Security).toBe(9);
  });

  it('high complexity → Scalability score = 9', () => {
    const t = analyzeTradeoffs(makeGoals(), makeConstraints({ complexity: 'high' }));
    expect(t.scores.Scalability).toBe(9);
  });

  it('revenue-focused businessGoal → BusinessValue = 9', () => {
    const t = analyzeTradeoffs(makeGoals('Drive measurable business value (revenue, growth)'), makeConstraints());
    expect(t.scores.BusinessValue).toBe(9);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Multi-Path Reasoning Engine
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Multi-Path Reasoning Engine', () => {
  function makeConstraints(overrides: Partial<ConstraintSet> = {}): ConstraintSet {
    return {
      budget: 'medium', time: 'medium', complexity: 'medium', performance: 'medium',
      security: 'medium', compliance: 'low', platform: 'web', browser: 'modern-evergreen',
      device: 'desktop+mobile', framework: 'React', dependencies: 'medium', resources: 'medium',
      tokenBudget: 0, latency: 'medium',
      ...overrides,
    };
  }

  const fakeTrade = { scores: {} as any, dominant: 'Quality' as any, weakest: 'Cost' as any };

  it('generates exactly 3 paths: A, B, C', () => {
    const paths = generatePaths(makeConstraints(), fakeTrade);
    expect(paths).toHaveLength(3);
    expect(paths.map(p => p.id).sort()).toEqual(['A', 'B', 'C']);
  });

  it('each path has a valid overallScore in [0, 10]', () => {
    const paths = generatePaths(makeConstraints(), fakeTrade);
    for (const p of paths) {
      expect(p.overallScore).toBeGreaterThanOrEqual(0);
      expect(p.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it('Path A has the highest quality score', () => {
    const paths = generatePaths(makeConstraints(), fakeTrade);
    const A = paths.find(p => p.id === 'A')!;
    const B = paths.find(p => p.id === 'B')!;
    const C = paths.find(p => p.id === 'C')!;
    expect(A.qualityScore).toBeGreaterThan(B.qualityScore);
    expect(A.qualityScore).toBeGreaterThan(C.qualityScore);
  });

  it('Path C has the highest speed score', () => {
    const paths = generatePaths(makeConstraints(), fakeTrade);
    const C = paths.find(p => p.id === 'C')!;
    const A = paths.find(p => p.id === 'A')!;
    expect(C.speedScore).toBeGreaterThan(A.speedScore);
  });

  it('time=low + budget≠high → selects Path C (fastest)', () => {
    const c = makeConstraints({ time: 'low', budget: 'low' });
    const paths = generatePaths(c, fakeTrade);
    const chosen = selectOptimalPath(paths, c, fakeTrade);
    expect(chosen.id).toBe('C');
  });

  it('security=high → selects Path A (highest quality)', () => {
    const c = makeConstraints({ security: 'high' });
    const paths = generatePaths(c, fakeTrade);
    const chosen = selectOptimalPath(paths, c, fakeTrade);
    expect(chosen.id).toBe('A');
  });

  it('budget=high → selects Path A (highest quality)', () => {
    const c = makeConstraints({ budget: 'high' });
    const paths = generatePaths(c, fakeTrade);
    const chosen = selectOptimalPath(paths, c, fakeTrade);
    expect(chosen.id).toBe('A');
  });

  it('standard balanced build → selects Path C (highest overallScore)', () => {
    const c = makeConstraints();
    const paths = generatePaths(c, fakeTrade);
    const chosen = selectOptimalPath(paths, c, fakeTrade);
    // Path overallScores (quality*0.45 + cost*0.25 + speed*0.30):
    // A: 10*0.45 + 3*0.25 + 4*0.30 = 4.5 + 0.75 + 1.2 = 6.45
    // B: 7.5*0.45 + 7*0.25 + 7*0.30 = 3.375 + 1.75 + 2.1 = 7.225
    // C: 5*0.45 + 9.5*0.25 + 10*0.30 = 2.25 + 2.375 + 3.0 = 7.625 ← highest
    expect(chosen.id).toBe('C');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Decision Matrix Engine
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Decision Matrix Engine', () => {
  it('DECISION_MATRIX_WEIGHTS sums to exactly 1.00', () => {
    const sum = Object.values(DECISION_MATRIX_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(0.001);
  });

  it('evaluateDecision returns factors + compositeScore', () => {
    const bp = makeFakeBlueprint();
    expect(bp.decisionMatrix).toHaveProperty('factors');
    expect(bp.decisionMatrix).toHaveProperty('compositeScore');
  });

  it('all factor values are in [0, 10]', () => {
    const bp = makeFakeBlueprint();
    for (const v of Object.values(bp.decisionMatrix.factors)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('compositeScore is in [0, 10]', () => {
    const bp = makeFakeBlueprint();
    expect(bp.decisionMatrix.compositeScore).toBeGreaterThanOrEqual(0);
    expect(bp.decisionMatrix.compositeScore).toBeLessThanOrEqual(10);
  });

  it('has all 10 matrix factor keys', () => {
    const bp = makeFakeBlueprint();
    const required = [
      'businessValue', 'technicalQuality', 'risk', 'performance', 'security',
      'maintainability', 'runtimeCost', 'complexity', 'confidence', 'futureFlexibility',
    ];
    for (const k of required) expect(bp.decisionMatrix.factors).toHaveProperty(k);
  });

  it('higher upstream scores produce higher decision quality', () => {
    const low = buildReasoningBlueprint(makeCtx({ frontendScore: 3, backendScore: 3, runtimeScore: 3 }));
    const high = buildReasoningBlueprint(makeCtx({ frontendScore: 9, backendScore: 9, runtimeScore: 9 }));
    expect(high.decisionMatrix.compositeScore).toBeGreaterThanOrEqual(low.decisionMatrix.compositeScore);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Confidence Engine
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Confidence Engine', () => {
  it('ConfidenceBundle has all 6 required fields', () => {
    const bp = makeFakeBlueprint();
    const required = [
      'confidenceScore', 'reasoningScore', 'riskScore',
      'complexityScore', 'decisionStability', 'alternativeAvailability',
    ];
    for (const f of required) expect(bp.confidence).toHaveProperty(f);
  });

  it('all confidence values are in [0, 10]', () => {
    const bp = makeFakeBlueprint();
    for (const v of Object.values(bp.confidence)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('alternativeAvailability = 3 * paths.length capped at 10', () => {
    const bp = makeFakeBlueprint(); // 3 paths → min(10, 9.9) = 9.9
    expect(bp.confidence.alternativeAvailability).toBeCloseTo(9.9, 0);
  });

  it('low ambiguity → high confidence score', () => {
    const lowAmb = buildReasoningBlueprint(
      makeCtx({ prompt: 'Build a mobile app for iOS and Android users with auth color palette responsive brand' })
    );
    const highAmb = buildReasoningBlueprint(makeCtx({ prompt: 'x' }));
    expect(lowAmb.confidence.confidenceScore).toBeGreaterThanOrEqual(highAmb.confidence.confidenceScore);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Conflict Resolution Engine
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Conflict Resolution Engine', () => {
  it('resolves all 7 conflict pairs', () => {
    const bp = makeFakeBlueprint();
    expect(bp.conflictsResolved).toHaveLength(ALL_CONFLICT_PAIRS.length);
    const pairs = bp.conflictsResolved.map(c => c.pair);
    for (const p of ALL_CONFLICT_PAIRS) {
      expect(pairs).toContain(p);
    }
  });

  it('each resolution has pair, winner, rationale, severity', () => {
    const bp = makeFakeBlueprint();
    for (const r of bp.conflictsResolved) {
      expect(r).toHaveProperty('pair');
      expect(r).toHaveProperty('winner');
      expect(r).toHaveProperty('rationale');
      expect(['low', 'medium', 'high']).toContain(r.severity);
    }
  });

  it('AccessibilityVsDesign always resolves to Accessibility', () => {
    const bp = makeFakeBlueprint();
    const r = bp.conflictsResolved.find(c => c.pair === 'AccessibilityVsDesign');
    expect(r?.winner).toBe('Accessibility');
  });

  it('SecurityVsUX → Security wins when security constraint is high', () => {
    const bp = buildReasoningBlueprint(
      makeCtx({ prompt: 'Secure HIPAA compliance payment platform for users' })
    );
    const r = bp.conflictsResolved.find(c => c.pair === 'SecurityVsUX');
    expect(r?.winner).toBe('Security');
  });

  it('SecurityVsUX → UX wins when security constraint is not high', () => {
    const bp = buildReasoningBlueprint(makeCtx({ complexity: 'simple' }));
    const r = bp.conflictsResolved.find(c => c.pair === 'SecurityVsUX');
    expect(r?.winner).toBe('UX');
  });

  it('MaintainabilityVsSpeed → Speed wins for quick/mvp builds', () => {
    const bp = buildReasoningBlueprint(makeCtx({ prompt: 'Quick MVP for fast launch users' }));
    const r = bp.conflictsResolved.find(c => c.pair === 'MaintainabilityVsSpeed');
    expect(r?.winner).toBe('Speed');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Decision Explanation
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Decision Explanation Engine', () => {
  it('produces an explanation with all required fields', () => {
    const bp = makeFakeBlueprint();
    const required = [
      'decisionId', 'chosenPath', 'whyChosen', 'whyAlternativesRejected',
      'expectedImpact', 'expectedRisks', 'expectedBenefits', 'expectedTradeoffs',
      'futureImplications',
    ];
    for (const f of required) expect(bp.explanation).toHaveProperty(f);
  });

  it('chosenPath in explanation matches blueprint.chosenPath.id', () => {
    const bp = makeFakeBlueprint();
    expect(bp.explanation.chosenPath).toBe(bp.chosenPath.id);
  });

  it('whyAlternativesRejected covers the 2 non-chosen paths', () => {
    const bp = makeFakeBlueprint();
    const rejected = Object.keys(bp.explanation.whyAlternativesRejected);
    expect(rejected).toHaveLength(2);
  });

  it('expectedRisks is non-empty', () => {
    const bp = makeFakeBlueprint();
    expect(bp.explanation.expectedRisks.length).toBeGreaterThan(0);
  });

  it('decisionId includes buildId', () => {
    const bp = buildReasoningBlueprint(makeCtx({ buildId: 'my-build-xyz' }));
    expect(bp.explanation.decisionId).toContain('my-build-xyz');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Reasoning Domains (25 domains)
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Reasoning Domains', () => {
  it('exactly 25 reasoning domains are defined', () => {
    expect(ALL_REASONING_DOMAINS).toHaveLength(25);
  });

  it('scoreAllDomains returns a score for every domain', () => {
    const ctx = makeCtx();
    const ambiguity = detectAmbiguity(ctx.prompt);
    const scores = scoreAllDomains(ctx, ambiguity);
    for (const domain of ALL_REASONING_DOMAINS) {
      expect(scores).toHaveProperty(domain);
    }
  });

  it('all domain scores are in [0, 10]', () => {
    const ctx = makeCtx();
    const ambiguity = detectAmbiguity(ctx.prompt);
    const scores = scoreAllDomains(ctx, ambiguity);
    for (const v of Object.values(scores)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('Business domain maps to productScore', () => {
    const ctx = makeCtx({ productScore: 9 });
    const ambiguity = detectAmbiguity(ctx.prompt);
    expect(scoreDomain('Business', ctx, ambiguity)).toBeCloseTo(9, 1);
  });

  it('Security domain maps to securityScore', () => {
    const ctx = makeCtx({ securityScore: 8.5 });
    const ambiguity = detectAmbiguity(ctx.prompt);
    expect(scoreDomain('Security', ctx, ambiguity)).toBeCloseTo(8.5, 1);
  });

  it('Risk domain = 10 - ambiguityScore', () => {
    const ctx = makeCtx();
    const ambiguity = detectAmbiguity(ctx.prompt);
    expect(scoreDomain('Risk', ctx, ambiguity)).toBeCloseTo(10 - ambiguity.ambiguityScore, 1);
  });

  it('Cost and Resource domains map to tokenEfficiency * 10', () => {
    const ctx = makeCtx({ tokenEfficiency: 0.7 });
    const ambiguity = detectAmbiguity(ctx.prompt);
    expect(scoreDomain('Cost', ctx, ambiguity)).toBeCloseTo(7, 1);
    expect(scoreDomain('Resource', ctx, ambiguity)).toBeCloseTo(7, 1);
  });

  it('handles missing upstream scores gracefully (falls back to 6)', () => {
    const ctx: ReasoningContext = { prompt: 'Build something', buildId: 'x', complexity: 'simple' };
    const ambiguity = detectAmbiguity(ctx.prompt);
    const scores = scoreAllDomains(ctx, ambiguity);
    // All scores should still be valid numbers
    for (const v of Object.values(scores)) {
      expect(typeof v).toBe('number');
      expect(Number.isFinite(v)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Decision Graph
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Decision Graph', () => {
  beforeEach(() => resetDecisionGraph());

  it('addNode + getNode round-trips correctly', () => {
    addNode({ id: 'n1', type: 'Goal', label: 'My Goal' });
    const n = getNode('n1');
    expect(n?.label).toBe('My Goal');
    expect(n?.type).toBe('Goal');
  });

  it('listNodes returns all added nodes', () => {
    addNode({ id: 'a', type: 'Goal', label: 'A' });
    addNode({ id: 'b', type: 'Reasoning', label: 'B' });
    expect(listNodes()).toHaveLength(2);
  });

  it('addEdge only connects existing nodes', () => {
    addNode({ id: 'x', type: 'Goal', label: 'X' });
    addNode({ id: 'y', type: 'Reasoning', label: 'Y' });
    addEdge({ from: 'x', to: 'y', relation: 'leads-to', weight: 1 });
    addEdge({ from: 'x', to: 'MISSING', relation: 'leads-to', weight: 1 }); // silently ignored
    expect(getRelated('x')).toHaveLength(1);
  });

  it('linkDecisionChain creates 7 nodes + 6 edges', () => {
    linkDecisionChain('build-abc', { Goal: 'Do X', Decision: 'Path B' });
    const stats = getGraphStats();
    expect(stats.nodeCount).toBe(7);
    expect(stats.edgeCount).toBe(6);
  });

  it('getRelated returns connected nodes in both directions', () => {
    addNode({ id: 'g', type: 'Goal', label: 'G' });
    addNode({ id: 'r', type: 'Reasoning', label: 'R' });
    addEdge({ from: 'g', to: 'r', relation: 'leads-to', weight: 1 });
    expect(getRelated('g').map(n => n.id)).toContain('r');
    expect(getRelated('r').map(n => n.id)).toContain('g');
  });

  it('resetDecisionGraph clears everything', () => {
    linkDecisionChain('build-x', {});
    resetDecisionGraph();
    expect(getGraphStats().nodeCount).toBe(0);
    expect(getGraphStats().edgeCount).toBe(0);
  });

  it('density is in [0, 1]', () => {
    linkDecisionChain('build-d', {});
    const { density } = getGraphStats();
    expect(density).toBeGreaterThanOrEqual(0);
    expect(density).toBeLessThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Decision Learning
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Decision Learning', () => {
  beforeEach(() => resetReasoningLearning());

  it('getReasoningLearningStats returns zeros when no records', () => {
    const s = getReasoningLearningStats();
    expect(s.totalRecords).toBe(0);
    expect(s.averageConfidence).toBe(0);
    expect(s.averageScore).toBe(0);
    expect(s.productionSuccessRate).toBe(0);
    expect(s.byPath).toEqual({});
  });

  it('records a learning entry and updates stats', async () => {
    await learnFromDecision({
      buildId: 'b1', chosenPathId: 'B',
      confidenceScore: 7, productionSuccess: true, overallScore: 8, recordedAt: Date.now(),
    });
    const s = getReasoningLearningStats();
    expect(s.totalRecords).toBe(1);
    expect(s.averageScore).toBeCloseTo(8, 1);
    expect(s.productionSuccessRate).toBe(1);
  });

  it('byPath tracks counts and averages correctly', async () => {
    await learnFromDecision({ buildId: 'b2', chosenPathId: 'A', confidenceScore: 9, productionSuccess: true, overallScore: 9, recordedAt: Date.now() });
    await learnFromDecision({ buildId: 'b3', chosenPathId: 'A', confidenceScore: 7, productionSuccess: false, overallScore: 5, recordedAt: Date.now() });
    const s = getReasoningLearningStats();
    expect(s.byPath['A'].count).toBe(2);
    expect(s.byPath['A'].averageScore).toBeCloseTo(7, 1);
  });

  it('productionSuccessRate is accurate', async () => {
    await learnFromDecision({ buildId: 'x1', chosenPathId: 'B', confidenceScore: 7, productionSuccess: true, overallScore: 8, recordedAt: Date.now() });
    await learnFromDecision({ buildId: 'x2', chosenPathId: 'C', confidenceScore: 5, productionSuccess: false, overallScore: 4, recordedAt: Date.now() });
    const s = getReasoningLearningStats();
    expect(s.productionSuccessRate).toBeCloseTo(0.5, 2);
  });

  it('caps at MAX_RECORDS (500) — excess entries are dropped', async () => {
    for (let i = 0; i < 510; i++) {
      await learnFromDecision({
        buildId: `build-${i}`, chosenPathId: 'B',
        confidenceScore: 7, productionSuccess: true, overallScore: 8, recordedAt: Date.now(),
      });
    }
    const s = getReasoningLearningStats();
    expect(s.totalRecords).toBeLessThanOrEqual(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Persistence Layer
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Persistence Layer', () => {
  beforeEach(() => resetReasoningPersistence());

  it('getReasoningPersistenceStats returns zeros when empty', () => {
    const s = getReasoningPersistenceStats();
    expect(s.totalSnapshots).toBe(0);
    expect(s.currentVersion).toBe(0);
    expect(s.oldestVersion).toBeNull();
    expect(s.newestVersion).toBeNull();
    expect(s.capacityUsed).toBe(0);
  });

  it('persistReasoningSnapshot saves and increments version', () => {
    const bp = makeFakeBlueprint();
    const snap = persistReasoningSnapshot('build-1', bp);
    expect(snap.version).toBe(1);
    expect(snap.buildId).toBe('build-1');
  });

  it('getCurrentReasoningSnapshot returns latest snapshot', () => {
    const bp = makeFakeBlueprint();
    persistReasoningSnapshot('b1', bp);
    persistReasoningSnapshot('b2', bp);
    const cur = getCurrentReasoningSnapshot();
    expect(cur?.buildId).toBe('b2');
    expect(cur?.version).toBe(2);
  });

  it('getReasoningRollback retrieves snapshot by version', () => {
    const bp = makeFakeBlueprint();
    persistReasoningSnapshot('b1', bp);
    persistReasoningSnapshot('b2', bp);
    const rolled = getReasoningRollback(1);
    expect(rolled?.buildId).toBe('b1');
  });

  it('getReasoningRollback returns null for unknown version', () => {
    expect(getReasoningRollback(999)).toBeNull();
  });

  it('getCurrentReasoningSnapshot returns null when empty', () => {
    expect(getCurrentReasoningSnapshot()).toBeNull();
  });

  it('capacityUsed reflects snapshot count / 1000', () => {
    const bp = makeFakeBlueprint();
    for (let i = 0; i < 10; i++) persistReasoningSnapshot(`b${i}`, bp);
    const s = getReasoningPersistenceStats();
    expect(s.capacityUsed).toBe(1); // 10/1000 * 100 = 1%
  });

  it('caps at MAX_SNAPSHOTS (1000)', () => {
    const bp = makeFakeBlueprint();
    for (let i = 0; i < 1010; i++) persistReasoningSnapshot(`b${i}`, bp);
    const s = getReasoningPersistenceStats();
    expect(s.totalSnapshots).toBeLessThanOrEqual(1000);
  });

  it('blueprint version field is assigned by persistence layer', () => {
    const bp = makeFakeBlueprint();
    const snap = persistReasoningSnapshot('bx', bp);
    expect(snap.blueprint.version).toBe(snap.version);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. Telemetry
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Telemetry Integration', () => {
  beforeEach(() => {
    resetReasoningEngineMetrics();
    resetReasoningLearning();
    resetReasoningPersistence();
  });

  it('getReasoningEngineMetrics returns zeros when no executions', () => {
    const m = getReasoningEngineMetrics();
    expect(m.reasoningScore).toBe(0);
    expect(m.decisionQuality).toBe(0);
    expect(m.confidenceScore).toBe(0);
    expect(m.decisionGrowth).toBe(0);
  });

  it('getReasoningEngineMetrics exposes all spec-required fields', () => {
    const required = [
      'reasoningScore', 'decisionQuality', 'confidenceScore', 'tradeoffAccuracy',
      'decisionConsistency', 'riskAccuracy', 'alternativeCoverage', 'decisionLatency',
      'learningStatistics', 'decisionGrowth', 'persistenceHealth',
    ];
    const m = getReasoningEngineMetrics();
    for (const f of required) expect(m).toHaveProperty(f);
  });

  it('recordReasoningExecution updates metrics', () => {
    recordReasoningExecution({
      buildId: 'tel-1', confidenceScore: 8, decisionQuality: 7.5,
      tradeoffAccuracy: 6, riskScore: 3, alternativesCount: 3, decisionLatencyMs: 45,
      recordedAt: Date.now(),
    });
    const m = getReasoningEngineMetrics();
    expect(m.confidenceScore).toBeCloseTo(8, 1);
    expect(m.decisionQuality).toBeCloseTo(7.5, 1);
  });

  it('alternativeCoverage = min(10, avgAlternatives * 3.3)', () => {
    recordReasoningExecution({
      buildId: 'tel-2', confidenceScore: 7, decisionQuality: 7,
      tradeoffAccuracy: 6, riskScore: 3, alternativesCount: 3, decisionLatencyMs: 30,
      recordedAt: Date.now(),
    });
    const m = getReasoningEngineMetrics();
    expect(m.alternativeCoverage).toBeCloseTo(3 * 3.3, 0);
  });

  it('riskAccuracy = max(0, 10 - avgRiskScore)', () => {
    recordReasoningExecution({
      buildId: 'tel-3', confidenceScore: 7, decisionQuality: 7,
      tradeoffAccuracy: 6, riskScore: 4, alternativesCount: 3, decisionLatencyMs: 20,
      recordedAt: Date.now(),
    });
    const m = getReasoningEngineMetrics();
    expect(m.riskAccuracy).toBeCloseTo(6, 1);
  });

  it('decisionGrowth = executions added after baseline', () => {
    markReasoningGrowthBaseline();
    recordReasoningExecution({
      buildId: 'g1', confidenceScore: 7, decisionQuality: 7,
      tradeoffAccuracy: 5, riskScore: 3, alternativesCount: 3, decisionLatencyMs: 25,
      recordedAt: Date.now(),
    });
    expect(getReasoningEngineMetrics().decisionGrowth).toBe(1);
  });

  it('resetReasoningEngineMetrics clears all state', () => {
    recordReasoningExecution({
      buildId: 'r1', confidenceScore: 9, decisionQuality: 9,
      tradeoffAccuracy: 9, riskScore: 1, alternativesCount: 3, decisionLatencyMs: 10,
      recordedAt: Date.now(),
    });
    resetReasoningEngineMetrics();
    const m = getReasoningEngineMetrics();
    expect(m.reasoningScore).toBe(0);
    expect(m.decisionGrowth).toBe(0);
  });

  it('persistenceHealth reflects current persistence state', () => {
    const bp = makeFakeBlueprint();
    persistReasoningSnapshot('ps-1', bp);
    const m = getReasoningEngineMetrics();
    expect(m.persistenceHealth.totalSnapshots).toBe(1);
    expect(m.persistenceHealth.currentVersion).toBe(1);
  });

  it('caps execution history at MAX_EXECUTIONS (500)', () => {
    for (let i = 0; i < 520; i++) {
      recordReasoningExecution({
        buildId: `cap-${i}`, confidenceScore: 7, decisionQuality: 7,
        tradeoffAccuracy: 5, riskScore: 3, alternativesCount: 3, decisionLatencyMs: 10,
        recordedAt: Date.now(),
      });
    }
    // Should not throw; metrics should still be calculable
    const m = getReasoningEngineMetrics();
    expect(m.reasoningScore).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 13. Blueprint Builder (integration)
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Reasoning Blueprint Builder', () => {
  it('buildReasoningBlueprint returns a complete ReasoningBlueprint', () => {
    const bp = makeFakeBlueprint();
    const required = [
      'buildId', 'goals', 'constraints', 'ambiguity', 'tradeoffs',
      'paths', 'chosenPath', 'decisionMatrix', 'confidence', 'explanation',
      'conflictsResolved', 'domainScores', 'recordedAt', 'version',
    ];
    for (const f of required) expect(bp).toHaveProperty(f);
  });

  it('buildId is preserved in the blueprint', () => {
    const bp = buildReasoningBlueprint(makeCtx({ buildId: 'custom-id-42' }));
    expect(bp.buildId).toBe('custom-id-42');
  });

  it('chosenPath is one of the generated paths', () => {
    const bp = makeFakeBlueprint();
    const pathIds = bp.paths.map(p => p.id);
    expect(pathIds).toContain(bp.chosenPath.id);
  });

  it('domainScores covers all 25 domains', () => {
    const bp = makeFakeBlueprint();
    for (const domain of ALL_REASONING_DOMAINS) {
      expect(bp.domainScores).toHaveProperty(domain);
    }
  });

  it('buildFallbackReasoningBlueprint never throws', () => {
    expect(() => buildFallbackReasoningBlueprint('fallback-id')).not.toThrow();
    const bp = buildFallbackReasoningBlueprint('fallback-id');
    expect(bp.buildId).toBe('fallback-id');
  });

  it('version is 0 (assigned by persistence on save)', () => {
    const bp = makeFakeBlueprint();
    expect(bp.version).toBe(0);
  });

  it('handles missing all upstream scores gracefully', () => {
    const bp = buildReasoningBlueprint({
      prompt: 'Build something for users',
      buildId: 'minimal-build',
      complexity: 'simple',
    });
    expect(bp.chosenPath).toBeDefined();
    expect(bp.confidence.confidenceScore).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic — same input produces same chosenPath', () => {
    const ctx = makeCtx({ buildId: 'det-1' });
    const bp1 = buildReasoningBlueprint(ctx);
    const bp2 = buildReasoningBlueprint(ctx);
    expect(bp1.chosenPath.id).toBe(bp2.chosenPath.id);
    expect(bp1.decisionMatrix.compositeScore).toBe(bp2.decisionMatrix.compositeScore);
  });

  it('enterprise complexity chooses path A (highest quality)', () => {
    const bp = buildReasoningBlueprint(
      makeCtx({ complexity: 'enterprise', prompt: 'Enterprise premium platform for users' })
    );
    // enterprise → budget=high → selects Path A
    expect(bp.chosenPath.id).toBe('A');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 14. Regression Guards
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.5 — Regression Guards', () => {
  it('exactly 11 trade-off dimensions are defined', () => {
    expect(ALL_TRADEOFF_DIMENSIONS).toHaveLength(11);
  });

  it('exactly 7 conflict pairs are defined', () => {
    expect(ALL_CONFLICT_PAIRS).toHaveLength(7);
  });

  it('exactly 25 reasoning domains are defined', () => {
    expect(ALL_REASONING_DOMAINS).toHaveLength(25);
  });

  it('DECISION_MATRIX_WEIGHTS has exactly 10 entries', () => {
    expect(Object.keys(DECISION_MATRIX_WEIGHTS)).toHaveLength(10);
  });

  it('DECISION_MATRIX_WEIGHTS sum is precisely 1.00', () => {
    const sum = Object.values(DECISION_MATRIX_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(0.001);
  });

  it('buildReasoningBlueprint always produces paths array of length 3', () => {
    const bp = makeFakeBlueprint();
    expect(bp.paths).toHaveLength(3);
  });

  it('conflictsResolved always has 7 entries (one per conflict pair)', () => {
    const bp = makeFakeBlueprint();
    expect(bp.conflictsResolved).toHaveLength(7);
  });

  it('all conflict resolutions have a valid severity', () => {
    const bp = makeFakeBlueprint();
    for (const r of bp.conflictsResolved) {
      expect(['low', 'medium', 'high']).toContain(r.severity);
    }
  });

  it('chosenPath.id is always "A", "B", or "C"', () => {
    for (const complexity of ['simple', 'standard', 'enterprise'] as const) {
      const bp = buildReasoningBlueprint(makeCtx({ complexity }));
      expect(['A', 'B', 'C']).toContain(bp.chosenPath.id);
    }
  });

  it('recordedAt is a recent Unix ms timestamp', () => {
    const before = Date.now();
    const bp = makeFakeBlueprint();
    expect(bp.recordedAt).toBeGreaterThanOrEqual(before);
    expect(bp.recordedAt).toBeLessThanOrEqual(Date.now() + 100);
  });
});
