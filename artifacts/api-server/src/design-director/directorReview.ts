// ── V8.3 Autonomous AI Design Director — Review Engine ────────────────────────
// Static, heuristic-based analysis for all 25 review categories.
// No LLM, no blocking I/O. Fast and deterministic.

import type {
  DirectorCategory,
  DirectorCategoryReview,
  DirectorReviewInput,
} from './directorTypes.js';
import { scoreSeverity } from './directorTypes.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 10): number {
  return Math.min(max, Math.max(min, v));
}

function countPattern(code: string, pattern: RegExp): number {
  return (code.match(pattern) ?? []).length;
}

function hasPattern(code: string, pattern: RegExp): boolean {
  return pattern.test(code);
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function review(
  category: DirectorCategory,
  score: number,
  confidence: number,
  reason: string,
  recommendation: string,
  expectedImprovement: string,
): DirectorCategoryReview {
  return {
    category,
    score: round1(clamp(score)),
    severity: scoreSeverity(clamp(score)),
    confidence: Math.min(1, Math.max(0.1, confidence)),
    reason,
    recommendation,
    expectedImprovement,
  };
}

// ── Individual Category Scorers ───────────────────────────────────────────────

export function scoreVisualHierarchy(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, uxScore, evaluatorScore } = input;
  let score = 7.0;

  // h1/h2/h3 heading structure
  const h1Count = countPattern(code, /\btext-[4-9]xl\b|\btext-\d{3,}px\b/g);
  if (h1Count >= 1) score += 0.5;
  if (h1Count === 0) score -= 1.5;

  // Font weight contrast
  const hasFontWeightContrast = hasPattern(code, /font-bold|font-semibold|font-extrabold/);
  if (!hasFontWeightContrast) score -= 1.0;

  // Color emphasis
  const colorEmphasis = hasPattern(code, /text-primary|text-white.*bg-|bg-primary.*text-white/);
  if (!colorEmphasis) score -= 0.5;

  // UX hierarchy signal
  if (uxScore !== undefined && uxScore < 5) score -= 0.5;
  if (evaluatorScore !== undefined) score = score * 0.8 + evaluatorScore * 0.2;

  // Focal point check
  const hasFocalPoint = hasPattern(code, /<[Hh]1|text-5xl|text-6xl|text-7xl/);
  if (!hasFocalPoint) score -= 0.5;

  return review(
    'visualHierarchy', score, 0.8,
    score < 6 ? 'Weak visual hierarchy — heading scale and weight contrast insufficient' : 'Visual hierarchy is adequate',
    'Use a clear type scale: large bold headline → medium subhead → body text. Ensure primary content has strong focal-point contrast.',
    'Improved hierarchy increases scan speed by 40% and reduces cognitive load',
  );
}

export function scoreTypography(input: DirectorReviewInput): DirectorCategoryReview {
  const { code } = input;
  let score = 7.0;

  // Line height / leading
  const hasLeading = hasPattern(code, /leading-relaxed|leading-loose|leading-\d/);
  if (!hasLeading) score -= 0.8;

  // Body font size adequacy
  const hasBodyText = hasPattern(code, /text-base|text-lg|text-sm/);
  if (!hasBodyText) score -= 0.5;

  // Max width on prose (readability)
  const hasMaxWidth = hasPattern(code, /max-w-prose|max-w-2xl|max-w-3xl|max-w-4xl/);
  if (!hasMaxWidth) score -= 0.5;

  // Font variety (more than one weight used)
  const weightVariety = countPattern(code, /font-normal|font-medium|font-semibold|font-bold|font-extrabold/g);
  if (weightVariety >= 2) score += 0.5;
  if (weightVariety === 0) score -= 0.8;

  // Mono/code font usage (only penalize if there is code display that's not using mono)
  const hasCodeDisplay = hasPattern(code, /<pre|<code|bg-muted.*rounded/);
  const hasMonoFont = hasPattern(code, /font-mono/);
  if (hasCodeDisplay && !hasMonoFont) score -= 0.5;

  return review(
    'typography', score, 0.75,
    score < 6 ? 'Typography needs improvement — line height, size scale, or max-width missing' : 'Typography fundamentals in place',
    'Ensure body text uses leading-relaxed with max-w-prose. Use 3–4 distinct font weights for hierarchy. Avoid pure black on white for body copy.',
    'Better typography increases readability by 30% and reduces bounce rate',
  );
}

