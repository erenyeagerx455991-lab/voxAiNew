// ── V7.3.2 Tree Validator ─────────────────────────────────────────────────────
// Validates a PageTree for structural correctness and scores it 0-10.

import type {
  PageTree, SectionNode, ComponentNode,
  TreeValidationError, TreeValidationResult, TreeQualityDimensions,
} from "./componentTreeTypes.js";
import { COMPONENT_CATALOG } from "./componentCatalog.js";

// ── Dependency rules ───────────────────────────────────────────────────────────
// Maps a component to its required sibling/ancestor dependencies

const DEPENDENCY_RULES: Record<string, { requires: string[]; scope: 'section' | 'page' }> = {
  PricingCard:   { requires: ['PricingGrid'],       scope: 'section' },
  FeatureCard:   { requires: ['FeatureGrid'],        scope: 'section' },
  SecondaryCTA:  { requires: ['PrimaryCTA'],         scope: 'section' },
  PricingToggle: { requires: ['PricingHeader'],      scope: 'section' },
  PricingFAQ:    { requires: ['PricingGrid'],        scope: 'section' },
  DataTable:     { requires: ['DashboardFilters'],   scope: 'section' },
  EnterpriseProof: { requires: ['TrustRow'],         scope: 'section' },
  ProgressBar:   { requires: ['MetricCard'],         scope: 'section' },
  CRUDTable:     { requires: ['DataTable'],          scope: 'section' },
  AvatarUploader:{ requires: ['SettingsTabs'],       scope: 'section' },
  HeroSupportingCopy: { requires: ['HeroHeadline'], scope: 'section' },
  CTAButton:     { requires: ['CTAHeadline'],        scope: 'section' },
  SocialProof:   { requires: ['CTAHeadline'],        scope: 'section' },
};

// ── Invalid combinations ──────────────────────────────────────────────────────

const INVALID_COMBINATIONS: Array<{ sectionType: string; component: string; invalidWith: string; reason: string }> = [
  { sectionType: 'navbar',    component: 'CommandPalette', invalidWith: 'CTAButton',    reason: 'Admin navbar should not have marketing CTA' },
  { sectionType: 'dashboard', component: 'CRUDTable',      invalidWith: 'DashboardFilters', reason: 'CRUDTable already includes its own filter interface' },
];

// ── Validation checks ─────────────────────────────────────────────────────────

function checkDuplicateIds(tree: PageTree): TreeValidationError[] {
  const errors: TreeValidationError[] = [];
  const seen = new Set<string>();

  for (const section of tree.sections) {
    if (seen.has(section.id)) {
      errors.push({ type: 'duplicate_id', nodeId: section.id, message: `Duplicate section id: ${section.id}`, severity: 'error' });
    }
    seen.add(section.id);

    for (const component of section.children) {
      if (seen.has(component.id)) {
        errors.push({ type: 'duplicate_id', nodeId: component.id, message: `Duplicate component id: ${component.id}`, severity: 'error' });
      }
      seen.add(component.id);
    }
  }

  return errors;
}

function checkMissingDependencies(section: SectionNode): TreeValidationError[] {
  const errors: TreeValidationError[] = [];
  const componentNames = new Set(section.children.map(c => c.name));

  for (const component of section.children) {
    const rule = DEPENDENCY_RULES[component.name];
    if (!rule) continue;

    if (rule.scope === 'section') {
      for (const req of rule.requires) {
        if (!componentNames.has(req)) {
          errors.push({
            type: 'missing_dependency',
            nodeId: component.id,
            message: `${component.name} requires ${req} in the same section (${section.name})`,
            severity: 'warning',
          });
        }
      }
    }
  }

  return errors;
}

function checkOrphanNodes(tree: PageTree): TreeValidationError[] {
  const errors: TreeValidationError[] = [];

  for (const section of tree.sections) {
    if (section.parentId !== 'root') {
      errors.push({ type: 'orphan_node', nodeId: section.id, message: `Section ${section.id} has invalid parentId: ${section.parentId}`, severity: 'error' });
    }

    for (const component of section.children) {
      if (component.parentId !== section.id) {
        errors.push({ type: 'orphan_node', nodeId: component.id, message: `Component ${component.id} has invalid parentId`, severity: 'error' });
      }
    }
  }

  return errors;
}

function checkInvalidHierarchy(tree: PageTree): TreeValidationError[] {
  const errors: TreeValidationError[] = [];

  for (const section of tree.sections) {
    if (section.sectionType === 'unknown') {
      errors.push({ type: 'invalid_hierarchy', nodeId: section.id, message: `Section "${section.name}" could not be mapped to a known section type`, severity: 'warning' });
    }
  }

  // Hero should be first if present
  const heroIndex = tree.sections.findIndex(s => s.sectionType === 'hero');
  const navbarIndex = tree.sections.findIndex(s => s.sectionType === 'navbar');

  if (heroIndex > 0 && navbarIndex >= 0 && heroIndex < navbarIndex) {
    errors.push({ type: 'invalid_hierarchy', nodeId: tree.sections[heroIndex].id, message: 'Hero appears before Navbar — navbar should always precede hero', severity: 'warning' });
  }

  return errors;
}

