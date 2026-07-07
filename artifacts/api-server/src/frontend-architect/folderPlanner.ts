// ── V8.5 Frontend Architect — Folder Structure Planning ───────────────────────

import type { ProjectType, FolderStructure } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planFolderStructure(
  projectType: ProjectType,
  features: ProductFeature[],
): FolderStructure {
  const pattern = resolvePattern(projectType, features);
  const directories = buildDirectories(projectType, features, pattern);
  const keyFiles = buildKeyFiles(projectType, features);

  return { root: 'src/', directories, keyFiles, pattern };
}

function resolvePattern(projectType: ProjectType, features: ProductFeature[]): FolderStructure['pattern'] {
  const largeApps: ProjectType[] = ['SaaS', 'ERP', 'EnterprisePlatform', 'CRM', 'Analytics', 'Dashboard'];
  if (largeApps.includes(projectType) || features.length > 8) return 'feature-first';
  if (['LandingPage', 'Portfolio', 'Blog', 'Documentation'].includes(projectType)) return 'layer-first';
  return 'hybrid';
}

function buildDirectories(projectType: ProjectType, features: ProductFeature[], pattern: FolderStructure['pattern']): string[] {
  const base = [
    'src/app/',
    'src/pages/',
    'src/layouts/',
    'src/components/',
    'src/lib/',
    'src/utils/',
    'src/types/',
    'src/styles/',
    'src/assets/',
    'src/config/',
  ];

  const appLike: ProjectType[] = ['SaaS', 'Dashboard', 'CRM', 'AdminPanel', 'Analytics', 'ERP', 'AIApplication', 'Productivity', 'InternalTool', 'EnterprisePlatform', 'ChatApp', 'Healthcare', 'Finance'];
  if (appLike.includes(projectType) || features.length > 3) {
    base.push('src/features/', 'src/hooks/', 'src/contexts/', 'src/providers/', 'src/services/', 'src/api/');
  }

  if (features.includes('Authentication') || features.includes('Workspace')) {
    base.push('src/auth/');
  }
  if (features.includes('Analytics') || features.includes('Reports')) {
    base.push('src/analytics/');
  }
  if (['Redux', 'Zustand'].includes(detectStateStrategy(projectType, features))) {
    base.push('src/store/');
  }
  if (pattern === 'feature-first') {
    base.push('src/features/dashboard/', 'src/features/auth/', 'src/features/settings/');
    if (features.includes('CRM')) base.push('src/features/crm/');
    if (features.includes('Billing')) base.push('src/features/billing/');
    if (features.includes('Analytics')) base.push('src/features/analytics/');
  }

  return [...new Set(base)].sort();
}

function buildKeyFiles(projectType: ProjectType, features: ProductFeature[]): string[] {
  const files = [
    'src/main.tsx',
    'src/App.tsx',
    'src/routes.tsx',
    'src/config/index.ts',
    'src/types/index.ts',
    'src/lib/utils.ts',
  ];
  if (features.includes('Authentication')) files.push('src/auth/AuthProvider.tsx', 'src/auth/ProtectedRoute.tsx');
  if (features.includes('Settings')) files.push('src/contexts/SettingsContext.tsx');
  if (features.includes('Teams')) files.push('src/contexts/TeamContext.tsx');
  if (features.includes('Billing')) files.push('src/features/billing/hooks.ts');
  return files;
}

function detectStateStrategy(projectType: ProjectType, features: ProductFeature[]): string {
  const complexApps: ProjectType[] = ['ERP', 'EnterprisePlatform', 'CRM', 'Analytics'];
  if (complexApps.includes(projectType) || features.length > 10) return 'Redux';
  if (features.includes('Chat') || features.includes('AIAssistant')) return 'Zustand';
  return 'Context';
}
