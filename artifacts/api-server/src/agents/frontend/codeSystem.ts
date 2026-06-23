import type { DesignDNA, ProjectBlueprint, ProjectFileSSE } from "../types.js";
import { getRegistryCatalogue } from "../../components/registry.js";

export const DEFAULT_DESIGN: DesignDNA = {
  designLanguage: "monochrome",
  layoutStyle: "flat-ui",
  typographySystem: {
    headingWeight: "font-black",
    headingTracking: "tracking-tighter",
    scale: "lg",
    fontFamily: "sans",
  },
  spacingSystem: {
    density: "balanced",
    sectionPadding: "py-24",
    componentGap: "gap-6",
  },
  colorSystem: {
    theme: "dark",
    background: "#0a0a0a",
    surface: "#141414",
    primary: "#ffffff",
    secondary: "#e5e5e5",
    accent: "#ffffff",
    text: "#ffffff",
    textMuted: "#666666",
    border: "#2a2a2a",
  },
  animationPersonality: "subtle",
  decorationLevel: "none",
  componentPreferences: ["flat-card", "solid-button"],
  heroStyle: "centered-minimal",
  cardStyle: "flat-bordered",
  visualDensity: "balanced",
  theme: "dark",
  primaryColor: "#ffffff",
  secondaryColor: "#e5e5e5",
  accentColor: "#ffffff",
  bgColor: "#0a0a0a",
  bgGradient: "from-[#0a0a0a] to-[#111111]",
  headingGradient: "from-white to-gray-400",
  buttonStyle: "rounded-lg",
  buttonColors: "bg-white text-black hover:bg-gray-100",
  cardStyleTokens: "bg-[#141414] border border-[#2a2a2a] rounded-xl",
  mood: "Sharp",
};

