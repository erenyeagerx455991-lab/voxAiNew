import { recordTokenUsage, checkTokenBudget } from './tokenBudget.js';
import { recordBudgetEvent } from './budgetMetrics.js';
import { createLogger } from '../lib/structuredLogger.js';

const log = createLogger('ProviderBudget');

export type Provider = 'groq' | 'openrouter';

interface ProviderState {
  rpmWindow: number[];
  tpmWindow: number[];
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

function purgeWindow(arr: number[], windowMs: number): void {
  const cutoff = Date.now() - windowMs;
  while (arr.length > 0 && arr[0] < cutoff) arr.shift();
}

export function recordProviderRequest(provider: Provider): void {
  const s = _state[provider];
  purgeWindow(s.rpmWindow, 60_000);
  s.rpmWindow.push(Date.now());
}

export function recordProviderTokens(provider: Provider, tokens: number): void {
  recordTokenUsage(provider, tokens);
  const s = _state[provider];
  purgeWindow(s.tpmWindow, 60_000);
  for (let i = 0; i < tokens; i++) s.tpmWindow.push(Date.now());
  recordBudgetEvent('token_consumed', { provider, tokens });
}

export function checkProviderBudget(provider: Provider): { allowed: boolean; reason?: string } {
  const global = checkTokenBudget();
  if (!global.allowed) return { allowed: false, reason: global.reason };

  const s = _state[provider];
  purgeWindow(s.rpmWindow, 60_000);
  purgeWindow(s.tpmWindow, 60_000);

  if (s.rpmWindow.length >= MAX_RPM[provider]) {
    s.requestsBlocked++;
    const reason = `${provider} RPM limit reached (${MAX_RPM[provider]}/min)`;
    log.warn('RPM_LIMIT', { provider, current: s.rpmWindow.length });
    recordBudgetEvent('rate_limited', { provider, reason });
    return { allowed: false, reason };
  }

  if (s.tpmWindow.length >= MAX_TPM[provider]) {
    s.requestsBlocked++;
    const reason = `${provider} TPM limit reached (${MAX_TPM[provider]}/min)`;
    log.warn('TPM_LIMIT', { provider, current: s.tpmWindow.length });
    recordBudgetEvent('rate_limited', { provider, reason });
    return { allowed: false, reason };
  }

  return { allowed: true };
}

export function getProviderStats() {
  const now = Date.now();
  return Object.fromEntries(
    (Object.keys(_state) as Provider[]).map((p) => {
      const s = _state[p];
      purgeWindow(s.rpmWindow, 60_000);
      purgeWindow(s.tpmWindow, 60_000);
      return [p, {
        currentRPM: s.rpmWindow.length,
        maxRPM: MAX_RPM[p],
        currentTPM: s.tpmWindow.length,
        maxTPM: MAX_TPM[p],
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