function checkInvalidCombinations(section: SectionNode): TreeValidationError[] {
  const errors: TreeValidationError[] = [];
  const componentNames = new Set(section.children.map(c => c.name));

  for (const rule of INVALID_COMBINATIONS) {
    if (rule.sectionType !== section.sectionType) continue;
    if (componentNames.has(rule.component) && componentNames.has(rule.invalidWith)) {
      errors.push({
        type: 'invalid_combination',
        nodeId: section.id,
        message: `Invalid combination in ${section.name}: ${rule.component} + ${rule.invalidWith} — ${rule.reason}`,
        severity: 'warning',
      });
    }
  }

  return errors;
}

// ── Main validator ────────────────────────────────────────────────────────────

export function validateTree(tree: PageTree): TreeValidationResult {
  const allErrors: TreeValidationError[] = [];

  allErrors.push(...checkDuplicateIds(tree));
  allErrors.push(...checkOrphanNodes(tree));
  allErrors.push(...checkInvalidHierarchy(tree));

  for (const section of tree.sections) {
    allErrors.push(...checkMissingDependencies(section));
    allErrors.push(...checkInvalidCombinations(section));
  }

  const errors   = allErrors.filter(e => e.severity === 'error');
  const warnings = allErrors.filter(e => e.severity === 'warning');

  const score = scoreTreeValidation(errors.length, warnings.length, tree.statistics.totalNodes);

  return { valid: errors.length === 0, errors, warnings, score };
}

function scoreTreeValidation(errorCount: number, warningCount: number, totalNodes: number): number {
  if (totalNodes === 0) return 0;
  const errorPenalty   = errorCount * 2.0;
  const warningPenalty = warningCount * 0.5;
  return Math.max(0, Math.min(10, 10 - errorPenalty - warningPenalty));
}

// ── Quality scorer ────────────────────────────────────────────────────────────

export function scoreTree(tree: PageTree | undefined | null): number {
  if (!tree || tree.sections.length === 0) return 0;

  const dims = scoreTreeDimensions(tree);
  return dims.overallScore;
}

export function scoreTreeDimensions(tree: PageTree): TreeQualityDimensions {
  const sections = tree.sections;
  if (sections.length === 0) {
    return { hierarchyScore: 0, reuseScore: 0, dependencyScore: 0, consistencyScore: 0, completenessScore: 0, overallScore: 0 };
  }

  // Hierarchy: hero first, cta last, no unknown sections
  const heroFirst = sections[0]?.sectionType === 'hero' || sections[0]?.sectionType === 'navbar' ? 1 : 0;
  const ctaLast   = sections[sections.length - 1]?.sectionType === 'cta' || sections[sections.length - 1]?.sectionType === 'footer' ? 1 : 0;
  const unknownSections = sections.filter(s => s.sectionType === 'unknown').length;
  const hierarchyScore  = Math.max(0, 10 - unknownSections * 2) * (0.5 + heroFirst * 0.25 + ctaLast * 0.25);

  // Reuse: shared component names across sections
  const allComponents = sections.flatMap(s => s.children.map(c => c.name));
  const uniqueComponents = new Set(allComponents).size;
  const reuseRatio = allComponents.length > 0 ? 1 - (uniqueComponents / allComponents.length) : 0;
  const reuseScore = Math.min(10, 5 + reuseRatio * 10);

  // Dependency correctness: validated tree score
  const validation = validateTree(tree);
  const dependencyScore = validation.score;

  // Consistency: each section's children match the section's DNA
  const consistencyScore = sections.reduce((acc, section) => {
    const hasRequired = section.children.some(c => c.required);
    return acc + (hasRequired ? 10 : 5);
  }, 0) / sections.length;

  // Completeness: required components present per section
  let completeCount = 0;
  let totalRequired = 0;
  for (const section of sections) {
    const catalogComponents = COMPONENT_CATALOG.filter(c => c.sectionType === section.sectionType && c.priority >= 9);
    totalRequired += catalogComponents.length;
    const sectionComponentNames = new Set(section.children.map(c => c.name));
    completeCount += catalogComponents.filter(c => sectionComponentNames.has(c.id)).length;
  }
  const completenessScore = totalRequired > 0 ? Math.min(10, (completeCount / totalRequired) * 10) : 7;

  const overallScore = (
    hierarchyScore   * 0.30 +
    reuseScore       * 0.15 +
    dependencyScore  * 0.25 +
    consistencyScore * 0.15 +
    completenessScore * 0.15
  );

  return {
    hierarchyScore:   Math.round(hierarchyScore   * 10) / 10,
    reuseScore:       Math.round(reuseScore       * 10) / 10,
    dependencyScore:  Math.round(dependencyScore  * 10) / 10,
    consistencyScore: Math.round(consistencyScore * 10) / 10,
    completenessScore: Math.round(completenessScore * 10) / 10,
    overallScore:     Math.round(overallScore     * 10) / 10,
  };
}