export function buildCodeSystem(design: DesignDNA, blueprint: PageBlueprint, componentContext?: string, projectBlueprint?: ProjectBlueprint | null, registrySelection?: Record<string, string>): string {
  const sectionList = blueprint.sectionOrder.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const functionNames = blueprint.sectionOrder.map(s => `${s}()`).join(', ');
  const appReturn = blueprint.sectionOrder.map(s => `<${s}/>`).join('');
  const registryCatalogue = getRegistryCatalogue();
  const componentSection = componentContext
    ? `\n\n${registryCatalogue}\n\nCOMPONENT LIBRARY TEMPLATES (use as structural reference — adapt content, colors, and copy for this specific site):\n${componentContext}\n`
    : `\n\n${registryCatalogue}\n`;

  const cs = design.colorSystem ?? {};
  const ts = design.typographySystem ?? {};
  const ss = design.spacingSystem ?? {};

  const bg = cs.background ?? design.bgColor ?? '#0a0a0a';
  const surface = cs.surface ?? '#1a1a1a';
  const primary = cs.primary ?? design.primaryColor ?? '#ffffff';
  const accent = cs.accent ?? design.accentColor ?? primary;
  const textColor = cs.text ?? '#ffffff';
  const textMuted = cs.textMuted ?? '#888888';
  const borderColor = cs.border ?? '#333333';
  const isLight = (design.theme ?? cs.theme) === 'light';

  const headingWeight = ts.headingWeight ?? 'font-bold';
  const headingTracking = ts.headingTracking ?? 'tracking-tight';
  const headingScale = ts.scale === 'xl' ? 'text-6xl md:text-8xl' : ts.scale === 'lg' ? 'text-5xl md:text-7xl' : 'text-4xl md:text-5xl';
  const subHeadingScale = ts.scale === 'xl' ? 'text-4xl md:text-5xl' : ts.scale === 'lg' ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl';

  const sectionPad = ss.sectionPadding ?? 'py-24';
  const componentGap = ss.componentGap ?? 'gap-6';

  const cardStyleGuide = (() => {
    switch (design.cardStyle) {
      case 'flat-bordered': return `bg-[${surface}] border border-[${borderColor}] rounded-xl`;
      case 'glass-blur': return `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl`;
      case 'solid-surface': return `bg-[${surface}] rounded-xl`;
      case 'gradient-border': return `bg-[${surface}] border border-[${accent}]/30 rounded-2xl hover:border-[${accent}]/60`;
      case 'outline-hover': return `bg-transparent border border-[${borderColor}] hover:border-[${primary}] rounded-lg`;
      default: return `bg-[${surface}] border border-[${borderColor}] rounded-xl`;
    }
  })();

  const buttonGuide = (() => {
    const radius = design.buttonStyle ?? 'rounded-lg';
    const comps = design.componentPreferences ?? [];
    if (comps.includes('ghost-button')) return `border border-[${primary}] text-[${primary}] hover:bg-[${primary}]/10 ${radius}`;
    if (comps.includes('outline-button')) return `border border-[${borderColor}] text-[${textColor}] hover:border-[${primary}] ${radius}`;
    return `bg-[${primary}] text-white hover:opacity-90 ${radius}`;
  })();

  const heroGuide = (() => {
    switch (design.heroStyle) {
      case 'centered-minimal': return 'min-h-screen flex flex-col items-center justify-center text-center px-6 — clean, no heavy decoration, strong typography only';
      case 'centered-gradient': return 'min-h-screen flex flex-col items-center justify-center text-center px-6 — add radial gradient orbs and layered depth';
      case 'split-layout': return 'min-h-screen grid grid-cols-1 md:grid-cols-2 gap-0 — left: text content, right: visual/mockup';
      case 'editorial-large': return 'min-h-screen flex flex-col justify-end px-8 md:px-16 pb-24 — huge oversized text, minimal other content';
      case 'fullbleed-overlay': return 'min-h-screen relative — full background color/image with overlay, centered content';
      default: return 'min-h-screen flex flex-col items-center justify-center text-center px-6';
    }
  })();

  const animationGuide = (() => {
    switch (design.animationPersonality) {
      case 'none': return 'No hover animations. No transitions. Static elements only.';
      case 'subtle': return 'Subtle hover effects only: hover:opacity-80, hover:border-color transitions (duration-200). No scale transforms.';
      case 'moderate': return 'Moderate hover effects: hover:scale-[1.02], hover:-translate-y-1, color transitions (duration-300).';
      case 'expressive': return 'Rich animations: hover:scale-105, hover:-translate-y-2, gradient shimmer, group-hover transitions (duration-300 ease-out). Add animated gradient orbs in backgrounds.';
      default: return 'Subtle hover transitions only.';
    }
  })();

  const decorationGuide = (() => {
    switch (design.decorationLevel) {
      case 'none': return 'NO decorative elements. No gradient orbs, no background patterns, no decorative shapes. Let typography and spacing do the work.';
      case 'minimal': return 'Minimal decoration: single subtle accent line or dot. No orbs or blobs.';
      case 'moderate': return 'Moderate decoration: one subtle background gradient, geometric lines or grid pattern at low opacity.';
      case 'rich': return 'Rich decoration: gradient orbs (blur-3xl, low opacity), animated gradient backgrounds, depth layers, particle-like dots grid.';
      default: return 'Minimal decoration only.';
    }
  })();

  const headingGradient = design.headingGradient ?? `from-[${textColor}] to-[${textMuted}]`;

  const layoutStyleRules = (() => {
    switch (design.layoutStyle) {
      case 'editorial-flow': return `
═══ LAYOUT STYLE — Editorial Flow ═══
- Section headings MUST be oversized (text-5xl md:text-7xl or larger), LEFT-ALIGNED, never centered
- Avoid rigid card grids — prefer flowing rows, single-column lists, large pull-quotes
- Heavy whitespace — sections feel like editorial magazine spreads
- At least 2 sections must use left-aligned (NOT centered) layout
- Use thin horizontal rules (border-t border-white/10) to separate content blocks
- Typography does the visual work — minimize boxed cards`;
      case 'grid-strict': return `
═══ LAYOUT STYLE — Grid Strict ═══
- ALL content in explicit CSS grid — use grid-cols-2, grid-cols-3, or grid-cols-4 for every section
- Consistent card heights across all cards in each section
- Information-dense: prefer gap-4 over gap-6, compact py-16 padding
- Use precise col-span values to create visual hierarchy
- Tables and data lists are preferred over freeform layouts`;
      case 'asymmetric': return `
═══ LAYOUT STYLE — Asymmetric ═══
- Every content section ALTERNATES direction: text-left+visual-right, then visual-left+text-right
- Use unequal column splits: 7/5, 8/4, or 5/7 — NEVER equal 6/6 splits
- Nothing is centered except the hero — all other sections are left or right weighted
- Stagger cards: alternate heights or use -mt-8 offset on every other column`;
      case 'layered-depth': return `
═══ LAYOUT STYLE — Layered Depth ═══
- Elements must OVERLAP using negative margins (-mt-12) or relative/absolute positioning
- Cards use z-index stacking (z-10, z-20, z-30) to create visible depth
- Floating panels: use shadow-2xl + ring-1 to make elements appear to float
- Background cards peek behind foreground elements using translate-y or opacity layers
- At least 1 section must have visually overlapping elements`;
      case 'dense-grid': return `
═══ LAYOUT STYLE — Dense Grid ═══
- Section padding MAXIMUM py-16 — no py-24 or py-32 anywhere
- Use text-sm for body, text-xs for labels throughout — compact and information-rich
- Prefer grid-cols-4 over grid-cols-3, grid-cols-3 over grid-cols-2
- Tight gaps: gap-2 or gap-3 (not gap-6 or gap-8)
- Tables and data-heavy lists preferred over decorative card layouts`;
      default: return `
═══ LAYOUT STYLE — Flat UI (default) ═══
- Section headings: centered on mobile, left-aligned on desktop for content sections (Features, Testimonials, Pricing)
- Hero and CTA sections: centered text is correct
- Feature grids: use grid-cols-1 md:grid-cols-3 with equal-height cards
- Cards MUST use consistent padding (p-6 or p-8 — pick one and stick with it throughout)
- Sections alternate between: grid layout, list layout, and split-layout — never 3 consecutive grids
- Use border-b or border-t dividers between sections sparingly — max 2 per page`;
    }
  })();

  const variationSeed = blueprint.sectionOrder.join('').split('').reduce((a: number, c: string) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);
  const featureCount = 3 + (variationSeed % 3);
  const statCount = 2 + (variationSeed % 2);
  const accentVariant = ['side-border', 'number-prefix', 'horizontal-rule'][variationSeed % 3];
  const structureVariationRules = `
═══ STRUCTURE VARIATION (apply exactly — do NOT replicate template DOM verbatim) ═══
- Feature items for this site: use exactly ${featureCount} (not 3, not 6 — exactly ${featureCount})
- Stats/metrics: show exactly ${statCount} key metrics in hero or social proof sections
- Card accent style: use "${accentVariant}" as a visual accent on at least one section's cards
- One section MUST use a horizontal flex-row layout (not a vertical stack or grid)
- At least one section MUST NOT use cards — use a numbered list, table row, or pure text layout instead
- VARY the grid column count across sections — never use the same grid-cols-N in every section`;

  return `You are a Code Generation Agent. Generate a COMPLETE, PRODUCTION-READY React + Tailwind website with a UNIQUE visual identity.${componentSection}

═══ DESIGN DNA ═══
Design Language: ${design.designLanguage}
Layout Style: ${design.layoutStyle}
Theme: ${isLight ? 'LIGHT' : 'DARK'}
Mood: ${design.mood}
Visual Density: ${design.visualDensity}

═══ COLOR SYSTEM ═══
Background: ${bg}
Surface (cards/panels): ${surface}
Primary: ${primary}
Accent: ${accent}
Text: ${textColor}
Text Muted: ${textMuted}
Border: ${borderColor}
Heading Gradient: ${headingGradient}

═══ TYPOGRAPHY ═══
Heading weight: ${headingWeight}
Heading tracking: ${headingTracking}
Hero heading size: ${headingScale}
Section heading size: ${subHeadingScale}
Font family: ${ts.fontFamily ?? 'sans'} (use font-${ts.fontFamily ?? 'sans'} class)

═══ SPACING ═══
Section padding: ${sectionPad}
Component gap: ${componentGap}
Density: ${ss.density ?? 'comfortable'}

═══ COMPONENT STYLES ═══
Card style — use exactly: ${cardStyleGuide}
Button (primary): ${buttonGuide}
Button (secondary): border border-[${borderColor}] text-[${textMuted}] hover:text-[${textColor}] hover:border-[${primary}] ${design.buttonStyle ?? 'rounded-lg'} px-6 py-3

═══ HERO LAYOUT ═══
${heroGuide}

═══ ANIMATION RULES ═══
${animationGuide}

═══ DECORATION RULES ═══
${decorationGuide}

═══ PAGE BLUEPRINT ═══
Build EXACTLY these sections in this exact order:
${sectionList}

Do NOT add sections not in this list. Do NOT rearrange the order.
Each section must be a separate named function matching the section name exactly.

LAYOUT RULES (apply per section type):
- Features / FeaturesBento: grid layout — NEVER single column on desktop
- Testimonials: "grid grid-cols-1 md:grid-cols-3 ${componentGap}"
- Pricing: "grid grid-cols-1 md:grid-cols-3 ${componentGap}", middle card uses scale-105
- Footer: "grid grid-cols-2 md:grid-cols-4 gap-8"
- HEADINGS: The hero H1 ONLY may use the heading gradient (bg-clip-text text-transparent bg-gradient-to-r ${headingGradient}). ALL other section headings MUST use plain text-[${textColor}]. Vary each section heading style: underline accent, uppercase overline label, large number prefix, oversized drop cap, or border-l side bar — NEVER the same style twice.
${layoutStyleRules}
${structureVariationRules}

${(registrySelection && Object.keys(registrySelection).length > 0) ? `═══ COMPONENT REGISTRY (V5.4) ═══
Selected component variants for this build. ENFORCE these structural patterns — do NOT invent different layouts:

${Object.entries(registrySelection).map(([cat, hint]) => `${cat.toUpperCase()}: ${hint}`).join('\n')}

For each section listed above, follow the described layout and visual pattern EXACTLY.
Do NOT deviate from the selected component variant's structural style.\n\n` : ''}═══ SHADCN-FIRST RULES (V7.1.5) — MANDATORY ═══
ALWAYS prefer shadcn/ui components over raw HTML. These rules are NON-NEGOTIABLE:
- NEVER write a raw <button> element — ALWAYS use <Button> with appropriate variant
- NEVER write a raw <input> element — ALWAYS use <Input>
- NEVER build a custom accordion with <details>/<summary> — ALWAYS use <Accordion>/<AccordionItem>/<AccordionTrigger>/<AccordionContent>
- NEVER build custom tabs with div toggles — ALWAYS use <Tabs>/<TabsList>/<TabsTrigger>/<TabsContent>
- NEVER write a plain <textarea> — ALWAYS use <Textarea>
- NEVER write a plain <select> — ALWAYS use <Select>/<SelectTrigger>/<SelectContent>/<SelectItem>
- NEVER build a custom badge/pill with a raw div — ALWAYS use <Badge>
- NEVER build a custom card layout from scratch — ALWAYS use <Card>/<CardHeader>/<CardContent>/<CardTitle>
- NEVER build a custom progress bar — ALWAYS use <Progress value={n} />
- NEVER build a custom loading skeleton — ALWAYS use <Skeleton>
- NEVER build a custom dropdown menu — ALWAYS use <DropdownMenu>/<DropdownMenuTrigger>/<DropdownMenuContent>/<DropdownMenuItem>
- NEVER build a custom toggle switch — ALWAYS use <Switch>
- NEVER build a custom avatar/initials — ALWAYS use <Avatar>/<AvatarImage>/<AvatarFallback>
Shadcn usage target: ≥90% of interactive UI elements must use shadcn components.

═══ SHADCN/UI COMPONENTS (V7.1.5) — ALL GLOBALS ═══
The following components are ALL available as globals (no import needed):

Buttons & Actions:
- <Button variant="default|outline|ghost|secondary|destructive" size="default|sm|lg|icon">...</Button>
- <Switch checked={bool} onCheckedChange={fn} />

Forms & Inputs:
- <Input placeholder="..." type="text|email|password|search" id="field-id" />
- <Textarea placeholder="..." rows={4} />
- <Label htmlFor="field-id">Label text</Label>
- <Select><SelectTrigger><SelectValue placeholder="..." /></SelectTrigger><SelectContent><SelectItem value="v">Option</SelectItem></SelectContent></Select>

Display & Layout:
- <Card className="..."><CardHeader><CardTitle>Title</CardTitle><CardDescription>...</CardDescription></CardHeader><CardContent>...</CardContent><CardFooter>...</CardFooter></Card>
- <Badge variant="default|secondary|outline|destructive">Status</Badge>
- <Avatar><AvatarImage src="..." alt="..." /><AvatarFallback>AB</AvatarFallback></Avatar>
- <Separator className="..." />
- <Skeleton className="h-4 w-full" />
- <Progress value={75} className="..." />

Navigation & Overlay:
- <Tabs defaultValue="tab1"><TabsList><TabsTrigger value="tab1">Tab 1</TabsTrigger></TabsList><TabsContent value="tab1">...</TabsContent></Tabs>
- <Accordion type="single" collapsible><AccordionItem value="item-1"><AccordionTrigger>Question</AccordionTrigger><AccordionContent>Answer</AccordionContent></AccordionItem></Accordion>
- <DropdownMenu><DropdownMenuTrigger><Button>Open</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>Item</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
- <Dialog><DialogContent><DialogHeader><DialogTitle>Title</DialogTitle></DialogHeader></DialogContent></Dialog>
- <Sheet><SheetContent side="right"><SheetHeader><SheetTitle>Title</SheetTitle></SheetHeader></SheetContent></Sheet>
- <TooltipProvider><Tooltip><TooltipTrigger><Button>Hover</Button></TooltipTrigger><TooltipContent>Tip text</TooltipContent></Tooltip></TooltipProvider>

Motion (Framer Motion — globally available as window.motion):
- <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>...</motion.div>
- <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.4, delay: 0.1 }}>...</motion.div>
- <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>...</motion.h1>
- <AnimatePresence>...</AnimatePresence>
All motion.* tags (div, section, p, h1-h6, span, ul, li, a, button, header, footer, main, article) are available.

