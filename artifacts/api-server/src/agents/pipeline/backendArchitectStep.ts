// ── V8.6 Backend Architect — Pipeline Step ────────────────────────────────────
import type { Response } from 'express';
import type { FrontendArchitectOutput } from '../../frontend-architect/frontendArchitect.js';
import type { ProductManagerOutput }    from '../../product-manager/productTypes.js';
import type { BackendArchitectOutput }  from '../../backend-architect/backendTypes.js';
import { runBackendArchitect }          from '../../backend-architect/backendArchitect.js';
import { learnFromBackendBuild }        from '../../backend-architect/backendLearning.js';
import { withAgentMetrics }             from '../../telemetry/agentMetrics.js';

export async function runBackendArchitectStep(
  prompt:                string,
  buildId:               string,
  res:                   Response,
  productManagerOutput:  ProductManagerOutput,
  _frontendArchitectOutput?: FrontendArchitectOutput,
): Promise<BackendArchitectOutput> {
  return withAgentMetrics('BackendArchitect', async () => {
    const sendEvent = (event: object) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    sendEvent({ type: 'backend_architect_start', buildId });

    const { productPlan } = productManagerOutput;
    const output = runBackendArchitect(prompt, productPlan);
    const { blueprint } = output;

    sendEvent({
      type:        'backend_architect_progress',
      buildId,
      backendType: blueprint.backendType,
      confidence:  blueprint.backendTypeConfidence,
      database:    blueprint.databaseArchitecture.primary,
      apiStyle:    blueprint.apiArchitecture.primaryStyle,
      authStrategy:blueprint.authArchitecture.primaryStrategy,
      serviceCount:blueprint.serviceArchitecture.serviceCount,
      score:       output.overallScore,
    });

    sendEvent({
      type:            'backend_architect_complete',
      buildId,
      backendType:     blueprint.backendType,
      overallScore:    output.overallScore,
      securityScore:   blueprint.qualityScores.find(q => q.dimension === 'security')?.score ?? 0,
      databaseScore:   blueprint.qualityScores.find(q => q.dimension === 'database')?.score ?? 0,
      apiScore:        blueprint.qualityScores.find(q => q.dimension === 'api')?.score ?? 0,
      deployment:      blueprint.deploymentArchitecture.strategy,
      processingTimeMs:output.processingTimeMs,
    });

    // Phase 20 — Fire-and-forget learning
    learnFromBackendBuild({ buildId, blueprint }).then(() => {
      sendEvent({ type: 'backend_architect_learning', buildId });
    }).catch(() => {});

    return output;
  });
}
