// ── V8.8 QA Architect — Phase 11: Performance Test Planner ───────────────────
import type { BackendType }           from '../backend-architect/backendTypes.js';
import type { PerformanceTestBlueprint } from './qaTypes.js';

export function planPerformanceTests(t: BackendType): PerformanceTestBlueprint {
  const isHighTraffic = ['Marketplace','SocialPlatform','ECommerce','Analytics'].includes(t);
  const isAI          = t === 'AIPlatform';
  const isRegulated   = ['Finance','Healthcare'].includes(t);

  return {
    hasLoadTests:       true,
    hasStressTests:     isHighTraffic || isRegulated,
    hasMemoryLeakTests: true,
    hasCPUTests:        isHighTraffic || isAI,
    hasBundleSizeTests: true,
    hasHydrationTests:  true,
    targetTTFBms:       isHighTraffic ? 200  : 500,
    targetLCPms:        isHighTraffic ? 1500 : 2500,
    targetCLS:          0.1,
    targetFIDms:        isHighTraffic ? 50   : 100,
    targetINPms:        isHighTraffic ? 150  : 200,
    tools:              ['k6', 'Lighthouse', 'WebPageTest'],
    maxConcurrentUsers: isHighTraffic ? 5000 : isRegulated ? 2000 : 500,
  };
}
