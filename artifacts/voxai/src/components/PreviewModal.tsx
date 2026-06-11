import { useState, useMemo } from 'react';
import { X, Eye, Files, Copy, Check, Search, ChevronRight, FileCode2, FileJson, FileText, Globe } from 'lucide-react';
import { buildPreviewHtml, sanitizeCode } from '../services/builderService';

interface PreviewModalProps {
  code: string;
  onClose: () => void;
}

interface ProjectFile {
  path: string;
  name: string;
  lang: string;
  content: string;
}

function fileIcon(lang: string) {
  if (lang === 'json') return <FileJson size={16} className="text-yellow-400 shrink-0" />;
  if (lang === 'html') return <Globe size={16} className="text-orange-400 shrink-0" />;
  if (lang === 'css') return <FileText size={16} className="text-blue-400 shrink-0" />;
  return <FileCode2 size={16} className="text-sky-400 shrink-0" />;
}

function buildFiles(code: string): ProjectFile[] {
  const sanitized = sanitizeCode(code);
  return [
    {
      path: 'src/',
      name: 'App.jsx',
      lang: 'jsx',
      content: sanitized,
    },
    {
      path: 'src/',
      name: 'index.jsx',
      lang: 'jsx',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    },
    {
      path: 'src/',
      name: 'index.css',
      lang: 'css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}`,
    },
    {
      path: '',
      name: 'index.html',
      lang: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoxAI App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.jsx"></script>
  </body>
</html>`,
    },
    {
      path: '',
      name: 'tailwind.config.js',
      lang: 'js',
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};`,
    },
    {
      path: '',
      name: 'vite.config.js',
      lang: 'js',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`,
    },
    {
      path: '',
      name: 'package.json',
      lang: 'json',
      content: JSON.stringify(
        {
          name: 'voxai-app',
          private: true,
          version: '0.0.0',
          type: 'module',
          scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
          dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
          devDependencies: {
            '@vitejs/plugin-react': '^4.3.1',
            autoprefixer: '^10.4.20',
            postcss: '^8.4.47',
            tailwindcss: '^3.4.14',
            vite: '^5.4.10',
          },
        },
        null,
        2
      ),
    },
  ];
}

export default function PreviewModal({ code, onClose }: PreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'files'>('preview');
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const previewSrc = buildPreviewHtml(code);
  const files = useMemo(() => buildFiles(code), [code]);

  const filtered = search.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-950">

      {/* ── Modal header ── */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-950">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => { setActiveTab('preview'); setSelectedFile(null); }}
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
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'files'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Files size={14} />
            Files
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'files' && selectedFile && (
            <button
              onClick={() => handleCopy(selectedFile.content)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
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

        {/* Preview tab */}
        {activeTab === 'preview' && (
          <iframe
            key={code}
            srcDoc={previewSrc}
            title="Website preview"
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0"
          />
        )}

        {/* Files tab */}
        {activeTab === 'files' && !selectedFile && (
          <div className="absolute inset-0 flex flex-col bg-gray-950">
            {/* Search bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2 flex-1 bg-gray-800 rounded-xl px-3 py-2">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a file"
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-gray-400 hover:text-white">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* File list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map((file) => (
                <button
                  key={file.path + file.name}
                  onClick={() => setSelectedFile(file)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors border-b border-gray-800/40 text-left group"
                >
                  <div className="shrink-0">{fileIcon(file.lang)}</div>
                  <div className="flex-1 min-w-0">
                    {file.path && (
                      <p className="text-[11px] text-gray-500 truncate mb-0.5">{file.path}</p>
                    )}
                    <p className="text-[14px] text-gray-200 font-medium truncate">{file.name}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* File viewer */}
        {activeTab === 'files' && selectedFile && (
          <div className="absolute inset-0 flex flex-col bg-gray-950">
            {/* File viewer header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
              <button
                onClick={() => setSelectedFile(null)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <Files size={13} />
                Files
              </button>
              <ChevronRight size={12} className="text-gray-600" />
              <div className="flex items-center gap-1.5">
                {fileIcon(selectedFile.lang)}
                <span className="text-sm text-white font-medium">{selectedFile.name}</span>
              </div>
            </div>
            {/* Code content */}
            <div className="flex-1 overflow-auto">
              <pre className="p-5 text-[13px] leading-relaxed text-gray-200 font-mono whitespace-pre-wrap break-words">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
