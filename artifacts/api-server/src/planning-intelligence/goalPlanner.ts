// ── V9.7 Planning Intelligence — Phase 1: Goal Analysis ───────────────────────
// Detects business, technical, UX, performance, SEO, security, scalability,
// accessibility, analytics, and maintenance goals from the prompt.
// Pure deterministic — zero LLM calls.
import type { PlanningGoals, GoalEntry } from './planningTypes.js';

function entry(detected: boolean, priority: GoalEntry['priority'], description: string): GoalEntry {
  return { detected, priority, description };
}

function has(prompt: string, ...terms: string[]): boolean {
  const lower = prompt.toLowerCase();
  return terms.some(t => lower.includes(t));
}

export function analyzeGoals(prompt: string, complexity: string): PlanningGoals {
  const lower = prompt.toLowerCase();

  // ── Business Goal ──────────────────────────────────────────────────────────
  const hasBusiness = has(lower, 'revenue', 'monetize', 'subscription', 'payment', 'pricing',
    'saas', 'marketplace', 'sell', 'commerce', 'profit', 'customer', 'client', 'user',
    'platform', 'product', 'service', 'business', 'startup');
  const businessGoal = entry(hasBusiness, hasBusiness ? 'high' : 'medium',
    hasBusiness ? 'Drive revenue and product growth through the platform' : 'Standard user-value delivery');

  // ── Technical Goal ─────────────────────────────────────────────────────────
  const hasTechnical = has(lower, 'api', 'database', 'backend', 'frontend', 'full.?stack',
    'architecture', 'microservice', 'serverless', 'rest', 'graphql', 'websocket',
    'real.?time', 'integration', 'authentication', 'deploy');
  const technicalGoal = entry(hasTechnical, hasTechnical ? 'critical' : 'high',
    'Build a maintainable, well-architected technical system');

  // ── UX Goal ───────────────────────────────────────────────────────────────
  const hasUX = has(lower, 'ux', 'ui', 'user.?experience', 'usability', 'design', 'beautiful',
    'clean', 'modern', 'mobile', 'responsive', 'landing', 'dashboard', 'interface', 'intuitive');
  const uxGoal = entry(hasUX, 'high',
    hasUX ? 'Deliver a polished, intuitive user experience' : 'Standard UX quality');

  // ── Performance Goal ───────────────────────────────────────────────────────
  const hasPerf = has(lower, 'fast', 'performance', 'speed', 'latency', 'cache', 'cdn',
    'optimiz', 'efficient', 'load.?time', 'lighthouse', 'core.?web.?vital');
  const performanceGoal = entry(hasPerf, hasPerf ? 'high' : 'medium',
    hasPerf ? 'Achieve high performance and fast load times' : 'Standard performance targets');

  // ── SEO Goal ──────────────────────────────────────────────────────────────
  const hasSEO = has(lower, 'seo', 'search.?engine', 'organic', 'ranking', 'meta.?tag',
    'sitemap', 'blog', 'content', 'marketing', 'traffic', 'visibility');
  const seoGoal = entry(hasSEO, hasSEO ? 'medium' : 'low',
    hasSEO ? 'Optimize for search engine visibility and organic traffic' : 'Basic SEO');

  // ── Security Goal ─────────────────────────────────────────────────────────
  const hasSec = has(lower, 'security', 'auth', 'login', 'password', 'encrypt', 'token',
    'jwt', 'oauth', 'permission', 'role', 'rbac', 'hipaa', 'gdpr', 'compliance',
    'secure', 'private', 'protected', 'admin');
  const securityGoal = entry(hasSec, hasSec ? 'critical' : 'high',
    hasSec ? 'Enforce security, authentication, and data protection' : 'Standard security practices');

  // ── Scalability Goal ───────────────────────────────────────────────────────
  const hasScale = complexity === 'enterprise' || has(lower, 'scal', 'enterprise', 'million',
    'high.?traffic', 'load.?balanc', 'horizontal', 'distributed', 'queue', 'worker',
    'concurrent', 'multi.?tenant', 'cluster');
  const scalabilityGoal = entry(hasScale, hasScale ? 'high' : 'medium',
    hasScale ? 'Design for horizontal scale and high traffic volumes' : 'Standard scalability');

  // ── Accessibility Goal ─────────────────────────────────────────────────────
  const hasA11y = has(lower, 'accessib', 'wcag', 'aria', 'screen.?reader', 'keyboard',
    'color.?contrast', 'inclusive', 'a11y', 'disability', 'impairment');
  const accessibilityGoal = entry(hasA11y, hasA11y ? 'high' : 'medium',
    hasA11y ? 'Meet WCAG 2.1 AA accessibility standards' : 'Standard accessibility');

  // ── Analytics Goal ────────────────────────────────────────────────────────
  const hasAnalytics = has(lower, 'analytic', 'track', 'metric', 'insight', 'report',
    'dashboard', 'chart', 'graph', 'data.?viz', 'kpi', 'event.?track',
    'google.?analytic', 'mixpanel', 'segment', 'funnel');
  const analyticsGoal = entry(hasAnalytics, hasAnalytics ? 'medium' : 'low',
    hasAnalytics ? 'Instrument analytics and track key metrics' : 'Basic analytics');

  // ── Maintenance Goal ──────────────────────────────────────────────────────
  const hasMain = has(lower, 'maintainab', 'test', 'ci.?cd', 'lint', 'document',
    'modular', 'clean.?code', 'refactor', 'tech.?debt', 'monitor', 'log', 'observ');
  const maintenanceGoal = entry(hasMain, 'medium',
    hasMain ? 'Write maintainable, well-tested, observable code' : 'Standard maintainability');

  // ── Summary ───────────────────────────────────────────────────────────────
  const goals = [businessGoal, technicalGoal, uxGoal, performanceGoal, seoGoal,
    securityGoal, scalabilityGoal, accessibilityGoal, analyticsGoal, maintenanceGoal];
  const detected = goals.filter(g => g.detected);
  const primaryGoal = hasBusiness
    ? 'Deliver a production-ready SaaS product that generates business value'
    : hasTechnical
      ? 'Build a well-architected technical system with clean APIs'
      : 'Create a polished product with excellent user experience';

  return {
    businessGoal, technicalGoal, uxGoal, performanceGoal, seoGoal,
    securityGoal, scalabilityGoal, accessibilityGoal, analyticsGoal, maintenanceGoal,
    primaryGoal,
    goalCount: detected.length,
  };
}
