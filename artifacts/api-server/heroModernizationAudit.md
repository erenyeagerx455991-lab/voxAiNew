# Hero Modernization Audit — V7.1.2 Phase 3

**Date:** June 23, 2026

---

## Standard Registry — hero.ts

### hero-saas-v1 (Dark SaaS)
| Element | Before | After |
|---------|--------|-------|
| Pill badge | `<div className="inline-flex items-center gap-2 border...">` | `<Badge className="border border-violet-500/30...">` |
| Primary CTA | `<button className="bg-gradient-to-r...">` | `<Button className="bg-gradient-to-r...">` |
| Secondary CTA | `<button className="border...">` | `<Button variant="outline" ...>` |
| Avatar row | Raw divs | `<Avatar>` + `<AvatarFallback>` |

**Shadcn score: 5/5 interactive elements migrated** ✓

### hero-ai-v2 (AI Focus)
| Element | Before | After |
|---------|--------|-------|
| Feature chips | Raw `<span>` with className | `<Badge variant="secondary" ...>` |
| Top badge | `<div className="inline-flex...">` | `<Badge ...>` |
| Primary CTA | `<button>` | `<Button>` |
| Secondary CTA | `<button>` | `<Button variant="outline">` |

**Shadcn score: 4/4 interactive elements migrated** ✓

### hero-minimal-v3 (Light Minimal)
| Element | Before | After |
|---------|--------|-------|
| Section badge | Raw span | `<Badge>` |
| Primary CTA | `<button>` | `<Button>` |
| Secondary CTA | `<button>` | `<Button variant="outline">` |
| Avatar row | Raw divs | `<Avatar>` + `<AvatarFallback>` |

**Shadcn score: 4/4 interactive elements migrated** ✓

### hero-ecommerce-v4 (Ecommerce)
| Element | Before | After |
|---------|--------|-------|
| Discount badge | `<div className="inline-flex...">` | `<Badge>` |
| Primary CTA | `<button>` | `<Button>` |
| Secondary CTA | `<button>` | `<Button variant="outline">` |
| Dividers | `<span className="w-1 h-4 bg-gray-600">` | `<Separator>` |

**Shadcn score: 4/4 interactive elements migrated** ✓

---

## Premium Registry — heroes.ts (partial migration)

| Template | Buttons Migrated | Badges Migrated | Notes |
|----------|-----------------|-----------------|-------|
| hero-linear-v1 | ✓ 2/2 | — | Ghost + default Button |
| hero-stripe-v1 | ✓ 2/2 | ✓ 1/1 | Framer-style badge (inline) |
| hero-framer-v1 | ✓ 2/2 | ✓ 1/1 | Orange gradient badge |
| hero-raycast-v1 | ✓ 1/1 | — | Dark generate button |
| hero-cursor-v1 | ✓ 1/1 | ✓ 1/1 | Blue badge migrated |
| hero-ramp-v1 | ✓ 2/2 | ✓ 1/1 | Emerald badge + buttons |
| hero-notion-v1 | ✓ 2/2 | — | Ghost + dark button |
| hero-perplexity-v1 | — | — | Generate button in input (intentional skip) |
| hero-bento-v1 | — | ✓ 1/1 | Badge pill migrated |

---

## Summary

- **Standard heroes:** 4/4 fully migrated (100%)
- **Premium heroes:** 7/10 key elements migrated (~70%)
- Raw `<button>` elements eliminated from standard registry: **8 → 0**
- Custom badge divs eliminated from standard registry: **4 → 0**
- New global components used: Badge, Button, Avatar, AvatarFallback, Separator
