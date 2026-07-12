// ── V8.8 QA Architect — Phase 14: Chaos Test Planner ─────────────────────────
import type { BackendType }     from '../backend-architect/backendTypes.js';
import type { ChaosTestBlueprint, ChaosScenario } from './qaTypes.js';

const ALWAYS: ChaosScenario[]   = ['ServerCrash','NetworkLatency','HighTraffic'];
const AI_EXTRA: ChaosScenario[] = ['AITimeout'];
const QUEUE_EXTRA: ChaosScenario[] = ['QueueOutage','RedisFailure'];
const DB_EXTRA: ChaosScenario[] = ['DatabaseOutage'];

export function planChaosTests(t: BackendType): ChaosTestBlueprint {
  const isComplex   = ['Enterprise','Finance','Healthcare','AIPlatform','Marketplace'].includes(t);
  const isAI        = t === 'AIPlatform';
  const usesQueues  = ['Marketplace','SocialPlatform','ERPBackend','SaaSBackend'].includes(t);

  const scenarios: ChaosScenario[] = [
    ...ALWAYS,
    ...(isComplex ? DB_EXTRA : []),
    ...(usesQueues ? QUEUE_EXTRA : []),
    ...(isAI ? AI_EXTRA : []),
  ];

  return {
    scenarios:           [...new Set(scenarios)] as ChaosScenario[],
    hasAutomation:       isComplex,
    hasGameDays:         isComplex,
    recoveryTargetSecs:  isComplex ? 30 : 60,
    tools:               ['Gremlin', 'Chaos Monkey', ...(isAI ? ['Resilience4j'] : [])],
    schedule:            isComplex ? 'Monthly' : 'Quarterly',
  };
}
