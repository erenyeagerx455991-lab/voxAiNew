# Prompt Quality Audit — V7.0.8

Source: `src/agents/llm/prompts.ts` (all exported prompts), `src/agents/frontend/codeSystem.ts` (buildCodeSystem).
Generated: 2026-06-22.

---

## Prompt Inventory

| Prompt | File | Characters | Agent Role |
|---|---|---|---|
| PLANNER_SYSTEM | prompts.ts | ~3,400 | User-facing plan + internal design brief + page blueprint |
| ARCHITECTURE_SYSTEM | prompts.ts | ~2,800 | Project blueprint JSON (pages, APIs, tables, auth) |
| DESIGN_SYSTEM | prompts.ts | ~3,200 | DesignDNA JSON from reference sites |
| CODEFIX_SYSTEM | prompts.ts | ~900 | Preview repair (strip imports/exports, fix JSX) |
| BACKEND_SYSTEM | prompts.ts | ~1,200 | Express.js + TypeScript API files |
| DATABASE_SYSTEM | prompts.ts | ~1,400 | SQL schema + Prisma schema files |
| AUTH_SYSTEM | prompts.ts | ~1,200 (truncated in read) | Auth implementation files |
| buildCodeSystem() | codeSystem.ts | ~4,800 (generated) | React+Tailwind full site codegen |

**Total system prompt characters: ~18,900.** At GPT/Claude pricing, this is ~4,700 tokens of pure system prompt per build.

---

## PLANNER_SYSTEM

### Purpose and Structure

The Planner Agent produces three outputs in one LLM call:

1. **PART 1 — PLAN** (visible to user): Checklist, summary, pages, tech details
2. **PART 2 — DESIGN_BRIEF** (internal): Structured fields for Design Agent
3. **PART 3 — PAGE_BLUEPRINT** (internal): JSON sectionOrder for Code Gen Agent

### Strengths

**Plan format is precise:**
```
✅ Plan (Checklist) — emoji-gated, technical build steps
📋 Project Summary — 2-3 sentences
📄 Pages — 3-5 pages with sections
⚙️ Technical Details — stack and notes
```

Headers are emoji-keyed for reliable parsing. Format deviations are easy to detect.

**Reference extraction rules are exceptional:**
```
- Include ONLY sites the user explicitly named. Never infer, add competitors, or expand.
- "similar to Linear" → referenceSites: "Linear", primaryReference: "Linear"
- Never add Stripe to a Linear prompt. Never add Vercel to a Stripe prompt.
- User's word order = priority order. First mentioned = primaryReference.
```

Negative examples ("Never add Stripe to a Linear prompt") are the highest-quality instruction pattern — they address specific known failure modes.

**Section rules prevent category errors:**
```
- A restaurant site needs: Gallery, Menu, ChefStory, Reservation — NOT Pricing or FeaturesBento
- A portfolio needs: Projects, CaseStudies, Contact — NOT Pricing or LogoCloud
```

### Weaknesses

| Issue | Severity | Notes |
|---|---|---|
| Three outputs in one LLM call | Medium | Complex parsing; if model skips one part, downstream agents fail |
| DESIGN_BRIEF fields have no validation | Medium | If `primaryReference` is malformed, entire design chain breaks |
| Section minimum (5) and maximum (9) may be violated | Low | No enforcement mechanism |
| Plan format sections use human-readable formatting | Low | Robust for display but brittle if model reorganizes |
| SECTION_MENU is imported inline | Low | Any section added to SECTION_MENU automatically becomes available without route testing |

**PLANNER_SYSTEM Score: 8.5/10** — Best-structured prompt in the pipeline.

---

## ARCHITECTURE_SYSTEM

### Purpose and Structure

Produces a single JSON blueprint:

```json
{
  "projectType": "...",
  "pages": [...],
  "components": [...],
  "databaseTables": [...],
  "apis": [...],
  "authNeeded": false,
  "authProvider": "...",
  "dashboardNeeded": false,
  "entities": [...],
  "relationships": [...],
  "navigation": [...],
  "features": [...],
  "techStack": { ... },
  "description": "..."
}
```

### Strengths

**Detection rules are comprehensive:**
```
- Simple landing page: authNeeded false, pages ["Landing"], databaseTables [], apis [], entities []
- SaaS / Dashboard App: authNeeded true, authProvider "JWT", dashboardNeeded true
- CRM: pages [Landing, Dashboard, Customers, Deals, Settings], apis [auth, customers, deals]
- E-commerce: pages [.../Products/Cart/Checkout/Orders], databaseTables [users, products, orders, cart_items]
```

