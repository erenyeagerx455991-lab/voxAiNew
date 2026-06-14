import { useState, useMemo } from 'react';
import {
  Eye, Files, Copy, Check, Search, ChevronRight,
  FileCode2, FileJson, FileText, Globe, X, Monitor,
} from 'lucide-react';
import { buildPreviewHtml, generateProjectFiles } from '../services/builderService';
import type { ProjectBlueprint, ProjectFile } from '../services/builderService';

interface Props {
  code: string;
  isBuilding: boolean;
  buildStep: number;
  projectBlueprint?: ProjectBlueprint | null;
  sectionOrder?: string[];
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
  'Preparing preview...',
];

function BuildingState({ buildStep }: { buildStep: number }) {
  const label =
    buildStep >= 0 && buildStep < BUILD_STEP_LABELS.length
      ? BUILD_STEP_LABELS[buildStep]
      : 'Building...';
  const progress = Math.max(8, ((buildStep + 1) / 6) * 100);

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

export default function WorkspacePreviewPanel({ code, isBuilding, buildStep, projectBlueprint, sectionOrder }: Props) {
  const [tab, setTab] = useState<'preview' | 'files'>('preview');
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const files = useMemo(
    () => (code ? generateProjectFiles(code, projectBlueprint ?? undefined, sectionOrder) : []),
    [code, projectBlueprint, sectionOrder]
  );
  const filtered = search.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <BuildingState buildStep={buildStep} />
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

        {/* Right: copy button when viewing a file */}
        {tab === 'files' && selectedFile && (
          <button
            onClick={() => handleCopy(selectedFile.content)}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      {/* ── Preview tab ── */}
      {tab === 'preview' && (
        <iframe
          key={code}
          srcDoc={buildPreviewHtml(code)}
          title="Live preview"
          sandbox="allow-scripts allow-same-origin"
          className="flex-1 w-full border-0"
        />
      )}

      {/* ── Files tab: list ── */}
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
          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map((file) => (
              <button
                key={file.path + file.name}
                onClick={() => setSelectedFile(file)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 border-b border-white/4 text-left group transition-colors"
              >
                {fileIcon(file.lang)}
                <div className="flex-1 min-w-0">
                  {file.path && (
                    <p className="text-[10px] text-gray-600 truncate">{file.path}</p>
                  )}
                  <p className="text-[13px] text-gray-300 font-medium truncate">{file.name}</p>
                </div>
                <ChevronRight size={13} className="text-gray-700 group-hover:text-gray-500 shrink-0" />
              </button>
            ))}
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
