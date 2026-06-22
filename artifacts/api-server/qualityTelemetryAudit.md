# V7.0.9 — Quality Telemetry Audit

## Overview

Extended the existing telemetry architecture (DO NOT create new architecture — ✓ complied) by adding a new module `src/telemetry/qualityMetrics.ts` and a new route endpoint `/api/telemetry/quality` within the existing telemetry router.

## Architecture

```
src/telemetry/qualityMetrics.ts   ← new module (follows buildMetrics.ts pattern)
src/routes/telemetry.ts           ← extended with GET /telemetry/quality
```

No new infrastructure. No new router. No changes to existing endpoints.

## Tracked Fields

| Field | Type | Description |
|---|---|---|
| `designScore` | 0–10 | Design quality score per build |
| `accessibilityScore` | 0–10 | Accessibility quality score per build |
| `shadcnUsage` | 0.0–1.0 | Fraction of components using shadcn primitives |
| `componentReuse` | 0.0–1.0 | Fraction of components from registry (vs generated from scratch) |
| `heroVariantUsed` | string | Registry ID of hero variant used (e.g. "hero-saas-v1") |
| `designDNAUsed` | string | Primary DNA applied (e.g. "linear", "stripe", "none") |

## API

### GET /api/telemetry/quality
Protected by `authMiddleware` (same as all other telemetry endpoints).

**Response:**
```json
{
  "quality": {
    "totalRecorded": 42,
    "averages": {
      "designScore": 8.4,
      "accessibilityScore": 7.9,
      "shadcnUsage": 0.71,
      "componentReuse": 0.88
    },
    "heroUsage": [
      { "variant": "hero-saas-v1", "count": 18 },
      { "variant": "hero-bento-v1", "count": 9 }
    ],
    "dnaUsage": [
      { "dna": "linear", "count": 12 },
      { "dna": "stripe", "count": 8 }
    ],
    "recent": [
      {
        "buildId": "abc-123",
        "designScore": 8.5,
        "accessibilityScore": 8.0,
        "shadcnUsage": 0.72,
        "heroVariantUsed": "hero-saas-v1",
        "designDNAUsed": "linear"
      }
    ]
  },
  "generatedAt": "2026-06-22T00:00:00.000Z"
}
```

## Global Counter Increments

| Counter | When |
|---|---|
| `quality.recorded` | Every call to recordQualityScore() |
| `quality.design.high` | When designScore ≥ 8 |
| `quality.accessibility.high` | When accessibilityScore ≥ 8 |
| `quality.shadcn.high` | When shadcnUsage ≥ 0.70 |

These counters appear in the existing `/api/telemetry/metrics` endpoint under `counters`.

## Integration Point

Callers invoke `recordQualityScore()` after each build completes. The recommended insertion point is in the build success path within the pipeline (after validateFiles or after setBuildStep(8)):

```typescript
import { recordQualityScore } from "../telemetry/qualityMetrics.js";

recordQualityScore({
  buildId,
  designScore: dnaScore,          // from DNA composition
  accessibilityScore: a11yScore,  // from runtime validator
  shadcnUsage: shadcnRatio,       // from component analysis
  componentReuse: registryRatio,  // from registry retrieval
  heroVariantUsed: heroId,        // from registry selection SSE
  designDNAUsed: primaryDNA,      // from DNA mixer
});
```

## resetQualityMetrics()
Exported for use in test beforeEach (following the pattern from repairMetrics.resetRepairMetrics).
