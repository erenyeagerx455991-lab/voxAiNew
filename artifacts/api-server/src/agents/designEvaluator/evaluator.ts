import type { DesignDNA } from "../types.js";
import { computeComponentCoverage } from "../../quality/componentRecommendations.js";

export interface EvaluationInput {
  code: string;
  sectionOrder: string[];
  designDNA: DesignDNA;
  authState?: string;
}

export interface EvaluationIssue {
  category: 'hero' | 'layout' | 'cta' | 'accessibility' | 'shadcn' | 'consistency' | 'coverage' | 'navigation' | 'auth-routing' | 'dashboard';
  severity: 'critical' | 'major' | 'minor';
  message: string;
}

export interface EvaluationResult {
  overallScore: number;
  heroScore: number;
  layoutScore: number;
  ctaScore: number;
  accessibilityScore: number;
  shadcnScore: number;
  coverageScore: number;
  navigationScore: number;
  accountMenuScore: number;
  authNavbarAlignmentScore: number;
  consistencyScore: number;
  dashboardScore: number;
  coveragePercent: number;
  componentUsage: Record<string, number>;
  issues: EvaluationIssue[];
}

function extractFunctionBlock(code: string, name: string): string {
  const startPattern = new RegExp(`function\\s+${name}\\s*\\(`);
  const match = startPattern.exec(code);
  if (!match) return '';
  const start = match.index;
  let depth = 0;
  let i = start;
  let entered = false;
  while (i < code.length) {
    if (code[i] === '{') { depth++; entered = true; }
    else if (code[i] === '}') {
      depth--;
      if (entered && depth === 0) return code.slice(start, i + 1);
    }
    i++;
  }
  return code.slice(start);
}

