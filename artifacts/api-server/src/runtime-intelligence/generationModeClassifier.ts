// ── V9.0 Runtime Intelligence — Generation Mode Classifier ───────────────────
//
// Deterministically classifies the optimal GenerationMode from project signals.
// No LLM calls. Never throws.
import type { GenerationMode, RuntimeIntelligenceInput } from './runtimeTypes.js';

const ENTERPRISE_BACKEND_TYPES = new Set([
  'Healthcare', 'Finance', 'ERPBackend', 'CRMBackend',
]);

const FAST_PATTERNS = /\b(fast|quick|rapid|simple|minimal|prototype|poc|mvp|demo)\b/i;
const CREATIVE_PATTERNS = /\b(creative|artistic|unique|innovative|beautiful|stunning|bold|wow)\b/i;
const EXPERIMENTAL_PATTERNS = /\b(experimental|cutting.edge|novel|advanced|frontier|bleeding.edge)\b/i;
const SAFE_PATTERNS = /\b(safe|conservative|stable|production.safe|zero.downtime)\b/i;
const STRICT_PATTERNS = /\b(strict|exact|precise|formal|compliant|regulated|audit)\b/i;
const QUALITY_PATTERNS = /\b(quality|premium|polished|professional|high.quality|best.in.class)\b/i;
const ENTERPRISE_PATTERNS = /\b(enterprise|b2b|corporate|large.scale|mission.critical|hipaa|soc2|pci)\b/i;

/** Infer complexity as a 0–10 signal from the input. */
function inferComplexity(input: RuntimeIntelligenceInput): number {
  let score = 0;
  score += Math.min(input.serviceCount / 2, 3);      // 0–3
  score += Math.min(input.productFeatures.length / 4, 3); // 0–3
  if (input.hasAuth)      score += 1;
  if (input.hasPayments)  score += 1;
  if (input.hasRealtime)  score += 1;
  if (input.hasCompliance)score += 1;
  return Math.min(score, 10);
}

export function classifyGenerationMode(input: RuntimeIntelligenceInput): GenerationMode {
  const p = input.prompt;

  // 1. Explicit mode hints from prompt (highest priority)
  if (FAST_PATTERNS.test(p))         return 'Fast';
  if (CREATIVE_PATTERNS.test(p))     return 'Creative';
  if (EXPERIMENTAL_PATTERNS.test(p)) return 'Experimental';
  if (SAFE_PATTERNS.test(p))         return 'Safe';
  if (STRICT_PATTERNS.test(p))       return 'Strict';
  if (QUALITY_PATTERNS.test(p))      return 'Quality';
  if (ENTERPRISE_PATTERNS.test(p))   return 'Enterprise';

  // 2. Compliance / regulated backend types → Enterprise
  if (input.hasCompliance || ENTERPRISE_BACKEND_TYPES.has(input.backendType)) {
    return 'Enterprise';
  }

  // 3. High security score + payments → Strict
  if (input.securityScore >= 9 && input.hasPayments) return 'Strict';

  // 4. Business objective signals
  const obj = input.businessObjective.toLowerCase();
  if (obj.includes('enterprise') || obj.includes('b2b')) return 'Enterprise';
  if (obj.includes('consumer') || obj.includes('viral')) return 'Creative';

  // 5. Complexity-driven
  const complexity = inferComplexity(input);
  if (complexity >= 8) return 'Enterprise';
  if (complexity >= 6) return 'Quality';
  if (complexity <= 2) return 'Fast';

  // 6. Product goal signals
  const goal = input.productGoal.toLowerCase();
  if (goal.includes('health') || goal.includes('finance') || goal.includes('banking')) return 'Enterprise';
  if (goal.includes('portfolio') || goal.includes('creative') || goal.includes('agency')) return 'Creative';
  if (goal.includes('landing') || goal.includes('marketing'))                           return 'Fast';

  return 'Balanced';
}

export function getModeRationale(mode: GenerationMode, input: RuntimeIntelligenceInput): string {
  const reasons: Record<GenerationMode, string> = {
    Fast:         `Fast mode selected: minimal complexity (${input.serviceCount} services, ${input.productFeatures.length} features)`,
    Balanced:     `Balanced mode: standard complexity, no compliance/enterprise requirements`,
    Quality:      `Quality mode: elevated complexity (score ${inferComplexity(input).toFixed(1)}/10) warrants deeper generation`,
    Enterprise:   `Enterprise mode: ${input.hasCompliance ? 'compliance requirements' : input.backendType + ' backend'} demands maximum rigor`,
    Creative:     `Creative mode: project signals favor innovative/artistic generation`,
    Strict:       `Strict mode: formal/regulated context requires conservative, precise output`,
    Experimental: `Experimental mode: project signals favor cutting-edge approaches`,
    Safe:         `Safe mode: stability and zero-downtime requirements detected`,
  };
  return reasons[mode];
}
