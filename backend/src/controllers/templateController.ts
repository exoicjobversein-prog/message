import { Request, Response } from 'express';
import { SmsTemplate } from '../models/SmsTemplate';
import { Tenant } from '../models/Tenant';

export async function listTemplates(req: Request, res: Response): Promise<void> {
  const templates = await SmsTemplate.findAll({
    where: { tenantId: req.params.id },
    order: [['createdAt', 'ASC']],
  });
  res.json({ templates });
}

export async function createTemplate(req: Request, res: Response): Promise<void> {
  const { name, body } = req.body ?? {};
  if (!name || !body) {
    res.status(400).json({ error: 'name and body are required' });
    return;
  }
  const tenant = await Tenant.findByPk(req.params.id);
  if (!tenant) {
    res.status(404).json({ error: 'tenant not found' });
    return;
  }
  const template = await SmsTemplate.create({ tenantId: tenant.id, name, body });
  res.status(201).json({ template });
}

/** Tenant users may only touch their own tenant's templates; admins any. */
function ownsTemplate(req: Request, template: SmsTemplate): boolean {
  return req.user?.role === 'admin' || req.user?.tenantId === template.tenantId;
}

export async function updateTemplate(req: Request, res: Response): Promise<void> {
  const template = await SmsTemplate.findByPk(req.params.id);
  if (!template) {
    res.status(404).json({ error: 'template not found' });
    return;
  }
  if (!ownsTemplate(req, template)) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  const { name, body } = req.body ?? {};
  if (name !== undefined) template.name = name;
  if (body !== undefined) template.body = body;
  await template.save();
  res.json({ template });
}

export async function deleteTemplate(req: Request, res: Response): Promise<void> {
  const template = await SmsTemplate.findByPk(req.params.id);
  if (!template) {
    res.status(404).json({ error: 'template not found' });
    return;
  }
  if (!ownsTemplate(req, template)) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  await template.destroy();
  res.status(204).end();
}
