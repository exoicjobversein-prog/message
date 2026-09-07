import { Request, Response } from 'express';
import { Lead } from '../models/Lead';
import { Tenant } from '../models/Tenant';

export async function listLeads(req: Request, res: Response): Promise<void> {
  const leads = await Lead.findAll({
    where: { tenantId: req.params.id },
    order: [['createdAt', 'ASC']],
  });
  res.json({ leads });
}

/**
 * Parse a bulk paste of "name,phone,city" rows.
 * First column -> name, second -> phone, any remaining named by header
 * `city` by default; extra columns land in `extra`.
 */
function parseBulk(bulk: string): Array<{ name: string | null; phone: string; extra: Record<string, unknown> }> {
  const rows: Array<{ name: string | null; phone: string; extra: Record<string, unknown> }> = [];
  for (const raw of bulk.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(',').map((p) => p.trim());
    const [name, phone, city, type, link] = parts;
    if (!phone) continue;
    const extra: Record<string, unknown> = {};
    if (city) extra.city = city;
    if (type) extra.type = type;
    if (link) extra.link = link;
    rows.push({ name: name || null, phone, extra });
  }
  return rows;
}

export async function createLeads(req: Request, res: Response): Promise<void> {
  const tenant = await Tenant.findByPk(req.params.id);
  if (!tenant) {
    res.status(404).json({ error: 'tenant not found' });
    return;
  }

  const { name, phone, extra, bulk } = req.body ?? {};

  if (typeof bulk === 'string' && bulk.trim()) {
    const parsed = parseBulk(bulk);
    if (!parsed.length) {
      res.status(400).json({ error: 'no valid rows in bulk' });
      return;
    }
    const leads = await Lead.bulkCreate(
      parsed.map((p) => ({ ...p, tenantId: tenant.id }))
    );
    res.status(201).json({ leads });
    return;
  }

  if (!phone || typeof phone !== 'string') {
    res.status(400).json({ error: 'phone is required' });
    return;
  }
  const lead = await Lead.create({
    tenantId: tenant.id,
    name: name || null,
    phone,
    extra: extra && typeof extra === 'object' ? extra : {},
  });
  res.status(201).json({ lead });
}
