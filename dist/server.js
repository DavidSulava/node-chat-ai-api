import express from "express";
import cors from "cors";
import apiRouter from "./routes/api.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { logger } from "./utils/logger.js";
const app = express();
const PORT = env.PORT ? Number(env.PORT) : 5000;
app.use(cors());
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: false, limit: "500kb" }));
// Mount API routes under /api prefix
app.use("/api", apiRouter);
app.use(errorHandler);
app.listen(PORT, () => logger.info(`Server running on ${PORT}`));
