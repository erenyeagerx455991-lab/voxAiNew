// ── V8.8 QA & Reliability Architect — Pipeline Step ──────────────────────────
import type { Response }               from 'express';
import type { ProductManagerOutput }   from '../../product-manager/productTypes.js';
import type { BackendArchitectOutput } from '../../backend-architect/backendTypes.js';
import type { DevOpsArchitectOutput }  from '../../devops-architect/devopsTypes.js';
import type { QAArchitectOutput }      from '../../qa-architect/qaTypes.js';
import { runQAArchitect }              from '../../qa-architect/qaArchitect.js';
import { learnFromQABuild }            from '../../qa-architect/qaLearning.js';
import { withAgentMetrics }            from '../../telemetry/agentMetrics.js';

export async function runQAArchitectStep(
  prompt:                string,
  buildId:               string,
  res:                   Response,
  productManagerOutput:  ProductManagerOutput,
  backendArchitectOutput:BackendArchitectOutput,
  devopsArchitectOutput: DevOpsArchitectOutput,
): Promise<QAArchitectOutput> {
  return withAgentMetrics('QAArchitect', async () => {
    const sendEvent = (event: object) => res.write(`data: ${JSON.stringify(event)}\n\n`);

    sendEvent({ type: 'qa_architect_start', buildId });

    const output = runQAArchitect(prompt, productManagerOutput, backendArchitectOutput, devopsArchitectOutput);
    const { blueprint } = output;

    sendEvent({
      type:             'qa_architect_progress',
      buildId,
      qaStrategy:       blueprint.strategy.strategy,
      confidence:       blueprint.strategy.confidence,
      riskScore:        blueprint.risk.overallRiskScore,
      coverageTarget:   blueprint.coverage.overallQualityScore,
      reliability:      blueprint.reliability.predictedAvailabilityPercent,
      score:            output.overallScore,
    });

    sendEvent({
      type:              'qa_architect_complete',
      buildId,
      qaStrategy:        blueprint.strategy.strategy,
      overallScore:      output.overallScore,
      testingScore:      blueprint.qualityScores.find(q => q.dimension === 'testing')?.score     ?? 0,
      coverageScore:     blueprint.qualityScores.find(q => q.dimension === 'coverage')?.score    ?? 0,
      reliabilityScore:  blueprint.qualityScores.find(q => q.dimension === 'reliability')?.score ?? 0,
      securityScore:     blueprint.qualityScores.find(q => q.dimension === 'security')?.score    ?? 0,
      processingTimeMs:  output.processingTimeMs,
    });

    // Phase 20 — Fire-and-forget learning
    learnFromQABuild({ buildId, blueprint }).then(() => {
      sendEvent({ type: 'qa_architect_learning', buildId });
    }).catch(() => {});

    return output;
  });
}
