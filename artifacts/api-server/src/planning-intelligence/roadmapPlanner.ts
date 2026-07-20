// ── V9.7 Planning Intelligence — Phase 5: Roadmap Planning ────────────────────
import type { MilestoneBlueprint, RoadmapBlueprint, Sprint } from './planningTypes.js';

const SPRINT_DAYS = 14;

export function planRoadmap(
  milestones: MilestoneBlueprint,
  complexity: 'simple' | 'standard' | 'enterprise',
): RoadmapBlueprint {
  const sprints: Sprint[] = [];
  const sprintCount = complexity === 'simple' ? 2 : complexity === 'enterprise' ? 5 : 3;

  // Distribute milestones across sprints
  const chunks = chunkMilestones(milestones.milestones, sprintCount);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const sprintMilestones = chunk.map(m => m.id);
    const sprintFeatures = chunk.flatMap(m => m.features);
    const criticalDeliverable = chunk.find(m => m.criticalPath)?.deliverable ?? chunk[0]?.deliverable ?? 'Sprint deliverables';

    // Determine sequential vs parallel: root features are sequential; same-depth parallel
    const sequentialWork = sprintFeatures.slice(0, Math.ceil(sprintFeatures.length / 2));
    const parallelWork = sprintFeatures.slice(Math.ceil(sprintFeatures.length / 2));

    sprints.push({
      id: `sprint-${i + 1}`,
      name: `Sprint ${i + 1}${i === 0 ? ' — Foundation' : i === chunks.length - 1 ? ' — Ship' : ''}`,
      milestones: sprintMilestones,
      features: sprintFeatures,
      parallelWork,
      sequentialWork,
      criticalDeliverable,
      estimatedDays: SPRINT_DAYS,
    });
  }

  const allFeatures = milestones.milestones.flatMap(m => m.features);
  const parallelFeatures = allFeatures.filter(f =>
    ['dashboard', 'analytics', 'search', 'notifications', 'reports'].includes(f));
  const sequentialFeatures = allFeatures.filter(f =>
    ['database', 'auth', 'rbac', 'core-api'].includes(f));
  const criticalDeliverables = milestones.criticalMilestones
    .map(id => milestones.milestones.find(m => m.id === id)?.deliverable ?? id);

  return {
    sprints,
    totalSprints: sprints.length,
    totalDays: sprints.length * SPRINT_DAYS,
    parallelFeatures,
    sequentialFeatures,
    criticalDeliverables,
  };
}

function chunkMilestones<T>(arr: T[], n: number): T[][] {
  const size = Math.ceil(arr.length / n);
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  while (result.length < n) result.push([]);
  return result.slice(0, n);
}
