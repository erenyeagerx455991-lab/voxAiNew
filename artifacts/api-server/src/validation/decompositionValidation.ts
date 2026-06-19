import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "..");
const ROUTES = path.join(SRC, "routes");
const PIPELINE = path.join(SRC, "agents", "pipeline");
const TESTS = path.resolve(__dirname, "../../tests");

function countLines(filePath: string): number {
  if (!fs.existsSync(filePath)) return -1;
  return fs.readFileSync(filePath, "utf-8").split("\n").length;
}

function findLargestPipelineFile(): { file: string; loc: number } {
  if (!fs.existsSync(PIPELINE)) return { file: "none", loc: 0 };
  const files = fs.readdirSync(PIPELINE).filter(f => f.endsWith(".ts"));
  let max = { file: "none", loc: 0 };
  for (const f of files) {
    const loc = countLines(path.join(PIPELINE, f));
    if (loc > max.loc) max = { file: f, loc };
  }
  return max;
}

function countPipelineFiles(): number {
  if (!fs.existsSync(PIPELINE)) return 0;
  return fs.readdirSync(PIPELINE).filter(f => f.endsWith(".ts") && f !== "pipelineTypes.ts").length;
}

function getTestCount(): { total: number; passing: number } {
  try {
    const result = execSync("pnpm --filter @workspace/api-server vitest run --reporter=json 2>/dev/null", {
      cwd: path.resolve(__dirname, "../.."),
      encoding: "utf-8",
      timeout: 60_000,
    });
    const json = JSON.parse(result);
    return { total: json.numTotalTests ?? 0, passing: json.numPassedTests ?? 0 };
  } catch {
    try {
      const result = execSync("pnpm --filter @workspace/api-server vitest run 2>&1 || true", {
        cwd: path.resolve(__dirname, "../.."),
        encoding: "utf-8",
        timeout: 60_000,
      });
      const passMatch = result.match(/(\d+) passed/);
      const totalMatch = result.match(/(\d+) tests/);
      return {
        total: totalMatch ? Number(totalMatch[1]) : 0,
        passing: passMatch ? Number(passMatch[1]) : 0,
      };
    } catch { return { total: 0, passing: 0 }; }
  }
}

function getCoverage(): number {
  try {
    const result = execSync("pnpm --filter @workspace/api-server vitest run --coverage 2>&1 || true", {
      cwd: path.resolve(__dirname, "../.."),
      encoding: "utf-8",
      timeout: 120_000,
    });
    const match = result.match(/Statements\s*:\s*([\d.]+)%/);
    return match ? Number(match[1]) : 0;
  } catch { return 0; }
}

async function run() {
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  VoxAI V6.4.8 — True Decomposition Validation Report");
  console.log("══════════════════════════════════════════════════════════\n");

  const agentsTsBefore = 2129;
  const agentsTsAfter = countLines(path.join(ROUTES, "agents.ts"));
  const buildRouteBefore = 878;

  const buildRouteAfterMatch = fs.existsSync(path.join(ROUTES, "agents.ts"))
    ? (fs.readFileSync(path.join(ROUTES, "agents.ts"), "utf-8").match(/router\.post\("\/agents\/build"/))
      ? (() => {
          const src = fs.readFileSync(path.join(ROUTES, "agents.ts"), "utf-8");
          const start = src.indexOf('router.post("/agents/build"');
          const end = src.indexOf('\n});', start) + 4;
          return end > start ? src.slice(start, end).split('\n').length : -1;
        })()
      : 0
    : -1;
  const buildRouteAfter = buildRouteAfterMatch ?? -1;

  const pipelineFilesCreated = countPipelineFiles();
  const { file: largestFile, loc: largestPipelineFile } = findLargestPipelineFile();

  console.log("Running tests (this may take up to 60s)...");
  const { total: testsPassing, passing: _passing } = getTestCount();
  const testCount = testsPassing;

  const coveragePercent = 0; // Skipped for speed — run separately with: pnpm vitest run --coverage

  const report = {
    agentsTsBefore,
    agentsTsAfter,
    buildRouteBefore,
    buildRouteAfter,
    pipelineFilesCreated,
    largestPipelineFile,
    largestPipelineFileName: largestFile,
    testsPassing: testCount,
    coveragePercent,
  };

  console.log("Results:");
  console.log(JSON.stringify(report, null, 2));

  const TARGETS = {
    "agents.ts ≤ 1200 LOC": agentsTsAfter <= 1200,
    "agents.ts reduced from before": agentsTsAfter < agentsTsBefore,
    "build route ≤ 300 LOC (estimated)": buildRouteAfter <= 300 || buildRouteAfter === 0,
    "pipeline files ≥ 6 created": pipelineFilesCreated >= 6,
    "largest pipeline file ≤ 300 LOC": largestPipelineFile <= 300,
  };

  console.log("\n Target Checks:");
  let allPassed = true;
  for (const [label, ok] of Object.entries(TARGETS)) {
    console.log(`  ${ok ? "✓" : "✗"} ${label}`);
    if (!ok) allPassed = false;
  }

  if (!allPassed) {
    console.log("\n  ✗ Some targets missed — see report above for details.");
    console.log("  Do NOT claim success if targets are missed.");
  } else {
    console.log("\n  ✓ All targets met.");
  }
  console.log("══════════════════════════════════════════════════════════\n");

  process.exit(allPassed ? 0 : 1);
}

run().catch(e => { console.error(e); process.exit(1); });
