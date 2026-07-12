// ── V9.0 Runtime Intelligence — Pipeline Step ────────────────────────────────
//
// Runs after all architects, BEFORE the Planner.
// Extracts key signals from architect outputs and runs the runtime engine.
// Runtime failures MUST NEVER stop builds — any error falls back to a safe
// no-op (empty contextString, overallScore 0).
import type { Response } from 'express';
import type { ProductManagerOutput }   from '../../product-manager/productTypes.js';
import type { FrontendArchitectOutput } from '../../frontend-architect/frontendArchitect.js';
import type { BackendArchitectOutput }  from '../../backend-architect/backendTypes.js';
import type { DevOpsArchitectOutput }   from '../../devops-architect/devopsTypes.js';
import type { QAArchitectOutput }       from '../../qa-architect/qaTypes.js';
import type { RuntimeIntelligenceOutput } from '../../runtime-intelligence/runtimeTypes.js';
import { runRuntimeIntelligence }         from '../../runtime-intelligence/runtimeArchitect.js';
import { persistRuntimeSnapshot }         from '../../runtime-intelligence/runtimePersistence.js';
import { learnFromRuntimeBuild }          from '../../runtime-intelligence/runtimeLearning.js';
import { withAgentMetrics }               from '../../telemetry/agentMetrics.js';

/** Safe fallback — never throws */
function makeNoopOutput(): RuntimeIntelligenceOutput {
  return {
    blueprint:        {} as RuntimeIntelligenceOutput['blueprint'],
    overallScore:     0,
    processingTimeMs: 0,
    contextString:    '',
  };
}

export async function runRuntimeIntelligenceStep(
  prompt:                string,
  buildId:               string,
  res:                   Response,
  productManagerOutput:  ProductManagerOutput,
  frontendArchitectOutput: FrontendArchitectOutput,
  backendArchitectOutput:  BackendArchitectOutput,
  devopsArchitectOutput:   DevOpsArchitectOutput,
  qaArchitectOutput:       QAArchitectOutput,
): Promise<RuntimeIntelligenceOutput> {
  const sendEvent = (event: object) => {
    try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
  };

  return withAgentMetrics('RuntimeIntelligence', async () => {
    try {
      sendEvent({ type: 'runtime_start', buildId });

      // ── Extract signals from architect outputs ──────────────────────────────
      const plan       = productManagerOutput.productPlan;
      const bb         = backendArchitectOutput.blueprint;
      const devops     = devopsArchitectOutput.blueprint;
      const qa         = qaArchitectOutput.blueprint;

      const features: string[] = (plan.plannedFeatures ?? []).map(String);
      const hasAuth      = features.some(f => /\b(auth|login|sign.?in|account)\b/i.test(f));
      const hasPayments  = features.some(f => /\b(billing|payment|stripe|checkout)\b/i.test(f));
      const hasRealtime  = features.some(f => /\b(real.?time|websocket|chat|notification)\b/i.test(f));

      // Compliance: Healthcare + Finance + Compliance-flagged types
      const hasCompliance = ['Healthcare', 'Finance', 'ERPBackend'].includes(bb.backendType)
        || bb.securityIntelligence.compliance.standards.length > 0;

      // Quality scores (0–10 from each architect's output)
      const frontendScore  = frontendArchitectOutput.overallScore  ?? 0;
      const backendScore   = backendArchitectOutput.overallScore   ?? 0;
      const devopsScore    = devopsArchitectOutput.overallScore    ?? 0;
      const qaScore        = qaArchitectOutput.overallScore        ?? 0;
      const securityScore  = bb.securityIntelligence.overallScore  ?? 0;

      const input = {
        prompt,
        buildId,
        productGoal:       String(plan.productGoal ?? 'SaaS'),
        productFeatures:   features,
        businessObjective: String(plan.businessObjective ?? ''),
        backendType:       bb.backendType,
        infraType:         (devops as unknown as { infraType?: string }).infraType ?? 'Standard',
        serviceCount:      bb.serviceArchitecture?.serviceCount ?? 1,
        hasAuth,
        hasPayments,
        hasRealtime,
        hasCompliance,
        productScore:      productManagerOutput.productScore ?? 0,
        frontendScore,
        backendScore,
        devopsScore,
        qaScore,
        securityScore,
      };

      sendEvent({
        type:           'runtime_progress',
        buildId,
        stage:          'classifying_mode',
        backendType:    input.backendType,
        complexity:     input.serviceCount,
        hasCompliance:  input.hasCompliance,
      });

      const output = runRuntimeIntelligence(input);
      const { blueprint } = output;

      sendEvent({
        type:             'runtime_complete',
        buildId,
        mode:             blueprint.mode,
        overallScore:     output.overallScore,
        candidateCount:   blueprint.candidateStrategy.count,
        repairPolicy:     blueprint.repairStrategy.policy,
        evaluationPriority: blueprint.evaluationStrategy.priorityDimension,
        estimatedBuildTimeMs: blueprint.performancePrediction.estimatedBuildTimeMs,
        estimatedTokens:  blueprint.performancePrediction.estimatedTokenUsage,
        completionProbability: blueprint.performancePrediction.estimatedCompletionProbability,
        processingTimeMs: output.processingTimeMs,
      });

      // Persist snapshot (non-blocking, best-effort)
      try {
        persistRuntimeSnapshot(buildId, blueprint.mode, blueprint);
      } catch { /* persistence must never stop builds */ }

      // Fire-and-forget learning (wired in post-build via agents.ts or directly)
      // Note: actual build outcome data is not available here yet — learning
      // happens after build completion with real metrics.
      sendEvent({ type: 'runtime_learning', buildId, mode: blueprint.mode });

      return output;
    } catch (err) {
      // Runtime Intelligence failures must NEVER stop builds
      const fallback = makeNoopOutput();
      sendEvent({
        type:    'runtime_complete',
        buildId,
        mode:    'Balanced',
        overallScore: 0,
        error:   (err as Error)?.message ?? 'runtime_intelligence_error',
      });
      return fallback;
    }
  });
}
