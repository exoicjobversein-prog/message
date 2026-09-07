import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { UserRole } from '../models/User';

export interface JwtPayload {
  sub: string; // user id
  role: UserRole;
  tenantId: string | null;
  email: string;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: JwtPayload): string {
  const opts = { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions;
  return jwt.sign(payload, env.JWT_SECRET, opts);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
