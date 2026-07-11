// ── V8.7 DevOps & Infrastructure Architect — Pipeline Step ───────────────────
import type { Response }               from 'express';
import type { ProductManagerOutput }   from '../../product-manager/productTypes.js';
import type { BackendArchitectOutput } from '../../backend-architect/backendTypes.js';
import type { DevOpsArchitectOutput }  from '../../devops-architect/devopsTypes.js';
import { runDevOpsArchitect }          from '../../devops-architect/devopsArchitect.js';
import { learnFromDevOpsBuild }        from '../../devops-architect/devopsLearning.js';
import { withAgentMetrics }            from '../../telemetry/agentMetrics.js';

export async function runDevOpsArchitectStep(
  prompt:               string,
  buildId:              string,
  res:                  Response,
  productManagerOutput: ProductManagerOutput,
  backendArchitectOutput: BackendArchitectOutput,
): Promise<DevOpsArchitectOutput> {
  return withAgentMetrics('DevOpsArchitect', async () => {
    const sendEvent = (event: object) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    sendEvent({ type: 'devops_architect_start', buildId });

    const output = runDevOpsArchitect(prompt, productManagerOutput, backendArchitectOutput);
    const { blueprint } = output;

    sendEvent({
      type:              'devops_architect_progress',
      buildId,
      infrastructureType:blueprint.infrastructureType,
      confidence:        blueprint.infrastructureConfidence,
      cloudProvider:     blueprint.cloud.provider,
      cicdProvider:      blueprint.cicd.provider,
      deployStrategy:    blueprint.deployment.strategy,
      score:             output.overallScore,
    });

    sendEvent({
      type:               'devops_architect_complete',
      buildId,
      infrastructureType: blueprint.infrastructureType,
      cloudProvider:      blueprint.cloud.provider,
      overallScore:       output.overallScore,
      infrastructureScore:blueprint.qualityScores.find(q => q.dimension === 'infrastructure')?.score ?? 0,
      securityScore:      blueprint.qualityScores.find(q => q.dimension === 'security')?.score ?? 0,
      monitoringScore:    blueprint.qualityScores.find(q => q.dimension === 'monitoring')?.score ?? 0,
      processingTimeMs:   output.processingTimeMs,
    });

    // Phase 19 — Fire-and-forget learning
    learnFromDevOpsBuild({ buildId, blueprint }).then(() => {
      sendEvent({ type: 'devops_architect_learning', buildId });
    }).catch(() => {});

    return output;
  });
}
