// ── V8.6 Backend Architect — Pipeline Step ────────────────────────────────────
import type { Response } from 'express';
import type { FrontendArchitectOutput } from '../../frontend-architect/frontendArchitect.js';
import type { ProductManagerOutput }    from '../../product-manager/productTypes.js';
import type { BackendArchitectOutput }  from '../../backend-architect/backendTypes.js';
import { runBackendArchitect }          from '../../backend-architect/backendArchitect.js';
import { learnFromBackendBuild }        from '../../backend-architect/backendLearning.js';
import { withAgentMetrics }             from '../../telemetry/agentMetrics.js';
// V8.9: Security Architecture Integration — activate persistence + learning
import { persistSecuritySnapshot }      from '../../security-architect/securityPersistence.js';
import { learnFromSecurityBuild }       from '../../security-architect/securityLearning.js';

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

    // V8.9: Security Architect SSE — surfaces the security intelligence scores
    // that runBackendArchitect already computed (no duplicate invocation).
    const si = blueprint.securityIntelligence;
    sendEvent({
      type:             'security_architect_complete',
      buildId,
      backendType:      blueprint.backendType,
      overallScore:     si.overallScore,
      privacyScore:     si.qualityScores.find(q => q.dimension === 'privacy')?.score     ?? 0,
      complianceScore:  si.qualityScores.find(q => q.dimension === 'compliance')?.score  ?? 0,
      threatScore:      si.qualityScores.find(q => q.dimension === 'threatModel')?.score ?? 0,
      encryptionScore:  si.qualityScores.find(q => q.dimension === 'encryption')?.score  ?? 0,
      secretsScore:     si.qualityScores.find(q => q.dimension === 'secrets')?.score     ?? 0,
      owaspScore:       si.qualityScores.find(q => q.dimension === 'owasp')?.score       ?? 0,
      topRecommendations: si.recommendations.slice(0, 3),
    });

    // V8.9: Persist security snapshot (non-blocking, best-effort)
    try {
      persistSecuritySnapshot(buildId, blueprint.backendType, si);
    } catch { /* persistence must never stop builds */ }

    // Phase 20 — Fire-and-forget learning (backend + V8.9 security)
    learnFromBackendBuild({ buildId, blueprint }).then(() => {
      sendEvent({ type: 'backend_architect_learning', buildId });
    }).catch(() => {});

    // V8.9: Fire-and-forget security learning (reuses existing engine, never throws)
    learnFromSecurityBuild({ buildId, backendType: blueprint.backendType, blueprint: si })
      .catch(() => {});

    return output;
  });
}
