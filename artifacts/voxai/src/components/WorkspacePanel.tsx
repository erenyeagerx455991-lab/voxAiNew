import { useState, useRef } from 'react';
import { Code2, Eye, Copy, Check, RefreshCw, AlertCircle, ArrowUp, Loader2 } from 'lucide-react';
import { buildPreviewHtml } from '../services/builderService';

interface WorkspacePanelProps {
  prompt: string;
  generatedCode: string;
  isGenerating: boolean;
  generationError: string;
  onRegenerate: (prompt: string) => void;
}

export default function WorkspacePanel({
  prompt,
  generatedCode,
  isGenerating,
  generationError,
  onRegenerate,
}: WorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [iterateText, setIterateText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleIterate = () => {
    const trimmed = iterateText.trim();
    if (!trimmed || isGenerating) return;
    onRegenerate(trimmed);
    setIterateText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleIterate();
    }
  };

  const previewSrc = generatedCode ? buildPreviewHtml(generatedCode) : '';
  const hasContent = !!generatedCode && !isGenerating;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">

      {/* ── Tab bar ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Eye size={14} />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'code'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Code2 size={14} />
            Code
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'code' && hasContent && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          {hasContent && (
            <button
              onClick={() => onRegenerate(prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw size={13} />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-hidden relative">

        {/* Loading skeleton */}
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-900 z-10">
            <Loader2 size={32} className="text-indigo-500 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Generating your page…</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">
                Building components, applying styles, and assembling your layout.
              </p>
            </div>
            {/* Pulse bars */}
            <div className="w-64 flex flex-col gap-2 mt-2">
              {[80, 60, 72, 50].map((w, i) => (
                <div
                  key={i}
                  className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                  style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {!isGenerating && generationError && (
          <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
            <div className="max-w-sm w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
              <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Generation failed</p>
              <p className="text-xs text-red-500 dark:text-red-400 mb-4">{generationError}</p>
              <button
                onClick={() => onRegenerate(prompt)}
                className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isGenerating && !generationError && !generatedCode && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600">
            <p className="text-sm">Your generated page will appear here</p>
          </div>
        )}

        {/* Preview iframe */}
        {activeTab === 'preview' && hasContent && (
          <iframe
            key={generatedCode}
            srcDoc={previewSrc}
            title="Page preview"
            sandbox="allow-scripts"
            className="w-full h-full border-0"
          />
        )}

        {/* Code tab */}
        {activeTab === 'code' && hasContent && (
          <div className="absolute inset-0 overflow-auto bg-gray-950">
            <pre className="p-5 text-[13px] leading-relaxed text-gray-200 font-mono whitespace-pre-wrap break-words">
              <code>{generatedCode}</code>
            </pre>
          </div>
        )}
      </div>

      {/* ── Iterate input ── */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
          <textarea
            ref={textareaRef}
            value={iterateText}
            onChange={(e) => setIterateText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a change… (e.g. 'make it dark mode', 'add a pricing section')"
            rows={1}
            disabled={isGenerating}
            className="flex-1 resize-none bg-transparent text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none leading-relaxed max-h-[100px] disabled:opacity-50"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 100) + 'px';
            }}
          />
          <button
            onClick={handleIterate}
            disabled={!iterateText.trim() || isGenerating}
            className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-all ${
              iterateText.trim() && !isGenerating
                ? 'bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200'
                : 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
            }`}
          >
            <ArrowUp
              size={16}
              strokeWidth={2.5}
              className={iterateText.trim() && !isGenerating ? 'text-white dark:text-black' : 'text-gray-400 dark:text-gray-500'}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
