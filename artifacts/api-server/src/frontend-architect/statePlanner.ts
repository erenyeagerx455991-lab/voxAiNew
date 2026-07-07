// ── V8.5 Frontend Architect — State Architecture ──────────────────────────────

import type { ProjectType, StateArchitecture, StateLayer, StateStrategy } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planStateArchitecture(
  projectType: ProjectType,
  features: ProductFeature[],
  prompt: string,
): StateArchitecture {
  const layers = buildStateLayers(projectType, features, prompt);
  const primaryStrategy = layers[0]?.strategy ?? 'ReactState';
  const complexity = resolveComplexity(features, layers);

  return {
    layers,
    primaryStrategy,
    hasServerState:  features.includes('Analytics') || features.includes('Dashboard') || features.includes('Reports'),
    hasCacheState:   features.includes('Search') || features.includes('Analytics'),
    hasFormState:    true, // all projects have at least one form
    hasAuthState:    features.includes('Authentication'),
    complexity,
  };
}

function buildStateLayers(projectType: ProjectType, features: ProductFeature[], prompt: string): StateLayer[] {
  const layers: StateLayer[] = [];

  // Global state strategy
  const primaryStrategy = resolvePrimaryStrategy(projectType, features, prompt);
  layers.push({
    name:     'Global State',
    strategy: primaryStrategy,
    scope:    'global',
    reason:   reasonForStrategy(primaryStrategy, projectType, features),
  });

  // Server state
  if (features.includes('Dashboard') || features.includes('Analytics') || features.includes('CRM') || features.includes('Reports')) {
    layers.push({
      name:     'Server State',
      strategy: 'ReactQuery',
      scope:    'global',
      reason:   'React Query provides built-in caching, background refetch, and server state synchronization',
    });
  }

  // Form state
  if (features.includes('Settings') || features.includes('Profile') || features.includes('Authentication') || features.includes('Billing')) {
    layers.push({
      name:     'Form State',
      strategy: 'ReactState',
      scope:    'local',
      reason:   'React Hook Form provides performant, local form state with validation',
    });
  }

  // Auth state
  if (features.includes('Authentication')) {
    layers.push({
      name:     'Auth State',
      strategy: 'Context',
      scope:    'global',
      reason:   'Auth state needs to be globally accessible; Context avoids prop drilling',
    });
  }

  // UI state — always local
  layers.push({
    name:     'UI State',
    strategy: 'ReactState',
    scope:    'local',
    reason:   'Modals, tooltips, and transient UI state belong at the component level',
  });

  // Cache state for search/filter heavy apps
  if (features.includes('Search') || features.includes('Kanban') || features.includes('AIAssistant')) {
    layers.push({
      name:     'Cache / Derived State',
      strategy: 'Zustand',
      scope:    'feature',
      reason:   'Zustand provides a lightweight, performant store for derived and cached state',
    });
  }

  return layers;
}

function resolvePrimaryStrategy(projectType: ProjectType, features: ProductFeature[], prompt: string): StateStrategy {
  // Complex enterprise apps → Redux Toolkit
  const enterpriseTypes: ProjectType[] = ['ERP', 'EnterprisePlatform', 'Analytics'];
  if (enterpriseTypes.includes(projectType) || features.length > 12) return 'Redux';

  // Real-time / chat apps → Zustand
  if (projectType === 'ChatApp' || features.includes('Chat') || /real.?time|socket/i.test(prompt)) return 'Zustand';

  // AI apps → Zustand (streaming state)
  if (projectType === 'AIApplication' || features.includes('AIAssistant')) return 'Zustand';

  // Simple apps → Context
  const simpleTypes: ProjectType[] = ['LandingPage', 'Portfolio', 'Blog', 'Documentation'];
  if (simpleTypes.includes(projectType)) return 'Context';

  // Default for SaaS / Dashboard → Context + ReactQuery
  return 'Context';
}

function reasonForStrategy(strategy: StateStrategy, projectType: ProjectType, features: ProductFeature[]): string {
  const reasons: Record<StateStrategy, string> = {
    Redux:       'Complex app with many interconnected state slices; Redux Toolkit provides predictable state management with DevTools',
    Zustand:     'Lightweight global state with minimal boilerplate; perfect for real-time and streaming apps',
    Context:     'Simple global state (auth, theme, settings); avoids Redux overhead for this project complexity',
    ReactState:  'Local component state is sufficient for this project scope',
    ServerState: 'Server-driven state with SWR/React Query for caching and synchronization',
    ReactQuery:  'Async server state with automatic caching, background refetch and optimistic updates',
    Jotai:       'Atomic state for fine-grained reactivity',
  };
  return reasons[strategy] ?? 'Appropriate for project complexity';
}

function resolveComplexity(features: ProductFeature[], layers: StateLayer[]): StateArchitecture['complexity'] {
  if (features.length > 10 || layers.length > 4) return 'High';
  if (features.length > 5 || layers.length > 2) return 'Medium';
  return 'Low';
}
