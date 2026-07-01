/**
 * V8.1 — Design DNA Type Definitions
 *
 * Full schema for a DesignDNARecord as specified in Phase 2.
 * These types are used by the registry, versioning, ranking, and persistence layers.
 * Never mix with the per-dimension DesignDNAMetrics in dnaMetrics.ts — those track
 * individual dimension outcomes; this tracks whole-DNA configurations.
 */

// ── Profile sub-types ─────────────────────────────────────────────────────────

export interface MotionProfile {
  personality: string;          // e.g. "subtle" | "bold-motion" | "cinematic"
  hasReducedMotion: boolean;
  transitionDuration: number;   // ms
  preferredLibrary: string;     // "framer-motion" | "css" | "none"
}

export interface SpacingProfile {
  sectionPadding: string;       // e.g. "py-24"
  contentGap: string;           // e.g. "gap-8"
  density: "compact" | "normal" | "spacious";
  gridBase: number;             // px (8 or 4)
}

export interface TypographyProfile {
  headingWeight: string;        // e.g. "800" | "700" | "600"
  scale: string;                // e.g. "large" | "medium" | "small"
  fontFamily: string;           // e.g. "inter" | "geist" | "system"
  lineHeightStyle: "tight" | "normal" | "relaxed";
}

export interface LayoutProfile {
  style: string;                // e.g. "centered" | "asymmetric" | "bento"
  maxWidth: string;             // e.g. "max-w-7xl"
  columnStrategy: string;       // e.g. "12-col-grid" | "flex"
  sectionDiversity: number;     // 0–1
}

export interface ColorPreferences {
  background: string;
  surface: string;
  primary: string;
  accent: string;
  textMuted: string;
  border: string;
  isDark: boolean;
  saturation: "muted" | "vibrant" | "monochrome";
}

export interface InteractionPreferences {
  hoverStyle: string;           // e.g. "scale" | "glow" | "underline"
  focusStyle: string;           // e.g. "ring" | "outline"
  buttonRadius: string;         // e.g. "rounded-lg" | "rounded-full"
  cardShadow: string;           // e.g. "shadow-sm" | "shadow-xl"
}

// ── Main DNA Record ───────────────────────────────────────────────────────────

export interface DesignDNARecord {
  // Identity
  readonly id: string;
  name: string;
  industry: string;
  brand: string;
  theme: string;

  // Profiles
  motionProfile: MotionProfile;
  spacingProfile: SpacingProfile;
  typographyProfile: TypographyProfile;
  layoutProfile: LayoutProfile;

  // Preferences (component/section → score 0–10)
  componentPreferences: Record<string, number>;
  sectionPreferences: Record<string, number>;
  colorPreferences: ColorPreferences;
  interactionPreferences: InteractionPreferences;

  // Quality scores (0–10 each, updated after every build)
  evaluatorScore: number;
  conversionScore: number;
  accessibilityScore: number;
  performanceScore: number;
  criticScore: number;
  visualScore: number;
  overallScore: number;

  // V8.1 composite ranking score (weighted formula from Phase 9)
  rankingScore: number;

  // Usage statistics
  usageCount: number;
  successCount: number;
  repairCount: number;
  failureCount: number;
  averageRepairLoops: number;

  // Lifecycle
  lastUpdated: string;          // ISO timestamp
  createdAt: string;            // ISO timestamp
  version: number;              // increments on every evolution
  confidence: number;           // 0–1; grows with usageCount
  status: "active" | "promoted" | "demoted" | "archived";
}

// ── Learning Source Input Types ───────────────────────────────────────────────

export interface BuildLearningInput {
  dnaId: string;
  evaluatorScore: number;
  criticScore: number;
  accessibilityScore: number;
  optimizationScore: number;     // maps to performanceScore
  visualScore: number;
  repairTriggered: boolean;
  repairLoops: number;
  conversionScore: number;
  success: boolean;
}

