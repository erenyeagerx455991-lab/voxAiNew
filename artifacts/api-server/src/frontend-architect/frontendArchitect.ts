// ── V8.5 Autonomous Frontend Architect — Core Engine ─────────────────────────

import type { FrontendArchitectureBlueprint, FrontendArchitectOutput } from './frontendTypes.js';
import type { ProductPlan } from '../product-manager/productTypes.js';
import { classifyProjectType, planAccessibilityArchitecture } from './frontendPlanner.js';
import { planRoutingArchitecture } from './routePlanner.js';
import { planLayoutArchitecture } from './layoutPlanner.js';
import { planComponentOwnership } from './componentPlanner.js';
import { planFolderStructure } from './folderPlanner.js';
import { planStateArchitecture } from './statePlanner.js';
import { planThemeArchitecture } from './themePlanner.js';
import { planApiArchitecture } from './apiPlanner.js';
import { planAuthArchitecture } from './authPlanner.js';
import { planPermissionArchitecture } from './permissionPlanner.js';
import { planResponsiveArchitecture } from './responsivePlanner.js';
import { planPerformanceArchitecture } from './performancePlanner.js';
import { planLoadingArchitecture } from './loadingPlanner.js';
import { planSeoArchitecture } from './seoPlanner.js';
import { planErrorArchitecture } from './errorPlanner.js';
import { validateArchitecture } from './architectureValidator.js';

export function runFrontendArchitect(
  prompt:      string,
  productPlan: ProductPlan,
): FrontendArchitectOutput {
  const productGoal = productPlan.productGoal;
  const features    = productPlan.plannedFeatures;

  // Phase 1 — Project Classification
  const { type: projectType, confidence: projectTypeConfidence } = classifyProjectType(prompt, productGoal);

  // Phases 2–15 — Architecture Planning (all static/deterministic)
  const routingArchitecture     = planRoutingArchitecture(projectType, features, prompt);
  const layoutArchitecture      = planLayoutArchitecture(projectType, features);
  const componentOwnership      = planComponentOwnership(projectType, features);
  const folderStructure         = planFolderStructure(projectType, features);
  const stateArchitecture       = planStateArchitecture(projectType, features, prompt);
  const themeArchitecture       = planThemeArchitecture(projectType, features, prompt);
  const apiArchitecture         = planApiArchitecture(projectType, features, prompt);
  const authArchitecture        = planAuthArchitecture(projectType, features, prompt);
  const permissionArchitecture  = planPermissionArchitecture(projectType, features);
  const responsiveArchitecture  = planResponsiveArchitecture(projectType, features, prompt);
  const performanceArchitecture = planPerformanceArchitecture(projectType, features);
  const loadingArchitecture     = planLoadingArchitecture(projectType, features);
  const accessibilityArchitecture = planAccessibilityArchitecture(projectType);
  const seoArchitecture         = planSeoArchitecture(projectType, features, prompt);
  const errorArchitecture       = planErrorArchitecture(projectType, features);

  // Assemble blueprint (pre-validation — scores will be filled in next)
  const blueprint: FrontendArchitectureBlueprint = {
    projectType,
    projectTypeConfidence,
    routingArchitecture,
    layoutArchitecture,
    componentOwnership,
    folderStructure,
    stateArchitecture,
    themeArchitecture,
    apiArchitecture,
    authArchitecture,
    permissionArchitecture,
    responsiveArchitecture,
    performanceArchitecture,
    loadingArchitecture,
    accessibilityArchitecture,
    seoArchitecture,
    errorArchitecture,
    validationScores: [],
    overallScore: 0,
    confidence: projectTypeConfidence,
  };

  // Phase 16 — Architecture Validation
  const { scores, overallScore } = validateArchitecture(blueprint);
  blueprint.validationScores = scores;
  blueprint.overallScore = overallScore;

  // Phase 19 — Build Context String
  const contextString = buildContextString(blueprint);

  return { blueprint, overallScore, contextString };
}

