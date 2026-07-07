// ── V8.5 Frontend Architect — API Architecture ────────────────────────────────

import type { ProjectType, ApiArchitecture, ApiPattern, CachingStrategy } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planApiArchitecture(
  projectType: ProjectType,
  features: ProductFeature[],
  prompt: string,
): ApiArchitecture {
  const pattern = resolveApiPattern(projectType, prompt);
  const cachingStrategy = resolveCachingStrategy(projectType, features);
  const hasInfiniteScroll = hasInfiniteScrollNeed(projectType, features);

  return {
    pattern,
    cachingStrategy,
    hasOptimisticUpdates: features.includes('Kanban') || features.includes('Chat') || projectType === 'Productivity',
    hasRetry:             true,
    hasPagination:        features.includes('CRM') || features.includes('Reports') || projectType === 'ECommerce' || projectType === 'Marketplace',
    hasInfiniteScroll,
    hasSearch:            features.includes('Search') || projectType === 'Marketplace' || projectType === 'ECommerce',
    hasFiltering:         features.includes('CRM') || features.includes('Reports') || features.includes('Analytics'),
    hasSorting:           features.includes('Reports') || features.includes('CRM') || features.includes('Analytics'),
    queryBoundaries:      buildQueryBoundaries(features, projectType),
    mutationBoundaries:   buildMutationBoundaries(features, projectType),
  };
}

function resolveApiPattern(projectType: ProjectType, prompt: string): ApiPattern {
  if (/graphql/i.test(prompt)) return 'GraphQL';
  if (/trpc|server.*action/i.test(prompt)) return 'tRPC';
  return 'REST';
}

function resolveCachingStrategy(projectType: ProjectType, features: ProductFeature[]): CachingStrategy {
  if (features.includes('Dashboard') || features.includes('Analytics')) return 'stale-while-revalidate';
  if (projectType === 'Documentation' || projectType === 'Blog') return 'cache-first';
  if (projectType === 'ChatApp' || features.includes('Chat')) return 'network-first';
  const staticTypes: ProjectType[] = ['LandingPage', 'Portfolio'];
  if (staticTypes.includes(projectType)) return 'none';
  return 'stale-while-revalidate';
}

function hasInfiniteScrollNeed(projectType: ProjectType, features: ProductFeature[]): boolean {
  return projectType === 'SocialPlatform' || projectType === 'Blog' || projectType === 'ChatApp' ||
         features.includes('Chat') || features.includes('Notifications');
}

function buildQueryBoundaries(features: ProductFeature[], projectType: ProjectType): string[] {
  const bounds: string[] = [];
  if (features.includes('Dashboard'))  bounds.push('GET /api/dashboard/stats');
  if (features.includes('Analytics'))  bounds.push('GET /api/analytics/metrics');
  if (features.includes('CRM'))        bounds.push('GET /api/contacts', 'GET /api/deals');
  if (features.includes('Reports'))    bounds.push('GET /api/reports');
  if (features.includes('Billing'))    bounds.push('GET /api/billing/subscription');
  if (features.includes('Teams'))      bounds.push('GET /api/teams/members');
  if (features.includes('Projects'))   bounds.push('GET /api/projects');
  if (features.includes('Calendar'))   bounds.push('GET /api/calendar/events');
  if (bounds.length === 0) bounds.push('GET /api/data');
  return bounds;
}

function buildMutationBoundaries(features: ProductFeature[], projectType: ProjectType): string[] {
  const bounds: string[] = [];
  if (features.includes('Authentication')) bounds.push('POST /api/auth/login', 'POST /api/auth/signup');
  if (features.includes('Profile'))        bounds.push('PUT /api/profile');
  if (features.includes('Settings'))       bounds.push('PUT /api/settings');
  if (features.includes('Billing'))        bounds.push('POST /api/billing/subscribe', 'DELETE /api/billing/cancel');
  if (features.includes('Projects'))       bounds.push('POST /api/projects', 'PUT /api/projects/:id');
  if (features.includes('Teams'))          bounds.push('POST /api/teams/invite');
  if (features.includes('Comments'))       bounds.push('POST /api/comments');
  if (bounds.length === 0) bounds.push('POST /api/data');
  return bounds;
}
