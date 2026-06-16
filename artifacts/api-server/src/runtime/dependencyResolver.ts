export interface ResolvedDependencies {
  packages: string[];
  devPackages: string[];
  packageJson: string;
  warnings: string[];
}

const FEATURE_TO_PACKAGES: Record<string, string[]> = {
  auth: ['@clerk/clerk-react', 'jsonwebtoken', 'bcryptjs'],
  authentication: ['@clerk/clerk-react', 'jsonwebtoken'],
  login: ['@clerk/clerk-react'],
  signup: ['@clerk/clerk-react'],
  charts: ['recharts'],
  analytics: ['recharts', 'date-fns'],
  dashboard: ['recharts', 'date-fns'],
  payments: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
  billing: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
  stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
  forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
  validation: ['zod'],
  'drag-drop': ['@dnd-kit/core', '@dnd-kit/sortable'],
  kanban: ['@dnd-kit/core', '@dnd-kit/sortable'],
  pipeline: ['@dnd-kit/core', '@dnd-kit/sortable'],
  animation: ['framer-motion'],
  maps: ['leaflet', 'react-leaflet'],
  table: ['@tanstack/react-table'],
  'data table': ['@tanstack/react-table'],
  markdown: ['react-markdown', 'remark-gfm'],
  'rich text': ['@tiptap/react', '@tiptap/starter-kit'],
  editor: ['@tiptap/react', '@tiptap/starter-kit'],
  calendar: ['date-fns', '@fullcalendar/react'],
  notifications: ['sonner'],
  toast: ['sonner'],
  upload: ['react-dropzone'],
  'file upload': ['react-dropzone'],
  'csv export': ['papaparse'],
  csv: ['papaparse'],
  pdf: ['@react-pdf/renderer'],
  email: ['resend'],
  websocket: ['socket.io-client'],
  realtime: ['socket.io-client'],
  state: ['zustand'],
  'state management': ['zustand'],
  'infinite scroll': ['react-intersection-observer'],
  search: ['fuse.js'],
  'fuzzy search': ['fuse.js'],
  carousel: ['embla-carousel-react'],
  slider: ['embla-carousel-react'],
  tooltip: ['@radix-ui/react-tooltip'],
  modal: ['@radix-ui/react-dialog'],
  dropdown: ['@radix-ui/react-dropdown-menu'],
  'date picker': ['react-day-picker', 'date-fns'],
  dates: ['date-fns'],
  qr: ['qrcode.react'],
  barcode: ['react-barcode'],
  'code highlight': ['prism-react-renderer'],
  syntax: ['prism-react-renderer'],
  'virtual list': ['react-window'],
  virtualization: ['react-window'],
  avatar: ['@radix-ui/react-avatar'],
  progress: ['@radix-ui/react-progress'],
  accordion: ['@radix-ui/react-accordion'],
  tabs: ['@radix-ui/react-tabs'],
  'color picker': ['react-colorful'],
  resizable: ['react-resizable-panels'],
  'split view': ['react-resizable-panels'],
};

const ALWAYS_INCLUDED: string[] = [
  'react',
  'react-dom',
  'react-router-dom',
  'lucide-react',
];

const DEV_PACKAGES: string[] = [
  '@types/react',
  '@types/react-dom',
  '@types/node',
  'typescript',
  'vite',
  '@vitejs/plugin-react',
  'tailwindcss',
  'autoprefixer',
  'postcss',
];

function normalizeFeature(f: string): string {
  return f.toLowerCase().replace(/[-_]/g, ' ').trim();
}

