import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
/**
 * Central error handling middleware.
 * Must be registered after all route handlers.
 */
export const errorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }
    logger.error({ err }, "Unhandled System Error");
    res.status(500).json({ error: "Internal Server Error" });
};
