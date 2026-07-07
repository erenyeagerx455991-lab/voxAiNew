// ── V8.5 Frontend Architect — Architecture Validator ─────────────────────────

import type {
  FrontendArchitectureBlueprint, ArchitectureScore, ArchitectureDimension,
  ALL_ARCHITECTURE_DIMENSIONS,
} from './frontendTypes.js';
import { ALL_ARCHITECTURE_DIMENSIONS as DIMS } from './frontendTypes.js';

export function validateArchitecture(blueprint: FrontendArchitectureBlueprint): {
  scores: ArchitectureScore[];
  overallScore: number;
} {
  const scores = DIMS.map(dim => scoreOneDimension(dim, blueprint));
  const overallScore = parseFloat(
    (scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(2),
  );
  return { scores, overallScore };
}

function scoreOneDimension(dim: ArchitectureDimension, bp: FrontendArchitectureBlueprint): ArchitectureScore {
  switch (dim) {
    case 'routing':            return scoreRouting(bp);
    case 'layouts':            return scoreLayouts(bp);
    case 'folderStructure':    return scoreFolderStructure(bp);
    case 'componentOwnership': return scoreComponentOwnership(bp);
    case 'state':              return scoreState(bp);
    case 'performance':        return scorePerformance(bp);
    case 'seo':                return scoreSeo(bp);
    case 'accessibility':      return scoreAccessibility(bp);
    case 'scalability':        return scoreScalability(bp);
    case 'maintainability':    return scoreMaintainability(bp);
    case 'reusability':        return scoreReusability(bp);
    case 'developerExperience': return scoreDeveloperExperience(bp);
  }
}

// ── Dimension Scorers ──────────────────────────────────────────────────────────

function scoreRouting(bp: FrontendArchitectureBlueprint): ArchitectureScore {
  const r = bp.routingArchitecture;
  let score = 5.0;
  if (r.authRoutes.length > 0) score += 1.0;
  if (r.hasNestedRoutes) score += 0.5;
  if (r.hasDynamicRoutes) score += 0.5;
  if (r.routeCount >= 3) score += 1.0;
  if (r.catchRoute) score += 1.0;
  if (r.routeCount >= 8) score += 1.0;
  const s = Math.min(10, score);
  return { dimension: 'routing', score: s, confidence: 0.9, recommendation: s < 7 ? 'Add protected routes and dynamic routes for better routing architecture' : 'Routing architecture is well-structured' };
}

function scoreLayouts(bp: FrontendArchitectureBlueprint): ArchitectureScore {
  const l = bp.layoutArchitecture;
  const count = l.layouts.length;
  let score = Math.min(6.0, count * 1.2);
  if (count >= 4) score = 8.0;
  if (count >= 6) score = 9.5;
  const s = Math.min(10, score);
  return { dimension: 'layouts', score: s, confidence: 0.85, recommendation: count < 3 ? 'Add auth, error, and marketing layouts for a complete layout system' : 'Layout architecture covers the main use cases' };
}

function scoreFolderStructure(bp: FrontendArchitectureBlueprint): ArchitectureScore {
  const f = bp.folderStructure;
  const dirCount = f.directories.length;
  let score = Math.min(5.0, dirCount * 0.4);
  if (dirCount >= 8) score = 7.5;
  if (dirCount >= 12) score = 9.0;
  if (f.pattern === 'feature-first') score = Math.min(10, score + 1.0);
  const s = Math.min(10, score);
  return { dimension: 'folderStructure', score: s, confidence: 0.8, recommendation: dirCount < 6 ? 'Add more directories for features, hooks, and services' : 'Folder structure follows good separation of concerns' };
}

function scoreComponentOwnership(bp: FrontendArchitectureBlueprint): ArchitectureScore {
  const c = bp.componentOwnership;
  const groupCount = c.groups.length;
  let score = Math.min(5.0, groupCount * 0.8);
  if (groupCount >= 5) score = 7.5;
  if (groupCount >= 7) score = 9.0;
  if (c.sharedCount >= 7) score = Math.min(10, score + 0.5);
  const s = Math.min(10, score);
  return { dimension: 'componentOwnership', score: s, confidence: 0.85, recommendation: groupCount < 4 ? 'Define ownership levels for shared, feature, modal, and form components' : 'Component ownership is well-defined' };
}

function scoreState(bp: FrontendArchitectureBlueprint): ArchitectureScore {
  const s = bp.stateArchitecture;
  let score = 5.0;
  if (s.hasAuthState) score += 1.0;
  if (s.hasServerState) score += 1.5;
  if (s.hasCacheState) score += 1.0;
  if (s.hasFormState) score += 0.5;
  if (s.layers.length >= 2) score += 1.0;
  const final = Math.min(10, score);
  return { dimension: 'state', score: final, confidence: 0.85, recommendation: s.layers.length < 2 ? 'Consider separating server state (React Query) from UI state' : 'State architecture is layered appropriately' };
}

function scorePerformance(bp: FrontendArchitectureBlueprint): ArchitectureScore {
  const p = bp.performanceArchitecture;
  let score = 4.0;
  if (p.hasLazyLoading)       score += 1.5;
  if (p.hasRouteSplitting)    score += 1.5;
  if (p.hasMemoization)       score += 0.5;
  if (p.hasVirtualization)    score += 0.5;
  if (p.hasSuspense)          score += 0.5;
  if (p.hasImageOptimization) score += 0.5;
  const s = Math.min(10, score);
  return { dimension: 'performance', score: s, confidence: 0.8, recommendation: !p.hasRouteSplitting ? 'Add route-level code splitting for better performance' : 'Performance architecture is well-configured' };
}

function scoreSeo(bp: FrontendArchitectureBlueprint): ArchitectureScore {
  if (bp.seoArchitecture.strategy === 'none') {
    return { dimension: 'seo', score: 9.0, confidence: 1.0, recommendation: 'SEO intentionally disabled for private application — correct decision' };
  }
  const s = bp.seoArchitecture;
  let score = 4.0;
  if (s.hasMetadata)       score += 1.0;
  if (s.hasOpenGraph)      score += 1.0;
  if (s.hasTwitterCards)   score += 0.5;
  if (s.hasCanonicalUrls)  score += 0.5;
  if (s.hasStructuredData) score += 1.0;
  if (s.hasDynamicTitles)  score += 1.0;
  if (s.hasSitemap)        score += 0.5;
  const final = Math.min(10, score);
  return { dimension: 'seo', score: final, confidence: 0.85, recommendation: !s.hasOpenGraph ? 'Add OpenGraph tags for better social sharing' : 'SEO architecture is complete' };
}

function scoreAccessibility(bp: FrontendArchitectureBlueprint): ArchitectureScore {
  const a = bp.accessibilityArchitecture;
  let score = 2.0;
  if (a.hasKeyboardNav)         score += 1.0;
  if (a.hasFocusManagement)     score += 1.0;
  if (a.hasARIA)                score += 1.5;
  if (a.hasSemanticHTML)        score += 1.5;
  if (a.hasColorContrast)       score += 0.5;
  if (a.hasReducedMotion)       score += 0.5;
  if (a.hasSkipLinks)           score += 0.5;
  if (a.hasErrorAnnouncements)  score += 0.5;
  const s = Math.min(10, score);
  return { dimension: 'accessibility', score: s, confidence: 0.8, recommendation: a.level === 'A' ? 'Target WCAG AA compliance by adding focus management and ARIA labels' : 'Accessibility architecture meets WCAG AA standards' };
}

function scoreScalability(bp: FrontendArchitectureBlueprint): ArchitectureScore {
  let score = 5.0;
  if (bp.folderStructure.pattern === 'feature-first') score += 1.5;
  if (bp.stateArchitecture.complexity === 'High') score += 1.0;
  if (bp.authArchitecture.hasMultiTenant) score += 1.0;
  if (bp.permissionArchitecture.model === 'RBAC') score += 1.0;
  if (bp.routingArchitecture.routeCount >= 10) score += 0.5;
  const s = Math.min(10, score);
  return { dimension: 'scalability', score: s, confidence: 0.75, recommendation: bp.folderStructure.pattern !== 'feature-first' ? 'Use feature-first folder structure for better scalability as the app grows' : 'Architecture is designed for scalability' };
}

function scoreMaintainability(bp: FrontendArchitectureBlueprint): ArchitectureScore {
  let score = 5.0;
  if (bp.componentOwnership.groups.length >= 5) score += 1.5;
  if (bp.stateArchitecture.layers.length >= 2)  score += 1.0;
  if (bp.errorArchitecture.hasErrorBoundaries)   score += 1.0;
  if (bp.loadingArchitecture.hasSkeletons)       score += 0.5;
  if (bp.apiArchitecture.hasRetry)               score += 0.5;
  const s = Math.min(10, score);
  return { dimension: 'maintainability', score: s, confidence: 0.8, recommendation: score < 7 ? 'Add error boundaries and state layer separation to improve maintainability' : 'Architecture promotes maintainability' };
}

function scoreReusability(bp: FrontendArchitectureBlueprint): ArchitectureScore {
  const c = bp.componentOwnership;
  const reusableGroups = c.groups.filter(g => g.reusable).length;
  let score = Math.min(6.0, reusableGroups * 1.2);
  if (c.sharedCount >= 7) score += 2.0;
  if (reusableGroups >= 4) score += 2.0;
  const s = Math.min(10, score);
  return { dimension: 'reusability', score: s, confidence: 0.8, recommendation: reusableGroups < 3 ? 'Define more shared/reusable component groups' : 'Component architecture promotes reuse' };
}

function scoreDeveloperExperience(bp: FrontendArchitectureBlueprint): ArchitectureScore {
  let score = 5.0;
  if (bp.folderStructure.keyFiles.length >= 4) score += 1.0;
  if (bp.stateArchitecture.primaryStrategy !== 'ReactState') score += 1.0;
  if (bp.performanceArchitecture.hasLazyLoading) score += 0.5;
  if (bp.themeArchitecture.tokenSystem) score += 1.0;
  if (bp.errorArchitecture.hasFallbackUI) score += 1.0;
  if (bp.loadingArchitecture.hasSkeletons) score += 0.5;
  const s = Math.min(10, score);
  return { dimension: 'developerExperience', score: s, confidence: 0.75, recommendation: s < 7 ? 'Add design token system and structured state management for better DX' : 'Architecture provides a great developer experience' };
}
