// ── V7.2.9 Motion Intelligence Engine — Motion Retriever ──────────────────────
// DNA-aware top-K motion reference retrieval. Independent from layout RAG.

import { MOTION_CORPUS, MOTION_DNA_PROFILES, getMotionDNAForDesignLanguage } from './motionReferences.js';
import type { MotionReference, MotionCategory, MotionDNA } from './motionReferences.js';
import { recordMotionRetrieval } from '../telemetry/motionMetrics.js';

export interface MotionRetrievalInput {
  sectionType: string;
  designLanguage: string;
  industry?: string;
  topK?: number;
}

export interface MotionRetrievalResult {
  sectionType: string;
  references: MotionReference[];
  motionDNA: MotionDNA;
  intensity: string;
  presets: string[];
}

// Map section types to motion categories
const SECTION_TO_MOTION_CATEGORY: Record<string, MotionCategory> = {
  Hero:              'hero-motion',
  Features:          'features-motion',
  FeaturesBento:     'features-motion',
  Pricing:           'pricing-motion',
  Testimonials:      'testimonials-motion',
  FAQ:               'faq-motion',
  Dashboard:         'dashboard-motion',
  DashboardPreview:  'dashboard-motion',
  CTA:               'cta-motion',
  Navbar:            'navbar-motion',
  SocialProof:       'hero-motion',    // fallback to hero-motion for generic
  LogoCloud:         'hero-motion',
  Gallery:           'features-motion',
  Contact:           'cta-motion',
  Footer:            'navbar-motion',
};

// Motion presets code strings — injected directly into codegen
export const MOTION_PRESETS = `
// ── Framer Motion Presets (V7.2.9) ──────────────────────────────────────────
// Import: import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
// const rm = useReducedMotion(); // Always check in component

const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const fadeDown = {
  hidden:  { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const slideLeft = {
  hidden:  { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

const slideRight = {
  hidden:  { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

const scaleIn = {
  hidden:  { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const staggerChildren = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0 } },
};

// Reduced-motion safe variants — collapse to opacity only
const safeVariants = (rm: boolean, base: Record<string, unknown>) =>
  rm ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.15 } } } : base;
`.trim();

function scoreDNAMatch(ref: MotionReference, motionDNA: MotionDNA): number {
  if (ref.dna.includes(motionDNA)) return 3;
  // Fallback affinity groups
  const affinityGroups: MotionDNA[][] = [
    ['linear', 'vercel', 'cursor', 'raycast'],
    ['stripe', 'apple'],
    ['framer'],
    ['notion'],
  ];
  for (const group of affinityGroups) {
    if (group.includes(motionDNA)) {
      const overlap = ref.dna.filter(d => group.includes(d));
      if (overlap.length > 0) return 1;
    }
  }
  return 0;
}

