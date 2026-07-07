// ── V8.5 Frontend Architect — SEO Architecture ───────────────────────────────

import type { ProjectType, SeoArchitecture } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planSeoArchitecture(
  projectType: ProjectType,
  features: ProductFeature[],
  prompt: string,
): SeoArchitecture {
  const strategy = resolveSeoStrategy(projectType, prompt);
  const isFull = strategy === 'full';
  const isBasic = strategy !== 'none';

  return {
    hasMetadata:       isBasic,
    hasOpenGraph:      isFull,
    hasTwitterCards:   isFull,
    hasCanonicalUrls:  isFull,
    hasStructuredData: isFull && (projectType === 'ECommerce' || projectType === 'Blog' || projectType === 'Booking'),
    hasSitemap:        isFull,
    hasRobots:         isFull,
    hasDynamicTitles:  isBasic,
    strategy,
  };
}

function resolveSeoStrategy(projectType: ProjectType, prompt: string): SeoArchitecture['strategy'] {
  // Private apps don't need SEO
  const privateTypes: ProjectType[] = ['AdminPanel', 'InternalTool', 'ChatApp'];
  if (privateTypes.includes(projectType)) return 'none';

  // Full SEO for public/content-driven apps
  const fullSeoTypes: ProjectType[] = ['LandingPage', 'Blog', 'ECommerce', 'Marketplace', 'Portfolio', 'Documentation', 'Education', 'Booking', 'Healthcare'];
  if (fullSeoTypes.includes(projectType) || /seo|search.*engine|google.*rank/i.test(prompt)) return 'full';

  // Basic SEO for SaaS / AI apps (marketing pages)
  return 'basic';
}
