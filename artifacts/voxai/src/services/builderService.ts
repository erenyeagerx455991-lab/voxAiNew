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
    backend?: string;
    database?: string;
  };
  description?: string;
  dependencies?: string[];
}

export interface ProjectFile {
  path: string;
  name: string;
  lang: string;
  content: string;
}

export interface DNAComposition {
  stripe: number; linear: number; framer: number; vercel: number;
  notion: number; cursor: number; raycast: number;
}

export interface ThemeTokens {
  primary: string; surface: string; accent: string;
  border: string; card: string; text: string; textMuted: string;
  isDark: boolean; primaryBrand: string; surfaceBrand: string; accentBrand: string;
}

export interface MotionProfile {
  level: 'minimal' | 'standard' | 'advanced';
  hoverLift: boolean; staggerAnimation: boolean; revealTransitions: boolean;
  motionCards: boolean; bentoInteractions: boolean; advancedMode: boolean;
  dominantSource: string;
}

export interface DNABuildData {
  composition: DNAComposition;
  sectionOwnership: Record<string, string>;
  themeTokens: ThemeTokens;
  motionProfile: MotionProfile;
}

const TEMPLATES: Record<string, string> = {
  default: `function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">YourBrand</span>
          <button className="bg-white text-indigo-600 font-semibold text-sm px-5 py-2 rounded-full hover:bg-indigo-50 transition-colors">
            Get Started
          </button>
        </div>
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">Build something amazing today</h1>
          <p className="text-lg text-indigo-100 mb-10 max-w-xl mx-auto">
            The fastest way to launch your idea.
          </p>
        </div>
      </header>
    </div>
  );
}`,
};

