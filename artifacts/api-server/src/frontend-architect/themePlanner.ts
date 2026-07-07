// ── V8.5 Frontend Architect — Theme Architecture ──────────────────────────────

import type { ProjectType, ThemeArchitecture, ThemeMode } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planThemeArchitecture(
  projectType: ProjectType,
  features: ProductFeature[],
  prompt: string,
): ThemeArchitecture {
  const modes = resolveModes(projectType, prompt);
  const defaultMode = resolveDefaultMode(projectType);
  const runtimeSwitching = modes.length > 1;

  return {
    modes,
    defaultMode,
    runtimeSwitching,
    tokenSystem: true, // V8.5 always uses design token system
    cssVariables: true,
    hasDarkMode: modes.includes('dark') || modes.includes('auto'),
  };
}

function resolveModes(projectType: ProjectType, prompt: string): ThemeMode[] {
  const modes = new Set<ThemeMode>(['light']);

  const hasDarkKeyword = /dark.*mode|night.*mode|dark.*theme/i.test(prompt);
  const darkFirst = /dark.*first|dark.*default/i.test(prompt);

  if (hasDarkKeyword || darkFirst) modes.add('dark');

  // App-like products get dark mode by default
  const darkFriendly: ProjectType[] = ['Dashboard', 'Analytics', 'AIApplication', 'DeveloperTool', 'ChatApp', 'Productivity', 'InternalTool', 'EnterprisePlatform', 'CRM', 'ERP'];
  if (darkFriendly.includes(projectType)) {
    modes.add('dark');
    modes.add('auto');
  }

  // Enterprise products get brand themes
  const enterpriseTypes: ProjectType[] = ['EnterprisePlatform', 'ERP', 'CRM'];
  if (enterpriseTypes.includes(projectType)) modes.add('brand');

  // Dashboard and analytics get dashboard themes
  if (projectType === 'Dashboard' || projectType === 'Analytics') modes.add('dashboard');

  return [...modes] as ThemeMode[];
}

function resolveDefaultMode(projectType: ProjectType): ThemeMode {
  const lightFirst: ProjectType[] = ['LandingPage', 'Portfolio', 'Blog', 'ECommerce', 'Healthcare', 'Education', 'Booking'];
  return lightFirst.includes(projectType) ? 'light' : 'auto';
}