═══ MULTI-FILE STRUCTURE ═══
Each section function will be extracted into its own TypeScript file. Mark file boundaries with delimiter comments:
// === FILE: src/components/Navbar.tsx ===
function Navbar() { ... }

// === FILE: src/components/Hero.tsx ===
function Hero() { ... }

// === FILE: src/App.tsx ===
function App() { ... }

Rules:
- Component/section files: src/components/
- App.tsx: src/
- Write each function as self-contained (no cross-function variable sharing)

═══ SVG ILLUSTRATIONS ═══
When a section needs a visual but no image is specified — create an inline SVG:
- Product/dashboard screenshot: SVG browser frame (rounded rect + 3 dot circles) containing simplified rect grid rows
- Bar chart: vertical rect elements at varying heights above a baseline line
- Line chart: polyline on faint grid lines
- Icon illustrations: simple geometric shapes using stroke="currentColor"
- Dimensions: viewBox="0 0 400 240" or "0 0 320 200", keep shapes simple
- Colors: use design accent color (${accent}) for highlight shapes, border color (${borderColor}) for structural lines

ABSOLUTE TECHNICAL RULES (breaking these crashes the preview):
1. NO import statements. NO require(). React and all hooks are already global.
2. NO export statements. Do NOT write "export default" or "export function".
3. NO TypeScript types or interfaces.
4. NO JSX fragments (<> </>). Always use a wrapper div.
5. Use React.useState, React.useEffect (always namespace with React.)
6. ONLY Tailwind CSS classes — no style={} objects except for WebkitTextStroke.
7. Each section function must be named EXACTLY as listed in the blueprint above.
8. Use Lucide icons — they are available as global variables in the preview. Use them as JSX: <ChevronRight size={16} />, <ArrowRight size={20} />, <Star size={18} />, <Check size={16} />, <Zap size={20} />, <Shield size={20} />, <Globe size={20} />, <Users size={20} />, <BarChart3 size={20} />, <Code2 size={20} />, <Layers size={20} />, <Sparkles size={20} />, <Play size={16} />, <Menu size={20} />, <X size={16} />, <ExternalLink size={14} />, <Github size={20} />, <Twitter size={20} />, <Mail size={16} />. Import syntax: NOT needed (globals). Use size prop and className for color.
9. Use bg-[#hexcode] syntax for custom colors from the design DNA above.

CODE STRUCTURE — required pattern:
// === FILE: src/components/SectionName.tsx ===
[one function per section, each preceded by its FILE delimiter]
// === FILE: src/App.tsx ===
function App() { return (<div>${appReturn}</div>); }

The App() function must render all ${blueprint.sectionOrder.length} sections: ${functionNames}

Use .map() for all repeated elements. Replace ALL placeholder text with real, specific content for this site.

═══ SAFE CODING RULES (V5.2) — MANDATORY to prevent runtime crashes ═══
10. ALWAYS use Array.isArray() before .map() on any variable that might not be an array:
    BAD:  items.map(item => ...)
    GOOD: Array.isArray(items) ? items.map(item => ...) : []
11. ALWAYS use optional chaining for nested property access:
    BAD:  user.profile.avatar
    GOOD: user?.profile?.avatar
12. ALWAYS provide initial values in useState() that match the expected type:
    BAD:  const [items, setItems] = React.useState()
    GOOD: const [items, setItems] = React.useState([])
    GOOD: const [user, setUser] = React.useState(null)
13. NEVER call hooks inside conditionals, loops, or nested functions.
14. ALWAYS add default values for props that could be undefined:
    BAD:  function Card({ items }) { return items.map(...) }
    GOOD: function Card({ items = [] }) { return items.map(...) }

═══ ACCESSIBILITY RULES (V7.0.9) — MANDATORY ═══
15. ALL <button> elements MUST have type="button" to prevent form submission side-effects.
16. ALL <nav> elements MUST have aria-label="Main navigation" (or descriptive equivalent).
17. ALL buttons MUST have focus-visible ring classes:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[${accent}] focus-visible:ring-offset-2 focus-visible:ring-offset-[${bg}]"
18. ALL links (<a>) in navigation MUST have focus-visible ring:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[${accent}]/60 rounded-sm"
19. FAQ / Accordion toggles MUST include aria-expanded and aria-controls:
    <button type="button" aria-expanded={openIdx === i} aria-controls={"faq-"+i} onClick={...}>
    <div id={"faq-"+i} role="region" aria-hidden={openIdx !== i}>...</div>
20. ALL form <input> elements MUST have a <label> with matching htmlFor/id pair:
    <label htmlFor="input-name" className="...">Label</label>
    <input id="input-name" ... />
21. Decorative elements (gradient orbs, background shapes, icon-only divs) MUST have aria-hidden="true".
    ALL Lucide icon components used as decorative icons (not standalone buttons) MUST have aria-hidden="true": <Star aria-hidden="true" /> <Check aria-hidden="true" />
    Icon-only buttons MUST have aria-label: <Button aria-label="Close menu" type="button"><X size={20} aria-hidden="true" /></Button>
22. MUTED TEXT RULE: NEVER use text-white/25, text-white/30, text-white/35, or text-white/45.
    Minimum: text-white/60 (${textMuted} token is the correct class — use it).
    Section subheadings: text-white/70 minimum. Body copy: text-[${textMuted}] or better.
23. ALL shadcn components listed above are GLOBALS — use them directly without imports. This includes: Button, Card, Input, Badge, Avatar, Separator, Skeleton, Progress, Accordion, Tabs, Dialog, Sheet, Tooltip, DropdownMenu, Select, Switch, Label, Textarea.

═══ TYPOGRAPHY SYSTEM (V7.1.5) — MANDATORY MINIMUM SIZES ═══
These are hard minimums. NEVER go below these sizes:
- Hero H1: MINIMUM text-5xl md:text-6xl (use ${headingScale} from TYPOGRAPHY above)
- Section H2 titles: MINIMUM text-3xl — NEVER text-2xl or smaller for section headings
- Card H3 titles: MINIMUM text-xl — NEVER text-lg or smaller for card headings
- Body copy: ALWAYS text-base or text-lg — NEVER text-sm or text-xs for paragraph/body text
- Small labels / captions: text-sm minimum — NEVER text-xs for user-readable content
- Badge text: text-xs is acceptable ONLY inside <Badge> components
Rules:
- NO arbitrary font sizes (no text-[15px], no text-[13px])
- NO inconsistent scale jumps — heading hierarchy must step down consistently: H1 > H2 > H3
- NEVER use the same text size for H2 and body copy

═══ SPACING SYSTEM (V7.1.5) — 8PT GRID ENFORCEMENT ═══
ONLY use spacing values from this whitelist: 0, 1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96
In Tailwind terms: gap-0 gap-1 gap-2 gap-4 gap-6 gap-8 gap-12 gap-16 gap-24
Section padding: py-12 py-16 py-24 py-32 px-6 px-8 px-12 px-16
Margins: mt-4 mt-6 mt-8 mt-12 mt-16 mt-24 mb-4 mb-6 mb-8 mb-12
FORBIDDEN spacing values (never use these):
- p-7, py-7, px-7, mt-7, mb-7, gap-7 (odd off-grid)
- p-11, py-11, mt-11, mb-11, gap-11
- p-13, py-13, gap-13
- p-19, py-19, gap-19
- Any arbitrary spacing: p-[17px], mt-[23px], gap-[15px]
Rule: If you need "more space", step up to the next 8pt grid value — NEVER use the in-between value.

═══ COLOR DISCIPLINE (V7.1.5) — HARD LIMITS ═══
- MAXIMUM 1 primary action color + 1 accent highlight per page
- The primary color is: ${primary}. The accent color is: ${accent}.
- NEVER use 3 or more competing button/CTA colors on a single page
- NEVER apply per-card different gradient colors (no rainbow feature icon cards)
- Feature section icons MUST all use the SAME single color: ${accent} — no per-card color variation
- Gradient backgrounds: maximum 1 gradient per page, and ONLY in the hero section
- NEVER use competing gradients in multiple sections

═══ FRAMER MOTION ANIMATION RULES (V7.1.5) — MANDATORY ═══
Use Framer Motion (window.motion) for ALL scroll-triggered and entrance animations. Tailwind transitions remain for hover states only.

ALLOWED animation patterns (use these):
- Fade in: initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}
- Slide up: initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
- Slide in: initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}
- Scale in: initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
- Stagger (whileInView on parent items): Use transition={{ delay: index * 0.1 }} on each child

