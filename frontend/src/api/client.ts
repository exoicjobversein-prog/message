import axios from 'axios';
import type {
  Lead,
  SendResult,
  SmsMessage,
  SmsTemplate,
  Tenant,
} from './types';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

const apiKey = import.meta.env.VITE_API_KEY;
if (apiKey) http.defaults.headers.common['X-Api-Key'] = apiKey;

// The service may return a bare array/object or wrap it as { tenants: [...] } etc.
// Unwrap the single known key so callers always get the payload directly.
function unwrap<T>(data: unknown, key: string): T {
  if (data && typeof data === 'object' && key in (data as Record<string, unknown>)) {
    return (data as Record<string, unknown>)[key] as T;
  }
  return data as T;
}

export const api = {
  listTenants: async () =>
    unwrap<Tenant[]>((await http.get('/tenants')).data, 'tenants'),

  createTenant: async (name: string) =>
    unwrap<Tenant>((await http.post('/tenants', { name })).data, 'tenant'),

  provisionTenant: async (id: string) =>
    (await http.post(`/tenants/${id}/provision`)).data as { senderId: string | null },

  listTemplates: async (tenantId: string) =>
    unwrap<SmsTemplate[]>(
      (await http.get(`/tenants/${tenantId}/templates`)).data,
      'templates',
    ),

  createTemplate: async (tenantId: string, name: string, body: string) =>
    unwrap<SmsTemplate>(
      (await http.post(`/tenants/${tenantId}/templates`, { name, body })).data,
      'template',
    ),

  updateTemplate: async (id: string, name: string, body: string) =>
    unwrap<SmsTemplate>(
      (await http.put(`/templates/${id}`, { name, body })).data,
      'template',
    ),

  deleteTemplate: async (id: string) => {
    await http.delete(`/templates/${id}`);
  },

  listLeads: async (tenantId: string) =>
    unwrap<Lead[]>((await http.get(`/tenants/${tenantId}/leads`)).data, 'leads'),

  createLead: async (
    tenantId: string,
    payload: { name?: string; phone: string; extra?: Record<string, string> },
  ) => unwrap<Lead>((await http.post(`/tenants/${tenantId}/leads`, payload)).data, 'lead'),

  createLeadsBulk: async (tenantId: string, bulk: string) =>
    unwrap<Lead[]>(
      (await http.post(`/tenants/${tenantId}/leads`, { bulk })).data,
      'leads',
    ),

  send: async (tenantId: string, templateId: string, leadIds: string[]) =>
    (await http.post(`/tenants/${tenantId}/send`, { templateId, leadIds }))
      .data as SendResult,

  listMessages: async (tenantId: string) =>
    unwrap<SmsMessage[]>(
      (await http.get(`/tenants/${tenantId}/messages`)).data,
      'messages',
    ),
};

export function errMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    return (
      (e.response?.data as { error?: string } | undefined)?.error ??
      e.message
    );
  }
  return e instanceof Error ? e.message : String(e);
}
