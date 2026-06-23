// ── V7.2.1 Benchmark Runner — Phase 2 ────────────────────────────────────────
// Runs VoxAI builds for all 20 benchmark prompts, captures HTML/TSX outputs,
// runs the evaluator, and stores results via recordBenchmarkResult().
//
// Usage (standalone script):
//   pnpm --filter @workspace/api-server exec tsx src/benchmarks/benchmarkRunner.ts
//
// Competitor results (Lovable, Bolt, v0) must be stored manually:
//   1. Generate HTML from the competitor tool using the same prompt
//   2. Save to: benchmarks/results/{provider}/{promptId}.html
//   3. Run: pnpm --filter @workspace/api-server exec tsx src/benchmarks/benchmarkRunner.ts --import-competitors

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { evaluateDesign, type EvaluationInput } from '../agents/designEvaluator/evaluator.js';
import { recordBenchmarkResult } from './benchmarkMetrics.js';
import { captureLighthouse } from './lighthouseCapture.js';
import {
  type BenchmarkResult,
  type Provider,
  type BenchmarkCategory,
} from './benchmarkSchema.js';
import { structuredLogger } from '../lib/structuredLogger.js';

const logger = structuredLogger.child({ module: 'benchmarkRunner' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
const RESULTS_DIR    = path.join(WORKSPACE_ROOT, 'benchmarks', 'results');
const PROMPTS_FILE   = path.join(WORKSPACE_ROOT, 'benchmarks', 'prompts', 'benchmark-dataset.json');

// ── Types ─────────────────────────────────────────────────────────────────────

interface BenchmarkPrompt {
  id:               string;
  category:         BenchmarkCategory;
  title:            string;
  prompt:           string;
  expectedSections: string[];
  minimumSections:  number;
}

interface BenchmarkDataset {
  prompts: BenchmarkPrompt[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadPrompts(): BenchmarkPrompt[] {
  const raw = fs.readFileSync(PROMPTS_FILE, 'utf-8');
  const dataset = JSON.parse(raw) as BenchmarkDataset;
  return dataset.prompts;
}

function resultPath(provider: Provider, promptId: string): string {
  return path.join(RESULTS_DIR, provider, `${promptId}.json`);
}

function saveResult(result: BenchmarkResult): void {
  const dir = path.join(RESULTS_DIR, result.provider);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = resultPath(result.provider, result.promptId);
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
  recordBenchmarkResult(result);
  logger.info({ provider: result.provider, promptId: result.promptId, overall: result.evaluatorScores.overall }, 'Benchmark result saved');
}

function loadStoredResult(provider: Provider, promptId: string): BenchmarkResult | null {
  try {
    const filePath = resultPath(provider, promptId);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as BenchmarkResult;
  } catch {
    return null;
  }
}

// ── VoxAI benchmark run ───────────────────────────────────────────────────────

export async function runVoxAIBenchmark(
  prompt: BenchmarkPrompt,
  apiBaseUrl = 'http://localhost:3001',
): Promise<BenchmarkResult> {
  logger.info({ promptId: prompt.id }, 'Starting VoxAI benchmark build');
  const t0 = Date.now();

  const buildUrl = `${apiBaseUrl}/api/build`;
  let html = '';
  let repairRequired = false;
  let repairPasses = 0;

  try {
    const response = await fetch(buildUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt.prompt }),
    });

    if (!response.ok) throw new Error(`Build API returned ${response.status}`);

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6)) as Record<string, unknown>;
            if (ev.type === 'file_update' && typeof ev.content === 'string') {
              if ((ev.filename as string)?.endsWith('.html') ||
                  (ev.filename as string)?.endsWith('.tsx')) {
                html = ev.content as string;
              }
            }
            if (ev.type === 'repair_pass') repairRequired = true;
            if (typeof ev.repairPass === 'number') repairPasses = ev.repairPass as number;
          } catch { /* non-JSON SSE line */ }
        }
      }
    }
  } catch (err) {
    logger.error({ promptId: prompt.id, err: String(err) }, 'VoxAI build failed');
  }

  const buildDurationMs = Date.now() - t0;
  const evalInput: EvaluationInput = { code: html, sectionOrder: prompt.expectedSections, designDNA: {} as never };
  const evalResult = html ? evaluateDesign(evalInput) : null;

  const lhCapture = await captureLighthouse(`data:text/html,${encodeURIComponent(html)}`);

  const result: BenchmarkResult = {
    provider:    'voxai',
    promptId:    prompt.id,
    category:    prompt.category,
    timestamp:   Date.now(),
    evaluatorScores: {
      hero:          evalResult?.heroScore          ?? 0,
      layout:        evalResult?.layoutScore        ?? 0,
      cta:           evalResult?.ctaScore           ?? 0,
      accessibility: evalResult?.accessibilityScore ?? 0,
      shadcn:        evalResult?.shadcnScore        ?? 0,
      consistency:   evalResult?.consistencyScore   ?? 0,
      overall:       evalResult?.overallScore       ?? 0,
    },
    lighthouseScores: lhCapture.scores,
    repairPasses,
    repairRequired,
    buildDurationMs,
    html,
    metadata: { promptTitle: prompt.title, isBaselineData: false },
  };

  saveResult(result);
  return result;
}

