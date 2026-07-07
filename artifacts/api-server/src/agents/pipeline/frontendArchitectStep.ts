// ── V8.5 Frontend Architect — Pipeline Step ───────────────────────────────────

import type { Response } from 'express';
import type { ProductManagerOutput } from '../../product-manager/productTypes.js';
import type { FrontendArchitectOutput } from '../../frontend-architect/frontendTypes.js';
import { runFrontendArchitect } from '../../frontend-architect/frontendArchitect.js';
import { learnFromArchitecture } from '../../frontend-architect/architectureLearning.js';
import { withAgentMetrics } from '../../telemetry/agentMetrics.js';

const FALLBACK_OUTPUT: FrontendArchitectOutput = {
  blueprint: {
    projectType: 'SaaS',
    projectTypeConfidence: 0.4,
    routingArchitecture: {
      strategy: 'ReactRouter', publicRoutes: [], protectedRoutes: [], adminRoutes: [],
      authRoutes: [], catchRoute: { path: '*', type: 'catch', layout: 'ErrorLayout', component: 'NotFoundPage', lazy: false },
      hasNestedRoutes: false, hasDynamicRoutes: false, routeCount: 1,
    },
    layoutArchitecture: {
      layouts: [], defaultLayout: 'MarketingLayout', authLayout: 'AuthLayout', errorLayout: 'ErrorLayout',
    },
    componentOwnership:      { groups: [], sharedCount: 0, totalEstimate: 0 },
    folderStructure:         { root: 'src/', directories: ['src/components/', 'src/pages/'], keyFiles: ['src/main.tsx', 'src/App.tsx'], pattern: 'layer-first' },
    stateArchitecture:       { layers: [], primaryStrategy: 'Context', hasServerState: false, hasCacheState: false, hasFormState: true, hasAuthState: false, complexity: 'Low' },
    themeArchitecture:       { modes: ['light'], defaultMode: 'light', runtimeSwitching: false, tokenSystem: false, cssVariables: true, hasDarkMode: false },
    apiArchitecture:         { pattern: 'REST', cachingStrategy: 'none', hasOptimisticUpdates: false, hasRetry: true, hasPagination: false, hasInfiniteScroll: false, hasSearch: false, hasFiltering: false, hasSorting: false, queryBoundaries: [], mutationBoundaries: [] },
    authArchitecture:        { strategy: 'None', roles: ['Guest'], hasRefreshFlow: false, hasProtectedPages: false, hasGuestMode: true, hasMultiTenant: false, sessionStrategy: 'none' },
    permissionArchitecture:  { model: 'None', roles: [], hasRouteGuards: false, hasComponentGuards: false, hasApiGuards: false },
    responsiveArchitecture:  { breakpoints: ['sm: 640px', 'md: 768px', 'lg: 1024px', 'xl: 1280px', '2xl: 1536px'], mobileFirst: false, hasDrawerNav: false, hasSidebarCollapse: false, hasBottomNav: false, strategy: 'adaptive' },
    performanceArchitecture: { hasLazyLoading: true, hasRouteSplitting: true, hasMemoization: false, hasVirtualization: false, hasSuspense: true, hasImageOptimization: false, bundleStrategy: 'balanced', estimatedBundleSize: 'medium' },
    loadingArchitecture:     { hasSkeletons: false, hasProgressBars: false, hasOptimisticUI: false, hasEmptyStates: false, hasLoadingIndicators: true, hasStreaming: false, hasPartialRendering: false },
    accessibilityArchitecture: { hasKeyboardNav: true, hasFocusManagement: false, hasARIA: false, hasColorContrast: true, hasReducedMotion: true, hasSemanticHTML: true, hasScreenReaders: false, hasErrorAnnouncements: false, hasSkipLinks: false, level: 'A' },
    seoArchitecture:         { hasMetadata: true, hasOpenGraph: false, hasTwitterCards: false, hasCanonicalUrls: false, hasStructuredData: false, hasSitemap: false, hasRobots: false, hasDynamicTitles: true, strategy: 'basic' },
    errorArchitecture:       { hasErrorBoundaries: true, hasFallbackUI: true, hasRetry: false, hasRecovery: false, hasOfflineState: false, hasNetworkFailure: false, hasApiFailure: false },
    validationScores: [],
    overallScore: 7.0,
    confidence: 0.4,
  },
  overallScore: 7.0,
  contextString: '',
};

export async function runFrontendArchitectStep(
  prompt:              string,
  buildId:             string,
  res:                 Response,
  productManagerOutput: ProductManagerOutput,
): Promise<FrontendArchitectOutput> {
  return withAgentMetrics('FrontendArchitect', async () => {
    const sendEvent = (event: object) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    sendEvent({ type: 'frontend_architect_start', agent: 'FrontendArchitect' });

    try {
      const { productPlan } = productManagerOutput;
      const output = runFrontendArchitect(prompt, productPlan);
      const { blueprint } = output;

      sendEvent({
        type: 'frontend_architect_progress',
        projectType:       blueprint.projectType,
        confidence:        blueprint.projectTypeConfidence,
        routeCount:        blueprint.routingArchitecture.routeCount,
        layoutCount:       blueprint.layoutArchitecture.layouts.length,
        stateStrategy:     blueprint.stateArchitecture.primaryStrategy,
        primaryRoutes:     blueprint.routingArchitecture.publicRoutes.slice(0, 4).map(r => r.path),
        componentCount:    blueprint.componentOwnership.totalEstimate,
        hasAuth:           blueprint.authArchitecture.strategy !== 'None',
        hasDarkMode:       blueprint.themeArchitecture.hasDarkMode,
        accessibilityLevel: blueprint.accessibilityArchitecture.level,
        seoStrategy:       blueprint.seoArchitecture.strategy,
        performanceBudget: blueprint.performanceArchitecture.bundleStrategy,
      });

      sendEvent({
        type:          'frontend_architect_complete',
        projectType:   blueprint.projectType,
        overallScore:  output.overallScore,
        routeCount:    blueprint.routingArchitecture.routeCount,
        layoutCount:   blueprint.layoutArchitecture.layouts.length,
        componentCount: blueprint.componentOwnership.totalEstimate,
        stateStrategy: blueprint.stateArchitecture.primaryStrategy,
        authStrategy:  blueprint.authArchitecture.strategy,
        seoStrategy:   blueprint.seoArchitecture.strategy,
        dimensions:    blueprint.validationScores.slice(0, 4).map(s => `${s.dimension}: ${s.score}/10`),
      });

      // Fire-and-forget learning (sync function, run in next tick)
      setImmediate(() => {
        try { learnFromArchitecture({ buildId, blueprint }); } catch { /* non-fatal */ }
      });

      sendEvent({ type: 'frontend_architect_learning', buildId, projectType: blueprint.projectType, overallScore: output.overallScore });

      return output;
    } catch (err) {
      // Failure is non-fatal — return fallback
      return FALLBACK_OUTPUT;
    }
  });
}
