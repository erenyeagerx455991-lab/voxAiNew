import app from "./app";
import { logger } from "./lib/logger";

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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