export function sanitizeCode(raw: string): string {
  return raw
    .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/gi, '')
    .replace(/\n?```\s*$/gi, '')
    .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+/gm, '')
    .replace(/^interface\s+\w+[\s\S]*?\n\}/gm, '')
    .replace(/^type\s+\w+\s*=[\s\S]*?;?\s*$/gm, '')
    .trim();
}

// ── Component extraction helpers ────────────────────────────────────────────

function extractComponentFunctions(code: string): Array<{ name: string; body: string }> {
  const results: Array<{ name: string; body: string }> = [];
  const funcPattern = /^function\s+([A-Z][a-zA-Z0-9]*)\s*\(\s*\)/gm;
  const positions: Array<{ name: string; start: number }> = [];

  let match: RegExpExecArray | null;
  while ((match = funcPattern.exec(code)) !== null) {
    positions.push({ name: match[1], start: match.index });
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].start;
    const end = i + 1 < positions.length ? positions[i + 1].start : code.length;
    const body = code.slice(start, end).trim();
    results.push({ name: positions[i].name, body });
  }

  return results;
}

function convertHooksFromNamespaced(code: string): string {
  return code
    .replace(/React\.useState\b/g, 'useState')
    .replace(/React\.useEffect\b/g, 'useEffect')
    .replace(/React\.useRef\b/g, 'useRef')
    .replace(/React\.useMemo\b/g, 'useMemo')
    .replace(/React\.useCallback\b/g, 'useCallback')
    .replace(/React\.useContext\b/g, 'useContext')
    .replace(/React\.useReducer\b/g, 'useReducer');
}

function detectReactHooks(code: string): string[] {
  const hooks: string[] = [];
  if (/\buseState\b/.test(code)) hooks.push('useState');
  if (/\buseEffect\b/.test(code)) hooks.push('useEffect');
  if (/\buseRef\b/.test(code)) hooks.push('useRef');
  if (/\buseMemo\b/.test(code)) hooks.push('useMemo');
  if (/\buseCallback\b/.test(code)) hooks.push('useCallback');
  if (/\buseContext\b/.test(code)) hooks.push('useContext');
  if (/\buseReducer\b/.test(code)) hooks.push('useReducer');
  return hooks;
}

// Common Lucide icon names to detect in code
const LUCIDE_ICONS = [
  'ChevronRight', 'ChevronLeft', 'ChevronDown', 'ChevronUp',
  'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp',
  'Star', 'StarOff', 'Check', 'CheckCircle', 'X', 'XCircle',
  'Zap', 'Shield', 'Globe', 'Users', 'User', 'UserCheck',
  'BarChart', 'BarChart2', 'BarChart3', 'LineChart', 'PieChart',
  'Code', 'Code2', 'Layers', 'Sparkles', 'Play', 'Pause',
  'Menu', 'ExternalLink', 'Github', 'Twitter', 'Mail', 'Phone',
  'MapPin', 'Clock', 'Calendar', 'Search', 'Filter', 'Settings',
  'Heart', 'ThumbsUp', 'MessageCircle', 'Send', 'Share2',
  'Download', 'Upload', 'Cloud', 'Lock', 'Unlock', 'Key',
  'Eye', 'EyeOff', 'Info', 'AlertCircle', 'AlertTriangle',
  'Rocket', 'Package', 'Box', 'Folder', 'File', 'FileText',
  'Plus', 'Minus', 'Edit', 'Trash2', 'Copy', 'Clipboard',
  'Link', 'Linkedin', 'Instagram', 'Facebook', 'Youtube',
  'Monitor', 'Smartphone', 'Tablet', 'Laptop', 'Server',
  'Database', 'Cpu', 'Wifi', 'Battery', 'Power',
  'Sun', 'Moon', 'CloudRain', 'Wind', 'Leaf',
  'DollarSign', 'CreditCard', 'TrendingUp', 'TrendingDown',
  'Award', 'Target', 'Compass', 'Map', 'Navigation',
  'Headphones', 'Music', 'Video', 'Image', 'Camera',
  'Briefcase', 'Building', 'Building2', 'Home', 'Store',
];

function detectLucideIcons(code: string): string[] {
  return LUCIDE_ICONS.filter(icon => {
    const pattern = new RegExp(`<${icon}[\\s/>]`);
    return pattern.test(code);
  });
}

// ── Main file generator ──────────────────────────────────────────────────────

export function generateProjectFiles(
  code: string,
  projectBlueprint?: ProjectBlueprint,
  sectionOrder?: string[]
): ProjectFile[] {
  const sanitized = sanitizeCode(code);
  const components = extractComponentFunctions(sanitized);

  const appComponent = components.find(c => c.name === 'App');
  const sectionComponents = components.filter(c => c.name !== 'App');

  const files: ProjectFile[] = [];
  const pages = projectBlueprint?.pages || ['Landing'];

  // ── Component files ────────────────────────────────────────────────────────
  for (const comp of sectionComponents) {
    const convertedBody = convertHooksFromNamespaced(comp.body);
    const hooks = detectReactHooks(convertedBody);
    const usedIcons = detectLucideIcons(convertedBody);

    const hooksImport = hooks.length > 0 ? `, { ${hooks.join(', ')} }` : '';
    const lucideImport = usedIcons.length > 0
      ? `\nimport { ${usedIcons.join(', ')} } from 'lucide-react';`
      : '';

    const content = `import React${hooksImport} from 'react';${lucideImport}\n\n${convertedBody}\n\nexport default ${comp.name};\n`;

    const isPage = pages.some(p =>
      comp.name.toLowerCase() === p.toLowerCase() ||
      comp.name.toLowerCase().includes(p.toLowerCase()) ||
      p.toLowerCase().includes(comp.name.toLowerCase().replace(/section|page/g, ''))
    );

    const folder = (isPage && pages.length > 1) ? 'src/pages/' : 'src/components/';

    files.push({ path: folder, name: `${comp.name}.tsx`, lang: 'tsx', content });
  }

  // ── App.tsx with React Router ──────────────────────────────────────────────
  const pageComponents = pages.length > 1
    ? sectionComponents.filter(c => pages.some(p => c.name.toLowerCase().includes(p.toLowerCase())))
    : [];
  const sharedComponents = sectionComponents.filter(c => !pageComponents.includes(c));
  const hasRouting = pageComponents.length > 1;

  let appContent: string;

  if (hasRouting) {
    const pageImports = pageComponents.map(c => `import ${c.name} from './pages/${c.name}';`).join('\n');
    const sharedImports = sharedComponents.map(c => `import ${c.name} from './components/${c.name}';`).join('\n');
    const routes = pageComponents.map((c, i) => {
      const routePath = i === 0 ? '/' : `/${c.name.toLowerCase()}`;
      return `        <Route path="${routePath}" element={<${c.name} />} />`;
    }).join('\n');

    appContent = `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
${pageImports}
${sharedImports ? sharedImports + '\n' : ''}
export default function App() {
  return (
    <Router>
      <Routes>
${routes}
      </Routes>
    </Router>
  );
}
`;
  } else {
    const allImports = sectionComponents.map(c => {
      const isPage = pageComponents.includes(c);
      const folder = isPage ? 'pages' : 'components';
      return `import ${c.name} from './${folder}/${c.name}';`;
    }).join('\n');
    const rendered = sectionComponents.map(c => `    <${c.name} />`).join('\n');

    appContent = `import React from 'react';
${allImports}

export default function App() {
  return (
    <div>
${rendered}
    </div>
  );
}
`;
  }

  files.push({ path: 'src/', name: 'App.tsx', lang: 'tsx', content: appContent });

  // ── src/types/index.ts ─────────────────────────────────────────────────────
  const tableTypes = (projectBlueprint?.databaseTables || []).map(table => {
    const TypeName = table.charAt(0).toUpperCase() + table.slice(1).replace(/s$/, '');
    return `export interface ${TypeName} {\n  id: string;\n  createdAt: string;\n  updatedAt: string;\n}`;
  }).join('\n\n');

  files.push({
    path: 'src/types/',
    name: 'index.ts',
    lang: 'ts',
    content: `// Types for ${projectBlueprint?.projectType || 'project'}\n\nexport interface User {\n  id: string;\n  name: string;\n  email: string;\n  createdAt: string;\n}\n\n${tableTypes}\n`,
  });

  // ── src/lib/utils.ts ───────────────────────────────────────────────────────
  files.push({
    path: 'src/lib/',
    name: 'utils.ts',
    lang: 'ts',
    content: `import { type ClassValue, clsx } from 'clsx';\nimport { twMerge } from 'tailwind-merge';\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n\nexport function formatDate(date: Date | string): string {\n  return new Intl.DateTimeFormat('en-US', {\n    year: 'numeric', month: 'long', day: 'numeric',\n  }).format(new Date(date));\n}\n\nexport function truncate(str: string, length: number): string {\n  return str.length > length ? \`\${str.slice(0, length)}...\` : str;\n}\n`,
  });

  // ── src/main.tsx ───────────────────────────────────────────────────────────
  files.push({
    path: 'src/',
    name: 'main.tsx',
    lang: 'tsx',
    content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`,
  });

  // ── src/index.css ──────────────────────────────────────────────────────────
  files.push({
    path: 'src/',
    name: 'index.css',
    lang: 'css',
    content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n* { box-sizing: border-box; }\nbody { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }\n`,
  });

  // ── index.html ─────────────────────────────────────────────────────────────
  files.push({
    path: '',
    name: 'index.html',
    lang: 'html',
    content: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${projectBlueprint?.projectType || 'NexoGen App'}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
  });

  // ── package.json ───────────────────────────────────────────────────────────
  const deps: Record<string, string> = {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
    'lucide-react': '^0.400.0',
    clsx: '^2.1.1',
    'tailwind-merge': '^2.4.0',
  };
  if (hasRouting) deps['react-router-dom'] = '^6.26.0';
  if (projectBlueprint?.authNeeded) {
    deps['@supabase/supabase-js'] = '^2.45.0';
  }

  files.push({
    path: '',
    name: 'package.json',
    lang: 'json',
    content: JSON.stringify({
      name: (projectBlueprint?.projectType || 'nexogen-app').toLowerCase().replace(/\s+/g, '-'),
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' },
      dependencies: deps,
      devDependencies: {
        '@types/react': '^18.3.3',
        '@types/react-dom': '^18.3.0',
        '@vitejs/plugin-react': '^4.3.1',
        typescript: '^5.5.3',
        vite: '^5.4.10',
        tailwindcss: '^3.4.14',
        autoprefixer: '^10.4.20',
        postcss: '^8.4.47',
      },
    }, null, 2),
  });

  // ── vite.config.ts ─────────────────────────────────────────────────────────
  files.push({
    path: '',
    name: 'vite.config.ts',
    lang: 'ts',
    content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: { alias: { '@': '/src' } },\n});\n`,
  });

  // ── tsconfig.json ──────────────────────────────────────────────────────────
  files.push({
    path: '',
    name: 'tsconfig.json',
    lang: 'json',
    content: JSON.stringify({
      compilerOptions: {
        target: 'ES2020', useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'], module: 'ESNext',
        skipLibCheck: true, moduleResolution: 'bundler',
        allowImportingTsExtensions: true, resolveJsonModule: true,
        isolatedModules: true, noEmit: true, jsx: 'react-jsx',
        strict: true, baseUrl: '.', paths: { '@/*': ['./src/*'] },
      },
      include: ['src'],
    }, null, 2),
  });

  // ── tailwind.config.ts ─────────────────────────────────────────────────────
  files.push({
    path: '',
    name: 'tailwind.config.ts',
    lang: 'ts',
    content: `import type { Config } from 'tailwindcss';\n\nexport default {\n  content: ['./index.html', './src/**/*.{ts,tsx}'],\n  theme: { extend: {} },\n  plugins: [],\n} satisfies Config;\n`,
  });

  // ── README.md ──────────────────────────────────────────────────────────────
  const techStack = projectBlueprint?.techStack;
  files.push({
    path: '',
    name: 'README.md',
    lang: 'md',
    content: `# ${projectBlueprint?.projectType || 'NexoGen App'}\n\n${projectBlueprint?.description || 'Generated by NexoGen AI Software Builder.'}\n\n## Tech Stack\n\n- **Frontend**: ${techStack?.frontend || 'React + TypeScript + Tailwind CSS'}\n- **UI**: ${techStack?.ui || 'shadcn/ui + Lucide Icons'}${hasRouting ? '\n- **Routing**: React Router v6' : ''}${projectBlueprint?.authNeeded ? '\n- **Auth**: Supabase Auth' : ''}\n- **Build**: Vite\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Project Structure\n\n\`\`\`\nsrc/\n  components/   # Reusable UI components\n  pages/        # Page components${projectBlueprint?.authNeeded ? '\n  lib/auth.ts   # Auth utilities' : ''}\n  lib/utils.ts  # Shared utilities\n  types/        # TypeScript types\n  App.tsx       # Root component${hasRouting ? ' with React Router' : ''}\n  main.tsx      # Entry point\n\`\`\`\n`,
  });

  return files;
}

