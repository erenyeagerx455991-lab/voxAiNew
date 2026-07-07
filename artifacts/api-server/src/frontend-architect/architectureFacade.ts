// ── V8.5 Frontend Architect — Public API Facade ───────────────────────────────

export type {
  ProjectType,
  RouteType,
  RouteDefinition,
  RoutingArchitecture,
  LayoutType,
  LayoutDefinition,
  LayoutArchitecture,
  ComponentOwnershipLevel,
  ComponentGroup,
  ComponentOwnership,
  FolderStructure,
  StateStrategy,
  StateLayer,
  StateArchitecture,
  ThemeMode,
  ThemeArchitecture,
  ApiPattern,
  CachingStrategy,
  ApiArchitecture,
  AuthStrategy,
  AuthArchitecture,
  PermissionArchitecture,
  ResponsiveArchitecture,
  PerformanceArchitecture,
  LoadingArchitecture,
  AccessibilityArchitecture,
  SeoArchitecture,
  ErrorArchitecture,
  ArchitectureDimension,
  ArchitectureScore,
  FrontendArchitectureBlueprint,
  FrontendArchitectOutput,
  ArchitectureLearningRecord,
  ArchitectureLearningInput,
} from './frontendTypes.js';

export { ALL_ARCHITECTURE_DIMENSIONS, ALL_PROJECT_TYPES } from './frontendTypes.js';


export { classifyProjectType, planAccessibilityArchitecture } from './frontendPlanner.js';
export { planRoutingArchitecture } from './routePlanner.js';
export { planLayoutArchitecture } from './layoutPlanner.js';
export { planComponentOwnership } from './componentPlanner.js';
export { planFolderStructure } from './folderPlanner.js';
export { planStateArchitecture } from './statePlanner.js';
export { planThemeArchitecture } from './themePlanner.js';
export { planApiArchitecture } from './apiPlanner.js';
export { planAuthArchitecture } from './authPlanner.js';
export { planPermissionArchitecture } from './permissionPlanner.js';
export { planResponsiveArchitecture } from './responsivePlanner.js';
export { planPerformanceArchitecture } from './performancePlanner.js';
export { planLoadingArchitecture } from './loadingPlanner.js';
export { planSeoArchitecture } from './seoPlanner.js';
export { planErrorArchitecture } from './errorPlanner.js';
export { validateArchitecture } from './architectureValidator.js';
export { runFrontendArchitect } from './frontendArchitect.js';
export { learnFromArchitecture, getArchitectureLearningHistory, getSuccessfulPatterns, hydrateArchitectureLearning } from './architectureLearning.js';
export { getArchitectureMetrics, recordArchitectureBuild, resetArchitectureMetrics } from './architectureMetrics.js';
export { initArchitecturePersistence, persistArchitectureRecord, hydrateFromDisk } from './architecturePersistence.js';
