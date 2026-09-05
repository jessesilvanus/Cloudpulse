import { Router, Request, Response } from 'express';
import { ReliabilityEngine } from '../services/reliability-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const reliabilityEngine = ReliabilityEngine.getInstance();

// GET /api/v1/reliability/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = reliabilityEngine.getSummary();
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

// GET /api/v1/reliability/services (Viewer+)
router.get('/services', (req: Request, res: Response) => {
  const tier = req.query.tier as string | undefined;
  const status = req.query.status as string | undefined;
  const data = reliabilityEngine.getServices(tier, status);
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

// GET /api/v1/reliability/services/:id (Viewer+)
router.get('/services/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const service = reliabilityEngine.getServiceById(id);
  if (!service) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Service '${id}' not found` },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const response: ApiResponse<typeof service> = {
    ok: true,
    data: service,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

// GET /api/v1/reliability/slis (Viewer+)
router.get('/slis', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = reliabilityEngine.getSlis(serviceId);
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

// GET /api/v1/reliability/slos (Viewer+)
router.get('/slos', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = reliabilityEngine.getSlos(serviceId);
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

// GET /api/v1/reliability/error-budgets (Viewer+)
router.get('/error-budgets', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = reliabilityEngine.getErrorBudgets(serviceId);
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

// GET /api/v1/reliability/capacity (Viewer+)
router.get('/capacity', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = reliabilityEngine.getCapacityProfiles(serviceId);
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

// POST /api/v1/reliability/gate/:serviceId (Operator+)
router.post('/gate/:serviceId', requireRole('operator'), (req: Request, res: Response) => {
  const serviceId = req.params.serviceId as string;
  const data = reliabilityEngine.evaluateReliabilityGate(serviceId);
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

// GET /api/v1/reliability/findings (Viewer+)
router.get('/findings', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = reliabilityEngine.getReliabilityFindings(serviceId);
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

// GET /api/v1/reliability/runbooks (Viewer+)
router.get('/runbooks', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = reliabilityEngine.getReliabilityRunbooks(serviceId);
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

// POST /api/v1/reliability/runbooks/:id/execute (Operator+)
router.post('/runbooks/:id/execute', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { mode } = req.body;
  try {
    const data = reliabilityEngine.executeReliabilityRunbook(id, mode);
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
    return res.status(404).json({
      ok: false,
      error: { code: 'EXECUTION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

export default router;
