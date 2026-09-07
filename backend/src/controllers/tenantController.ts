import { Request, Response } from 'express';
import { Tenant } from '../models/Tenant';
import { PlivoService } from '../services/PlivoService';

export async function createTenant(req: Request, res: Response): Promise<void> {
  const { name } = req.body ?? {};
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const tenant = await Tenant.create({ name });

  try {
    await PlivoService.provisionTenant(tenant.id);
    await tenant.reload();
  } catch (e: any) {
    // provisioning is best-effort for the demo
    res.status(201).json({
      tenant,
      provisioning: { ok: false, error: e?.message ? String(e.message) : 'failed' },
    });
    return;
  }

  res.status(201).json({ tenant, provisioning: { ok: true } });
}

export async function listTenants(_req: Request, res: Response): Promise<void> {
  const tenants = await Tenant.findAll({ order: [['createdAt', 'ASC']] });
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
