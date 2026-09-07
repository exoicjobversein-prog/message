import dotenv from 'dotenv';

dotenv.config();

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  PORT: parseInt(process.env.PORT || '4000', 10),
  PLIVO_AUTH_ID: process.env.PLIVO_AUTH_ID || '',
  PLIVO_AUTH_TOKEN: process.env.PLIVO_AUTH_TOKEN || '',
  PLIVO_STATUS_WEBHOOK_URL: process.env.PLIVO_STATUS_WEBHOOK_URL || '',
  PLIVO_DEFAULT_SENDER: process.env.PLIVO_DEFAULT_SENDER || '',

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  // Seed / ensure an admin account on boot.
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',

  // Run migrations/*.sql on boot (handy on free hosts with no shell).
  RUN_MIGRATIONS: (process.env.RUN_MIGRATIONS || 'true') !== 'false',
};
