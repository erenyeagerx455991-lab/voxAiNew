#!/usr/bin/env node
/**
 * NexoGen V6.4.1-B — Focused Repair Loop Validation
 * 25 organized scenarios (5 import + 5 ts + 5 jsx + 5 route + 5 dep)
 * REPAIR_CONCUR=2 to stay within Groq's 30 req/min rate limit
 * Reuses existing /tmp/nexogen-v641-shared (skips npm install)
 */
import { execSync, spawn } from 'child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, symlinkSync } from 'fs';
import { join } from 'path';

const SHARED    = '/tmp/nexogen-v641-shared';
const TEST_BASE = '/tmp/nexogen-v641b';
const GROQ_URL  = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL     = 'llama-3.1-8b-instant';
const RESULTS_FILE = '/tmp/v641b-results.json';
const BUILD_CONCUR  = 15;
const REPAIR_CONCUR = 2;   // conservative — stays within 30 req/min Groq limit
const MAX_PASSES    = 3;

const groqKey = process.env['GROQ_API_KEY'] ?? '';
if (!groqKey) { console.error('GROQ_API_KEY not set'); process.exit(1); }

const t0 = Date.now();
const elapsed = () => `${((Date.now()-t0)/1000).toFixed(1)}s`;

// ─── ANSI helpers ────────────────────────────────────────────────────────────
const B = s => `\x1b[1m${s}\x1b[0m`;
const G = s => `\x1b[32m${s}\x1b[0m`;
const R = s => `\x1b[31m${s}\x1b[0m`;
const Y = s => `\x1b[33m${s}\x1b[0m`;
const D = s => `\x1b[2m${s}\x1b[0m`;
const C = s => `\x1b[36m${s}\x1b[0m`;

// ─── Vite config ─────────────────────────────────────────────────────────────
const VITE_CONFIG = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
});
`.trim();

const INDEX_HTML = `<!doctype html>
<html><head><meta charset="UTF-8"/><title>Test</title></head>
<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>`;

const MAIN_TSX = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
createRoot(document.getElementById('root')!).render(<App />);`;

const PKG_JSON = JSON.stringify({
  name: 'test-proj',
  private: true,
  type: 'module',
  scripts: { build: 'vite build --mode production' },
  dependencies: {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
    'react-router-dom': '^6.27.0',
    'lucide-react': '^0.462.0',
    typescript: '^5.6.3',
  },
  devDependencies: {
    vite: '^5.4.10',
    '@vitejs/plugin-react': '^4.3.3',
    '@types/react': '^18.3.12',
    '@types/react-dom': '^18.3.1',
  },
}, null, 2);

const TSCONFIG = JSON.stringify({
  compilerOptions: {
    target: 'ES2020', useDefineForClassFields: true, lib: ['ES2020','DOM','DOM.Iterable'],
    module: 'ESNext', skipLibCheck: true, moduleResolution: 'bundler',
    allowImportingTsExtensions: true, isolatedModules: true, moduleDetection: 'force',
    noEmit: true, jsx: 'react-jsx', strict: false,
  },
  include: ['src'],
}, null, 2);

