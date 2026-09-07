import express, { NextFunction, Request, Response } from 'express';
import { router } from './routes';

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API-only service — the UI is the separate frontend static site.
app.get('/', (_req, res) =>
  res.json({ service: 'adora-sms-backend', ok: true }),
);
app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(router);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'not found' });
});

// error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: err.message || 'internal error' });
});
