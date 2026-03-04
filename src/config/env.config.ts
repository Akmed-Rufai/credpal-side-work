import { z } from 'zod';

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),
    DATABASE_URL: z.string().url(),
    JWT_ACCESS_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    PAYSTACK_SECRET_KEY: z.string(),
    REDIS_URL: z.string().url(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>) => {
    const parsed = envSchema.safeParse(config);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', parsed.error.format());
        throw new Error('Invalid environment variables');
    }

    return parsed.data;
};
