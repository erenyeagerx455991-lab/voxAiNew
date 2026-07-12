// ── V8.8 QA Architect — Phase 2: Unit Test Planner ────────────────────────────
import type { BackendType }      from '../backend-architect/backendTypes.js';
import type { UnitTestBlueprint } from './qaTypes.js';

export function planUnitTests(t: BackendType): UnitTestBlueprint {
  const isComplex = ['Enterprise','Finance','Healthcare','AIPlatform','Marketplace','ERPBackend','CRMBackend'].includes(t);
  const isSimple  = ['LandingAPI','Documentation','ServerlessCandidate'].includes(t);

  const baseTests = isComplex ? 180 : isSimple ? 40 : 80;

  const areas = [
    'Business logic services',
    'Utility functions',
    'Input validation schemas',
    ...(isComplex ? ['Domain event handlers','Command bus handlers'] : []),
    'React hooks',
    'State reducers / Zustand stores',
    'Helper functions',
    ...(t === 'AIPlatform' ? ['AI prompt builders','Token estimators'] : []),
    ...(t === 'Finance' || t === 'ECommerce' ? ['Price calculations','Tax logic'] : []),
  ];

  const criticalPaths = [
    'Authentication token generation',
    'Authorization permission checks',
    'Data validation pipeline',
    ...(isComplex ? ['Payment processing','Order state machine'] : []),
    ...(t === 'AIPlatform' ? ['Prompt injection guard','AI response parser'] : []),
  ];

  return {
    estimatedTests:   baseTests,
    areas,
    criticalPaths,
    frameworks:       ['Vitest', 'Testing Library'],
    hasMocking:       true,
    hasSnapshotTests: !isSimple,
    coverageTarget:   isComplex ? 85 : isSimple ? 70 : 80,
  };
}
