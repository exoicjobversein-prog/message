# Adora SMS Service — Frontend

React 19 + Vite + TypeScript + react-router + axios. Matches the Adora frontend stack
so components can be lifted into the main dashboard later.

## Setup

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies `/api` and `/webhooks` to the standalone SMS service on
`http://localhost:4000` (see `vite.config.ts`). Start the backend first.

Override with `.env` if the API lives elsewhere (see `.env.example`).

## Structure

```
src/
  api/client.ts      axios instance + typed endpoint wrappers
  api/types.ts        Tenant / SmsTemplate / Lead / SmsMessage
  components/         Layout (tab nav), TenantPicker
  hooks.ts            useTenants, useSelectedTenant (sessionStorage-backed)
  pages/              TenantsPage, TemplatesPage, LeadsPage, SendPage
  main.tsx            router
```

## Pages

- **Tenants** — create tenant (provisions Plivo subaccount + sender), list, re-provision
- **Templates** — per-tenant free-text templates with `{{variable}}` placeholders; create / edit / delete
- **Leads** — add lead (name, phone, city/type/link → `extra`), bulk `name,phone,city` paste
- **Send** — pick template + leads, send campaign, live results table polling
  `GET /api/tenants/:id/messages` every 3s for 60s (queued → sent → delivered)

## Build

```bash
npm run build      # tsc -b && vite build  ->  dist/
```
