import express, { type Express, type Request, type Response, type NextFunction } from "express";
import pinoHttp from "pino-http";
import helmet from "helmet";
import { logger } from "./lib/logger";
import router from "./routes";
import { corsMiddleware } from "./security/corsConfig.js";
import { authMiddleware } from "./security/authMiddleware.js";
import { buildRateLimiter, chatRateLimiter, generalRateLimiter } from "./security/rateLimiter.js";
import { recordBaselineRequest } from "./security/securityBaseline.js";
import { startCleanupScheduler } from "./security/workspaceCleanup.js";
import { initRedis } from "./queue/redisClient.js";
import { initBuildQueue } from "./queue/buildQueue.js";
import { initQueueWorker } from "./queue/queueWorker.js";

const app: Express = express();

// ── Phase 5: Helmet — HTTP security headers ───────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// ── Phase 6: CORS allowlist ────────────────────────────────────────────────────
app.use(corsMiddleware);

// ── Request logging ───────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Phase 1: Baseline request recorder ────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  recordBaselineRequest(req.path, req.headers.origin ?? 'direct');
  next();
});

// ── Phase 4 + Phase 3: Rate limiting & auth on protected routes ───────────────
// Public:  /api/healthz only
// Auth required: /api/agents/*, /api/chat/*, /api/security/*
app.use("/api/agents", generalRateLimiter, buildRateLimiter, authMiddleware);

// /api/chat/* — chat limits + auth
app.use("/api/chat", generalRateLimiter, chatRateLimiter, authMiddleware);

// /api/security/* — metrics and baseline require auth (health endpoint is separate)
app.use("/api/security", generalRateLimiter, authMiddleware);

// /api/projects/* — project persistence, protected by auth when API_KEY is set
app.use("/api/projects", generalRateLimiter, authMiddleware);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── Phase 9: Start workspace cleanup scheduler ────────────────────────────────
startCleanupScheduler();

// ── V7.0: Queue + Worker initialization ──────────────────────────────────────
initRedis().then(() => {
  initBuildQueue();
  initQueueWorker();
}).catch(() => {
  // Redis unavailable — queue runs in-memory mode (already logged by initRedis)
  initBuildQueue();
  initQueueWorker();
});

export default app;
