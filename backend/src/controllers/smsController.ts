import { Request, Response } from 'express';
import { Lead } from '../models/Lead';
import { SmsMessage } from '../models/SmsMessage';
import { SmsTemplate } from '../models/SmsTemplate';
import { Tenant } from '../models/Tenant';
import { PlivoService } from '../services/PlivoService';
import { renderTemplate } from '../utils/renderTemplate';

export async function sendCampaign(req: Request, res: Response): Promise<void> {
  const tenant = await Tenant.findByPk(req.params.id);
  if (!tenant) {
    res.status(404).json({ error: 'tenant not found' });
    return;
  }

  const { templateId, leadIds } = req.body ?? {};
  if (!templateId || !Array.isArray(leadIds) || leadIds.length === 0) {
    res.status(400).json({ error: 'templateId and non-empty leadIds[] are required' });
    return;
  }

  const template = await SmsTemplate.findOne({
    where: { id: templateId, tenantId: tenant.id },
  });
  if (!template) {
    res.status(404).json({ error: 'template not found for tenant' });
    return;
  }

  const leads = await Lead.findAll({
    where: { id: leadIds, tenantId: tenant.id },
  });

  const messages: Array<{ leadId: string; status: string; error?: string }> = [];
  let sent = 0;
  let failed = 0;

  for (const lead of leads) {
    const body = renderTemplate(template.body, {
      name: lead.name ?? '',
      phone: lead.phone,
      ...(lead.extra ?? {}),
    });
    const result = await PlivoService.sendOne({
      tenantId: tenant.id,
      leadId: lead.id,
      templateId: template.id,
      to: lead.phone,
      body,
    });
    if (result.ok) {
      sent += 1;
      messages.push({ leadId: lead.id, status: 'sent' });
    } else {
      failed += 1;
      messages.push({ leadId: lead.id, status: 'failed', error: result.error });
    }
  }

  res.json({ total: leads.length, sent, failed, messages });
}

export async function listMessages(req: Request, res: Response): Promise<void> {
  const messages = await SmsMessage.findAll({
    where: { tenantId: req.params.id },
    order: [['createdAt', 'DESC']],
    limit: 200,
  });
  res.json({ messages });
}
