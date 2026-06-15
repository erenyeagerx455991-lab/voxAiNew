import { BRAND_COLOR, BRAND_LABEL, getActiveBrands, buildCompositionSummary } from '../lib/dnaMixer';
import type { DNAComposition } from '../lib/dnaMixer';
import type { SectionOwnership } from '../lib/componentOwnership';
import type { ThemeTokens, MotionProfile } from '../theme/themeBuilder';

interface DNACompositionPanelProps {
  dna: DNAComposition;
  ownership: SectionOwnership;
  theme: ThemeTokens;
  motion: MotionProfile;
  compact?: boolean;
}

const SECTION_DISPLAY: Record<string, string> = {
  hero: 'Hero', navbar: 'Navigation', features: 'Features', pricing: 'Pricing',
  testimonials: 'Testimonials', trust: 'Trust', cta: 'CTA', footer: 'Footer',
  dashboard: 'Dashboard', bento: 'Bento Grid', animations: 'Animations',
  typography: 'Typography', changelog: 'Changelog',
};

const MOTION_BADGE: Record<string, { label: string; color: string }> = {
  minimal:  { label: 'Minimal Motion', color: '#4B5563' },
  standard: { label: 'Standard Motion', color: '#7C3AED' },
  advanced: { label: 'Advanced Motion', color: '#FF3D57' },
};

export default function DNACompositionPanel({ dna, ownership, theme, motion, compact = false }: DNACompositionPanelProps) {
  const active = getActiveBrands(dna);
  if (active.length === 0) return null;

  const ownershipEntries = Object.entries(ownership).filter(([k]) => SECTION_DISPLAY[k]);
  const motionBadge = MOTION_BADGE[motion.level];

  return (
    <div className="bg-gray-900/80 border border-gray-700/40 rounded-xl p-4 space-y-4 text-sm backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-[11px] font-bold text-violet-400 uppercase tracking-widest">
            DNA Fusion Mode
          </span>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: motionBadge.color + '22', color: motionBadge.color }}
        >
          {motionBadge.label}
        </span>
      </div>

      {/* Composition Bars */}
      <div className="space-y-2">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Composition</p>
        {active.map(({ brand, pct }) => (
          <div key={brand} className="space-y-0.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: BRAND_COLOR[brand] }}
                />
                <span className="text-[12px] font-semibold text-gray-200">{BRAND_LABEL[brand]}</span>
              </div>
              <span className="text-[11px] font-bold" style={{ color: BRAND_COLOR[brand] }}>
                {pct}%
              </span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: BRAND_COLOR[brand] }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Theme Swatches */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Fused Theme</p>
        <div className="flex gap-1.5 items-center">
          {[
            { label: 'Primary',  color: theme.primary  },
            { label: 'Surface',  color: theme.surface  },
            { label: 'Accent',   color: theme.accent   },
            { label: 'Card',     color: theme.card     },
          ].map(({ label, color }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <div
                className="w-6 h-6 rounded-md border border-gray-700/50"
                style={{ background: color }}
                title={`${label}: ${color}`}
              />
              <span className="text-[9px] text-gray-600">{label}</span>
            </div>
          ))}
          <div className="ml-1 text-[10px] text-gray-500">
            <div>by <span style={{ color: BRAND_COLOR[theme.primaryBrand] }}>{BRAND_LABEL[theme.primaryBrand]}</span></div>
            <div>on <span style={{ color: BRAND_COLOR[theme.surfaceBrand] }}>{BRAND_LABEL[theme.surfaceBrand]}</span></div>
          </div>
        </div>
      </div>

      {/* Section Ownership */}
      {!compact && ownershipEntries.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Section Ownership</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {ownershipEntries.map(([section, brand]) => (
              <div key={section} className="flex items-center justify-between gap-1">
                <span className="text-[11px] text-gray-400">{SECTION_DISPLAY[section] ?? section}</span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: BRAND_COLOR[brand as keyof typeof BRAND_COLOR] }}
                >
                  {BRAND_LABEL[brand as keyof typeof BRAND_LABEL] ?? brand}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary tagline */}
      <p className="text-[10px] text-gray-600 italic border-t border-gray-800 pt-2">
        "{buildCompositionSummary(dna)}"
      </p>
    </div>
  );
}
