// ── V9.7 Planning Intelligence — Phase 11: Feature Priority Planning ──────────
// NOTE: This is the FEATURE priority planner in planning-intelligence/.
// It is distinct from the TASK priority planner in execution-intelligence/.
import type { FeatureBlueprint, PriorityBlueprint, FeaturePriority } from './planningTypes.js';

// Business value weights per feature
const BUSINESS_VALUE: Record<string, number> = {
  auth: 10, payments: 10, foundation: 9, 'admin-panel': 7, dashboard: 8,
  rbac: 8, notifications: 6, cms: 6, analytics: 7, search: 5,
  reports: 6, 'feature-flags': 4, 'ui-components': 8, routing: 9,
  'real-time': 7, 'file-upload': 5,
};

const TECHNICAL_IMPORTANCE: Record<string, number> = {
  foundation: 10, routing: 10, 'ui-components': 9, auth: 9, rbac: 8,
  payments: 7, dashboard: 6, 'admin-panel': 6, notifications: 5,
  analytics: 5, cms: 5, search: 5, reports: 4, 'feature-flags': 3,
};

export function computeFeaturePriorities(features: FeatureBlueprint): PriorityBlueprint {
  const allFeatures = [
    ...features.coreFeatures.map(f => ({ ...f, isCore: true })),
    ...features.optionalFeatures.map(f => ({ ...f, isCore: false })),
  ];

  const complexityScore: Record<string, number> = {
    low: 2, medium: 5, high: 7, 'very-high': 9,
  };
  const riskScore: Record<string, number> = {
    auth: 9, payments: 10, rbac: 8, cms: 6, 'admin-panel': 5,
    foundation: 3, routing: 2, 'ui-components': 2, analytics: 4,
    notifications: 4, dashboard: 3, search: 3,
  };

  const scored: FeaturePriority[] = allFeatures.map(f => {
    const bv = BUSINESS_VALUE[f.id] ?? 5;
    const ti = TECHNICAL_IMPORTANCE[f.id] ?? 5;
    const risk = riskScore[f.id] ?? 4;
    // Higher dependency count = higher dependency weight
    const depWeight = Math.min(10, f.dependencies.length * 2 + (f.isCore ? 3 : 1));
    const cplx = complexityScore[f.complexity] ?? 5;

    // Weighted composite: business-value 30%, technical 25%, risk 15%, dep 15%, complexity 15%
    const overallScore = Math.round(
      (bv * 0.30 + ti * 0.25 + risk * 0.15 + depWeight * 0.15 + cplx * 0.15) * 10
    ) / 10;

    const priorityLabel: FeaturePriority['priorityLabel'] =
      overallScore >= 8 ? 'critical' : overallScore >= 6 ? 'high' : overallScore >= 4 ? 'medium' : 'low';

    return {
      featureId: f.id, featureName: f.name,
      businessValue: bv, technicalImportance: ti, risk, dependencyWeight: depWeight,
      complexity: cplx, overallScore, rank: 0, priorityLabel,
    };
  });

  // Rank by score (1 = highest)
  scored.sort((a, b) => b.overallScore - a.overallScore);
  scored.forEach((s, i) => s.rank = i + 1);

  const topPriorities = scored.slice(0, 5).map(s => s.featureId);
  const criticalFeatures = scored.filter(s => s.priorityLabel === 'critical').map(s => s.featureId);
  const deferredFeatures = scored.filter(s => s.priorityLabel === 'low').map(s => s.featureId);

  return { priorities: scored, topPriorities, criticalFeatures, deferredFeatures };
}