WHILEINVIEW (preferred for section content):
- Cards and feature items: <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.4, delay: i * 0.08 }}>
- Section headings: <motion.h2 whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.35 }}>
- Hero content: use animate (not whileInView) since it's above the fold

FORBIDDEN animation patterns:
- NO spinning elements (animate={{ rotate: 360 }}, spin class)
- NO bouncing (animate={{ y: [-5, 0, -5] }}) 
- NO excessive parallax (scrollY-based transforms)
- NO animation duration outside 150–400ms range (0.15s–0.4s)
- NO more than 0.5s total stagger delay across a card grid

HOVER states: Keep using Tailwind hover: classes (hover:scale-[1.02], hover:opacity-90, hover:-translate-y-1) — these are for micro-interactions, NOT for entrance animations.

═══ HERO REQUIREMENTS (V7.1.3) — MANDATORY ═══
The Hero section MUST always contain ALL of the following:
24. HERO BADGE: A pill/badge label above the H1 using the <Badge> global — short and specific: "Now in beta", "Trusted by 10k teams", "New: AI-powered search". NEVER skip the badge.
25. HERO HEADLINE: Full ${headingScale} H1. Must name the actual product/business — NEVER write "Welcome to our platform" or "The Future of [Category]". Write a concrete value proposition.
26. HERO SUPPORTING COPY: 1–2 sentences max. Specific benefit, not a category description. NEVER "We help businesses grow" — write what changes for THIS user.
27. HERO DUAL CTA — always exactly two buttons side by side:
    PRIMARY: <Button className="bg-[${primary}] text-[${bg}] ..."> with action-specific label ("Start building free →", "Book your table", "See the demo")
    SECONDARY: <Button variant="outline" className="border-[${borderColor}] text-[${textColor}] ..."> with exploratory label ("See how it works", "View examples", "Watch the demo")
    Both buttons MUST use the global <Button> component — never raw <button> for hero CTAs.