export function scoreSpacing(input: DirectorReviewInput): DirectorCategoryReview {
  const { code } = input;
  let score = 7.0;

  // Section-level spacing
  const hasLargeSection = hasPattern(code, /py-\d{2,}|py-\[[\d]+/);
  if (!hasLargeSection) score -= 1.0;

  // Component gaps
  const hasGap = hasPattern(code, /gap-\d|space-[xy]-\d/);
  if (!hasGap) score -= 0.5;

  // 8pt grid alignment hints (multiples of 4)
  const has8ptGrid = hasPattern(code, /p-[48]|p-\d{2}|m-[48]|gap-[48]/);
  if (!has8ptGrid) score -= 0.3;

  // Tight padding detection (bad)
  const tightPadding = countPattern(code, /p-[01](?!\d)|px-1(?!\d)|py-1(?!\d)/g);
  if (tightPadding > 3) score -= 0.8;

  // Good generous whitespace
  const generousWhitespace = countPattern(code, /py-1[6-9]|py-2\d|mt-\d{2}|mb-\d{2}/g);
  if (generousWhitespace >= 3) score += 0.5;

  return review(
    'spacing', score, 0.78,
    score < 6 ? 'Insufficient spacing — components feel cramped without breathing room' : 'Spacing is adequate',
    'Apply 8-point grid consistently. Use generous section padding (py-16–py-24). Increase gap between components (gap-6–gap-12).',
    'Proper spacing increases premium perception by 35% and trust scores',
  );
}

export function scoreComposition(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, sectionOrder } = input;
  let score = 7.0;

  // Layout balance: grid or flex
  const hasGridLayout = hasPattern(code, /grid-cols-\d|grid-cols-\[/);
  const hasFlexLayout = hasPattern(code, /flex.*justify-between|flex.*items-center/);
  if (!hasGridLayout && !hasFlexLayout) score -= 0.8;

  // Hero composition (image + text alongside)
  const hasHeroComposition = hasPattern(code, /grid-cols-2|lg:grid-cols-2|md:flex.*gap/);
  if (sectionOrder[0]?.toLowerCase().includes('hero') && !hasHeroComposition) score -= 0.5;

  // Card grid (3-up, 2-up common compositions)
  const has3UpCard = hasPattern(code, /grid-cols-3|md:grid-cols-3|lg:grid-cols-3/);
  const has2UpCard = hasPattern(code, /grid-cols-2|md:grid-cols-2/);
  if (has3UpCard || has2UpCard) score += 0.5;

  // Asymmetric layouts (more advanced)
  const hasAsymmetric = hasPattern(code, /col-span-[2-9]|row-span-[2-9]/);
  if (hasAsymmetric) score += 0.3;

  return review(
    'composition', score, 0.72,
    score < 6 ? 'Composition needs work — layout lacks visual balance and structure' : 'Composition is balanced',
    'Use deliberate grid compositions (2-up, 3-up, asymmetric). Hero should use a side-by-side or offset composition, not a centered stack.',
    'Better composition creates visual interest and increases time-on-page',
  );
}

export function scoreLayoutRhythm(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, sectionOrder } = input;
  let score = 7.0;

  // Section count matters for rhythm
  const sectionCount = sectionOrder.length;
  if (sectionCount < 3) score -= 1.0;
  if (sectionCount >= 5) score += 0.5;

  // Alternating background (light/dark sections)
  const hasAltBg = hasPattern(code, /bg-muted|bg-secondary|bg-accent|bg-card|bg-background/);
  if (!hasAltBg) score -= 0.8;

  // Dividers / section separators
  const hasDividers = hasPattern(code, /border-t|border-b|Separator/);
  if (!hasDividers && sectionCount > 3) score -= 0.3;

  // Consistent section entry point
  const hasConsistentContainer = hasPattern(code, /container.*mx-auto|max-w-.*mx-auto/);
  if (!hasConsistentContainer) score -= 0.5;

  return review(
    'layoutRhythm', score, 0.70,
    score < 6 ? 'Layout rhythm is broken — sections lack visual cadence and breathing' : 'Layout rhythm is acceptable',
    'Alternate section backgrounds for visual rhythm. Use consistent container widths. Add section separators or generous vertical spacing between content zones.',
    'Better rhythm reduces visual fatigue and improves scroll engagement',
  );
}

export function scoreBrandConsistency(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, dnaId, tokenScore } = input;
  let score = 7.0;

  // Token usage (CSS variables signal brand consistency)
  if (tokenScore !== undefined) {
    score = score * 0.6 + tokenScore * 0.4;
  }

  // Primary color used consistently
  const primaryUsage = countPattern(code, /text-primary|bg-primary|border-primary/g);
  if (primaryUsage < 2) score -= 0.5;
  if (primaryUsage >= 5) score += 0.3;

  // DNA alignment: if DNA is set, check characteristic patterns
  if (dnaId === 'stripe' || dnaId === 'linear') {
    const hasMinimalDesign = hasPattern(code, /bg-white|bg-background|text-foreground/);
    if (!hasMinimalDesign) score -= 0.5;
  }
  if (dnaId === 'apple') {
    const hasAppleMinimal = !hasPattern(code, /rainbow|multicolor|colorful/i);
    if (!hasAppleMinimal) score -= 0.5;
  }

  // Hardcoded colors (break brand)
  const hardcodedColors = countPattern(code, /#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}(?![0-9a-fA-F])/g);
  if (hardcodedColors > 5) score -= 0.8;

  return review(
    'brandConsistency', score, tokenScore !== undefined ? 0.85 : 0.65,
    score < 6 ? `Brand inconsistency detected — hardcoded colors or missing token usage` : 'Brand consistency is maintained',
    'Replace all hardcoded colors with CSS variables. Use primary/secondary/muted tokens throughout. Ensure all interactive elements share the same visual language.',
    'Consistent brand application builds trust and recognition',
  );
}