export function retrieveMotionReferences(input: MotionRetrievalInput): MotionRetrievalResult {
  const { sectionType, designLanguage, topK = 3 } = input;

  const motionDNA = getMotionDNAForDesignLanguage(designLanguage);
  const dnaProfile = MOTION_DNA_PROFILES[designLanguage] ?? MOTION_DNA_PROFILES['minimal-flat'];
  const category = SECTION_TO_MOTION_CATEGORY[sectionType] ?? 'hero-motion';

  const candidates = MOTION_CORPUS.filter(r => r.category === category);

  const scored = candidates.map(ref => {
    let score = 0;
    score += scoreDNAMatch(ref, motionDNA) * 3;
    score += ref.qualityHint;
    // Penalize intensity mismatch — high-intensity refs on low-motion DNA
    const intensityMap = { low: 0, medium: 1, high: 2 };
    const dnaIntensityLevel = intensityMap[dnaProfile.intensity];
    const refIntensityLevel = intensityMap[ref.intensity];
    const intensityDiff = Math.abs(dnaIntensityLevel - refIntensityLevel);
    score -= intensityDiff * 1.5;
    // Boost reduced-motion reference
    if (ref.animationType.includes('none') || ref.id.includes('reduced')) score += 2;
    return { ref, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topRefs = scored.slice(0, topK).map(s => s.ref);

  // Build preset list based on DNA profile
  const presets = dnaProfile.allowedTypes.map(t => {
    const map: Record<string, string> = {
      fade: 'fadeIn', fadeUp: 'fadeUp', fadeDown: 'fadeDown',
      slideLeft: 'slideLeft', slideRight: 'slideRight',
      scaleIn: 'scaleIn', stagger: 'staggerChildren',
    };
    return map[t] ?? t;
  });

  recordMotionRetrieval({ sectionType, designLanguage, motionDNA, count: topRefs.length, intensity: dnaProfile.intensity });

  return { sectionType, references: topRefs, motionDNA, intensity: dnaProfile.intensity, presets };
}

export function retrieveAllSectionMotion(
  sectionOrder: string[],
  designLanguage: string,
): Map<string, MotionRetrievalResult> {
  const results = new Map<string, MotionRetrievalResult>();
  for (const section of sectionOrder) {
    const result = retrieveMotionReferences({ sectionType: section, designLanguage, topK: 2 });
    results.set(section, result);
  }
  return results;
}

export function buildMotionContext(
  designLanguage: string,
  sectionOrder: string[],
): string {
  const dnaProfile = MOTION_DNA_PROFILES[designLanguage] ?? MOTION_DNA_PROFILES['minimal-flat'];
  const motionDNA  = getMotionDNAForDesignLanguage(designLanguage);
  const sectionResults = retrieveAllSectionMotion(sectionOrder, designLanguage);

  const lines: string[] = [
    `## Motion Intelligence (V7.2.9)`,
    ``,
    `**Motion DNA:** ${motionDNA} | **Intensity:** ${dnaProfile.intensity} | **Design Language:** ${designLanguage}`,
    `**Allowed animation types:** ${dnaProfile.allowedTypes.join(', ')}`,
    `**Max duration:** ${dnaProfile.maxDuration}ms | **Stagger:** ${dnaProfile.stagger ? 'yes' : 'no'}`,
    ``,
    `### MANDATORY Motion Rules`,
    `1. ALWAYS import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'`,
    `2. ALWAYS call const reducedMotion = useReducedMotion() in every component with animation`,
    `3. When reducedMotion is true: disable stagger, disable scale, disable translate — use opacity ONLY`,
    `4. NEVER use: bounce, infinite-spin, continuous rotation, extreme parallax, scroll-jacking`,
    `5. NEVER use animation duration < 150ms or > 400ms`,
    `6. ALL interactive buttons MUST have whileHover and whileTap (scale or slight translate)`,
    `7. Use whileInView with viewport={{ once: true, margin: "-50px" }} for scroll-triggered sections`,
    ``,
    `### Motion Presets`,
    `Use these exact variant definitions:`,
    `\`\`\``,
    MOTION_PRESETS,
    `\`\`\``,
    ``,
    `### Section-Level Motion Guide`,
  ];

  for (const [section, result] of sectionResults) {
    if (result.references.length === 0) continue;
    const topRef = result.references[0];
    lines.push(`**${section}:** ${topRef.description}`);
    lines.push(`  Pattern: \`${topRef.codeHint}\``);
  }

  lines.push('');
  lines.push('### DNA-Specific Motion Rules');
  if (dnaProfile.intensity === 'high') {
    lines.push('- Use spring physics (type:"spring") for CTAs and hero elements');
    lines.push('- staggerChildren 0.1–0.13s for feature grids');
    lines.push('- whileHover scale 1.02–1.05 on all cards');
    lines.push('- AnimatePresence for all conditional renders');
  } else if (dnaProfile.intensity === 'medium') {
    lines.push('- Use easeOut or custom cubic-bezier, not spring, for most elements');
    lines.push('- staggerChildren 0.08–0.1s for grids');
    lines.push('- whileHover y:-4 or scale:1.02 on cards — not both');
    lines.push('- AnimatePresence for page sections with conditional rendering');
  } else {
    lines.push('- Prefer opacity-only or very subtle y:8–16 translateY');
    lines.push('- staggerChildren 0.06–0.08s maximum');
    lines.push('- NO whileHover scale on cards — only CSS hover or subtle y:-2');
    lines.push('- Keep motion invisible — it should feel instant');
  }

  return lines.join('\n');
}
