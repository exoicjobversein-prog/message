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

export async function updateTemplate(req: Request, res: Response): Promise<void> {
  const template = await SmsTemplate.findByPk(req.params.id);
  if (!template) {
    res.status(404).json({ error: 'template not found' });
    return;
  }
  const { name, body } = req.body ?? {};
  if (name !== undefined) template.name = name;
  if (body !== undefined) template.body = body;
  await template.save();
  res.json({ template });
}

export async function deleteTemplate(req: Request, res: Response): Promise<void> {
  const count = await SmsTemplate.destroy({ where: { id: req.params.id } });
  if (!count) {
    res.status(404).json({ error: 'template not found' });
    return;
  }
  res.status(204).end();
}