export function scorePremiumFeel(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, evaluatorScore, uxScore } = input;
  let score = 6.5;

  // Subtle gradients (premium signal)
  const hasGradient = hasPattern(code, /gradient|from-|to-/);
  if (hasGradient) score += 0.4;

  // Micro-interactions / hover states
  const hasHover = hasPattern(code, /hover:|transition-/);
  if (hasHover) score += 0.5;

  // Rounded corners (modern premium UI)
  const hasRounded = hasPattern(code, /rounded-xl|rounded-2xl|rounded-3xl/);
  if (hasRounded) score += 0.3;

  // Shadows (depth and polish)
  const hasShadow = hasPattern(code, /shadow-sm|shadow-md|shadow-lg|shadow-xl|shadow-2xl/);
  if (hasShadow) score += 0.4;

  // Glassmorphism / backdrop blur (premium)
  const hasGlass = hasPattern(code, /backdrop-blur|backdrop-filter/);
  if (hasGlass) score += 0.2;

  // Evaluator and UX compound effect
  if (evaluatorScore !== undefined && evaluatorScore >= 8) score += 0.3;
  if (uxScore !== undefined && uxScore >= 7) score += 0.2;

  // Generic patterns reduce premium feel
  const genericBtnCount = countPattern(code, /btn-default|btn-outline\b/g);
  if (genericBtnCount > 2) score -= 0.5;

  return review(
    'premiumFeel', score, 0.72,
    score < 6 ? 'Low premium feel — design lacks polish, depth, and refinement signals' : 'Premium feel is adequate',
    'Add subtle gradients, consistent hover transitions (transition-all duration-200), and refined shadow depth. Consider backdrop-blur for nav and modals.',
    'Higher premium perception increases willingness to pay and trust',
  );
}

export function scoreModernity(input: DirectorReviewInput): DirectorCategoryReview {
  const { code } = input;
  let score = 7.0;

  // Modern component patterns
  const hasModernPatterns = hasPattern(code, /Dialog|Sheet|Popover|NavigationMenu|Command|Tabs/);
  if (hasModernPatterns) score += 0.5;

  // Dark mode readiness
  const hasDarkMode = hasPattern(code, /dark:|dark:/);
  if (hasDarkMode) score += 0.3;

  // Framer-like animation tokens
  const hasMotion = hasPattern(code, /motion|animate-|transition-all|transform/);
  if (hasMotion) score += 0.3;

  // Modern typography patterns
  const hasModernType = hasPattern(code, /tracking-tight|tracking-tighter|font-display/);
  if (hasModernType) score += 0.2;

  // Old-school patterns (penalize)
  const hasOldPatterns = countPattern(code, /float-left|float-right|table-fixed|border="0"/g);
  if (hasOldPatterns > 0) score -= 1.0;

  // Icon usage (modern UIs use icons)
  const hasIcons = hasPattern(code, /lucide-react|heroicons|<Icon|<.*Icon\b/);
  if (!hasIcons) score -= 0.4;

  return review(
    'modernity', score, 0.72,
    score < 6 ? 'Design feels dated — missing modern UI patterns and interactions' : 'Design modernity is acceptable',
    'Use shadcn/ui primitives (Dialog, Sheet, Command, Tabs). Add Framer Motion-style transitions. Use modern tracking-tight typography for headings.',
    'Modern design patterns increase conversion rates for tech-savvy audiences',
  );
}

export function scoreTrust(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, uxScore, conversionPrediction } = input;
  let score = 6.5;

  // Social proof signals
  const hasSocialProof = hasPattern(code, /testimonial|review|rating|stars|customer|client/i);
  if (hasSocialProof) score += 1.0;

  // Logo cloud / trusted-by
  const hasLogoCloud = hasPattern(code, /trusted.*by|partner|logo.*cloud|brands/i);
  if (hasLogoCloud) score += 0.5;

  // Security/trust badges
  const hasTrustBadges = hasPattern(code, /secure|ssl|encrypt|gdpr|iso|soc2/i);
  if (hasTrustBadges) score += 0.4;

  // Team/founder signals
  const hasTeam = hasPattern(code, /team|founder|about/i);
  if (hasTeam) score += 0.3;

  // Stats / numbers (social proof via data)
  const hasStats = hasPattern(code, /\d+[kKmM+]\+?.*users|customers|companies|\d+%.*improvement/);
  if (hasStats) score += 0.4;

  // UX trust signals
  if (uxScore !== undefined) score = score * 0.7 + (uxScore * 0.5 + 2.5) * 0.3;
  if (conversionPrediction === 'High' || conversionPrediction === 'Very High') score += 0.3;

  return review(
    'trust', score, 0.78,
    score < 6 ? 'Weak trust signals — site lacks social proof and credibility markers' : 'Trust signals are adequate',
    'Add testimonials with names and photos, a trusted-by logo cloud, real usage stats (X+ customers), and security badges where relevant.',
    'Every trust signal added increases conversion rates by 8–15%',
  );
}

