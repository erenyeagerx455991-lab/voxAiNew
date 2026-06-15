import { useState, useMemo } from 'react';
import {
  Eye, Files, Copy, Check, Search, ChevronRight, ChevronDown,
  FileCode2, FileJson, FileText, Globe, X, Monitor, Folder, Download,
  Undo2, Redo2,
} from 'lucide-react';
import { buildPreviewHtml, buildPreviewHtmlFromFiles, generateProjectFiles } from '../services/builderService';
import type { ProjectBlueprint, ProjectFile, DNAComposition, ThemeTokens, MotionProfile, EditDiff } from '../services/builderService';
import { exportProjectZip } from '../services/mockAiService';
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
  'Preparing preview...',
];

function BuildingState({ buildStep }: { buildStep: number }) {
  const label =
    buildStep >= 0 && buildStep < BUILD_STEP_LABELS.length
      ? BUILD_STEP_LABELS[buildStep]
      : 'Building...';
  const progress = Math.max(8, ((buildStep + 1) / BUILD_STEP_LABELS.length) * 100);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-10 gap-8">
      <div className="w-full max-w-md space-y-3">
        <div className="h-10 rounded-xl animate-pulse" style={{ background: 'rgba(99,102,241,0.18)', animationDelay: '0ms' }} />
        <div className="h-3 rounded-full animate-pulse bg-white/6 w-3/4 mx-auto" style={{ animationDelay: '80ms' }} />
        <div className="h-3 rounded-full animate-pulse bg-white/4 w-1/2 mx-auto" style={{ animationDelay: '160ms' }} />
        <div className="flex gap-2 justify-center pt-1">
          <div className="h-8 w-24 rounded-lg animate-pulse bg-indigo-500/25" style={{ animationDelay: '240ms' }} />
          <div className="h-8 w-20 rounded-lg animate-pulse bg-white/6"      style={{ animationDelay: '320ms' }} />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse bg-white/5" style={{ animationDelay: `${400 + i * 100}ms` }} />
          ))}
        </div>
        <div className="space-y-2 pt-1">
          <div className="h-2.5 rounded-full animate-pulse bg-white/5 w-full"  style={{ animationDelay: '700ms' }} />
          <div className="h-2.5 rounded-full animate-pulse bg-white/4 w-5/6"  style={{ animationDelay: '780ms' }} />
          <div className="h-2.5 rounded-full animate-pulse bg-white/3 w-4/6"  style={{ animationDelay: '860ms' }} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 w-full max-w-md">
        <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-[13px] text-gray-500">{label}</span>
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
}: Props) {
  const [tab, setTab] = useState<'preview' | 'files'>('preview');
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

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
  if (!code) {
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

      {/* ── Preview tab ── */}
      {tab === 'preview' && (
        <iframe
          key={serverFiles && serverFiles.length > 0 ? serverFiles.length : code}
          srcDoc={
            serverFiles && serverFiles.length > 0
              ? buildPreviewHtmlFromFiles(serverFiles)
              : buildPreviewHtml(code)
          }
          title="Live preview"
          sandbox="allow-scripts allow-same-origin"
          className="flex-1 w-full border-0"
        />
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
