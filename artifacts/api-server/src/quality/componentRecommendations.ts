// ── V7.2.4 Component Recommendation Engine ───────────────────────────────────
// Returns the optimal shadcn component stack for a given industry/section/dna.
// Used by the generation prompt and telemetry endpoint.

export interface RecommendationInput {
  industry:    string[];
  sectionType: string;
  dna:         Record<string, number>;
}

export interface RecommendationResult {
  primary:   string[];   // must-use components for this section
  secondary: string[];   // should-consider components
  rationale: string;
}

// ── ALL 36 available shadcn/ui globals (V7.2.4) ──────────────────────────────

export const ALL_SHADCN_COMPONENTS = [
  // Core
  'Button', 'Card', 'CardHeader', 'CardContent', 'CardFooter', 'CardTitle', 'CardDescription',
  'Badge', 'Input', 'Textarea', 'Label', 'Select', 'Switch',
  // Display
  'Avatar', 'AvatarImage', 'AvatarFallback',
  'Separator', 'Skeleton', 'Progress',
  // Navigation & Overlay
  'Tabs', 'TabsList', 'TabsTrigger', 'TabsContent',
  'Accordion', 'AccordionItem', 'AccordionTrigger', 'AccordionContent',
  'Dialog', 'Sheet', 'Tooltip',
  'DropdownMenu', 'DropdownMenuContent', 'DropdownMenuItem',
  // Premium (V7.2.4)
  'Command', 'CommandInput', 'CommandList', 'CommandItem',
  'Calendar', 'DatePicker',
  'DataTable',
  'Drawer', 'DrawerContent',
  'HoverCard', 'HoverCardContent',
  'Menubar', 'MenubarMenu', 'MenubarItem',
  'NavigationMenu', 'NavigationMenuList', 'NavigationMenuLink',
] as const;

export type ShadcnComponent = typeof ALL_SHADCN_COMPONENTS[number];

// Total core + premium count for coverage calculation
export const TOTAL_COMPONENT_FAMILIES = 36; // unique component families (not variants)

// ── Section defaults ──────────────────────────────────────────────────────────

const SECTION_DEFAULTS: Record<string, RecommendationResult> = {
  hero: {
    primary:   ['Button', 'Badge'],
    secondary: ['Avatar', 'Progress'],
    rationale: 'Hero: <Badge> above H1, dual <Button> CTA, optional Avatar stack trust signal',
  },
  features: {
    primary:   ['Card', 'Badge'],
    secondary: ['Tabs', 'Separator', 'Progress'],
    rationale: 'Features: <Card> grid with <Badge> category labels; <Tabs> for multi-view sections',
  },
  pricing: {
    primary:   ['Card', 'Badge', 'Button', 'Separator'],
    secondary: ['Dialog', 'Switch', 'Tabs'],
    rationale: 'Pricing: <Card> tiers, <Badge> recommended label, <Separator> between plan sections',
  },
  testimonials: {
    primary:   ['Avatar', 'Card', 'Badge'],
    secondary: ['Separator'],
    rationale: 'Testimonials: <Avatar> + <AvatarFallback> for headshots, <Card> for quote blocks',
  },
  faq: {
    primary:   ['Accordion'],
    secondary: ['Badge', 'Input'],
    rationale: 'FAQ: ALWAYS use <Accordion> — never custom details/summary or div toggles',
  },
  dashboard: {
    primary:   ['Tabs', 'DataTable', 'Progress', 'Skeleton'],
    secondary: ['Command', 'Card', 'Badge', 'Select'],
    rationale: 'Dashboard: <Tabs> for views, <DataTable> for records, <Command> for search',
  },
  cta: {
    primary:   ['Button', 'Input'],
    secondary: ['Badge', 'Dialog'],
    rationale: 'CTA: solid <Button> + optional email <Input>; <Dialog> for confirmation flow',
  },
  navbar: {
    primary:   ['NavigationMenu', 'NavigationMenuList', 'NavigationMenuItem', 'NavigationMenuLink', 'Button', 'Sheet'],
    secondary: ['NavigationMenuTrigger', 'NavigationMenuContent', 'Badge', 'Separator'],
    rationale: 'Navbar: ALWAYS use <NavigationMenu><NavigationMenuList><NavigationMenuItem> for desktop links — NEVER raw divs. ALWAYS use <Sheet><SheetContent side="left"> for mobile menu. Add aria-label="Main navigation" to <nav>.',
  },
  footer: {
    primary:   ['Separator'],
    secondary: ['Button', 'Input'],
    rationale: 'Footer: <Separator> between columns; optional newsletter <Input>',
  },
};