export function scoreEmotionalImpact(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, sectionOrder } = input;
  let score = 6.0;

  // Emotional language in hero
  const hasHero = sectionOrder[0]?.toLowerCase().includes('hero');
  const hasEmotionalHero = hasPattern(code, /transform|future|unlock|build|grow|accelerate|supercharge|effortless/i);
  if (hasHero && hasEmotionalHero) score += 1.0;

  // Strong value proposition language
  const hasValueProp = hasPattern(code, /10x|faster|better|save.*hours|never.*again|instantly/i);
  if (hasValueProp) score += 0.5;

  // Visual emotion: images, gradients, illustrations
  const hasVisualEmotion = hasPattern(code, /gradient|illustration|hero.*image|feature.*image/i);
  if (hasVisualEmotion) score += 0.4;

  // Empty/bland copy
  const hasGenericCopy = countPattern(code, /Lorem|placeholder|coming soon|under construction/ig);
  if (hasGenericCopy > 0) score -= 2.0;

  // User-centric language
  const hasUserCentric = hasPattern(code, /\byou\b|\byour\b/i);
  if (hasUserCentric) score += 0.3;

  return review(
    'emotionalImpact', score, 0.65,
    score < 6 ? 'Weak emotional impact — copy and visuals do not resonate emotionally' : 'Emotional impact is present',
    'Lead with emotional transformation ("Never waste time on X again"). Use second-person copy ("you, your"). Add visual metaphors for key benefits.',
    'Emotionally resonant design increases conversion intent by 20–30%',
  );
}

export function scoreStorytelling(input: DirectorReviewInput): DirectorCategoryReview {
  const { sectionOrder } = input;
  let score = 6.0;

  // Good narrative flow: problem → solution → proof → CTA
  const sectionLower = sectionOrder.map(s => s.toLowerCase());
  const hasHero    = sectionLower.some(s => s.includes('hero'));
  const hasFeature = sectionLower.some(s => s.includes('feature') || s.includes('benefit') || s.includes('how'));
  const hasProof   = sectionLower.some(s => s.includes('testimon') || s.includes('review') || s.includes('social') || s.includes('stats'));
  const hasCTA     = sectionLower.some(s => s.includes('cta') || s.includes('pricing') || s.includes('start'));

  if (hasHero) score += 0.5;
  if (hasFeature) score += 0.7;
  if (hasProof) score += 0.8;
  if (hasCTA) score += 0.5;

  // Non-linear story (sections out of narrative order)
  if (hasHero && hasCTA && !hasFeature) score -= 0.5;
  if (hasProof && !hasFeature) score -= 0.3;

  return review(
    'storytelling', score, 0.68,
    score < 6 ? 'Poor narrative flow — page does not guide users through a story arc' : 'Storytelling arc is present',
    'Structure page as: Problem → Solution → How it works → Proof → CTA. Each section should flow naturally into the next.',
    'Strong narrative flow increases page completion rate by 25%',
  );
}

export function scoreCTAPlacement(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, uxScore } = input;
  let score = 6.5;

  // Primary CTA exists
  const hasPrimaryCTA = hasPattern(code, /Get Started|Try.*Free|Start.*Free|Sign Up|Get.*Free|Book.*Demo|Request.*Demo/i);
  if (hasPrimaryCTA) score += 1.0;

  // CTA button styling (prominent)
  const hasBtnVariant = hasPattern(code, /variant="default"|variant="primary"|bg-primary/);
  if (hasBtnVariant) score += 0.5;

  // Multiple CTA placements (hero + mid + bottom)
  const ctaCount = countPattern(code, /Get Started|Try.*Free|Sign Up|Get.*Free|Book.*Demo/gi);
  if (ctaCount >= 2) score += 0.5;
  if (ctaCount >= 3) score += 0.3;
  if (ctaCount === 0) score -= 2.0;

  // Secondary CTA alongside primary
  const hasSecondaryAction = hasPattern(code, /Learn More|See How|Watch.*Demo|View.*Demo/i);
  if (hasSecondaryAction) score += 0.3;

  // UX CTA discoverability proxy
  if (uxScore !== undefined && uxScore < 5) score -= 0.5;

  return review(
    'ctaPlacement', score, 0.82,
    score < 6 ? 'CTA placement is weak — primary action is not prominent or discoverable' : 'CTA placement is good',
    'Place a primary CTA in the hero, in the middle of the page, and at the bottom. Use high-contrast primary button variant. Pair with a secondary "Learn More" action.',
    'Optimized CTA placement increases click-through rates by 40–80%',
  );
}

