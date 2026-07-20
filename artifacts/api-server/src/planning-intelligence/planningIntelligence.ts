// ── V9.7 Autonomous Planning Intelligence Engine — Core Orchestrator ───────────
// Phase 14: Executes all 13 planners, merges outputs, builds PlanningBlueprint.
// Pure deterministic — zero LLM calls. Never mutates existing modules.
import type { PlanningIntelligenceContext, PlanningBlueprint } from './planningTypes.js';
import { analyzeGoals } from './goalPlanner.js';
import { extractRequirements } from './requirementPlanner.js';
import { buildDependencyGraph } from './dependencyPlanner.js';
import { planMilestones } from './milestonePlanner.js';
import { planRoadmap } from './roadmapPlanner.js';
import { planFeatures } from './featurePlanner.js';
import { planTasks } from './taskPlanner.js';
import { analyzeRisks } from './riskPlanner.js';
import { estimatePlan } from './estimationPlanner.js';
import { planIncrements } from './incrementPlanner.js';
import { computeFeaturePriorities } from './priorityPlanner.js';
import { planImplementation } from './implementationPlanner.js';
import { validatePlan } from './validationPlanner.js';

export function buildPlanningBlueprint(ctx: PlanningIntelligenceContext): PlanningBlueprint {
  // Phase 1 — Goal Analysis
  const goals = analyzeGoals(ctx.prompt, ctx.complexity);

  // Phase 2 — Requirement Extraction
  const requirements = extractRequirements(ctx.prompt, ctx.complexity);

  // Phase 3 — Feature Dependency Graph
  const dependencies = buildDependencyGraph(requirements);

  // Phase 4 — Milestone Planning
  const milestones = planMilestones(requirements, dependencies, ctx.complexity);

  // Phase 5 — Roadmap Planning
  const roadmap = planRoadmap(milestones, ctx.complexity);

  // Phase 6 — Feature Planning
  const features = planFeatures(requirements, ctx.complexity);

  // Phase 7 — Task Planning
  const tasks = planTasks(features);

  // Phase 8 — Risk Planning
  const risks = analyzeRisks(requirements, ctx.complexity);

  // Phase 9 — Estimation Planning
  const estimation = estimatePlan(requirements, ctx.complexity, ctx.expectedTotalCost);

  // Phase 10 — Increment Planning
  const increments = planIncrements(milestones, features, ctx.complexity);

  // Phase 11 — Priority Planning
  const priorities = computeFeaturePriorities(features);

  // Phase 12 — Implementation Planning
  const implementation = planImplementation(tasks, priorities);

  // Phase 13 — Validation
  const validation = validatePlan({
    requirements, dependencies, roadmap, milestones,
    tasks, risks, estimation, implementation,
  });

  // Build context string for downstream Planner
  const contextString = buildContextString(goals, requirements, risks, estimation, implementation, validation);

  return {
    buildId:    ctx.buildId,
    goals, requirements, dependencies, milestones, roadmap, features,
    tasks, risks, estimation, increments, priorities, implementation, validation,
    planningScore: validation.planningScore,
    contextString,
    recordedAt: Date.now(),
    version:    0,
  };
}

export function buildFallbackPlanningBlueprint(buildId: string): PlanningBlueprint {
  return buildPlanningBlueprint({
    buildId,
    prompt: '',
    complexity: 'simple',
    chosenPath: 'B',
    reasoningScore: 5,
    executionMode: 'sequential',
  });
}

function buildContextString(
  goals:          ReturnType<typeof analyzeGoals>,
  requirements:   ReturnType<typeof extractRequirements>,
  risks:          ReturnType<typeof analyzeRisks>,
  estimation:     ReturnType<typeof estimatePlan>,
  implementation: ReturnType<typeof planImplementation>,
  validation:     ReturnType<typeof validatePlan>,
): string {
  const topPages = requirements.pages.slice(0, 5).join(', ');
  const topRisks = risks.highRisks.map(r => r.name).slice(0, 3).join(', ') || 'none';
  const critPath = implementation.criticalPath.slice(0, 4).join(' → ') || 'none';
  return [
    '\n\n## V9.7 Planning Intelligence',
    `Primary Goal: ${goals.primaryGoal}`,
    `Detected Features: ${requirements.detectedFeatures.filter(f => f.detected).map(f => f.name).join(', ')}`,
    `Pages: ${topPages}`,
    `Complexity Score: ${requirements.complexityScore}/10`,
    `High Risks: ${topRisks}`,
    `Critical Path: ${critPath}`,
    `Estimation: ${estimation.developmentDays}d / ${estimation.filesCount} files / ${estimation.componentsCount} components / $${estimation.overallCost.toFixed(4)}`,
    `Planning Score: ${validation.planningScore}/10`,
  ].join('\n');
}
