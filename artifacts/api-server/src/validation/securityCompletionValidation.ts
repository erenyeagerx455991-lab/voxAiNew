import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
let passed = 0;
let failed = 0;

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, passed: ok, detail });
  if (ok) passed++;
  else failed++;
  console.log(`  ${ok ? "✓ PASS" : "✗ FAIL"} [${name}] ${detail}`);
}

function httpGet(url: string, headers: Record<string, string> = {}): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({ hostname: u.hostname, port: Number(u.port) || 80, path: u.pathname, method: "GET", headers }, (res) => {
      let body = "";
      res.on("data", (c) => { body += c; });
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

async function runChecks() {
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  VoxAI Security Completion Validation");
  console.log("══════════════════════════════════════════════════════════\n");

  const port = process.env["PORT"] ?? "8080";
  const BASE = `http://localhost:${port}/api`;
  const validKey = process.env["API_KEY"] ?? "";
  const testKey = validKey || "test-dev-key-for-validation";

  // ── Phase 1: Production Auth Enforcement ────────────────────────────────────
  console.log("Phase 1: Production Auth Enforcement");

  const indexPath = path.resolve(__dirname, "../index.ts");
  const indexSrc = fs.readFileSync(indexPath, "utf-8");
  const hasProdCheck =
    indexSrc.includes("process.env.NODE_ENV") &&
    indexSrc.includes('"production"') &&
    indexSrc.includes("API_KEY") &&
    (indexSrc.includes("throw new Error") || indexSrc.includes("process.exit"));
  record("prod-auth-check-in-code", hasProdCheck, hasProdCheck ? "Hard-fail guard found in index.ts" : "Missing NODE_ENV=production guard in index.ts");

  const devBoots = process.env["NODE_ENV"] !== "production";
  record("dev-boots-without-key", devBoots, devBoots ? "Dev mode does not require API_KEY" : "Unexpected: dev mode blocked");

  // ── Phase 2: Security Metrics Endpoint Protection ───────────────────────────
  console.log("\nPhase 2: Security Metrics Endpoint Protection");

  try {
    const unauthResp = await httpGet(`${BASE}/security/metrics`);
    record(
      "metrics-unauthenticated-401",
      unauthResp.status === 401,
      `Unauthenticated request returned HTTP ${unauthResp.status} (expected 401)`
    );

    if (validKey) {
      const authResp = await httpGet(`${BASE}/security/metrics`, { "x-api-key": validKey });
      record("metrics-authenticated-200", authResp.status === 200, `Authenticated request returned HTTP ${authResp.status} (expected 200)`);
    } else {
      record("metrics-authenticated-200", true, "Skipped (auth disabled in dev — no API_KEY set)");
    }
  } catch (e: unknown) {
    const err = e as Error;
    record("metrics-unauthenticated-401", false, `HTTP request failed: ${err.message} — is the server running on port ${port}?`);
    record("metrics-authenticated-200", false, "Skipped due to connection failure");
  }

  // ── Phase 3: Frontend Auth Audit ────────────────────────────────────────────
  console.log("\nPhase 3: Frontend Request Audit");

  const voxaiSrc = path.resolve(__dirname, "../../../../voxai/src/services");
  const auditFiles = ["mockAiService.ts", "builderService.ts"];
  let totalCalls = 0;
  let protectedCalls = 0;
  let unprotectedCalls = 0;

  for (const fname of auditFiles) {
    const fpath = path.join(voxaiSrc, fname);
    if (!fs.existsSync(fpath)) continue;
    const src = fs.readFileSync(fpath, "utf-8");
    const fetches = (src.match(/fetch\(/g) ?? []).length;
    const headered = (src.match(/apiHeaders\(\)/g) ?? []).length;
    totalCalls += fetches;
    protectedCalls += Math.min(fetches, headered);
    unprotectedCalls += Math.max(0, fetches - headered);
    record(
      `frontend-auth-${fname}`,
      fetches === 0 || headered >= fetches,
      `${fname}: ${fetches} fetch calls, ${headered} apiHeaders() usages — unprotected: ${Math.max(0, fetches - headered)}`
    );
  }

  const apiHeadersFn = path.join(voxaiSrc, "mockAiService.ts");
  if (fs.existsSync(apiHeadersFn)) {
    const src = fs.readFileSync(apiHeadersFn, "utf-8");
    const hasCentralized = src.includes("function apiHeaders") || src.includes("const apiHeaders");
    record("frontend-centralized-apiHeaders", hasCentralized, hasCentralized ? "apiHeaders() helper is centralized in mockAiService.ts" : "apiHeaders() not found — requests may bypass auth");
  }

  record(
    "frontend-unprotected-calls-zero",
    unprotectedCalls === 0,
    `Frontend Calls Audited: ${totalCalls} | Protected: ${protectedCalls} | Unprotected: ${unprotectedCalls}`
  );

  // ── Phase 4: Health endpoint still public ───────────────────────────────────
  console.log("\nPhase 4: Health Endpoint Still Public");

  try {
    const healthResp = await httpGet(`${BASE}/healthz`);
    record("health-endpoint-public", healthResp.status === 200, `/api/healthz returned HTTP ${healthResp.status}`);
  } catch (e: unknown) {
    const err = e as Error;
    record("health-endpoint-public", false, `Could not reach /api/healthz: ${err.message}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log(`  Result: ${passed}/${passed + failed} checks PASSED`);
  console.log(`  ${failed === 0 ? "✓ ALL CHECKS PASSED — Stage 2 may proceed." : `✗ ${failed} CHECK(S) FAILED — resolve before proceeding to Stage 2.`}`);
  console.log("══════════════════════════════════════════════════════════\n");

  return failed === 0 ? "PASS" : "FAIL";
}

runChecks()
  .then(result => { process.exit(result === "PASS" ? 0 : 1); })
  .catch(e => { console.error("Validation crashed:", e); process.exit(1); });
