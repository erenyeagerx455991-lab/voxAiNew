// ── V8.5 Frontend Architect — Responsive Architecture ────────────────────────

import type { ProjectType, ResponsiveArchitecture } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planResponsiveArchitecture(
  projectType: ProjectType,
  features: ProductFeature[],
  prompt: string,
): ResponsiveArchitecture {
  const mobileFirst = isMobileFirst(projectType, prompt);
  const hasDashboard = features.includes('Dashboard') || projectType === 'Dashboard' || projectType === 'Analytics';
  const hasNav = hasDashboard;

  return {
    breakpoints: ['sm: 640px', 'md: 768px', 'lg: 1024px', 'xl: 1280px', '2xl: 1536px'],
    mobileFirst,
    hasDrawerNav:       mobileFirst || isConsumerApp(projectType),
    hasSidebarCollapse: hasDashboard,
    hasBottomNav:       mobileFirst && isConsumerApp(projectType),
    strategy:           mobileFirst ? 'mobile-first' : resolveStrategy(projectType),
  };
}

function isMobileFirst(projectType: ProjectType, prompt: string): boolean {
  if (/mobile.*first|mobile.*app|pwa|progressive.*web/i.test(prompt)) return true;
  const mobileTypes: ProjectType[] = ['SocialPlatform', 'Booking', 'ChatApp'];
  return mobileTypes.includes(projectType);
}

function isConsumerApp(projectType: ProjectType): boolean {
  const consumer: ProjectType[] = ['ECommerce', 'Marketplace', 'Booking', 'SocialPlatform', 'ChatApp', 'Education'];
  return consumer.includes(projectType);
}

function resolveStrategy(projectType: ProjectType): ResponsiveArchitecture['strategy'] {
  const desktopFirst: ProjectType[] = ['AdminPanel', 'ERP', 'Analytics', 'InternalTool', 'EnterprisePlatform'];
  if (desktopFirst.includes(projectType)) return 'desktop-first';
  return 'adaptive';
}