// ── Preview assembler from ProjectFile[] ────────────────────────────────────
// Makes ProjectFile[] the runtime source of truth for the preview iframe.
// Strips import/export wrappers from each file, adds a React hooks preamble
// so de-namespaced hooks (useState vs React.useState) work in the CDN+Babel
// environment, then concatenates components → App.tsx and renders the result.
//
// Note: the preview iframe uses CDN+Babel (no bundler), so true ES module
// imports cannot be resolved at runtime. This assembler inlines all components
// in dependency order to achieve the equivalent behaviour.

export function buildPreviewHtmlFromFiles(files: ProjectFile[]): string {
  const tsxFiles = files.filter(
    (f) => (f.lang === 'tsx' || f.lang === 'jsx') && f.name !== 'main.tsx'
  );
  const appFile = tsxFiles.find((f) => f.name === 'App.tsx');
  const components = tsxFiles.filter((f) => f.name !== 'App.tsx');

  if (!appFile && components.length === 0) {
    return buildPreviewHtml('function App() { return <div>No content</div>; }');
  }

  // Strip import/export wrappers added by sseToTsxFile / generateProjectFiles.
  // The function definitions are kept intact.
  const stripForInline = (content: string): string =>
    content
      .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/^import\s*\{[^}]+\}\s*from\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/^export\s+default\s+function\s/gm, 'function ')
      .replace(/^export\s+default\s+/gm, '')
      .replace(/^export\s+function\s/gm, 'function ')
      .replace(/^export\s+/gm, '')
      .trim();

  const parts: string[] = [
    // Preamble: make de-namespaced hooks available globally.
    // Files from sseToTsxFile use useState (not React.useState) after hook conversion.
    'const { useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer } = React;',
  ];

  // Shared components first (pages depend on them), then App.tsx last
  for (const f of components) {
    const cleaned = stripForInline(f.content);
    if (cleaned.length > 10) parts.push(cleaned);
  }

  // Detect page components (files in src/pages/) for tab navigation
  const pageFiles = files.filter(
    (f) => (f.lang === 'tsx' || f.lang === 'jsx') && f.path.includes('pages/') && f.name !== 'App.tsx'
  );
  const hasMultiplePages = pageFiles.length > 1;

  if (appFile) {
    let appCleaned = stripForInline(appFile.content);

    if (hasMultiplePages) {
      // Multi-page: inject a RouterCompat tab nav so all routes are navigable
      // in the preview iframe (BrowserRouter doesn't work in sandboxed iframes).
      const routeList = pageFiles
        .map((f) => {
          const name = f.name.replace('.tsx', '');
          return `{ name: "${name}", component: ${name} }`;
        })
        .join(', ');

      const routerCompat = `
function RouterCompat() {
  const [current, setCurrent] = React.useState(0);
  const routes = [${routeList}];
  const Page = routes[current].component;
  return (
    <div>
      <div style={{display:'flex',gap:'4px',padding:'8px 12px',background:'rgba(0,0,0,0.6)',borderBottom:'1px solid rgba(255,255,255,0.08)',position:'sticky',top:0,zIndex:50}}>
        {routes.map(function(r,i){return React.createElement('button',{key:r.name,onClick:function(){setCurrent(i)},style:{padding:'4px 12px',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:500,background:i===current?'rgba(255,255,255,0.15)':'transparent',color:i===current?'#fff':'rgba(255,255,255,0.5)',transition:'all 0.15s'}},r.name);})}
      </div>
      <Page />
    </div>
  );
}`;

      // Replace the BrowserRouter-based App return with RouterCompat
      appCleaned = appCleaned
        .replace(/<Router>[\s\S]*?<\/Router>/g, '<RouterCompat />')
        .replace(/<BrowserRouter[^>]*>[\s\S]*?<\/BrowserRouter>/g, '<RouterCompat />');

      // If no router wrapper found, replace App body to use RouterCompat
      if (!appCleaned.includes('<RouterCompat />')) {
        appCleaned = `function App() { return <RouterCompat />; }`;
      }

      parts.push(routerCompat);
      parts.push(appCleaned);
    } else {
      // Single-page or single-route: collapse any router wrapper to a plain div
      appCleaned = appCleaned
        .replace(/<Router>\s*/g, '<div>')
        .replace(/<BrowserRouter[^>]*>\s*/g, '<div>')
        .replace(/\s*<\/Router>/g, '</div>')
        .replace(/\s*<\/BrowserRouter>/g, '</div>')
        .replace(/<Routes>([\s\S]*?)<\/Routes>/g, (_, inner) => {
          const firstRoute = inner.match(/element=\{<(\w+)\s*\/>\}/);
          return firstRoute ? `<${firstRoute[1]} />` : inner;
        });
      parts.push(appCleaned);
    }
  }

  const assembled = parts.join('\n\n');
  return buildPreviewHtml(assembled);
}

// ── Preview HTML builder (with Lucide React CDN support) ────────────────────

export function buildPreviewHtml(code: string): string {
  const sanitized = sanitizeCode(code);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>
  <style>
    body { margin: 0; }
    #__error {
      display: none;
      align-items: flex-start;
      justify-content: flex-start;
      padding: 40px 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #ff6b6b;
      min-height: 100vh;
    }
  </style>
  <script>
    // ── V5.2 Runtime Error Capture ──────────────────────────────────────────
    function __reportRuntimeError(msg, stack, file, component) {
      try {
        window.parent.postMessage({
          type: 'runtime_error',
          message: msg,
          stack: stack || '',
          file: file || '',
          component: component || ''
        }, '*');
      } catch(e) {}
      document.getElementById('root').style.display = 'none';
      var el = document.getElementById('__error');
      el.style.display = 'flex';
      var clean = (msg || 'Unknown error').split('\\n').slice(0, 4).join('\\n');
      el.innerHTML = '<div style="max-width:560px"><div style="font-size:24px;margin-bottom:12px">⚠</div>'
        + '<div style="font-size:14px;font-weight:700;color:#ff6b6b;margin-bottom:6px">Runtime Error</div>'
        + (file ? '<div style="font-size:11px;color:#f87171;margin-bottom:8px;font-family:monospace">' + file.replace(/</g,'&lt;') + '</div>' : '')
        + '<pre style="font-size:11px;color:#fca5a5;background:#2a1515;padding:12px;border-radius:8px;overflow:auto;white-space:pre-wrap;max-height:220px">' + clean.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</pre>'
        + (stack ? '<pre style="font-size:10px;color:#666;background:#1a1a1a;padding:8px;border-radius:6px;overflow:auto;white-space:pre-wrap;margin-top:6px;max-height:120px">' + stack.replace(/</g,'&lt;').slice(0,600) + '</pre>' : '')
        + '<div style="font-size:11px;color:#555;margin-top:10px">NexoGen Runtime Repair will attempt to fix this automatically.</div></div>';
    }

    window.addEventListener('error', function(e) {
      var msg = e.error ? (e.error.message || String(e.error)) : (e.message || 'Unknown error');
      var stack = e.error ? (e.error.stack || '') : '';
      __reportRuntimeError(msg, stack, e.filename || '', '');
    });

    window.addEventListener('unhandledrejection', function(e) {
      var reason = e.reason;
      var msg = reason ? (reason.message || String(reason)) : 'Unhandled Promise rejection';
      var stack = reason ? (reason.stack || '') : '';
      __reportRuntimeError(msg, stack, '', '');
    });
  </script>
