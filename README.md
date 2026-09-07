Alag standalone service ke liye — pura flow + implementation prompt. Baad me Adora me merge karna easy rahe isliye same stack (Node + Express + TypeScript + Sequelize + Postgres).

PART 1 — Flow (Standalone SMS Service)
Project structure

adora-sms-service/
├── src/
│   ├── config/env.ts
│   ├── db/index.ts                 # Sequelize connection
│   ├── models/                     # Tenant, SmsTemplate, Lead, SmsMessage
│   ├── services/PlivoService.ts
│   ├── controllers/
│   ├── routes/
│   ├── app.ts
│   └── server.ts
├── public/index.html               # demo UI (sir ko dikhane ke liye)
├── migrations/
├── .env.example
├── package.json
└── README.md
Data model

tenants
  id, name, plivo_subaccount_auth_id, plivo_subaccount_auth_token, sender_id, created_at

sms_templates
  id, tenant_id → tenants, name, body ("Hi {{name}}, new {{type}} in {{city}}. {{link}}"), created_at

leads
  id, tenant_id → tenants, name, phone (E.164), extra (JSONB — {city, type, link...}), created_at

sms_messages
  id, tenant_id, lead_id, template_id, to, body (rendered), provider_message_uuid,
  status (queued|sent|delivered|failed), error, sent_at, delivered_at, created_at
Architecture

Demo UI (public/index.html)
   │  REST calls
   ▼
Express API (src/)
   ├── POST /api/tenants                → create tenant + Plivo subaccount + sender number
   ├── CRUD /api/tenants/:id/templates  → per-tenant free-text templates
   ├── CRUD /api/tenants/:id/leads      → add leads (or CSV paste)
   ├── POST /api/tenants/:id/send       → { templateId, leadIds[] } → bulk send
   └── POST /webhooks/plivo/status      → delivery reports
   │
   ▼
PlivoService.sendSms(tenantId, to, renderedBody)
   │
   ▼
Plivo API  (default/international route — NO DLT)
   │
   ▼
Lead's phone  (random numeric sender, one-way)
Send sequence

UI: pick tenant → pick template → select leads → "Send Campaign"
   │
   ▼ POST /api/tenants/:id/send { templateId, leadIds }
For each leadId:
   1. lead = leads.find(id)
   2. rendered = render(template.body, { name: lead.name, ...lead.extra })
   3. sms_messages.create({ status:'queued', to: lead.phone, body: rendered })
   4. plivo(subAuthId, subAuthToken).messages.create({
        src: tenant.sender_id, dst: lead.phone, text: rendered,
        url: PLIVO_STATUS_WEBHOOK_URL
      })
   5. sms_messages.update({ provider_message_uuid, status:'sent' })
   │
   ▼ async — Plivo calls webhook
POST /webhooks/plivo/status { MessageUUID, Status: 'delivered'|'failed' }
   → sms_messages.update({ status, delivered_at })
Demo UI screens (single page, tabs)

