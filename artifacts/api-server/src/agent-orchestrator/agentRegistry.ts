// ── V9.2 Orchestrator — Static Agent Registry ────────────────────────────────
//
// Every agent declares requires/produces/consumes/dependsOn plus its retry,
// timeout, and model policy. This is a scheduling-level description of agents
// that already exist elsewhere — it does not duplicate their logic.
import type { AgentDeclaration, AgentName, RetryPolicy, TimeoutPolicy, ModelTier } from './types.js';

function retry(
  retryCount: number,
  backoffStrategy: RetryPolicy['backoffStrategy'],
  failureSeverity: RetryPolicy['failureSeverity'],
  critical: boolean,
  recoveryMode: RetryPolicy['recoveryMode'] = 'retry',
): RetryPolicy {
  return { retryCount, retryDelayMs: retryCount > 0 ? 500 : 0, backoffStrategy, failureSeverity, critical, recoveryMode };
}

function timeout(timeoutMs: number, onTimeout: TimeoutPolicy['onTimeout'] = 'fallback'): TimeoutPolicy {
  return { timeoutMs, onTimeout };
}

export const AGENT_REGISTRY: Record<AgentName, AgentDeclaration> = {
  ProductManager: {
    name: 'ProductManager', requires: [], dependsOn: [],
    produces: ['productPlan', 'productScore', 'productContext'],
    consumes: ['prompt'],
    skippable: false,
    retryPolicy: retry(0, 'none', 'high', true, 'abort'),
    timeoutPolicy: timeout(5_000),
    modelTier: 'fast', baseCostTokens: 400, baseDurationMs: 50,
  },
  FrontendArchitect: {
    name: 'FrontendArchitect', requires: ['ProductManager'], dependsOn: ['ProductManager'],
    produces: ['frontendBlueprint', 'frontendContext'],
    consumes: ['prompt', 'productPlan'],
    skippable: false,
    retryPolicy: retry(0, 'none', 'medium', false, 'fallback'),
    timeoutPolicy: timeout(5_000),
    modelTier: 'fast', baseCostTokens: 500, baseDurationMs: 60,
  },
  BackendArchitect: {
    name: 'BackendArchitect', requires: ['ProductManager', 'FrontendArchitect'], dependsOn: ['ProductManager', 'FrontendArchitect'],
    produces: ['backendBlueprint', 'securityIntelligence'],
    consumes: ['prompt', 'productPlan', 'frontendBlueprint'],
    skippable: true,
    retryPolicy: retry(0, 'none', 'medium', false, 'fallback'),
    timeoutPolicy: timeout(5_000),
    modelTier: 'fast', baseCostTokens: 600, baseDurationMs: 70,
  },
  DevOpsArchitect: {
    name: 'DevOpsArchitect', requires: ['ProductManager', 'BackendArchitect'], dependsOn: ['ProductManager', 'BackendArchitect'],
    produces: ['devopsBlueprint'],
    consumes: ['productPlan', 'backendBlueprint'],
    skippable: true,
    retryPolicy: retry(0, 'none', 'low', false, 'skip'),
    timeoutPolicy: timeout(5_000),
    modelTier: 'fast', baseCostTokens: 450, baseDurationMs: 50,
  },
  QAArchitect: {
    name: 'QAArchitect', requires: ['ProductManager', 'BackendArchitect', 'DevOpsArchitect'], dependsOn: ['ProductManager', 'BackendArchitect', 'DevOpsArchitect'],
    produces: ['qaBlueprint'],
    consumes: ['productPlan', 'backendBlueprint', 'devopsBlueprint'],
    skippable: true,
    retryPolicy: retry(0, 'none', 'low', false, 'skip'),
    timeoutPolicy: timeout(5_000),
    modelTier: 'balanced', baseCostTokens: 500, baseDurationMs: 50,
  },
  SecurityIntelligence: {
    name: 'SecurityIntelligence', requires: ['BackendArchitect'], dependsOn: ['BackendArchitect'],
    produces: ['securityBlueprint'],
    consumes: ['backendBlueprint'],
    skippable: true,
    retryPolicy: retry(0, 'none', 'high', false, 'fallback'),
    timeoutPolicy: timeout(5_000),
    modelTier: 'highest-reasoning', baseCostTokens: 400, baseDurationMs: 40,
  },
  RuntimeIntelligence: {
    name: 'RuntimeIntelligence', requires: ['ProductManager', 'FrontendArchitect', 'BackendArchitect', 'DevOpsArchitect', 'QAArchitect'],
    dependsOn: ['ProductManager', 'FrontendArchitect', 'BackendArchitect', 'DevOpsArchitect', 'QAArchitect'],
    produces: ['runtimeBlueprint'],
    consumes: ['productPlan', 'frontendBlueprint', 'backendBlueprint', 'devopsBlueprint', 'qaBlueprint'],
    skippable: false,
    retryPolicy: retry(0, 'none', 'medium', false, 'fallback'),
    timeoutPolicy: timeout(5_000),
    modelTier: 'fast', baseCostTokens: 300, baseDurationMs: 30,
  },
  Planner: {
    name: 'Planner', requires: ['RuntimeIntelligence'], dependsOn: ['RuntimeIntelligence'],
    produces: ['plan', 'blueprint', 'dnaComposition'],
    consumes: ['prompt', 'runtimeBlueprint'],
    skippable: false,
    retryPolicy: retry(1, 'linear', 'critical', true, 'retry'),
    timeoutPolicy: timeout(30_000, 'abort'),
    modelTier: 'high-quality', baseCostTokens: 3_000, baseDurationMs: 8_000,
  },
  Architecture: {
    name: 'Architecture', requires: ['Planner'], dependsOn: ['Planner'],
    produces: ['projectBlueprint'],
    consumes: ['plan'],
    skippable: false,
    retryPolicy: retry(1, 'linear', 'critical', true, 'retry'),
    timeoutPolicy: timeout(20_000, 'abort'),
    modelTier: 'high-quality', baseCostTokens: 1_500, baseDurationMs: 4_000,
  },
  ComponentTree: {
    name: 'ComponentTree', requires: ['Architecture'], dependsOn: ['Architecture'],
    produces: ['componentTree'],
    consumes: ['plan', 'projectBlueprint'],
    skippable: false,
    retryPolicy: retry(0, 'none', 'low', false, 'fallback'),
    timeoutPolicy: timeout(2_000),
    modelTier: 'fast', baseCostTokens: 0, baseDurationMs: 20,
  },
  Frontend: {
    name: 'Frontend', requires: ['ComponentTree'], dependsOn: ['ComponentTree'],
    produces: ['frontendCode', 'design', 'tokenSet'],
    consumes: ['architecture', 'componentTree'],
    skippable: false,
    retryPolicy: retry(1, 'exponential', 'critical', true, 'retry'),
    timeoutPolicy: timeout(60_000, 'abort'),
    modelTier: 'high-quality', baseCostTokens: 6_000, baseDurationMs: 20_000,
  },
  CandidateSelection: {
    name: 'CandidateSelection', requires: ['Frontend'], dependsOn: ['Frontend'],
    produces: ['winner'],
    consumes: ['frontendCode', 'runtimeBlueprint'],
    skippable: false,
    retryPolicy: retry(0, 'none', 'medium', false, 'fallback'),
    timeoutPolicy: timeout(30_000),
    modelTier: 'balanced', baseCostTokens: 2_000, baseDurationMs: 5_000,
  },
  Repair: {
    name: 'Repair', requires: ['CandidateSelection'], dependsOn: ['CandidateSelection'],
    produces: ['repairedCode'],
    consumes: ['winner', 'runtimeBlueprint'],
    skippable: true,
    retryPolicy: retry(2, 'exponential', 'medium', false, 'retry'),
    timeoutPolicy: timeout(30_000),
    modelTier: 'cheap-reasoning', baseCostTokens: 1_500, baseDurationMs: 6_000,
  },
  UXIntelligence: {
    name: 'UXIntelligence', requires: ['Repair'], dependsOn: ['Repair'],
    produces: ['uxReport'],
    consumes: ['repairedCode'],
    skippable: true,
    retryPolicy: retry(0, 'none', 'low', false, 'skip'),
    timeoutPolicy: timeout(3_000),
    modelTier: 'fast', baseCostTokens: 200, baseDurationMs: 30,
  },
  DesignEvaluator: {
    name: 'DesignEvaluator', requires: ['UXIntelligence'], dependsOn: ['UXIntelligence'],
    produces: ['evaluationResult'],
    consumes: ['repairedCode', 'uxReport', 'runtimeBlueprint'],
    skippable: false,
    retryPolicy: retry(0, 'none', 'medium', false, 'fallback'),
    timeoutPolicy: timeout(5_000),
    modelTier: 'balanced', baseCostTokens: 0, baseDurationMs: 100,
  },
  DesignCritic: {
    name: 'DesignCritic', requires: ['DesignEvaluator'], dependsOn: ['DesignEvaluator'],
    produces: ['criticResult'],
    consumes: ['evaluationResult'],
    skippable: true,
    retryPolicy: retry(0, 'none', 'low', false, 'skip'),
    timeoutPolicy: timeout(15_000),
    modelTier: 'balanced', baseCostTokens: 1_000, baseDurationMs: 3_000,
  },
  ConversionIntelligence: {
    name: 'ConversionIntelligence', requires: ['DesignCritic'], dependsOn: ['DesignCritic'],
    produces: ['conversionResult'],
    consumes: ['criticResult'],
    skippable: true,
    retryPolicy: retry(0, 'none', 'low', false, 'skip'),
    timeoutPolicy: timeout(3_000),
    modelTier: 'fast', baseCostTokens: 200, baseDurationMs: 40,
  },
  Accessibility: {
    name: 'Accessibility', requires: ['ConversionIntelligence'], dependsOn: ['ConversionIntelligence'],
    produces: ['accessibilityResult'],
    consumes: ['conversionResult'],
    skippable: true,
    retryPolicy: retry(0, 'none', 'low', false, 'skip'),
    timeoutPolicy: timeout(3_000),
    modelTier: 'fast', baseCostTokens: 100, baseDurationMs: 30,
  },
  Optimization: {
    name: 'Optimization', requires: ['Accessibility'], dependsOn: ['Accessibility'],
    produces: ['optimizationResult'],
    consumes: ['accessibilityResult'],
    skippable: true,
    retryPolicy: retry(0, 'none', 'low', false, 'skip'),
    timeoutPolicy: timeout(3_000),
    modelTier: 'fast', baseCostTokens: 100, baseDurationMs: 30,
  },
  DesignDirector: {
    name: 'DesignDirector', requires: ['Optimization'], dependsOn: ['Optimization'],
    produces: ['directorScore'],
    consumes: ['optimizationResult'],
    skippable: true,
    retryPolicy: retry(0, 'none', 'low', false, 'skip'),
    timeoutPolicy: timeout(3_000),
    modelTier: 'balanced', baseCostTokens: 150, baseDurationMs: 40,
  },
  Scaffold: {
    name: 'Scaffold', requires: ['DesignDirector'], dependsOn: ['DesignDirector'],
    produces: ['allFiles', 'knowledgeGraph'],
    consumes: ['directorScore', 'projectBlueprint'],
    skippable: false,
    retryPolicy: retry(1, 'linear', 'critical', true, 'retry'),
    timeoutPolicy: timeout(15_000, 'abort'),
    modelTier: 'balanced', baseCostTokens: 1_000, baseDurationMs: 2_000,
  },
  RuntimeValidation: {
    name: 'RuntimeValidation', requires: ['Scaffold'], dependsOn: ['Scaffold'],
    produces: ['runtimeHealth'],
    consumes: ['allFiles', 'knowledgeGraph'],
    skippable: false,
    retryPolicy: retry(3, 'exponential', 'critical', true, 'retry'),
    timeoutPolicy: timeout(120_000, 'abort'),
    modelTier: 'cheap-reasoning', baseCostTokens: 2_000, baseDurationMs: 30_000,
  },
  // V9.5: Autonomous Reasoning & Decision Intelligence Engine — step 0.99
  // Static/deterministic (no LLM calls). Runs before the Planner and provides
  // a ReasoningBlueprint to every downstream agent. Never skippable — the
  // blueprint is consumed by the Planner context string.
  ReasoningEngine: {
    name: 'ReasoningEngine',
    requires: ['RuntimeIntelligence'],
    dependsOn: ['RuntimeIntelligence'],
    produces: ['reasoningBlueprint', 'reasoningContext'],
    consumes: [
      'runtimeBlueprint', 'productPlan', 'frontendBlueprint',
      'backendBlueprint', 'devopsBlueprint', 'qaBlueprint',
    ],
    skippable: false,
    retryPolicy: retry(0, 'none', 'low', false, 'fallback'),
    timeoutPolicy: timeout(3_000),
    modelTier: 'fast', baseCostTokens: 0, baseDurationMs: 20,
  },
};

export const ALL_AGENT_NAMES: AgentName[] = Object.keys(AGENT_REGISTRY) as AgentName[];

/** Agents that are safe to skip without breaking pipeline data flow — skipping
 *  them means "pass the previous step's output straight through unchanged". */
export const PASS_THROUGH_SKIPPABLE: AgentName[] = [
  'UXIntelligence', 'DesignCritic', 'ConversionIntelligence',
  'Accessibility', 'Optimization', 'DesignDirector',
];

export function getModelTier(agent: AgentName): ModelTier {
  return AGENT_REGISTRY[agent].modelTier;
}
