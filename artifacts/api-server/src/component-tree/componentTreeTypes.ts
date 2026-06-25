// ── V7.3.2 Component Tree Types ───────────────────────────────────────────────
// Data model for the Component Tree Planning layer that sits between
// Architecture and Frontend generation.

export type SectionType =
  | 'hero' | 'features' | 'pricing' | 'cta' | 'testimonials' | 'faq'
  | 'navbar' | 'footer' | 'dashboard' | 'bento' | 'stats' | 'integrations'
  | 'timeline' | 'auth' | 'settings' | 'form' | 'unknown';

export type DNABrand =
  | 'stripe' | 'linear' | 'vercel' | 'notion' | 'framer' | 'cursor'
  | 'perplexity' | string;

export type AuthState = 'guest' | 'authenticated' | 'admin' | 'dashboard';

export type Industry =
  | 'saas' | 'healthcare' | 'ecommerce' | 'fintech' | 'education'
  | 'creative' | 'enterprise' | 'restaurant' | 'portfolio' | 'ai' | string;

// ── Individual component within a section ─────────────────────────────────────

export interface ComponentNode {
  id: string;
  name: string;
  type: 'component';
  parentId: string;
  sectionType: SectionType;
  required: boolean;
  priority: number;
  metadata: {
    shadcnComponents: string[];
    requiresTrustSignal: boolean;
    requiresCTA: boolean;
    dnaSpecific?: string;
    tokenTypography?: string;
    tokenColor?: string;
    tokenShadow?: string;
    tokenRadius?: string;
  };
}

// ── Section containing components ─────────────────────────────────────────────

export interface SectionNode {
  id: string;
  name: string;
  type: 'section';
  parentId: string;
  sectionType: SectionType;
  order: number;
  children: ComponentNode[];
  dna: DNABrand[];
  industry: Industry[];
  authState: AuthState[];
  required: boolean;
  priority: number;
  metadata: Record<string, unknown>;
}

// ── Root page tree ─────────────────────────────────────────────────────────────

export interface PageTree {
  id: string;
  name: string;
  sections: SectionNode[];
  metadata: TreeMetadata;
  statistics: TreeStatistics;
}

export interface TreeMetadata {
  buildId: string;
  generatedAt: number;
  industry: Industry;
  authState: AuthState;
  dnaWeights: Record<string, number>;
  websiteType: string;
  primaryDNA: string;
}

export interface TreeStatistics {
  sectionCount: number;
  totalNodes: number;
  maxDepth: number;
  componentNames: string[];
  requiredCount: number;
  optionalCount: number;
  shadcnComponentsUsed: string[];
}

// ── Tree validation ────────────────────────────────────────────────────────────

export interface TreeValidationError {
  type:
    | 'missing_dependency'
    | 'orphan_node'
    | 'duplicate_id'
    | 'invalid_hierarchy'
    | 'invalid_combination';
  nodeId: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface TreeValidationResult {
  valid: boolean;
  errors: TreeValidationError[];
  warnings: TreeValidationError[];
  score: number;
}

// ── Quality scoring ────────────────────────────────────────────────────────────

export interface TreeQualityDimensions {
  hierarchyScore:   number;
  reuseScore:       number;
  dependencyScore:  number;
  consistencyScore: number;
  completenessScore: number;
  overallScore:     number;
}