28. HERO TRUST SIGNAL — pick ONE and render it below the dual CTA row:
    Option A: Star rating row (★★★★★ "4.9/5 from 2,340 reviews")
    Option B: Avatar stack + user count ("Join 8,400+ teams already building")
    Option C: Logo cloud row — 4–5 recognizable brand-style SVG wordmarks at 20–24px height
    Option D: Metrics strip — 3 key numbers in a flex row ("47k users · 99.9% uptime · < 200ms latency")

═══ LAYOUT DIVERSITY RULES (V7.1.3) ═══
29. SECTION BACKGROUND ALTERNATION: Adjacent sections MUST alternate backgrounds. Pattern: bg-[${bg}] → bg-[${surface}] → bg-[${bg}] → bg-[${surface}]. NEVER render two consecutive sections with identical background. Navbar + Hero may share ${bg}. Every content section from Features onward must alternate.
30. NO ADJACENT DUPLICATE CARD LAYOUTS: If a section uses "grid-cols-1 md:grid-cols-3", the immediately following content section MUST use a different layout — list row, split 2-col, table, or single-column stacked. NEVER duplicate the same grid layout back-to-back.
31. NO ADJACENT DUPLICATE ALIGNMENT: If one section is centered (text-center), the next content section must be left-aligned or asymmetric. Never center two consecutive non-hero sections.
32. SECTION VISUAL WEIGHT GRADIENT: Hero is visually heaviest (largest text, most decoration). Each subsequent section steps down in visual weight. CTA section near the footer should be visually lighter than the hero but still high-contrast for the button.

