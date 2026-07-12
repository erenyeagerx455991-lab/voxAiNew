// ── V9.0 Runtime Intelligence — Blueprint Validator ──────────────────────────
import type {
  RuntimeBlueprint,
  RuntimeQualityScore,
  RuntimeDimension,
} from './runtimeTypes.js';

function clamp(n: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, n));
}

// ── Per-dimension scorers ─────────────────────────────────────────────────────

function scoreGeneration(bp: RuntimeBlueprint): number {
  let s = 8;
  if (bp.generationStrategy.isDeterministic) s += 1;
  if (bp.generationStrategy.maxIterations >= 1) s += 0.5;
  if (bp.generationStrategy.contextDepth !== 'minimal' || bp.mode === 'Fast') s += 0.5;
  return clamp(s);
}

function scoreCandidate(bp: RuntimeBlueprint): number {
  const { count, type } = bp.candidateStrategy;
  let s = 7;
  if (count >= 2) s += 1;
  if (count >= 3) s += 1;
  if (type === 'full') s += 1;
  return clamp(s);
}

function scoreRepair(bp: RuntimeBlueprint): number {
  const { policy, maxPasses, threshold } = bp.repairStrategy;
  if (policy === 'skip') return 7; // acceptable for Fast mode
  let s = 7;
  if (maxPasses >= 2) s += 1;
  if (threshold >= 7) s += 1;
  if (threshold >= 8.5) s += 0.5;
  return clamp(s);
}

function scoreEvaluation(bp: RuntimeBlueprint): number {
  const { weights } = bp.evaluationStrategy;
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const sumOk = Math.abs(total - 1.0) < 0.02;
  let s = 7;
  if (sumOk) s += 2;
  if (bp.evaluationStrategy.threshold >= 6) s += 1;
  return clamp(s);
}

function scoreOptimization(bp: RuntimeBlueprint): number {
  let s = 7;
  // Consistency: Enterprise mode must have accessibilityPriority
  if (bp.mode === 'Enterprise' && bp.optimizationStrategy.accessibilityPriority) s += 1;
  if (bp.mode === 'Fast' && bp.optimizationStrategy.bundleSizeTarget === 'minimal') s += 1;
  if (bp.optimizationStrategy.designQualityOverSpeed && bp.mode !== 'Fast') s += 1;
  return clamp(s);
}

function scoreCaching(bp: RuntimeBlueprint): number {
  let s = 8;
  if (bp.cachingStrategy.cacheTTLSeconds > 0) s += 1;
  if (bp.cachingStrategy.useCache || bp.mode === 'Experimental') s += 1;
  return clamp(s);
}

function scoreContext(bp: RuntimeBlueprint): number {
  let s = 7;
  if (bp.contextStrategy.maxTokens >= 4096) s += 1;
  if (bp.contextStrategy.maxTokens >= 8192) s += 1;
  if (bp.contextStrategy.includeHistory && bp.mode !== 'Fast') s += 1;
  return clamp(s);
}

function scoreParallelization(bp: RuntimeBlueprint): number {
  let s = 7;
  if (bp.parallelizationStrategy.maxConcurrency >= 2) s += 1;
  if (bp.parallelizationStrategy.parallelizeCandidates) s += 1;
  if (bp.parallelizationStrategy.parallelizeRAG) s += 0.5;
  return clamp(s);
}

function scoreValidation(bp: RuntimeBlueprint): number {
  const level = bp.validationStrategy.level;
  const levelScore: Record<string, number> = {
    minimal: 6, standard: 7.5, strict: 8.5, enterprise: 9.5,
  };
  return clamp(levelScore[level] ?? 7);
}

function scoreRendering(bp: RuntimeBlueprint): number {
  let s = 8;
  if (bp.renderingStrategy.lazyLoadComponents) s += 1;
  if (bp.renderingStrategy.codesplit) s += 1;
  return clamp(s);
}

function scorePrompt(bp: RuntimeBlueprint): number {
  const depthScore: Record<string, number> = {
    minimal: 6, standard: 7.5, deep: 8.5, expert: 9.5,
  };
  return clamp(depthScore[bp.promptStrategy.depth] ?? 7);
}

function scoreRetry(bp: RuntimeBlueprint): number {
  let s = 7;
  if (bp.retryStrategy.maxRetries >= 2) s += 1;
  if (bp.retryStrategy.retryOnQualityFail) s += 1;
  if (bp.retryStrategy.backoffMs >= 1000) s += 1;
  return clamp(s);
}

function scoreStreaming(bp: RuntimeBlueprint): number {
  // SSE is always enabled — full marks for streaming
  return bp.streamingStrategy.enableSSE ? 10 : 0;
}

