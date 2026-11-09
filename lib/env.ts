import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional().or(z.literal('')),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().default('1x00000000000000000000AA'),
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional().or(z.literal('')),
});

const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().optional().or(z.literal('')),
  TURNSTILE_SECRET_KEY: z.string().default('1x0000000000000000000000000000000AA'),
  RESEND_API_KEY: z.string().optional().or(z.literal('')),
  EMAIL_FROM: z.string().default('Island Hackathon <register@example.com>'),
  RATE_LIMIT_SALT: z.string().min(16).default('dev_salt_random_32_chars_minimum_length_abcdef12345'),
  CRON_SECRET: z.string().default('dev_cron_secret_test'),
  EMAIL_PROVIDER: z.enum(['resend', 'brevo']).default('resend'),
  FORCE_2D: z.enum(['0', '1']).default('0'),
});

export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
});

export const serverEnv = typeof window === 'undefined' ? serverSchema.parse({
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT,
  CRON_SECRET: process.env.CRON_SECRET,
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
  FORCE_2D: process.env.FORCE_2D,
}) : {} as z.infer<typeof serverSchema>;

