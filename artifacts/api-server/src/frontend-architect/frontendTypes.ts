// ── V8.5 Autonomous Frontend Architect — Type System ──────────────────────────

// ── Project Classification (24 types) ────────────────────────────────────────

export type ProjectType =
  | 'LandingPage'      | 'Dashboard'        | 'AdminPanel'       | 'Marketplace'
  | 'Portfolio'        | 'SaaS'             | 'CRM'              | 'ERP'
  | 'Analytics'        | 'Documentation'    | 'AIApplication'    | 'ECommerce'
  | 'Healthcare'       | 'Finance'          | 'Education'        | 'Booking'
  | 'SocialPlatform'   | 'DeveloperTool'    | 'CMS'              | 'Blog'
  | 'ChatApp'          | 'Productivity'     | 'InternalTool'     | 'EnterprisePlatform';

export const ALL_PROJECT_TYPES: ProjectType[] = [
  'LandingPage', 'Dashboard', 'AdminPanel', 'Marketplace', 'Portfolio', 'SaaS',
  'CRM', 'ERP', 'Analytics', 'Documentation', 'AIApplication', 'ECommerce',
  'Healthcare', 'Finance', 'Education', 'Booking', 'SocialPlatform', 'DeveloperTool',
  'CMS', 'Blog', 'ChatApp', 'Productivity', 'InternalTool', 'EnterprisePlatform',
];

// ── Route types ────────────────────────────────────────────────────────────────

export type RouteType = 'public' | 'protected' | 'admin' | 'auth' | 'dynamic' | 'catch' | 'loading';

export interface RouteDefinition {
  path:       string;
  type:       RouteType;
  layout:     string;
  component:  string;
  lazy:       boolean;
  children?:  RouteDefinition[];
}

export interface RoutingArchitecture {
  strategy:      'ReactRouter' | 'NestedRoutes' | 'FileBasedRouting';
  publicRoutes:  RouteDefinition[];
  protectedRoutes: RouteDefinition[];
  adminRoutes:   RouteDefinition[];
  authRoutes:    RouteDefinition[];
  catchRoute:    RouteDefinition;
  hasNestedRoutes: boolean;
  hasDynamicRoutes: boolean;
  routeCount:    number;
}

// ── Layout types ──────────────────────────────────────────────────────────────

export type LayoutType =
  | 'MainLayout'      | 'DashboardLayout' | 'AdminLayout'    | 'SettingsLayout'
  | 'AuthLayout'      | 'MarketingLayout' | 'DocsLayout'     | 'WorkspaceLayout'
  | 'ErrorLayout'     | 'LoadingLayout'   | 'BlankLayout';

export interface LayoutDefinition {
  name:        LayoutType;
  hasNavbar:   boolean;
  hasSidebar:  boolean;
  hasFooter:   boolean;
  pages:       string[];
}

export interface LayoutArchitecture {
  layouts:     LayoutDefinition[];
  defaultLayout: LayoutType;
  authLayout:  LayoutType;
  errorLayout: LayoutType;
}

// ── Component Ownership ───────────────────────────────────────────────────────

export type ComponentOwnershipLevel =
  | 'Shared' | 'Page' | 'Feature' | 'UI' | 'Business' | 'Layout' | 'Modal' | 'Form' | 'Chart' | 'Navigation';

export interface ComponentGroup {
  level:      ComponentOwnershipLevel;
  examples:   string[];
  path:       string;
  reusable:   boolean;
}

export interface ComponentOwnership {
  groups:     ComponentGroup[];
  sharedCount: number;
  totalEstimate: number;
}

// ── Folder Structure ──────────────────────────────────────────────────────────

export interface FolderStructure {
  root:        string;
  directories: string[];
  keyFiles:    string[];
  pattern:     'feature-first' | 'layer-first' | 'hybrid';
}

// ── State Architecture ────────────────────────────────────────────────────────

export type StateStrategy = 'ReactState' | 'Context' | 'Redux' | 'Zustand' | 'ServerState' | 'ReactQuery' | 'Jotai';

export interface StateLayer {
  name:        string;
  strategy:    StateStrategy;
  scope:       'local' | 'feature' | 'global';
  reason:      string;
}

export interface StateArchitecture {
  layers:          StateLayer[];
  primaryStrategy: StateStrategy;
  hasServerState:  boolean;
  hasCacheState:   boolean;
  hasFormState:    boolean;
  hasAuthState:    boolean;
  complexity:      'Low' | 'Medium' | 'High';
}

// ── Theme Architecture ────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'auto' | 'brand' | 'dashboard' | 'enterprise';

export interface ThemeArchitecture {
  modes:           ThemeMode[];
  defaultMode:     ThemeMode;
  runtimeSwitching: boolean;
  tokenSystem:     boolean;
  cssVariables:    boolean;
  hasDarkMode:     boolean;
}

// ── API Architecture ──────────────────────────────────────────────────────────

export type ApiPattern = 'REST' | 'GraphQL' | 'ServerActions' | 'tRPC';
export type CachingStrategy = 'none' | 'stale-while-revalidate' | 'cache-first' | 'network-first';

export interface ApiArchitecture {
  pattern:          ApiPattern;
  cachingStrategy:  CachingStrategy;
  hasOptimisticUpdates: boolean;
  hasRetry:         boolean;
  hasPagination:    boolean;
  hasInfiniteScroll: boolean;
  hasSearch:        boolean;
  hasFiltering:     boolean;
  hasSorting:       boolean;
  queryBoundaries:  string[];
  mutationBoundaries: string[];
}

// ── Auth Architecture ─────────────────────────────────────────────────────────

export type AuthStrategy = 'None' | 'JWT' | 'Session' | 'OAuth' | 'Magic' | 'Passkey';

