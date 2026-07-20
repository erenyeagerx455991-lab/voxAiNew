// ── V9.7 Planning Intelligence — Phase 10: Increment Planning ─────────────────
import type { MilestoneBlueprint, FeatureBlueprint, IncrementBlueprint, Increment } from './planningTypes.js';

export function planIncrements(
  milestones: MilestoneBlueprint,
  features: FeatureBlueprint,
  complexity: 'simple' | 'standard' | 'enterprise',
): IncrementBlueprint {
  const count = complexity === 'simple' ? 3 : complexity === 'enterprise' ? 5 : 4;
  const increments: Increment[] = [];

  // Increment 1: Foundation (always)
  increments.push({
    id: 'inc-1',
    name: 'Increment 1 — Foundation',
    features: ['foundation', 'ui-components', 'routing'],
    milestones: milestones.milestones.slice(0, 1).map(m => m.id),
    independentlyBuildable: true,
    estimatedDays: Math.round(milestones.totalDays / count),
    deliverables: ['Project scaffold', 'DB schema', 'Design system', 'Base routing'],
  });

  // Increment 2: Authentication + Core
  const authFeatures = features.coreFeatures
    .filter(f => ['auth', 'rbac', 'profile', 'settings'].includes(f.id))
    .map(f => f.id);
  if (authFeatures.length || count > 2) {
    increments.push({
      id: 'inc-2',
      name: 'Increment 2 — Authentication & Core',
      features: authFeatures.length ? authFeatures : ['core'],
      milestones: milestones.milestones.slice(1, 2).map(m => m.id),
      independentlyBuildable: true,
      estimatedDays: Math.round(milestones.totalDays / count),
      deliverables: ['Authentication', 'User management', 'Core pages'],
    });
  }

  // Increment 3: Main Product Features
  const productFeatures = features.coreFeatures
    .filter(f => ['dashboard', 'payments', 'cms', 'admin-panel'].includes(f.id))
    .map(f => f.id);
  if (count >= 3) {
    increments.push({
      id: 'inc-3',
      name: 'Increment 3 — Main Product',
      features: productFeatures.length ? productFeatures : features.coreFeatures.slice(3, 6).map(f => f.id),
      milestones: milestones.milestones.slice(2, 3).map(m => m.id),
      independentlyBuildable: true,
      estimatedDays: Math.round(milestones.totalDays / count),
      deliverables: ['Core product features', 'Business logic', 'Main workflows'],
    });
  }

  // Increment 4: Integrations + Optional features
  if (count >= 4) {
    const optFeatures = features.optionalFeatures.map(f => f.id).slice(0, 3);
    increments.push({
      id: 'inc-4',
      name: 'Increment 4 — Integrations',
      features: optFeatures.length ? optFeatures : ['integrations'],
      milestones: milestones.milestones.slice(3, 4).map(m => m.id),
      independentlyBuildable: true,
      estimatedDays: Math.round(milestones.totalDays / count),
      deliverables: ['Third-party integrations', 'Analytics', 'Notifications'],
    });
  }

  // Increment 5: Polish + Deploy (enterprise)
  if (count >= 5) {
    increments.push({
      id: 'inc-5',
      name: 'Increment 5 — Scale & Deploy',
      features: ['monitoring', 'performance', 'ci-cd'],
      milestones: milestones.milestones.slice(4).map(m => m.id),
      independentlyBuildable: true,
      estimatedDays: Math.round(milestones.totalDays / count),
      deliverables: ['Production infrastructure', 'Monitoring', 'Performance optimization'],
    });
  }

  const totalDays = increments.reduce((s, i) => s + i.estimatedDays, 0);
  return { increments, totalIncrements: increments.length, totalDays };
}
