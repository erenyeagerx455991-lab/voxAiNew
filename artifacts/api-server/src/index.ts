import app from "./app";
import { logger } from "./lib/logger";
import { initPersistence } from "./design-dna/dnaPersistence.js";
import { initUXPersistence } from "./ux-intelligence/uxPersistence.js";
import { initDirectorPersistence } from "./design-director/directorPersistence.js";

if (process.env.NODE_ENV === "production" && !process.env["API_KEY"]) {
  throw new Error("API_KEY required in production — set API_KEY environment variable before starting.");
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// V8.1: Load DNA snapshots from disk on startup (non-blocking, best-effort)
initPersistence().catch(() => { /* errors are logged inside initPersistence */ });
// V8.2: Load UX intelligence history from disk on startup (non-blocking, best-effort)
// hydrate() imported lazily to avoid circular deps — persistence loads, learning consumes.
import("./ux-intelligence/uxLearning.js").then(({ hydrateUXLearning }) =>
  initUXPersistence().then(records => hydrateUXLearning(records))
).catch(() => { /* errors are logged inside initUXPersistence */ });
// V8.3: Load Design Director history from disk on startup (non-blocking, best-effort)
import("./design-director/directorLearning.js").then(({ hydrateDirectorLearning }) =>
  initDirectorPersistence().then(records => hydrateDirectorLearning(records))
).catch(() => { /* errors are logged inside initDirectorPersistence */ });
// V8.4: Load Product Manager history from disk on startup (non-blocking, best-effort)
import("./product-manager/productLearning.js").then(({ hydrateProductLearning }) =>
  import("./product-manager/productPersistence.js").then(({ initProductPersistence }) =>
    initProductPersistence().then(records => hydrateProductLearning(records))
  )
).catch(() => { /* errors are logged inside initProductPersistence */ });
// V8.5: Load Frontend Architect history from disk on startup (non-blocking, best-effort)
import("./frontend-architect/architecturePersistence.js").then(({ initArchitecturePersistence, hydrateFromDisk }) =>
  initArchitecturePersistence().then(() => hydrateFromDisk())
).catch(() => { /* errors are logged inside initArchitecturePersistence */ });
// V8.6: Init Backend Architect persistence on startup (non-blocking, best-effort)
import("./backend-architect/backendPersistence.js").then(({ initBackendArchitectPersistence }) =>
  initBackendArchitectPersistence()
).catch(() => { /* errors are logged inside initBackendArchitectPersistence */ });
// V8.9: Init Security Architect persistence on startup (non-blocking, best-effort)
import("./security-architect/securityPersistence.js").then(({ initSecurityArchitectPersistence }) =>
  initSecurityArchitectPersistence()
).catch(() => { /* errors are logged inside initSecurityArchitectPersistence */ });
// V9.0: Init Runtime Intelligence persistence on startup (non-blocking, best-effort)
import("./runtime-intelligence/runtimePersistence.js").then(({ initRuntimeIntelligencePersistence }) =>
  initRuntimeIntelligencePersistence()
).catch(() => { /* errors are logged inside initRuntimeIntelligencePersistence */ });
// V9.7: Init Planning Intelligence (persistence + metrics + learning) on startup (non-blocking)
Promise.all([
  import("./planning-intelligence/planningPersistence.js"),
  import("./planning-intelligence/planningMetrics.js"),
  import("./planning-intelligence/planningLearning.js"),
]).then(() => { /* modules loaded — in-memory state ready */ })
  .catch(() => { /* never block startup on planning init */ });
// V9.9: Init Adaptive Intelligence (persistence + metrics + learning) on startup (non-blocking)
Promise.all([
  import("./adaptive-intelligence/adaptivePersistence.js"),
  import("./adaptive-intelligence/adaptiveMetrics.js"),
  import("./adaptive-intelligence/adaptiveLearning.js"),
]).then(() => { /* modules loaded — adaptive intelligence in-memory state ready */ })
  .catch(() => { /* never block startup on adaptive init */ });
// V10.0: Init Self-Optimization Engine (persistence + metrics + learning) on startup (non-blocking)
Promise.all([
  import("./self-optimization-engine/optimizationPersistence.js"),
  import("./self-optimization-engine/optimizationMetrics.js"),
  import("./self-optimization-engine/optimizationLearning.js"),
]).then(() => { /* modules loaded — self-optimization engine in-memory state ready */ })
  .catch(() => { /* never block startup on optimization init */ });
// V10.1: Init Meta Intelligence Engine (persistence + metrics + learning) on startup (non-blocking)
Promise.all([
  import("./meta-intelligence/metaPersistence.js"),
  import("./meta-intelligence/metaMetrics.js"),
  import("./meta-intelligence/metaLearning.js"),
]).then(() => { /* modules loaded — meta intelligence engine in-memory state ready */ })
  .catch(() => { /* never block startup on meta init */ });

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
