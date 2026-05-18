import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import apiRouter from "./routes/api.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { logger } from "./utils/logger.js";

const app = express();
const PORT = env.PORT ? Number(env.PORT) : 5000;

const corsOptions = env.ALLOWED_ORIGINS
  ? {
      origin: env.ALLOWED_ORIGINS.split(","),
      credentials: true,
    }
  : undefined;

app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { status: 429, message: "Too many requests" },
});
app.use(limiter);

app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: false, limit: "500kb" }));
app.use("/api", apiRouter);
app.use(errorHandler);

const server = app.listen(PORT, () => logger.info(`Server running on ${PORT}`));

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Received shutdown signal, closing server...");

  server.close(async () => {
    logger.info("HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
