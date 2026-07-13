// ── V9.5 Constraint Reasoning Engine ──────────────────────────────────────────
import type { ConstraintLevel, ConstraintSet, ReasoningContext } from './types.js';

function levelFromComplexity(complexity: ReasoningContext['complexity']): ConstraintLevel {
  if (complexity === 'enterprise') return 'high';
  if (complexity === 'standard') return 'medium';
  return 'low';
}

function detectFramework(prompt: string): string {
  const text = prompt.toLowerCase();
  if (text.includes('next.js') || text.includes('nextjs')) return 'Next.js';
  if (text.includes('vue')) return 'Vue';
  if (text.includes('svelte')) return 'Svelte';
  return 'React';
}

function detectPlatform(prompt: string): string {
  const text = prompt.toLowerCase();
  if (text.includes('mobile app') || text.includes('ios') || text.includes('android')) return 'mobile';
  return 'web';
}

export function analyzeConstraints(ctx: ReasoningContext): ConstraintSet {
  const text = (ctx.prompt || '').toLowerCase();
  const baseLevel = levelFromComplexity(ctx.complexity);

  const budget: ConstraintLevel = text.includes('cheap') || text.includes('low cost') ? 'low'
    : text.includes('enterprise') || text.includes('premium') ? 'high' : baseLevel;

  const time: ConstraintLevel = text.includes('quick') || text.includes('mvp') || text.includes('fast') ? 'low' : baseLevel;

  const security: ConstraintLevel = text.includes('secure') || text.includes('compliance') || text.includes('hipaa') || text.includes('payment')
    ? 'high' : baseLevel;

  const compliance: ConstraintLevel = text.includes('gdpr') || text.includes('hipaa') || text.includes('soc2') ? 'high' : 'low';

  return {
    budget,
    time,
    complexity: baseLevel,
    performance: baseLevel,
    security,
    compliance,
    platform: detectPlatform(text),
    browser: 'modern-evergreen',
    device: detectPlatform(text) === 'mobile' ? 'mobile' : 'desktop+mobile',
    framework: detectFramework(text),
    dependencies: baseLevel,
    resources: baseLevel,
    tokenBudget: ctx.totalTokenBudget ?? 0,
    latency: (ctx.tokenEfficiency ?? 0.5) < 0.4 ? 'high' : 'medium',
  };
}
