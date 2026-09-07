import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize-typescript';
import { env } from '../config/env';
import { Tenant } from '../models/Tenant';
import { SmsTemplate } from '../models/SmsTemplate';
import { Lead } from '../models/Lead';
import { SmsMessage } from '../models/SmsMessage';
import { User } from '../models/User';

const needsSsl = /sslmode=require|neon\.tech|render\.com/.test(env.DATABASE_URL);

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  models: [Tenant, SmsTemplate, Lead, SmsMessage, User],
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
 * Runs every migrations/*.sql in order (all statements use IF NOT EXISTS).
 */
export async function runMigrations(): Promise<void> {
  const dir = path.join(__dirname, '..', '..', 'migrations');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    await sequelize.query(sql);
  }
}
