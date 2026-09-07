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

## Auth

- `/login` — split-screen sign-in (Adora 7X branding). Token is stored in
  `localStorage` and sent as `Authorization: Bearer` on every request.
- **Admin** (seeded in the backend) lands on `/tenants` — create a workspace with
  a login email + password, hand those to the tenant.
- **Tenant user** lands on `/templates` and only sees its own workspace
  (Templates / Leads / Send). No tenant picker.
- A 401 from the API clears the token and bounces to `/login`.

## Structure

```
src/
  api/client.ts      axios instance (bearer interceptor) + typed endpoint wrappers
  api/types.ts        Auth / Tenant / SmsTemplate / Lead / SmsMessage
  auth.tsx            AuthProvider + useAuth (login / logout / me hydration)
  components/Layout   role-aware tab nav + logout
  hooks.ts            useTenants (admin)
  pages/              LoginPage, TenantsPage, TemplatesPage, LeadsPage, SendPage
  main.tsx            router + RequireAuth / RoleRoute guards
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
