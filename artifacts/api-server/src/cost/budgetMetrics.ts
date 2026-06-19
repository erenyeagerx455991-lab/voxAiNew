import { getBudgetUsage } from './tokenBudget.js';
import { getProviderStats } from './providerBudget.js';

export type BudgetEventType =
  | 'token_consumed'
  | 'rate_limited'
  | 'budget_exceeded'
  | 'emergency_shutdown';

interface BudgetEvent {
  type: BudgetEventType;
  data: Record<string, unknown>;
  at: number;
}

const _events: BudgetEvent[] = [];
const MAX_EVENTS = 200;

let totalEventsRecorded = 0;
let rateLimitedCount = 0;
let budgetExceededCount = 0;

export function recordBudgetEvent(type: BudgetEventType, data: Record<string, unknown> = {}): void {
  totalEventsRecorded++;
  if (type === 'rate_limited')       rateLimitedCount++;
  if (type === 'budget_exceeded')    budgetExceededCount++;
  if (type === 'emergency_shutdown') budgetExceededCount++;

  _events.push({ type, data, at: Date.now() });
  if (_events.length > MAX_EVENTS) _events.shift();
}

export function getBudgetMetrics() {
  const usage = getBudgetUsage();
  const providers = getProviderStats();
  return {
    usage,
    providers,
    events: {
      totalRecorded: totalEventsRecorded,
      rateLimitedCount,
      budgetExceededCount,
      recent: _events.slice(-20),
    },
    generatedAt: new Date().toISOString(),
  };
}

export function resetBudgetMetrics(): void {
  _events.length = 0;
  totalEventsRecorded = 0;
  rateLimitedCount = 0;
  budgetExceededCount = 0;
}
