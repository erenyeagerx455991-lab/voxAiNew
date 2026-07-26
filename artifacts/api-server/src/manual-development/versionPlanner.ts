// ── V10.2 Version Planner — Deterministic ────────────────────────────────────
//
// Plans semantic versioning, changelog entries, and version bumps.
// Zero LLM calls. Never throws.

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  pre?:  string;
}

export interface ChangelogEntry {
  version:   string;
  date:      string;
  added:     string[];
  changed:   string[];
  fixed:     string[];
  removed:   string[];
  timestamp: number;
}

export type BumpType = 'major' | 'minor' | 'patch' | 'pre';

// ── Parsing ───────────────────────────────────────────────────────────────────

export function parseVersion(version: string): SemanticVersion | null {
  const m = version.match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?$/);
  if (!m) return null;
  return {
    major: parseInt(m[1], 10),
    minor: parseInt(m[2], 10),
    patch: parseInt(m[3], 10),
    pre:   m[4],
  };
}

export function formatVersion(v: SemanticVersion): string {
  const base = `${v.major}.${v.minor}.${v.patch}`;
  return v.pre ? `${base}-${v.pre}` : base;
}

// ── Bumping ───────────────────────────────────────────────────────────────────

export function bumpVersion(
  current:  string,
  type:     BumpType,
  preLabel = 'alpha',
): { ok: boolean; version?: string; error?: string } {
  const v = parseVersion(current);
  if (!v) return { ok: false, error: `Invalid version: "${current}"` };

  let next: SemanticVersion;
  switch (type) {
    case 'major': next = { major: v.major + 1, minor: 0, patch: 0 }; break;
    case 'minor': next = { major: v.major, minor: v.minor + 1, patch: 0 }; break;
    case 'patch': next = { major: v.major, minor: v.minor, patch: v.patch + 1 }; break;
    case 'pre':   next = { ...v, pre: preLabel }; break;
  }
  return { ok: true, version: formatVersion(next) };
}

// ── Changelog ─────────────────────────────────────────────────────────────────

const MAX_CHANGELOG_ENTRIES = 100;

export interface ChangelogState {
  entries: ChangelogEntry[];
}

export function createChangelogState(): ChangelogState {
  return { entries: [] };
}

export function addChangelogEntry(
  state:   ChangelogState,
  entry:   Omit<ChangelogEntry, 'date' | 'timestamp'>,
): ChangelogState {
  const now = Date.now();
  const full: ChangelogEntry = {
    ...entry,
    date:      new Date(now).toISOString().slice(0, 10),
    timestamp: now,
  };
  const entries = [full, ...state.entries].slice(0, MAX_CHANGELOG_ENTRIES);
  return { entries };
}

export function formatChangelog(state: ChangelogState): string {
  const lines: string[] = ['# Changelog\n'];
  for (const e of state.entries) {
    lines.push(`## [${e.version}] — ${e.date}`);
    if (e.added.length)   { lines.push('### Added');   e.added.forEach(l => lines.push(`- ${l}`)); }
    if (e.changed.length) { lines.push('### Changed'); e.changed.forEach(l => lines.push(`- ${l}`)); }
    if (e.fixed.length)   { lines.push('### Fixed');   e.fixed.forEach(l => lines.push(`- ${l}`)); }
    if (e.removed.length) { lines.push('### Removed'); e.removed.forEach(l => lines.push(`- ${l}`)); }
    lines.push('');
  }
  return lines.join('\n');
}

// ── Comparison ────────────────────────────────────────────────────────────────

export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if (!va || !vb) return 0;
  if (va.major !== vb.major) return va.major > vb.major ? 1 : -1;
  if (va.minor !== vb.minor) return va.minor > vb.minor ? 1 : -1;
  if (va.patch !== vb.patch) return va.patch > vb.patch ? 1 : -1;
  return 0;
}

export function getLatestVersion(versions: string[]): string | null {
  if (versions.length === 0) return null;
  return versions.sort((a, b) => compareVersions(a, b)).pop() ?? null;
}
