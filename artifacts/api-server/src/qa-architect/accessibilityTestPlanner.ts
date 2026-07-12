// ── V8.8 QA Architect — Phase 7: Accessibility Test Planner ──────────────────
import type { BackendType }              from '../backend-architect/backendTypes.js';
import type { AccessibilityTestBlueprint } from './qaTypes.js';

export function planAccessibilityTests(t: BackendType): AccessibilityTestBlueprint {
  const isRegulated = ['Finance','Healthcare','Enterprise','ERPBackend'].includes(t);
  const standard    = isRegulated ? 'WCAG2.1-AAA' : 'WCAG2.1-AA';

  return {
    standard,
    hasKeyboardTests:  true,
    hasScreenReader:   true,
    hasFocusTests:     true,
    hasContrastTests:  true,
    hasARIATests:      true,
    hasLabelTests:     true,
    hasNavTests:       true,
    tools:             ['axe-core', 'Playwright ARIA', 'Lighthouse'],
    automatedChecks:   isRegulated ? 40 : 25,
  };
}
