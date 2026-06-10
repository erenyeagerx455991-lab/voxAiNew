import { useState } from 'react';
import { X, Eye, Code2, Copy, Check } from 'lucide-react';
import { buildPreviewHtml } from '../services/builderService';

interface PreviewModalProps {
  code: string;
  onClose: () => void;
}

export default function PreviewModal({ code, onClose }: PreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewSrc = buildPreviewHtml(code);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-950">

      {/* ── Modal header ── */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-950">
        {/* Tabs */}
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

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'code' && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close preview"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'preview' && (
          <iframe
            key={code}
            srcDoc={previewSrc}
            title="Website preview"
            sandbox="allow-scripts"
            className="w-full h-full border-0"
          />
        )}

        {activeTab === 'code' && (
          <div className="absolute inset-0 overflow-auto bg-gray-950">
            <pre className="p-5 text-[13px] leading-relaxed text-gray-200 font-mono whitespace-pre-wrap break-words">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