function scoreHero(code: string, sectionOrder: string[]): { score: number; issues: EvaluationIssue[] } {
  const issues: EvaluationIssue[] = [];
  let score = 0;

  if (!sectionOrder.includes('Hero')) return { score: 5, issues: [] };

  const heroBlock = extractFunctionBlock(code, 'Hero');

  if (/<Badge[\s>]/.test(heroBlock) || /\bpill\b|\bbadge\b/i.test(heroBlock)) {
    score += 2;
  } else {
    issues.push({ category: 'hero', severity: 'major', message: 'Hero section is missing a badge/pill label above the headline — add a <Badge> component with a short label like "Now in beta" or "Trusted by X teams"' });
  }

  if (/<h1[\s>]/.test(heroBlock)) {
    score += 2;
  } else {
    issues.push({ category: 'hero', severity: 'critical', message: 'Hero section is missing an <h1> headline element — the hero H1 is the page focal point and must be present' });
  }

  if (/<p[\s>]/.test(heroBlock)) {
    score += 1;
  } else {
    issues.push({ category: 'hero', severity: 'minor', message: 'Hero section is missing supporting copy — add a <p> element with 1–2 sentences describing the specific benefit' });
  }

  const buttonMatches = heroBlock.match(/<Button[\s>]/g) ?? [];
  const hasOutline = /variant=["'](outline|ghost)/.test(heroBlock);
  if (buttonMatches.length >= 2 && hasOutline) {
    score += 3;
  } else if (buttonMatches.length >= 2) {
    score += 2;
    issues.push({ category: 'hero', severity: 'minor', message: 'Hero has 2 CTA buttons but secondary is not outline/ghost — use <Button variant="outline"> for the secondary CTA to create visual hierarchy' });
  } else if (buttonMatches.length === 1) {
    score += 1;
    issues.push({ category: 'hero', severity: 'major', message: 'Hero section has only 1 CTA button — add a secondary <Button variant="outline"> alongside the primary CTA (e.g. "See how it works")' });
  } else {
    issues.push({ category: 'hero', severity: 'critical', message: 'Hero section has no <Button> CTA components — add a primary <Button> and secondary <Button variant="outline"> in a flex row' });
  }

  const hasTrustSignal =
    /★|⭐|rating|review|trusted by|\d[\d,]+\s*(?:user|team|customer|repo)|avatar|AvatarImage|join \d|active team|uptime|latency|logo.*cloud/i.test(heroBlock);
  if (hasTrustSignal) {
    score += 2;
  } else {
    issues.push({ category: 'hero', severity: 'major', message: 'Hero section is missing a trust signal below the CTAs — add star ratings + review count, avatar stack + user count, a logo cloud, or a key metrics strip' });
  }

  return { score: Math.min(10, score), issues };
}

function scoreLayout(code: string, sectionOrder: string[]): { score: number; issues: EvaluationIssue[] } {
  const issues: EvaluationIssue[] = [];
  let score = 0;

  const sectionCount = sectionOrder.length;
  if (sectionCount >= 6 && sectionCount <= 10) {
    score += 2;
  } else if (sectionCount >= 4) {
    score += 1;
    issues.push({ category: 'layout', severity: 'minor', message: `Section count is ${sectionCount} — optimal is 6–10 sections for a complete landing page experience` });
  } else {
    issues.push({ category: 'layout', severity: 'major', message: `Only ${sectionCount} sections present — a complete page needs at least 6: Navbar, Hero, Features, Social Proof, CTA, Footer` });
  }

  const bgPattern = /className=["'][^"']*\bbg-\[#([0-9a-fA-F]{3,6})\][^"']*["']/g;
  const bgMatches: string[] = [];
  let bgM: RegExpExecArray | null;
  while ((bgM = bgPattern.exec(code)) !== null) bgMatches.push(bgM[1].toLowerCase());

  if (bgMatches.length >= 3) {
    const uniqueBgs = new Set(bgMatches);
    if (uniqueBgs.size >= 2) {
      const recent = bgMatches.slice(-8);
      let adjDups = 0;
      for (let i = 1; i < recent.length; i++) if (recent[i] === recent[i - 1]) adjDups++;
      if (adjDups === 0) {
        score += 4;
      } else if (adjDups === 1) {
        score += 3;
        issues.push({ category: 'layout', severity: 'minor', message: `1 pair of adjacent sections share the same background color — alternate bg and surface colors throughout the page for visual rhythm` });
      } else {
        score += 2;
        issues.push({ category: 'layout', severity: 'major', message: `${adjDups} adjacent section pairs share identical background colors — apply the bg → surface → bg alternation pattern` });
      }
    } else {
      score += 1;
      issues.push({ category: 'layout', severity: 'major', message: 'All sections use a single background color — use at least 2 alternating colors (background + surface) to create section separation without borders' });
    }
  } else {
    score += 2;
  }

  const gridPattern = /\bgrid-cols-(\d+)\b/g;
  const gridCols: string[] = [];
  let gM: RegExpExecArray | null;
  while ((gM = gridPattern.exec(code)) !== null) gridCols.push(gM[1]);
  if (gridCols.length >= 3) {
    let tripleRun = 0;
    for (let i = 2; i < gridCols.length; i++) {
      if (gridCols[i] === gridCols[i - 1] && gridCols[i] === gridCols[i - 2]) tripleRun++;
    }
    if (tripleRun === 0) {
      score += 2;
    } else {
      score += 1;
      issues.push({ category: 'layout', severity: 'major', message: `${tripleRun + 2} consecutive sections use grid-cols-${gridCols[2]} layout — break the run with a list, split layout, or table between grid sections` });
    }
  } else {
    score += 2;
  }

  const hasNonCardSection =
    /\bflex-(?:row|col)\b/.test(code) ||
    /<(?:table|ul|ol)\b/.test(code) ||
    /\border-[tb]\b/.test(code);
  if (hasNonCardSection) {
    score += 2;
  } else {
    issues.push({ category: 'layout', severity: 'minor', message: 'All sections use grid card layouts — add at least one non-card section (list, table, split layout, or flex row) for visual diversity' });
  }

  return { score: Math.min(10, score), issues };
}

function scoreCTA(code: string): { score: number; issues: EvaluationIssue[] } {
  const issues: EvaluationIssue[] = [];
  let score = 0;

  const allButtonTags = code.match(/<Button[\s\S]*?>/g) ?? [];
  const solidButtons = allButtonTags.filter(b => !/variant=["'](outline|ghost|secondary|destructive)/.test(b));
  const outlineGhostButtons = allButtonTags.filter(b => /variant=["'](outline|ghost|secondary)/.test(b));

  if (solidButtons.length >= 1) {
    score += 3;
  } else if (allButtonTags.length >= 1) {
    score += 2;
    issues.push({ category: 'cta', severity: 'major', message: `No solid/primary <Button> found — at least one default-variant <Button> is needed as the dominant page CTA` });
  } else {
    issues.push({ category: 'cta', severity: 'critical', message: 'No <Button> components found on the page — add a primary <Button> CTA and secondary <Button variant="outline"> CTA' });
  }

  if (outlineGhostButtons.length >= 1) {
    score += 3;
  } else if (allButtonTags.length > 1) {
    score += 1;
    issues.push({ category: 'cta', severity: 'minor', message: 'All buttons use the solid/default style — add <Button variant="outline"> or <Button variant="ghost"> for secondary CTAs to establish visual hierarchy' });
  }

  const buttonTextPattern = /<Button[^>]*>([\s\S]*?)<\/Button>/g;
  const buttonTexts: string[] = [];
  let btM: RegExpExecArray | null;
  while ((btM = buttonTextPattern.exec(code)) !== null) {
    const text = btM[1].replace(/<[^>]+>/g, '').trim().toLowerCase();
    if (text.length > 2) buttonTexts.push(text);
  }
  const uniqueTexts = new Set(buttonTexts);
  if (buttonTexts.length === 0 || uniqueTexts.size === buttonTexts.length) {
    score += 2;
  } else {
    score += 1;
    issues.push({ category: 'cta', severity: 'minor', message: `${buttonTexts.length - uniqueTexts.size} CTA button(s) have duplicate text — each CTA must have a unique, action-specific label` });
  }

  const vaguePattern = />\s*(get started|learn more|click here|submit|sign up)\s*</gi;
  const vagueCTAs = code.match(vaguePattern) ?? [];
  if (vagueCTAs.length === 0) {
    score += 2;
  } else {
    score += 1;
    issues.push({ category: 'cta', severity: 'major', message: `${vagueCTAs.length} generic CTA label(s) detected (e.g. "Get Started", "Learn More") — replace with specific action labels like "Start free trial →" or "Book a table"` });
  }

  return { score: Math.min(10, score), issues };
}

function scoreAccessibility(code: string): { score: number; issues: EvaluationIssue[] } {
  const issues: EvaluationIssue[] = [];
  let score = 0;

  const rawButtons = code.match(/<button[\s>]/gi) ?? [];
  const typedButtons = code.match(/<button[^>]*type=["']button["']/gi) ?? [];
  const missingType = rawButtons.length - typedButtons.length;
  if (missingType === 0) {
    score += 3;
  } else {
    score += Math.max(0, 3 - missingType);
    issues.push({ category: 'accessibility', severity: 'major', message: `${missingType} <button> element(s) missing type="button" — add type="button" to all raw <button> tags to prevent accidental form submission` });
  }

  const focusVisibleCount = (code.match(/focus-visible:ring/g) ?? []).length;
  const interactiveCount = (code.match(/<(?:button|Button|a\s)/gi) ?? []).length;
  if (focusVisibleCount >= Math.max(1, Math.floor(interactiveCount * 0.4))) {
    score += 3;
  } else if (focusVisibleCount > 0) {
    score += 2;
    issues.push({ category: 'accessibility', severity: 'minor', message: `focus-visible:ring present on some elements but not all — add "focus-visible:outline-none focus-visible:ring-2" to every interactive button and link` });
  } else {
    issues.push({ category: 'accessibility', severity: 'critical', message: 'No focus-visible:ring classes found anywhere — all interactive elements need keyboard focus indicators for WCAG 2.1 AA compliance' });
  }

  if (/aria-label=["'][^"']+["']/.test(code)) {
    score += 2;
  } else {
    issues.push({ category: 'accessibility', severity: 'major', message: 'No aria-label attributes found — add aria-label="Main navigation" to <nav>, aria-label to icon-only buttons, and role="region" to major sections' });
  }

  const lowOpacity = code.match(/text-white\/(25|30|35|45)\b/g) ?? [];
  if (lowOpacity.length === 0) {
    score += 2;
  } else {
    issues.push({ category: 'accessibility', severity: 'major', message: `${lowOpacity.length} instance(s) of inaccessibly low text opacity detected (${[...new Set(lowOpacity)].join(', ')}) — minimum is text-white/60 for body text, text-white/70 for subheadings` });
  }

  return { score: Math.min(10, score), issues };
}

function scoreShadcn(code: string): { score: number; issues: EvaluationIssue[] } {
  const issues: EvaluationIssue[] = [];
  let score = 0;

  if (/<Button[\s>]/.test(code)) {
    score += 2;
  } else {
    issues.push({ category: 'shadcn', severity: 'critical', message: 'No <Button> shadcn component found — replace all raw <button> elements with <Button> (global, no import needed)' });
  }

  if (/<Card[\s>]/.test(code)) {
    score += 2;
  } else {
    issues.push({ category: 'shadcn', severity: 'major', message: 'No <Card> shadcn component found — use <Card><CardHeader><CardTitle>...</CardTitle></CardHeader><CardContent>...</CardContent></Card> for card layouts' });
  }

  if (/<Badge[\s>]/.test(code)) {
    score += 2;
  } else {
    issues.push({ category: 'shadcn', severity: 'major', message: 'No <Badge> shadcn component found — use <Badge> for status indicators, labels, category tags, and the hero badge' });
  }

  const standard = [
    { re: /<Avatar[\s>]/, name: 'Avatar' },
    { re: /<Input[\s>]/, name: 'Input' },
    { re: /<Accordion[\s>]/, name: 'Accordion' },
    { re: /<Tabs[\s>]/, name: 'Tabs' },
  ];
  let stdCount = 0;
  for (const { re } of standard) if (re.test(code)) stdCount++;
  score += Math.min(2, stdCount);
  if (stdCount === 0) {
    issues.push({ category: 'shadcn', severity: 'minor', message: 'No advanced shadcn components used (Avatar, Input, Accordion, Tabs) — add Avatar for testimonial photos, Accordion for FAQ, Tabs for multi-view pricing' });
  }

  // V7.2.4: Premium component bonus (Command, DataTable, NavigationMenu, Drawer, HoverCard, Calendar, Menubar)
  const premium = [
    { re: /<Command[\s>]/, name: 'Command' },
    { re: /<DataTable[\s>]/, name: 'DataTable' },
    { re: /<NavigationMenu[\s>]/, name: 'NavigationMenu' },
    { re: /<Drawer[\s>]/, name: 'Drawer' },
    { re: /<HoverCard[\s>]/, name: 'HoverCard' },
    { re: /<Calendar[\s>]/, name: 'Calendar' },
    { re: /<DatePicker[\s>]/, name: 'DatePicker' },
    { re: /<Menubar[\s>]/, name: 'Menubar' },
  ];
  let premiumCount = 0;
  for (const { re } of premium) if (re.test(code)) premiumCount++;
  score += Math.min(2, premiumCount);

  return { score: Math.min(10, score), issues };
}

// V7.2.5: Navigation quality score (0–10)
// Checks NavigationMenu usage, Sheet mobile menu, aria attributes, focus states
function scoreNavigation(code: string): { score: number; issues: EvaluationIssue[] } {
  const issues: EvaluationIssue[] = [];
  let score = 0;

  // 1. NavigationMenu component (+3) — core requirement
  if (/<NavigationMenu[\s>]/.test(code)) {
    score += 3;
  } else {
    issues.push({ category: 'navigation', severity: 'critical', message: 'No <NavigationMenu> component found in navbar — replace raw div navigation with <NavigationMenu><NavigationMenuList><NavigationMenuItem> for structured, accessible desktop navigation' });
  }

  // 2. aria-label="Main navigation" on nav element (+2)
  if (/aria-label=["']Main navigation["']/i.test(code)) {
    score += 2;
  } else {
    issues.push({ category: 'navigation', severity: 'major', message: 'Missing aria-label="Main navigation" on the <nav> element — add it for screen-reader landmark navigation compliance (WCAG 2.4.1)' });
  }

  // 3. Sheet for mobile menu (+2) — no custom overlays
  if (/<Sheet[\s>]/.test(code) || /<SheetContent[\s>]/.test(code)) {
    score += 2;
  } else {
    issues.push({ category: 'navigation', severity: 'major', message: 'No <Sheet> mobile menu found — replace custom hamburger overlays with <Sheet><SheetContent side="left"> for a consistent, accessible mobile navigation drawer' });
  }

  // 4. focus-visible:ring on nav links (+2) — keyboard navigation
  const navBlock = extractFunctionBlock(code, 'Navbar');
  const focusVisibleInNav = (navBlock.match(/focus-visible:ring/g) ?? []).length;
  if (focusVisibleInNav >= 2) {
    score += 2;
  } else if (focusVisibleInNav === 1) {
    score += 1;
    issues.push({ category: 'navigation', severity: 'minor', message: 'Only 1 focus-visible:ring in Navbar — add focus-visible:outline-none focus-visible:ring-2 to all nav links, buttons, and the mobile toggle for keyboard accessibility' });
  } else {
    issues.push({ category: 'navigation', severity: 'major', message: 'No focus-visible:ring in Navbar component — keyboard users cannot see which nav item is focused; add focus-visible:ring-2 to every interactive element' });
  }

  // 5. Mobile toggle has type="button" + aria-expanded (+1)
  const hasMobileToggle = /aria-expanded={mobileOpen}/.test(code) || /aria-expanded=["']/.test(code);
  const hasTypeButton = /<button\s[^>]*type=["']button["'][^>]*aria-label=["'][^"']*menu/i.test(code) ||
                        /aria-label=["'][^"']*menu[^"']*["'][^>]*type=["']button["']/i.test(code);
  if (hasMobileToggle || hasTypeButton) {
    score += 1;
  } else if (/<button.*aria-label.*toggle|open.*menu/i.test(code)) {
    score += 1;
  }

  return { score: Math.min(10, score), issues };
}

// V7.2.4: Component diversity coverage score (0–10)
function scoreCoverage(code: string): { score: number; issues: EvaluationIssue[]; coveragePercent: number; componentUsage: Record<string, number> } {
  const issues: EvaluationIssue[] = [];
  const coverage = computeComponentCoverage(code);
  const { coveragePercent, componentUsage, totalUnique } = coverage;

  // Score: 0 unique = 0, 5 = 5pts, 10+ = 8pts, 14+ = 10pts
  let score: number;
  if (totalUnique >= 14) {
    score = 10;
  } else if (totalUnique >= 10) {
    score = 8;
  } else if (totalUnique >= 7) {
    score = 6;
  } else if (totalUnique >= 5) {
    score = 4;
  } else if (totalUnique >= 3) {
    score = 2;
  } else {
    score = Math.min(2, totalUnique);
  }

  if (coveragePercent < 50) {
    issues.push({ category: 'coverage', severity: 'major', message: `Shadcn coverage is ${coveragePercent}% (${totalUnique} unique components) — target ≥90%; use Command for search, DataTable for data, NavigationMenu for nav, Drawer for mobile panels` });
  } else if (coveragePercent < 75) {
    issues.push({ category: 'coverage', severity: 'minor', message: `Shadcn coverage is ${coveragePercent}% — add premium components like Command, DataTable, or NavigationMenu to push toward 90%+` });
  }

  return { score: Math.min(10, score), issues, coveragePercent, componentUsage };
}

function scoreConsistency(code: string): { score: number; issues: EvaluationIssue[] } {
  const issues: EvaluationIssue[] = [];
  let score = 0;

  if (!/lorem ipsum/i.test(code)) {
    score += 2;
  } else {
    issues.push({ category: 'consistency', severity: 'critical', message: 'Lorem ipsum placeholder text detected — replace every instance with real, industry-specific content relevant to the business' });
  }

  if (!/acme corp|your company|company name|john doe|jane smith|example inc/i.test(code)) {
    score += 2;
  } else {
    const m = code.match(/acme corp|your company|company name|john doe|jane smith|example inc/i);
    issues.push({ category: 'consistency', severity: 'major', message: `Generic placeholder name detected: "${m?.[0]}" — use the actual business name and realistic person names (e.g. "Sarah Chen, CTO at TechFlow")` });
  }

  const radii = ['rounded-none', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full'];
  const usedRadii = radii.filter(r => new RegExp(`\\b${r}\\b`).test(code));
  if (usedRadii.length <= 2) {
    score += 2;
  } else if (usedRadii.length <= 3) {
    score += 1;
    issues.push({ category: 'consistency', severity: 'minor', message: `${usedRadii.length} border-radius values in use (${usedRadii.join(', ')}) — standardize to 1–2 radius sizes throughout for design consistency` });
  } else {
    issues.push({ category: 'consistency', severity: 'major', message: `${usedRadii.length} conflicting border-radius values (${usedRadii.join(', ')}) — pick one radius size (e.g. rounded-xl) and apply it consistently to all cards and buttons` });
  }

  const gradFromColors = code.match(/from-(\w+)-\d+/g) ?? [];
  const colorFamilies = new Set(gradFromColors.map(m => m.split('-')[1]).filter(Boolean));
  if (colorFamilies.size <= 1) {
    score += 2;
  } else if (colorFamilies.size <= 2) {
    score += 1;
    issues.push({ category: 'consistency', severity: 'minor', message: `${colorFamilies.size} gradient color families detected — feature icons should use a single consistent accent color, not a multi-color rainbow per card` });
  } else {
    issues.push({ category: 'consistency', severity: 'major', message: `${colorFamilies.size} different gradient color families used (${[...colorFamilies].slice(0, 4).join(', ')}) — collapse to a single accent color from the design DNA` });
  }

  if (!/text-white\/(25|30|35|45)\b/.test(code)) {
    score += 2;
  } else {
    const instances = code.match(/text-white\/(25|30|35|45)\b/g) ?? [];
    issues.push({ category: 'consistency', severity: 'major', message: `${instances.length} low-opacity text class(es) detected — replace text-white/${instances[0]?.split('/')[1]} with text-white/60 minimum` });
  }

  return { score: Math.min(10, score), issues };
}

// V7.2.6: accountMenu score — DropdownMenu + Avatar + Logout pattern (0–10)
function scoreAccountMenu(code: string): { score: number; issues: EvaluationIssue[] } {
  const issues: EvaluationIssue[] = [];
  let score = 0;

  // 1. DropdownMenu present (+3) — no custom profile menus
  if (/<DropdownMenu[\s>]/.test(code)) {
    score += 3;
  } else {
    issues.push({ category: 'navigation', severity: 'major', message: 'No <DropdownMenu> for user profile menu — replace any custom account dropdown with <DropdownMenu><DropdownMenuTrigger><DropdownMenuContent> for accessible, keyboard-navigable menus' });
  }

  // 2. Avatar component present (+3)
  if (/<Avatar[\s>]/.test(code)) {
    score += 3;
  } else {
    issues.push({ category: 'navigation', severity: 'major', message: 'No <Avatar> component found in navigation — use <Avatar><AvatarFallback>JD</AvatarFallback></Avatar> for authenticated user identity; never use a raw img tag for avatars' });
  }

  // 3. AvatarFallback with initials (+1)
  if (/<AvatarFallback[\s>]/.test(code)) {
    score += 1;
  } else if (/<Avatar[\s>]/.test(code)) {
    issues.push({ category: 'navigation', severity: 'minor', message: 'Avatar is missing <AvatarFallback> — add initials (e.g. "JD") inside <AvatarFallback> so users without profile images see a name-based placeholder' });
  }

  // 4. DropdownMenuTrigger properly wraps Avatar (+1)
  if (/<DropdownMenuTrigger[\s>]/.test(code)) {
    score += 1;
  } else if (/<DropdownMenu[\s>]/.test(code)) {
    issues.push({ category: 'navigation', severity: 'minor', message: 'DropdownMenu is missing <DropdownMenuTrigger> — wrap the Avatar in <DropdownMenuTrigger asChild> to make it the accessible trigger button' });
  }

  // 5. Logout / Sign out action exists (+2)
  if (/logout|sign.?out|log.?out/i.test(code)) {
    score += 2;
  } else if (/<DropdownMenu[\s>]/.test(code)) {
    issues.push({ category: 'navigation', severity: 'major', message: 'No logout action in DropdownMenu — add <DropdownMenuItem className="text-red-400">Sign out</DropdownMenuItem> as the last item in the authenticated user menu' });
  }

  return { score: Math.min(10, score), issues };
}

// V7.2.6.1: scoreAuthNavbarAlignment — checks if output navbar matches detected auth intent (0–10)
function scoreAuthNavbarAlignment(code: string, authState?: string): { score: number; issues: EvaluationIssue[] } {
  const issues: EvaluationIssue[] = [];

  if (!authState || authState === 'guest') {
    // Guest: having auth components is acceptable (generous score)
    return { score: 7, issues: [] };
  }

  let score = 0;

  // All authenticated states: Avatar + DropdownMenu required
  if (/<Avatar[\s>]/.test(code)) {
    score += 3;
  } else {
    issues.push({ category: 'auth-routing', severity: 'major', message: `Auth state is "${authState}" but no <Avatar> found — authenticated navbars must display user identity via <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>` });
  }

  if (/<DropdownMenu[\s>]/.test(code)) {
    score += 3;
  } else {
    issues.push({ category: 'auth-routing', severity: 'major', message: `Auth state is "${authState}" but no <DropdownMenu> found — wrap Avatar in <DropdownMenuTrigger> for the authenticated profile dropdown` });
  }

  // Dashboard + admin: Sheet required for workspace/mobile panel
  if (authState === 'dashboard' || authState === 'admin') {
    if (/<Sheet[\s>]/.test(code)) {
      score += 2;
    } else {
      issues.push({ category: 'auth-routing', severity: 'minor', message: `${authState.charAt(0).toUpperCase() + authState.slice(1)} navbar should include <Sheet> for the workspace panel or mobile drawer` });
    }
  } else {
    score += 2; // authenticated state: Sheet optional
  }

  // Admin only: Command palette required
  if (authState === 'admin') {
    if (/<Command[\s>]/.test(code)) {
      score += 2;
    } else {
      issues.push({ category: 'auth-routing', severity: 'major', message: 'Admin navbar is missing <Command> palette (⌘K) — admin users expect fast keyboard-driven global search and actions' });
    }
  } else {
    score += 2; // non-admin: Command not required
  }

  return { score: Math.min(10, score), issues };
}

// ── V7.2.7: Dashboard Quality Scorer ──────────────────────────────────────────
// Scores dashboard-type sections on DataTable, Tabs, Badge, Skeleton, Command.
// Non-dashboard builds receive a neutral 10 (no penalty).
function scoreDashboard(code: string, isDashboard: boolean): { score: number; issues: EvaluationIssue[] } {
  const issues: EvaluationIssue[] = [];

  // Detect actual dashboard content (not just a decorative DashboardPreview card)
  const hasTableContent   = /\b(DataTable|<table|<tbody|<thead)\b/i.test(code);
  const hasDataGrid       = /\b(sortable|pagination|row.?action|column)\b/i.test(code) && /\b(filter|search)\b/i.test(code);
  const hasDashboardData  = /\b(transactions|invoices|user.?management|audit.?log|user.?table)\b/i.test(code);

  const hasDashboardContent = isDashboard || hasTableContent || hasDataGrid || hasDashboardData;

  // Landing pages get full credit — dashboard score only penalises bad dashboards
  if (!hasDashboardContent) return { score: 10, issues: [] };

  let score = 0;

  // DataTable or proper table structure (+3)
  if (/\bDataTable\b/.test(code)) {
    score += 3;
  } else if (/<table|<tbody/i.test(code)) {
    score += 1;
    issues.push({ category: 'dashboard', severity: 'major', message: 'Dashboard uses raw HTML table — use shadcn DataTable with sorting, search, and pagination' });
  } else {
    issues.push({ category: 'dashboard', severity: 'major', message: 'Dashboard missing data table — add DataTable with sortable columns, search, and row actions' });
  }

  // Tabs navigation (+2)
  if (/\bTabsList\b|\bTabsTrigger\b/.test(code)) {
    score += 2;
  } else {
    issues.push({ category: 'dashboard', severity: 'minor', message: 'Dashboard missing Tabs — use Tabs/TabsList/TabsTrigger for view switching (Overview, Analytics, Settings)' });
  }

  // Badge for status fields (+2)
  if (/\bBadge\b/.test(code)) {
    score += 2;
  } else {
    issues.push({ category: 'dashboard', severity: 'minor', message: 'Dashboard missing Badge — use Badge for status indicators (Active, Pending, Failed, etc.)' });
  }

  // Skeleton loading states (+2)
  if (/\bSkeleton\b/.test(code)) {
    score += 2;
  } else {
    issues.push({ category: 'dashboard', severity: 'minor', message: 'Dashboard missing Skeleton — add Skeleton loading placeholders for tables and metric cards' });
  }

  // Command palette or filter DropdownMenu (+1)
  if (/\bCommandInput\b|\bCommandList\b/.test(code)) {
    score += 1;
  } else if (/\bDropdownMenuContent\b/.test(code)) {
    score += 1;
  }

  return { score: Math.min(10, score), issues };
}

// V7.2.7: weights redistributed to sum to 1.00 (11 dimensions)
const WEIGHTS = {
  hero:                  0.17,  // was 0.19
  layout:                0.14,  // was 0.16
  cta:                   0.10,  // was 0.12
  accessibility:         0.16,
  shadcn:                0.07,
  coverage:              0.06,
  navigation:            0.10,
  accountMenu:           0.05,
  authNavbarAlignment:   0.04,
  consistency:           0.05,
  dashboard:             0.06,  // new V7.2.7
};

export function evaluateDesign(input: EvaluationInput): EvaluationResult {
  const { code, sectionOrder, authState } = input;
  const isDashboard = input.isDashboard ?? false;

  const hero               = scoreHero(code, sectionOrder);
  const layout             = scoreLayout(code, sectionOrder);
  const cta                = scoreCTA(code);
  const accessibility      = scoreAccessibility(code);
  const shadcn             = scoreShadcn(code);
  const coverage           = scoreCoverage(code);
  const navigation         = scoreNavigation(code);
  const accountMenu        = scoreAccountMenu(code);
  const authNavbarAlignment = scoreAuthNavbarAlignment(code, authState);
  const consistency        = scoreConsistency(code);
  const dashboard          = scoreDashboard(code, isDashboard);

  const overallScore =
    Math.round(
      (hero.score                    * WEIGHTS.hero +
        layout.score                 * WEIGHTS.layout +
        cta.score                    * WEIGHTS.cta +
        accessibility.score          * WEIGHTS.accessibility +
        shadcn.score                 * WEIGHTS.shadcn +
        coverage.score               * WEIGHTS.coverage +
        navigation.score             * WEIGHTS.navigation +
        accountMenu.score            * WEIGHTS.accountMenu +
        authNavbarAlignment.score    * WEIGHTS.authNavbarAlignment +
        consistency.score            * WEIGHTS.consistency +
        dashboard.score              * WEIGHTS.dashboard) * 10
    ) / 10;

  const allIssues = [
    ...hero.issues,
    ...layout.issues,
    ...cta.issues,
    ...accessibility.issues,
    ...shadcn.issues,
    ...coverage.issues,
    ...navigation.issues,
    ...accountMenu.issues,
    ...authNavbarAlignment.issues,
    ...consistency.issues,
    ...dashboard.issues,
  ].sort((a, b) => {
    const sev: Record<string, number> = { critical: 0, major: 1, minor: 2 };
    return sev[a.severity] - sev[b.severity];
  });

  return {
    overallScore,
    heroScore:                 hero.score,
    layoutScore:               layout.score,
    ctaScore:                  cta.score,
    accessibilityScore:        accessibility.score,
    shadcnScore:               shadcn.score,
    coverageScore:             coverage.score,
    navigationScore:           navigation.score,
    accountMenuScore:          accountMenu.score,
    authNavbarAlignmentScore:  authNavbarAlignment.score,
    consistencyScore:          consistency.score,
    dashboardScore:            dashboard.score,
    coveragePercent:           coverage.coveragePercent,
    componentUsage:            coverage.componentUsage,
    issues:                    allIssues,
  };
}
