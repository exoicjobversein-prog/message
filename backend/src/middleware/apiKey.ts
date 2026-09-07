import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';

export function apiKey(req: Request, res: Response, next: NextFunction): void {
  if (!env.API_KEY) {
    next();
    return;
  }
  if (req.header('X-Api-Key') === env.API_KEY) {
    next();
    return;
  }
  res.status(401).json({ error: 'invalid or missing X-Api-Key' });
}
