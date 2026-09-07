import plivo from 'plivo';
import { env } from '../config/env';
import { Tenant } from '../models/Tenant';
import { SmsMessage } from '../models/SmsMessage';

function masterClient(): plivo.Client {
  if (!env.PLIVO_AUTH_ID || !env.PLIVO_AUTH_TOKEN) {
    throw new Error('PLIVO_AUTH_ID / PLIVO_AUTH_TOKEN not configured');
  }
  return new plivo.Client(env.PLIVO_AUTH_ID, env.PLIVO_AUTH_TOKEN);
}

function tenantClient(tenant: Tenant): plivo.Client {
  if (tenant.plivoSubaccountAuthId && tenant.plivoSubaccountAuthToken) {
    return new plivo.Client(
      tenant.plivoSubaccountAuthId,
      tenant.plivoSubaccountAuthToken
    );
  }
  return masterClient();
}

export interface SendResult {
  ok: boolean;
  messageId: string;
  providerMessageUuid?: string;
  error?: string;
}

export const PlivoService = {
  /**
   * Create a Plivo subaccount for the tenant and (best-effort) rent an
   * SMS-capable number. Falls back to PLIVO_DEFAULT_SENDER if number
   * provisioning is unavailable.
   */
  async provisionTenant(tenantId: string): Promise<{ senderId: string | null }> {
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const client = masterClient();

    let authId = tenant.plivoSubaccountAuthId;
    let authToken = tenant.plivoSubaccountAuthToken;

    if (!authId || !authToken) {
      const sub = await client.subaccounts.create(tenant.name, true);
      // plivo SDK returns authId/authToken on the created subaccount
      authId = (sub as any).authId ?? (sub as any).auth_id ?? null;
      authToken = (sub as any).authToken ?? (sub as any).auth_token ?? null;
    }

    let senderId = tenant.senderId || env.PLIVO_DEFAULT_SENDER || null;

    // Number provisioning is optional / often unavailable on trial accounts.
    try {
      const search = await client.numbers.search('US', { type: 'fixed' } as any);
      const first = (search as any)?.objects?.[0]?.number;
      if (first) {
        await client.numbers.buy(first);
        senderId = first;
      }
    } catch {
      // keep fallback sender
    }

    tenant.plivoSubaccountAuthId = authId;
    tenant.plivoSubaccountAuthToken = authToken;
    tenant.senderId = senderId;
    await tenant.save();

    return { senderId };
  },

  async sendOne(args: {
    tenantId: string;
    leadId: string | null;
    templateId: string | null;
    to: string;
    body: string;
  }): Promise<SendResult> {
    const { tenantId, leadId, templateId, to, body } = args;

    const message = await SmsMessage.create({
      tenantId,
      leadId,
      templateId,
      to,
      body,
      status: 'queued',
    });

    try {
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) throw new Error('Tenant not found');

      const src = tenant.senderId || env.PLIVO_DEFAULT_SENDER;
      if (!src) throw new Error('No sender configured (tenant.senderId / PLIVO_DEFAULT_SENDER)');

      const client = tenantClient(tenant);
      const optionals: Record<string, unknown> = {};
      if (env.PLIVO_STATUS_WEBHOOK_URL) optionals.url = env.PLIVO_STATUS_WEBHOOK_URL;

      const resp: any = await (client.messages.create as any)(
        src,
        to,
        body,
        optionals
      );
      const providerMessageUuid: string | undefined =
        resp?.messageUuid?.[0] ?? resp?.message_uuid?.[0] ?? resp?.messageUuid;

      message.providerMessageUuid = providerMessageUuid ?? null;
      message.status = 'sent';
      message.sentAt = new Date();
      await message.save();

      return { ok: true, messageId: message.id, providerMessageUuid };
    } catch (e: any) {
      message.status = 'failed';
      message.error = e?.message ? String(e.message) : 'send failed';
      await message.save();
      return { ok: false, messageId: message.id, error: message.error };
    }
  },
};
