// ── V8.8 QA Architect — Phase 3: Integration Test Planner ────────────────────
import type { BackendType }            from '../backend-architect/backendTypes.js';
import type { IntegrationTestBlueprint } from './qaTypes.js';

export function planIntegrationTests(t: BackendType): IntegrationTestBlueprint {
  const isFinancial = t === 'Finance' || t === 'ECommerce' || t === 'Marketplace';
  const isComplex   = ['Enterprise','ERPBackend','CRMBackend','AIPlatform','MultiTenant'].includes(t);

  const integrationPoints = [
    'Frontend ↔ Backend API',
    'Backend ↔ Database',
    'Authentication flow',
    ...(isFinancial  ? ['Payment gateway','Stripe webhook'] : []),
    ...(isComplex    ? ['Message queue','Cache layer (Redis)'] : []),
    ...(t === 'AIPlatform' ? ['OpenRouter / AI provider','Streaming SSE pipeline'] : []),
    'File storage',
  ];

  const dependencyGraph: Record<string, string[]> = {
    'Frontend': ['Backend API'],
    'Backend API': ['Database', 'Auth'],
    'Auth': ['Database', 'Session'],
    ...(isFinancial ? { 'Payment': ['Backend API', 'Stripe'] } : {}),
    ...(isComplex   ? { 'Queue':   ['Backend API', 'Redis'] }  : {}),
    'Storage': ['Backend API'],
  };

  return {
    estimatedTests:    isComplex ? 60 : isFinancial ? 45 : 30,
    integrationPoints,
    dependencyGraph,
    hasDatabaseTests:  true,
    hasAuthTests:      true,
    hasPaymentTests:   isFinancial,
    hasStorageTests:   true,
    hasQueueTests:     isComplex,
    hasCacheTests:     isComplex || t === 'SaaSBackend',
  };
}