═══ ANTI-GENERIC CONTENT RULES (V7.1.3) — HARD RULES ═══
33. NEVER write "Lorem ipsum" or any Latin placeholder text anywhere.
34. NEVER use placeholder names: "Acme Corp", "Your Company", "John Doe", "Jane Smith", "Example Inc". Use the actual business name from the prompt. Give testimonial authors realistic full names + job titles + company names matching the industry.
35. NEVER write cliché hero headlines: "The Future of [X]", "Revolutionizing [Y]", "Welcome to [App]", "Empowering teams". Write a specific, concrete value proposition tied to the actual product.
36. NEVER use vague CTA text: "Get Started", "Learn More", "Click Here", "Submit", "Sign Up". Write action-specific CTAs: "Start your free 14-day trial →", "Reserve a table for tonight", "Download the iOS app", "View our case studies".
37. NEVER repeat the same CTA label on two different buttons on the same page.
38. Stats and metrics MUST be realistic for the business stage: an early-stage SaaS uses "500 beta teams" not "10M users". A restaurant says "Est. 2009, 3 locations" not "1M+ happy diners". A dev tool says "Used in 12,000 repos" not "Trusted by millions".
39. Feature descriptions MUST be concrete: not "Powerful analytics" but "See exactly where users drop off — heatmaps, session recordings, and funnel analysis in one view."

═══ CTA INTELLIGENCE RULES (V7.1.3) ═══
40. ONE dominant CTA per page: the Hero primary button is the page's highest-weight CTA. It must be a solid fill or gradient button with maximum contrast — the most visually prominent button on the entire page.
41. ALL other buttons outside the hero (except the highlighted pricing tier) MUST be visually subordinate: use <Button variant="outline"> or <Button variant="ghost">. NEVER duplicate the hero primary button style in Features, Testimonials, or FAQ sections.
42. The bottom CTA section is the page's second CTA. It MUST reinforce the hero's value proposition (same product promise, fresh angle) — not introduce an unrelated offer. If hero says "Build faster", CTA section says "Ready to start building?" — not "Subscribe to our newsletter".
43. Pricing section exception: the recommended/highlighted tier may use a solid primary button. All other pricing tier buttons use outline or ghost.