function scoreDeployment(bp: RuntimeBlueprint): number {
  let s = 7;
  if (bp.deploymentStrategy.cdnEnabled) s += 1;
  if (bp.deploymentStrategy.strategy !== 'immediate') s += 1;
  if (bp.deploymentStrategy.strategy === 'blue-green' || bp.deploymentStrategy.strategy === 'canary') s += 1;
  return clamp(s);
}

function scoreRisk(bp: RuntimeBlueprint): number {
  let s = 7;
  if (bp.riskStrategy.failSafe) s += 1;
  if (bp.riskStrategy.mitigationPriority.length >= 2) s += 1;
  if (bp.riskStrategy.level !== 'low') s += 1; // non-trivial risk = better coverage
  return clamp(s);
}

function scoreMemory(bp: RuntimeBlueprint): number {
  let s = 7;
  if (bp.memoryStrategy.maxContextRecords >= 100) s += 1;
  if (bp.memoryStrategy.keepArchitectContext) s += 1;
  if (bp.memoryStrategy.maxContextRecords >= 300) s += 1;
  return clamp(s);
}

// ── Weight map ────────────────────────────────────────────────────────────────
// Weights intentionally sum to 1.00
const WEIGHTS: Record<RuntimeDimension, number> = {
  generation:       0.10,
  candidate:        0.08,
  repair:           0.10,
  evaluation:       0.12,
  optimization:     0.07,
  caching:          0.05,
  context:          0.07,
  parallelization:  0.05,
  validation:       0.10,
  rendering:        0.05,
  prompt:           0.08,
  retry:            0.03,
  streaming:        0.03,
  deployment:       0.03,
  risk:             0.03,
  memory:           0.01,
};

const SCORERS: Record<RuntimeDimension, (bp: RuntimeBlueprint) => number> = {
  generation:       scoreGeneration,
  candidate:        scoreCandidate,
  repair:           scoreRepair,
  evaluation:       scoreEvaluation,
  optimization:     scoreOptimization,
  caching:          scoreCaching,
  context:          scoreContext,
  parallelization:  scoreParallelization,
  validation:       scoreValidation,
  rendering:        scoreRendering,
  prompt:           scorePrompt,
  retry:            scoreRetry,
  streaming:        scoreStreaming,
  deployment:       scoreDeployment,
  risk:             scoreRisk,
  memory:           scoreMemory,
};

const RATIONALE: Record<RuntimeDimension, string> = {
  generation:       'Mode consistency, determinism, context depth',
  candidate:        'Candidate count, type, and parallel generation',
  repair:           'Repair policy, pass count, and quality threshold',
  evaluation:       'Weight calibration, threshold, and priority dimension',
  optimization:     'Perf/animation/SEO/quality trade-off consistency',
  caching:          'Cache TTL and retrieval reuse policy',
  context:          'Token budget, compression, and history inclusion',
  parallelization:  'Concurrency ceiling and parallel strategy flags',
  validation:       'Validation thoroughness level',
  rendering:        'CSR/SSR/hybrid selection, lazy-load, codesplit',
  prompt:           'Prompt depth and system token budget',
  retry:            'Retry count, backoff, and quality-fail retry',
  streaming:        'SSE enabled (non-negotiable)',
  deployment:       'Deployment safety strategy and CDN usage',
  risk:             'Risk level coverage and fail-safe policy',
  memory:           'Context record limit and architect context retention',
};

export function validateRuntimeBlueprint(bp: RuntimeBlueprint): {
  qualityScores:  RuntimeQualityScore[];
  overallScore:   number;
  recommendations:string[];
} {
  const qualityScores: RuntimeQualityScore[] = [];
  let weighted = 0;

  for (const dim of Object.keys(WEIGHTS) as RuntimeDimension[]) {
    const score = parseFloat(SCORERS[dim](bp).toFixed(2));
    qualityScores.push({ dimension: dim, score, rationale: RATIONALE[dim] });
    weighted += score * WEIGHTS[dim];
  }

  const overallScore = parseFloat(weighted.toFixed(2));
  const recommendations: string[] = [];

  for (const qs of qualityScores) {
    if (qs.score < 7) {
      recommendations.push(`Improve ${qs.dimension}: ${qs.rationale} (score ${qs.score}/10)`);
    }
  }
  if (!bp.streamingStrategy.enableSSE) {
    recommendations.push('SSE must always be enabled — never disable streaming');
  }
  const weightSum = Object.values(bp.evaluationStrategy.weights).reduce((a, b) => a + b, 0);
  if (Math.abs(weightSum - 1.0) > 0.02) {
    recommendations.push(`Evaluation weights sum to ${weightSum.toFixed(2)} — must sum to 1.00`);
  }

  return { qualityScores, overallScore, recommendations };
}
