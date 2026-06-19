import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  // ── V6.4.6 Phase 7: Redact secrets and large payloads ─────────────────────
  redact: {
    paths: [
      // Auth headers
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['x-api-key']",
      "res.headers['set-cookie']",
      // API key fields in body (prevent accidental logging)
      "req.body.apiKey",
      "req.body.api_key",
      "req.body.openaiKey",
      "req.body.groqKey",
      // Large generated content fields — redact to prevent disk pressure
      "req.body.files",
      "req.body.projectFiles",
      "req.body.content",
      "req.body.code",
      "req.body.prompt",
    ],
    censor: "[REDACTED]",
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