// ── Industry overrides ────────────────────────────────────────────────────────

const INDUSTRY_OVERRIDES: Record<string, Partial<Record<string, string[]>>> = {
  fintech: {
    pricing:    ['Badge', 'Card', 'Separator', 'Dialog', 'DataTable'],
    dashboard:  ['DataTable', 'Tabs', 'Progress', 'Select', 'Command'],
    features:   ['Card', 'Badge', 'Separator', 'Progress'],
  },
  finance: {
    pricing:    ['Badge', 'Card', 'Separator', 'Dialog', 'DataTable'],
    dashboard:  ['DataTable', 'Tabs', 'Progress', 'Select'],
    features:   ['Card', 'Badge', 'Separator'],
  },
  saas: {
    pricing:    ['Tabs', 'Card', 'Badge', 'Switch', 'Dialog'],
    features:   ['Tabs', 'Card', 'Badge'],
    dashboard:  ['Tabs', 'DataTable', 'Command', 'Progress'],
    hero:       ['Button', 'Badge', 'Avatar'],
  },
  ai: {
    dashboard:  ['Tabs', 'Command', 'DataTable', 'Progress', 'Skeleton'],
    features:   ['Card', 'Badge', 'Tabs', 'Command'],
    hero:       ['Button', 'Badge', 'Progress'],
  },
  ecommerce: {
    pricing:    ['Card', 'Badge', 'Separator', 'Dialog'],
    features:   ['Card', 'Badge', 'HoverCard'],
    cta:        ['Button', 'Input', 'Dialog'],
  },
  retail: {
    pricing:    ['Card', 'Badge', 'Separator'],
    features:   ['Card', 'Badge'],
    cta:        ['Button', 'Input'],
  },
  healthcare: {
    faq:        ['Accordion', 'Badge'],
    features:   ['Card', 'Separator', 'Avatar'],
    hero:       ['Button', 'Badge'],
  },
  marketing: {
    testimonials: ['Avatar', 'Card', 'Badge', 'Separator'],
    hero:         ['Button', 'Badge', 'Avatar'],
    features:     ['Card', 'Badge', 'Tabs'],
  },
  developer: {
    features:   ['Tabs', 'Card', 'Badge', 'Command'],
    hero:       ['Button', 'Badge'],
    pricing:    ['Card', 'Badge', 'Switch', 'Separator'],
  },
  devtools: {
    features:   ['Tabs', 'Card', 'Badge', 'Command'],
    dashboard:  ['Tabs', 'Command', 'DataTable', 'Progress'],
  },
};

// ── DNA style overrides ───────────────────────────────────────────────────────

function getDominantDNA(dna: Record<string, number>): string {
  let best = '';
  let bestPct = 0;
  for (const [brand, pct] of Object.entries(dna)) {
    if (pct > bestPct) { bestPct = pct; best = brand; }
  }
  return best;
}

const DNA_EXTRAS: Record<string, string[]> = {
  linear:     ['NavigationMenu', 'Command', 'DataTable', 'Menubar'],
  vercel:     ['NavigationMenu', 'Tabs', 'Command'],
  stripe:     ['NavigationMenu', 'DataTable', 'Tabs', 'Dialog'],
  notion:     ['NavigationMenu', 'Command', 'Tabs', 'HoverCard'],
  framer:     ['NavigationMenu', 'Tabs', 'Tooltip', 'HoverCard'],
  apple:      ['NavigationMenu', 'Separator', 'Badge'],
  shadcn:     ['NavigationMenu', 'Command', 'DataTable', 'Menubar', 'Calendar'],
  figma:      ['NavigationMenu', 'Tabs', 'Tooltip', 'HoverCard'],
  loom:       ['NavigationMenu', 'Dialog', 'Progress', 'Skeleton'],
  discord:    ['NavigationMenu', 'DropdownMenu', 'Menubar', 'Sheet'],
  github:     ['NavigationMenu', 'Tabs', 'Badge', 'DataTable', 'Command'],
};

