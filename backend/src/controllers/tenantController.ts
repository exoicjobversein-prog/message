import { Request, Response } from 'express';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { PlivoService } from '../services/PlivoService';
import { hashPassword, normalizeEmail } from '../utils/auth';

/**
 * Admin-only. Creates a tenant, its login account (email + password), and
 * best-effort Plivo provisioning.
 */
export async function createTenant(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body ?? {};
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  if (!email || !password || String(password).length < 6) {
    res.status(400).json({ error: 'email and password (min 6 chars) are required' });
    return;
  }

  const normEmail = normalizeEmail(email);
  if (await User.findOne({ where: { email: normEmail } })) {
    res.status(409).json({ error: 'a user with that email already exists' });
    return;
  }

  const tenant = await Tenant.create({ name });
  const user = await User.create({
    email: normEmail,
    passwordHash: await hashPassword(password),
    role: 'tenant',
    tenantId: tenant.id,
  });

  let provisioning: { ok: boolean; error?: string };
  try {
    await PlivoService.provisionTenant(tenant.id);
    await tenant.reload();
    provisioning = { ok: true };
  } catch (e: any) {
    provisioning = { ok: false, error: e?.message ? String(e.message) : 'failed' };
  }

  res.status(201).json({
    tenant,
    login: { email: user.email },
    provisioning,
  });
}

export async function listTenants(_req: Request, res: Response): Promise<void> {
  const tenants = await Tenant.findAll({
    order: [['createdAt', 'ASC']],
    include: [{ model: User, attributes: ['id', 'email', 'role'] }],
  });
  res.json({ tenants });
}

export async function provisionTenant(req: Request, res: Response): Promise<void> {
  const tenant = await Tenant.findByPk(req.params.id);
  if (!tenant) {
    res.status(404).json({ error: 'tenant not found' });
    return;
  }
  const { senderId } = await PlivoService.provisionTenant(tenant.id);
  res.json({ senderId });
}
