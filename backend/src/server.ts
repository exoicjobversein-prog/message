import 'reflect-metadata';
import { app } from './app';
import { env } from './config/env';
import { connectDb, runMigrations } from './db';
import { seedAdmin } from './bootstrap/seedAdmin';

async function main(): Promise<void> {
  await connectDb();
  console.log('DB connected');

  if (env.RUN_MIGRATIONS) {
    await runMigrations();
    console.log('Migrations applied');
  }

  await seedAdmin();

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`adora-sms-service listening on :${env.PORT}`);
  });
}

main().catch((e) => {
  console.error('Fatal startup error:', e);
  process.exit(1);
});
