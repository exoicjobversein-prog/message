# backend — adora-sms-service

Multi-tenant outbound SMS service (Plivo, no DLT). Express + Sequelize + Postgres + TypeScript.
Part of the monorepo (`../frontend` is the React UI); a minimal vanilla-JS demo UI is also served at `/`.

## Local

```bash
cp .env.example .env      # set DATABASE_URL + Plivo creds
npm install
npm run dev               # http://localhost:4000  (also serves the demo UI)
```

`RUN_MIGRATIONS=true` (default) applies `migrations/001_init.sql` on boot, so no
separate migrate step is needed. Set it to `false` and run the SQL yourself if
you prefer.

## Deploy on a free account

### Postgres — Neon (free)
1. Create a project at neon.tech, copy the pooled connection string.
2. It ends with `?sslmode=require` — SSL is auto-enabled by the app.

### Web service — Render (free)
Two options:

**A. Blueprint** — push the repo to GitHub, then in Render: *New → Blueprint*,
pick the repo. The root `render.yaml` defines the service (`rootDir: backend`).
Fill the `sync: false` env vars (`DATABASE_URL`, `PLIVO_AUTH_ID`,
`PLIVO_AUTH_TOKEN`, …) in the dashboard.

**B. Manual** — *New → Web Service*:
- Root directory: `backend`
- Build: `npm install && npm run build`
- Start: `npm start`
- Health check path: `/health`
- Env vars: everything from `.env.example`

Also works as-is on Railway / Fly / Koyeb (Procfile + `npm start`).

### After deploy
- App URL: `https://<app>.onrender.com` (demo UI at `/`).
- Set `PLIVO_STATUS_WEBHOOK_URL=https://<app>.onrender.com/webhooks/plivo/status`
  and redeploy so delivery reports land.
- Free Render web services sleep after ~15 min idle; first request wakes it.

## API

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

If `API_KEY` is set, all `/api/*` routes require header `X-Api-Key`.