export function resolveDependencies(
  features: string[],
  options?: { projectType?: string; authNeeded?: boolean; apis?: string[] }
): ResolvedDependencies {
  const resolved = new Set<string>(ALWAYS_INCLUDED);
  const warnings: string[] = [];

  for (const feature of features) {
    const norm = normalizeFeature(feature);
    for (const [key, pkgs] of Object.entries(FEATURE_TO_PACKAGES)) {
      if (norm.includes(key) || key.includes(norm)) {
        pkgs.forEach(p => resolved.add(p));
      }
    }
  }

  if (options?.authNeeded) {
    resolved.add('@clerk/clerk-react');
    resolved.add('jsonwebtoken');
  }

  if (options?.apis && options.apis.length > 0) {
    resolved.add('axios');
  }

  if (options?.projectType) {
    const pt = options.projectType.toLowerCase();
    if (pt.includes('saas') || pt.includes('dashboard')) {
      resolved.add('recharts');
      resolved.add('date-fns');
    }
    if (pt.includes('ecommerce') || pt.includes('commerce')) {
      resolved.add('@stripe/stripe-js');
      resolved.add('@stripe/react-stripe-js');
    }
    if (pt.includes('crm')) {
      resolved.add('recharts');
      resolved.add('@tanstack/react-table');
      resolved.add('date-fns');
    }
    if (pt.includes('blog') || pt.includes('content')) {
      resolved.add('react-markdown');
      resolved.add('remark-gfm');
    }
    if (pt.includes('ai') || pt.includes('tool')) {
      resolved.add('framer-motion');
    }
    if (pt.includes('analytics')) {
      resolved.add('recharts');
      resolved.add('@tanstack/react-table');
    }
    if (pt.includes('project management')) {
      resolved.add('@dnd-kit/core');
      resolved.add('@dnd-kit/sortable');
      resolved.add('date-fns');
    }
  }

  const packages = [...resolved];

  const duplicates = packages.filter((p, i) => packages.indexOf(p) !== i);
  if (duplicates.length > 0) {
    warnings.push(`Duplicate packages removed: ${[...new Set(duplicates)].join(', ')}`);
  }

  const uniquePackages = [...new Set(packages)];
  const packageJson = generatePackageJson(uniquePackages, DEV_PACKAGES, options?.projectType);

  return {
    packages: uniquePackages,
    devPackages: DEV_PACKAGES,
    packageJson,
    warnings,
  };
}

function generatePackageJson(deps: string[], devDeps: string[], projectType?: string): string {
  const name = (projectType ?? 'nexogen-project').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const depsObj: Record<string, string> = {};
  for (const dep of deps) {
    const version = PACKAGE_VERSIONS[dep] ?? 'latest';
    depsObj[dep] = version;
  }

  const devDepsObj: Record<string, string> = {};
  for (const dep of devDeps) {
    const version = PACKAGE_VERSIONS[dep] ?? 'latest';
    devDepsObj[dep] = version;
  }

  return JSON.stringify({
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
    },
    dependencies: depsObj,
    devDependencies: devDepsObj,
  }, null, 2);
}

const PACKAGE_VERSIONS: Record<string, string> = {
  react: '^18.3.1',
  'react-dom': '^18.3.1',
  'react-router-dom': '^6.28.0',
  'lucide-react': '^0.462.0',
  recharts: '^2.13.3',
  'date-fns': '^4.1.0',
  '@clerk/clerk-react': '^5.18.0',
  jsonwebtoken: '^9.0.2',
  bcryptjs: '^2.4.3',
  '@stripe/stripe-js': '^5.5.0',
  '@stripe/react-stripe-js': '^3.1.1',
  'react-hook-form': '^7.54.2',
  zod: '^3.24.1',
  '@hookform/resolvers': '^3.9.1',
  '@dnd-kit/core': '^6.3.1',
  '@dnd-kit/sortable': '^8.0.0',
  'framer-motion': '^11.15.0',
  zustand: '^5.0.2',
  'react-markdown': '^9.0.1',
  'remark-gfm': '^4.0.0',
  '@tanstack/react-table': '^8.20.5',
  axios: '^1.7.9',
  sonner: '^1.7.1',
  'react-dropzone': '^14.3.5',
  'fuse.js': '^7.0.0',
  'embla-carousel-react': '^8.5.1',
  '@radix-ui/react-tooltip': '^1.1.6',
  '@radix-ui/react-dialog': '^1.1.4',
  '@radix-ui/react-dropdown-menu': '^2.1.4',
  '@radix-ui/react-accordion': '^1.2.2',
  '@radix-ui/react-tabs': '^1.1.2',
  '@radix-ui/react-avatar': '^1.1.2',
  '@radix-ui/react-progress': '^1.1.1',
  'react-day-picker': '^9.4.4',
  'react-intersection-observer': '^9.14.0',
  'prism-react-renderer': '^2.4.0',
  papaparse: '^5.4.1',
  'socket.io-client': '^4.8.1',
  '@types/react': '^18.3.18',
  '@types/react-dom': '^18.3.5',
  '@types/node': '^22.10.5',
  typescript: '^5.7.3',
  vite: '^6.0.7',
  '@vitejs/plugin-react': '^4.3.4',
  tailwindcss: '^3.4.17',
  autoprefixer: '^10.4.20',
  postcss: '^8.5.1',
};

export function validateDependencies(packages: string[]): { valid: boolean; missing: string[]; duplicates: string[] } {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const missing: string[] = [];

  for (const pkg of packages) {
    if (seen.has(pkg)) duplicates.push(pkg);
    seen.add(pkg);
    if (!ALWAYS_INCLUDED.includes(pkg) && !PACKAGE_VERSIONS[pkg]) {
      missing.push(pkg);
    }
  }

  return { valid: duplicates.length === 0 && missing.length === 0, missing, duplicates };
}
