import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Eye, Files, Copy, Check, Search, ChevronRight, ChevronDown,
  FileCode2, FileJson, FileText, Globe, X, Monitor, Folder, Download,
  Undo2, Redo2, ShieldCheck, Wrench, AlertTriangle, Cpu, Zap, Route,
  Network, LayoutDashboard, Component, Database, GitBranch, Package,
  Lock, LockOpen, BookOpen, PackageCheck, Activity, CheckCircle2,
  XCircle, Circle, PackagePlus, TerminalSquare,
  Smartphone, Tablet, RefreshCw, Maximize2, Minimize2,
} from 'lucide-react';
import { buildPreviewHtml, buildPreviewHtmlFromFiles, generateProjectFiles } from '../services/builderService';
import type { ProjectBlueprint, ProjectFile, DNAComposition, ThemeTokens, MotionProfile, EditDiff, BuildHealth, ProjectKnowledgeGraph, RegistrySelection, RegistryHealth, RegistryFileMap, ComponentHistory, RuntimeState, RuntimeRepairRecord, RepairMetrics, SelfHealingState, RuntimeHealthV3, RuntimeTimeline, AutonomousBuildState } from '../services/builderService';
import type { RegistryHealthV2, EditImpact } from '../services/mockAiService';
import { exportProjectZip } from '../services/mockAiService';
import type { ProjectTemplate } from '../services/templateMarketplace';
import TemplateMarketplacePanel from './TemplateMarketplacePanel';
import DNACompositionPanel from './DNACompositionPanel';
import type { SectionOwnership } from '../lib/componentOwnership';

interface Props {
  code: string;
  isBuilding: boolean;
  buildStep: number;
  projectBlueprint?: ProjectBlueprint | null;
  sectionOrder?: string[];
  /** Server-generated project files (source of truth). Falls back to client-side generation. */
  projectFiles?: ProjectFile[];
  dnaComposition?: DNAComposition | null;
  sectionOwnership?: SectionOwnership | null;
  themeTokens?: ThemeTokens | null;
  motionProfile?: MotionProfile | null;
  lastEditDiff?: EditDiff | null;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  buildHealth?: BuildHealth | null;
  onRuntimeError?: (err: { file: string; message: string; stack?: string; component?: string }) => void;
  knowledgeGraph?: ProjectKnowledgeGraph | null;
  registrySelection?: RegistrySelection | null;
  registryHealth?: RegistryHealth | null;
  lockedComponents?: string[];
  onLockComponent?: (cat: string) => void;
  onUnlockComponent?: (cat: string) => void;
  registryFileMap?: RegistryFileMap | null;
  componentHistory?: ComponentHistory | null;
  editSafetyScore?: number;
  lastEditImpact?: { affectedSections: string[]; lockedConflicts: string[] } | null;
  selectedTemplate?: ProjectTemplate | null;
  onSelectTemplate?: (t: ProjectTemplate) => void;
  onClearTemplate?: () => void;
  autoMatchedTemplate?: { templateId: string; templateName: string; confidence: number } | null;
  runtimeState?: RuntimeState | null;
  repairHistory?: RuntimeRepairRecord[];
  repairMetrics?: RepairMetrics | null;
  selfHealingState?: SelfHealingState | null;
  runtimeHealthV3?: RuntimeHealthV3 | null;
  runtimeTimeline?: RuntimeTimeline | null;
  autonomousBuildState?: AutonomousBuildState | null;
}

// ── V5.4: Component Registry Panel ───────────────────────────────────────────

const DNA_BRAND_COLORS: Record<string, string> = {
  stripe: 'text-violet-400', linear: 'text-indigo-400', framer: 'text-pink-400',
  vercel: 'text-gray-300', notion: 'text-amber-400', cursor: 'text-emerald-400', raycast: 'text-orange-400',
};

function extractComponentName(hint: string): string {
  return hint.split(' ')[0] ?? hint;
}

function extractComponentBrand(name: string): string {
  const lower = name.toLowerCase();
  for (const b of ['stripe', 'linear', 'framer', 'vercel', 'notion', 'cursor', 'raycast']) {
    if (lower.includes(b)) return b;
  }
  return 'linear';
}

