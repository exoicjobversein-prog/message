import { NextFunction, Request, Response } from 'express';
import { JwtPayload, verifyToken } from '../utils/auth';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function bearer(req: Request): string | null {
  const h = req.header('Authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const token = bearer(req);
  if (!token) {
    res.status(401).json({ error: 'missing bearer token' });
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'invalid or expired token' });
  }
}

export function adminRequired(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'admin only' });
    return;
  }
  next();
}

/**
 * Route guard for `/tenants/:id/*` — admins pass; a tenant user only passes
 * for their own tenant.
 */
export function tenantScoped(req: Request, res: Response, next: NextFunction): void {
  const u = req.user;
  if (!u) {
    res.status(401).json({ error: 'unauthenticated' });
    return;
  }
  if (u.role === 'admin' || u.tenantId === req.params.id) {
    next();
    return;
  }
  res.status(403).json({ error: 'forbidden for this tenant' });
}
