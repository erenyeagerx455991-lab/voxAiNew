export interface ProjectBlueprint {
  projectType: string;
  pages: string[];
  components: string[];
  databaseTables: string[];
  apis: string[];
  authNeeded: boolean;
  dashboardNeeded: boolean;
  techStack: {
    frontend: string;
    routing: string;
    ui: string;
    backend?: string;
    database?: string;
  };
  description?: string;
}

export interface ProjectFile {
  path: string;
  name: string;
  lang: string;
  content: string;
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
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #ff6b6b;
      min-height: 100vh;
      text-align: left;
    }
  </style>
  <script>
    window.addEventListener('error', function(e) {
      document.getElementById('root').style.display = 'none';
      var el = document.getElementById('__error');
      el.style.display = 'flex';
      var msg = e.error ? (e.error.message || String(e.error)) : (e.message || 'Unknown error');
      var lines = msg.split('\\n');
      var clean = lines.slice(0, 3).join('\\n');
      el.innerHTML = '<div style="max-width:540px"><div style="font-size:28px;margin-bottom:12px">⚠</div><div style="font-size:15px;font-weight:700;color:#ff6b6b;margin-bottom:8px">Preview Render Error</div><pre style="font-size:12px;color:#fca5a5;background:#2a1515;padding:12px;border-radius:8px;overflow:auto;white-space:pre-wrap;">' + clean.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</pre><div style="font-size:11px;color:#666;margin-top:10px">The AI-generated code has a syntax error. Try regenerating.</div></div>';
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
    ${sanitized}
    try {
      const rootEl = document.getElementById('root');
      const appRoot = ReactDOM.createRoot(rootEl);
      appRoot.render(React.createElement(App));
    } catch(e) {
      document.getElementById('root').style.display = 'none';
      var err = document.getElementById('__error');
      err.style.display = 'block';
      err.textContent = '⚠ Render error:\\n\\n' + (e && e.message ? e.message : String(e));
    }
  </script>
</body>
</html>`;
}
