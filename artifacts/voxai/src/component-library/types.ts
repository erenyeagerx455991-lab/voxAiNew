export type ComponentCategory =
  | 'navbar' | 'hero' | 'features' | 'pricing'
  | 'testimonials' | 'cta' | 'footer' | 'gallery'
  | 'faq' | 'contact' | 'dashboard';

export type ComponentStyle =
  | 'modern' | 'minimal' | 'bold' | 'elegant'
  | 'glassmorphism' | 'playful' | 'corporate';

export type Industry =
  | 'saas' | 'ai' | 'startup' | 'ecommerce' | 'restaurant'
  | 'portfolio' | 'agency' | 'fintech' | 'healthcare'
  | 'education' | 'fitness' | 'real-estate' | 'generic'
  | 'developer' | 'productivity' | 'enterprise' | 'design'
  | 'media' | 'business' | 'global';

export type ThemeMode = 'dark' | 'light' | 'both';

export interface ComponentMeta {
  id: string;
  name: string;
  category: ComponentCategory;
  style: ComponentStyle;
  theme: ThemeMode;
  industries: Industry[];
  tags: string[];
  description: string;
  priority: number;
}

export interface ComponentDef extends ComponentMeta {
  standaloneCode: string;
}

export interface PageLayout {
  navbar: string;
  sections: string[];
  footer: string;
}

export interface SelectionResult {
  layout: PageLayout;
  components: ComponentDef[];
  assembledCode: string;
}

export interface SelectorInput {
  prompt: string;
  style?: ComponentStyle;
  theme?: ThemeMode;
  industries?: Industry[];
}

export interface RegistryStats {
  total: number;
  byCategory: Record<ComponentCategory, number>;
}

// ── V5.4 Component Registry Types ──────────────────────────────────────────

export type RegistryCategory =
  | 'hero' | 'pricing' | 'navbar' | 'dashboard'
  | 'features' | 'faq' | 'testimonials' | 'cta'
  | 'footer' | 'auth';

export interface ComponentRegistryItem {
  id: string;
  category: RegistryCategory;
  name: string;
  dnaTags: string[];
  industryTags: string[];
  sections: string[];
  complexity: 'low' | 'medium' | 'high';
  references: string[];
  componentPath: string;
  previewImage?: string;
}
