// ── V8.8 QA & Reliability Architect — Main Orchestrator ──────────────────────
//
// 22-phase deterministic QA planning engine.
// Zero LLM calls. All planners are pure functions. < 10ms execution.
//
import type { ProductManagerOutput }   from '../product-manager/productTypes.js';
import type { BackendArchitectOutput } from '../backend-architect/backendTypes.js';
import type { DevOpsArchitectOutput }  from '../devops-architect/devopsTypes.js';
import type { BackendType }            from '../backend-architect/backendTypes.js';
import type { QABlueprint, QAArchitectOutput } from './qaTypes.js';

import { planTestStrategy }         from './testStrategyPlanner.js';
import { planUnitTests }            from './unitTestPlanner.js';
import { planIntegrationTests }     from './integrationTestPlanner.js';
import { planAPITests }             from './apiTestPlanner.js';
import { planContractTests }        from './contractTestPlanner.js';
import { planE2ETests }             from './e2ePlanner.js';
import { planAccessibilityTests }   from './accessibilityTestPlanner.js';
import { planResponsiveTests }      from './responsiveTestPlanner.js';
import { planBrowserCompatibility } from './browserCompatibilityPlanner.js';
import { planMobileTests }          from './mobileTestPlanner.js';
import { planPerformanceTests }     from './performanceTestPlanner.js';
import { planSecurityTests }        from './securityTestPlanner.js';
import { planVisualRegression }     from './visualRegressionPlanner.js';
import { planChaosTests }           from './chaosTestPlanner.js';
import { planReliability }          from './reliabilityPlanner.js';
import { planCoverage }             from './coveragePlanner.js';
import { planRisks }                from './riskPlanner.js';
import { predictFailures }          from './failurePrediction.js';
import { validateQABlueprint }      from './qaValidator.js';
import { recordQABuild }            from './qaMetrics.js';
import { saveQABlueprint }          from './qaPersistence.js';

export function runDevOpsArchitect_unused(): void { /* keeps import linter quiet */ }

export function runQAArchitect(
  prompt:                string,
  productManagerOutput:  ProductManagerOutput,
  backendArchitectOutput:BackendArchitectOutput,
  _devopsArchitectOutput?:DevOpsArchitectOutput,
): QAArchitectOutput {
  const start = Date.now();

  const t: BackendType = backendArchitectOutput.blueprint.backendType;

  // ── Phases 1–18: deterministic planners ──────────────────────────────────
  const strategy          = planTestStrategy(t);
  const unitTests         = planUnitTests(t);
  const integrationTests  = planIntegrationTests(t);
  const apiTests          = planAPITests(t);
  const contractTests     = planContractTests(t);
  const e2eTests          = planE2ETests(t);
  const accessibilityTests= planAccessibilityTests(t);
  const responsiveTests   = planResponsiveTests(t);
  const browserCompatibility = planBrowserCompatibility(t);
  const mobileTests       = planMobileTests(t);
  const performanceTests  = planPerformanceTests(t);
  const securityTests     = planSecurityTests(t);
  const visualRegression  = planVisualRegression(t);
  const chaosTests        = planChaosTests(t);
  const reliability       = planReliability(t);
  const coverage          = planCoverage(t);
  const risk              = planRisks(t);
  const failurePredictions= predictFailures(t);

  // ── Phase 19: Validate ────────────────────────────────────────────────────
  // Build partial blueprint (without scores) to feed validator
  const partial: QABlueprint = {
    strategy, unitTests, integrationTests, apiTests, contractTests,
    e2eTests, accessibilityTests, responsiveTests, browserCompatibility,
    mobileTests, performanceTests, securityTests, visualRegression,
    chaosTests, reliability, coverage, risk, failurePredictions,
    qualityScores: [], overallScore: 0,
  };

  const { qualityScores, overallScore } = validateQABlueprint(partial);

  const blueprint: QABlueprint = Object.freeze({
    ...partial,
    qualityScores,
    overallScore,
  });

  // ── Phase 20: Record metrics (sync in-memory, non-blocking) ──────────────
  const dimMap = Object.fromEntries(qualityScores.map(q => [q.dimension, q.score])) as any;
  recordQABuild(strategy.strategy, overallScore, dimMap);

  // ── Phase 22: Persist (debounced, non-blocking) ───────────────────────────
  saveQABlueprint(blueprint);

  // ── Enrich downstream prompt ──────────────────────────────────────────────
  const enrichedPromptWithQA = [
    prompt,
    '\n--- QA ARCHITECTURE ---',
    `QA_STRATEGY: ${strategy.strategy} (confidence ${strategy.confidence})`,
    `TEST_PYRAMID: unit ${strategy.testPyramidRatios.unit}% / integration ${strategy.testPyramidRatios.integration}% / e2e ${strategy.testPyramidRatios.e2e}%`,
    `COVERAGE_TARGETS: unit ${coverage.unitPercent}% / api ${coverage.apiPercent}% / e2e ${coverage.e2ePercent}%`,
    `RELIABILITY_SLO: ${reliability.sloTarget}`,
    `RISK_SCORE: ${risk.overallRiskScore}/10 (${risk.highRiskCount} high, ${risk.mediumRiskCount} medium, ${risk.lowRiskCount} low)`,
    `A11Y_STANDARD: ${accessibilityTests.standard}`,
    `PERFORMANCE: LCP ≤ ${performanceTests.targetLCPms}ms, TTFB ≤ ${performanceTests.targetTTFBms}ms`,
    `E2E_JOURNEYS: ${e2eTests.journeys.join(', ')}`,
    `BROWSER_MATRIX: ${browserCompatibility.criticalBrowsers.join(', ')}`,
    `CHAOS_SCENARIOS: ${chaosTests.scenarios.join(', ')}`,
    `DEVOPS_QA_SCORE: ${overallScore.toFixed(2)}/10`,
  ].join('\n');

  const processingTimeMs = Date.now() - start;

  return {
    blueprint,
    overallScore,
    enrichedPromptWithQA,
    processingTimeMs,
  };
}
