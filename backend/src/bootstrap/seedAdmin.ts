import { env } from '../config/env';
import { User } from '../models/User';
import { hashPassword, normalizeEmail } from '../utils/auth';

/**
 * Ensure an admin login exists. Controlled by ADMIN_EMAIL / ADMIN_PASSWORD.
 * If the admin already exists the password is refreshed to the env value,
 * so ops can reset it by redeploying.
 */
export async function seedAdmin(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set — no admin seeded');
    return;
  }
  const email = normalizeEmail(env.ADMIN_EMAIL);
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    existing.role = 'admin';
    existing.passwordHash = passwordHash;
    existing.tenantId = null;
    await existing.save();
    console.log(`Admin ensured: ${email}`);
    return;
  }
  await User.create({ email, passwordHash, role: 'admin', tenantId: null });
  console.log(`Admin created: ${email}`);
}