// ─── 25 Scenarios ────────────────────────────────────────────────────────────
const SCENARIOS = [
  // IMPORT (5) — missing components/hooks/services
  { id: 'imp-01', cat: 'import', name: 'Missing Navbar component',
    app: `import React from 'react';\nimport Navbar from './Navbar';\nexport default function App(){return(<div><Navbar/><main className="p-8"><h1 className="text-2xl font-bold">Dashboard</h1></main></div>);}` },
  { id: 'imp-02', cat: 'import', name: 'Missing useAuth hook',
    app: `import React from 'react';\nimport{useAuth}from './hooks/auth';\nexport default function App(){const{user,logout}=useAuth();return(<div className="min-h-screen p-8"><h1>Welcome {user?.name}</h1><button onClick={logout}>Logout</button></div>);}` },
  { id: 'imp-03', cat: 'import', name: 'Missing data service',
    app: `import React,{useEffect,useState}from 'react';\nimport{fetchUsers}from './services/users';\nexport default function App(){const[users,setUsers]=useState([]);useEffect(()=>{fetchUsers().then(setUsers);},[]);return(<div className="p-8"><h1 className="text-2xl font-bold mb-4">Users</h1>{users.map((u:any)=><div key={u.id} className="p-4 border rounded mb-2">{u.name}</div>)}</div>);}` },
  { id: 'imp-04', cat: 'import', name: 'Missing layout component',
    app: `import React from 'react';\nimport PageLayout from './layouts/PageLayout';\nimport{Settings}from 'lucide-react';\nexport default function App(){return(<PageLayout title="Settings"><div className="grid grid-cols-2 gap-6 p-6"><div className="bg-white rounded-xl p-6 border"><Settings size={24} className="mb-3 text-indigo-600"/><h3 className="font-semibold">Account</h3></div></div></PageLayout>);}` },
  { id: 'imp-05', cat: 'import', name: 'Missing ThemeContext',
    app: `import React from 'react';\nimport{ThemeProvider}from './context/ThemeContext';\nimport{Sun}from 'lucide-react';\nexport default function App(){return(<ThemeProvider><div className="min-h-screen p-8"><Sun size={20}/><h1 className="text-xl font-bold">Themed App</h1></div></ThemeProvider>);}` },

  // TYPESCRIPT (5) — syntax errors
  { id: 'ts-01', cat: 'typescript', name: 'Adjacent JSX roots',
    app: `import React from 'react';\nexport default function App(){return(<div className="p-8"><h1>Title</h1></div><div className="mt-4"><p>Content</p></div>);}` },
  { id: 'ts-02', cat: 'typescript', name: 'Unclosed JSX tag',
    app: `import React from 'react';\nexport default function App(){return(<div className="p-8"><h1 className="text-2xl font-bold">Hello World</h1><p className="mt-2 text-gray-600">Welcome to the app.</p></div>` },
  { id: 'ts-03', cat: 'typescript', name: 'Unterminated template literal',
    app: `import React,{useState}from 'react';\nexport default function App(){const[dark,setDark]=useState(false);const cls=\`min-h-screen \${dark?'bg-gray-900 text-white':'bg-white text-gray-900';\nreturn(<div className={cls}><button onClick={()=>setDark(d=>!d)}>Toggle</button></div>);}` },
  { id: 'ts-04', cat: 'typescript', name: 'Missing closing paren in map',
    app: `import React from 'react';\nconst items=[{id:1,text:'Alpha'},{id:2,text:'Beta'},{id:3,text:'Gamma'}];\nexport default function App(){return(<div className="p-8">{items.map(it=>(<div key={it.id} className="p-3 border rounded mb-2">{it.text}</div>)}</div>);}` },
  { id: 'ts-05', cat: 'typescript', name: 'Broken import destructuring',
    app: `import React,{useState useEffect}from 'react';\nexport default function App(){const[count,setCount]=useState(0);return(<div className="flex items-center justify-center min-h-screen"><button onClick={()=>setCount(c=>c+1)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl">{count}</button></div>);}` },

  // JSX (5) — structural JSX errors
  { id: 'jsx-01', cat: 'jsx', name: 'Unclosed outer div',
    app: `import React from 'react';\nexport default function App(){return(<div className="min-h-screen bg-gray-50 p-8"><h1 className="text-2xl font-bold mb-6">My App</h1><div className="grid grid-cols-3 gap-4"><div className="bg-white rounded-xl p-6 border"><h2 className="font-semibold">Card 1</h2></div><div className="bg-white rounded-xl p-6 border"><h2 className="font-semibold">Card 2</h2></div></div>;}` },
  { id: 'jsx-02', cat: 'jsx', name: 'Invalid attribute brace (unclosed)',
    app: `import React,{useState}from 'react';\nexport default function App(){const[open,setOpen]=useState(false);return(<div className="p-8"><button className={\`px-4 py-2 rounded \${open?'bg-indigo-600':'bg-gray-200'}\`} onClick={()=>setOpen(o=>!o)}>Toggle</button></div>);}` },
  { id: 'jsx-03', cat: 'jsx', name: 'Self-closing div with children',
    app: `import React from 'react';\nexport default function App(){return(<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="bg-white rounded-2xl shadow-sm border p-10 max-w-md w-full"/><h1 className="text-2xl font-bold text-center mb-2">Login</h1><p className="text-gray-500 text-center text-sm">Enter your credentials</p></div></div>);}` },
  { id: 'jsx-04', cat: 'jsx', name: 'Mismatched closing tags',
    app: `import React from 'react';\nexport default function App(){return(<section className="min-h-screen bg-white"><header className="border-b px-8 py-4"><h1 className="font-bold text-lg">Brand</h1></div><main className="p-8"><p className="text-gray-600">Main content goes here.</p></main></section>);}` },
  { id: 'jsx-05', cat: 'jsx', name: 'Missing closing brace in JSX expr',
    app: `import React from 'react';\nconst data=[{id:1,name:'Alice',role:'Admin'},{id:2,name:'Bob',role:'User'}];\nexport default function App(){return(<div className="p-8"><table className="w-full border-collapse"><tbody>{data.map(row=>(<tr key={row.id} className="border-b"><td className="px-4 py-3">{row.name</td><td className="px-4 py-3 text-gray-500">{row.role}</td></tr>))}</tbody></table></div>);}` },

  // ROUTE (5) — routing errors
  { id: 'rt-01', cat: 'route', name: 'Route uses undefined Dashboard',
    app: `import React from 'react';\nimport{BrowserRouter,Routes,Route}from 'react-router-dom';\nexport default function App(){return(<BrowserRouter><Routes><Route path="/" element={<Dashboard/>}/><Route path="/about" element={<AboutPage/>}/></Routes></BrowserRouter>);}` },
  { id: 'rt-02', cat: 'route', name: 'createBrowserRouter missing components',
    app: `import React from 'react';\nimport{RouterProvider,createBrowserRouter}from 'react-router-dom';\nconst router=createBrowserRouter([{path:'/',element:<HomePage/>},{path:'/profile',element:<ProfilePage/>}]);\nexport default function App(){return<RouterProvider router={router}/>;}` },
  { id: 'rt-03', cat: 'route', name: 'Nested routes missing components',
    app: `import React from 'react';\nimport{BrowserRouter,Routes,Route}from 'react-router-dom';\nexport default function App(){return(<BrowserRouter><Routes><Route path="/" element={<RootLayout/>}><Route index element={<Home/>}/><Route path="settings" element={<Settings/>}/></Route></Routes></BrowserRouter>);}` },
  { id: 'rt-04', cat: 'route', name: 'Auth guard missing PrivateRoute',
    app: `import React from 'react';\nimport{BrowserRouter,Routes,Route,Navigate}from 'react-router-dom';\nimport{useAuth}from './hooks/auth';\nexport default function App(){const{isAuthed}=useAuth();return(<BrowserRouter><Routes><Route path="/" element={isAuthed?<Dashboard/>:<Navigate to="/login"/>}/><Route path="/login" element={<LoginPage/>}/></Routes></BrowserRouter>);}` },
  { id: 'rt-05', cat: 'route', name: 'Routes outside BrowserRouter',
    app: `import React from 'react';\nimport{Routes,Route}from 'react-router-dom';\nimport HomePage from './pages/Home';\nimport AboutPage from './pages/About';\nexport default function App(){return(<Routes><Route path="/" element={<HomePage/>}/><Route path="/about" element={<AboutPage/>}/></Routes>);}` },

  // DEPENDENCY (5) — uninstalled packages
  { id: 'dep-01', cat: 'dependency', name: 'react-helmet not installed',
    app: `import React from 'react';\nimport Helmet from 'react-helmet';\nexport default function App(){return(<><Helmet><title>My App</title><meta name="description" content="Welcome"/></Helmet><div className="min-h-screen bg-white p-8"><h1 className="text-3xl font-bold">Home</h1></div></>);}` },
  { id: 'dep-02', cat: 'dependency', name: 'styled-components not installed',
    app: `import React from 'react';\nimport styled from 'styled-components';\nconst Card=styled.div\`background:white;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.1);\`;\nexport default function App(){return(<div style={{padding:32}}><Card><h2>Styled Card</h2><p>Content goes here</p></Card></div>);}` },
  { id: 'dep-03', cat: 'dependency', name: '@tanstack/react-table not installed',
    app: `import React from 'react';\nimport{useReactTable,getCoreRowModel,flexRender}from '@tanstack/react-table';\nconst data=[{name:'Alice',email:'alice@ex.com'},{name:'Bob',email:'bob@ex.com'}];\nconst columns=[{accessorKey:'name',header:'Name'},{accessorKey:'email',header:'Email'}];\nexport default function App(){const table=useReactTable({data,columns,getCoreRowModel:getCoreRowModel()});return(<div className="p-8"><table>{table.getRowModel().rows.map(r=><tr key={r.id}>{r.getVisibleCells().map(c=><td key={c.id}>{flexRender(c.column.columnDef.cell,c.getContext())}</td>)}</tr>)}</table></div>);}` },
  { id: 'dep-04', cat: 'dependency', name: 'react-hot-toast not installed',
    app: `import React from 'react';\nimport toast,{Toaster}from 'react-hot-toast';\nexport default function App(){return(<div className="min-h-screen flex items-center justify-center bg-gray-50"><Toaster/><button onClick={()=>toast.success('Saved!')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium">Save</button></div>);}` },
  { id: 'dep-05', cat: 'dependency', name: 'react-spring not installed',
    app: `import React,{useState}from 'react';\nimport{useSpring,animated}from 'react-spring';\nexport default function App(){const[flip,setFlip]=useState(false);const props=useSpring({opacity:flip?1:0.3,from:{opacity:0}});return(<div className="min-h-screen flex flex-col items-center justify-center gap-8"><animated.div style={props} className="text-4xl font-bold">Hello</animated.div><button onClick={()=>setFlip(f=>!f)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl">Animate</button></div>);}` },
];

