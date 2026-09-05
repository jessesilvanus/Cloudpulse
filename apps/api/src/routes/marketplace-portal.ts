import { Router, Request, Response } from 'express';
import { MarketplacePlatformEngine } from '../services/marketplace-platform-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const marketplaceEngine = MarketplacePlatformEngine.getInstance();

// GET /api/v1/marketplace-portal/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = marketplaceEngine.getSummary();
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// GET /api/v1/marketplace-portal/catalog (Viewer+)
router.get('/catalog', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const provider = req.query.provider as string | undefined;
  const data = marketplaceEngine.getCatalogItems(category, provider);
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// GET /api/v1/marketplace-portal/templates (Viewer+)
router.get('/templates', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const data = marketplaceEngine.getTemplates(category);
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// GET /api/v1/marketplace-portal/requests (Viewer+)
router.get('/requests', (req: Request, res: Response) => {
  const team = req.query.team as string | undefined;
  const status = req.query.status as string | undefined;
  const data = marketplaceEngine.getRequests(team, status);
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// POST /api/v1/marketplace-portal/requests (Viewer+)
router.post('/requests', requireRole('viewer'), (req: Request, res: Response) => {
  try {
    const data = marketplaceEngine.createRequest(req.body);
    const response: ApiResponse<typeof data> = {
      ok: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
    return res.status(201).json(response);
  } catch (err: any) {
    return res.status(400).json({
      ok: false,
      error: { code: 'PROVISIONING_REQUEST_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/marketplace-portal/requests/:id/approve (Operator+)
router.post('/requests/:id/approve', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const approver = (req as any).user?.username || 'sre-lead-01';
  try {
    const data = marketplaceEngine.approveRequest(id, approver);
    const response: ApiResponse<typeof data> = {
      ok: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
    return res.json(response);
  } catch (err: any) {
    return res.status(400).json({
      ok: false,
      error: { code: 'APPROVAL_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/marketplace-portal/requests/:id/reject (Operator+)
router.post('/requests/:id/reject', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const approver = (req as any).user?.username || 'sre-lead-01';
  const reason = req.body?.reason || 'Rejected by platform operator';
  try {
    const data = marketplaceEngine.rejectRequest(id, approver, reason);
    const response: ApiResponse<typeof data> = {
      ok: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
    return res.json(response);
  } catch (err: any) {
    return res.status(400).json({
      ok: false,
      error: { code: 'REJECTION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/marketplace-portal/registry (Viewer+)
router.get('/registry', (req: Request, res: Response) => {
  const team = req.query.team as string | undefined;
  const environment = req.query.environment as string | undefined;
  const data = marketplaceEngine.getRegistry(team, environment);
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// POST /api/v1/marketplace-portal/registry/:id/decommission (Operator+)
router.post('/registry/:id/decommission', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const operator = (req as any).user?.username || 'sre-lead-01';
  try {
    const data = marketplaceEngine.decommissionResource(id, operator);
    const response: ApiResponse<typeof data> = {
      ok: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
    return res.json(response);
  } catch (err: any) {
    return res.status(400).json({
      ok: false,
      error: { code: 'DECOMMISSION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/marketplace-portal/simulate (Viewer+)
router.post('/simulate', (req: Request, res: Response) => {
  const templateId = req.body?.templateId || 'tmpl-k8s-001';
  const params = req.body?.parameters || { replicas: 3 };
  try {
    const data = marketplaceEngine.simulateProvisioning(templateId, params);
    const response: ApiResponse<typeof data> = {
      ok: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
    return res.json(response);
  } catch (err: any) {
    return res.status(400).json({
      ok: false,
      error: { code: 'SIMULATION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/marketplace-portal/query (Viewer+)
router.post('/query', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'Recommend database options';
  const data = marketplaceEngine.queryMarketplace(prompt);
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

export default router;
