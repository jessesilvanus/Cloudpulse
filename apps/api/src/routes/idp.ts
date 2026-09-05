import { Router, Request, Response } from 'express';
import { IdpEngine } from '../services/idp-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const idpEngine = IdpEngine.getInstance();

// GET /api/v1/idp/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = idpEngine.getPlatformSummary();
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

// GET /api/v1/idp/golden-paths (Viewer+)
router.get('/golden-paths', (_req: Request, res: Response) => {
  const data = idpEngine.getGoldenPaths();
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

// GET /api/v1/idp/golden-paths/:id (Viewer+)
router.get('/golden-paths/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const gp = idpEngine.getGoldenPathById(id);
  if (!gp) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Golden Path '${id}' not found` },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const response: ApiResponse<typeof gp> = {
    ok: true,
    data: gp,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

// GET /api/v1/idp/templates (Viewer+)
router.get('/templates', (_req: Request, res: Response) => {
  const data = idpEngine.getTemplates();
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

// GET /api/v1/idp/templates/:id (Viewer+)
router.get('/templates/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const template = idpEngine.getTemplateById(id);
  if (!template) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Template '${id}' not found` },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const response: ApiResponse<typeof template> = {
    ok: true,
    data: template,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

// GET /api/v1/idp/environments (Viewer+)
router.get('/environments', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const type = req.query.type as string | undefined;
  const data = idpEngine.getEnvironments(serviceId, type);
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

// POST /api/v1/idp/environments (Operator+)
router.post('/environments', requireRole('operator'), (req: Request, res: Response) => {
  try {
    const data = idpEngine.provisionEnvironment(req.body);
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
      error: { code: 'PROVISION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/idp/deployments (Viewer+)
router.get('/deployments', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = idpEngine.getDeployments(serviceId);
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

// POST /api/v1/idp/deployments (Operator+)
router.post('/deployments', requireRole('operator'), (req: Request, res: Response) => {
  try {
    const data = idpEngine.triggerDeployment(req.body);
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
      error: { code: 'DEPLOYMENT_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/idp/requests (Viewer+)
router.get('/requests', (_req: Request, res: Response) => {
  const data = idpEngine.getPlatformRequests();
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

// GET /api/v1/idp/scorecards (Viewer+)
router.get('/scorecards', (_req: Request, res: Response) => {
  const data = idpEngine.getServiceScorecards();
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

// GET /api/v1/idp/scorecards/:serviceId (Viewer+)
router.get('/scorecards/:serviceId', (req: Request, res: Response) => {
  const serviceId = req.params.serviceId as string;
  const scorecard = idpEngine.getScorecardByServiceId(serviceId);
  if (!scorecard) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Scorecard for service '${serviceId}' not found` },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const response: ApiResponse<typeof scorecard> = {
    ok: true,
    data: scorecard,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

export default router;
