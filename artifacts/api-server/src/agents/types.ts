export interface PageBlueprint {
  websiteType: string;
  sectionOrder: string[];
}

export interface ProjectBlueprint {
  projectType: string;
  pages: string[];
  components: string[];
  databaseTables: string[];
  apis: string[];
  authNeeded: boolean;
  authProvider: string;
  dashboardNeeded: boolean;
  entities: string[];
  relationships: string[];
  navigation: string[];
  features: string[];
  techStack: {
    frontend: string;
    routing: string;
    ui: string;
    backend: string;
    database: string;
  };
  description: string;
  dependencies?: string[];
}

export interface DesignDNA {
  designLanguage: string;
  layoutStyle: string;
  typographySystem: {
    headingWeight: string;
    headingTracking: string;
    scale: string;
    fontFamily: string;
  };
  spacingSystem: {
    density: string;
    sectionPadding: string;
    componentGap: string;
  };
  colorSystem: {
    theme: string;
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textMuted: string;
    border: string;
  };
  animationPersonality: string;
  decorationLevel: string;
  componentPreferences: string[];
  heroStyle: string;
  cardStyle: string;
  visualDensity: string;
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  bgGradient: string;
  headingGradient: string;
  buttonStyle: string;
  buttonColors: string;
  cardStyleTokens: string;
  mood: string;
}

export interface OpenRouterError extends Error {
  status?: number;
  requestId?: string;
  model?: string;
  body?: string;
}

export interface QualityGateResult {
  score: number;
  passed: boolean;
  issues: string[];
}

export interface BlueprintValidation {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

export interface ExtractedFile {
  path: string;
  name: string;
  content: string;
}

export interface ProjectFileSSE {
  path: string;
  name: string;
  lang: string;
  content: string;
}

export interface TsxValidation {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

export interface RuntimeValidationIssue {
  file: string;
  severity: 'error' | 'warning';
  type: 'unsafe_array' | 'invalid_hook' | 'missing_null_guard' | 'route_mismatch' | 'missing_import' | 'undefined_state';
  message: string;
}

export interface RuntimeValidationResult {
  issues: RuntimeValidationIssue[];
  runtimeScore: number;
  filesValidated: number;
  runtimeErrors: number;
}

export interface KGComponent {
  name: string;
  file: string;
  usedBy: string[];
  section?: string;
}

export interface KGPage {
  name: string;
  path: string;
  route?: string;
  components: string[];
}

export interface KGApi {
  name: string;
  file: string;
  methods?: string[];
}

export interface KGDbTable {
  name: string;
  relationships: string[];
}

export interface ServerKnowledgeGraph {
  projectType: string;
  generatedAt: number;
  pages: KGPage[];
  components: KGComponent[];
  apis: KGApi[];
  databaseTables: KGDbTable[];
  routes: string[];
  dependencies: string[];
  graphHealthScore: number;
  editContextHint?: string;
}

export interface ServerEditTargetResult {
  targetFiles: ProjectFileSSE[];
  graphNodes: string[];
  resolved: boolean;
  filesLoaded: number;
  filesSkipped: number;
  tokensSaved: number;
}

export interface DNAComposition {
  stripe: number;
  linear: number;
  framer: number;
  vercel: number;
  notion: number;
  cursor: number;
  raycast: number;
}
