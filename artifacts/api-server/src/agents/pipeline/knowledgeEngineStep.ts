// ── V9.4 Autonomous Knowledge Intelligence Engine — Pipeline Step ─────────────
//
// Runs as step 0.97 — immediately after ModelOrchestrator (V9.3, step 0.95)
// and before Planner. Ingests signal from every upstream static-architecture
// engine into the knowledge graph/collector, builds per-agent knowledge
// bundles (Frontend/Backend/Security/QA/DevOps/Generic), compresses them,
// and persists a versioned snapshot.
//
// Static/deterministic — no vector DB, no embeddings API, no new outbound
// LLM calls. Failures MUST NEVER stop a build.
import type { Response } from 'express';
import type { ExecutionBlueprint } from '../../agent-orchestrator/types.js';
import type { ModelExecutionBlueprint } from '../../model-orchestrator/types.js';
import type { CompressedKnowledgeBundle, KnowledgeBundleTarget, CompressionPolicy } from '../../knowledge-engine/types.js';
import { ingestKnowledge } from '../../knowledge-engine/knowledgeCollector.js';
import { registerPattern } from '../../knowledge-engine/patternIntelligence.js';
import { buildKnowledgeBundle } from '../../knowledge-engine/knowledgeBundleBuilder.js';
import { compressKnowledgeBundle } from '../../knowledge-engine/knowledgeCompression.js';
import { persistKnowledgeSnapshot } from '../../knowledge-engine/knowledgePersistence.js';
import { learnFromKnowledgeEvent } from '../../knowledge-engine/knowledgeLearning.js';
import { recordKnowledgeEngineExecution } from '../../knowledge-engine/knowledgeMetrics.js';
import { withAgentMetrics } from '../../telemetry/agentMetrics.js';

export interface KnowledgeStepUpstream {
  productManagerOutput:      { productScore?: number };
  frontendArchitectOutput:   { overallScore?: number };
  backendArchitectOutput:    { overallScore?: number };
  devopsArchitectOutput:     { overallScore?: number };
  qaArchitectOutput:         { overallScore?: number };
  runtimeIntelligenceOutput: { overallScore?: number };
}

export interface KnowledgeStepOutput {
  buildId:      string;
  bundles:      Partial<Record<KnowledgeBundleTarget, CompressedKnowledgeBundle>>;
  contextString: string;
}

const BUNDLE_TARGETS: KnowledgeBundleTarget[] = ['Frontend', 'Backend', 'Security', 'QA', 'DevOps', 'Generic'];

function compressionPolicyForComplexity(complexity: string): CompressionPolicy {
  if (complexity === 'enterprise') return 'none';
  if (complexity === 'standard') return 'light';
  return 'aggressive';
}

