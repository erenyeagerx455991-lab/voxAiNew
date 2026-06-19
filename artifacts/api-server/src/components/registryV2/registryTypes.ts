export type ComponentStyle =
  | "modern" | "minimal" | "editorial" | "bold" | "elegant"
  | "glassmorphism" | "gradient" | "flat" | "neumorphic" | "brutalist";

export type ComponentIndustry =
  | "saas" | "ai" | "startup" | "ecommerce" | "restaurant"
  | "portfolio" | "agency" | "fintech" | "healthcare" | "education"
  | "fitness" | "generic";

export type ComponentCategory =
  | "navbar" | "hero" | "features" | "pricing"
  | "testimonials" | "cta" | "footer" | "gallery" | "faq" | "contact"
  | "logo-cloud" | "bento" | "dashboard-preview"
  | "menu-section" | "chef-story" | "reservation"
  | "projects" | "case-studies";

export type ConversionGoal =
  | "signup" | "purchase" | "contact" | "demo" | "download" | "awareness";

export type ComplexityLevel = "low" | "medium" | "high";

export interface ComponentMetadataV2 {
  id: string;
  name: string;
  category: ComponentCategory;
  tags: string[];
  industry: ComponentIndustry[];
  style: ComponentStyle[];
  complexity: ComplexityLevel;
  conversionGoal: ConversionGoal[];
  keywords: string[];
  description: string;
  priority: number;
}

export interface RetrievalIntent {
  industry: ComponentIndustry[];
  style: ComponentStyle[];
  pageType: string;
  keywords: string[];
  sections: ComponentCategory[];
  conversionGoal: ConversionGoal[];
}

export interface ScoredComponent {
  id: string;
  category: ComponentCategory;
  score: number;
  description: string;
  name: string;
  matchReasons: string[];
}

export interface RetrievalResult {
  components: ScoredComponent[];
  intent: RetrievalIntent;
  retrievalMs: number;
  cacheHit: boolean;
  promptTokenEstimate: number;
}