export interface AuthArchitecture {
  strategy:         AuthStrategy;
  roles:            string[];
  hasRefreshFlow:   boolean;
  hasProtectedPages: boolean;
  hasGuestMode:     boolean;
  hasMultiTenant:   boolean;
  sessionStrategy:  'cookie' | 'localStorage' | 'memory' | 'none';
}

// ── Permission Architecture ───────────────────────────────────────────────────

export interface PermissionArchitecture {
  model:       'None' | 'RBAC' | 'ABAC' | 'ACL';
  roles:       string[];
  hasRouteGuards: boolean;
  hasComponentGuards: boolean;
  hasApiGuards: boolean;
}

// ── Responsive Architecture ───────────────────────────────────────────────────

export interface ResponsiveArchitecture {
  breakpoints:       string[];
  mobileFirst:       boolean;
  hasDrawerNav:      boolean;
  hasSidebarCollapse: boolean;
  hasBottomNav:      boolean;
  strategy:          'mobile-first' | 'desktop-first' | 'adaptive';
}

// ── Performance Architecture ──────────────────────────────────────────────────

export interface PerformanceArchitecture {
  hasLazyLoading:    boolean;
  hasRouteSplitting: boolean;
  hasMemoization:    boolean;
  hasVirtualization: boolean;
  hasSuspense:       boolean;
  hasImageOptimization: boolean;
  bundleStrategy:    'minimal' | 'balanced' | 'aggressive';
  estimatedBundleSize: 'small' | 'medium' | 'large';
}

// ── Loading Architecture ──────────────────────────────────────────────────────

export interface LoadingArchitecture {
  hasSkeletons:      boolean;
  hasProgressBars:   boolean;
  hasOptimisticUI:   boolean;
  hasEmptyStates:    boolean;
  hasLoadingIndicators: boolean;
  hasStreaming:      boolean;
  hasPartialRendering: boolean;
}

// ── Accessibility Architecture ────────────────────────────────────────────────

export interface AccessibilityArchitecture {
  hasKeyboardNav:    boolean;
  hasFocusManagement: boolean;
  hasARIA:           boolean;
  hasColorContrast:  boolean;
  hasReducedMotion:  boolean;
  hasSemanticHTML:   boolean;
  hasScreenReaders:  boolean;
  hasErrorAnnouncements: boolean;
  hasSkipLinks:      boolean;
  level:             'A' | 'AA' | 'AAA';
}

// ── SEO Architecture ─────────────────────────────────────────────────────────

export interface SeoArchitecture {
  hasMetadata:       boolean;
  hasOpenGraph:      boolean;
  hasTwitterCards:   boolean;
  hasCanonicalUrls:  boolean;
  hasStructuredData: boolean;
  hasSitemap:        boolean;
  hasRobots:         boolean;
  hasDynamicTitles:  boolean;
  strategy:          'none' | 'basic' | 'full';
}

// ── Error Architecture ────────────────────────────────────────────────────────

export interface ErrorArchitecture {
  hasErrorBoundaries: boolean;
  hasFallbackUI:     boolean;
  hasRetry:          boolean;
  hasRecovery:       boolean;
  hasOfflineState:   boolean;
  hasNetworkFailure: boolean;
  hasApiFailure:     boolean;
}

// ── Validation Scoring ────────────────────────────────────────────────────────

export type ArchitectureDimension =
  | 'routing'        | 'layouts'         | 'folderStructure' | 'componentOwnership'
  | 'state'          | 'performance'     | 'seo'             | 'accessibility'
  | 'scalability'    | 'maintainability' | 'reusability'     | 'developerExperience';

export const ALL_ARCHITECTURE_DIMENSIONS: ArchitectureDimension[] = [
  'routing', 'layouts', 'folderStructure', 'componentOwnership',
  'state', 'performance', 'seo', 'accessibility',
  'scalability', 'maintainability', 'reusability', 'developerExperience',
];

export interface ArchitectureScore {
  dimension:       ArchitectureDimension;
  score:           number;   // 0–10
  confidence:      number;   // 0–1
  recommendation:  string;
}

// ── Core Blueprint ────────────────────────────────────────────────────────────

export interface FrontendArchitectureBlueprint {
  projectType:             ProjectType;
  projectTypeConfidence:   number;
  routingArchitecture:     RoutingArchitecture;
  layoutArchitecture:      LayoutArchitecture;
  componentOwnership:      ComponentOwnership;
  folderStructure:         FolderStructure;
  stateArchitecture:       StateArchitecture;
  themeArchitecture:       ThemeArchitecture;
  apiArchitecture:         ApiArchitecture;
  authArchitecture:        AuthArchitecture;
  permissionArchitecture:  PermissionArchitecture;
  responsiveArchitecture:  ResponsiveArchitecture;
  performanceArchitecture: PerformanceArchitecture;
  loadingArchitecture:     LoadingArchitecture;
  accessibilityArchitecture: AccessibilityArchitecture;
  seoArchitecture:         SeoArchitecture;
  errorArchitecture:       ErrorArchitecture;
  validationScores:        ArchitectureScore[];
  overallScore:            number;
  confidence:              number;
}

export interface FrontendArchitectOutput {
  blueprint:     FrontendArchitectureBlueprint;
  overallScore:  number;
  contextString: string;
}

// ── Learning ──────────────────────────────────────────────────────────────────

export interface ArchitectureLearningRecord {
  buildId:     string;
  projectType: ProjectType;
  overallScore: number;
  routeCount:  number;
  stateStrategy: StateStrategy;
  improved:    boolean;
  recordedAt:  number;
}

export interface ArchitectureLearningInput {
  buildId:       string;
  blueprint:     FrontendArchitectureBlueprint;
  evaluatorScore?: number;
}