// ── Competitor result import ──────────────────────────────────────────────────

export async function importCompetitorResult(
  provider: Provider,
  promptId: string,
  category: BenchmarkCategory,
  html: string,
  lighthouseUrl?: string,
): Promise<BenchmarkResult> {
  const evalInput: EvaluationInput = { code: html, sectionOrder: [], designDNA: {} as never };
  const evalResult = evaluateDesign(evalInput);
  const lhScores = lighthouseUrl
    ? (await captureLighthouse(lighthouseUrl)).scores
    : { performance: 0, accessibility: 0, bestPractices: 0, seo: 0, captured: false };

  const result: BenchmarkResult = {
    provider,
    promptId,
    category,
    timestamp:   Date.now(),
    evaluatorScores: {
      hero:          evalResult.heroScore,
      layout:        evalResult.layoutScore,
      cta:           evalResult.ctaScore,
      accessibility: evalResult.accessibilityScore,
      shadcn:        evalResult.shadcnScore,
      consistency:   evalResult.consistencyScore,
      overall:       evalResult.overallScore,
    },
    lighthouseScores: lhScores,
    repairPasses:    0,
    repairRequired:  false,
    buildDurationMs: 0,
    html,
    metadata: { isBaselineData: false },
  };

  saveResult(result);
  return result;
}

// ── Full benchmark run (VoxAI only) ───────────────────────────────────────────

export async function runFullBenchmark(options: {
  apiBaseUrl?: string;
  promptIds?:  string[];
  skipExisting?: boolean;
}): Promise<BenchmarkResult[]> {
  const prompts = loadPrompts().filter(
    p => !options.promptIds || options.promptIds.includes(p.id),
  );

  const results: BenchmarkResult[] = [];

  for (const prompt of prompts) {
    if (options.skipExisting) {
      const existing = loadStoredResult('voxai', prompt.id);
      if (existing) {
        logger.info({ promptId: prompt.id }, 'Skipping (already captured)');
        results.push(existing);
        continue;
      }
    }
    const result = await runVoxAIBenchmark(prompt, options.apiBaseUrl);
    results.push(result);
  }

  return results;
}

// ── Load all stored results from disk ─────────────────────────────────────────

export function loadAllStoredResults(): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];
  const providers: Provider[] = ['voxai', 'lovable', 'bolt', 'v0'];
  for (const provider of providers) {
    const dir = path.join(RESULTS_DIR, provider);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const raw  = fs.readFileSync(path.join(dir, file), 'utf-8');
        const data = JSON.parse(raw) as BenchmarkResult;
        results.push(data);
      } catch { /* skip corrupted */ }
    }
  }
  return results;
}
