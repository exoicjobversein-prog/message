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

## Auth model

- **Admin** — seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD` on every boot (password
  is refreshed to the env value, so redeploy = password reset). Creates tenant
  workspaces and their login accounts.
- **Tenant user** — created by the admin with an email + password. Can only see
  and act on its own tenant's templates, leads, campaigns and messages.

Auth is a JWT bearer token (`Authorization: Bearer <token>`), obtained from
`POST /api/auth/login`, valid for `JWT_EXPIRES_IN` (default 7d).

## API

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/api/auth/login` | public | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | any | → `{ user, tenant }` |
| POST | `/api/tenants` | admin | `{ name, email, password }` |
| GET | `/api/tenants` | admin | → tenants (with login accounts) |
| POST | `/api/tenants/:id/provision` | admin | |
| GET/POST | `/api/tenants/:id/templates` | admin or that tenant | `{ name, body }` |
| PUT/DELETE | `/api/templates/:id` | admin or owner | `{ name?, body? }` |
| GET/POST | `/api/tenants/:id/leads` | admin or that tenant | `{ name, phone, extra }` or `{ bulk }` |
| POST | `/api/tenants/:id/send` | admin or that tenant | `{ templateId, leadIds[] }` |
| GET | `/api/tenants/:id/messages` | admin or that tenant | |
| POST | `/webhooks/plivo/status` | public | form-encoded from Plivo |
