import type { ComponentDef, ComponentCategory, Industry, ComponentStyle, SelectorInput, PageLayout } from './types';
import { getAllComponents, getComponentsByCategory } from './registry';

const INDUSTRY_KEYWORDS: Record<Industry, string[]> = {
  saas:        ['saas', 'software', 'platform', 'tool', 'app', 'subscription', 'cloud', 'api'],
  ai:          ['ai', 'artificial intelligence', 'machine learning', 'gpt', 'neural', 'chatbot', 'automation'],
  startup:     ['startup', 'launch', 'mvp', 'product', 'founder', 'venture'],
  ecommerce:   ['shop', 'store', 'ecommerce', 'sell', 'product', 'buy', 'cart', 'merchandise', 'goods'],
  restaurant:  ['restaurant', 'food', 'cafe', 'menu', 'dining', 'eat', 'chef', 'kitchen', 'delivery'],
  portfolio:   ['portfolio', 'personal', 'freelance', 'showcase', 'work', 'cv', 'resume', 'creative'],
  agency:      ['agency', 'studio', 'creative', 'design', 'marketing', 'branding', 'consulting'],
  fintech:     ['fintech', 'finance', 'bank', 'payment', 'crypto', 'trading', 'invest', 'money'],
  healthcare:  ['health', 'medical', 'clinic', 'doctor', 'hospital', 'wellness', 'therapy'],
  education:   ['education', 'course', 'learning', 'school', 'university', 'teach', 'tutor', 'training'],
  fitness:     ['fitness', 'gym', 'workout', 'yoga', 'sport', 'nutrition', 'trainer'],
  'real-estate': ['real estate', 'property', 'home', 'house', 'rent', 'buy', 'agent', 'listing'],
  generic:     [],
};

const STYLE_KEYWORDS: Record<ComponentStyle, string[]> = {
  modern:        ['modern', 'clean', 'professional', 'tech', 'sleek'],
  minimal:       ['minimal', 'simple', 'clean', 'light', 'bare', 'elegant'],
  bold:          ['bold', 'strong', 'powerful', 'impact', 'dramatic'],
  elegant:       ['elegant', 'luxury', 'premium', 'sophisticated', 'refined'],
  glassmorphism: ['glass', 'blur', 'frosted', 'transparent', 'dark'],
  playful:       ['fun', 'playful', 'colorful', 'vibrant', 'friendly', 'kids'],
  corporate:     ['corporate', 'enterprise', 'business', 'formal', 'b2b'],
};

function detectIndustries(prompt: string): Industry[] {
  const lower = prompt.toLowerCase();
  const matched: Industry[] = [];
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS) as [Industry, string[]][]) {
    if (keywords.some(kw => lower.includes(kw))) {
      matched.push(industry);
    }
  }
  return matched.length > 0 ? matched : ['generic'];
}

function detectStyle(prompt: string): ComponentStyle {
  const lower = prompt.toLowerCase();
  for (const [style, keywords] of Object.entries(STYLE_KEYWORDS) as [ComponentStyle, string[]][]) {
    if (keywords.some(kw => lower.includes(kw))) {
      return style;
    }
  }
  return 'modern';
}

function detectNeedsPricing(prompt: string): boolean {
  const kw = ['pricing', 'plan', 'subscription', 'saas', 'cost', 'price', 'tier', 'paid'];
  return kw.some(k => prompt.toLowerCase().includes(k));
}

function detectNeedsGallery(prompt: string): boolean {
  const kw = ['portfolio', 'gallery', 'work', 'showcase', 'photos', 'images', 'projects'];
  return kw.some(k => prompt.toLowerCase().includes(k));
}

function detectNeedsFaq(prompt: string): boolean {
  const kw = ['faq', 'question', 'help', 'support', 'how', 'saas', 'startup'];
  return kw.some(k => prompt.toLowerCase().includes(k));
}

function detectNeedsContact(prompt: string): boolean {
  const kw = ['contact', 'agency', 'studio', 'portfolio', 'business', 'restaurant', 'get in touch'];
  return kw.some(k => prompt.toLowerCase().includes(k));
}

function scoreComponent(component: ComponentDef, industries: Industry[], style: ComponentStyle): number {
  let score = component.priority;
  const industryMatch = component.industries.filter(i => industries.includes(i)).length;
  score += industryMatch * 3;
  if (component.style === style) score += 2;
  if (component.industries.includes('generic')) score += 0.5;
  return score;
}

function getBestComponent(category: ComponentCategory, industries: Industry[], style: ComponentStyle): ComponentDef {
  const candidates = getComponentsByCategory(category);
  if (candidates.length === 0) throw new Error(`No components for category: ${category}`);
  return candidates.reduce((best, c) =>
    scoreComponent(c, industries, style) > scoreComponent(best, industries, style) ? c : best
  );
}

export function selectComponents(input: SelectorInput): { layout: PageLayout; components: ComponentDef[] } {
  const { prompt } = input;
  const industries = input.industries || detectIndustries(prompt);
  const style = input.style || detectStyle(prompt);

  const requiredCategories: ComponentCategory[] = ['navbar', 'hero', 'features', 'testimonials', 'cta', 'footer'];
  const optionalCategories: ComponentCategory[] = [];

  if (detectNeedsPricing(prompt))  optionalCategories.push('pricing');
  if (detectNeedsGallery(prompt))  optionalCategories.push('gallery');
  if (detectNeedsFaq(prompt))      optionalCategories.push('faq');
  if (detectNeedsContact(prompt))  optionalCategories.push('contact');

  const selectedComponents: ComponentDef[] = [];
  const sectionIds: string[] = [];

  const navbar = getBestComponent('navbar', industries, style);
  selectedComponents.push(navbar);

  const hero = getBestComponent('hero', industries, style);
  selectedComponents.push(hero);
  sectionIds.push(hero.id);

  const features = getBestComponent('features', industries, style);
  selectedComponents.push(features);
  sectionIds.push(features.id);

  if (optionalCategories.includes('pricing')) {
    const pricing = getBestComponent('pricing', industries, style);
    selectedComponents.push(pricing);
    sectionIds.push(pricing.id);
  }

  if (optionalCategories.includes('gallery')) {
    const gallery = getBestComponent('gallery', industries, style);
    selectedComponents.push(gallery);
    sectionIds.push(gallery.id);
  }

  const testimonials = getBestComponent('testimonials', industries, style);
  selectedComponents.push(testimonials);
  sectionIds.push(testimonials.id);

  if (optionalCategories.includes('faq')) {
    const faq = getBestComponent('faq', industries, style);
    selectedComponents.push(faq);
    sectionIds.push(faq.id);
  }

  if (optionalCategories.includes('contact')) {
    const contact = getBestComponent('contact', industries, style);
    selectedComponents.push(contact);
    sectionIds.push(contact.id);
  }

  const cta = getBestComponent('cta', industries, style);
  selectedComponents.push(cta);
  sectionIds.push(cta.id);

  const footer = getBestComponent('footer', industries, style);
  selectedComponents.push(footer);

  const layout: PageLayout = {
    navbar: navbar.id,
    sections: sectionIds,
    footer: footer.id,
  };

  return { layout, components: selectedComponents };
}

export function getSelectionSummary(components: ComponentDef[]): string {
  return components.map(c => `${c.name} (${c.id})`).join('\n');
}
