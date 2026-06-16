import type { ComponentRegistryItem } from '../types';

export const COMPONENT_CATALOG: ComponentRegistryItem[] = [
  // ── Heroes ──────────────────────────────────────────────────────────────
  {
    id: 'hero-linear', category: 'hero', name: 'HeroLinear',
    dnaTags: ['linear', 'minimal-flat', 'editorial', 'dark'],
    industryTags: ['saas', 'developer', 'productivity', 'startup'],
    sections: ['hero'], complexity: 'medium',
    references: ['linear.app'], componentPath: 'src/components/Hero.tsx',
  },
  {
    id: 'hero-stripe', category: 'hero', name: 'HeroStripe',
    dnaTags: ['stripe', 'premium-gradient', 'centered', 'dark'],
    industryTags: ['fintech', 'saas', 'payments', 'enterprise'],
    sections: ['hero'], complexity: 'high',
    references: ['stripe.com'], componentPath: 'src/components/Hero.tsx',
  },
  {
    id: 'hero-framer', category: 'hero', name: 'HeroFramer',
    dnaTags: ['framer', 'bold-motion', 'expressive', 'dark'],
    industryTags: ['creative', 'agency', 'design', 'portfolio'],
    sections: ['hero'], complexity: 'high',
    references: ['framer.com'], componentPath: 'src/components/Hero.tsx',
  },
  {
    id: 'hero-notion', category: 'hero', name: 'HeroNotion',
    dnaTags: ['notion', 'editorial', 'light', 'clean'],
    industryTags: ['productivity', 'docs', 'education', 'blog'],
    sections: ['hero'], complexity: 'low',
    references: ['notion.so'], componentPath: 'src/components/Hero.tsx',
  },
  {
    id: 'hero-vercel', category: 'hero', name: 'HeroVercel',
    dnaTags: ['vercel', 'monochrome', 'split-layout', 'dark'],
    industryTags: ['developer', 'devtools', 'cloud', 'infrastructure'],
    sections: ['hero'], complexity: 'medium',
    references: ['vercel.com'], componentPath: 'src/components/Hero.tsx',
  },
  {
    id: 'hero-minimal', category: 'hero', name: 'HeroMinimal',
    dnaTags: ['minimal', 'clean', 'centered', 'any'],
    industryTags: ['generic', 'portfolio', 'startup', 'saas'],
    sections: ['hero'], complexity: 'low',
    references: [], componentPath: 'src/components/Hero.tsx',
  },
  {
    id: 'hero-editorial', category: 'hero', name: 'HeroEditorial',
    dnaTags: ['editorial', 'large-type', 'magazine', 'bold'],
    industryTags: ['media', 'blog', 'fashion', 'luxury'],
    sections: ['hero'], complexity: 'medium',
    references: ['notion.so'], componentPath: 'src/components/Hero.tsx',
  },
  {
    id: 'hero-bento', category: 'hero', name: 'HeroBento',
    dnaTags: ['bento', 'grid', 'modern', 'dark'],
    industryTags: ['saas', 'ai', 'startup', 'developer'],
    sections: ['hero'], complexity: 'high',
    references: ['framer.com', 'linear.app'], componentPath: 'src/components/Hero.tsx',
  },

  // ── Pricing ─────────────────────────────────────────────────────────────
  {
    id: 'pricing-stripe', category: 'pricing', name: 'PricingStripe',
    dnaTags: ['stripe', 'premium-gradient', 'trust', 'enterprise'],
    industryTags: ['saas', 'fintech', 'payments', 'subscription'],
    sections: ['pricing'], complexity: 'high',
    references: ['stripe.com'], componentPath: 'src/components/Pricing.tsx',
  },
  {
    id: 'pricing-minimal', category: 'pricing', name: 'PricingMinimal',
    dnaTags: ['minimal', 'clean', 'dark', 'flat'],
    industryTags: ['saas', 'startup', 'developer', 'productivity'],
    sections: ['pricing'], complexity: 'low',
    references: ['linear.app'], componentPath: 'src/components/Pricing.tsx',
  },
  {
    id: 'pricing-enterprise', category: 'pricing', name: 'PricingEnterprise',
    dnaTags: ['enterprise', 'table', 'feature-comparison', 'trust'],
    industryTags: ['enterprise', 'b2b', 'crm', 'fintech'],
    sections: ['pricing'], complexity: 'high',
    references: ['stripe.com', 'vercel.com'], componentPath: 'src/components/Pricing.tsx',
  },
  {
    id: 'pricing-comparison', category: 'pricing', name: 'PricingComparison',
    dnaTags: ['comparison', 'table', 'feature-grid', 'trust'],
    industryTags: ['saas', 'b2b', 'enterprise', 'healthcare'],
    sections: ['pricing'], complexity: 'medium',
    references: [], componentPath: 'src/components/Pricing.tsx',
  },
  {
    id: 'pricing-cards', category: 'pricing', name: 'PricingCards',
    dnaTags: ['cards', 'modern', 'popular-badge', 'dark'],
    industryTags: ['saas', 'startup', 'ai', 'generic'],
    sections: ['pricing'], complexity: 'medium',
    references: [], componentPath: 'src/components/Pricing.tsx',
  },

  // ── Navbars ──────────────────────────────────────────────────────────────
  {
    id: 'navbar-minimal', category: 'navbar', name: 'NavbarMinimal',
    dnaTags: ['minimal', 'flat', 'dark', 'clean'],
    industryTags: ['saas', 'developer', 'startup', 'portfolio'],
    sections: ['navbar'], complexity: 'low',
    references: ['linear.app', 'vercel.com'], componentPath: 'src/components/Navbar.tsx',
  },
  {
    id: 'navbar-floating', category: 'navbar', name: 'NavbarFloating',
    dnaTags: ['floating', 'pill', 'blur-backdrop', 'dark'],
    industryTags: ['creative', 'agency', 'saas', 'startup'],
    sections: ['navbar'], complexity: 'medium',
    references: ['framer.com'], componentPath: 'src/components/Navbar.tsx',
  },
  {
    id: 'navbar-enterprise', category: 'navbar', name: 'NavbarEnterprise',
    dnaTags: ['enterprise', 'dropdown', 'mega-menu', 'trust'],
    industryTags: ['enterprise', 'b2b', 'fintech', 'healthcare'],
    sections: ['navbar'], complexity: 'high',
    references: ['stripe.com'], componentPath: 'src/components/Navbar.tsx',
  },
  {
    id: 'navbar-sidebar', category: 'navbar', name: 'NavbarSidebar',
    dnaTags: ['sidebar', 'app', 'dashboard', 'icon-nav'],
    industryTags: ['dashboard', 'crm', 'saas', 'app'],
    sections: ['navbar'], complexity: 'medium',
    references: ['linear.app'], componentPath: 'src/components/Navbar.tsx',
  },

  // ── Dashboards ───────────────────────────────────────────────────────────
  {
    id: 'dashboard-analytics', category: 'dashboard', name: 'DashboardAnalytics',
    dnaTags: ['analytics', 'charts', 'metrics', 'dark'],
    industryTags: ['saas', 'crm', 'fintech', 'ecommerce'],
    sections: ['dashboard'], complexity: 'high',
    references: ['linear.app'], componentPath: 'src/pages/Dashboard.tsx',
  },
  {
    id: 'dashboard-saas', category: 'dashboard', name: 'DashboardSaaS',
    dnaTags: ['saas', 'overview', 'stats', 'dark'],
    industryTags: ['saas', 'startup', 'developer', 'productivity'],
    sections: ['dashboard'], complexity: 'high',
    references: ['linear.app', 'vercel.com'], componentPath: 'src/pages/Dashboard.tsx',
  },
  {
    id: 'dashboard-finance', category: 'dashboard', name: 'DashboardFinance',
    dnaTags: ['finance', 'charts', 'portfolio', 'premium'],
    industryTags: ['fintech', 'banking', 'trading', 'insurance'],
    sections: ['dashboard'], complexity: 'high',
    references: ['stripe.com'], componentPath: 'src/pages/Dashboard.tsx',
  },
  {
    id: 'dashboard-crm', category: 'dashboard', name: 'DashboardCRM',
    dnaTags: ['crm', 'list', 'kanban', 'pipeline'],
    industryTags: ['crm', 'b2b', 'sales', 'agency'],
    sections: ['dashboard'], complexity: 'high',
    references: [], componentPath: 'src/pages/Dashboard.tsx',
  },
  {
    id: 'dashboard-ai', category: 'dashboard', name: 'DashboardAI',
    dnaTags: ['ai', 'chat', 'prompts', 'dark'],
    industryTags: ['ai', 'developer', 'startup', 'productivity'],
    sections: ['dashboard'], complexity: 'high',
    references: ['cursor.sh'], componentPath: 'src/pages/Dashboard.tsx',
  },

  // ── Features ─────────────────────────────────────────────────────────────
  {
    id: 'features-grid', category: 'features', name: 'FeaturesGrid',
    dnaTags: ['grid', 'cards', 'icon', 'structured'],
    industryTags: ['saas', 'startup', 'generic', 'developer'],
    sections: ['features'], complexity: 'low',
    references: [], componentPath: 'src/components/Features.tsx',
  },
  {
    id: 'features-bento', category: 'features', name: 'FeaturesBento',
    dnaTags: ['bento', 'asymmetric', 'dark', 'modern'],
    industryTags: ['saas', 'ai', 'startup', 'creative'],
    sections: ['features'], complexity: 'high',
    references: ['framer.com', 'linear.app'], componentPath: 'src/components/Features.tsx',
  },
  {
    id: 'features-timeline', category: 'features', name: 'FeaturesTimeline',
    dnaTags: ['timeline', 'vertical', 'editorial', 'steps'],
    industryTags: ['agency', 'startup', 'education', 'blog'],
    sections: ['features'], complexity: 'medium',
    references: ['notion.so'], componentPath: 'src/components/Features.tsx',
  },
  {
    id: 'features-cards', category: 'features', name: 'FeaturesCards',
    dnaTags: ['cards', 'hover', 'icon', 'clean'],
    industryTags: ['saas', 'startup', 'ai', 'generic'],
    sections: ['features'], complexity: 'medium',
    references: [], componentPath: 'src/components/Features.tsx',
  },

  // ── FAQ ──────────────────────────────────────────────────────────────────
  {
    id: 'faq-accordion', category: 'faq', name: 'FaqAccordion',
    dnaTags: ['accordion', 'clean', 'minimal', 'dark'],
    industryTags: ['saas', 'startup', 'generic', 'ecommerce'],
    sections: ['faq'], complexity: 'low',
    references: ['stripe.com'], componentPath: 'src/components/FAQ.tsx',
  },
  {
    id: 'faq-minimal', category: 'faq', name: 'FaqMinimal',
    dnaTags: ['minimal', 'editorial', 'clean', 'light'],
    industryTags: ['startup', 'portfolio', 'generic', 'education'],
    sections: ['faq'], complexity: 'low',
    references: ['notion.so'], componentPath: 'src/components/FAQ.tsx',
  },
  {
    id: 'faq-enterprise', category: 'faq', name: 'FaqEnterprise',
    dnaTags: ['enterprise', 'categories', 'search', 'structured'],
    industryTags: ['enterprise', 'b2b', 'fintech', 'healthcare'],
    sections: ['faq'], complexity: 'medium',
    references: ['stripe.com'], componentPath: 'src/components/FAQ.tsx',
  },

  // ── Testimonials ─────────────────────────────────────────────────────────
  {
    id: 'testimonials-cards', category: 'testimonials', name: 'TestimonialsCards',
    dnaTags: ['cards', 'avatar', 'stars', 'dark'],
    industryTags: ['saas', 'ecommerce', 'generic', 'startup'],
    sections: ['testimonials'], complexity: 'medium',
    references: [], componentPath: 'src/components/Testimonials.tsx',
  },
  {
    id: 'testimonials-wall', category: 'testimonials', name: 'TestimonialsWall',
    dnaTags: ['masonry', 'wall', 'grid', 'modern'],
    industryTags: ['saas', 'ai', 'startup', 'ecommerce'],
    sections: ['testimonials'], complexity: 'high',
    references: ['framer.com'], componentPath: 'src/components/Testimonials.tsx',
  },
  {
    id: 'testimonials-featured', category: 'testimonials', name: 'TestimonialsFeatured',
    dnaTags: ['featured', 'large-quote', 'editorial', 'minimal'],
    industryTags: ['agency', 'enterprise', 'luxury', 'portfolio'],
    sections: ['testimonials'], complexity: 'low',
    references: ['linear.app'], componentPath: 'src/components/Testimonials.tsx',
  },

  // ── CTA ──────────────────────────────────────────────────────────────────
  {
    id: 'cta-stripe', category: 'cta', name: 'CtaStripe',
    dnaTags: ['stripe', 'gradient', 'premium', 'trust'],
    industryTags: ['saas', 'fintech', 'payments', 'startup'],
    sections: ['cta'], complexity: 'medium',
    references: ['stripe.com'], componentPath: 'src/components/CTA.tsx',
  },
  {
    id: 'cta-minimal', category: 'cta', name: 'CtaMinimal',
    dnaTags: ['minimal', 'clean', 'flat', 'centered'],
    industryTags: ['startup', 'portfolio', 'generic', 'developer'],
    sections: ['cta'], complexity: 'low',
    references: ['linear.app', 'vercel.com'], componentPath: 'src/components/CTA.tsx',
  },
  {
    id: 'cta-gradient', category: 'cta', name: 'CtaGradient',
    dnaTags: ['gradient', 'animated', 'bold', 'expressive'],
    industryTags: ['creative', 'agency', 'ai', 'startup'],
    sections: ['cta'], complexity: 'medium',
    references: ['framer.com'], componentPath: 'src/components/CTA.tsx',
  },

  // ── Footers ──────────────────────────────────────────────────────────────
  {
    id: 'footer-simple', category: 'footer', name: 'FooterSimple',
    dnaTags: ['minimal', 'clean', 'dark', 'flat'],
    industryTags: ['generic', 'startup', 'portfolio', 'developer'],
    sections: ['footer'], complexity: 'low',
    references: ['linear.app', 'vercel.com'], componentPath: 'src/components/Footer.tsx',
  },
  {
    id: 'footer-enterprise', category: 'footer', name: 'FooterEnterprise',
    dnaTags: ['enterprise', 'multi-column', 'links', 'trust'],
    industryTags: ['enterprise', 'b2b', 'saas', 'fintech'],
    sections: ['footer'], complexity: 'medium',
    references: ['stripe.com'], componentPath: 'src/components/Footer.tsx',
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  {
    id: 'auth-login', category: 'auth', name: 'LoginModern',
    dnaTags: ['login', 'centered', 'clean', 'dark'],
    industryTags: ['saas', 'crm', 'dashboard', 'generic'],
    sections: ['auth'], complexity: 'medium',
    references: ['linear.app', 'vercel.com'], componentPath: 'src/pages/Login.tsx',
  },
  {
    id: 'auth-signup', category: 'auth', name: 'SignupModern',
    dnaTags: ['signup', 'centered', 'clean', 'dark'],
    industryTags: ['saas', 'crm', 'dashboard', 'generic'],
    sections: ['auth'], complexity: 'medium',
    references: ['linear.app', 'vercel.com'], componentPath: 'src/pages/Signup.tsx',
  },
];

export function getCatalogByCategory(cat: string): ComponentRegistryItem[] {
  return COMPONENT_CATALOG.filter(c => c.category === cat);
}

export function getCatalogItem(name: string): ComponentRegistryItem | undefined {
  return COMPONENT_CATALOG.find(c => c.name === name);
}

export const REGISTRY_STYLE_HINTS: Record<string, string> = {
  HeroLinear:            'oversized editorial typography, left-aligned, dark minimal, NO decoration',
  HeroStripe:            'centered gradient hero, radial glow orbs, premium dark navy, bold CTA',
  HeroFramer:            'dramatic oversized text, expressive animations, bold accent colors, dark',
  HeroNotion:            'clean editorial, light theme, simple centered copy, minimal decoration',
  HeroVercel:            'split layout, monochrome black/white, strong left text + right visual',
  HeroMinimal:           'clean centered layout, strong typography, subtle hover only',
  HeroEditorial:         'magazine-style, huge type fills the viewport, editorial whitespace',
  HeroBento:             'bento grid hero with feature tiles, dark, modern asymmetric layout',
  PricingStripe:         '3 tiers with gradient-border cards, popular badge, trust signals, dark navy',
  PricingMinimal:        'flat 3-column minimal cards, simple border, clean dark background',
  PricingEnterprise:     'feature comparison table, check marks, enterprise tier highlighted',
  PricingComparison:     'side-by-side comparison grid with feature rows and plan columns',
  PricingCards:          'elevated cards with popular glow, icon features, gradient CTA button',
  NavbarMinimal:         'sticky minimal bar, logo + 4-5 ghost links + CTA button, dark',
  NavbarFloating:        'floating pill navbar centered, blur backdrop, ghost links, scrolls smoothly',
  NavbarEnterprise:      'full-width with logo, mega-menu dropdowns, announcement bar, dark',
  NavbarSidebar:         'left sidebar with icon + label nav, dark, collapsible on mobile',
  DashboardAnalytics:    'KPI stat cards row, line + bar charts, data table, dark sidebar',
  DashboardSaaS:         'overview stats, recent activity feed, quick actions, dark sidebar',
  DashboardFinance:      'portfolio chart, asset allocation, transaction list, premium dark',
  DashboardCRM:          'deal pipeline kanban, contact list, activity timeline, dark sidebar',
  DashboardAI:           'chat interface, prompt history, model selector, dark terminal feel',
  FeaturesGrid:          '3-column icon + title + description cards, flat-bordered, dark',
  FeaturesBento:         'asymmetric bento grid, large feature card + small tiles, dark',
  FeaturesTimeline:      'vertical timeline with numbered steps, icon badges, editorial',
  FeaturesCards:         'hover-lift cards with gradient icons, 2-3 column grid, dark',
  FaqAccordion:          'clean accordion with + icon, flat borders, minimal dark',
  FaqMinimal:            'question/answer pairs, editorial typography, light or dark',
  FaqEnterprise:         'category tabs + accordion, search input, multi-column, dark',
  TestimonialsCards:     '3-column quote cards, avatar, star rating, flat-bordered dark',
  TestimonialsWall:      'masonry grid of testimonial tiles, varied sizes, dark',
  TestimonialsFeatured:  'one large featured quote, customer photo, company logo, minimal',
  CtaStripe:             'gradient CTA banner, two buttons (primary + outline), trust line',
  CtaMinimal:            'centered minimal CTA, one headline, one button, flat dark',
  CtaGradient:           'animated gradient background, bold headline, glowing button',
  FooterSimple:          'single-row logo + links + copyright, minimal dark',
  FooterEnterprise:      '4-column footer with link groups, social icons, newsletter form',
  LoginModern:           'centered auth card, email/password fields, OAuth buttons, dark',
  SignupModern:          'centered signup card, name/email/password, terms, OAuth, dark',
};