OUTPUT: Raw JSX only. No markdown. Start with the first section function.`;
}

// Re-export PageBlueprint type for consumers of this module
export type PageBlueprint = { websiteType: string; sectionOrder: string[] };

export const SSE_LUCIDE_ICONS = [
  'ChevronRight','ChevronLeft','ChevronDown','ChevronUp',
  'ArrowRight','ArrowLeft','Star','Check','CheckCircle','X','XCircle',
  'Zap','Shield','Globe','Users','User','UserCheck',
  'BarChart','BarChart2','BarChart3','LineChart','PieChart',
  'Code','Code2','Layers','Sparkles','Play','Pause','Menu',
  'ExternalLink','Github','Twitter','Mail','Phone',
  'MapPin','Clock','Calendar','Search','Filter','Settings',
  'Heart','ThumbsUp','MessageCircle','Send','Share2',
  'Download','Upload','Cloud','Lock','Unlock','Key',
  'Eye','EyeOff','Info','AlertCircle','AlertTriangle',
  'Rocket','Package','Box','Folder','File','FileText',
  'Plus','Minus','Edit','Trash2','Copy','Clipboard',
  'Link','Linkedin','Instagram','Facebook','Youtube',
  'Monitor','Smartphone','Tablet','Laptop','Server',
  'Database','Cpu','Wifi','Battery','Power',
  'DollarSign','CreditCard','TrendingUp','TrendingDown',
  'Award','Target','Compass','Map','Navigation',
  'Building','Building2','Home','Store','Briefcase',
];

export function sseExtractFunctions(code: string): Array<{ name: string; body: string; folder: string }> {
  const delimPattern = /\/\/\s*===\s*FILE:\s*(?:src\/)?((?:components|pages|lib|hooks|utils)\/)?([A-Z][a-zA-Z0-9]*)\.tsx\s*===/g;
  const delimPositions: Array<{ name: string; start: number; headerEnd: number; folder: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = delimPattern.exec(code)) !== null) {
    const subFolder = m[1] || '';
    const folder = subFolder ? `src/${subFolder}` : 'src/';
    delimPositions.push({ name: m[2], start: m.index, headerEnd: m.index + m[0].length, folder });
  }

  if (delimPositions.length >= 2) {
    return delimPositions.map((p, i) => ({
      name: p.name,
      folder: p.folder,
      body: code.slice(p.headerEnd, i + 1 < delimPositions.length ? delimPositions[i + 1].start : code.length).trim(),
    }));
  }

  const funcPattern = /^function\s+([A-Z][a-zA-Z0-9]*)\s*\(\s*\)/gm;
  const positions: Array<{ name: string; start: number }> = [];
  while ((m = funcPattern.exec(code)) !== null) positions.push({ name: m[1], start: m.index });
  return positions.map((p, i) => ({
    name: p.name,
    folder: 'src/components/',
    body: code.slice(p.start, i + 1 < positions.length ? positions[i + 1].start : code.length).trim(),
  }));
}

export function sanitizeFunctionBody(body: string): string {
  return body
    .replace(/^\s*(?:interface|type)\s+\w[\s\S]*?\n\}/gm, '')
    .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+/gm, '')
    .replace(/:\s*(?:string|number|boolean|any|void|never|undefined|null)\b(?=\s*[,)=])/g, '')
    .trim();
}

export function sseToTsxFile(name: string, rawBody: string): string {
  const sanitized = sanitizeFunctionBody(rawBody);
  const body = sanitized
    .replace(/React\.useState\b/g, 'useState')
    .replace(/React\.useEffect\b/g, 'useEffect')
    .replace(/React\.useRef\b/g, 'useRef')
    .replace(/React\.useMemo\b/g, 'useMemo')
    .replace(/React\.useCallback\b/g, 'useCallback');

  const hooks: string[] = [];
  if (/\buseState\b/.test(body)) hooks.push('useState');
  if (/\buseEffect\b/.test(body)) hooks.push('useEffect');
  if (/\buseRef\b/.test(body)) hooks.push('useRef');
  if (/\buseMemo\b/.test(body)) hooks.push('useMemo');
  if (/\buseCallback\b/.test(body)) hooks.push('useCallback');

  const icons = SSE_LUCIDE_ICONS.filter(icon => new RegExp(`<${icon}[\\s/>]`).test(body));

  const hooksImport = hooks.length > 0 ? `, { ${hooks.join(', ')} }` : '';
  const lucideImport = icons.length > 0 ? `\nimport { ${icons.join(', ')} } from 'lucide-react';` : '';

  return `import React${hooksImport} from 'react';${lucideImport}\n\n${body}\n\nexport default ${name};\n`;
}

export function validateTsxFile(name: string, content: string): { valid: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];

  const body = content
    .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export\s.*/gm, '');

  if (!/function\s+[A-Z]/.test(body))
    issues.push('missing capitalized function definition');
  if (!/\breturn\s*[(<]/.test(body))
    issues.push('missing JSX return statement');
  if (/<>|<\/>/.test(body))
    issues.push('JSX fragment syntax (<> </>) — use a wrapper div instead');
  if (/:\s*React\.FC\b|:\s*JSX\.Element\b/.test(body))
    issues.push('React.FC / JSX.Element annotation — omit the type or use (): JSX.Element');
  if (/\nimport\s/.test(body))
    issues.push('stray import statement inside function body');

  const voidElementRe = /<(br|hr|img|input|link|meta|area|base|col|embed|param|source|track|wbr)(\s[^>]*)?[^/]>/gi;
  if (voidElementRe.test(content))
    issues.push('HTML void element missing self-closing slash (e.g. <br> → <br />)');
  if (/className=\{\{/.test(content))
    issues.push('className must be a string, not an object (className={{ … }})');

  const returnMatch = body.match(/return\s*\(([\s\S]*?)\);/);
  if (returnMatch) {
    const jsx = returnMatch[1];
    const openTags  = (jsx.match(/<[A-Za-z][^/]*?>/g) || []).length;
    const closeTags = (jsx.match(/<\/[A-Za-z]/g) || []).length;
    const selfClose = (jsx.match(/<[A-Za-z][^>]*\/>/g) || []).length;
    if (openTags > closeTags + selfClose + 3)
      warnings.push('possible unclosed JSX tags in return block');
  }

  if (/\.map\(/.test(content) && !/key=/.test(content))
    warnings.push('.map() present but no key= prop found — add key to list items');
  if (/^(?!.*\/\/).*\bwindow\.\b|^(?!.*\/\/).*\bdocument\.\b/m.test(body) && !/useEffect\s*\(/.test(content))
    warnings.push('window/document access outside useEffect — wrap in useEffect');
  if (/^async\s+function\s+[A-Z]/.test(body))
    warnings.push('async component function — async is not valid in standard React components');
  if (/style=\{\{[^}]*:\s*"[^"]*px[^"]*"/.test(content))
    warnings.push('style prop using string for numeric values — use numbers: fontSize: 14 not "14px"');

  return { valid: issues.length === 0, issues, warnings };
}

export function runRuntimeValidator(files: ProjectFileSSE[]): { issues: Array<{ file: string; severity: 'error' | 'warning'; type: string; message: string }>; runtimeScore: number; filesValidated: number; runtimeErrors: number } {
  const issues: Array<{ file: string; severity: 'error' | 'warning'; type: string; message: string }> = [];
  const tsxFiles = files.filter(f => (f.lang === 'tsx' || f.lang === 'jsx') && f.name !== 'main.tsx');

  const definedComponents = new Set<string>();
  for (const file of tsxFiles) {
    const funcRe = /(?:export\s+default\s+)?function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = funcRe.exec(file.content)) !== null) definedComponents.add(m[1]);
  }

  for (const file of tsxFiles) {
    const content = file.content;
    const lines = content.split('\n');

    const mapRe = /\b([a-z][a-zA-Z0-9_]*?)\.map\s*\(/g;
    let mapMatch: RegExpExecArray | null;
    while ((mapMatch = mapRe.exec(content)) !== null) {
      const varName = mapMatch[1];
      if (['Object','Array','String','Math','window','document','console','el','ref'].includes(varName)) continue;
      const lineIdx = content.slice(0, mapMatch.index).split('\n').length - 1;
      const ctx = lines.slice(Math.max(0, lineIdx - 3), lineIdx + 3).join('\n');
      if (!ctx.includes(`Array.isArray(${varName})`) && !ctx.includes(`${varName}?.map`) && !ctx.includes(`|| []`)) {
        issues.push({ file: file.name, severity: 'warning', type: 'unsafe_array',
          message: `${varName}.map() without Array.isArray guard` });
      }
    }

    if (/if\s*\([^)]+\)\s*\{[^}]*use[A-Z]\w+\s*\(/.test(content)) {
      issues.push({ file: file.name, severity: 'error', type: 'invalid_hook',
        message: 'Hook called inside a conditional — hooks must be at component top level' });
    }

    const stateRe = /const\s+\[([a-z][a-zA-Z0-9]*)[^\]]*\]\s*=\s*(?:React\.)?useState\s*\(\s*\)/g;
    let stateMatch: RegExpExecArray | null;
    while ((stateMatch = stateRe.exec(content)) !== null) {
      const varName = stateMatch[1];
      if (content.includes(`${varName}.map(`)) {
        issues.push({ file: file.name, severity: 'error', type: 'undefined_state',
          message: `${varName}.map() called but useState() has no initial value — use useState([])` });
      }
    }

    if (file.name === 'App.tsx') {
      const routeRe = /element=\{<([A-Z][a-zA-Z0-9]*)\s*\/?>\}/g;
      let routeMatch: RegExpExecArray | null;
      while ((routeMatch = routeRe.exec(content)) !== null) {
        const compName = routeMatch[1];
        if (!definedComponents.has(compName)) {
          issues.push({ file: 'App.tsx', severity: 'error', type: 'route_mismatch',
            message: `Route references <${compName}> but no such component was generated` });
        }
      }
      const importRe = /import\s+(\w+)\s+from\s+['"]\.\/(?:pages|components)\/(\w+)['"]/g;
      let importMatch: RegExpExecArray | null;
      while ((importMatch = importRe.exec(content)) !== null) {
        const importedName = importMatch[2];
        if (!definedComponents.has(importedName)) {
          issues.push({ file: 'App.tsx', severity: 'error', type: 'missing_import',
            message: `Imports '${importedName}' but no matching component was generated` });
        }
      }
    }
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const runtimeScore = tsxFiles.length > 0
    ? Math.max(0, Math.min(100, Math.round(100 - (errorCount * 25) - (warningCount * 5))))
    : 100;

  return { issues, runtimeScore, filesValidated: tsxFiles.length, runtimeErrors: errorCount };
}

export function validateRoutes(files: ProjectFileSSE[]): { valid: boolean; issues: string[] } {
  const appFile = files.find(f => f.name === 'App.tsx');
  if (!appFile) return { valid: true, issues: [] };

  const componentFiles = new Set(
    files
      .filter(f => (f.lang === 'tsx' || f.lang === 'jsx') && f.name !== 'App.tsx')
      .map(f => f.name.replace(/\.(tsx|jsx)$/, ''))
  );

  const routeIssues: string[] = [];

  const importRe = /import\s+\w+\s+from\s+['"]\.\/(?:pages|components)\/(\w+)['"]/g;
  let importMatch: RegExpExecArray | null;
  while ((importMatch = importRe.exec(appFile.content)) !== null) {
    if (!componentFiles.has(importMatch[1])) {
      routeIssues.push(`App.tsx imports "${importMatch[1]}" but no component file exists`);
    }
  }

  const routeRe = /element=\{<([A-Z][a-zA-Z0-9]*)\s*\/?>\}/g;
  let routeMatch: RegExpExecArray | null;
  while ((routeMatch = routeRe.exec(appFile.content)) !== null) {
    if (!componentFiles.has(routeMatch[1])) {
      routeIssues.push(`Route uses <${routeMatch[1]}> but no component file was generated for it`);
    }
  }

  return { valid: routeIssues.length === 0, issues: routeIssues };
}
