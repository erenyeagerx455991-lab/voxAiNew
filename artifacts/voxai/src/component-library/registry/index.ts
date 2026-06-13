import type { ComponentDef, ComponentCategory, ComponentStyle, Industry, RegistryStats } from '../types';
import { navbarComponents } from './navbar';
import { heroComponents } from './hero';
import { featuresComponents } from './features';
import { pricingComponents } from './pricing';
import { testimonialsComponents } from './testimonials';
import { ctaComponents } from './cta';
import { footerComponents } from './footer';
import { galleryComponents } from './gallery';
import { faqComponents } from './faq';
import { contactComponents } from './contact';
import { allPremiumComponents } from './premium';

const ALL_COMPONENTS: ComponentDef[] = [
  ...navbarComponents,
  ...heroComponents,
  ...featuresComponents,
  ...pricingComponents,
  ...testimonialsComponents,
  ...ctaComponents,
  ...footerComponents,
  ...galleryComponents,
  ...faqComponents,
  ...contactComponents,
  ...allPremiumComponents,
];

export function getAllComponents(): ComponentDef[] {
  return ALL_COMPONENTS;
}

export function getComponentById(id: string): ComponentDef | undefined {
  return ALL_COMPONENTS.find(c => c.id === id);
}

export function getComponentsByCategory(category: ComponentCategory): ComponentDef[] {
  return ALL_COMPONENTS
    .filter(c => c.category === category)
    .sort((a, b) => b.priority - a.priority);
}

export function getComponentsByIndustry(industry: Industry): ComponentDef[] {
  return ALL_COMPONENTS
    .filter(c => c.industries.includes(industry))
    .sort((a, b) => b.priority - a.priority);
}

export function getComponentsByStyle(style: ComponentStyle): ComponentDef[] {
  return ALL_COMPONENTS
    .filter(c => c.style === style)
    .sort((a, b) => b.priority - a.priority);
}

export function searchComponents(query: string): ComponentDef[] {
  const q = query.toLowerCase();
  return ALL_COMPONENTS
    .filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q)) ||
      c.industries.some(i => i.toLowerCase().includes(q)) ||
      c.category.toLowerCase().includes(q)
    )
    .sort((a, b) => b.priority - a.priority);
}

export function getTopComponentPerCategory(): Record<ComponentCategory, ComponentDef> {
  const categories: ComponentCategory[] = [
    'navbar', 'hero', 'features', 'pricing',
    'testimonials', 'cta', 'footer', 'gallery', 'faq', 'contact', 'dashboard'
  ];
  return Object.fromEntries(
    categories
      .map(cat => [cat, getComponentsByCategory(cat)[0]])
      .filter(([, c]) => c !== undefined)
  ) as Record<ComponentCategory, ComponentDef>;
}

export function getRegistryStats(): RegistryStats {
  const categories: ComponentCategory[] = [
    'navbar', 'hero', 'features', 'pricing',
    'testimonials', 'cta', 'footer', 'gallery', 'faq', 'contact', 'dashboard'
  ];
  return {
    total: ALL_COMPONENTS.length,
    byCategory: Object.fromEntries(
      categories.map(cat => [cat, ALL_COMPONENTS.filter(c => c.category === cat).length])
    ) as Record<ComponentCategory, number>,
  };
}

export { ALL_COMPONENTS };
export type { ComponentDef };