function buildContextString(bp: FrontendArchitectureBlueprint): string {
  const r  = bp.routingArchitecture;
  const l  = bp.layoutArchitecture;
  const s  = bp.stateArchitecture;
  const a  = bp.authArchitecture;
  const p  = bp.performanceArchitecture;
  const ac = bp.accessibilityArchitecture;
  const se = bp.seoArchitecture;
  const re = bp.responsiveArchitecture;
  const co = bp.componentOwnership;
  const fs = bp.folderStructure;
  const th = bp.themeArchitecture;
  const api = bp.apiArchitecture;

  const protectedPaths = r.protectedRoutes.slice(0, 4).map(r => r.path).join(', ');
  const publicPaths    = r.publicRoutes.slice(0, 4).map(r => r.path).join(', ');
  const sharedComps    = co.groups.find(g => g.level === 'Shared')?.examples.slice(0, 6).join(', ') ?? '';
  const featureComps   = co.groups.find(g => g.level === 'Feature')?.examples.slice(0, 6).join(', ') ?? '';
  const topLayouts     = l.layouts.slice(0, 4).map(lx => lx.name).join(', ');

  return `
--- FRONTEND ARCHITECT BLUEPRINT (V8.5) ---
Project Type: ${bp.projectType} (confidence: ${(bp.projectTypeConfidence * 100).toFixed(0)}%)
Architecture Score: ${bp.overallScore}/10

ROUTING:
  Strategy: ${r.strategy}
  Public Routes: ${publicPaths || '/'}
  Protected Routes: ${protectedPaths || 'none'}
  Auth Routes: ${r.authRoutes.length > 0 ? r.authRoutes.map(x => x.path).join(', ') : 'none'}
  Admin Routes: ${r.adminRoutes.length > 0 ? r.adminRoutes.map(x => x.path).join(', ') : 'none'}
  Total Routes: ${r.routeCount} | Nested: ${r.hasNestedRoutes} | Dynamic: ${r.hasDynamicRoutes}

LAYOUTS:
  Available: ${topLayouts}
  Default: ${l.defaultLayout} | Auth: ${l.authLayout} | Error: ${l.errorLayout}

COMPONENTS:
  Shared (reusable): ${sharedComps}
  Feature-specific: ${featureComps}
  Total estimated: ${co.totalEstimate}

FOLDER STRUCTURE (${fs.pattern}):
  Key dirs: ${fs.directories.slice(0, 8).join(', ')}

STATE:
  Primary: ${s.primaryStrategy} | Complexity: ${s.complexity}
  Layers: ${s.layers.map(l => l.name).join(', ')}
  Server State: ${s.hasServerState} | Auth State: ${s.hasAuthState} | Form State: ${s.hasFormState}

AUTHENTICATION:
  Strategy: ${a.strategy} | Roles: ${a.roles.join(', ')}
  Protected Pages: ${a.hasProtectedPages} | Multi-Tenant: ${a.hasMultiTenant}
  Session: ${a.sessionStrategy}

THEME:
  Modes: ${th.modes.join(', ')} | Default: ${th.defaultMode}
  Dark Mode: ${th.hasDarkMode} | Token System: ${th.tokenSystem}

API:
  Pattern: ${api.pattern} | Caching: ${api.cachingStrategy}
  Optimistic: ${api.hasOptimisticUpdates} | Pagination: ${api.hasPagination} | Search: ${api.hasSearch}

RESPONSIVE:
  Strategy: ${re.strategy} | Mobile-First: ${re.mobileFirst}
  Drawer Nav: ${re.hasDrawerNav} | Sidebar Collapse: ${re.hasSidebarCollapse}

PERFORMANCE:
  Lazy Loading: ${p.hasLazyLoading} | Route Splitting: ${p.hasRouteSplitting}
  Memoization: ${p.hasMemoization} | Virtualization: ${p.hasVirtualization}
  Bundle: ${p.bundleStrategy} | Size: ${p.estimatedBundleSize}

ACCESSIBILITY: Level ${ac.level}
  ARIA: ${ac.hasARIA} | Keyboard Nav: ${ac.hasKeyboardNav} | Skip Links: ${ac.hasSkipLinks}

SEO: ${se.strategy}
  OpenGraph: ${se.hasOpenGraph} | Sitemap: ${se.hasSitemap} | Structured Data: ${se.hasStructuredData}

ARCHITECTURE SCORES:
${bp.validationScores.map(s => `  ${s.dimension}: ${s.score}/10`).join('\n')}
--- END FRONTEND ARCHITECT BLUEPRINT ---`.trim();
}
