// ── V7.2.1 Lighthouse Capture — Phase 4 ──────────────────────────────────────
// Captures Lighthouse scores for a given URL.
// Requires Chrome/Chromium and the `lighthouse` npm package.
// Falls back gracefully when unavailable (benchmark results stored without LH scores).

import { createRequire } from 'module';
import { type LighthouseScores } from './benchmarkSchema.js';
import { structuredLogger } from '../lib/structuredLogger.js';

const logger = structuredLogger.child({ module: 'lighthouseCapture' });

export interface LighthouseCaptureResult {
  url:     string;
  scores:  LighthouseScores;
  error?:  string;
}

/** Run Lighthouse against `url` and return 4 category scores (0–100). */
export async function captureLighthouse(url: string): Promise<LighthouseCaptureResult> {
  let lighthouse: ((url: string, opts: unknown, cfg?: unknown) => Promise<{ lhr: { categories: Record<string, { score: number | null }> } }>) | null = null;
  let chromeLauncher: { launch: (opts: unknown) => Promise<{ port: number; kill: () => Promise<void> }> } | null = null;

  try {
    const _require = createRequire(import.meta.url);
    lighthouse     = _require('lighthouse');
    chromeLauncher = _require('chrome-launcher');
  } catch {
    logger.warn({ url }, 'lighthouse/chrome-launcher not installed — skipping LH capture');
    return {
      url,
      scores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0, captured: false },
      error: 'lighthouse package not installed',
    };
  }

  let chrome: { port: number; kill: () => Promise<void> } | null = null;

  try {
    chrome = await chromeLauncher!.launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'] });

    const result = await lighthouse!(url, {
      logLevel:  'error',
      output:    'json',
      port:      chrome.port,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });

    const cats = result.lhr.categories;
    const s    = (key: string) => Math.round((cats[key]?.score ?? 0) * 100);

    const scores: LighthouseScores = {
      performance:   s('performance'),
      accessibility: s('accessibility'),
      bestPractices: s('best-practices'),
      seo:           s('seo'),
      captured:      true,
    };

    logger.info({ url, scores }, 'Lighthouse capture complete');
    return { url, scores };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ url, err: msg }, 'Lighthouse capture failed');
    return {
      url,
      scores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0, captured: false },
      error: msg,
    };
  } finally {
    if (chrome) await chrome.kill().catch(() => undefined);
  }
}

/** Batch capture Lighthouse for multiple URLs (sequential to avoid Chrome port collisions). */
export async function captureLighthouseBatch(
  urls: string[],
): Promise<LighthouseCaptureResult[]> {
  const results: LighthouseCaptureResult[] = [];
  for (const url of urls) {
    results.push(await captureLighthouse(url));
  }
  return results;
}