**Tech stack is locked:**
```json
"techStack": {
  "frontend": "React + TypeScript + Tailwind CSS",
  "routing": "React Router v6",
  "ui": "shadcn/ui + Lucide Icons",
  "backend": "Express.js + TypeScript",
  "database": "PostgreSQL + Prisma"
}
```

Hardcoding the tech stack prevents model hallucination of unsupported frameworks (Vue, Angular, Next.js).

**Constraint alignment rules:**
```
- Every api must correspond to a databaseTable. Every entity must correspond to a table.
- relationships MUST be inferred from pages + tables.
- navigation MUST match the pages array entries that are primary nav destinations.
```

Cross-field consistency rules are rare in LLM prompts — this is excellent prompt engineering.

### Weaknesses

| Issue | Severity | Notes |
|---|---|---|
| JSON-only output with no fallback | Medium | If model wraps in markdown, JSON.parse fails |
| `authProvider` accepts "JWT|Supabase|Clerk" but Supabase/Clerk aren't configured | Medium | Dead code path — only JWT is implemented |
| No component naming convention | Low | "Navbar" vs "navbar" inconsistency possible |
| `features` field is free-form — duplicates `components` | Low | Unclear separation; used differently downstream |
| No pagination handling | Low | Large tables (1000+ rows) not considered |

**ARCHITECTURE_SYSTEM Score: 8/10** — Precise and well-constrained. Auth provider field is stale.

---

## DESIGN_SYSTEM

Reviewed in detail in `designAgentAudit.md`. Summary:

### Strengths
- 7 reference sites, 17 tokens each, all accurate to actual sites
- Dominance rules prevent DNA blending
- Anti-patterns blocked ("NEVER default to purple gradients")

### Weaknesses
- Cursor and Perplexity not in DOMINANCE RULES
- Industry defaults use plain language (no hex codes)
- Duplicate flat/nested color token schema

**DESIGN_SYSTEM Score: 8/10**

---

## CODEFIX_SYSTEM

### Purpose and Structure

Minimal repair prompt (~900 chars). Fixes 7 specific preview-breaking patterns.

### Strengths

**Targeted fixes prevent known failures:**
- Import/export removal prevents module system conflicts
- TypeScript removal prevents JSX parser errors  
- Fragment removal prevents React rendering issues
- `React.useState` namespacing prevents undefined hook errors
- Style-to-Tailwind conversion enforces the CSS constraint
- Lucide icon preservation prevents `undefined is not a function`

### Weaknesses

| Issue | Severity | Notes |
|---|---|---|
| Shadcn components not mentioned | High | May remove or corrupt Button/Card/Input JSX |
| No heading structure directive | Medium | Never adds h2/h3 — accessibility gap |
| No focus ring repair | Medium | Never adds focus-visible styles |
| "Do NOT add or remove sections" is passive | Low | Agent may add sections in response to syntax errors |
| No aria attribute repair | Medium | Accessibility invisible to CODEFIX |
| "Fix any syntax errors" is imprecise | Low | What counts as a syntax error is ambiguous |
| No output length limit | Low | Could produce truncated output with large files |

**CODEFIX_SYSTEM Score: 6/10** — Fixes the right things for preview safety, but misses accessibility and shadcn preservation.

---

## BACKEND_SYSTEM

### Strengths

**File delimiter convention is strong:**
```
// === FILE: src/api/routeName.ts ===
```
This exact pattern drives `generateProjectFiles()` parsing.

**CRUD completeness is specified:**
- GET /, POST /, GET /:id, PUT /:id, DELETE /:id
- Async handlers with try/catch
- Status codes 200, 201, 400, 404, 500

**Type safety rule:**
```
TypeScript strict mode: all types explicit
```

### Weaknesses

| Issue | Severity | Notes |
|---|---|---|
| "comment where DB calls will go" not "implement" | Medium | Generates stub code — not production ready |
| Zod schema naming (CreateSchema, UpdateSchema) is generic | Low | May collide across route files |
| Express app in single server.ts — no middleware pattern | Low | No logging, rate limiting, or security headers mentioned |
| No authentication middleware integration | Medium | Routes are unprotected — contradicts ARCHITECTURE authNeeded:true |

**BACKEND_SYSTEM Score: 7/10** — Correct pattern; generates stub code rather than production code.

---

## DATABASE_SYSTEM

### Strengths

**Dual-output is well-specified:**
- SQL DDL: UUID PKs, foreign keys with CASCADE, indexes on FKs
- Prisma: datasource, generator, models with @relation

**Naming convention rules:**
```
camelCase field names in Prisma, snake_case column names in SQL
```

**Completeness rules:**
```
All relationships must have both sides defined in Prisma models
Write complete schemas — do not truncate
```