export function scorePricingPresentation(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, hasPricing } = input;
  if (!hasPricing) {
    return review(
      'pricingPresentation', 7.5, 0.5,
      'No pricing section detected — scoring not applicable',
      'If adding pricing, use a 3-tier table with a recommended tier highlighted.',
      'N/A — no pricing section',
    );
  }

  let score = 6.5;

  // 3-tier pricing (recommended pattern)
  const hasThreeTier = hasPattern(code, /Starter|Pro|Enterprise|Free|Basic|Business/i);
  if (hasThreeTier) score += 0.8;

  // Most popular / recommended badge
  const hasBadge = hasPattern(code, /Most Popular|Recommended|Best Value|Popular/i);
  if (hasBadge) score += 0.6;

  // Annual/monthly toggle
  const hasToggle = hasPattern(code, /monthly|annually|toggle|Switch/i);
  if (hasToggle) score += 0.4;

  // Feature comparison list
  const hasFeatureList = hasPattern(code, /\/.*feature|✓|checkmark|included/i);
  if (hasFeatureList) score += 0.5;

  // Price display
  const hasPrice = hasPattern(code, /\$\d+|\€\d+|free/i);
  if (!hasPrice) score -= 1.5;

  return review(
    'pricingPresentation', score, 0.80,
    score < 6 ? 'Pricing section lacks clarity — tier differentiation or feature comparison is weak' : 'Pricing presentation is clear',
    'Use 3-tier pricing with a highlighted "Most Popular" plan. Include annual/monthly toggle. Show feature checklist per tier. Display prices prominently.',
    'Clear pricing presentation reduces hesitation and increases plan selection rates',
  );
}

export function scoreDashboardExperience(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, isDashboard } = input;
  if (!isDashboard) {
    return review(
      'dashboardExperience', 7.5, 0.5,
      'No dashboard detected — scoring not applicable',
      'If adding a dashboard, prioritize data clarity over visual density.',
      'N/A — no dashboard section',
    );
  }

  let score = 6.0;

  // Key dashboard components
  const hasDataTable = hasPattern(code, /DataTable|<table/);
  if (hasDataTable) score += 0.6;

  const hasTabs = hasPattern(code, /TabsList|TabsTrigger/);
  if (hasTabs) score += 0.4;

  const hasBadge = hasPattern(code, /\bBadge\b/);
  if (hasBadge) score += 0.3;

  const hasSkeleton = hasPattern(code, /\bSkeleton\b/);
  if (hasSkeleton) score += 0.4;

  const hasChart = hasPattern(code, /Chart|recharts|Chart\.js|d3/i);
  if (hasChart) score += 0.5;

  // Stat cards
  const hasStatCards = hasPattern(code, /Card.*\d+[kKmM]|stat.*card|metric.*card/i);
  if (hasStatCards) score += 0.4;

  return review(
    'dashboardExperience', score, 0.78,
    score < 6 ? 'Dashboard experience is poor — missing key data visualization or navigation components' : 'Dashboard experience is solid',
    'Include stat cards at top, DataTable for records, tabs for data views, skeleton loading states, and Badge for status. Add chart for key metrics.',
    'Better dashboard UX reduces user errors and increases feature adoption',
  );
}

export function scoreNavigation(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, authState } = input;
  let score = 6.5;

  // Navigation presence
  const hasNav = hasPattern(code, /NavigationMenu|<nav|navbar|header/i);
  if (!hasNav) { score -= 2.0; }

  // Logo presence
  const hasLogo = hasPattern(code, /logo|brand|<Logo/i);
  if (hasLogo) score += 0.4;

  // Navigation items (not too many)
  const navItems = countPattern(code, /NavigationMenuItem|nav.*item/gi);
  if (navItems >= 3 && navItems <= 7) score += 0.5;
  if (navItems > 8) score -= 0.5;

  // Mobile navigation
  const hasMobileNav = hasPattern(code, /Sheet.*nav|hamburger|mobile-nav|MenuIcon/i);
  if (hasMobileNav) score += 0.5;

  // Auth state navigation
  if (authState === 'authenticated') {
    const hasAuthNav = hasPattern(code, /Avatar|DropdownMenu.*profile|user.*menu/i);
    if (hasAuthNav) score += 0.5;
    else score -= 0.5;
  }

  return review(
    'navigation', score, 0.80,
    score < 6 ? 'Navigation is unclear or missing — users may struggle to orient themselves' : 'Navigation is functional',
    'Ensure navigation includes logo, 4–6 primary links, a clear CTA button, and a mobile-responsive drawer. Keep nav fixed/sticky for long pages.',
    'Clear navigation reduces bounce rate and improves discoverability',
  );
}