┌─ Tab: Tenants ──────────────────────────┐
│  [+ New Tenant]  name: ___  [Create]     │
│  Gautam Realty   sender: 5-digit  ✓      │
│  Aman Tech       sender: 5-digit  ✓      │
└─────────────────────────────────────────┘
┌─ Tab: Templates (tenant: Gautam Realty) ┐
│  [+ New]  name ___  body: textarea      │
│  "New Listing"  → "Hi {{name}}, new..."  │
└─────────────────────────────────────────┘
┌─ Tab: Leads (tenant: Gautam Realty) ────┐
│  paste numbers / add: name, phone, city │
│  Rahul  +9198...  Baner                  │
└─────────────────────────────────────────┘
┌─ Tab: Send ─────────────────────────────┐
│  Tenant: [Gautam Realty ▾]              │
│  Template: [New Listing ▾]              │
│  Leads: ☑ Rahul  ☑ Priya               │
│  [ Send Campaign ]                       │
│  ─ Results (live) ─                      │
│  Rahul  → sent → delivered ✓            │
│  Priya  → sent → delivered ✓            │
└─────────────────────────────────────────┘
What sir sees in the demo
Create 2 tenants (different "businesses")
Each tenant gets a different template
Send to a real phone (sir's or your verified number on Plivo trial)
SMS arrives — from random number, custom text, with link
Status updates live: queued → sent → delivered
No DLT registered anywhere
PART 2 — Implementation Prompt
Naye folder me coding agent ko do (Claude Code / Cursor).


# Build: Standalone multi-tenant outbound SMS service (Plivo, no DLT) — demo/POC

## Goal
A small standalone Node + TypeScript service that lets multiple tenants send outbound-only
SMS to their own leads using their own free-text templates, via Plivo's default route
(international to India — NO DLT registration). No inbound/reply handling. Includes a simple
single-page demo UI so it can be shown to a stakeholder. Stack matches adora-ourteach-backend
(Express + Sequelize + Postgres + TypeScript) for easy later integration.

## Tech
- Node 20, TypeScript, Express
- Sequelize + sequelize-typescript, Postgres (schema: public)
- plivo npm SDK
- ts-node-dev for dev
- Plain HTML/JS in /public for the demo UI (no framework)

## Project layout
adora-sms-service/
  src/config/env.ts
  src/db/index.ts
  src/models/{Tenant,SmsTemplate,Lead,SmsMessage}.ts + index.ts
  src/services/PlivoService.ts
  src/controllers/{tenantController,templateController,leadController,smsController,webhookController}.ts
  src/routes/index.ts
  src/utils/renderTemplate.ts
  src/app.ts
  src/server.ts
  public/index.html
  migrations/001_init.sql
  .env.example
  README.md
  package.json  tsconfig.json

## Env (.env.example)
DATABASE_URL=postgres://user:pass@localhost:5432/sms_service
PORT=4000
PLIVO_AUTH_ID=
PLIVO_AUTH_TOKEN=
PLIVO_STATUS_WEBHOOK_URL=        # public URL for delivery reports; e.g. https://xxxx.ngrok.io/webhooks/plivo/status ; leave empty to skip
PLIVO_DEFAULT_SENDER=            # optional fallback sender number if subaccount provisioning is skipped

## Data model (migrations/001_init.sql, snake_case)
tenants(id uuid pk default gen_random_uuid(), name text not null,
  plivo_subaccount_auth_id text, plivo_subaccount_auth_token text, sender_id text,
  created_at timestamptz default now())
sms_templates(id uuid pk default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null, body text not null, created_at timestamptz default now())
leads(id uuid pk default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete cascade,
  name text, phone text not null, extra jsonb not null default '{}', created_at timestamptz default now())
sms_messages(id uuid pk default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null, template_id uuid references sms_templates(id) on delete set null,
  "to" text not null, body text not null, provider_message_uuid text,
  status text not null default 'queued', error text,
  sent_at timestamptz, delivered_at timestamptz, created_at timestamptz default now())
Indexes on tenant_id for each; on provider_message_uuid for sms_messages.
Models use sequelize-typescript with default underscored:true (attributes camelCase, columns snake_case).

## PlivoService (src/services/PlivoService.ts)
import plivo from 'plivo';
- masterClient() -> new plivo.Client(env.PLIVO_AUTH_ID, env.PLIVO_AUTH_TOKEN)
- async provisionTenant(tenantId): 
    * masterClient().subaccounts.create({ name: tenant.name, enabled: true }) -> { authId, authToken }
    * rent an SMS-capable number: masterClient().numbers.search / buy under subaccount
      (if number provisioning is complex, fall back to env.PLIVO_DEFAULT_SENDER and just store subaccount creds)
    * update tenants row with plivo_subaccount_auth_id/token/sender_id
- private tenantClient(tenant): new plivo.Client(tenant.plivo_subaccount_auth_id, tenant.plivo_subaccount_auth_token)
    (fallback to masterClient + env.PLIVO_DEFAULT_SENDER if subaccount not set)
- async sendOne({ tenantId, leadId, templateId, to, body }):
    * create sms_messages row status 'queued'
    * const client = tenantClient(tenant); const src = tenant.sender_id || env.PLIVO_DEFAULT_SENDER
    * const params:any = { src, dst: to, text: body }
      if (env.PLIVO_STATUS_WEBHOOK_URL) params.url = env.PLIVO_STATUS_WEBHOOK_URL
    * const resp = await client.messages.create(params)
    * update row: provider_message_uuid = resp.messageUuid[0], status 'sent', sent_at now
    * on error: update row status 'failed', error = e.message ; return { ok:false }
    * return { ok:true, messageId, providerMessageUuid }

## renderTemplate (src/utils/renderTemplate.ts)
renderTemplate(body: string, vars: Record<string,string>): string
- replace every {{key}} with vars[key] ?? '' (trim key, case-sensitive)

## Controllers / routes (all JSON, no auth for the demo — add an optional X-Api-Key check gated by env)
POST   /api/tenants                     { name } -> create tenant, then PlivoService.provisionTenant, return tenant
GET    /api/tenants                     -> list tenants
POST   /api/tenants/:id/provision       -> (re)run provisioning, return { senderId }
GET    /api/tenants/:id/templates
POST   /api/tenants/:id/templates       { name, body }
PUT    /api/templates/:id               { name, body }
DELETE /api/templates/:id
GET    /api/tenants/:id/leads
POST   /api/tenants/:id/leads           { name, phone, extra } OR { bulk: "name,phone,city\n..." } CSV-ish
POST   /api/tenants/:id/send            { templateId, leadIds: string[] }
        -> for each lead: render(template.body, { name: lead.name, phone: lead.phone, ...lead.extra })
           -> PlivoService.sendOne(...) ; collect results
        -> return { total, sent, failed, messages:[{leadId,status}] }
GET    /api/tenants/:id/messages        -> recent sms_messages (for live status polling)
POST   /webhooks/plivo/status           -> form-encoded { MessageUUID, Status, ErrorCode, To }
        -> find sms_messages by provider_message_uuid
        -> map Plivo Status: 'queued'|'sent'|'delivered'|'undelivered'|'failed'
        -> set delivered_at when delivered; store ErrorCode in error when failed
        -> respond 200 "OK"
Use express.urlencoded for the webhook route.

## Demo UI (public/index.html)
Single file, vanilla JS, fetch() to the API. Tabs: Tenants | Templates | Leads | Send.
- Tenants tab: create tenant, list with sender_id
- Templates tab: tenant dropdown, create/edit templates, show {{variables}} hint
- Leads tab: tenant dropdown, add lead form + bulk textarea
- Send tab: tenant + template dropdowns, lead checkboxes, "Send Campaign" button,
  results table that polls GET /api/tenants/:id/messages every 3s to show status transitions
Keep styling minimal but clean (system font, simple cards, a light/dark friendly palette).

## app.ts / server.ts
- app.ts: express.json(), express.urlencoded({extended:true}) for webhook, static /public, mount routes, error handler
- server.ts: connect Sequelize (sync or run migration), app.listen(env.PORT)

## README.md
- Setup: createdb, set .env (DATABASE_URL, PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN)
- Run migration 001_init.sql (psql -f)
- npm run dev
- Plivo trial note: verify recipient numbers in Plivo console first; sender will be a random
  numeric ID on the India route; this route needs NO DLT; outbound only.
- How to demo: create 2 tenants, add a template + leads to each, Send, watch statuses.

## Constraints
- Outbound only. No inbound webhook beyond delivery status. No DLT. No RCS.
- `npx tsc --noEmit` must pass.
- Do not hardcode Plivo credentials — only from env.

## package.json scripts
"dev": "ts-node-dev --respawn src/server.ts",
"build": "tsc",
"start": "node dist/server.js"
Sir ko dikhane ke liye
Chaho to main is poore flow ka ek visual architecture page (artifact) bhi bana du — jise sir ko link/screenshot bhej sako, taaki approval mile. Batao.

---

# Setup & Run

## Prerequisites
- Node 20, Postgres 14+

## Steps
1. `createdb sms_service`
2. `cp .env.example .env` and set `DATABASE_URL`, `PLIVO_AUTH_ID`, `PLIVO_AUTH_TOKEN`
   (optionally `PLIVO_STATUS_WEBHOOK_URL`, `PLIVO_DEFAULT_SENDER`, `API_KEY`)
3. Run migration: `psql "$DATABASE_URL" -f migrations/001_init.sql`
4. `npm install`
5. `npm run dev` — API + demo UI on `http://localhost:4000`
6. Typecheck: `npx tsc --noEmit`

## Plivo trial notes
- Verify recipient numbers in the Plivo console first.
- India route sender is a random numeric ID — **no DLT** required. Outbound only.
- For delivery reports, expose the server via ngrok and set
  `PLIVO_STATUS_WEBHOOK_URL=https://xxxx.ngrok.io/webhooks/plivo/status`.

## Demo flow
Create 2 tenants → add a template + leads to each → Send tab → watch
`queued → sent → delivered` update live (UI polls every 3s).

## API summary
| Method | Path | Body |
|---|---|---|
| POST | `/api/tenants` | `{ name }` |
| GET | `/api/tenants` | |
| POST | `/api/tenants/:id/provision` | |
| GET/POST | `/api/tenants/:id/templates` | `{ name, body }` |
| PUT/DELETE | `/api/templates/:id` | `{ name?, body? }` |
| GET/POST | `/api/tenants/:id/leads` | `{ name, phone, extra }` or `{ bulk }` |
| POST | `/api/tenants/:id/send` | `{ templateId, leadIds[] }` |
| GET | `/api/tenants/:id/messages` | |
| POST | `/webhooks/plivo/status` | form-encoded from Plivo |

If `API_KEY` is set in `.env`, all `/api/*` routes require the `X-Api-Key` header.