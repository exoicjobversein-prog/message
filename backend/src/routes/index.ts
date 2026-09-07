import { Router } from 'express';
import { apiKey } from '../middleware/apiKey';
import { asyncHandler } from '../utils/asyncHandler';
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

// --- API (optional X-Api-Key) ---
const api = Router();
api.use(apiKey);

api.post('/tenants', asyncHandler(createTenant));
api.get('/tenants', asyncHandler(listTenants));
api.post('/tenants/:id/provision', asyncHandler(provisionTenant));

api.get('/tenants/:id/templates', asyncHandler(listTemplates));
api.post('/tenants/:id/templates', asyncHandler(createTemplate));
api.put('/templates/:id', asyncHandler(updateTemplate));
api.delete('/templates/:id', asyncHandler(deleteTemplate));

api.get('/tenants/:id/leads', asyncHandler(listLeads));
api.post('/tenants/:id/leads', asyncHandler(createLeads));

api.post('/tenants/:id/send', asyncHandler(sendCampaign));
api.get('/tenants/:id/messages', asyncHandler(listMessages));

router.use('/api', api);

// --- Webhooks (no api key; form-encoded) ---
router.post('/webhooks/plivo/status', asyncHandler(plivoStatus));
