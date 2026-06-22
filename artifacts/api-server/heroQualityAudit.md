# V7.1.0 — Hero Quality Audit

## Methodology
Static analysis of all hero variant templates in registry.ts and section-templates.ts/diversity-templates.ts. Evidence source: actual standaloneCode in each template.

## Hero Inventory (9 variants)

| ID | Name | Used For |
|---|---|---|
| hero-saas-v1 | Hero SaaS | SaaS, AI, Fintech, Generic |
| hero-restaurant-v1 | Hero Restaurant | Restaurant |
| hero-editorial-v1 | Hero Editorial | Agency, Portfolio |
| hero-dashboard-v1 | Hero Dashboard | SaaS, AI, Fintech |
| hero-bento-v1 | Hero Bento Grid | SaaS, AI, Agency |
| hero-story-v1 | Hero Narrative Story | Agency, Portfolio |
| hero-ai-v2 | Hero AI V2 | AI (diversity) |
| hero-centered-v1 | Hero Centered | Generic (diversity) |
| hero-asymmetric-v1 | Hero Asymmetric | Startup (diversity) |

## Per-Hero Quality Analysis

### hero-saas-v1 (V7.0.9 updated)
| Dimension | Score | Evidence |
|---|---|---|
| Visual hierarchy | 9/10 | H1 at text-5xl/text-7xl ✓, clear badge→H1→sub→CTA flow |
| Typography | 9/10 | 8pt spacing, no small body text, white→white/50 gradient H1 |
| CTA clarity | 9/10 | type="button" ✓, focus-visible ✓, white pill primary + bordered secondary |
| Layout balance | 9/10 | Centered layout, stats row at bottom, relative z-10 structure |
| Brand feel | 8/10 | DNA-neutral white glow (good); design agent fills accent color |
| **Avg** | **8.8/10** | |

**Remaining issues:**
- No `aria-label` on CTA buttons (just `type="button"`)
- Stat items could have `aria-label` for screen readers

### hero-restaurant-v1
| Dimension | Score | Evidence |
|---|---|---|
| Visual hierarchy | 8/10 | Large H1 + subtext + CTA pair |
| Typography | 7/10 | No explicit font-size found in section templates (depends on agent) |
| CTA clarity | 5/10 | No `type="button"`, no `focus-visible`, missing a11y |
| Layout balance | 8/10 | Standard centered dark with overlay structure |
| Brand feel | 8/10 | Warm amber palette, appropriate for category |
| **Avg** | **7.2/10** | |

**Issues:** Missing `type="button"`, `aria-label`, `focus-visible` on all buttons.

### hero-editorial-v1
| Dimension | Score | Evidence |
|---|---|---|
| Visual hierarchy | 9/10 | Large editorial headline, service tags, strong CTA |
| Typography | 8/10 | clamp() font-size (now whitelisted in CODEFIX) |
| CTA clarity | 5/10 | Missing `type="button"`, `focus-visible` |
| Layout balance | 9/10 | Full-screen split layout with services strip |
| Brand feel | 9/10 | Editorial feel appropriate for agency/portfolio |
| **Avg** | **8.0/10** | |

### hero-dashboard-v1
| Dimension | Score | Evidence |
|---|---|---|
| Visual hierarchy | 8/10 | Nav + H1 + sub + CTA + dashboard preview frame |
| Typography | 8/10 | Large heading, white text on dark |
| CTA clarity | 5/10 | Missing `type="button"`, `focus-visible` |
| Layout balance | 9/10 | Product screenshot preview is strong visual anchor |
| Brand feel | 8/10 | KPI labels fixed to text-white/60 in V7.0.9 |
| **Avg** | **7.6/10** | |

### hero-bento-v1 (V7.0.9 updated)
| Dimension | Score | Evidence |
|---|---|---|
| Visual hierarchy | 8/10 | Mosaic layout is distinctive, headline card is large |
| Typography | 8/10 | H1 at text-5xl/6xl, body at text-white/65 ✓ |
| CTA clarity | 8/10 | type="button" ✓, focus-visible ✓ (V7.0.9) |
| Layout balance | 8/10 | Grid proportions work; mobile collapse is single column |
| Brand feel | 8/10 | Violet card remains but is a valid Framer-style choice |
| **Avg** | **8.0/10** | |

### hero-story-v1
| Dimension | Score | Evidence |
|---|---|---|
| Visual hierarchy | 7/10 | Narrative scroll layout with service tags |
| Typography | 7/10 | Service tags as pills on right, headline left |
| CTA clarity | 7/10 | `type="button"` and `focus-visible` present (V7.0.9) |
| Layout balance | 7/10 | Two-column left/right split — can feel unbalanced |
| Brand feel | 7/10 | Generic dark background, no DNA signal in template |
| **Avg** | **7.0/10** | |

### hero-ai-v2 (diversity template)
| Dimension | Score | Evidence |
|---|---|---|
| Visual hierarchy | 7/10 | Standard dark centered |
| Typography | 7/10 | Standard scale |
| CTA clarity | 4/10 | No type="button", no focus-visible |
| Layout balance | 7/10 | Standard |
| Brand feel | 7/10 | AI-appropriate aesthetic |
| **Avg** | **6.4/10** | |

### hero-centered-v1 (diversity template)
| Dimension | Score | Evidence |
|---|---|---|
| Visual hierarchy | 7/10 | Clean centered structure |
| Typography | 7/10 | Standard scale |
| CTA clarity | 4/10 | No type="button", no focus-visible |
| Layout balance | 7/10 | Balanced |
| Brand feel | 6/10 | Generic |
| **Avg** | **6.2/10** | |

### hero-asymmetric-v1 (diversity template)
| Dimension | Score | Evidence |
|---|---|---|
| Visual hierarchy | 8/10 | Asymmetric is more distinctive |
| Typography | 7/10 | Standard scale |
| CTA clarity | 4/10 | No type="button", no focus-visible |
| Layout balance | 8/10 | Good asymmetric tension |
| Brand feel | 7/10 | More premium than centered |
| **Avg** | **6.8/10** | |

## Hero Score Summary

| Hero | Avg Score | CTA a11y | Status |
|---|---|---|---|
| hero-saas-v1 | 8.8/10 | ✓ | Good |
| hero-bento-v1 | 8.0/10 | ✓ | Good |
| hero-editorial-v1 | 8.0/10 | ✗ | Needs CTA fix |
| hero-dashboard-v1 | 7.6/10 | ✗ | Needs CTA fix |
| hero-restaurant-v1 | 7.2/10 | ✗ | Needs CTA fix |
| hero-story-v1 | 7.0/10 | ✓ | Needs visual refresh |
| hero-asymmetric-v1 | 6.8/10 | ✗ | Needs full upgrade |
| hero-ai-v2 | 6.4/10 | ✗ | Needs full upgrade |
| hero-centered-v1 | 6.2/10 | ✗ | Needs full upgrade |

**Overall hero average: 7.56/10**

## Highest ROI Fix
Apply `type="button"` + `focus-visible:ring` to the 6 non-compliant heroes (hero-editorial-v1, hero-dashboard-v1, hero-restaurant-v1, hero-ai-v2, hero-centered-v1, hero-asymmetric-v1). One-line change per hero, +1.5 accessibility points each.

## Finding
The V7.0.9 buildCodeSystem() Rule 15 (type="button") and Rule 17 (focus-visible) are correctly injected into the codegen prompt — but the static templates still lack these attributes. The code generation agent is expected to add them per Rule 15/17, but template-level enforcement provides a stronger guarantee. V7.1.1 should apply the fixes directly to template code.
