// ── V10.2 Terminal Planner — Deterministic ────────────────────────────────────
//
// Plans terminal sessions, command history, and safe command validation.
// Zero LLM calls. Never throws.

import type { TerminalSession, TerminalCommand, TerminalStatus } from './manualWorkspaceTypes.js';

let _sessionId = 1;
function nextSessionId(): string { return `term-${_sessionId++}`; }

// ── Session lifecycle ─────────────────────────────────────────────────────────

export function createTerminalSession(
  cwd: string,
  env: Record<string, string> = {},
): TerminalSession {
  return {
    id:      nextSessionId(),
    cwd,
    status:  'idle',
    history: [],
    env,
  };
}

export function setSessionStatus(
  session: TerminalSession,
  status:  TerminalStatus,
): TerminalSession {
  return { ...session, status };
}

export function updateSessionCwd(session: TerminalSession, cwd: string): TerminalSession {
  return { ...session, cwd };
}

// ── Command history ────────────────────────────────────────────────────────────

const MAX_HISTORY = 1000;

export function addToHistory(session: TerminalSession, command: string): TerminalSession {
  if (!command.trim()) return session;
  const history = [...session.history, command].slice(-MAX_HISTORY);
  return { ...session, history };
}

export function searchHistory(session: TerminalSession, query: string): string[] {
  if (!query) return session.history.slice(-20);
  const q = query.toLowerCase();
  return session.history.filter(h => h.toLowerCase().includes(q)).slice(-20);
}

// ── Safe command classification ────────────────────────────────────────────────

export type CommandRisk = 'safe' | 'moderate' | 'dangerous' | 'blocked';

const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//, /dd\s+if=/, /mkfs/, /format\s+c:/i, /shutdown/, /reboot/, /halt/,
];
const DANGEROUS_PATTERNS = [
  /rm\s+-r/, /sudo/, /chmod\s+777/, /kill\s+-9/, /killall/,
];
const MODERATE_PATTERNS = [
  /rm\s+/, /mv\s+/, /cp\s+/, /git\s+push/, /git\s+reset/, /npm\s+publish/, /pnpm\s+publish/,
];

export function classifyCommandRisk(command: string): CommandRisk {
  const cmd = command.trim();
  if (BLOCKED_PATTERNS.some(p => p.test(cmd)))    return 'blocked';
  if (DANGEROUS_PATTERNS.some(p => p.test(cmd)))  return 'dangerous';
  if (MODERATE_PATTERNS.some(p => p.test(cmd)))   return 'moderate';
  return 'safe';
}

// ── Command planning ───────────────────────────────────────────────────────────

export interface PlannedCommand {
  raw:       string;
  parts:     string[];
  program:   string;
  args:      string[];
  risk:      CommandRisk;
  env:       Record<string, string>;
  cwd:       string;
  ok:        boolean;
  blockReason?: string;
}

export function planCommand(
  raw:     string,
  session: TerminalSession,
): PlannedCommand {
  const trimmed = raw.trim();
  const parts   = trimmed.split(/\s+/);
  const program = parts[0] ?? '';
  const args    = parts.slice(1);
  const risk    = classifyCommandRisk(trimmed);
  const ok      = risk !== 'blocked';

  return {
    raw: trimmed,
    parts,
    program,
    args,
    risk,
    env: session.env,
    cwd: session.cwd,
    ok,
    blockReason: ok ? undefined : `Command blocked for safety: "${trimmed}"`,
  };
}

// ── Package manager detection ──────────────────────────────────────────────────

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown';

export function detectPackageManager(files: Set<string>): PackageManager {
  if (files.has('pnpm-lock.yaml') || files.has('pnpm-workspace.yaml')) return 'pnpm';
  if (files.has('yarn.lock'))                                           return 'yarn';
  if (files.has('bun.lockb'))                                           return 'bun';
  if (files.has('package-lock.json'))                                   return 'npm';
  return 'unknown';
}

export function buildInstallCommand(
  packageName:   string,
  pm:            PackageManager,
  isDev = false,
): string {
  const devFlag: Record<PackageManager, string> = {
    npm: '--save-dev', pnpm: '--save-dev', yarn: '--dev', bun: '--dev', unknown: '--save-dev',
  };
  const installCmd: Record<PackageManager, string> = {
    npm: 'npm install', pnpm: 'pnpm add', yarn: 'yarn add', bun: 'bun add', unknown: 'npm install',
  };
  const dev = isDev ? ` ${devFlag[pm]}` : '';
  return `${installCmd[pm]} ${packageName}${dev}`;
}

// ── Record command result ──────────────────────────────────────────────────────

const MAX_COMMANDS = 500;

export interface TerminalCommandLog {
  commands: TerminalCommand[];
}

export function createCommandLog(): TerminalCommandLog {
  return { commands: [] };
}

export function recordCommandResult(
  log:      TerminalCommandLog,
  sessionId: string,
  command:  string,
  output:   string,
  exitCode: number,
  durationMs: number,
): TerminalCommandLog {
  const entry: TerminalCommand = {
    sessionId, command, output, exitCode, durationMs, timestamp: Date.now(),
  };
  const commands = [...log.commands, entry].slice(-MAX_COMMANDS);
  return { commands };
}
