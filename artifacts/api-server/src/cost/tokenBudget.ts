import { createLogger } from '../lib/structuredLogger.js';

const log = createLogger('TokenBudget');

export interface BudgetConfig {
  dailyGroqTokens: number;
  dailyOpenRouterTokens: number;
  monthlyGroqTokens: number;
  monthlyOpenRouterTokens: number;
  emergencyShutdownThreshold: number;
}

export interface BudgetCheckResult {
  allowed: boolean;
  reason?: string;
  usage: { groqDaily: number; orDaily: number; groqMonthly: number; orMonthly: number };
}

const DEFAULT_CONFIG: BudgetConfig = {
  dailyGroqTokens:         Number(process.env['BUDGET_DAILY_GROQ']        ?? 2_000_000),
  dailyOpenRouterTokens:   Number(process.env['BUDGET_DAILY_OR']          ?? 500_000),
  monthlyGroqTokens:       Number(process.env['BUDGET_MONTHLY_GROQ']      ?? 40_000_000),
  monthlyOpenRouterTokens: Number(process.env['BUDGET_MONTHLY_OR']        ?? 10_000_000),
  emergencyShutdownThreshold: Number(process.env['BUDGET_EMERGENCY_PCT']  ?? 95),
};

let _config: BudgetConfig = { ...DEFAULT_CONFIG };
let _emergencyShutdown = false;

interface PeriodUsage { groq: number; openrouter: number; startMs: number }

let daily:   PeriodUsage = { groq: 0, openrouter: 0, startMs: startOfDay() };
let monthly: PeriodUsage = { groq: 0, openrouter: 0, startMs: startOfMonth() };

function startOfDay(): number {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfMonth(): number {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function maybeReset(): void {
  const now = Date.now();
  if (now >= daily.startMs + 86_400_000) {
    daily = { groq: 0, openrouter: 0, startMs: startOfDay() };
    log.info('BUDGET_DAILY_RESET');
  }
  if (now >= monthly.startMs + 30 * 86_400_000) {
    monthly = { groq: 0, openrouter: 0, startMs: startOfMonth() };
    log.info('BUDGET_MONTHLY_RESET');
  }
}

export function recordTokenUsage(provider: 'groq' | 'openrouter', tokens: number): void {
  maybeReset();
  daily[provider]   += tokens;
  monthly[provider] += tokens;

  const groqPct  = (daily.groq       / _config.dailyGroqTokens)         * 100;
  const orPct    = (daily.openrouter / _config.dailyOpenRouterTokens)    * 100;
  const threshold = _config.emergencyShutdownThreshold;

  if (!_emergencyShutdown && (groqPct >= threshold || orPct >= threshold)) {
    _emergencyShutdown = true;
    log.error('EMERGENCY_SHUTDOWN_TRIGGERED', { groqPct: groqPct.toFixed(1), orPct: orPct.toFixed(1) });
  }
}

export function checkTokenBudget(): BudgetCheckResult {
  maybeReset();
  const usage = { groqDaily: daily.groq, orDaily: daily.openrouter, groqMonthly: monthly.groq, orMonthly: monthly.openrouter };

  if (_emergencyShutdown)
    return { allowed: false, reason: 'Emergency token budget shutdown active', usage };
  if (daily.groq >= _config.dailyGroqTokens)
    return { allowed: false, reason: 'Daily Groq token limit reached', usage };
  if (daily.openrouter >= _config.dailyOpenRouterTokens)
    return { allowed: false, reason: 'Daily OpenRouter token limit reached', usage };
  if (monthly.groq >= _config.monthlyGroqTokens)
    return { allowed: false, reason: 'Monthly Groq token limit reached', usage };
  if (monthly.openrouter >= _config.monthlyOpenRouterTokens)
    return { allowed: false, reason: 'Monthly OpenRouter token limit reached', usage };

  return { allowed: true, usage };
}

export function getBudgetUsage() {
  maybeReset();
  return {
    daily:   { groq: daily.groq,   openrouter: daily.openrouter   },
    monthly: { groq: monthly.groq, openrouter: monthly.openrouter },
    limits:  _config,
    emergencyShutdown: _emergencyShutdown,
    dailyGroqPct:  +(daily.groq   / _config.dailyGroqTokens   * 100).toFixed(1),
    dailyOrPct:    +(daily.openrouter / _config.dailyOpenRouterTokens * 100).toFixed(1),
  };
}

export function configureTokenBudget(config: Partial<BudgetConfig>): void {
  _config = { ..._config, ...config };
}

export function resetEmergencyShutdown(): void {
  _emergencyShutdown = false;
  log.info('EMERGENCY_SHUTDOWN_CLEARED');
}

export function _resetBudgetForTest(): void {
  daily   = { groq: 0, openrouter: 0, startMs: startOfDay() };
  monthly = { groq: 0, openrouter: 0, startMs: startOfMonth() };
  _emergencyShutdown = false;
  _config = { ...DEFAULT_CONFIG };
}