function RegistryPanel({
  selection,
  health,
  lockedComponents,
  onLock,
  onUnlock,
  lastEditDiff,
  registryFileMap,
  componentHistory,
  editSafetyScore,
}: {
  selection: RegistrySelection;
  health?: RegistryHealth | null;
  lockedComponents: string[];
  onLock: (cat: string) => void;
  onUnlock: (cat: string) => void;
  lastEditDiff?: EditDiff | null;
  registryFileMap?: RegistryFileMap | null;
  componentHistory?: ComponentHistory | null;
  editSafetyScore?: number;
}) {
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const entries = Object.entries(selection) as [string, string][];
  const coverageScore = health?.coverageScore ?? Math.round((entries.length / Math.max(entries.length, 6)) * 100);
  const scoreColor = coverageScore >= 80 ? 'text-emerald-400' : coverageScore >= 50 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = coverageScore >= 80 ? 'border-emerald-500/30 bg-emerald-500/5' : coverageScore >= 50 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5';
  const safetyScore = editSafetyScore ?? 100;
  const safetyColor = safetyScore >= 90 ? 'text-emerald-400' : safetyScore >= 70 ? 'text-yellow-400' : 'text-red-400';

  const getEditStatus = (cat: string): 'preserved' | 'modified' | 'replaced' | null => {
    if (!lastEditDiff || !registryFileMap) return null;
    const catFiles = registryFileMap[cat] ?? [];
    if (catFiles.length === 0) return null;
    if (catFiles.some(fp => lastEditDiff.changedFiles.includes(fp))) return 'modified';
    if (catFiles.some(fp => lastEditDiff.deletedFiles.includes(fp))) return 'replaced';
    if (lockedComponents.includes(cat) && lastEditDiff.changedFiles.length > 0) return 'preserved';
    return null;
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Health header */}
      <div className={`mx-3 my-2 rounded-lg border px-3 py-2 ${scoreBg}`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <PackageCheck size={12} className={scoreColor} />
            <span className="text-[11px] font-semibold text-gray-300">Component Registry</span>
            <span className="text-[10px] text-gray-500">V5.5</span>
          </div>
          <div className="flex items-center gap-2">
            {lastEditDiff && (
              <span className={`text-[10px] font-bold ${safetyColor}`} title="Edit Safety Score">🛡 {safetyScore}%</span>
            )}
            <span className={`text-[14px] font-bold ${scoreColor}`}>{coverageScore}%</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 text-center">
          {[
            ['Selected', entries.length],
            ['Locked', lockedComponents.length],
            ['Sections', health?.totalSections ?? entries.length],
            ['Compat', `${health?.editCompatibility ?? 0}%`],
          ].map(([label, val]) => (
            <div key={String(label)} className="bg-white/5 rounded px-1 py-0.5">
              <div className="text-[12px] font-bold text-gray-200">{val}</div>
              <div className="text-[9px] text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Component list */}
      <div className="px-3 pb-2">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-1">
          Selected Variants
        </div>
        <div className="space-y-1">
          {entries.map(([cat, hint]) => {
            const compName = extractComponentName(hint);
            const brand = extractComponentBrand(compName);
            const brandColor = DNA_BRAND_COLORS[brand] ?? 'text-gray-400';
            const isLocked = lockedComponents.includes(cat);
            const descStart = hint.indexOf(' — ');
            const desc = descStart > -1 ? hint.slice(descStart + 3) : '';
            const editStatus = getEditStatus(cat);
            const historyEntries = componentHistory?.[cat] ?? [];
            const isShowingHistory = showHistory === cat;
            return (
              <div key={cat} className="rounded-lg border overflow-hidden">
                <div
                  className={`px-2.5 py-2 flex items-start gap-2 transition-colors ${
                    isLocked ? 'border-indigo-500/30 bg-indigo-500/5' : 'bg-white/3 hover:bg-white/5'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-14 shrink-0">{cat}</span>
                      <span className={`text-[12px] font-semibold ${brandColor}`}>{compName}</span>
                      {isLocked && <Lock size={9} className="text-indigo-400 shrink-0" />}
                      {editStatus === 'preserved' && (
                        <span className="text-[9px] font-bold px-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ Preserved</span>
                      )}
                      {editStatus === 'modified' && (
                        <span className="text-[9px] font-bold px-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">~ Modified</span>
                      )}
                      {editStatus === 'replaced' && (
                        <span className="text-[9px] font-bold px-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">↺ Replaced</span>
                      )}
                    </div>
                    {desc && <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-1">{desc}</p>}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                    {historyEntries.length > 0 && (
                      <button
                        onClick={() => setShowHistory(isShowingHistory ? null : cat)}
                        title="Component history"
                        className="p-1 rounded text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-colors"
                      >
                        <GitBranch size={10} />
                      </button>
                    )}
                    <button
                      onClick={() => isLocked ? onUnlock(cat) : onLock(cat)}
                      title={isLocked ? `Unlock ${cat}` : `Lock ${cat} — AI won't change this on edits`}
                      className={`p-1 rounded transition-colors ${
                        isLocked
                          ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'
                          : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      {isLocked ? <Lock size={11} /> : <LockOpen size={11} />}
                    </button>
                  </div>
                </div>
                {/* Component History */}
                {isShowingHistory && historyEntries.length > 0 && (
                  <div className="border-t border-white/5 bg-white/2 px-3 py-1.5">
                    <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">History</p>
                    {[...historyEntries].reverse().map((entry, i) => (
                      <div key={i} className="flex items-center gap-1.5 py-0.5">
                        <span className={`text-[9px] font-bold w-12 shrink-0 ${
                          entry.reason === 'replaced' ? 'text-blue-400' :
                          entry.reason === 'generated' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>{entry.reason}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{entry.componentName}</span>
                        <span className="text-[9px] text-gray-600 ml-auto">{new Date(entry.timestamp).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {entries.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-[12px]">
            No registry selection yet — build a project to see selected components.
          </div>
        )}
      </div>

      {lockedComponents.length > 0 && (
        <div className="mx-3 mb-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2">
          <p className="text-[10px] text-indigo-300">
            <Lock size={9} className="inline mr-1" />
            <strong>{lockedComponents.length}</strong> locked component{lockedComponents.length !== 1 ? 's' : ''} — AI will preserve {lockedComponents.length !== 1 ? 'their' : 'its'} structure on edits.
          </p>
        </div>
      )}

      <div className="pb-4" />
    </div>
  );
}

// ── V5.3: Knowledge Graph Panel ────────────────────────────────────────────────

function KGSection({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-white/4 transition-colors"
      >
        {open ? <ChevronDown size={11} className="text-gray-500 shrink-0" /> : <ChevronRight size={11} className="text-gray-500 shrink-0" />}
        <span className="text-gray-500 shrink-0">{icon}</span>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex-1">{title}</span>
        <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-full">{count}</span>
      </button>
      {open && <div className="pb-1">{children}</div>}
    </div>
  );
}

function KGBadge({ label, color }: { label: string; color: string }) {
  return <span className={`text-[9px] font-bold px-1 rounded ${color}`}>{label}</span>;
}

function KnowledgeGraphPanel({ graph }: { graph: ProjectKnowledgeGraph }) {
  const scoreColor = graph.graphHealthScore >= 90 ? 'text-emerald-400' : graph.graphHealthScore >= 70 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg   = graph.graphHealthScore >= 90 ? 'border-emerald-500/30 bg-emerald-500/5' : graph.graphHealthScore >= 70 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5';

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className={`mx-3 my-2 rounded-lg border px-3 py-2 ${scoreBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Network size={12} className={scoreColor} />
            <span className="text-[11px] font-semibold text-gray-300">Knowledge Graph</span>
            <span className="text-[10px] text-gray-500">· {graph.projectType}</span>
          </div>
          <span className={`text-[14px] font-bold ${scoreColor}`}>{graph.graphHealthScore}%</span>
        </div>
        <div className="mt-1.5 grid grid-cols-4 gap-1 text-center">
          {[['Pages', graph.pages.length], ['Comps', graph.components.length], ['APIs', graph.apis.length], ['Routes', graph.routes.length]].map(([label, val]) => (
            <div key={String(label)} className="bg-white/5 rounded px-1 py-0.5">
              <div className="text-[13px] font-bold text-gray-200">{val}</div>
              <div className="text-[9px] text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pages */}
      {graph.pages.length > 0 && (
        <KGSection title="Pages" icon={<LayoutDashboard size={11} />} count={graph.pages.length}>
          {graph.pages.map(page => (
            <div key={page.name} className="px-4 py-1.5 hover:bg-white/3 transition-colors">
              <div className="flex items-center gap-1.5">
                <LayoutDashboard size={10} className="text-indigo-400 shrink-0" />
                <span className="text-[12px] text-gray-300 font-medium">{page.name}</span>
                {page.route && <span className="text-[10px] text-gray-600 font-mono">{page.route}</span>}
              </div>
              {page.components.length > 0 && (
                <div className="mt-0.5 pl-4 flex flex-wrap gap-1">
                  {page.components.slice(0, 5).map(c => (
                    <span key={c} className="text-[9px] text-gray-500 bg-white/4 px-1 rounded">{c}</span>
                  ))}
                  {page.components.length > 5 && <span className="text-[9px] text-gray-600">+{page.components.length - 5}</span>}
                </div>
              )}
            </div>
          ))}
        </KGSection>
      )}

      {/* Components */}
      {graph.components.length > 0 && (
        <KGSection title="Components" icon={<Component size={11} />} count={graph.components.length}>
          {graph.components.map(comp => (
            <div key={comp.name} className="px-4 py-1 hover:bg-white/3 transition-colors flex items-center gap-1.5">
              <Component size={10} className="text-sky-400 shrink-0" />
              <span className="text-[12px] text-gray-300 flex-1">{comp.name}</span>
              {comp.section && (
                <KGBadge label={comp.section}
                  color={comp.section === 'hero' ? 'text-purple-400 bg-purple-400/10' : comp.section === 'pricing' ? 'text-emerald-400 bg-emerald-400/10' : comp.section === 'navigation' ? 'text-blue-400 bg-blue-400/10' : comp.section === 'auth' ? 'text-orange-400 bg-orange-400/10' : comp.section === 'dashboard' ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 bg-gray-400/10'}
                />
              )}
            </div>
          ))}
        </KGSection>
      )}

      {/* Routes */}
      {graph.routes.length > 0 && (
        <KGSection title="Routes" icon={<GitBranch size={11} />} count={graph.routes.length}>
          {graph.routes.map(route => (
            <div key={route} className="px-4 py-1 flex items-center gap-1.5 hover:bg-white/3 transition-colors">
              <Route size={10} className="text-green-400 shrink-0" />
              <span className="text-[12px] text-gray-400 font-mono">{route}</span>
            </div>
          ))}
        </KGSection>
      )}

      {/* APIs */}
      {graph.apis.length > 0 && (
        <KGSection title="APIs" icon={<Zap size={11} />} count={graph.apis.length}>
          {graph.apis.map(api => (
            <div key={api.name} className="px-4 py-1 flex items-center gap-1.5 hover:bg-white/3 transition-colors">
              <Zap size={10} className="text-amber-400 shrink-0" />
              <span className="text-[12px] text-gray-300">{api.name}</span>
              {api.methods && api.methods.length > 0 && (
                <div className="flex gap-0.5">
                  {api.methods.map(m => <KGBadge key={m} label={m} color="text-gray-400 bg-gray-400/10" />)}
                </div>
              )}
            </div>
          ))}
        </KGSection>
      )}

      {/* Database Tables */}
      {graph.databaseTables.length > 0 && (
        <KGSection title="Database" icon={<Database size={11} />} count={graph.databaseTables.length}>
          {graph.databaseTables.map(table => (
            <div key={table.name} className="px-4 py-1 flex items-center gap-1.5 hover:bg-white/3 transition-colors">
              <Database size={10} className="text-rose-400 shrink-0" />
              <span className="text-[12px] text-gray-300">{table.name}</span>
              {table.relationships.length > 0 && (
                <span className="text-[10px] text-gray-600">→ {table.relationships.join(', ')}</span>
              )}
            </div>
          ))}
        </KGSection>
      )}

      {/* Dependencies */}
      {graph.dependencies.length > 0 && (
        <KGSection title="Dependencies" icon={<Package size={11} />} count={graph.dependencies.length}>
          <div className="px-4 py-1 flex flex-wrap gap-1">
            {graph.dependencies.map(dep => (
              <span key={dep} className="text-[10px] text-gray-500 bg-white/4 border border-white/8 px-1.5 py-0.5 rounded font-mono">{dep}</span>
            ))}
          </div>
        </KGSection>
      )}

      <div className="pb-4" />
    </div>
  );
}

// ── Build Health Panel (V5.2) ──────────────────────────────────────────────
function BuildHealthPanel({ health }: { health: BuildHealth }) {
  const score = health.validationScore;
  const rtScore = health.runtimeScore ?? 100;
  const overallScore = Math.round((score + rtScore) / 2);
  const scoreColor =
    overallScore >= 90 ? 'text-emerald-400' :
    overallScore >= 70 ? 'text-yellow-400' :
    'text-red-400';
  const scoreBg =
    overallScore >= 90 ? 'border-emerald-500/30 bg-emerald-500/5' :
    overallScore >= 70 ? 'border-yellow-500/30 bg-yellow-500/5' :
    'border-red-500/30 bg-red-500/5';
  const ScoreIcon = overallScore >= 90 ? ShieldCheck : AlertTriangle;

  return (
    <div className={`mx-3 mb-2 rounded-lg border px-3 py-2 ${scoreBg}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <ScoreIcon size={13} className={scoreColor} />
          <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">Build Health</span>
        </div>
        <span className={`text-[15px] font-bold ${scoreColor}`}>{overallScore}%</span>
      </div>
      <div className="grid grid-cols-4 gap-x-3 gap-y-0.5">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500">Files</span>
          <span className="text-[12px] font-medium text-gray-300">{health.passedFiles}/{health.totalFiles > 0 ? health.passedFiles + health.failedFiles : '–'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500">Compile</span>
          <span className={`text-[12px] font-medium flex items-center gap-0.5 ${score >= 90 ? 'text-emerald-400' : score >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
            <ShieldCheck size={10} />{score}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500">Runtime</span>
          <span className={`text-[12px] font-medium flex items-center gap-0.5 ${rtScore >= 90 ? 'text-emerald-400' : rtScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
            <Zap size={10} />{rtScore}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500">Routes</span>
          <span className={`text-[12px] font-medium flex items-center gap-0.5 ${(health.routesValid ?? true) ? 'text-emerald-400' : 'text-red-400'}`}>
            <Route size={10} />{(health.routesValid ?? true) ? 'ok' : 'err'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 mt-0.5">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500">Repairs</span>
          <span className="text-[12px] font-medium text-gray-300 flex items-center gap-0.5">
            <Wrench size={10} className="text-gray-500" />{health.filesRepaired}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500">RT Issues</span>
          <span className={`text-[12px] font-medium flex items-center gap-0.5 ${(health.runtimeErrors ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            <AlertTriangle size={10} />{health.runtimeErrors ?? 0}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500">Tokens</span>
          <span className="text-[12px] font-medium text-gray-300 flex items-center gap-0.5">
            <Cpu size={10} className="text-gray-500" />{(health.tokenEstimate / 1000).toFixed(1)}k
          </span>
        </div>
      </div>
      {health.failedFiles > 0 && (
        <p className="mt-1.5 text-[10px] text-red-400">
          {health.failedFiles} file{health.failedFiles > 1 ? 's' : ''} failed compile — preview may have issues
        </p>
      )}
      {(health.runtimeErrors ?? 0) > 0 && (
        <p className="mt-0.5 text-[10px] text-amber-400">
          {health.runtimeErrors} runtime issue{health.runtimeErrors !== 1 ? 's' : ''} detected — Runtime Repair will auto-fix on crash
        </p>
      )}
    </div>
  );
}

// ── V6.1: Runtime Engine Panel (Self-Healing) ────────────────────────────────

function RuntimeStatusBadge({ status }: { status: RuntimeState['status'] }) {
  const MAP: Record<RuntimeState['status'], { label: string; color: string; dot: string }> = {
    idle:       { label: 'Idle',       color: 'text-gray-400',    dot: 'bg-gray-500' },
    installing: { label: 'Installing', color: 'text-yellow-400',  dot: 'bg-yellow-400 animate-pulse' },
    validating: { label: 'Validating', color: 'text-blue-400',    dot: 'bg-blue-400 animate-pulse' },
    running:    { label: 'Running',    color: 'text-emerald-400', dot: 'bg-emerald-400' },
    failed:     { label: 'Failed',     color: 'text-red-400',     dot: 'bg-red-500' },
    repaired:   { label: 'Repaired',   color: 'text-purple-400',  dot: 'bg-purple-400' },
  };
  const s = MAP[status] ?? MAP.idle;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
      <span className={`text-[12px] font-semibold ${s.color}`}>{s.label}</span>
    </div>
  );
}

function DimHealthBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const bar  = score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-yellow-500' : 'bg-red-500';
  const text = score >= 90 ? 'text-emerald-400' : score >= 70 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-gray-600 w-3 shrink-0">{icon}</span>
      <span className="text-[10px] text-gray-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-white/6 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-[11px] font-bold ${text} w-7 text-right`}>{score}</span>
    </div>
  );
}

const REPAIR_PHASE_LABELS: Record<string, string> = {
  classify: 'Classifying error',
  target:   'Targeting files',
  generate: 'Generating patch',
  validate: 'Quality gate',
  done:     'Repair complete',
  idle:     'Idle',
};

const CATEGORY_COLORS: Record<string, string> = {
  import: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  jsx: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  typescript: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  hook: 'bg-pink-500/15 text-pink-300 border-pink-500/25',
  route: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  api: 'bg-teal-500/15 text-teal-300 border-teal-500/25',
  dependency: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  runtime: 'bg-red-500/15 text-red-300 border-red-500/25',
  unknown: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
};

function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.unknown;
  return (
    <span className={`text-[9px] font-bold border px-1 py-0.5 rounded ${cls}`}>
      {category.toUpperCase()}
    </span>
  );
}

function SelfHealingPanel({ healing }: { healing: SelfHealingState }) {
  const isActive = healing.active;
  const phaseLabel = REPAIR_PHASE_LABELS[healing.phase] ?? healing.phase;
  const phases = ['classify', 'target', 'generate', 'validate', 'done'] as const;
  const currentIdx = phases.indexOf(healing.phase as typeof phases[number]);
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${isActive ? 'border-purple-500/30 bg-purple-500/5' : 'border-emerald-500/20 bg-emerald-500/4'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isActive
            ? <Wrench size={12} className="text-purple-400 animate-spin" style={{ animationDuration: '2s' }} />
            : <CheckCircle2 size={12} className="text-emerald-400" />}
          <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
            {isActive ? 'Self-Healing Active' : 'Last Repair'}
          </span>
        </div>
        {isActive && (
          <span className="text-[10px] text-purple-300 font-mono">
            Attempt {healing.currentAttempt}/{healing.maxAttempts}
          </span>
        )}
      </div>

      {/* Phase steps */}
      <div className="flex items-center gap-0.5 mb-2">
        {phases.map((p, i) => {
          const done = i < currentIdx || healing.phase === 'done';
          const active = i === currentIdx && isActive;
          return (
            <div key={p} className="flex items-center gap-0.5 flex-1">
              <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                done ? 'bg-purple-500' : active ? 'bg-purple-500/50 animate-pulse' : 'bg-white/8'
              }`} />
              {i < phases.length - 1 && <div className="w-0.5 h-1.5 bg-transparent" />}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[11px] font-medium ${isActive ? 'text-purple-300' : 'text-emerald-300'}`}>
            {phaseLabel}
          </p>
          {healing.category && healing.category !== 'unknown' && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <CategoryBadge category={healing.category} />
              {healing.targetFile && (
                <span className="text-[10px] text-gray-600 font-mono truncate max-w-[100px]">
                  {healing.targetFile}
                </span>
              )}
            </div>
          )}
        </div>
        {healing.lastQualityScore > 0 && (
          <div className="text-right">
            <div className={`text-[14px] font-bold ${healing.lastQualityScore >= 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {healing.lastQualityScore}
            </div>
            <div className="text-[9px] text-gray-600">quality</div>
          </div>
        )}
      </div>
    </div>
  );
}

function RepairHistoryTimeline({ history }: { history: RuntimeRepairRecord[] }) {
  if (history.length === 0) return null;
  const recent = [...history].reverse().slice(0, 6);
  return (
    <div className="rounded-xl border border-white/8 bg-white/2">
      <div className="flex items-center gap-2 px-3 py-2">
        <GitBranch size={12} className="text-gray-500" />
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Repair History ({history.length})
        </span>
      </div>
      <div className="px-3 pb-3 space-y-1.5">
        {recent.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            {r.success
              ? <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
              : <XCircle      size={10} className="text-red-400 shrink-0" />}
            <span className="text-[10px] text-gray-400 flex-1 truncate font-mono">
              {r.filesChanged[0] ?? 'no file'}
            </span>
            <CategoryBadge category={r.errorType} />
            {r.qualityScore > 0 && (
              <span className={`text-[10px] font-bold ${r.qualityScore >= 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {r.qualityScore}
              </span>
            )}
            <span className="text-[9px] text-gray-600 shrink-0">
              {r.duration < 1000 ? `${r.duration}ms` : `${(r.duration / 1000).toFixed(1)}s`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RepairAnalyticsPanel({ metrics }: { metrics: RepairMetrics }) {
  if (metrics.totalRepairs === 0) return null;
  const rateColor = metrics.successRate >= 80 ? 'text-emerald-400' : metrics.successRate >= 50 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="rounded-xl border border-white/8 bg-white/2 px-3 py-2.5">
      <div className="flex items-center gap-2 mb-2">
        <Activity size={12} className="text-gray-500" />
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Repair Analytics</span>
      </div>
      <div className="grid grid-cols-4 gap-1 text-center">
        <div className="bg-white/4 rounded-lg px-1.5 py-1">
          <div className={`text-[14px] font-bold ${rateColor}`}>{metrics.successRate}%</div>
          <div className="text-[9px] text-gray-600">success</div>
        </div>
        <div className="bg-white/4 rounded-lg px-1.5 py-1">
          <div className="text-[14px] font-bold text-gray-300">{metrics.totalRepairs}</div>
          <div className="text-[9px] text-gray-600">total</div>
        </div>
        <div className="bg-white/4 rounded-lg px-1.5 py-1">
          <div className="text-[14px] font-bold text-gray-300">{metrics.averageAttempts}</div>
          <div className="text-[9px] text-gray-600">avg tries</div>
        </div>
        <div className="bg-white/4 rounded-lg px-1.5 py-1">
          <div className="text-[14px] font-bold text-gray-300">{metrics.averageQualityScore}</div>
          <div className="text-[9px] text-gray-600">avg qual</div>
        </div>
      </div>
      {metrics.mostCommonErrorType !== 'none' && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-[10px] text-gray-600">Most common:</span>
          <CategoryBadge category={metrics.mostCommonErrorType} />
        </div>
      )}
    </div>
  );
}

// ── V6.2: Autonomous Build State panel ───────────────────────────────────────
function AutonomousBuildPanel({ abState }: { abState: AutonomousBuildState }) {
  const PHASE_LABELS: Record<string, string> = {
    deps: 'Dependency Intelligence', imports: 'Import Resolver', components: 'Component Resolver',
    routes: 'Route Resolver', packages: 'Package Resolver', sandbox: 'Runtime Sandbox',
    loop: 'Autonomous Build Loop', health: 'Health V3', timeline: 'Timeline', gate: 'Preview Gate',
    done: 'Complete', idle: 'Idle',
  };
  const phaseLabel = PHASE_LABELS[abState.phase] ?? abState.phase;
  const scoreColor = abState.healthScore >= 90 ? 'text-emerald-400' : abState.healthScore >= 70 ? 'text-yellow-400' : 'text-red-400';
  const dg = abState.depGraph;
  return (
    <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Cpu size={12} className="text-violet-400" />
          <span className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider">Autonomous Builder</span>
          {abState.active && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />}
        </div>
        {abState.healthScore > 0 && <span className={`text-[12px] font-bold ${scoreColor}`}>{abState.healthScore}%</span>}
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
          {abState.passScores.length > 0 && <div className={`h-full rounded-full transition-all duration-500 ${abState.healthScore >= 90 ? 'bg-emerald-500' : abState.healthScore >= 70 ? 'bg-yellow-500' : 'bg-violet-500'}`} style={{ width: `${abState.healthScore}%` }} />}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">Phase</span>
        <span className="text-[11px] text-violet-300">{phaseLabel}</span>
        {abState.active && <div className="w-3 h-3 border border-violet-500 border-t-transparent rounded-full animate-spin ml-auto" />}
      </div>
      {abState.passScores.length > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[10px] text-gray-600">Passes:</span>
          {abState.passScores.map((s, i) => (
            <span key={i} className={`text-[10px] font-mono font-bold ${s >= 90 ? 'text-emerald-400' : s >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{s}%</span>
          ))}
        </div>
      )}
      {dg && (
        <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px]">
          <div className="flex flex-col bg-white/3 rounded-lg px-2 py-1">
            <span className="text-gray-500">Imports</span>
            <span className="font-semibold text-gray-300">{dg.resolvedImports}/{dg.totalImports}</span>
          </div>
          <div className="flex flex-col bg-white/3 rounded-lg px-2 py-1">
            <span className="text-gray-500">Components</span>
            <span className="font-semibold text-gray-300">{dg.resolvedComponents}/{dg.totalComponents}</span>
          </div>
          <div className="flex flex-col bg-white/3 rounded-lg px-2 py-1">
            <span className="text-gray-500">Routes</span>
            <span className="font-semibold text-gray-300">{dg.resolvedRoutes}/{dg.totalRoutes}</span>
          </div>
          <div className="flex flex-col bg-white/3 rounded-lg px-2 py-1">
            <span className="text-gray-500">Packages</span>
            <span className="font-semibold text-gray-300">{dg.resolvedPackages}/{dg.totalPackages}</span>
          </div>
        </div>
      )}
      {abState.previewGatePass && (
        <div className="mt-2 flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 size={11} />
          <span className="text-[10px] font-semibold">Preview Gate Passed</span>
        </div>
      )}
    </div>
  );
}

// ── V6.2: Timeline Panel ──────────────────────────────────────────────────────
function RuntimeTimelinePanel({ timeline }: { timeline: RuntimeTimeline }) {
  const statusIcon = (s: string) => {
    if (s === 'pass') return <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />;
    if (s === 'fail') return <XCircle size={10} className="text-red-400 shrink-0" />;
    if (s === 'warn') return <AlertTriangle size={10} className="text-yellow-400 shrink-0" />;
    return <Circle size={10} className="text-gray-600 shrink-0" />;
  };
  const elapsed = timeline.finishedAt ? `${((timeline.finishedAt - timeline.startedAt) / 1000).toFixed(1)}s` : '…';
  return (
    <div className="rounded-xl border border-white/8 bg-white/2">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <GitBranch size={12} className="text-indigo-400" />
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Runtime Timeline</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span>Peak: <span className="text-emerald-400 font-semibold">{timeline.peakHealth}%</span></span>
          <span>{elapsed}</span>
        </div>
      </div>
      <div className="px-3 pb-2.5 space-y-1 max-h-56 overflow-y-auto">
        {timeline.events.map((ev, i) => (
          <div key={i} className="flex items-start gap-2">
            {statusIcon(ev.status)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] text-gray-300 truncate">{ev.label}</span>
                {ev.score !== undefined && (
                  <span className={`text-[10px] font-bold shrink-0 ${ev.score >= 90 ? 'text-emerald-400' : ev.score >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{ev.score}%</span>
                )}
              </div>
              {ev.detail && <p className="text-[10px] text-gray-600 truncate">{ev.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RuntimeEnginePanel({
  state,
  repairHistory,
  repairMetrics,
  selfHealingState,
  runtimeHealthV3,
  runtimeTimeline,
  autonomousBuildState,
}: {
  state: RuntimeState;
  repairHistory?: RuntimeRepairRecord[];
  repairMetrics?: RepairMetrics | null;
  selfHealingState?: SelfHealingState | null;
  runtimeHealthV3?: RuntimeHealthV3 | null;
  runtimeTimeline?: RuntimeTimeline | null;
  autonomousBuildState?: AutonomousBuildState | null;
}) {
  const [showPkg, setShowPkg] = useState(false);
  const [showErrors, setShowErrors] = useState(true);

  const logIcon = (type: RuntimeState['logs'][number]['type']) => {
    if (type === 'success') return <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-px" />;
    if (type === 'error')   return <XCircle      size={11} className="text-red-400    shrink-0 mt-px" />;
    if (type === 'warn')    return <AlertTriangle size={11} className="text-yellow-400 shrink-0 mt-px" />;
    return                         <Circle       size={11} className="text-gray-600   shrink-0 mt-px" />;
  };

  const packages  = state.dependencies?.packages ?? [];
  const devPkgs   = state.dependencies?.devPackages ?? [];
  const buildErrs = state.buildErrors ?? [];
  const warnings  = state.warnings ?? [];
  const logs      = state.logs ?? [];

  // Use V3 health if available, else fall back to computed V2
  const errs = buildErrs.filter(e => e.type === 'error');
  const hasRouteErr = buildErrs.some(e => e.message.toLowerCase().includes('route'));
  const healthV2Fallback = {
    compile:    state.buildPassed ? 100 : errs.length > 0 ? Math.max(0, 100 - errs.length * 15) : 75,
    runtime:    state.runtimePassed ? 100 : state.buildPassed ? 70 : 40,
    repair:     (state.repairedFiles ?? 0) > 0 ? Math.min(100, 60 + (state.repairedFiles ?? 0) * 15) : (state.buildPassed ? 100 : 50),
    dependency: packages.length > 0 ? 100 : state.buildPassed ? 80 : 60,
    route:      hasRouteErr ? 50 : state.buildPassed ? 100 : 75,
  };

  const displayHealth = runtimeHealthV3 ?? {
    overall: state.healthScore,
    compile: healthV2Fallback.compile,
    runtime: healthV2Fallback.runtime,
    repair: healthV2Fallback.repair,
    dependencies: healthV2Fallback.dependency,
    routes: healthV2Fallback.route,
    imports: null as unknown as number,
    packages: null as unknown as number,
    components: null as unknown as number,
    pages: null as unknown as number,
  };

  const overallScore = runtimeHealthV3?.overall ?? state.healthScore;
  const scoreColor = overallScore >= 90 ? 'text-emerald-400' : overallScore >= 70 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg    = overallScore >= 90 ? 'border-emerald-500/30 bg-emerald-500/5' : overallScore >= 70 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5';

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">

      {/* Autonomous Builder Panel (V6.2) */}
      {autonomousBuildState && (autonomousBuildState.active || autonomousBuildState.phase !== 'idle') && (
        <AutonomousBuildPanel abState={autonomousBuildState} />
      )}

      {/* Preview Gate Banner (V6.2) */}
      {autonomousBuildState && !autonomousBuildState.active && autonomousBuildState.phase === 'done' && !autonomousBuildState.previewGatePass && overallScore < 90 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2 flex items-start gap-2">
          <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold text-amber-300">Preview Gate Warning</p>
            <p className="text-[10px] text-amber-300/70 mt-0.5">Health score ({overallScore}%) is below the 90% gate threshold. The preview may have minor issues.</p>
          </div>
        </div>
      )}
      {autonomousBuildState && !autonomousBuildState.active && autonomousBuildState.previewGatePass && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 flex items-center gap-2">
          <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
          <p className="text-[11px] font-semibold text-emerald-300">Preview Gate Passed — health ≥ 90%</p>
        </div>
      )}

      {/* Self-Healing Panel */}
      {selfHealingState && (
        <SelfHealingPanel healing={selfHealingState} />
      )}

      {/* Health Overview — V6.2 with 9-dim bars */}
      <div className={`rounded-xl border px-3 py-2.5 ${scoreBg}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity size={13} className={scoreColor} />
            <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">Runtime Health V3</span>
          </div>
          <RuntimeStatusBadge status={state.status} />
        </div>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${overallScore >= 90 ? 'bg-emerald-500' : overallScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${overallScore}%` }} />
          </div>
          <span className={`text-[13px] font-bold ${scoreColor} w-8 text-right`}>{overallScore}%</span>
        </div>
        <DimHealthBar label="Compile"      score={displayHealth.compile}      icon={<ShieldCheck size={10} />} />
        <DimHealthBar label="Runtime"      score={displayHealth.runtime}      icon={<Zap size={10} />} />
        <DimHealthBar label="Repair"       score={displayHealth.repair}       icon={<Wrench size={10} />} />
        <DimHealthBar label="Dependencies" score={displayHealth.dependencies} icon={<PackagePlus size={10} />} />
        <DimHealthBar label="Routes"       score={displayHealth.routes}       icon={<Route size={10} />} />
        {runtimeHealthV3 && <>
          <DimHealthBar label="Imports"    score={runtimeHealthV3.imports}    icon={<FileCode2 size={10} />} />
          <DimHealthBar label="Packages"   score={runtimeHealthV3.packages}   icon={<Package size={10} />} />
          <DimHealthBar label="Components" score={runtimeHealthV3.components} icon={<Component size={10} />} />
          <DimHealthBar label="Pages"      score={runtimeHealthV3.pages}      icon={<LayoutDashboard size={10} />} />
        </>}
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500">Files validated</span>
            <span className="text-[12px] font-semibold text-gray-300">{state.filesValidated ?? 0}/{state.filesTotal ?? 0}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500">Files repaired</span>
            <span className={`text-[12px] font-semibold flex items-center gap-0.5 ${(state.repairedFiles ?? 0) > 0 ? 'text-purple-400' : 'text-gray-500'}`}>
              <Wrench size={10} />{state.repairedFiles ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Runtime Timeline (V6.2) */}
      {runtimeTimeline && runtimeTimeline.events.length > 0 && (
        <RuntimeTimelinePanel timeline={runtimeTimeline} />
      )}

      {/* Repair Analytics */}
      {repairMetrics && repairMetrics.totalRepairs > 0 && (
        <RepairAnalyticsPanel metrics={repairMetrics} />
      )}

      {/* Repair History */}
      {(repairHistory?.length ?? 0) > 0 && (
        <RepairHistoryTimeline history={repairHistory!} />
      )}

      {/* Build Errors */}
      {buildErrs.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5">
          <button
            onClick={() => setShowErrors(v => !v)}
            className="flex items-center justify-between w-full px-3 py-2 text-left"
          >
            <div className="flex items-center gap-2">
              <XCircle size={12} className="text-red-400" />
              <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
                {buildErrs.length} Build Error{buildErrs.length !== 1 ? 's' : ''}
              </span>
            </div>
            {showErrors ? <ChevronDown size={11} className="text-gray-600" /> : <ChevronRight size={11} className="text-gray-600" />}
          </button>
          {showErrors && (
            <div className="px-3 pb-2 space-y-1.5">
              {buildErrs.map((err, i) => (
                <div key={i} className="rounded-lg bg-red-500/8 border border-red-500/15 px-2.5 py-1.5">
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-mono text-red-400/70 shrink-0 mt-0.5">
                      {err.file}{err.line ? `:${err.line}` : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-red-300 mt-0.5">{err.message}</p>
                  {err.rule && <span className="text-[10px] text-gray-600">{err.rule}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle size={11} className="text-yellow-400" />
            <span className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider">{warnings.length} Warning{warnings.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-0.5">
            {warnings.slice(0, 3).map((w, i) => (
              <p key={i} className="text-[11px] text-yellow-300/80 font-mono truncate">{w.message}</p>
            ))}
            {warnings.length > 3 && <p className="text-[10px] text-gray-600">{warnings.length - 3} more warnings…</p>}
          </div>
        </div>
      )}

      {/* Dependencies */}
      <div className="rounded-xl border border-white/8 bg-white/2">
        <button
          onClick={() => setShowPkg(v => !v)}
          className="flex items-center justify-between w-full px-3 py-2 text-left"
        >
          <div className="flex items-center gap-2">
            <PackagePlus size={12} className="text-indigo-400" />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Dependencies ({packages.length})
            </span>
          </div>
          {showPkg ? <ChevronDown size={11} className="text-gray-600" /> : <ChevronRight size={11} className="text-gray-600" />}
        </button>
        {showPkg && (
          <div className="px-3 pb-3">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {packages.map(pkg => (
                <span key={pkg} className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5">
                  {pkg}
                </span>
              ))}
            </div>
            {devPkgs.length > 0 && (
              <>
                <p className="text-[10px] text-gray-600 mb-1">Dev dependencies ({devPkgs.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {devPkgs.slice(0, 8).map(pkg => (
                    <span key={pkg} className="text-[10px] font-mono text-gray-500 bg-white/3 border border-white/8 rounded px-1.5 py-0.5">
                      {pkg}
                    </span>
                  ))}
                  {devPkgs.length > 8 && <span className="text-[10px] text-gray-600">+{devPkgs.length - 8} more</span>}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-white/2">
          <div className="flex items-center gap-2 px-3 py-2">
            <TerminalSquare size={12} className="text-gray-500" />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Runtime Logs ({logs.length})</span>
          </div>
          <div className="px-3 pb-3 space-y-1 max-h-48 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-1.5">
                {logIcon(log.type)}
                <p className={`text-[11px] leading-relaxed ${
                  log.type === 'error'   ? 'text-red-300' :
                  log.type === 'warn'    ? 'text-yellow-300' :
                  log.type === 'success' ? 'text-emerald-300' :
                  'text-gray-400'
                }`}>{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Imports */}
      {(state.missingImports ?? []).length > 0 && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle size={11} className="text-orange-400" />
            <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">
              {state.missingImports!.length} Unresolved Import{state.missingImports!.length !== 1 ? 's' : ''}
            </span>
          </div>
          {state.missingImports!.slice(0, 3).map((mi, i) => (
            <p key={i} className="text-[11px] font-mono text-orange-300/80">
              <span className="text-gray-600">{mi.file}</span> — <span>{mi.missingPackage}</span>
            </p>
          ))}
        </div>
      )}

    </div>
  );
}

function fileIcon(lang: string) {
  if (lang === 'json')  return <FileJson size={14} className="text-yellow-400 shrink-0" />;
  if (lang === 'html')  return <Globe     size={14} className="text-orange-400 shrink-0" />;
  if (lang === 'css')   return <FileText  size={14} className="text-blue-400  shrink-0" />;
  return                       <FileCode2 size={14} className="text-sky-400   shrink-0" />;
}

const BUILD_STEP_LABELS = [
  'Understanding your idea...',
  'Planning architecture...',
  'Crafting design system...',
  'Writing components...',
  'Polishing code...',
  'Building API routes...',
  'Generating database schema...',
  'Setting up authentication...',
  'Scaffolding project...',
  'Running runtime engine...',
  'Self-healing issues...',
  'Preparing preview...',
];

function BuildingState({ buildStep }: { buildStep: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const total   = BUILD_STEP_LABELS.length;
  const safeStep = Math.max(0, Math.min(buildStep, total - 1));
  const label   = BUILD_STEP_LABELS[safeStep] ?? 'Building…';
  const pct     = Math.max(4, Math.round(((safeStep + 1) / total) * 100));
  const fmtTime = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  // SVG arc ring params
  const R    = 44;
  const circ = 2 * Math.PI * R;
  const dash = circ * (1 - pct / 100);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 select-none">

      {/* ── Skeleton preview ─────────────────────────────────────── */}
      <div className="w-full max-w-sm space-y-3 opacity-60">
        <div className="h-9 rounded-xl animate-pulse bg-indigo-500/12" style={{ animationDelay: '0ms' }} />
        <div className="flex gap-2">
          <div className="h-3 rounded-full flex-1 animate-pulse bg-white/6" style={{ animationDelay: '80ms' }} />
          <div className="h-3 rounded-full w-2/5 animate-pulse bg-white/4" style={{ animationDelay: '160ms' }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-16 rounded-xl animate-pulse bg-white/5" style={{ animationDelay: `${240 + i * 80}ms` }} />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-2 rounded-full animate-pulse bg-white/5 w-full"  style={{ animationDelay: '480ms' }} />
          <div className="h-2 rounded-full animate-pulse bg-white/4 w-5/6"  style={{ animationDelay: '560ms' }} />
          <div className="h-2 rounded-full animate-pulse bg-white/3 w-3/5"  style={{ animationDelay: '640ms' }} />
        </div>
      </div>

      {/* ── Progress ring + info ─────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">

        {/* Ring */}
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Track */}
            <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            {/* Progress arc */}
            <circle
              cx="50" cy="50" r={R} fill="none"
              stroke="url(#progressGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dash}
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#8b5cf6" />
                <stop offset="50%"  stopColor="#d946ef" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          {/* Centre text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[18px] font-bold text-white tabular-nums leading-none">{pct}%</span>
            <span className="text-[9px] text-gray-600 font-mono tabular-nums">{fmtTime(elapsed)}</span>
          </div>
        </div>

        {/* Step label */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p
            key={label}
            className="text-[13px] text-white/80 font-medium leading-snug transition-all duration-500"
          >
            {label}
          </p>
          <p className="text-[11px] text-gray-600 tabular-nums">
            Step {safeStep + 1} of {total}
          </p>
        </div>

        {/* Step pip track */}
        <div className="flex items-center gap-1 flex-wrap justify-center max-w-[240px]">
          {BUILD_STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-500 ${
                i < safeStep
                  ? 'w-2 h-2 bg-indigo-500'
                  : i === safeStep
                    ? 'w-3 h-2 bg-violet-400 shadow-[0_0_6px_2px_rgba(139,92,246,0.5)]'
                    : 'w-2 h-2 bg-white/8'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Collapsible folder tree ──────────────────────────────────────────────────
type FileTree = Record<string, ProjectFile[]>;

function buildFileTree(files: ProjectFile[]): FileTree {
  const tree: FileTree = {};
  for (const f of files) {
    const folder = f.path || '';
    if (!tree[folder]) tree[folder] = [];
    tree[folder].push(f);
  }
  return tree;
}

interface FileTreeProps {
  files: ProjectFile[];
  selectedFile: ProjectFile | null;
  onSelect: (f: ProjectFile) => void;
  diff?: EditDiff | null;
}

function fileDiffStatus(file: ProjectFile, diff?: EditDiff | null): 'changed' | 'created' | 'deleted' | null {
  if (!diff) return null;
  const fp = file.path + file.name;
  if (diff.createdFiles.some(p => p === fp || fp.endsWith(p))) return 'created';
  if (diff.changedFiles.some(p => p === fp || fp.endsWith(p))) return 'changed';
  if (diff.deletedFiles.some(p => p === fp || fp.endsWith(p))) return 'deleted';
  return null;
}

function DiffBadge({ status }: { status: 'changed' | 'created' | 'deleted' | null }) {
  if (!status) return null;
  if (status === 'created') return <span className="text-[10px] font-bold text-emerald-400 px-1 rounded bg-emerald-400/10">+</span>;
  if (status === 'changed') return <span className="text-[10px] font-bold text-yellow-400 px-1 rounded bg-yellow-400/10">~</span>;
  if (status === 'deleted') return <span className="text-[10px] font-bold text-red-400 px-1 rounded bg-red-400/10">−</span>;
  return null;
}

function FileTreeView({ files, selectedFile, onSelect, diff }: FileTreeProps) {
  const tree = useMemo(() => buildFileTree(files), [files]);
  const sortedFolders = useMemo(
    () => Object.keys(tree).sort((a, b) => {
      if (a === '') return -1;
      if (b === '') return 1;
      return a.localeCompare(b);
    }),
    [tree]
  );
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(sortedFolders));

  const toggle = (folder: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(folder) ? next.delete(folder) : next.add(folder);
      return next;
    });

  return (
    <div className="flex flex-col py-1">
      {sortedFolders.map(folder => {
        const folderFiles = tree[folder];
        const isExpanded = expanded.has(folder);
        const label = folder
          ? folder.replace(/^src\//, '').replace(/\/$/, '')
          : 'root';
        const isRoot = folder === '';

        return (
          <div key={folder}>
            {!isRoot && (
              <button
                onClick={() => toggle(folder)}
                className="flex items-center gap-1.5 w-full px-3 py-1 text-left hover:bg-white/5 transition-colors"
              >
                {isExpanded
                  ? <ChevronDown size={11} className="text-gray-600 shrink-0" />
                  : <ChevronRight size={11} className="text-gray-600 shrink-0" />}
                <Folder size={12} className="text-blue-400/70 shrink-0" />
                <span className="text-[11px] text-gray-500 font-medium tracking-wide">{label}</span>
              </button>
            )}
            {(isRoot || isExpanded) && folderFiles.map(f => {
              const status = fileDiffStatus(f, diff);
              return (
                <button
                  key={f.path + f.name}
                  onClick={() => onSelect(f)}
                  className={`flex items-center gap-2 w-full text-left transition-colors py-1.5 pr-3 ${!isRoot ? 'pl-7' : 'pl-3'} ${selectedFile?.name === f.name && selectedFile?.path === f.path ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                  {fileIcon(f.lang)}
                  <span className={`text-[12px] truncate flex-1 ${selectedFile?.name === f.name && selectedFile?.path === f.path ? 'text-white' : status ? 'text-gray-200' : 'text-gray-300'}`}>
                    {f.name}
                  </span>
                  <DiffBadge status={status} />
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function WorkspacePreviewPanel({
  code, isBuilding, buildStep,
  projectBlueprint, sectionOrder, projectFiles: serverFiles,
  dnaComposition, sectionOwnership, themeTokens, motionProfile,
  lastEditDiff, canUndo, canRedo, onUndo, onRedo,
  buildHealth, onRuntimeError, knowledgeGraph,
  registrySelection, registryHealth, lockedComponents = [], onLockComponent, onUnlockComponent,
  registryFileMap, componentHistory, editSafetyScore, lastEditImpact,
  selectedTemplate, onSelectTemplate, onClearTemplate, autoMatchedTemplate,
  runtimeState,
  repairHistory,
  repairMetrics,
  selfHealingState,
  runtimeHealthV3,
  runtimeTimeline,
  autonomousBuildState,
}: Props) {
  const [tab, setTab] = useState<'preview' | 'files' | 'graph' | 'registry' | 'marketplace' | 'runtime'>('preview');
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [runtimeError, setRuntimeError] = useState<{ message: string; file?: string; stack?: string } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Preview enhancements ───────────────────────────────────────────────────
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ level: string; message: string; ts: number }>>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Listen for runtime_error + console_log messages from the preview iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data) return;
      if (e.data.type === 'runtime_error') {
        const err = { file: e.data.file || '', message: e.data.message || 'Unknown runtime error', stack: e.data.stack || '', component: e.data.component || '' };
        setRuntimeError(err);
        onRuntimeError?.(err);
      } else if (e.data.type === 'console_log') {
        setConsoleLogs(prev => [...prev.slice(-199), { level: e.data.level || 'log', message: e.data.message || '', ts: e.data.ts || Date.now() }]);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRuntimeError]);

  // Auto-scroll console to bottom on new entries
  useEffect(() => {
    if (showConsole && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleLogs, showConsole]);

  // Clear console + error banner when a new build arrives
  const prevBuildKeyRef = useRef('');
  useEffect(() => {
    const key = serverFiles && serverFiles.length > 0 ? String(serverFiles.length) : code.slice(0, 64);
    if (key !== prevBuildKeyRef.current) {
      prevBuildKeyRef.current = key;
      setConsoleLogs([]);
      setRuntimeError(null);
    }
  }, [serverFiles, code]);

  // Prefer server-generated files (blueprint-driven, proper TypeScript).
  // Fall back to client-side generation only when server files aren't available.
  const files = useMemo(() => {
    if (serverFiles && serverFiles.length > 0) return serverFiles;
    if (!code) return [];
    return generateProjectFiles(code, projectBlueprint ?? undefined, sectionOrder);
  }, [code, serverFiles, projectBlueprint, sectionOrder]);
  const filtered = search.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const [isExporting, setIsExporting] = useState(false);

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    if (!files.length || isExporting) return;
    setIsExporting(true);
    try {
      const projectName = (projectBlueprint?.projectType || 'nexogen-project')
        .toLowerCase().replace(/\s+/g, '-');
      await exportProjectZip(files, projectName);
    } catch (e) {
      console.error('ZIP export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  // ── While building: no tabs, just animation ──────────────────────
  if (isBuilding) {
    return (
      <div className="flex-1 flex flex-col bg-[#0d0d12] overflow-hidden">
        {/* Fake browser chrome */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#16161f] border-b border-white/5 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/30" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/30" />
            <div className="w-3 h-3 rounded-full bg-green-500/30" />
          </div>
          <div className="flex-1 bg-[#0d0d12] rounded-md h-6 flex items-center px-3 gap-2">
            <div className="w-3 h-3 rounded-full bg-white/5 shrink-0" />
            <div className="h-2 bg-white/8 rounded-full animate-pulse w-32" />
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <BuildingState buildStep={buildStep} />
          {dnaComposition && sectionOwnership && themeTokens && motionProfile && (
            <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
              <DNACompositionPanel
                dna={dnaComposition}
                ownership={sectionOwnership}
                theme={themeTokens}
                motion={motionProfile}
                compact
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── No code yet: empty placeholder ───────────────────────────────
  if (!code && files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8 bg-[#0d0d12]">
        <div className="w-16 h-16 rounded-2xl bg-[#1a1a24] flex items-center justify-center">
          <Monitor size={28} className="text-gray-600" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-gray-500 mb-1">Live Preview</p>
          <p className="text-[13px] text-gray-600 leading-relaxed max-w-xs">
            Your website will appear here as soon as the AI builds it.
          </p>
        </div>
      </div>
    );
  }

  // ── Code ready: tab bar + content ────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d12]">

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-[#16161f] border-b border-white/5 shrink-0">
        <button
          onClick={() => { setTab('preview'); setSelectedFile(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
            tab === 'preview'
              ? 'bg-white/10 text-white'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <Eye size={13} />
          Preview
        </button>
        <button
          onClick={() => { setTab('files'); setSelectedFile(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
            tab === 'files'
              ? 'bg-white/10 text-white'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <Files size={13} />
          Files
        </button>
        {knowledgeGraph && (
          <button
            onClick={() => { setTab('graph'); setSelectedFile(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              tab === 'graph'
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <Network size={13} />
            Graph
          </button>
        )}
        {registrySelection && Object.keys(registrySelection).length > 0 && (
          <button
            onClick={() => { setTab('registry'); setSelectedFile(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              tab === 'registry'
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <BookOpen size={13} />
            Registry
          </button>
        )}
        <button
          onClick={() => { setTab('marketplace'); setSelectedFile(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors relative ${
            tab === 'marketplace'
              ? 'bg-amber-500/15 text-amber-300'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <Package size={13} />
          Templates
          {selectedTemplate && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
        {runtimeState && (
          <button
            onClick={() => { setTab('runtime'); setSelectedFile(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors relative ${
              tab === 'runtime'
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <Activity size={13} />
            Runtime
            {runtimeState.status === 'running' && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
            )}
            {runtimeState.status === 'failed' && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
        )}

        {/* Right: undo/redo + copy (when viewing a file) + Export ZIP */}
        <div className="ml-auto flex items-center gap-1">
          {(canUndo || canRedo) && (
            <>
              <button
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo last edit"
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Undo2 size={12} />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo last edit"
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Redo2 size={12} />
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
            </>
          )}
          {tab === 'files' && selectedFile && (
            <button
              onClick={() => handleCopy(selectedFile.content)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          {files.length > 0 && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-40"
            >
              {isExporting
                ? <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                : <Download size={12} />}
              {isExporting ? 'Exporting…' : 'Export'}
            </button>
          )}
        </div>
      </div>

      {/* ── Build Health Panel (V5.1) — always visible when health data exists ── */}
      {buildHealth && <BuildHealthPanel health={buildHealth} />}

      {/* ── Knowledge Graph tab (V5.3) ── */}
      {tab === 'graph' && knowledgeGraph && (
        <KnowledgeGraphPanel graph={knowledgeGraph} />
      )}

      {/* ── Component Registry tab (V5.4) ── */}
      {tab === 'registry' && registrySelection && (
        <RegistryPanel
          selection={registrySelection}
          health={registryHealth}
          lockedComponents={lockedComponents}
          onLock={onLockComponent ?? (() => {})}
          onUnlock={onUnlockComponent ?? (() => {})}
          lastEditDiff={lastEditDiff}
          registryFileMap={registryFileMap}
          componentHistory={componentHistory}
          editSafetyScore={editSafetyScore}
        />
      )}

      {/* ── Runtime Engine tab (V6.2) ── */}
      {tab === 'runtime' && runtimeState && (
        <RuntimeEnginePanel
          state={runtimeState}
          repairHistory={repairHistory}
          repairMetrics={repairMetrics}
          selfHealingState={selfHealingState}
          runtimeHealthV3={runtimeHealthV3}
          runtimeTimeline={runtimeTimeline}
          autonomousBuildState={autonomousBuildState}
        />
      )}

      {/* ── Template Marketplace tab (V5.6) ── */}
      {tab === 'marketplace' && (
        <TemplateMarketplacePanel
          selectedTemplate={selectedTemplate ?? null}
          onSelectTemplate={onSelectTemplate ?? (() => {})}
          onClearTemplate={onClearTemplate ?? (() => {})}
        />
      )}

      {/* ── Preview tab ── */}
      {tab === 'preview' && (
        <div className={isFullscreen ? 'fixed inset-0 z-50 bg-[#0d0d12] flex flex-col' : 'flex-1 flex flex-col overflow-hidden relative'}>

          {/* Preview toolbar */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#13131c] border-b border-white/5 shrink-0">
            {/* Fake address bar */}
            <div className="flex items-center gap-1.5 bg-[#0d0d12] rounded-md h-6 px-2.5 min-w-0 flex-1 max-w-xs">
              <Globe size={9} className="text-emerald-600 shrink-0" />
              <span className="text-[10px] text-gray-600 truncate font-mono select-none">nexogen://preview</span>
            </div>
            {/* Refresh */}
            <button
              onClick={() => { setRefreshKey(k => k + 1); setConsoleLogs([]); setIframeLoading(true); }}
              title="Refresh preview"
              className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-white/8 transition-colors"
            >
              <RefreshCw size={12} />
            </button>
            {/* Viewport switcher */}
            <div className="flex items-center bg-[#0d0d12] rounded-md p-0.5">
              {([
                { key: 'mobile',  icon: <Smartphone size={11} />, title: 'Mobile (375px)' },
                { key: 'tablet',  icon: <Tablet     size={11} />, title: 'Tablet (768px)' },
                { key: 'desktop', icon: <Monitor    size={11} />, title: 'Desktop (full width)' },
              ] as const).map(({ key, icon, title }) => (
                <button
                  key={key}
                  onClick={() => setViewport(key)}
                  title={title}
                  className={`px-1.5 py-0.5 rounded transition-colors ${viewport === key ? 'bg-white/15 text-white' : 'text-gray-600 hover:text-gray-300'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
            {/* Console toggle */}
            <button
              onClick={() => setShowConsole(v => !v)}
              title="Toggle console output"
              className={`p-1 rounded transition-colors relative ${showConsole ? 'bg-amber-500/20 text-amber-400' : 'text-gray-600 hover:text-gray-300 hover:bg-white/8'}`}
            >
              <TerminalSquare size={12} />
              {consoleLogs.some(l => l.level === 'error') && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </button>
            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(v => !v)}
              title={isFullscreen ? 'Exit fullscreen' : 'Expand preview'}
              className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-white/8 transition-colors"
            >
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          </div>

          {/* Runtime Error Banner */}
          {runtimeError && (
            <div className="mx-3 mt-2 mb-1 rounded-lg border border-red-500/30 bg-red-500/8 px-3 py-2 shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-red-400">Runtime Error detected</p>
                    <p className="text-[11px] text-red-300/80 truncate mt-0.5">{runtimeError.message}</p>
                    {runtimeError.file && (
                      <p className="text-[10px] text-gray-500 mt-0.5 font-mono truncate">{runtimeError.file}</p>
                    )}
                    <p className="text-[10px] text-gray-600 mt-1">NexoGen Runtime Repair is attempting to fix this…</p>
                  </div>
                </div>
                <button onClick={() => setRuntimeError(null)} className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors">
                  <X size={11} />
                </button>
              </div>
            </div>
          )}

          {/* Iframe viewport area */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {viewport === 'desktop' ? (
              /* Desktop: fills all available space */
              <div className="flex-1 relative min-h-0">
                {iframeLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d12] z-10 pointer-events-none">
                    <div className="w-5 h-5 border-2 border-indigo-500/60 border-t-indigo-400 rounded-full animate-spin" />
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  key={`${refreshKey}-${serverFiles && serverFiles.length > 0 ? serverFiles.length : code.length}`}
                  srcDoc={serverFiles && serverFiles.length > 0 ? buildPreviewHtmlFromFiles(serverFiles) : buildPreviewHtml(code)}
                  title="Live preview"
                  sandbox="allow-scripts"
                  onLoad={() => setIframeLoading(false)}
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
            ) : (
              /* Mobile / Tablet: fixed-width frame centred over a dark bg */
              <div className="flex-1 overflow-auto flex justify-center py-6 px-4 bg-[#090910]">
                <div className={`shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-2xl relative ${viewport === 'mobile' ? 'w-[375px]' : 'w-[768px]'}`}>
                  {iframeLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d12] z-10 pointer-events-none">
                      <div className="w-5 h-5 border-2 border-indigo-500/60 border-t-indigo-400 rounded-full animate-spin" />
                    </div>
                  )}
                  {/* Minimal browser chrome */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#16161f] border-b border-white/5">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500/40" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500/40" />
                      <div className="w-2 h-2 rounded-full bg-green-500/40" />
                    </div>
                    <div className="flex-1 bg-[#0d0d12] rounded h-4 flex items-center px-2">
                      <span className="text-[9px] text-gray-700 font-mono">
                        {viewport === 'mobile' ? '375px · mobile' : '768px · tablet'}
                      </span>
                    </div>
                  </div>
                  <iframe
                    ref={iframeRef}
                    key={`${refreshKey}-${serverFiles && serverFiles.length > 0 ? serverFiles.length : code.length}`}
                    srcDoc={serverFiles && serverFiles.length > 0 ? buildPreviewHtmlFromFiles(serverFiles) : buildPreviewHtml(code)}
                    title="Live preview"
                    sandbox="allow-scripts"
                    onLoad={() => setIframeLoading(false)}
                    className="w-full border-0 block"
                    style={{ height: viewport === 'mobile' ? '700px' : '820px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Console panel */}
          {showConsole && (
            <div className="h-36 flex flex-col border-t border-white/5 bg-[#080810] shrink-0">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <TerminalSquare size={11} className="text-gray-600" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Console</span>
                  {consoleLogs.length > 0 && (
                    <span className="text-[10px] text-gray-700 font-mono">({consoleLogs.length})</span>
                  )}
                </div>
                <button
                  onClick={() => setConsoleLogs([])}
                  className="text-[10px] text-gray-700 hover:text-gray-400 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div ref={consoleRef} className="flex-1 overflow-y-auto px-3 py-1.5 space-y-0.5 font-mono">
                {consoleLogs.length === 0 ? (
                  <p className="text-[10px] text-gray-700 italic py-2">No console output yet — logs from your generated app will appear here.</p>
                ) : (
                  consoleLogs.map((log, i) => (
                    <div key={i} className={`flex items-start gap-1.5 py-0.5 ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warn'  ? 'text-yellow-400' :
                      log.level === 'info'  ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      <span className="text-[9px] opacity-50 shrink-0 mt-0.5 uppercase w-7">{log.level}</span>
                      <span className="text-[10px] leading-relaxed break-all">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Files tab: collapsible folder tree ── */}
      {tab === 'files' && !selectedFile && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <div className="flex items-center gap-2 flex-1 bg-white/5 rounded-lg px-3 py-1.5">
              <Search size={13} className="text-gray-500 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a file..."
                className="flex-1 bg-transparent text-[13px] text-gray-200 placeholder-gray-600 outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X size={11} className="text-gray-500 hover:text-gray-300" />
                </button>
              )}
            </div>
          </div>
          {/* Tree or filtered flat list when searching */}
          <div className="flex-1 overflow-y-auto">
            {search.trim() ? (
              // Flat search results
              filtered.map((file) => (
                <button
                  key={file.path + file.name}
                  onClick={() => setSelectedFile(file)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 text-left transition-colors"
                >
                  {fileIcon(file.lang)}
                  <div className="flex-1 min-w-0">
                    {file.path && <p className="text-[10px] text-gray-600 truncate">{file.path}</p>}
                    <p className="text-[12px] text-gray-300 truncate">{file.name}</p>
                  </div>
                </button>
              ))
            ) : (
              // Collapsible folder tree (no search active)
              <FileTreeView
                files={files}
                selectedFile={selectedFile}
                onSelect={setSelectedFile}
                diff={lastEditDiff}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Files tab: viewer ── */}
      {tab === 'files' && selectedFile && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#16161f] border-b border-white/5 shrink-0">
            <button
              onClick={() => setSelectedFile(null)}
              className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Files size={12} />
              Files
            </button>
            <ChevronRight size={11} className="text-gray-700" />
            <div className="flex items-center gap-1.5">
              {fileIcon(selectedFile.lang)}
              <span className="text-[13px] text-gray-300 font-medium">{selectedFile.name}</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <pre className="p-4 text-[12px] leading-relaxed text-gray-300 font-mono whitespace-pre-wrap break-words">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
