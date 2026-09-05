import { Router, Request, Response } from 'express';
import { EnterpriseDrEngine } from '../services/enterprise-dr-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const drEngine = EnterpriseDrEngine.getInstance();

// GET /api/v1/resilience-center/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = drEngine.getSummary();
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

// GET /api/v1/resilience-center/services (Viewer+)
router.get('/services', (req: Request, res: Response) => {
  const criticality = req.query.criticality as string | undefined;
  const data = drEngine.getServices(criticality);
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

// GET /api/v1/resilience-center/plans (Viewer+)
router.get('/plans', (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const data = drEngine.getRecoveryPlans(service);
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

// GET /api/v1/resilience-center/backups (Viewer+)
router.get('/backups', (req: Request, res: Response) => {
  const resource = req.query.resource as string | undefined;
  const status = req.query.status as string | undefined;
  const data = drEngine.getBackups(resource, status);
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

// GET /api/v1/resilience-center/restores (Viewer+)
router.get('/restores', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const data = drEngine.getRestoreTests(status);
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

// GET /api/v1/resilience-center/scenarios (Viewer+)
router.get('/scenarios', (_req: Request, res: Response) => {
  const data = drEngine.getFailureScenarios();
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

// POST /api/v1/resilience-center/scenarios/:id/simulate (Operator+)
router.post('/scenarios/:id/simulate', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = drEngine.runSimulation(id);
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
      error: { code: 'SIMULATION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/resilience-center/workflows (Viewer+)
router.get('/workflows', (_req: Request, res: Response) => {
  const data = drEngine.getRecoveryWorkflows();
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

// POST /api/v1/resilience-center/workflows/:id/execute (Operator+)
router.post('/workflows/:id/execute', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = drEngine.executeRecoveryWorkflow(id, (req as any).user?.username);
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

// GET /api/v1/resilience-center/gaps (Viewer+)
router.get('/gaps', (req: Request, res: Response) => {
  const priority = req.query.priority as string | undefined;
  const data = drEngine.getGaps(priority);
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
