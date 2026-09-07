import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authRequired, adminRequired, tenantScoped } from '../middleware/auth';
import { login, me } from '../controllers/authController';
import {
  createTenant,
  listTenants,
  provisionTenant,
} from '../controllers/tenantController';
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
} from '../controllers/templateController';
import { createLeads, listLeads } from '../controllers/leadController';
import { listMessages, sendCampaign } from '../controllers/smsController';
import { plivoStatus } from '../controllers/webhookController';

export const router = Router();
const api = Router();

// --- Auth (public) ---
api.post('/auth/login', asyncHandler(login));
api.get('/auth/me', authRequired, asyncHandler(me));

// --- Admin: tenant + login-account management ---
api.post('/tenants', authRequired, adminRequired, asyncHandler(createTenant));
api.get('/tenants', authRequired, adminRequired, asyncHandler(listTenants));
api.post(
  '/tenants/:id/provision',
  authRequired,
  adminRequired,
  asyncHandler(provisionTenant),
);

// --- Tenant-scoped (admin or the tenant's own user) ---
api.get('/tenants/:id/templates', authRequired, tenantScoped, asyncHandler(listTemplates));
api.post('/tenants/:id/templates', authRequired, tenantScoped, asyncHandler(createTemplate));
api.put('/templates/:id', authRequired, asyncHandler(updateTemplate));
api.delete('/templates/:id', authRequired, asyncHandler(deleteTemplate));

api.get('/tenants/:id/leads', authRequired, tenantScoped, asyncHandler(listLeads));
api.post('/tenants/:id/leads', authRequired, tenantScoped, asyncHandler(createLeads));

api.post('/tenants/:id/send', authRequired, tenantScoped, asyncHandler(sendCampaign));
api.get('/tenants/:id/messages', authRequired, tenantScoped, asyncHandler(listMessages));

router.use('/api', api);

// --- Webhooks (no auth; form-encoded from Plivo) ---
router.post('/webhooks/plivo/status', asyncHandler(plivoStatus));