### Weaknesses

| Issue | Severity | Notes |
|---|---|---|
| No enum type guidance | Low | Status fields (active/inactive/pending) may use string vs enum |
| No index guidance beyond FK columns | Low | Full-text search columns not indexed |
| `updated_at` trigger not specified | Medium | `@updatedAt` in Prisma handles this, but SQL DDL lacks trigger |
| No soft delete pattern | Low | Hard DELETE may not match product requirements |

**DATABASE_SYSTEM Score: 8/10** — Complete, consistent, well-specified.

---

## buildCodeSystem()

Reviewed in detail in `designSystemAudit.md`. Summary:

### Strengths
- Full design DNA injection (colors, typography, spacing, animation, layout)
- Structure variation engine with deterministic seed
- SAFE CODING RULES (V5.2) prevent common runtime crashes
- Registry component selection injection
- SVG illustration guidance
- Multi-file output format with FILE delimiter convention

### Weaknesses
- `flat-ui` (default layoutStyle) injects no layout rules
- Accessibility mentioned 0 times
- shadcn preservation not cross-referenced with CODEFIX
- `secondary` color token unused downstream
- Hero heading size classes only (3 values) — no body text scale

**buildCodeSystem() Score: 8.5/10** — Most sophisticated prompt in the system. Layout gap for default style is the main issue.

---

## Cross-Prompt Consistency

| Convention | Consistent? | Notes |
|---|---|---|
| FILE delimiter `// === FILE: path ===` | ✅ | Used in buildCodeSystem, BACKEND, DATABASE |
| JSON-only output (`no markdown`) | ✅ | ARCHITECTURE, DESIGN both specify this |
| No import/export in frontend | ✅ | buildCodeSystem + CODEFIX enforce this |
| "Respond ONLY in this format" | ✅ | Architecture and Planner |
| Numeric HTTP status codes | ✅ | BACKEND only (frontend has none) |
| SITE_NAME placeholder | ✅ | Used in navbars; not documented in buildCodeSystem |

---

## Prompt Efficiency Analysis

| Prompt | Tokens (est.) | Output Tokens (est.) | Efficiency |
|---|---|---|---|
| PLANNER_SYSTEM | ~850 | ~600 | Good |
| ARCHITECTURE_SYSTEM | ~700 | ~300 | Excellent |
| DESIGN_SYSTEM | ~800 | ~150 | Excellent |
| CODEFIX_SYSTEM | ~225 | ~2000 | Very good |
| buildCodeSystem() | ~1,200 | ~3,500 | Good |
| BACKEND_SYSTEM | ~300 | ~1,500 | Very good |
| DATABASE_SYSTEM | ~350 | ~500 | Very good |
| **Total per full build** | **~4,425** | **~8,550** | |

Estimated at ~35,000 tokens/build (V7.0.5 measurement) = ~22,025 tokens overhead beyond these estimates is content tokens (registry catalogue, component templates, user prompt, pipeline context).

---

## Summary Scorecard

| Prompt | Score | Priority Issues |
|---|---|---|
| PLANNER_SYSTEM | 8.5/10 | Three-output complexity; no DESIGN_BRIEF validation |
| ARCHITECTURE_SYSTEM | 8.0/10 | Stale auth providers; stub not production code |
| DESIGN_SYSTEM | 8.0/10 | Cursor/Perplexity missing from dominance rules |
| CODEFIX_SYSTEM | 6.0/10 | Shadcn not mentioned; no accessibility fixes |
| BACKEND_SYSTEM | 7.0/10 | Stub code; unprotected routes |
| DATABASE_SYSTEM | 8.0/10 | No soft delete; no trigger for updated_at |
| buildCodeSystem() | 8.5/10 | No flat-ui layout rules; zero accessibility |
| **OVERALL** | **7.7/10** | Strong core; CODEFIX and accessibility are the main gaps |

---

## Priority Fixes

1. **CODEFIX_SYSTEM: Add shadcn preservation** — "Keep all shadcn JSX elements (Button, Card, Input, Badge, Avatar) — they are globals"
2. **CODEFIX_SYSTEM: Add focus ring repair** — "Add focus-visible:ring-2 to all interactive elements missing it"
3. **buildCodeSystem(): Add flat-ui layout rules** — explicit section layout direction for the default style
4. **buildCodeSystem(): Add accessibility section** — heading hierarchy, aria-label, focus rings, alt text
5. **ARCHITECTURE_SYSTEM: Remove Supabase/Clerk** from `authProvider` options or implement them
6. **DESIGN_SYSTEM: Add hex codes** to industry defaults for consistency with reference site tokens
