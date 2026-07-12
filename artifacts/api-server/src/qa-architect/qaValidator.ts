// ── V8.8 QA Architect — Phase 19: QA Validator (10 dimensions) ───────────────
import type { QABlueprint, QAQualityScore, QADimension, QAValidationResult } from './qaTypes.js';

function clamp(v: number): number { return Math.min(10, Math.max(0, parseFloat(v.toFixed(2)))); }

function scoreTesting(bp: QABlueprint): QAQualityScore {
  let score = 5;
  if (bp.unitTests.estimatedTests > 50)       score += 1;
  if (bp.apiTests.hasAuthTests)                score += 0.5;
  if (bp.contractTests.hasContractTests)       score += 0.5;
  if (bp.e2eTests.framework === 'Playwright')  score += 0.5;
  if (bp.securityTests.hasXSSTests)            score += 0.5;
  if (bp.chaosTests.hasAutomation)             score += 0.5;
  if (bp.visualRegression.hasScreenshotComparison) score += 0.5;
  return { dimension: 'testing', score: clamp(score), rationale: 'Breadth of test type coverage' };
}

function scoreCoverage(bp: QABlueprint): QAQualityScore {
  const avg = (bp.coverage.unitPercent + bp.coverage.integrationPercent +
               bp.coverage.e2ePercent  + bp.coverage.apiPercent) / 4;
  const score = clamp((avg / 100) * 10);
  return { dimension: 'coverage', score, rationale: `Average coverage target: ${avg.toFixed(0)}%` };
}

function scoreReliability(bp: QABlueprint): QAQualityScore {
  const avail = bp.reliability.predictedAvailabilityPercent;
  let score = avail >= 99.99 ? 10 : avail >= 99.95 ? 9 : avail >= 99.9 ? 8 : avail >= 99.5 ? 7 : 6;
  if (bp.reliability.hasCircuitBreaker)       score = Math.min(10, score + 0.5);
  if (bp.reliability.hasGracefulDegradation)  score = Math.min(10, score + 0.5);
  return { dimension: 'reliability', score: clamp(score), rationale: `SLO: ${bp.reliability.sloTarget}` };
}

function scoreAccessibility(bp: QABlueprint): QAQualityScore {
  let score = 5;
  if (bp.accessibilityTests.hasKeyboardTests)  score += 0.8;
  if (bp.accessibilityTests.hasScreenReader)   score += 0.8;
  if (bp.accessibilityTests.hasContrastTests)  score += 0.7;
  if (bp.accessibilityTests.hasARIATests)      score += 0.7;
  if (bp.accessibilityTests.standard === 'WCAG2.1-AAA') score += 1;
  if (bp.accessibilityTests.automatedChecks >= 30) score += 1;
  return { dimension: 'accessibility', score: clamp(score), rationale: `${bp.accessibilityTests.standard} — ${bp.accessibilityTests.automatedChecks} automated checks` };
}

function scorePerformance(bp: QABlueprint): QAQualityScore {
  let score = 5;
  if (bp.performanceTests.hasLoadTests)       score += 1;
  if (bp.performanceTests.hasStressTests)     score += 0.5;
  if (bp.performanceTests.hasMemoryLeakTests) score += 0.5;
  if (bp.performanceTests.hasBundleSizeTests) score += 0.5;
  if (bp.performanceTests.hasHydrationTests)  score += 0.5;
  if (bp.performanceTests.targetLCPms <= 2500) score += 1;
  if (bp.performanceTests.targetTTFBms <= 300) score += 0.5;
  return { dimension: 'performance', score: clamp(score), rationale: `LCP ≤ ${bp.performanceTests.targetLCPms}ms, TTFB ≤ ${bp.performanceTests.targetTTFBms}ms` };
}

function scoreSecurity(bp: QABlueprint): QAQualityScore {
  const checks = [
    bp.securityTests.hasAuthTests, bp.securityTests.hasAuthzTests,
    bp.securityTests.hasJWTTests,  bp.securityTests.hasCSRFTests,
    bp.securityTests.hasXSSTests,  bp.securityTests.hasSQLInjectionTests,
    bp.securityTests.hasRateLimitTests, bp.securityTests.hasSecretsTests,
  ];
  const passing = checks.filter(Boolean).length;
  const score = 2 + (passing / checks.length) * 8;
  return { dimension: 'security', score: clamp(score), rationale: `${passing}/${checks.length} security test categories active` };
}

function scoreResponsiveness(bp: QABlueprint): QAQualityScore {
  const vp = bp.responsiveTests.viewports.length;
  const score = vp >= 6 ? 10 : vp >= 4 ? 8 : vp >= 3 ? 7 : 6;
  const extra = bp.responsiveTests.snapshotPerViewport ? 0.5 : 0;
  return { dimension: 'responsiveness', score: clamp(score + extra), rationale: `${vp} viewport breakpoints covered` };
}

function scoreCompatibility(bp: QABlueprint): QAQualityScore {
  const browsers = bp.browserCompatibility.browsers.length;
  const score = browsers >= 7 ? 10 : browsers >= 5 ? 8 : browsers >= 3 ? 7 : 5;
  return { dimension: 'compatibility', score: clamp(score), rationale: `${browsers} browsers in test matrix` };
}

function scoreRisk(bp: QABlueprint): QAQualityScore {
  // Lower risk = higher score
  const rs = bp.risk.overallRiskScore;
  const score = clamp(10 - rs);
  return { dimension: 'risk', score, rationale: `Risk score ${rs}/10 (lower is better)` };
}

function scoreMaintainability(bp: QABlueprint): QAQualityScore {
  let score = 5;
  if (bp.contractTests.hasVersioning)           score += 1;
  if (bp.coverage.hasThresholdEnforcement)      score += 1;
  if (bp.unitTests.hasMocking)                  score += 0.5;
  if (bp.e2eTests.hasRetry)                     score += 0.5;
  if (bp.e2eTests.ciIntegration)                score += 1;
  if (bp.visualRegression.snapshotCount >= 30)  score += 0.5;
  return { dimension: 'maintainability', score: clamp(score), rationale: 'CI integration, contract versioning, threshold enforcement' };
}

export function validateQABlueprint(bp: QABlueprint): QAValidationResult {
  const scorers: Array<(b: QABlueprint) => QAQualityScore> = [
    scoreTesting, scoreCoverage, scoreReliability, scoreAccessibility,
    scorePerformance, scoreSecurity, scoreResponsiveness,
    scoreCompatibility, scoreRisk, scoreMaintainability,
  ];
  const qualityScores = scorers.map(fn => fn(bp));
  const overallScore  = parseFloat((qualityScores.reduce((s, q) => s + q.score, 0) / qualityScores.length).toFixed(2));
  const confidence    = parseFloat((0.7 + overallScore / 100).toFixed(2));
  return { qualityScores, overallScore, confidence };
}
