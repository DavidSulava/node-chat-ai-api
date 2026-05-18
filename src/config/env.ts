import { config } from "dotenv";
import { z } from "zod";

// Load .env variables into process.env
config({ path: ".env" });
/**
 * Schema of all required environment variables.
 * Zod ensures that missing or malformed variables cause a clear error.
 */
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  STREAM_API_KEY: z.string().min(1),
  STREAM_API_SECRET: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  PORT: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
});
/**
 * Parse and validate the environment.
 * If validation fails, Zod throws an error that stops the app.
 */
export const env = EnvSchema.parse(process.env);
