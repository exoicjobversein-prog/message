import axios from 'axios';
import type {
  Lead,
  LoginResponse,
  MeResponse,
  SendResult,
  SmsMessage,
  SmsTemplate,
  Tenant,
} from './types';

const TOKEN_KEY = 'adora.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On an expired/invalid session, drop the token and bounce to login.
http.interceptors.response.use(
  (r) => r,
  (e) => {
    if (
      axios.isAxiosError(e) &&
      e.response?.status === 401 &&
      !e.config?.url?.includes('/auth/login')
    ) {
      setToken(null);
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(e);
  },
);

// The service may return a bare array/object or wrap it as { tenants: [...] } etc.
// Unwrap the single known key so callers always get the payload directly.
function unwrap<T>(data: unknown, key: string): T {
  if (data && typeof data === 'object' && key in (data as Record<string, unknown>)) {
    return (data as Record<string, unknown>)[key] as T;
  }
  return data as T;
}

// List endpoints must hand back an array even if the API/proxy returns an
// error object or HTML — otherwise `.map` in render throws.
function unwrapList<T>(data: unknown, key: string): T[] {
  const v = unwrap<unknown>(data, key);
  return Array.isArray(v) ? (v as T[]) : [];
}

export const api = {
  login: async (email: string, password: string) =>
    (await http.post('/auth/login', { email, password })).data as LoginResponse,

  me: async () => (await http.get('/auth/me')).data as MeResponse,

  listTenants: async () =>
    unwrapList<Tenant>((await http.get('/tenants')).data, 'tenants'),

  createTenant: async (name: string, email: string, password: string) =>
    (await http.post('/tenants', { name, email, password })).data as {
      tenant: Tenant;
      login: { email: string };
      provisioning: { ok: boolean; error?: string };
    },

  provisionTenant: async (id: string) =>
    (await http.post(`/tenants/${id}/provision`)).data as { senderId: string | null },

  listTemplates: async (tenantId: string) =>
    unwrapList<SmsTemplate>(
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
    unwrapList<Lead>((await http.get(`/tenants/${tenantId}/leads`)).data, 'leads'),

  createLead: async (
    tenantId: string,
    payload: { name?: string; phone: string; extra?: Record<string, string> },
  ) => unwrap<Lead>((await http.post(`/tenants/${tenantId}/leads`, payload)).data, 'lead'),

  createLeadsBulk: async (tenantId: string, bulk: string) =>
    unwrapList<Lead>(
      (await http.post(`/tenants/${tenantId}/leads`, { bulk })).data,
      'leads',
    ),

  send: async (tenantId: string, templateId: string, leadIds: string[]) =>
    (await http.post(`/tenants/${tenantId}/send`, { templateId, leadIds }))
      .data as SendResult,

  listMessages: async (tenantId: string) =>
    unwrapList<SmsMessage>(
      (await http.get(`/tenants/${tenantId}/messages`)).data,
      'messages',
    ),
};

function toStr(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v;
  return null;
}

export function errMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as
      | { error?: unknown; message?: unknown }
      | string
      | undefined;
    if (typeof data === 'object' && data) {
      const picked =
        toStr(data.error) ??
        toStr((data.error as { message?: unknown })?.message) ??
        toStr(data.message);
      if (picked) return picked;
    }
    return e.message || 'Request failed';
  }
  if (e instanceof Error) return e.message;
  return toStr(e) ?? 'Something went wrong';
}
