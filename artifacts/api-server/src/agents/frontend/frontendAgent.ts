import type { ProjectFileSSE, ProjectBlueprint } from "../types.js";
import { sseExtractFunctions, sseToTsxFile, validateTsxFile } from "./codeSystem.js";
import { resolveProjectDependencies } from "../config/configGenerators.js";

export function buildServerProjectFiles(
  code: string,
  pb: ProjectBlueprint,
  sectionOrder: string[]
): ProjectFileSSE[] {
  const files: ProjectFileSSE[] = [];
  const allFuncs = sseExtractFunctions(code);
  const sectionFuncs = allFuncs.filter(f => f.name !== 'App');

  const pages = (pb.pages && pb.pages.length > 0) ? pb.pages : ['Landing'];
  const hasMultiplePages = pages.length > 1;
  const pageNameSet = new Set(pages.map(p => p.toLowerCase()));

  const isPageComponent = (name: string) => {
    if (!hasMultiplePages) return false;
    const n = name.toLowerCase();
    return pageNameSet.has(n) ||
      pageNameSet.has(n.replace(/page$/, '').replace(/view$/, '').replace(/screen$/, ''));
  };

  const pageComponents: string[] = [];
  const sharedComponents: string[] = [];

  for (const f of sectionFuncs) {
    if (f.folder === 'src/pages/') {
      pageComponents.push(f.name);
    } else if (f.folder === 'src/components/' || !isPageComponent(f.name)) {
      sharedComponents.push(f.name);
    } else {
      pageComponents.push(f.name);
    }
  }

  for (const f of sectionFuncs) {
    const folder = f.folder !== 'src/'
      ? f.folder
      : (pageComponents.includes(f.name) ? 'src/pages/' : 'src/components/');
    const content = sseToTsxFile(f.name, f.body);
    const validation = validateTsxFile(f.name, content);
    if (!validation.valid) {
      console.warn(`[FileValidation] ${f.name}.tsx: ${validation.issues.join('; ')}`);
    }
    files.push({ path: folder, name: `${f.name}.tsx`, lang: 'tsx', content });
  }

  const useRouter = pageComponents.length > 0;
  let appContent: string;

  if (useRouter) {
    const pageImports = pageComponents.map(n => `import ${n} from './pages/${n}';`).join('\n');
    const sharedImports = sharedComponents.map(n => `import ${n} from './components/${n}';`).join('\n');
    const routes = pageComponents.map((n, i) => {
      const path = i === 0 ? '/' : `/${n.toLowerCase()}`;
      return `        <Route path="${path}" element={<${n} />} />`;
    }).join('\n');
    appContent = `import React from 'react';\nimport { BrowserRouter as Router, Routes, Route } from 'react-router-dom';\n${pageImports}\n${sharedImports ? '\n' + sharedImports : ''}\n\nexport default function App() {\n  return (\n    <Router>\n      <Routes>\n${routes}\n      </Routes>\n    </Router>\n  );\n}\n`;
  } else {
    const allImports = sectionFuncs.map(f => {
      const folder = pageComponents.includes(f.name) ? 'pages' : 'components';
      return `import ${f.name} from './${folder}/${f.name}';`;
    }).join('\n');
    const rendered = sectionFuncs.map(f => `    <${f.name} />`).join('\n');
    appContent = `import React from 'react';\n${allImports}\n\nexport default function App() {\n  return (\n    <div>\n${rendered}\n    </div>\n  );\n}\n`;
  }

  files.push({ path: 'src/', name: 'App.tsx', lang: 'tsx', content: appContent });

  files.push({
    path: 'src/', name: 'main.tsx', lang: 'tsx',
    content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode><App /></React.StrictMode>\n);\n`,
  });

  files.push({
    path: 'src/', name: 'index.css', lang: 'css',
    content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n* { box-sizing: border-box; }\nbody { margin: 0; }\n`,
  });

  files.push({
    path: 'src/lib/', name: 'utils.ts', lang: 'ts',
    content: `import { type ClassValue, clsx } from 'clsx';\nimport { twMerge } from 'tailwind-merge';\n\n/** shadcn/ui-compatible class merge utility */\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n\nexport function formatDate(date: Date | string): string {\n  return new Intl.DateTimeFormat('en-US', {\n    year: 'numeric', month: 'long', day: 'numeric',\n  }).format(new Date(date));\n}\n`,
  });

  const tableTypes = (pb.databaseTables || []).map(t => {
    const T = t.charAt(0).toUpperCase() + t.slice(1).replace(/s$/, '');
    return `export interface ${T} {\n  id: string;\n  createdAt: string;\n  updatedAt: string;\n}`;
  }).join('\n\n');
  files.push({
    path: 'src/types/', name: 'index.ts', lang: 'ts',
    content: `// Types for ${pb.projectType || 'project'}\n\nexport interface User {\n  id: string;\n  name: string;\n  email: string;\n  createdAt: string;\n}\n\n${tableTypes}\n`,
  });

  files.push({
    path: '', name: 'index.html', lang: 'html',
    content: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${pb.projectType || 'NexoGen App'}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
  });

  const { frontend: resolvedDeps, frontendDev: resolvedDevDeps } = resolveProjectDependencies(pb);
  const hasBackend = pb.apis.length > 0 || pb.databaseTables.length > 0 || pb.authNeeded;

  const pkgScripts: Record<string, string> = {
    dev:     hasBackend ? 'concurrently "vite" "cd backend && npm run dev"' : 'vite',
    build:   'tsc && vite build',
    preview: 'vite preview',
  };
  if (hasBackend) {
    pkgScripts['dev:frontend'] = 'vite';
    pkgScripts['install:all']  = 'npm install && npm install --prefix backend';
    (resolvedDeps as Record<string, string>).concurrently  = '^8.2.0';
  }

  files.push({
    path: '', name: 'package.json', lang: 'json',
    content: JSON.stringify({
      name: (pb.projectType || 'nexogen-app').toLowerCase().replace(/\s+/g, '-'),
      private: true, version: '0.1.0', type: 'module',
      scripts: pkgScripts,
      dependencies: resolvedDeps,
      devDependencies: resolvedDevDeps,
    }, null, 2),
  });

  const viteProxyBlock = hasBackend
    ? `,\n  server: {\n    proxy: {\n      '/api': {\n        target: 'http://localhost:3001',\n        changeOrigin: true,\n      },\n    },\n  }`
    : '';
  files.push({
    path: '', name: 'vite.config.ts', lang: 'ts',
    content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: { alias: { '@': '/src' } }${viteProxyBlock},\n});\n`,
  });

  files.push({
    path: '', name: 'tsconfig.json', lang: 'json',
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

  files.push({
    path: '', name: 'tailwind.config.ts', lang: 'ts',
    content: `import type { Config } from 'tailwindcss';\n\nexport default {\n  content: ['./index.html', './src/**/*.{ts,tsx}'],\n  theme: { extend: {} },\n  plugins: [],\n} satisfies Config;\n`,
  });

  files.push({
    path: '', name: 'postcss.config.js', lang: 'js',
    content: `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n`,
  });

  files.push({
    path: '', name: '.gitignore', lang: 'text',
    content: `# Dependencies\nnode_modules/\nbackend/node_modules/\n\n# Build output\ndist/\nbackend/dist/\n\n# Environment\n.env\n.env.local\n.env.*.local\n\n# Logs\n*.log\nnpm-debug.log*\n\n# OS\n.DS_Store\nThumbs.db\n\n# Prisma\nbackend/prisma/.env\n`,
  });

  if (hasBackend) {
    files.push({
      path: 'src/lib/', name: 'api.ts', lang: 'ts',
      content: `const API_BASE = import.meta.env.VITE_API_URL ?? '/api';\n\ntype FetchOptions = RequestInit & { data?: unknown };\n\nasync function request<T>(path: string, options: FetchOptions = {}): Promise<T> {\n  const { data, ...rest } = options;\n  const res = await fetch(\`\${API_BASE}\${path}\`, {\n    ...rest,\n    headers: { 'Content-Type': 'application/json', ...rest.headers },\n    body: data !== undefined ? JSON.stringify(data) : rest.body,\n  });\n  if (!res.ok) {\n    const err = await res.json().catch(() => ({ message: res.statusText }));\n    throw new Error(err.message ?? 'Request failed');\n  }\n  return res.json() as Promise<T>;\n}\n\nexport const api = {\n  get:    <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'GET', ...init }),\n  post:   <T>(path: string, data: unknown, init?: RequestInit) => request<T>(path, { method: 'POST', data, ...init }),\n  put:    <T>(path: string, data: unknown, init?: RequestInit) => request<T>(path, { method: 'PUT', data, ...init }),\n  patch:  <T>(path: string, data: unknown, init?: RequestInit) => request<T>(path, { method: 'PATCH', data, ...init }),\n  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'DELETE', ...init }),\n};\n`,
    });
  }

  if (pb.authNeeded && !['clerk', 'supabase'].includes((pb.authProvider || '').toLowerCase())) {
    files.push({
      path: 'src/hooks/', name: 'useAuth.ts', lang: 'ts',
      content: `import { useState, useEffect, useCallback } from 'react';\nimport { api } from '../lib/api';\n\ninterface User { id: string; name: string; email: string; }\ninterface AuthState { user: User | null; token: string | null; loading: boolean; }\n\nexport function useAuth() {\n  const [auth, setAuth] = useState<AuthState>({\n    user: null,\n    token: localStorage.getItem('auth_token'),\n    loading: true,\n  });\n\n  useEffect(() => {\n    if (!auth.token) { setAuth(s => ({ ...s, loading: false })); return; }\n    api.get<{ user: User }>('/auth/me')\n      .then(({ user }) => setAuth(s => ({ ...s, user, loading: false })))\n      .catch(() => { localStorage.removeItem('auth_token'); setAuth({ user: null, token: null, loading: false }); });\n  }, [auth.token]);\n\n  const login = useCallback(async (email: string, password: string) => {\n    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });\n    localStorage.setItem('auth_token', token);\n    setAuth({ user, token, loading: false });\n  }, []);\n\n  const logout = useCallback(() => {\n    localStorage.removeItem('auth_token');\n    setAuth({ user: null, token: null, loading: false });\n  }, []);\n\n  const register = useCallback(async (name: string, email: string, password: string) => {\n    const { token, user } = await api.post<{ token: string; user: User }>('/auth/register', { name, email, password });\n    localStorage.setItem('auth_token', token);\n    setAuth({ user, token, loading: false });\n  }, []);\n\n  return { ...auth, login, logout, register };\n}\n`,
    });
  }

  if (hasBackend) {
    const { backend: bDeps, backendDev: bDevDeps } = resolveProjectDependencies(pb);
    files.push({
      path: 'backend/', name: 'package.json', lang: 'json',
      content: JSON.stringify({
        name: (pb.projectType || 'nexogen-backend').toLowerCase().replace(/\s+/g, '-') + '-backend',
        private: true, version: '0.1.0',
        scripts: {
          dev:   'nodemon --exec tsx src/index.ts',
          build: 'tsc',
          start: 'node dist/index.js',
        },
        dependencies: bDeps,
        devDependencies: bDevDeps,
      }, null, 2),
    });

    files.push({
      path: 'backend/', name: 'tsconfig.json', lang: 'json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2020', module: 'CommonJS',
          lib: ['ES2020'], outDir: './dist', rootDir: './src',
          strict: true, esModuleInterop: true,
          skipLibCheck: true, resolveJsonModule: true,
          declaration: true, declarationMap: true, sourceMap: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      }, null, 2),
    });

    const apiRouteImports = pb.apis.slice(0, 8).map(route => {
      const name = route.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, c => c.toLowerCase());
      return `// import ${name}Router from './routes/${name}';`;
    }).join('\n');

    files.push({
      path: 'backend/src/', name: 'index.ts', lang: 'ts',
      content: `import express from 'express';\nimport cors from 'cors';\nimport dotenv from 'dotenv';\n${apiRouteImports ? '\n' + apiRouteImports : ''}\n\ndotenv.config();\n\nconst app = express();\nconst PORT = process.env.PORT ?? 3001;\n\n// ── Middleware ─────────────────────────────────────────────────────────────\napp.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));\napp.use(express.json());\napp.use(express.urlencoded({ extended: true }));\n\n// ── Routes ─────────────────────────────────────────────────────────────────\napp.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));\n\n// ── Server ─────────────────────────────────────────────────────────────────\napp.listen(PORT, () => {\n  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);\n});\n\nexport default app;\n`,
    });
  }

  return files;
}
