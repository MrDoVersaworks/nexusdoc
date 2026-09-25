import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  AES_ENCRYPTION_KEY: z.string().min(1, 'AES_ENCRYPTION_KEY is required'),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  GEMINI_API_KEY: z.string().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

function validateConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missingVars = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`
    );
    throw new Error([
      '[ERR_CONFIG_VALIDATION] Server refused to start. Missing or invalid environment variables:',
      ...missingVars,
      '',
      'Check your .env file against .env.example.',
    ].join('\n'));
  }

  return result.data;
}

export const config: EnvConfig = validateConfig();
export const allowedOrigins = config.CORS_ORIGIN
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);
