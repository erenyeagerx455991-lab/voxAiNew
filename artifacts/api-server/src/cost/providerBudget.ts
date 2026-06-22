import { recordTokenUsage, checkTokenBudget } from './tokenBudget.js';
import { recordBudgetEvent } from './budgetMetrics.js';
import { createLogger } from '../lib/structuredLogger.js';

const log = createLogger('ProviderBudget');

export type Provider = 'groq' | 'openrouter';

/** One record per REQUEST (not per token) — fixes the O(tokens) memory bug. */
interface RequestRecord { ts: number; tokens: number }

interface ProviderState {
  rpmWindow: number[];        // one timestamp per request
  tpmWindow: RequestRecord[]; // one { ts, tokens } per request — O(requests)
  requestsBlocked: number;
}

const MAX_RPM: Record<Provider, number> = {
  groq:       Number(process.env['GROQ_MAX_RPM']   ?? 30),
  openrouter: Number(process.env['OR_MAX_RPM']     ?? 60),
};

const MAX_TPM: Record<Provider, number> = {
  groq:       Number(process.env['GROQ_MAX_TPM']   ?? 6000),
  openrouter: Number(process.env['OR_MAX_TPM']     ?? 20000),
};

const _state: Record<Provider, ProviderState> = {
  groq:       { rpmWindow: [], tpmWindow: [], requestsBlocked: 0 },
  openrouter: { rpmWindow: [], tpmWindow: [], requestsBlocked: 0 },
};

function purgeRpmWindow(arr: number[], windowMs: number): void {
  const cutoff = Date.now() - windowMs;
  while (arr.length > 0 && arr[0] < cutoff) arr.shift();
}

function purgeTpmWindow(arr: RequestRecord[], windowMs: number): void {
  const cutoff = Date.now() - windowMs;
  while (arr.length > 0 && arr[0].ts < cutoff) arr.shift();
}

function sumTokens(arr: RequestRecord[]): number {
  return arr.reduce((acc, r) => acc + r.tokens, 0);
}

export function recordProviderRequest(provider: Provider): void {
  const s = _state[provider];
  purgeRpmWindow(s.rpmWindow, 60_000);
  s.rpmWindow.push(Date.now());
}

export function recordProviderTokens(provider: Provider, tokens: number): void {
  recordTokenUsage(provider, tokens);
  const s = _state[provider];
  purgeTpmWindow(s.tpmWindow, 60_000);
  // ONE entry per request — O(requests), not O(tokens)
  s.tpmWindow.push({ ts: Date.now(), tokens });
  recordBudgetEvent('token_consumed', { provider, tokens });
}

export function checkProviderBudget(provider: Provider): { allowed: boolean; reason?: string } {
  const global = checkTokenBudget();
  if (!global.allowed) return { allowed: false, reason: global.reason };

  const s = _state[provider];
  purgeRpmWindow(s.rpmWindow, 60_000);
  purgeTpmWindow(s.tpmWindow, 60_000);

  if (s.rpmWindow.length >= MAX_RPM[provider]) {
    s.requestsBlocked++;
    const reason = `${provider} RPM limit reached (${MAX_RPM[provider]}/min)`;
    log.warn('RPM_LIMIT', { provider, current: s.rpmWindow.length });
    recordBudgetEvent('rate_limited', { provider, reason });
    return { allowed: false, reason };
  }

  const tpmUsed = sumTokens(s.tpmWindow);
  if (tpmUsed >= MAX_TPM[provider]) {
    s.requestsBlocked++;
    const reason = `${provider} TPM limit reached (${MAX_TPM[provider]}/min)`;
    log.warn('TPM_LIMIT', { provider, current: tpmUsed });
    recordBudgetEvent('rate_limited', { provider, reason });
    return { allowed: false, reason };
  }

  return { allowed: true };
}

export function getProviderStats() {
  return Object.fromEntries(
    (Object.keys(_state) as Provider[]).map((p) => {
      const s = _state[p];
      purgeRpmWindow(s.rpmWindow, 60_000);
      purgeTpmWindow(s.tpmWindow, 60_000);
      return [p, {
        currentRPM:      s.rpmWindow.length,
        maxRPM:          MAX_RPM[p],
        currentTPM:      sumTokens(s.tpmWindow),
        maxTPM:          MAX_TPM[p],
        requestsBlocked: s.requestsBlocked,
      }];
    })
  );
}

export function _resetProviderBudgetForTest(): void {
  for (const p of Object.keys(_state) as Provider[]) {
    _state[p] = { rpmWindow: [], tpmWindow: [], requestsBlocked: 0 };
  }
}

/** Test-only: override RPM/TPM limits for a specific provider. */
export function _configureProviderLimitsForTest(
  provider: Provider,
  maxRpm: number,
  maxTpm: number,
): void {
  MAX_RPM[provider] = maxRpm;
  MAX_TPM[provider] = maxTpm;
}
