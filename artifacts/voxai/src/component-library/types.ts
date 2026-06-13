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
  | 'education' | 'fitness' | 'real-estate' | 'generic';

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
  priority: number; // 1-10, higher = prefer in selection
}

export interface ComponentDef extends ComponentMeta {
  standaloneCode: string; // iframe-ready JSX (no imports, React.* namespace)
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
