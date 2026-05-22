import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(20, 'JWT_SECRET must be at least 20 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  SCHEDULER_ENABLED: booleanFromEnv.default(true),
  SCHEDULER_QUEUE_INTERVAL_MS: z.coerce.number().int().min(500).default(3000),
  SCHEDULER_COMPLETION_INTERVAL_MS: z.coerce.number().int().min(500).default(3000),
  SCHEDULER_MAX_SIMULATED_RUNTIME_MS: z.coerce.number().int().min(1000).default(30000),
  SCHEDULER_FAILURE_RATE: z.coerce.number().min(0).max(1).default(0.1)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
