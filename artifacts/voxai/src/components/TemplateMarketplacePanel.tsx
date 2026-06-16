import { useState } from 'react';
import { Zap, Search, CheckCircle, ExternalLink, ChevronRight, Database, Globe, Code2, Shield, Star } from 'lucide-react';
import { TEMPLATE_LIBRARY, type ProjectTemplate, type TemplateHealth, computeTemplateHealth } from '../services/templateMarketplace';

interface Props {
  selectedTemplate: ProjectTemplate | null;
  onSelectTemplate: (template: ProjectTemplate) => void;
  onClearTemplate: () => void;
  isBuilding?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  SaaS: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  Business: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Education: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Commerce: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Marketing: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  Personal: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  Analytics: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Productivity: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  Internal: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  Social: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
};

const SCORE_COLOR = (s: number) => s >= 90 ? 'text-emerald-400' : s >= 75 ? 'text-yellow-400' : 'text-red-400';

function HealthBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-gray-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-bold text-gray-300 w-6 text-right">{score}</span>
    </div>
  );
}

function TemplatePreview({ template, onSelect, isSelected }: { template: ProjectTemplate; onSelect: () => void; isSelected: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const health: TemplateHealth = computeTemplateHealth(template);
  const catColor = CATEGORY_COLORS[template.category] ?? 'text-gray-400 bg-gray-500/10 border-gray-500/20';

  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${isSelected ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/8 bg-white/3 hover:border-white/12 hover:bg-white/5'}`}>
      {/* Card Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start gap-2.5">
          <div className="text-xl shrink-0 leading-none pt-0.5">{template.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className="text-[13px] font-semibold text-gray-100">{template.name}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${catColor}`}>{template.category}</span>
              {isSelected && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">✓ Active</span>}
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{template.description}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className={`text-[15px] font-bold ${SCORE_COLOR(template.qualityScore)}`}>{template.qualityScore}</div>
            <div className="text-[8px] text-gray-600">quality</div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-1 mt-2">
          {[
            { icon: <Globe size={9} />, val: template.pages.length, label: 'pages' },
            { icon: <Code2 size={9} />, val: template.apis.length, label: 'APIs' },
            { icon: <Database size={9} />, val: template.databaseTables.length, label: 'tables' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1 bg-white/4 rounded px-1.5 py-1">
              <span className="text-gray-500">{s.icon}</span>
              <span className="text-[11px] font-bold text-gray-200">{s.val}</span>
              <span className="text-[9px] text-gray-600">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded architecture preview */}
      {expanded && (
        <div className="border-t border-white/6 px-3 py-2 bg-white/2">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Pages</p>
              <div className="space-y-0.5">
                {template.pages.slice(0, 6).map(p => (
                  <div key={p} className="flex items-center gap-1">
                    <ChevronRight size={8} className="text-gray-600 shrink-0" />
                    <span className="text-[10px] text-gray-400">{p}</span>
                  </div>
                ))}
                {template.pages.length > 6 && <span className="text-[9px] text-gray-600">+{template.pages.length - 6} more</span>}
              </div>
            </div>
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Database</p>
              <div className="space-y-0.5">
                {template.databaseTables.slice(0, 6).map(t => (
                  <div key={t} className="flex items-center gap-1">
                    <Database size={7} className="text-gray-600 shrink-0" />
                    <span className="text-[10px] text-gray-400 font-mono">{t}</span>
                  </div>
                ))}
                {template.databaseTables.length > 6 && <span className="text-[9px] text-gray-600">+{template.databaseTables.length - 6} more</span>}
              </div>
            </div>
          </div>

          <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Features</p>
          <div className="flex flex-wrap gap-1">
            {template.features.slice(0, 8).map(f => (
              <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/6">{f}</span>
            ))}
          </div>

          <div className="mt-2 space-y-1">
            <HealthBar score={health.architectureCompleteness} label="Architecture" />
            <HealthBar score={health.apiCoverage} label="API Coverage" />
            <HealthBar score={health.databaseCoverage} label="DB Coverage" />
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="px-3 pb-3 flex items-center gap-1.5 mt-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-0.5"
        >
          <ExternalLink size={9} />
          {expanded ? 'Less' : 'Preview'}
        </button>
        <div className="flex-1" />
        {isSelected ? (
          <button
            onClick={onSelect}
            className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium"
          >
            ✓ Selected
          </button>
        ) : (
          <button
            onClick={onSelect}
            className="text-[10px] px-2.5 py-1 rounded-lg bg-white/8 text-gray-300 border border-white/10 hover:bg-indigo-500/15 hover:text-indigo-300 hover:border-indigo-500/30 transition-colors font-medium"
          >
            Use Template
          </button>
        )}
      </div>
    </div>
  );
}

const CATEGORIES = ['All', ...Array.from(new Set(TEMPLATE_LIBRARY.map(t => t.category)))];

export default function TemplateMarketplacePanel({ selectedTemplate, onSelectTemplate, onClearTemplate, isBuilding }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = TEMPLATE_LIBRARY.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.includes(search.toLowerCase())) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || t.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/6 shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap size={11} className="text-amber-400" />
          <span className="text-[11px] font-semibold text-gray-300">Template Marketplace</span>
          <span className="text-[9px] text-gray-600">V5.6</span>
          <span className="ml-auto text-[9px] text-gray-500">{TEMPLATE_LIBRARY.length} templates</span>
        </div>

        {/* Selected template banner */}
        {selectedTemplate && (
          <div className="mb-2 rounded-lg border border-indigo-500/30 bg-indigo-500/8 px-2.5 py-2 flex items-center gap-2">
            <span className="text-base leading-none">{selectedTemplate.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-indigo-300">{selectedTemplate.name} selected</p>
              <p className="text-[9px] text-gray-500">Next build uses this architecture</p>
            </div>
            <button onClick={onClearTemplate} className="text-[9px] text-gray-600 hover:text-red-400 transition-colors shrink-0">✕ Clear</button>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-2">
          <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            disabled={isBuilding}
            className="w-full bg-white/5 border border-white/8 rounded-lg pl-6 pr-3 py-1.5 text-[11px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-white/16 disabled:opacity-50"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 text-[9px] font-medium px-2 py-0.5 rounded-full border transition-colors ${category === cat ? 'bg-white/10 border-white/20 text-gray-200' : 'border-white/6 text-gray-500 hover:text-gray-300 hover:border-white/12'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="flex-1 overflow-auto px-3 py-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-600 text-[12px]">No templates match your search.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => (
              <TemplatePreview
                key={t.id}
                template={t}
                isSelected={selectedTemplate?.id === t.id}
                onSelect={() => selectedTemplate?.id === t.id ? onClearTemplate() : onSelectTemplate(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-white/6 shrink-0">
        <div className="flex items-center gap-1.5 text-[9px] text-gray-600">
          <Star size={9} className="text-amber-500/60" />
          {selectedTemplate
            ? <span>Template locked in — send a prompt to build from <span className="text-gray-400">{selectedTemplate.name}</span> architecture</span>
            : <span>Select a template to preload architecture before generation, or leave empty for AI to decide</span>
          }
        </div>
      </div>
    </div>
  );
}
