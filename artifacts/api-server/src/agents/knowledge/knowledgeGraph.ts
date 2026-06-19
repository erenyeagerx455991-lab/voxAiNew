import type {
  ProjectFileSSE,
  ProjectBlueprint,
  ServerKnowledgeGraph,
  ServerEditTargetResult,
  KGComponent,
  KGPage,
  KGApi,
  KGDbTable,
} from "../types.js";

export type {
  ServerKnowledgeGraph,
  ServerEditTargetResult,
  KGComponent,
  KGPage,
  KGApi,
  KGDbTable,
};

export function buildKnowledgeGraphServer(files: ProjectFileSSE[], blueprint: ProjectBlueprint): ServerKnowledgeGraph {
  const pages: KGPage[] = [];
  const components: KGComponent[] = [];
  const apis: KGApi[] = [];
  const databaseTables: KGDbTable[] = [];
  const routes: string[] = [];
  const dependencies: string[] = [];

  const compUsedBy = new Map<string, Set<string>>();
  const tsxFiles  = files.filter(f => f.lang === 'tsx' || f.lang === 'jsx');
  const pageFiles = tsxFiles.filter(f => f.path.includes('pages/'));
  const compFiles = tsxFiles.filter(f => f.path.includes('components/'));
  const appFile   = tsxFiles.find(f => f.name === 'App.tsx');

  for (const pf of pageFiles) {
    const pageName = pf.name.replace(/\.(tsx|jsx)$/, '');
    const used = compFiles.map(c => c.name.replace(/\.(tsx|jsx)$/, '')).filter(cn => pf.content.includes(cn));
    for (const c of used) { if (!compUsedBy.has(c)) compUsedBy.set(c, new Set()); compUsedBy.get(c)!.add(pageName); }
    let route: string | undefined;
    if (appFile) { const m = new RegExp(`path=["']([^"']+)["'][^>]*element=\\{<${pageName}`).exec(appFile.content); if (m) route = m[1]; }
    pages.push({ name: pageName, path: pf.path + pf.name, route, components: used });
  }

  for (const cf of compFiles) {
    const compName = cf.name.replace(/\.(tsx|jsx)$/, '');
    const usedBy = Array.from(compUsedBy.get(compName) || []);
    if (appFile && appFile.content.includes(compName) && !usedBy.includes('App')) usedBy.push('App');
    const lower = compName.toLowerCase();
    const section = lower.includes('hero') ? 'hero' : lower.includes('pric') || lower.includes('plan') ? 'pricing' : lower.includes('nav') || lower.includes('header') ? 'navigation' : lower.includes('footer') ? 'footer' : lower.includes('dash') ? 'dashboard' : lower.includes('chart') || lower.includes('analyt') ? 'chart' : lower.includes('auth') || lower.includes('login') || lower.includes('signup') ? 'auth' : lower.includes('feat') ? 'features' : undefined;
    components.push({ name: compName, file: cf.path + cf.name, usedBy, section });
  }

  if (pages.length === 0 && appFile) {
    const usedComps = compFiles.map(f => f.name.replace(/\.(tsx|jsx)$/, '')).filter(cn => appFile.content.includes(cn));
    pages.push({ name: 'Landing', path: 'src/App.tsx', route: '/', components: usedComps });
  }

  if (appFile) {
    const pathRe = /path=["']([^"']+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = pathRe.exec(appFile.content)) !== null) { if (!routes.includes(m[1])) routes.push(m[1]); }
    if (routes.length === 0) routes.push('/');
  }

  for (const af of files.filter(f => f.path.includes('api/') && (f.lang === 'ts' || f.lang === 'js'))) {
    const methods: string[] = [];
    if (af.content.includes('.get(')) methods.push('GET');
    if (af.content.includes('.post(')) methods.push('POST');
    if (af.content.includes('.put(')) methods.push('PUT');
    if (af.content.includes('.delete(')) methods.push('DELETE');
    apis.push({ name: af.name.replace(/\.(ts|js)$/, ''), file: af.path + af.name, methods });
  }

  if (blueprint.databaseTables) {
    for (const t of blueprint.databaseTables) {
      databaseTables.push({ name: t, relationships: blueprint.relationships?.filter(r => r.includes(t)) ?? [] });
    }
  }

  const pkgFile = files.find(f => f.name === 'package.json');
  if (pkgFile) {
    try {
      const pkg = JSON.parse(pkgFile.content) as { dependencies?: Record<string, string> };
      dependencies.push(...Object.keys(pkg.dependencies ?? {}).slice(0, 20));
    } catch {}
  }
  for (const d of blueprint.dependencies ?? []) { if (!dependencies.includes(d)) dependencies.push(d); }

  const issues: string[] = [];
  for (const page of pages) { for (const c of page.components) { if (!components.some(k => k.name === c)) issues.push(`${page.name} refs missing ${c}`); } }
  const graphHealthScore = Math.max(0, 100 - issues.length * 10);
  const editContextHint = `${blueprint.projectType} — Pages: ${pages.map(p => p.name).join(', ')} — Components: ${components.slice(0, 8).map(c => `${c.name}${c.section ? `(${c.section})` : ''}`).join(', ')}`;

  return { projectType: blueprint.projectType, generatedAt: Date.now(), pages, components, apis, databaseTables, routes, dependencies, graphHealthScore, editContextHint };
}

export function resolveEditTargetsServer(graph: ServerKnowledgeGraph, editPrompt: string, files: ProjectFileSSE[]): ServerEditTargetResult {
  const prompt = editPrompt.toLowerCase();
  const targetPaths = new Set<string>();
  const graphNodes: string[] = [];

  for (const comp of graph.components) {
    if (prompt.includes(comp.name.toLowerCase())) {
      targetPaths.add(comp.file); graphNodes.push(comp.name);
      for (const page of graph.pages) { if (page.components.includes(comp.name)) targetPaths.add(page.path); }
    }
  }

  const SECTION_KW: Record<string, string> = { hero: 'hero', banner: 'hero', pric: 'pricing', plan: 'pricing', nav: 'navigation', footer: 'footer', dash: 'dashboard', chart: 'chart', auth: 'auth', login: 'auth', feat: 'features' };
  for (const [kw, section] of Object.entries(SECTION_KW)) {
    if (prompt.includes(kw)) { for (const comp of graph.components) { if (comp.section === section) { targetPaths.add(comp.file); if (!graphNodes.includes(comp.name)) graphNodes.push(comp.name); } } }
  }

  for (const page of graph.pages) {
    if (prompt.includes(page.name.toLowerCase())) {
      targetPaths.add(page.path); graphNodes.push(page.name);
      for (const cn of page.components) { const c = graph.components.find(x => x.name === cn); if (c) targetPaths.add(c.file); }
    }
  }

  for (const api of graph.apis) { if (prompt.includes(api.name.toLowerCase())) { targetPaths.add(api.file); graphNodes.push(api.name); } }

  const themeKws = ['dark', 'light', 'theme', 'color', 'font', 'brand', 'style'];
  if (themeKws.some(kw => prompt.includes(kw))) {
    const appFile = files.find(f => f.name === 'App.tsx');
    if (appFile) { targetPaths.add(appFile.path + appFile.name); if (!graphNodes.includes('App.tsx')) graphNodes.push('App.tsx'); }
  }

  const targetFiles = files.filter(f => { const fp = f.path + f.name; return targetPaths.has(fp) || targetPaths.has(f.name) || [...targetPaths].some(p => fp.endsWith(p) || p.endsWith(f.name)); });
  if (targetFiles.length === 0) return { targetFiles: [], graphNodes, resolved: false, filesLoaded: 0, filesSkipped: 0, tokensSaved: 0 };

  const filesLoaded  = targetFiles.length;
  const filesSkipped = Math.max(0, files.length - filesLoaded);
  const tokensSaved  = filesSkipped * 150;
  return { targetFiles, graphNodes, resolved: true, filesLoaded, filesSkipped, tokensSaved };
}