export async function runKnowledgeEngineStep(
  buildId: string,
  res: Response,
  executionBlueprint: ExecutionBlueprint,
  modelBlueprint: ModelExecutionBlueprint,
  upstream: KnowledgeStepUpstream,
): Promise<KnowledgeStepOutput> {
  return withAgentMetrics('KnowledgeEngine' as any, async () => {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    sendEvent({ type: 'knowledge_start', buildId });

    try {
      ingestKnowledge({
        domain: 'Product', title: 'Product strategy outcome', summary: 'Product Manager static plan output',
        sourceAgent: 'ProductManager', buildId, quality: upstream.productManagerOutput.productScore ?? 5,
      });
      ingestKnowledge({
        domain: 'Frontend', title: 'Frontend architecture outcome', summary: 'Frontend Architect static blueprint output',
        sourceAgent: 'FrontendArchitect', buildId, quality: upstream.frontendArchitectOutput.overallScore ?? 5,
      });
      ingestKnowledge({
        domain: 'Backend', title: 'Backend architecture outcome', summary: 'Backend Architect static blueprint output',
        sourceAgent: 'BackendArchitect', buildId, quality: upstream.backendArchitectOutput.overallScore ?? 5,
      });
      ingestKnowledge({
        domain: 'DevOps', title: 'DevOps architecture outcome', summary: 'DevOps Architect static blueprint output',
        sourceAgent: 'DevOpsArchitect', buildId, quality: upstream.devopsArchitectOutput.overallScore ?? 5,
      });
      ingestKnowledge({
        domain: 'QA', title: 'QA architecture outcome', summary: 'QA Architect static blueprint output',
        sourceAgent: 'QAArchitect', buildId, quality: upstream.qaArchitectOutput.overallScore ?? 5,
      });
      ingestKnowledge({
        domain: 'Runtime', title: 'Runtime intelligence outcome', summary: 'Runtime Intelligence generation strategy output',
        sourceAgent: 'RuntimeIntelligence', buildId, quality: upstream.runtimeIntelligenceOutput.overallScore ?? 5,
      });
      ingestKnowledge({
        domain: 'Architecture', title: `Execution complexity: ${executionBlueprint.complexity}`,
        summary: `Orchestrator classified this build as ${executionBlueprint.complexity} complexity`,
        sourceAgent: 'Orchestrator', buildId, tags: [executionBlueprint.complexity],
        confidence: 0.6,
      });
      ingestKnowledge({
        domain: 'Performance', title: 'Model routing efficiency', summary: 'Model Orchestrator routing/cost/latency prediction',
        sourceAgent: 'ModelOrchestrator', buildId,
        runtimePerformance: Math.min(10, modelBlueprint.tokenEfficiency * 10),
        businessSuccess: Math.min(10, (1 - modelBlueprint.fallbackPrediction) * 10),
      });

      registerPattern({
        id:      `complexity-${executionBlueprint.complexity}`,
        domain:  'Architecture',
        name:    `${executionBlueprint.complexity} build routing`,
        qualityScore: upstream.frontendArchitectOutput.overallScore ?? 5,
        performanceScore: Math.min(10, modelBlueprint.tokenEfficiency * 10),
        productionSuccess: true,
      });
    } catch { /* ingestion must never stop a build */ }

    const bundles: Partial<Record<KnowledgeBundleTarget, CompressedKnowledgeBundle>> = {};
    const policy = compressionPolicyForComplexity(executionBlueprint.complexity);

    try {
      for (const target of BUNDLE_TARGETS) {
        const bundle = buildKnowledgeBundle(target, buildId);
        bundles[target] = compressKnowledgeBundle(bundle, policy);
      }
    } catch { /* bundle building must never stop a build */ }

    sendEvent({
      type:    'knowledge_progress',
      buildId,
      domainsCovered: Object.values(bundles).reduce((sum, b) => sum + (b?.recordCount ?? 0), 0),
      policy,
    });

    try {
      persistKnowledgeSnapshot(buildId);
    } catch { /* persistence must never stop a build */ }

    const topFrontendRec = bundles.Frontend?.recommendations[0]?.title;
    const topBackendRec = bundles.Backend?.recommendations[0]?.title;
    const contextString = [
      topFrontendRec ? `\nKnowledge Engine — frontend suggestion: ${topFrontendRec}.` : '',
      topBackendRec ? `\nKnowledge Engine — backend suggestion: ${topBackendRec}.` : '',
    ].join('');

    sendEvent({
      type:    'knowledge_complete',
      buildId,
      bundleTargets: BUNDLE_TARGETS,
    });

    return { buildId, bundles, contextString };
  });
}

/** Called after the build finishes — records learning + telemetry. Never throws. */
export function finalizeKnowledgeEngineExecution(
  res: Response,
  buildId: string,
  overallScore: number,
  cacheHit = false,
): void {
  try {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    void learnFromKnowledgeEvent({
      buildId,
      domain: 'Product',
      routingOutcome: 'build-complete',
      score: overallScore,
      productionSuccess: overallScore >= 6,
      recordedAt: Date.now(),
    });

    recordKnowledgeEngineExecution(buildId, BUNDLE_TARGETS_LENGTH, BUNDLE_TARGETS_LENGTH, cacheHit);

    sendEvent({
      type:    'knowledge_learning',
      buildId,
      overallScore,
    });
  } catch { /* learning/telemetry must never stop a build */ }
}

const BUNDLE_TARGETS_LENGTH = BUNDLE_TARGETS.length;
