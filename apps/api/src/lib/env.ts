import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, "JWT_REFRESH_SECRET must be at least 16 characters long"),
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),
  OPENAI_API_KEY: z.string().trim().min(1).optional(),
  OPENAI_MODEL: z.string().trim().min(1).optional(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().trim().min(1).default("localhost"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid API environment configuration. ${details}`);
}

const corsOrigins = parsedEnv.data.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (corsOrigins.length === 0) {
  throw new Error("Invalid API environment configuration. CORS_ORIGIN must include at least one origin.");
}

export const env = {
  ...parsedEnv.data,
  corsOrigins,
};
