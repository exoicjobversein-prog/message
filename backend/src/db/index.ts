import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize-typescript';
import { env } from '../config/env';
import { Tenant } from '../models/Tenant';
import { SmsTemplate } from '../models/SmsTemplate';
import { Lead } from '../models/Lead';
import { SmsMessage } from '../models/SmsMessage';

const needsSsl = /sslmode=require|neon\.tech|render\.com/.test(env.DATABASE_URL);

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  models: [Tenant, SmsTemplate, Lead, SmsMessage],
  define: {
    underscored: true,
    timestamps: false,
  },
  dialectOptions: needsSsl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
});

export async function connectDb(): Promise<void> {
  await sequelize.authenticate();
}

/**
 * Idempotent schema bootstrap for free hosts with no shell access.
 * Runs migrations/001_init.sql (every statement uses IF NOT EXISTS).
 */
export async function runMigrations(): Promise<void> {
  const file = path.join(__dirname, '..', '..', 'migrations', '001_init.sql');
  const sql = fs.readFileSync(file, 'utf8');
  await sequelize.query(sql);
}