export interface CriticLearningInput {
  dnaId: string;
  criticScore: number;
  categories: string[];
  severity: "low" | "medium" | "high";
  repairApplied: boolean;
}

export interface BenchmarkLearningInput {
  dnaId: string;
  benchmarkScore: number;       // 0–10 relative to reference
  category: string;
  delta: number;                // improvement vs previous
}

export interface RepairLearningInput {
  dnaId: string;
  errorCategory: string;
  repairSuccess: boolean;
  qualityAfterRepair: number;
  loopsUsed: number;
}

export interface UserFeedbackInput {
  dnaId: string;
  rating: number;               // 1–5
  action: "accepted" | "edited" | "rejected";
  editedSections?: string[];
}

export interface VisualDiffInput {
  dnaId: string;
  pixelDiff: number;            // 0–1 (fraction changed)
  layoutRegression: boolean;
  spacingRegression: boolean;
  visualScore: number;
}

export interface RuntimeLearningInput {
  dnaId: string;
  buildSuccess: boolean;
  runtimeScore: number;
  errorCount: number;
  repairCount: number;
}

export interface TelemetryLearningInput {
  dnaId: string;
  generationMs: number;
  tokenCount: number;
  successRate: number;
  qualityTrend: "improving" | "stable" | "degrading";
}

// ── Version Record ────────────────────────────────────────────────────────────

export interface DNAVersion {
  readonly versionId: string;
  readonly dnaId: string;
  readonly version: number;
  readonly timestamp: string;
  readonly changes: string[];
  readonly reason: string;
  readonly previousScore: number;
  readonly newScore: number;
  readonly snapshot: Readonly<DesignDNARecord>;
}

// ── Ranking Entry ─────────────────────────────────────────────────────────────

export interface RankingEntry {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  score: number;
  usageCount: number;
  successRate: number;
  lastUpdated: string;
  trend: "rising" | "stable" | "falling";
}

// ── Persistence Snapshot ──────────────────────────────────────────────────────

export interface DNAPersistenceSnapshot {
  readonly version: string;     // schema version
  readonly savedAt: string;
  readonly dnaRecords: DesignDNARecord[];
  readonly rankingEntries: RankingEntry[];
  readonly evolutionCount: number;
  // V8.1 — version history included for rollback continuity across restarts
  readonly versionHistory?: Array<{
    dnaId: string;
    versions: DNAVersion[];
  }>;
}

// ── V8.1 Quality Formula Inputs ───────────────────────────────────────────────

export interface V81QualityInput {
  evaluatorScore: number;      // × 0.35
  criticScore: number;         // × 0.20
  accessibilityScore: number;  // × 0.10
  performanceScore: number;    // × 0.10
  visualScore: number;         // × 0.10
  runtimeStability: number;    // × 0.05  (0–10)
  userFeedbackScore: number;   // × 0.05  (0–10)
  benchmarkScore: number;      // × 0.05  (0–10)
}

export function computeV81Quality(input: V81QualityInput): number {
  const raw =
    input.evaluatorScore    * 0.35 +
    input.criticScore       * 0.20 +
    input.accessibilityScore * 0.10 +
    input.performanceScore  * 0.10 +
    input.visualScore       * 0.10 +
    input.runtimeStability  * 0.05 +
    input.userFeedbackScore * 0.05 +
    input.benchmarkScore    * 0.05;
  return Math.round(Math.max(0, Math.min(10, raw)) * 100) / 100;
}

// ── Confidence formula ────────────────────────────────────────────────────────
// Confidence grows asymptotically: reaches ~0.9 at 50 successful builds.

export function computeConfidence(usageCount: number, successCount: number): number {
  if (usageCount === 0) return 0;
  const successRate = successCount / usageCount;
  const experienceFactor = 1 - Math.exp(-usageCount / 20);
  return Math.round(Math.min(1, experienceFactor * successRate) * 1000) / 1000;
}
