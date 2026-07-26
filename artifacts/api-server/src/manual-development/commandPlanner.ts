// ── V10.2 Command Planner — Deterministic ─────────────────────────────────────
//
// Plans runnable command sequences for common developer operations.
// Zero LLM calls. Never throws.

export interface CommandSequence {
  name:        string;
  description: string;
  steps:       CommandStep[];
  estimatedMs: number;
}

export interface CommandStep {
  command:     string;
  cwd?:        string;
  env?:        Record<string, string>;
  continueOnError: boolean;
  description: string;
}

// ── Common sequences ──────────────────────────────────────────────────────────

export function planInstallDependencies(
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun',
  cwd: string,
): CommandSequence {
  const cmd = { npm: 'npm install', pnpm: 'pnpm install', yarn: 'yarn', bun: 'bun install' }[packageManager];
  return {
    name: 'Install Dependencies',
    description: `Install all project dependencies using ${packageManager}`,
    steps: [{ command: cmd, cwd, continueOnError: false, description: 'Install packages' }],
    estimatedMs: 30_000,
  };
}

export function planTypeCheck(cwd: string): CommandSequence {
  return {
    name: 'Type Check',
    description: 'Run TypeScript type checker',
    steps: [{ command: 'pnpm run typecheck', cwd, continueOnError: true, description: 'TypeScript check' }],
    estimatedMs: 15_000,
  };
}

export function planBuildProject(cwd: string): CommandSequence {
  return {
    name: 'Build Project',
    description: 'Build the project for production',
    steps: [
      { command: 'pnpm run build', cwd, continueOnError: false, description: 'Build' },
    ],
    estimatedMs: 60_000,
  };
}

export function planRunTests(cwd: string, filter?: string): CommandSequence {
  const cmd = filter ? `pnpm test -- --testNamePattern="${filter}"` : 'pnpm test';
  return {
    name: 'Run Tests',
    description: filter ? `Run tests matching "${filter}"` : 'Run all tests',
    steps: [{ command: cmd, cwd, continueOnError: true, description: 'Test runner' }],
    estimatedMs: 30_000,
  };
}

export function planGitInit(cwd: string, authorName: string, authorEmail: string): CommandSequence {
  return {
    name: 'Git Init',
    description: 'Initialize a new git repository',
    steps: [
      { command: 'git init', cwd, continueOnError: false, description: 'Init repo' },
      { command: `git config user.name "${authorName}"`, cwd, continueOnError: true, description: 'Set author name' },
      { command: `git config user.email "${authorEmail}"`, cwd, continueOnError: true, description: 'Set author email' },
      { command: 'git add -A', cwd, continueOnError: false, description: 'Stage all files' },
      { command: 'git commit -m "Initial commit"', cwd, continueOnError: false, description: 'First commit' },
    ],
    estimatedMs: 5_000,
  };
}

// ── Custom command builder ─────────────────────────────────────────────────────

export function buildCustomSequence(
  name:    string,
  commands: string[],
  cwd:     string,
): CommandSequence {
  const steps: CommandStep[] = commands.map((cmd, i) => ({
    command: cmd,
    cwd,
    continueOnError: false,
    description: `Step ${i + 1}: ${cmd}`,
  }));
  return {
    name,
    description: `Custom sequence: ${commands.join(' && ')}`,
    steps,
    estimatedMs: steps.length * 5_000,
  };
}

// ── Dry-run validator ─────────────────────────────────────────────────────────

export interface CommandValidation {
  valid:    boolean;
  issues:   string[];
  warnings: string[];
}

export function validateCommandSequence(seq: CommandSequence): CommandValidation {
  const issues:   string[] = [];
  const warnings: string[] = [];

  if (!seq.name)         issues.push('Sequence name is required');
  if (!seq.steps.length) issues.push('At least one step is required');

  for (const step of seq.steps) {
    if (!step.command.trim()) {
      issues.push(`Empty command in step: "${step.description}"`);
    }
    if (step.command.includes('rm -rf /')) {
      issues.push(`Dangerous command blocked: "${step.command}"`);
    }
    if (step.command.includes('sudo')) {
      warnings.push(`sudo usage in: "${step.command}"`);
    }
  }
  return { valid: issues.length === 0, issues, warnings };
}