// ─── Utility: run concurrently ────────────────────────────────────────────────
async function concurrentLimit(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ─── Workspace setup ──────────────────────────────────────────────────────────
function setupWorkspace(id, appCode) {
  const dir = join(TEST_BASE, id);
  const src = join(dir, 'src');
  mkdirSync(src, { recursive: true });
  writeFileSync(join(dir, 'package.json'), PKG_JSON);
  writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
  writeFileSync(join(dir, 'vite.config.ts'), VITE_CONFIG);
  writeFileSync(join(dir, 'index.html'), INDEX_HTML);
  writeFileSync(join(src, 'main.tsx'), MAIN_TSX);
  writeFileSync(join(src, 'App.tsx'), appCode);
  // symlink node_modules from shared workspace
  const nm = join(dir, 'node_modules');
  if (!existsSync(nm)) {
    symlinkSync(join(SHARED, 'node_modules'), nm);
  }
  return dir;
}

// ─── Build ────────────────────────────────────────────────────────────────────
function buildWorkspace(dir) {
  return new Promise(resolve => {
    const t = Date.now();
    const child = spawn('node', [join(SHARED, 'node_modules/.bin/vite'), 'build', '--mode', 'production'],
      { cwd: dir, env: { ...process.env, NODE_ENV: 'production' }, stdio: ['ignore','pipe','pipe'] });
    let out = '';
    child.stdout.on('data', d => { out += d.toString(); });
    child.stderr.on('data', d => { out += d.toString(); });
    child.on('close', code => resolve({ ok: code === 0, output: out, ms: Date.now()-t }));
    setTimeout(() => { child.kill(); resolve({ ok: false, output: 'BUILD_TIMEOUT', ms: Date.now()-t }); }, 40000);
  });
}

// ─── Error classifier ─────────────────────────────────────────────────────────
function classifyError(output) {
  if (/Cannot find module|Failed to resolve import|does not provide an export/i.test(output)) return 'import';
  if (/is not installed|cannot be found|ENOENT.*node_modules/i.test(output)) return 'dependency';
  if (/error TS\d+|type error/i.test(output)) return 'typescript';
  if (/JSX|Unexpected token|Expected closing|Unterminated/i.test(output)) return 'jsx';
  return 'build';
}

// ─── Groq repair ─────────────────────────────────────────────────────────────
async function callRepair(scenario, buildOutput, attempt) {
  const sysPrompt = `You are a React/TypeScript expert. Fix broken App.tsx files.
Rules:
- Return ONLY the corrected App.tsx content, no markdown fences, no explanation.
- The app must compile with Vite and use only: react, react-dom, react-router-dom, lucide-react.
- Do NOT import styled-components, react-helmet, react-hot-toast, react-spring, @tanstack/react-table or any other unlisted packages.
- Do NOT import local files from ./Navbar, ./hooks/auth, ./services/*, ./layouts/*, ./context/*, ./pages/*, ./stores/*, ./components/* unless you define them inline in the same file.
- Keep the original purpose/design intent of the component.
- Make the simplest possible fix.`;

  const userPrompt = `Fix this broken App.tsx (attempt ${attempt}):

BUILD ERROR:
${buildOutput.slice(-1200)}

CURRENT App.tsx:
${scenario.currentCode}

Return only the fixed App.tsx code.`;

  try {
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
        max_tokens: 1200,
        temperature: 0.15,
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return { code: '', err: `HTTP ${resp.status}: ${txt.slice(0,100)}` };
    }
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    const code = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    return { code, err: null };
  } catch (e) {
    return { code: '', err: String(e) };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log(B('═'.repeat(64)));
console.log(B('  NexoGen V6.4.1-B — Repair Loop Stress Test (25 scenarios)'));
console.log(B('═'.repeat(64)));
console.log(`  Node: ${process.version}   Groq: ${MODEL}`);
console.log(`  Build concur: ${BUILD_CONCUR}   Repair concur: ${REPAIR_CONCUR}   Max passes: ${MAX_PASSES}`);
console.log(`  Shared workspace: ${SHARED}`);
console.log();

// Check shared workspace
if (!existsSync(join(SHARED, 'node_modules/.bin/vite'))) {
  console.error(R('✗ Shared workspace missing. Run run-v641.mjs first.'));
  process.exit(1);
}
console.log(G('✓') + ' Shared workspace ready (skipping npm install)');
console.log();

// Create test workspaces
console.log(B('Creating 25 test workspaces...'));
mkdirSync(TEST_BASE, { recursive: true });
const state = SCENARIOS.map(s => {
  const dir = setupWorkspace(s.id, s.app);
  return { ...s, dir, currentCode: s.app, passed: false, passedOnPass: -1,
           repairs: [], buildOutput: '', errType: '', timings: [] };
});
console.log(G('✓') + ` 25 workspaces created in ${TEST_BASE}`);
console.log();

// ─── Multi-pass repair loop ───────────────────────────────────────────────────
let remaining = state.slice(); // scenarios still needing work

for (let pass = 0; pass < MAX_PASSES; pass++) {
  const passLabel = pass === 0 ? 'Initial build' : `Repair pass ${pass}`;
  console.log(B(`Pass ${pass+1}/${MAX_PASSES}`) + D(` — ${passLabel} (${remaining.length} scenarios)`));

  const buildResults = await concurrentLimit(remaining, BUILD_CONCUR, async (s) => {
    const bt = Date.now();
    const { ok, output, ms } = await buildWorkspace(s.dir);
    s.timings.push(ms);
    if (ok) {
      s.passed = true;
      s.passedOnPass = pass;
      console.log(`  ${G('✓')} ${D(`[${s.id}] ${s.name} (${(ms/1000).toFixed(1)}s)`)}`);
    } else {
      s.buildOutput = output;
      s.errType = classifyError(output);
      console.log(`  ${R('✗')} ${D(`[${s.id}] ${s.name} → ${C(s.errType)} (${(ms/1000).toFixed(1)}s)`)}`);
    }
    return s;
  });

  // Filter out passed scenarios
  remaining = remaining.filter(s => !s.passed);
  if (remaining.length === 0) break;

  // Last pass — no repair needed
  if (pass === MAX_PASSES - 1) break;

  // Repair failures via Groq
  const rt0 = Date.now();
  console.log(`  ${Y('~')} Repairing ${remaining.length} failures via Groq (concur=${REPAIR_CONCUR})...`);

  let repairOk = 0, repairFail = 0;
  await concurrentLimit(remaining, REPAIR_CONCUR, async (s) => {
    const { code, err } = await callRepair(s, s.buildOutput, pass + 1);
    if (code && code.length > 30) {
      s.repairs.push({ pass, code, err: null });
      s.currentCode = code;
      // Write repaired code to workspace
      writeFileSync(join(s.dir, 'src', 'App.tsx'), code);
      repairOk++;
    } else {
      s.repairs.push({ pass, code: '', err: err || 'empty response' });
      repairFail++;
      if (err) console.log(`  ${Y('!')} [${s.id}] repair error: ${err.slice(0,80)}`);
    }
  });

  const repairMs = ((Date.now()-rt0)/1000).toFixed(1);
  console.log(`  ${G('✓')} Repair batch complete — ${repairOk} fixed, ${repairFail} failed ${D(`(${repairMs}s)`)}`);
  console.log();
}

// ─── Final Report ─────────────────────────────────────────────────────────────
const totalPassed = state.filter(s => s.passed).length;
const totalFailed = state.filter(s => !s.passed).length;
const repairedScenarios = state.filter(s => s.passed && s.passedOnPass > 0);
const firstPassOk = state.filter(s => s.passed && s.passedOnPass === 0);

// Category breakdown
const cats = ['import','typescript','jsx','route','dependency'];
const catStats = cats.map(cat => {
  const group = state.filter(s => s.cat === cat);
  const passed = group.filter(s => s.passed).length;
  return { cat, total: group.length, passed, failed: group.length - passed };
});

console.log();
console.log(B('═'.repeat(64)));
console.log(B('  V6.4.1 VALIDATION REPORT'));
console.log(B('═'.repeat(64)));
console.log();
console.log(`  Total scenarios  : ${B(String(state.length))}`);
console.log(`  Final pass rate  : ${B(`${totalPassed}/${state.length}`)} (${((totalPassed/state.length)*100).toFixed(1)}%)`);
console.log(`  First-pass pass  : ${firstPassOk.length}/${state.length} (expected low — these are broken)`);
console.log(`  Repaired (≥1 pass): ${repairedScenarios.length}`);
console.log(`  Unrecoverable    : ${totalFailed}`);
console.log();
console.log(B('  Category Breakdown:'));
for (const { cat, total, passed, failed } of catStats) {
  const bar = '█'.repeat(passed) + '░'.repeat(failed);
  const pct = ((passed/total)*100).toFixed(0);
  console.log(`  ${cat.padEnd(12)} ${bar}  ${passed}/${total} (${pct}%)`);
}
console.log();
console.log(B('  Repair success per pass:'));
for (let p = 0; p < MAX_PASSES; p++) {
  const cnt = state.filter(s => s.passedOnPass === p).length;
  if (cnt > 0 || p < MAX_PASSES-1) {
    const label = p === 0 ? 'initial build' : `repair pass ${p}`;
    console.log(`  Pass ${p+1} (${label}): ${cnt} scenarios passed`);
  }
}
console.log();
console.log(B('  Scenarios repaired by Groq:'));
if (repairedScenarios.length === 0) {
  console.log(`  ${Y('~')} No scenarios repaired — check Groq rate limits or repair logic`);
} else {
  for (const s of repairedScenarios) {
    console.log(`  ${G('✓')} [${s.id}] ${s.name} — fixed on pass ${s.passedOnPass+1}`);
  }
}
console.log();
console.log(B('  Unrecoverable failures:'));
if (totalFailed === 0) {
  console.log(`  ${G('✓')} All scenarios resolved!`);
} else {
  for (const s of state.filter(s => !s.passed)) {
    const lastErr = s.buildOutput.split('\n').find(l => /error/i.test(l))?.trim().slice(0,80) ?? '(no error line)';
    console.log(`  ${R('✗')} [${s.id}] ${s.name} — ${D(lastErr)}`);
  }
}
console.log();
console.log(`  Total elapsed: ${elapsed()}`);
console.log(B('═'.repeat(64)));

// Save machine-readable results
const report = { ts: new Date().toISOString(), totalPassed, totalFailed, scenarios: state.length,
  firstPassOk: firstPassOk.length, repairedByGroq: repairedScenarios.length,
  catStats, byId: Object.fromEntries(state.map(s => [s.id, { passed: s.passed, passedOnPass: s.passedOnPass, cat: s.cat, repairs: s.repairs.length }])) };
writeFileSync(RESULTS_FILE, JSON.stringify(report, null, 2));
console.log(D(`  Results saved → ${RESULTS_FILE}`));
console.log();
