// ── V9.0 Runtime Intelligence — Rendering Strategy Planner ───────────────────
import type { GenerationMode, RenderingStrategy, RenderingType, RuntimeIntelligenceInput } from './runtimeTypes.js';

function selectRenderingType(mode: GenerationMode, input: RuntimeIntelligenceInput): RenderingType {
  // SEO-sensitive projects → static or SSR
  const isLanding = input.backendType === 'LandingAPI'
    || input.productGoal.toLowerCase().includes('landing')
    || input.productGoal.toLowerCase().includes('marketing');
  if (isLanding) return 'static';

  // Dashboard / data-heavy → CSR
  const isDashboard = input.backendType === 'Dashboard'
    || input.productGoal.toLowerCase().includes('dashboard');
  if (isDashboard) return 'csr';

  // Enterprise with compliance → hybrid
  if (input.hasCompliance || mode === 'Enterprise') return 'hybrid';

  // Default: CSR for React apps
  return 'csr';
}

export function planRenderingStrategy(mode: GenerationMode, input: RuntimeIntelligenceInput): RenderingStrategy {
  const strategy = selectRenderingType(mode, input);
  const lazyLoadComponents = mode !== 'Fast';
  const codesplit = mode === 'Quality' || mode === 'Enterprise' || mode === 'Creative';

  return {
    strategy,
    lazyLoadComponents,
    codesplit,
    rationale: `${mode} rendering: ${strategy}, lazy=${lazyLoadComponents}, codesplit=${codesplit}`,
  };
}
