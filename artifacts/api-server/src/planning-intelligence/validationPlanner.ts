// ── V9.7 Planning Intelligence — Phase 13: Planning Validation ─────────────────
import type {
  RequirementBlueprint, DependencyBlueprint, MilestoneBlueprint, RoadmapBlueprint,
  TaskBlueprint, RiskBlueprint, EstimationBlueprint, ImplementationBlueprint,
  PlanningValidation,
} from './planningTypes.js';

export function validatePlan(args: {
  requirements: RequirementBlueprint;
  dependencies: DependencyBlueprint;
  roadmap: RoadmapBlueprint;
  milestones: MilestoneBlueprint;
  tasks: TaskBlueprint;
  risks: RiskBlueprint;
  estimation: EstimationBlueprint;
  implementation: ImplementationBlueprint;
}): PlanningValidation {
  const { requirements, dependencies, roadmap, milestones, tasks, risks, estimation, implementation } = args;
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // ── Requirements score ─────────────────────────────────────────────────────
  let requirementsScore = 5;
  if (requirements.pages.length >= 3) requirementsScore += 1;
  if (requirements.apis.length >= 2) requirementsScore += 1;
  if (requirements.database.length >= 2) requirementsScore += 1;
  if (requirements.detectedFeatures.filter(f => f.detected).length >= 3) requirementsScore += 1;
  if (requirements.totalRequirements >= 15) requirementsScore += 1;
  if (requirements.authentication) requirementsScore = Math.min(10, requirementsScore + 0.5);
  requirementsScore = Math.min(10, requirementsScore);

  // ── Dependencies score ─────────────────────────────────────────────────────
  let dependenciesScore = 10;
  if (dependencies.hasCycle) {
    dependenciesScore -= 5;
    warnings.push('Circular dependency detected in feature graph');
  }
  if (dependencies.missingDependencies.length > 0) {
    dependenciesScore -= dependencies.missingDependencies.length * 1;
    warnings.push(`${dependencies.missingDependencies.length} missing feature dependencies`);
  }
  dependenciesScore = Math.max(0, dependenciesScore);

  // ── Roadmap score ──────────────────────────────────────────────────────────
  let roadmapScore = 6;
  if (roadmap.totalSprints >= 2) roadmapScore += 1;
  if (roadmap.criticalDeliverables.length >= 2) roadmapScore += 1;
  if (roadmap.parallelFeatures.length >= 1) roadmapScore += 1;
  if (roadmap.sequentialFeatures.length >= 1) roadmapScore += 1;
  roadmapScore = Math.min(10, roadmapScore);

  // ── Milestones score ───────────────────────────────────────────────────────
  let milestonesScore = 6;
  if (milestones.totalMilestones >= 3) milestonesScore += 1;
  if (milestones.criticalMilestones.length >= 1) milestonesScore += 1;
  if (milestones.totalDays >= 7 && milestones.totalDays <= 90) milestonesScore += 1;
  if (milestones.milestones.every(m => m.deliverable)) milestonesScore += 1;
  milestonesScore = Math.min(10, milestonesScore);

  // ── Tasks score ────────────────────────────────────────────────────────────
  let tasksScore = 5;
  if (tasks.totalTasks >= 5) tasksScore += 1;
  if (tasks.totalTasks >= 10) tasksScore += 1;
  if (tasks.criticalTasks.length >= 1) tasksScore += 1;
  if (tasks.parallelGroups.length >= 2) tasksScore += 1;
  if (tasks.totalHours >= 20) tasksScore += 1;
  tasksScore = Math.min(10, tasksScore);

  // ── Risks score ────────────────────────────────────────────────────────────
  let risksScore = 5;
  if (risks.risks.length >= 3) risksScore += 2;
  if (risks.risks.every(r => r.mitigation)) risksScore += 2;
  if (risks.technicalDebt.length >= 0) risksScore += 1; // always true, just present
  if (risks.highRisks.length === 0) risksScore = Math.min(10, risksScore + 1);
  else recommendations.push('Address high-risk items before first production milestone');
  risksScore = Math.min(10, risksScore);

  // ── Estimation score ───────────────────────────────────────────────────────
  let estimationScore = 5;
  if (estimation.developmentDays > 0) estimationScore += 1;
  if (estimation.filesCount > 0) estimationScore += 1;
  if (estimation.componentsCount > 0) estimationScore += 1;
  if (estimation.confidence >= 0.7) estimationScore += 1;
  if (estimation.apisCount > 0) estimationScore += 1;
  estimationScore = Math.min(10, estimationScore);

  // ── Implementation score ──────────────────────────────────────────────────
  let implementationScore = 5;
  if (implementation.sequentialTasks.length >= 2) implementationScore += 1;
  if (implementation.parallelTasks.length >= 1) implementationScore += 1;
  if (implementation.criticalPath.length >= 1) implementationScore += 1;
  if (implementation.fastTrackTasks.length >= 1) implementationScore += 1;
  if (implementation.executionOrder.length >= 3) implementationScore += 1;
  implementationScore = Math.min(10, implementationScore);

  // ── Completeness ──────────────────────────────────────────────────────────
  let completenessScore = 10;
  if (requirements.pages.length === 0) { completenessScore -= 2; warnings.push('No pages detected'); }
  if (requirements.apis.length === 0) { completenessScore -= 1; recommendations.push('Define at least one API'); }
  if (tasks.totalTasks === 0) { completenessScore -= 3; warnings.push('No tasks planned'); }
  completenessScore = Math.max(0, completenessScore);

  // ── Overall ───────────────────────────────────────────────────────────────
  const overallScore = Math.round(
    (requirementsScore * 0.15 + dependenciesScore * 0.12 + roadmapScore * 0.12 +
     milestonesScore * 0.10 + tasksScore * 0.12 + risksScore * 0.10 +
     estimationScore * 0.10 + implementationScore * 0.10 + completenessScore * 0.09) * 10
  ) / 10;

  return {
    requirementsScore, dependenciesScore, roadmapScore, milestonesScore,
    tasksScore, risksScore, estimationScore, implementationScore, completenessScore,
    overallScore, planningScore: overallScore,
    valid: overallScore >= 5 && !dependencies.hasCycle,
    warnings, recommendations,
  };
}