export function scoreForms(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, isForm } = input;
  if (!isForm) {
    return review(
      'forms', 7.5, 0.5,
      'No form detected — scoring not applicable',
      'If adding forms, use React Hook Form + Zod with clear labels and error messages.',
      'N/A — no form section',
    );
  }

  let score = 6.0;

  // RHF / Zod usage
  const hasRHF = hasPattern(code, /useForm|handleSubmit|register/);
  if (hasRHF) score += 0.6;

  const hasZod = hasPattern(code, /z\.object|zodResolver|z\.string/);
  if (hasZod) score += 0.5;

  // Labels (htmlFor with or without =, or Label component)
  const hasLabels = hasPattern(code, /htmlFor|<Label/);
  if (!hasLabels) score -= 0.8;

  // Error messages
  const hasErrors = hasPattern(code, /error|errors\.|formState\.errors/);
  if (!hasErrors) score -= 0.6;

  // Loading state
  const hasLoading = hasPattern(code, /isSubmitting|isLoading|disabled.*submit/);
  if (!hasLoading) score -= 0.3;

  // Placeholder labels (bad accessibility pattern)
  const hasPlaceholderOnly = hasPattern(code, /placeholder=.*(?!htmlFor)/);
  if (hasPlaceholderOnly && !hasLabels) score -= 0.5;

  return review(
    'forms', score, 0.82,
    score < 6 ? 'Form experience is poor — missing validation, labels, or error handling' : 'Form implementation is solid',
    'Use React Hook Form + Zod. All fields must have visible labels (not placeholder-only). Show inline validation errors. Disable submit during loading.',
    'Better form UX reduces abandonment by 30–50%',
  );
}

export function scoreMotion(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, motionScore } = input;
  let score = 6.5;

  if (motionScore !== undefined) {
    score = score * 0.4 + motionScore * 0.6;
  } else {
    // Heuristic analysis
    const hasTransition = hasPattern(code, /transition-|duration-\d{2,}/);
    if (hasTransition) score += 0.5;

    const hasAnimate = hasPattern(code, /animate-|framer-motion|motion\./);
    if (hasAnimate) score += 0.5;

    // Excessive animation (distracting)
    const animateCount = countPattern(code, /animate-/g);
    if (animateCount > 10) score -= 0.5;

    // Hover states (micro-interactions)
    const hoverCount = countPattern(code, /hover:/g);
    if (hoverCount >= 3) score += 0.3;
  }

  return review(
    'motion', score, motionScore !== undefined ? 0.80 : 0.65,
    score < 6 ? 'Motion design is lacking — missing transitions and micro-interactions' : 'Motion design is tasteful',
    'Add purposeful hover transitions (transition-all duration-200 ease-in-out). Use entrance animations sparingly for hero and key sections. Avoid animation on every element.',
    'Purposeful motion increases perceived polish and engagement',
  );
}

export function scoreAccessibility(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, accessibilityScore, uxScore } = input;
  let score = 6.5;

  if (accessibilityScore !== undefined) {
    score = score * 0.3 + accessibilityScore * 0.7;
  } else {
    // Heuristic
    const hasAria = hasPattern(code, /aria-label|aria-labelledby|aria-describedby|role=/);
    if (hasAria) score += 0.8;

    const hasAlt = hasPattern(code, /alt="[^"]|alt={/);
    if (!hasAlt && hasPattern(code, /<img/)) score -= 0.5;

    const hasFocusRing = hasPattern(code, /focus-visible:|focus:ring/);
    if (hasFocusRing) score += 0.5;

    if (uxScore !== undefined) score = score * 0.7 + (uxScore * 0.7 + 2) * 0.3;
  }

  return review(
    'accessibility', score, accessibilityScore !== undefined ? 0.85 : 0.70,
    score < 6 ? 'Accessibility gaps — missing ARIA labels, alt text, or focus management' : 'Accessibility fundamentals present',
    'Ensure all interactive elements have aria-label. All images must have descriptive alt text. Add focus-visible:ring-2 to all focusable elements.',
    'Accessible design expands your audience and reduces legal risk',
  );
}

