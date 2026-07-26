// ── V10.2 Code Editor Planner — Deterministic ────────────────────────────────
//
// Plans Monaco Editor configuration, language support, and editor state.
// Zero LLM calls. Never throws.

export type EditorTheme = 'vs-dark' | 'vs-light' | 'hc-black';

export interface MonacoEditorConfig {
  language:           string;
  theme:              EditorTheme;
  fontSize:           number;
  tabSize:            number;
  insertSpaces:       boolean;
  wordWrap:           'off' | 'on' | 'wordWrapColumn' | 'bounded';
  minimap:            boolean;
  lineNumbers:        'on' | 'off' | 'relative';
  folding:            boolean;
  bracketMatching:    'always' | 'never';
  autoIndent:         'none' | 'keep' | 'brackets' | 'advanced' | 'full';
  formatOnSave:       boolean;
  formatOnPaste:      boolean;
  renderWhitespace:   'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  scrollBeyondLastLine: boolean;
  readOnly:           boolean;
}

export function defaultEditorConfig(language: string): MonacoEditorConfig {
  return {
    language,
    theme:              'vs-dark',
    fontSize:           14,
    tabSize:            2,
    insertSpaces:       true,
    wordWrap:           'off',
    minimap:            true,
    lineNumbers:        'on',
    folding:            true,
    bracketMatching:    'always',
    autoIndent:         'full',
    formatOnSave:       true,
    formatOnPaste:      false,
    renderWhitespace:   'boundary',
    scrollBeyondLastLine: false,
    readOnly:           false,
  };
}

// ── Language support ──────────────────────────────────────────────────────────

export interface LanguageSupport {
  monacoId:        string;
  displayName:     string;
  fileExtensions:  string[];
  hasIntelliSense: boolean;
  hasFormatting:   boolean;
  hasDiagnostics:  boolean;
}

export const SUPPORTED_LANGUAGES: LanguageSupport[] = [
  { monacoId: 'typescript',      displayName: 'TypeScript',         fileExtensions: ['.ts'],          hasIntelliSense: true,  hasFormatting: true,  hasDiagnostics: true  },
  { monacoId: 'typescriptreact', displayName: 'TypeScript React',   fileExtensions: ['.tsx'],         hasIntelliSense: true,  hasFormatting: true,  hasDiagnostics: true  },
  { monacoId: 'javascript',      displayName: 'JavaScript',         fileExtensions: ['.js', '.mjs'],  hasIntelliSense: true,  hasFormatting: true,  hasDiagnostics: true  },
  { monacoId: 'javascriptreact', displayName: 'JavaScript React',   fileExtensions: ['.jsx'],         hasIntelliSense: true,  hasFormatting: true,  hasDiagnostics: true  },
  { monacoId: 'html',            displayName: 'HTML',               fileExtensions: ['.html'],        hasIntelliSense: true,  hasFormatting: true,  hasDiagnostics: false },
  { monacoId: 'css',             displayName: 'CSS',                fileExtensions: ['.css'],         hasIntelliSense: true,  hasFormatting: true,  hasDiagnostics: false },
  { monacoId: 'scss',            displayName: 'SCSS',               fileExtensions: ['.scss'],        hasIntelliSense: true,  hasFormatting: true,  hasDiagnostics: false },
  { monacoId: 'json',            displayName: 'JSON',               fileExtensions: ['.json'],        hasIntelliSense: true,  hasFormatting: true,  hasDiagnostics: true  },
  { monacoId: 'markdown',        displayName: 'Markdown',           fileExtensions: ['.md', '.mdx'],  hasIntelliSense: false, hasFormatting: true,  hasDiagnostics: false },
  { monacoId: 'python',          displayName: 'Python',             fileExtensions: ['.py'],          hasIntelliSense: false, hasFormatting: false, hasDiagnostics: false },
  { monacoId: 'yaml',            displayName: 'YAML',               fileExtensions: ['.yaml', '.yml'], hasIntelliSense: false, hasFormatting: true,  hasDiagnostics: false },
  { monacoId: 'shellscript',     displayName: 'Shell Script',       fileExtensions: ['.sh', '.bash'], hasIntelliSense: false, hasFormatting: false, hasDiagnostics: false },
  { monacoId: 'sql',             displayName: 'SQL',                fileExtensions: ['.sql'],         hasIntelliSense: false, hasFormatting: true,  hasDiagnostics: false },
  { monacoId: 'toml',            displayName: 'TOML',               fileExtensions: ['.toml'],        hasIntelliSense: false, hasFormatting: false, hasDiagnostics: false },
  { monacoId: 'plaintext',       displayName: 'Plain Text',         fileExtensions: [],               hasIntelliSense: false, hasFormatting: false, hasDiagnostics: false },
];

export function getLanguageForFile(filePath: string): LanguageSupport {
  const ext = `.${filePath.split('.').pop()?.toLowerCase() ?? ''}`;
  const lang = SUPPORTED_LANGUAGES.find(l => l.fileExtensions.includes(ext));
  return lang ?? SUPPORTED_LANGUAGES[SUPPORTED_LANGUAGES.length - 1]!;
}

// ── Tab management ────────────────────────────────────────────────────────────

export interface EditorTab {
  filePath:  string;
  isDirty:   boolean;
  isActive:  boolean;
  language:  string;
  scrollTop: number;
  cursorLine: number;
}

export interface EditorTabState {
  tabs:   EditorTab[];
  maxTabs: number;
}

export function createTabState(maxTabs = 20): EditorTabState {
  return { tabs: [], maxTabs };
}

export function openTab(
  state:    EditorTabState,
  filePath: string,
  language: string,
): EditorTabState {
  const existing = state.tabs.findIndex(t => t.filePath === filePath);
  if (existing >= 0) {
    const tabs = state.tabs.map((t, i) => ({ ...t, isActive: i === existing }));
    return { ...state, tabs };
  }
  const newTab: EditorTab = {
    filePath, language, isDirty: false, isActive: true, scrollTop: 0, cursorLine: 1,
  };
  let tabs = [...state.tabs.map(t => ({ ...t, isActive: false })), newTab];
  if (tabs.length > state.maxTabs) tabs = tabs.slice(-state.maxTabs);
  return { ...state, tabs };
}

export function closeTab(state: EditorTabState, filePath: string): EditorTabState {
  const idx  = state.tabs.findIndex(t => t.filePath === filePath);
  if (idx < 0) return state;
  const tabs = state.tabs.filter((_, i) => i !== idx);
  // Make neighbor active
  if (tabs.length > 0) {
    const nextIdx = Math.min(idx, tabs.length - 1);
    tabs[nextIdx] = { ...tabs[nextIdx]!, isActive: true };
  }
  return { ...state, tabs };
}

export function markTabDirty(state: EditorTabState, filePath: string, isDirty: boolean): EditorTabState {
  const tabs = state.tabs.map(t => t.filePath === filePath ? { ...t, isDirty } : t);
  return { ...state, tabs };
}

// ── Editor settings ────────────────────────────────────────────────────────────

export function applyUserPrefsToConfig(
  config: MonacoEditorConfig,
  prefs: Partial<MonacoEditorConfig>,
): MonacoEditorConfig {
  return { ...config, ...prefs };
}

export function buildMonacoModelOptions(config: MonacoEditorConfig): Record<string, unknown> {
  return {
    tabSize:      config.tabSize,
    insertSpaces: config.insertSpaces,
    trimAutoWhitespace: true,
    detectIndentation: true,
  };
}
