// ── V10.2 Rename Planner — Deterministic ─────────────────────────────────────
//
// Plans symbol rename operations across the entire workspace.
// Zero LLM calls. Never throws.

export interface RenameOperation {
  oldName:       string;
  newName:       string;
  affectedFiles: string[];
  editCount:     number;
  valid:         boolean;
  errors:        string[];
}

export interface RenameEdit {
  filePath:    string;
  line:        number;
  column:      number;
  length:      number;
  replacement: string;
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validateRename(oldName: string, newName: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!oldName.trim())    errors.push('Old name is required');
  if (!newName.trim())    errors.push('New name is required');
  if (oldName === newName) errors.push('Old and new name must differ');
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(newName)) {
    errors.push(`"${newName}" is not a valid identifier`);
  }
  const reserved = new Set(['break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
    'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null',
    'return', 'static', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
    'void', 'while', 'with', 'yield', 'enum', 'await', 'implements', 'interface',
    'package', 'private', 'protected', 'public', 'abstract', 'readonly']);
  if (reserved.has(newName)) errors.push(`"${newName}" is a reserved keyword`);
  return { valid: errors.length === 0, errors };
}

// ── Rename planning ────────────────────────────────────────────────────────────

export function planRename(
  oldName:  string,
  newName:  string,
  files:    Map<string, { content: string }>,
): RenameOperation {
  const { valid, errors } = validateRename(oldName, newName);
  if (!valid) return { oldName, newName, affectedFiles: [], editCount: 0, valid: false, errors };

  const pattern = new RegExp(`\\b${escapeRegex(oldName)}\\b`, 'g');
  const affectedFilesSet = new Set<string>();
  let editCount = 0;

  for (const [filePath, { content }] of files) {
    let m: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((m = pattern.exec(content)) !== null) {
      affectedFilesSet.add(filePath);
      editCount++;
    }
  }

  return {
    oldName,
    newName,
    affectedFiles: [...affectedFilesSet],
    editCount,
    valid: true,
    errors: [],
  };
}

export function executeRename(
  content:  string,
  oldName:  string,
  newName:  string,
): string {
  const pattern = new RegExp(`\\b${escapeRegex(oldName)}\\b`, 'g');
  return content.replace(pattern, newName);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── File rename helper ────────────────────────────────────────────────────────

export function updateImportsAfterFileRename(
  content:   string,
  oldPath:   string,
  newPath:   string,
  currentFile: string,
): string {
  // Convert absolute paths to relative for comparison
  const oldRel = relativizePath(oldPath, currentFile);
  const newRel = relativizePath(newPath, currentFile);
  if (!oldRel || !newRel) return content;

  const escaped = escapeRegex(oldRel);
  return content.replace(
    new RegExp(`(['"])${escaped}(['"])`, 'g'),
    `$1${newRel}$2`,
  );
}

function relativizePath(targetPath: string, fromFile: string): string | null {
  try {
    const fromDir = fromFile.split('/').slice(0, -1).join('/');
    if (!fromDir) return null;
    // Simple relative path calculation
    const target = targetPath.replace(/^\//, '');
    const from   = fromDir.replace(/^\//, '');
    const targetParts = target.split('/');
    const fromParts   = from.split('/');

    let commonLen = 0;
    while (commonLen < Math.min(targetParts.length, fromParts.length) &&
           targetParts[commonLen] === fromParts[commonLen]) {
      commonLen++;
    }
    const upCount = fromParts.length - commonLen;
    const ups     = Array(upCount).fill('..').join('/');
    const down    = targetParts.slice(commonLen).join('/');
    return ups ? `${ups}/${down}` : `./${down}`;
  } catch { return null; }
}