</head>
<body>
  <div id="root"></div>
  <div id="__error"></div>
  <script>
    // Lucide React bridge — make all icons available as globals
    if (window.lucideReact) {
      Object.keys(window.lucideReact).forEach(function(key) {
        if (/^[A-Z]/.test(key)) { window[key] = window.lucideReact[key]; }
      });
    }
    // shadcn/ui-compatible component stubs — available as globals
    // Matches the API surface the Frontend Agent is instructed to use.
    (function() {
      function cx() { return Array.from(arguments).filter(Boolean).join(' '); }
      window.cn = cx;
      window.Button = function(p) {
        var v = {default:'bg-white text-black hover:bg-gray-100',outline:'border border-current text-current hover:opacity-80 bg-transparent',ghost:'text-current hover:bg-white/10 bg-transparent',secondary:'bg-white/10 text-white hover:bg-white/20',destructive:'bg-red-600 text-white hover:bg-red-700'}[p.variant||'default']||'bg-white text-black';
        var s = {default:'px-4 py-2 text-sm h-9',sm:'px-3 py-1.5 text-xs h-8',lg:'px-6 py-3 text-base h-11',icon:'h-9 w-9 p-0 justify-center'}[p.size||'default']||'px-4 py-2 text-sm h-9';
        var cls = cx('inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors cursor-pointer border-0',v,s,p.className||'');
        return React.createElement('button', Object.assign({},p,{className:cls}), p.children);
      };
      window.Card = function(p) { return React.createElement('div',Object.assign({},p,{className:cx('rounded-xl border border-white/10 bg-white/5',p.className)}),p.children); };
      window.CardHeader = function(p) { return React.createElement('div',Object.assign({},p,{className:cx('p-6 pb-2',p.className)}),p.children); };
      window.CardContent = function(p) { return React.createElement('div',Object.assign({},p,{className:cx('p-6 pt-0',p.className)}),p.children); };
      window.CardFooter = function(p) { return React.createElement('div',Object.assign({},p,{className:cx('p-6 pt-0 flex items-center',p.className)}),p.children); };
      window.CardTitle = function(p) { return React.createElement('h3',Object.assign({},p,{className:cx('text-xl font-semibold',p.className)}),p.children); };
      window.CardDescription = function(p) { return React.createElement('p',Object.assign({},p,{className:cx('text-sm opacity-60',p.className)}),p.children); };
      window.Input = function(p) { return React.createElement('input',Object.assign({},p,{className:cx('flex h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm placeholder:opacity-40 focus:outline-none focus:ring-1 focus:ring-white/30',p.className)})); };
      window.Badge = function(p) {
        var v = {default:'bg-white/10 text-white',secondary:'bg-white/5 text-gray-300',outline:'border border-current text-current bg-transparent',destructive:'bg-red-600/20 text-red-400'}[p.variant||'default']||'bg-white/10 text-white';
        return React.createElement('div',Object.assign({},p,{className:cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',v,p.className)}),p.children);
      };
      window.Avatar = function(p) { return React.createElement('div',Object.assign({},p,{className:cx('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',p.className)}),p.children); };
      window.AvatarImage = function(p) { return React.createElement('img',Object.assign({},p,{className:cx('aspect-square h-full w-full object-cover',p.className)})); };
      window.AvatarFallback = function(p) { return React.createElement('div',Object.assign({},p,{className:cx('flex h-full w-full items-center justify-center rounded-full bg-white/10 text-sm font-medium',p.className)}),p.children); };
      window.Separator = function(p) { return React.createElement('div',Object.assign({},p,{className:cx('h-px w-full bg-white/10',p.className)})); };
    })();
  </script>
  <script type="text/babel" data-presets="react,typescript" data-plugins="transform-class-properties">
    // V5.2 React Error Boundary — catches render-time crashes and reports to parent
    class __NexoErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }
      componentDidCatch(error, info) {
        __reportRuntimeError(
          error ? error.message : 'React render error',
          error ? error.stack : '',
          '',
          info && info.componentStack ? info.componentStack.slice(0, 400) : ''
        );
      }
      render() {
        if (this.state.hasError) {
          return React.createElement('div', {
            style: { padding: '40px', fontFamily: 'monospace', background: '#0f0f0f', color: '#ff6b6b', minHeight: '100vh' }
          },
            React.createElement('div', { style: { fontSize: '24px', marginBottom: '12px' } }, '⚠'),
            React.createElement('div', { style: { fontSize: '14px', fontWeight: 700, marginBottom: '8px' } }, 'Component Render Error'),
            React.createElement('pre', {
              style: { fontSize: '11px', background: '#2a1515', padding: '12px', borderRadius: '8px', overflow: 'auto', whiteSpace: 'pre-wrap', color: '#fca5a5', maxHeight: '200px' }
            }, this.state.error ? this.state.error.message : 'Unknown error'),
            React.createElement('div', { style: { fontSize: '11px', color: '#555', marginTop: '10px' } }, 'NexoGen Runtime Repair will attempt to fix this automatically.')
          );
        }
        return this.props.children;
      }
    }

    ${sanitized}
    try {
      const rootEl = document.getElementById('root');
      const appRoot = ReactDOM.createRoot(rootEl);
      appRoot.render(React.createElement(__NexoErrorBoundary, null, React.createElement(App)));
    } catch(e) {
      __reportRuntimeError(
        e && e.message ? e.message : String(e),
        e && e.stack ? e.stack : '',
        '', ''
      );
    }
  </script>
</body>
</html>`;
}

// ── PROJECT MEMORY SYSTEM (Phase 1) ──────────────────────────────────────────

export interface FileDependencyGraph {
  [filename: string]: string[];
}

export type ComponentRegistry = Record<string, string>;

export interface EditOperation {
  id: string;
  prompt: string;
  timestamp: number;
  changedFiles: string[];
  createdFiles: string[];
  deletedFiles: string[];
  snapshotFiles: ProjectFile[];
}

export interface EditDiff {
  changedFiles: string[];
  createdFiles: string[];
  deletedFiles: string[];
}

export interface ProjectMemory {
  projectType: string;
  description: string;
  pages: string[];
  routes: string[];
  entities: string[];
  features: string[];
  authProvider: string;
  generatedFiles: string[];
  dependencyGraph: FileDependencyGraph;
  componentRegistry: ComponentRegistry;
  editHistory: EditOperation[];
  referenceComposition?: DNAComposition;
  registrySelection?: RegistrySelection;
  lockedComponents?: string[];
  selectedTemplateId?: string;
  selectedTemplateName?: string;
  templateHistory?: string[];
  timestamp: number;
}

const MEMORY_KEY = (chatId: string) => `voxai_memory_${chatId}`;

export function saveProjectMemory(chatId: string, memory: ProjectMemory): void {
  try { localStorage.setItem(MEMORY_KEY(chatId), JSON.stringify(memory)); } catch {}
}

export function loadProjectMemory(chatId: string): ProjectMemory | null {
  try {
    const raw = localStorage.getItem(MEMORY_KEY(chatId));
    return raw ? (JSON.parse(raw) as ProjectMemory) : null;
  } catch { return null; }
}

export function clearProjectMemory(chatId: string): void {
  try { localStorage.removeItem(MEMORY_KEY(chatId)); } catch {}
}

// ── FILE DEPENDENCY GRAPH (Phase 2) ──────────────────────────────────────────

export function buildDependencyGraph(files: ProjectFile[]): FileDependencyGraph {
  const graph: FileDependencyGraph = {};
  const fileIndex = new Map<string, string>();
  for (const f of files) {
    const key = f.name.replace(/\.(tsx?|jsx?)$/, '');
    fileIndex.set(key, f.path + f.name);
  }
  for (const file of files) {
    if (!file.content || (file.lang !== 'tsx' && file.lang !== 'ts')) continue;
    const deps: string[] = [];
    const re = /from\s+['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(file.content)) !== null) {
      const imp = m[1];
      if (!imp.startsWith('.')) continue;
      const base = imp.split('/').pop() ?? '';
      const dep = fileIndex.get(base);
      if (dep && !deps.includes(dep)) deps.push(dep);
    }
    graph[file.path + file.name] = deps;
  }
  return graph;
}

// ── BUILD HEALTH METRICS (V5.2) ───────────────────────────────────────────────

export interface BuildHealth {
  validationScore: number;       // 0-100 percentage of TSX files passing compile validation
  compileSuccessRate: number;    // 0-100 percentage estimated compile success
  repairAttempts: number;        // total LLM repair calls made
  filesRepaired: number;         // files successfully repaired
  totalFiles: number;            // total project files generated
  passedFiles: number;           // TSX files passing all validation checks
  failedFiles: number;           // TSX files still failing after max repair passes
  tokenEstimate: number;         // rough token count estimate of generated code
  // V5.2 Runtime fields
  runtimeScore: number;          // 0-100 runtime safety score from static analysis
  runtimeErrors: number;         // count of runtime error issues detected
  filesValidated: number;        // count of files put through runtime validator
  runtimeRepairAttempts: number; // count of runtime repair attempts made
  routesValid: boolean;          // whether all routes resolve to existing components
}

// ── V5.3: PROJECT KNOWLEDGE GRAPH ─────────────────────────────────────────────

export interface KGPage {
  name: string;
  path: string;
  route?: string;
  components: string[];
}

export interface KGComponent {
  name: string;
  file: string;
  usedBy: string[];
  section?: string; // hero, pricing, features, navigation, footer, dashboard, chart, auth
}

export interface KGApi {
  name: string;
  file: string;
  methods?: string[];
}

export interface KGDatabaseTable {
  name: string;
  relationships: string[];
}

export interface ProjectKnowledgeGraph {
  projectType: string;
  generatedAt: number;
  pages: KGPage[];
  components: KGComponent[];
  apis: KGApi[];
  databaseTables: KGDatabaseTable[];
  routes: string[];
  dependencies: string[];
  graphHealthScore: number;  // 0-100
  editContextHint?: string;  // quick summary for the edit LLM
}

// ── V5.4: REGISTRY TYPES ──────────────────────────────────────────────────────

export type RegistryCategory = 'hero' | 'pricing' | 'navbar' | 'dashboard' | 'features' | 'faq' | 'testimonials' | 'cta' | 'footer' | 'auth';

export type RegistrySelection = Partial<Record<RegistryCategory, string>>;

export interface RegistryHealth {
  coverageScore: number;
  reusedComponents: number;
  customComponents: number;
  lockedComponents: number;
  editCompatibility: number;
  totalSections: number;
  mappedSections: number;
}

// ── V5.5: REGISTRY FILE MAP ───────────────────────────────────────────────────

export type RegistryFileMap = Record<string, string[]>;

export function buildRegistryFileMap(files: ProjectFile[], registrySelection: RegistrySelection): RegistryFileMap {
  const map: RegistryFileMap = {};
  for (const [cat] of Object.entries(registrySelection)) {
    const lower = cat.toLowerCase();
    const matched = files.filter(f => {
      if (f.lang !== 'tsx' && f.lang !== 'jsx') return false;
      const fname = f.name.replace(/\.(tsx|jsx)$/, '').toLowerCase();
      return fname.includes(lower) || (f.path + f.name).toLowerCase().includes(lower);
    });
    if (matched.length > 0) map[cat] = matched.map(f => f.path + f.name);
  }
  return map;
}

// ── V5.5: COMPONENT HISTORY ───────────────────────────────────────────────────

// ── V6.0: RUNTIME ENGINE TYPES ────────────────────────────────────────────────

export type RuntimeStatus = 'idle' | 'installing' | 'validating' | 'running' | 'failed' | 'repaired';

export interface RuntimeLog {
  timestamp: number;
  type: 'info' | 'error' | 'warn' | 'success';
  message: string;
}

export interface BuildError {
  file: string;
  line?: number;
  col?: number;
  type: 'error' | 'warning' | 'info';
  message: string;
  rule?: string;
}

export interface RuntimeDependencies {
  packages: string[];
  devPackages: string[];
  packageJson: string;
  warnings: string[];
}

export interface RuntimeState {
  status: RuntimeStatus;
  buildPassed: boolean;
  runtimePassed: boolean;
  logs: RuntimeLog[];
  attempts: number;
  healthScore: number;
  buildErrors: BuildError[];
  warnings: BuildError[];
  dependencies: RuntimeDependencies | null;
  startedAt?: number;
  finishedAt?: number;
  filesValidated?: number;
  filesTotal?: number;
  missingImports?: Array<{ file: string; missingPackage: string }>;
  repairedFiles?: number;
  chatId?: string;
}

// ── V6.1: SELF-HEALING ENGINE TYPES ──────────────────────────────────────────

export interface RuntimeRepairRecord {
  id: string;
  timestamp: number;
  errorType: string;
  errorMessage: string;
  filesChanged: string[];
  attempt: number;
  success: boolean;
  qualityScore: number;
  duration: number;
}

export interface RepairMetrics {
  totalRepairs: number;
  successfulRepairs: number;
  failedRepairs: number;
  averageAttempts: number;
  successRate: number;
  mostCommonErrorType: string;
  averageQualityScore: number;
}

export interface RuntimeHealthV2 {
  overall: number;
  compile: number;
  runtime: number;
  repair: number;
  dependency: number;
  route: number;
}

// ── V6.2: 9-Dimension Health & Dependency Intelligence ───────────────────────

export interface RuntimeHealthV3 {
  overall: number;
  compile: number;
  runtime: number;
  repair: number;
  dependencies: number;
  routes: number;
  imports: number;
  packages: number;
  components: number;
  pages: number;
}

export interface TimelineEvent {
  timestamp: number;
  phase: string;
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'info';
  score?: number;
  detail?: string;
}

export interface RuntimeTimeline {
  chatId: string;
  startedAt: number;
  finishedAt?: number;
  events: TimelineEvent[];
  totalPasses: number;
  peakHealth: number;
  finalHealth: number;
}

export interface RuntimeImportResolution {
  file: string;
  importPath: string;
  resolved: boolean;
  autoInjected: boolean;
  reason?: string;
}

export interface RuntimeComponentResolution {
  name: string;
  definedIn?: string;
  usedIn: string[];
  resolved: boolean;
  stubGenerated: boolean;
}

export interface RuntimeRouteResolution {
  path: string;
  component: string;
  pageFile?: string;
  resolved: boolean;
  stubGenerated: boolean;
}

export interface RuntimePackageResolution {
  name: string;
  source: 'import' | 'feature' | 'inferred';
  required: boolean;
  inResolved: boolean;
}

export interface RuntimeDependencyGraph {
  imports: RuntimeImportResolution[];
  components: RuntimeComponentResolution[];
  routes: RuntimeRouteResolution[];
  packages: RuntimePackageResolution[];
  resolvedAt: number;
  totalImports: number;
  resolvedImports: number;
  unresolvedImports: number;
  totalComponents: number;
  resolvedComponents: number;
  missingComponents: number;
  totalRoutes: number;
  resolvedRoutes: number;
  missingRoutes: number;
  totalPackages: number;
  resolvedPackages: number;
  missingPackages: number;
  healthScore: number;
  injectedImports: number;
  generatedStubs: number;
}

export interface AutonomousBuildState {
  active: boolean;
  currentPass: number;
  maxPasses: number;
  phase: 'deps' | 'imports' | 'components' | 'routes' | 'packages' | 'sandbox' | 'loop' | 'health' | 'timeline' | 'gate' | 'done' | 'idle';
  healthScore: number;
  passScores: number[];
  previewGatePass: boolean;
  depGraph?: RuntimeDependencyGraph | null;
  healthV3?: RuntimeHealthV3 | null;
  timeline?: RuntimeTimeline | null;
}

export interface SelfHealingState {
  active: boolean;
  currentAttempt: number;
  maxAttempts: number;
  category: string;
  targetFile: string;
  phase: 'classify' | 'target' | 'generate' | 'validate' | 'done' | 'idle';
  lastQualityScore: number;
}

// ── V6.1: Repair history persistence ─────────────────────────────────────────

const REPAIR_HISTORY_KEY = (chatId: string) => `voxai_repair_history_${chatId}`;

export function saveRepairHistory(chatId: string, history: RuntimeRepairRecord[]): void {
  try { localStorage.setItem(REPAIR_HISTORY_KEY(chatId), JSON.stringify(history.slice(-50))); } catch {}
}

export function loadRepairHistory(chatId: string): RuntimeRepairRecord[] {
  try {
    const raw = localStorage.getItem(REPAIR_HISTORY_KEY(chatId));
    return raw ? (JSON.parse(raw) as RuntimeRepairRecord[]) : [];
  } catch { return []; }
}

export function clearRepairHistory(chatId: string): void {
  try { localStorage.removeItem(REPAIR_HISTORY_KEY(chatId)); } catch {}
}

export function computeRepairMetrics(history: RuntimeRepairRecord[]): RepairMetrics {
  if (history.length === 0) {
    return { totalRepairs: 0, successfulRepairs: 0, failedRepairs: 0, averageAttempts: 0, successRate: 0, mostCommonErrorType: 'none', averageQualityScore: 0 };
  }
  const successful = history.filter(r => r.success);
  const typeCounts: Record<string, number> = {};
  let totalAttempts = 0;
  let totalQuality = 0;
  for (const r of history) {
    typeCounts[r.errorType] = (typeCounts[r.errorType] ?? 0) + 1;
    totalAttempts += r.attempt;
    totalQuality += r.qualityScore;
  }
  const mostCommonErrorType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none';
  return {
    totalRepairs: history.length,
    successfulRepairs: successful.length,
    failedRepairs: history.length - successful.length,
    averageAttempts: Math.round((totalAttempts / history.length) * 10) / 10,
    successRate: Math.round((successful.length / history.length) * 100),
    mostCommonErrorType,
    averageQualityScore: Math.round(totalQuality / history.length),
  };
}

export interface ComponentHistoryEntry {
  componentName: string;
  timestamp: number;
  reason: 'generated' | 'replaced' | 'edit';
}

export type ComponentHistory = Record<string, ComponentHistoryEntry[]>;

const HISTORY_KEY = (chatId: string) => `voxai_comp_history_${chatId}`;

export function saveComponentHistory(chatId: string, history: ComponentHistory): void {
  try { localStorage.setItem(HISTORY_KEY(chatId), JSON.stringify(history)); } catch {}
}

export function loadComponentHistory(chatId: string): ComponentHistory | null {
  try {
    const raw = localStorage.getItem(HISTORY_KEY(chatId));
    return raw ? (JSON.parse(raw) as ComponentHistory) : null;
  } catch { return null; }
}

export function addComponentHistoryEntry(
  history: ComponentHistory,
  cat: string,
  componentName: string,
  reason: ComponentHistoryEntry['reason']
): ComponentHistory {
  const entries = history[cat] ?? [];
  return { ...history, [cat]: [...entries.slice(-9), { componentName, timestamp: Date.now(), reason }] };
}

// ── PHASE 2: GRAPH GENERATOR ──────────────────────────────────────────────────

export function buildKnowledgeGraph(files: ProjectFile[], blueprint?: ProjectBlueprint): ProjectKnowledgeGraph {
  const pages: KGPage[] = [];
  const components: KGComponent[] = [];
  const apis: KGApi[] = [];
  const databaseTables: KGDatabaseTable[] = [];
  const routes: string[] = [];
  const dependencies: string[] = [];

  // Component → page usage tracking
  const compUsedBy = new Map<string, Set<string>>();

  const tsxFiles = files.filter(f => f.lang === 'tsx' || f.lang === 'jsx');
  const pageFiles   = tsxFiles.filter(f => f.path.includes('pages/'));
  const compFiles   = tsxFiles.filter(f => f.path.includes('components/'));
  const appFile     = tsxFiles.find(f => f.name === 'App.tsx');

  // ── Pages ──
  for (const pf of pageFiles) {
    const pageName = pf.name.replace(/\.(tsx|jsx)$/, '');
    const used = compFiles
      .map(c => c.name.replace(/\.(tsx|jsx)$/, ''))
      .filter(cn => pf.content.includes(cn));
    for (const c of used) {
      if (!compUsedBy.has(c)) compUsedBy.set(c, new Set());
      compUsedBy.get(c)!.add(pageName);
    }
    // Extract route
    let route: string | undefined;
    if (appFile) {
      const routeRe = new RegExp(`path=["']([^"']+)["'][^>]*element=\\{<${pageName}`, 'g');
      const m = routeRe.exec(appFile.content);
      if (m) route = m[1];
    }
    pages.push({ name: pageName, path: pf.path + pf.name, route, components: used });
  }

  // ── Components ──
  for (const cf of compFiles) {
    const compName = cf.name.replace(/\.(tsx|jsx)$/, '');
    const usedBy = Array.from(compUsedBy.get(compName) || []);
    if (appFile && appFile.content.includes(compName) && !usedBy.includes('App')) usedBy.push('App');

    // Detect section type from name
    const lower = compName.toLowerCase();
    const section =
      lower.includes('hero')   ? 'hero' :
      lower.includes('pric') || lower.includes('plan') ? 'pricing' :
      lower.includes('nav')  || lower.includes('header') ? 'navigation' :
      lower.includes('footer')   ? 'footer' :
      lower.includes('dash')     ? 'dashboard' :
      lower.includes('chart') || lower.includes('analyt') ? 'chart' :
      lower.includes('auth') || lower.includes('login') || lower.includes('signup') ? 'auth' :
      lower.includes('feat')     ? 'features' :
      lower.includes('test') || lower.includes('review') ? 'testimonials' :
      lower.includes('cta')      ? 'cta' :
      lower.includes('faq')      ? 'faq' :
      undefined;

    components.push({ name: compName, file: cf.path + cf.name, usedBy, section });
  }

  // ── Single-page fallback (no pages/ folder) ──
  if (pages.length === 0 && appFile) {
    const usedComps = compFiles
      .map(f => f.name.replace(/\.(tsx|jsx)$/, ''))
      .filter(cn => appFile.content.includes(cn));
    if (usedComps.length > 0 || compFiles.length === 0) {
      pages.push({ name: 'Landing', path: 'src/App.tsx', route: '/', components: usedComps });
    }
  }

  // ── Routes from App.tsx ──
  if (appFile) {
    const pathRe = /path=["']([^"']+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = pathRe.exec(appFile.content)) !== null) {
      if (!routes.includes(m[1])) routes.push(m[1]);
    }
    if (routes.length === 0) routes.push('/');
  }

  // ── APIs ──
  const apiFiles = files.filter(f => f.path.includes('api/') && (f.lang === 'ts' || f.lang === 'js'));
  for (const af of apiFiles) {
    const apiName = af.name.replace(/\.(ts|js)$/, '');
    const methods: string[] = [];
    if (af.content.includes('.get('))    methods.push('GET');
    if (af.content.includes('.post('))   methods.push('POST');
    if (af.content.includes('.put('))    methods.push('PUT');
    if (af.content.includes('.delete(')) methods.push('DELETE');
    apis.push({ name: apiName, file: af.path + af.name, methods });
  }

  // ── Database tables ──
  const schemaFile = files.find(f => f.name.includes('schema') || f.name.includes('prisma'));
  if (schemaFile) {
    const modelRe = /model\s+(\w+)\s*\{/g;
    let m: RegExpExecArray | null;
    while ((m = modelRe.exec(schemaFile.content)) !== null) {
      databaseTables.push({ name: m[1], relationships: [] });
    }
  } else if (blueprint?.databaseTables) {
    for (const t of blueprint.databaseTables) {
      databaseTables.push({ name: t, relationships: blueprint.relationships?.filter(r => r.includes(t)) ?? [] });
    }
  }

  // ── Dependencies ──
  const pkgFile = files.find(f => f.name === 'package.json');
  if (pkgFile) {
    try {
      const pkg = JSON.parse(pkgFile.content);
      dependencies.push(...Object.keys({ ...pkg.dependencies }).slice(0, 20));
    } catch {}
  }
  if (blueprint?.dependencies) {
    for (const d of blueprint.dependencies) {
      if (!dependencies.includes(d)) dependencies.push(d);
    }
  }

  // ── Graph health ──
  const issues: string[] = [];
  for (const page of pages) {
    for (const c of page.components) {
      if (!components.some(k => k.name === c)) issues.push(`${page.name} refs missing component ${c}`);
    }
  }
  const graphHealthScore = Math.max(0, 100 - issues.length * 10);

  // ── Edit context hint ──
  const compSummary = components.slice(0, 8).map(c => `${c.name}${c.section ? `(${c.section})` : ''}`).join(', ');
  const editContextHint = `${blueprint?.projectType || 'Web App'} — Pages: ${pages.map(p => p.name).join(', ')} — Components: ${compSummary}`;

  return { projectType: blueprint?.projectType || 'Web App', generatedAt: Date.now(), pages, components, apis, databaseTables, routes, dependencies, graphHealthScore, editContextHint };
}

// ── PHASE 3: GRAPH STORAGE ────────────────────────────────────────────────────

const GRAPH_KEY = (id: string) => `voxai_graph_${id}`;

export function saveKnowledgeGraph(chatId: string, graph: ProjectKnowledgeGraph): void {
  try { localStorage.setItem(GRAPH_KEY(chatId), JSON.stringify(graph)); } catch {}
}

export function loadKnowledgeGraph(chatId: string): ProjectKnowledgeGraph | null {
  try {
    const raw = localStorage.getItem(GRAPH_KEY(chatId));
    return raw ? (JSON.parse(raw) as ProjectKnowledgeGraph) : null;
  } catch { return null; }
}

export function clearKnowledgeGraph(chatId: string): void {
  try { localStorage.removeItem(GRAPH_KEY(chatId)); } catch {}
}

// ── PHASE 3: GRAPH INDEXERS ───────────────────────────────────────────────────

export function findPage(graph: ProjectKnowledgeGraph, name: string): KGPage | null {
  const lower = name.toLowerCase();
  return graph.pages.find(p => p.name.toLowerCase().includes(lower) || (p.route ?? '').includes(lower)) ?? null;
}
export function findComponent(graph: ProjectKnowledgeGraph, name: string): KGComponent | null {
  const lower = name.toLowerCase();
  return graph.components.find(c => c.name.toLowerCase().includes(lower) || c.section === lower) ?? null;
}
export function findApi(graph: ProjectKnowledgeGraph, name: string): KGApi | null {
  const lower = name.toLowerCase();
  return graph.apis.find(a => a.name.toLowerCase().includes(lower)) ?? null;
}
export function findDatabaseTable(graph: ProjectKnowledgeGraph, name: string): KGDatabaseTable | null {
  const lower = name.toLowerCase();
  return graph.databaseTables.find(t => t.name.toLowerCase().includes(lower)) ?? null;
}
export function findRoute(graph: ProjectKnowledgeGraph, path: string): string | null {
  return graph.routes.find(r => r.includes(path)) ?? null;
}
export function findDependency(graph: ProjectKnowledgeGraph, name: string): string | null {
  const lower = name.toLowerCase();
  return graph.dependencies.find(d => d.toLowerCase().includes(lower)) ?? null;
}

// ── PHASE 4: EDIT TARGET RESOLUTION ──────────────────────────────────────────

export interface EditTargetResult {
  targetFiles: ProjectFile[];
  graphNodes: string[];
  resolved: boolean;
  filesLoaded: number;
  filesSkipped: number;
  tokensSaved: number;
}

export function resolveEditTargets(
  graph: ProjectKnowledgeGraph,
  editPrompt: string,
  files: ProjectFile[]
): EditTargetResult {
  const prompt = editPrompt.toLowerCase();
  const targetPaths = new Set<string>();
  const graphNodes: string[] = [];

  // 1. Exact component name match
  for (const comp of graph.components) {
    if (prompt.includes(comp.name.toLowerCase())) {
      targetPaths.add(comp.file);
      graphNodes.push(comp.name);
      // Also include pages that use this component
      for (const page of graph.pages) {
        if (page.components.includes(comp.name)) targetPaths.add(page.path);
      }
    }
  }

  // 2. Section keyword matching → find all components of that section
  const SECTION_KEYWORDS: Record<string, string> = {
    hero: 'hero', banner: 'hero', landing: 'hero',
    pric: 'pricing', plan: 'pricing', tier: 'pricing', subscription: 'pricing',
    nav: 'navigation', header: 'navigation', menu: 'navigation',
    footer: 'footer',
    dash: 'dashboard', analyt: 'dashboard', metric: 'dashboard',
    chart: 'chart', graph: 'chart', visual: 'chart',
    auth: 'auth', 'sign in': 'auth', 'sign up': 'auth', login: 'auth', signup: 'auth',
    feature: 'features', benefit: 'features',
    testimonial: 'testimonials', review: 'testimonials',
    cta: 'cta',
    faq: 'faq',
  };
  for (const [kw, section] of Object.entries(SECTION_KEYWORDS)) {
    if (prompt.includes(kw)) {
      for (const comp of graph.components) {
        if (comp.section === section) { targetPaths.add(comp.file); if (!graphNodes.includes(comp.name)) graphNodes.push(comp.name); }
      }
    }
  }

  // 3. Page name match
  for (const page of graph.pages) {
    if (prompt.includes(page.name.toLowerCase())) {
      targetPaths.add(page.path); graphNodes.push(page.name);
      for (const cn of page.components) {
        const comp = graph.components.find(c => c.name === cn);
        if (comp) targetPaths.add(comp.file);
      }
    }
  }

  // 4. API match
  for (const api of graph.apis) {
    if (prompt.includes(api.name.toLowerCase())) { targetPaths.add(api.file); graphNodes.push(api.name); }
  }

  // 5. Theme / global style → App.tsx
  const themeKws = ['dark', 'light', 'theme', 'color', 'font', 'brand', 'design', 'style'];
  if (themeKws.some(kw => prompt.includes(kw))) {
    const appFile = files.find(f => f.name === 'App.tsx');
    if (appFile) { targetPaths.add(appFile.path + appFile.name); if (!graphNodes.includes('App.tsx')) graphNodes.push('App.tsx'); }
    const themeFile = files.find(f => f.name.toLowerCase().includes('theme'));
    if (themeFile) targetPaths.add(themeFile.path + themeFile.name);
  }

  // 6. Route changes → App.tsx
  const routeKws = ['route', 'redirect', 'link', 'navigation', 'page'];
  if (routeKws.some(kw => prompt.includes(kw))) {
    const appFile = files.find(f => f.name === 'App.tsx');
    if (appFile) { targetPaths.add(appFile.path + appFile.name); if (!graphNodes.includes('App.tsx')) graphNodes.push('App.tsx'); }
  }

  // 7. Resolve paths → actual file objects
  const targetFiles = files.filter(f => {
    const fp = f.path + f.name;
    return targetPaths.has(fp) || targetPaths.has(f.name) || [...targetPaths].some(p => fp.endsWith(p) || p.endsWith(f.name));
  });

  if (targetFiles.length === 0) {
    return { targetFiles: [], graphNodes, resolved: false, filesLoaded: 0, filesSkipped: 0, tokensSaved: 0 };
  }

  const filesLoaded  = targetFiles.length;
  const filesSkipped = Math.max(0, files.length - filesLoaded);
  const tokensSaved  = filesSkipped * 150; // ~150 tokens/file average
  return { targetFiles, graphNodes, resolved: true, filesLoaded, filesSkipped, tokensSaved };
}

export function buildComponentRegistry(files: ProjectFile[]): ComponentRegistry {
  const registry: ComponentRegistry = {};
  for (const f of files) {
    if (f.lang !== 'tsx' && f.lang !== 'jsx') continue;
    const componentName = f.name.replace(/\.(tsx|jsx)$/, '');
    const path = f.path + f.name;
    const templateHint =
      path.includes('pages/') ? `page-${componentName.toLowerCase()}` :
      path.includes('components/') ? `component-${componentName.toLowerCase()}` :
      componentName.toLowerCase();
    registry[componentName] = templateHint;
  }
  return registry;
}

// ── V5.4: COMPONENT REGISTRY ──────────────────────────────────────────────────

const REGISTRY_KEY = (chatId: string) => `voxai_registry_${chatId}`;

export function saveRegistrySelection(chatId: string, selection: RegistrySelection, lockedComponents: string[]): void {
  try {
    localStorage.setItem(REGISTRY_KEY(chatId), JSON.stringify({ selection, lockedComponents }));
  } catch {}
}

export function loadRegistrySelection(chatId: string): { selection: RegistrySelection; lockedComponents: string[] } | null {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY(chatId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearRegistrySelection(chatId: string): void {
  try {
    localStorage.removeItem(REGISTRY_KEY(chatId));
  } catch {}
}

export function computeRegistryHealth(
  selection: RegistrySelection,
  sectionOrder: string[],
  lockedComponents: string[]
): RegistryHealth {
  const MAPPABLE = ['hero', 'pricing', 'navbar', 'features', 'faq', 'testimonials', 'cta', 'footer', 'dashboard', 'navigation', 'auth'];
  const mappable = sectionOrder.filter(s =>
    MAPPABLE.some(m => s.toLowerCase().replace(/\s+/g, '') === m || s.toLowerCase().includes(m))
  );
  const totalSections = mappable.length;
  const mappedSections = Object.keys(selection).length;
  const coverageScore = totalSections > 0 ? Math.min(100, Math.round((mappedSections / totalSections) * 100)) : 0;
  const reusedComponents = mappedSections;
  const editCompatibility = Math.min(100, reusedComponents * 12);
  return {
    coverageScore,
    reusedComponents,
    customComponents: Math.max(0, sectionOrder.length - mappedSections),
    lockedComponents: lockedComponents.length,
    editCompatibility,
    totalSections,
    mappedSections,
  };
}
