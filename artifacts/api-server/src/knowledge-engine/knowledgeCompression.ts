// ── V9.4 Knowledge Engine — Knowledge Compression ─────────────────────────────
//
// Trims/summarizes a KnowledgeBundle before agent consumption to reduce
// token usage. Reuses the same none/light/aggressive policy naming as
// model-orchestrator/contextCompressionEngine.ts for consistency.
import type { KnowledgeBundle, CompressedKnowledgeBundle, CompressionPolicy } from './types.js';

const RETAIN_RATIOS: Record<CompressionPolicy, number> = {
  none:       1,
  light:      0.6,
  aggressive: 0.3,
};

function estimateLength(bundle: KnowledgeBundle): number {
  const recordsLen = bundle.records.reduce((sum, r) => sum + r.title.length + r.summary.length, 0);
  const nodesLen = bundle.relatedNodes.reduce((sum, n) => sum + n.label.length, 0);
  const recsLen = bundle.recommendations.reduce((sum, r) => sum + r.title.length + r.reason.length, 0);
  return recordsLen + nodesLen + recsLen;
}

export function compressKnowledgeBundle(bundle: KnowledgeBundle, policy: CompressionPolicy = 'light'): CompressedKnowledgeBundle {
  const originalLength = estimateLength(bundle);
  const retain = RETAIN_RATIOS[policy];

  const topCount = Math.max(1, Math.round(bundle.records.length * retain));
  const topRecords = [...bundle.records]
    .sort((a, b) => b.quality - a.quality)
    .slice(0, topCount)
    .map(r => policy === 'none' ? r : { ...r, summary: r.summary.slice(0, Math.round(r.summary.length * retain)) });

  const recCount = Math.max(1, Math.round(bundle.recommendations.length * retain));
  const recommendations = bundle.recommendations.slice(0, recCount);

  const compressedBundle: KnowledgeBundle = { ...bundle, records: topRecords, recommendations };
  const compressedLength = estimateLength(compressedBundle);

  return {
    target:           bundle.target,
    buildId:          bundle.buildId,
    recordCount:      topRecords.length,
    topRecords,
    recommendations,
    originalLength,
    compressedLength,
    compressionRatio: originalLength > 0 ? parseFloat((1 - compressedLength / originalLength).toFixed(3)) : 0,
    strategy:         policy,
  };
}
