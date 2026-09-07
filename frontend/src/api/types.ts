export interface Tenant {
  id: string;
  name: string;
  senderId: string | null;
  plivoSubaccountAuthId?: string | null;
  createdAt: string;
}

export interface SmsTemplate {
  id: string;
  tenantId: string;
  name: string;
  body: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  tenantId: string;
  name: string | null;
  phone: string;
  extra: Record<string, string>;
  createdAt: string;
}

export type SmsStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'undelivered'
  | 'failed';

export interface SmsMessage {
  id: string;
  tenantId: string;
  leadId: string | null;
  templateId: string | null;
  to: string;
  body: string;
  providerMessageUuid: string | null;
  status: SmsStatus;
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface SendResult {
  total: number;
  sent: number;
  failed: number;
  messages: { leadId: string; status: SmsStatus }[];
}
