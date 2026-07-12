import dotenv from "dotenv";
import { z } from "zod";
import path from "path";

// Load environment variables
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("1d"),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.string().default("1025").transform((val) => parseInt(val, 10)),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().default("noreply@assetflow.erp"),
  STORAGE_TYPE: z.enum(["local", "s3", "minio"]).default("local"),
  LOCAL_UPLOAD_DIR: z.string().default("./uploads"),
  MAX_BOOKING_DURATION_HOURS: z.string().default("24").transform((val) => parseInt(val, 10)),
  DEFAULT_PAGE_LIMIT: z.string().default("10").transform((val) => parseInt(val, 10)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