// ── Phase 5 — Component coverage audit ───────────────────────────────────────

/** Counts how many distinct shadcn family names are present in code. */
export function computeComponentCoverage(code: string): {
  coveragePercent:  number;
  componentUsage:   Record<string, number>;  // component → count of appearances
  mostUsed:         string[];
  leastUsed:        string[];
  totalUnique:      number;
} {
  const FAMILIES = [
    'Button', 'Card', 'Badge', 'Input', 'Textarea', 'Label', 'Select', 'Switch',
    'Avatar', 'Separator', 'Skeleton', 'Progress',
    'Tabs', 'Accordion', 'Dialog', 'Sheet', 'Tooltip', 'DropdownMenu',
    'Command', 'Calendar', 'DatePicker', 'DataTable', 'Drawer', 'HoverCard',
    'Menubar', 'NavigationMenu',
  ];

  const usage: Record<string, number> = {};
  for (const comp of FAMILIES) {
    const re = new RegExp(`<${comp}[\\s/>]`, 'g');
    const matches = code.match(re);
    if (matches && matches.length > 0) {
      usage[comp] = matches.length;
    }
  }

  const used   = Object.keys(usage);
  const sorted = used.sort((a, b) => (usage[b] ?? 0) - (usage[a] ?? 0));

  return {
    coveragePercent: Math.round((used.length / FAMILIES.length) * 100),
    componentUsage:  usage,
    mostUsed:        sorted.slice(0, 5),
    leastUsed:       FAMILIES.filter(c => !usage[c]).slice(0, 5),
    totalUnique:     used.length,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function recommendBestComponents(input: RecommendationInput): RecommendationResult {
  const { industry, sectionType, dna } = input;
  const section = sectionType.toLowerCase();

  // Start with section default
  const base: RecommendationResult = SECTION_DEFAULTS[section] ?? {
    primary:   ['Button', 'Card'],
    secondary: ['Badge', 'Separator'],
    rationale: `${section} section — use <Card> for layout, <Button> for actions`,
  };

  const primary   = new Set(base.primary);
  const secondary = new Set(base.secondary);

  // Apply industry overrides
  for (const ind of industry) {
    const key = ind.toLowerCase();
    const overridePrimary = INDUSTRY_OVERRIDES[key]?.[section];
    if (overridePrimary) {
      for (const c of overridePrimary) primary.add(c);
    }
  }

  // Apply DNA extras
  const dominant = getDominantDNA(dna);
  const dnaExtra = DNA_EXTRAS[dominant.toLowerCase()] ?? [];
  for (const c of dnaExtra.slice(0, 2)) secondary.add(c);  // add top 2 DNA suggestions as secondary

  return {
    primary:   [...primary],
    secondary: [...secondary].filter(c => !primary.has(c)),
    rationale: base.rationale,
  };
}

// ── Telemetry helper ──────────────────────────────────────────────────────────

// In-memory coverage tracking (updated per build)
const _coverageHistory: Array<{ coveragePercent: number; recordedAt: number }> = [];

export function recordComponentCoverageScore(coveragePercent: number): void {
  _coverageHistory.push({ coveragePercent, recordedAt: Date.now() });
  if (_coverageHistory.length > 100) _coverageHistory.shift();
}

export function getComponentCoverageMetrics() {
  const recent = _coverageHistory.slice(-20);
  const avgCoverage = recent.length > 0
    ? Math.round(recent.reduce((s, r) => s + r.coveragePercent, 0) / recent.length)
    : 0;

  return {
    averageCoveragePercent: avgCoverage,
    totalBuildsTracked:     _coverageHistory.length,
    recentBuilds:           recent.slice(-5).map(r => r.coveragePercent),
    allAvailableComponents: ALL_SHADCN_COMPONENTS.length,
  };
}

export function resetComponentCoverageMetrics(): void {
  _coverageHistory.length = 0;
}
