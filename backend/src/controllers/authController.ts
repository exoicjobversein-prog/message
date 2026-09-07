import { Request, Response } from 'express';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import {
  normalizeEmail,
  signToken,
  verifyPassword,
} from '../utils/auth';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await User.findOne({ where: { email: normalizeEmail(email) } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: 'invalid email or password' });
    return;
  }

  const token = signToken({
    sub: user.id,
    role: user.role,
    tenantId: user.tenantId,
    email: user.email,
  });

  res.json({ token, user: publicUser(user) });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await User.findByPk(req.user!.sub);
  if (!user) {
    res.status(404).json({ error: 'user not found' });
    return;
  }
  let tenant = null;
  if (user.tenantId) tenant = await Tenant.findByPk(user.tenantId);
  res.json({ user: publicUser(user), tenant });
}

function publicUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    tenantId: u.tenantId,
    createdAt: u.createdAt,
  };
}