export function scorePerformance(input: DirectorReviewInput): DirectorCategoryReview {
  const { code } = input;
  let score = 7.0;

  // Lazy loading images
  const hasLazyImages = hasPattern(code, /loading="lazy"|loading={.*lazy/);
  if (hasLazyImages) score += 0.4;

  // Skeleton loading states
  const hasSkeleton = hasPattern(code, /\bSkeleton\b/);
  if (hasSkeleton) score += 0.5;

  // Avoid heavy synchronous imports
  const hasDynamicImport = hasPattern(code, /import\(/);
  if (hasDynamicImport) score += 0.3;

  // Huge inline SVGs (negative)
  const svgSize = (code.match(/<svg[^>]*>/g) ?? []).reduce((acc, tag) => acc + tag.length, 0);
  if (svgSize > 5000) score -= 0.8;

  // next/image or optimized images
  const hasOptimizedImage = hasPattern(code, /next\/image|OptimizedImage|ImageKit/);
  if (hasOptimizedImage) score += 0.3;

  return review(
    'performance', score, 0.68,
    score < 6 ? 'Performance signals are weak — missing lazy loading and skeleton states' : 'Performance signals are adequate',
    'Add skeleton loading states for async content. Use loading="lazy" on images. Add perceived performance hints (spinners, progress bars) for async operations.',
    'Faster perceived performance reduces bounce rate by 15–25%',
  );
}

export function scoreResponsiveness(input: DirectorReviewInput): DirectorCategoryReview {
  const { code } = input;
  let score = 6.5;

  // Responsive breakpoints
  const hasMd = hasPattern(code, /\bmd:/);
  const hasLg = hasPattern(code, /\blg:/);
  const hasSm = hasPattern(code, /\bsm:/);
  if (hasMd) score += 0.8;
  if (hasLg) score += 0.5;
  if (hasSm) score += 0.3;

  // Mobile-first patterns
  const hasFlexWrap = hasPattern(code, /flex-wrap|flex-col.*md:flex-row/);
  if (hasFlexWrap) score += 0.4;

  // Hidden/visible at breakpoints
  const hasBreakpointHide = hasPattern(code, /hidden.*md:|md:hidden|sm:hidden/);
  if (hasBreakpointHide) score += 0.3;

  // Fixed widths on small screens (bad)
  const hasFixedNarrow = countPattern(code, /w-\d{3}(?!px)|min-w-\d{3}/g);
  if (hasFixedNarrow > 3) score -= 0.5;

  return review(
    'responsiveness', score, 0.75,
    score < 6 ? 'Responsiveness is incomplete — missing mobile breakpoints or flex-wrap' : 'Responsiveness is solid',
    'Use md: and lg: breakpoints consistently. Convert fixed-width grids to responsive (grid-cols-1 md:grid-cols-2 lg:grid-cols-3). Add mobile drawer navigation.',
    'Mobile responsiveness directly impacts 50%+ of traffic performance',
  );
}

export function scoreComponentConsistency(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, treeScore } = input;
  let score = 6.5;

  if (treeScore !== undefined) {
    score = score * 0.4 + treeScore * 0.6;
  }

  // shadcn/ui consistency (canonical pattern)
  const shadcnComponents = countPattern(
    code,
    /\b(Button|Card|Badge|Dialog|Sheet|Tabs|Select|Input|Label|Textarea|Separator|Avatar|DropdownMenu|NavigationMenu|Command|Skeleton|Progress|Switch|Checkbox|RadioGroup|Tooltip|Popover|ScrollArea|Table|Form|Alert|AlertDialog|AspectRatio|Collapsible|Toggle|ToggleGroup|HoverCard|Menubar|ContextMenu|Accordion|Calendar|DataTable)\b/g,
  );
  if (shadcnComponents >= 5) score += 0.5;
  if (shadcnComponents >= 10) score += 0.3;
  if (shadcnComponents === 0) score -= 1.5;

  // Mixed button styles (inconsistency signal)
  const btnVariants = new Set(
    (code.match(/variant="(default|secondary|outline|ghost|link|destructive)"/g) ?? []).map(m => m),
  ).size;
  if (btnVariants > 3) score -= 0.5;

  return review(
    'componentConsistency', score, treeScore !== undefined ? 0.82 : 0.70,
    score < 6 ? 'Component inconsistency — mixed UI patterns and styles detected' : 'Component consistency is good',
    'Standardize on shadcn/ui primitives throughout. Use a single Button variant system. Avoid mixing CSS framework patterns.',
    'Consistent components reduce cognitive load and reinforce brand identity',
  );
}

export function scoreTokenConsistency(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, tokenScore } = input;
  let score = tokenScore !== undefined ? tokenScore : 6.5;

  // CSS variable usage
  const cssVarUsage = countPattern(code, /var\(--/g);
  if (cssVarUsage < 5) score = Math.min(score, 6.0);
  if (cssVarUsage >= 10) score = Math.max(score, 6.5);

  // Hardcoded Tailwind colors (break token system)
  const hardcodedTwColors = countPattern(code, /text-blue-\d{3}|text-red-\d{3}|text-green-\d{3}|bg-blue-\d{3}|bg-red-\d{3}/g);
  if (hardcodedTwColors > 3) score -= 0.8;

  return review(
    'tokenConsistency', score, tokenScore !== undefined ? 0.85 : 0.65,
    score < 6 ? 'Design token system inconsistently applied — hardcoded colors detected' : 'Token usage is consistent',
    'Replace all hardcoded Tailwind color classes with semantic tokens (text-foreground, bg-primary, text-muted-foreground). Use CSS variables for custom values.',
    'Token consistency enables one-click theme switching and brand updates',
  );
}

export function scoreDNAAlignment(input: DirectorReviewInput): DirectorCategoryReview {
  const { code, dnaId } = input;
  let score = 7.0;

  if (!dnaId || dnaId === 'generic') {
    return review(
      'dnaAlignment', 6.5, 0.4,
      'No specific DNA target — using generic patterns',
      'Set a specific design DNA (e.g. Stripe, Linear, Vercel) for a more distinctive output.',
      'DNA alignment produces distinctive, on-brand outputs',
    );
  }

  // Check DNA-specific patterns
  const dnaPatterns: Record<string, RegExp> = {
    stripe:  /gradient-from-|--stripe|payment|\bflex.*checkout/i,
    linear:  /tracking-tight|font-bold.*text-[56]xl|kbd|Command|linear.*gradient/i,
    vercel:  /bg-black|text-white.*bg-black|dark.*minimal|deployments/i,
    framer:  /motion|animation|interactive|spring|ease/i,
    apple:   /text-sm.*text-muted|clean.*minimal|sans-serif|sf-pro/i,
    notion:  /prose|block.*editor|drag|sidebar|breadcrumb/i,
    github:  /repo|commit|pr|issue|code|markdown/i,
    paypal:  /trust|secure|payment|checkout|cart/i,
  };

  const dnaPattern = dnaPatterns[dnaId.toLowerCase()];
  if (dnaPattern) {
    if (hasPattern(code, dnaPattern)) score += 1.0;
    else score -= 0.8;
  }

  return review(
    'dnaAlignment', score, dnaPattern ? 0.78 : 0.50,
    score < 6 ? `Design does not align with ${dnaId} DNA — characteristic patterns are absent` : `Design aligns well with ${dnaId} DNA`,
    `Reinforce ${dnaId}-specific patterns: typography, spacing, color strategy, and component choices that distinguish this brand's design language.`,
    'DNA alignment creates distinctive, memorable experiences',
  );
}

export function scoreUXAlignment(input: DirectorReviewInput): DirectorCategoryReview {
  const { uxScore, uxTopIssues } = input;

  if (uxScore === undefined) {
    return review(
      'uxAlignment', 7.0, 0.4,
      'UX Intelligence data not available',
      'UX Intelligence step must run before Design Director for full alignment scoring.',
      'N/A — UX data not available',
    );
  }

  const topIssueCount = uxTopIssues?.length ?? 0;
  let score = uxScore;

  // Penalty per critical UX issue that design didn't address
  score -= topIssueCount * 0.3;

  return review(
    'uxAlignment', clamp(score), uxScore >= 6 ? 0.85 : 0.75,
    score < 6 ? `UX issues detected: ${uxTopIssues?.slice(0, 2).join('; ') ?? 'none'}` : 'Design aligns with UX Intelligence recommendations',
    'Address top UX issues identified: ' + (uxTopIssues?.slice(0, 3).join(', ') || 'none detected') + '.',
    'Resolving UX issues improves conversion prediction by one tier',
  );
}

export function scoreConversionAlignment(input: DirectorReviewInput): DirectorCategoryReview {
  const { conversionPrediction, criticScore, evaluatorScore, uxScore } = input;

  let score = 6.5;

  // Map conversion prediction to score
  const predScores: Record<string, number> = {
    'Very High': 9.5, 'High': 7.5, 'Medium': 5.5, 'Low': 3.5, 'Very Low': 1.5,
  };
  if (conversionPrediction && predScores[conversionPrediction] !== undefined) {
    score = (score + predScores[conversionPrediction]) / 2;
  }

  // Blend critic and evaluator signals
  if (criticScore !== undefined) score = score * 0.7 + criticScore * 0.3;
  if (evaluatorScore !== undefined) score = score * 0.8 + evaluatorScore * 0.2;
  if (uxScore !== undefined) score = score * 0.8 + uxScore * 0.2;

  return review(
    'conversionAlignment', score, conversionPrediction ? 0.80 : 0.55,
    score < 6 ? `Conversion signals are weak — predicted: ${conversionPrediction ?? 'unknown'}` : `Conversion alignment is good — predicted: ${conversionPrediction ?? 'N/A'}`,
    'Optimize the full funnel: hero → benefits → social proof → pricing → CTA. Each section should progress the user toward conversion.',
    'Full-funnel conversion optimization increases goal completion by 30–60%',
  );
}
