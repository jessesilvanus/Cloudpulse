import { Router, Request, Response } from 'express';
import { MultiCloudDrResilienceEngine } from '../services/multi-cloud-dr-resilience-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const drEngine = MultiCloudDrResilienceEngine.getInstance();

// GET /api/v1/disaster-recovery-center/summary (Viewer+)
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

// GET /api/v1/disaster-recovery-center/plans (Viewer+)
router.get('/plans', (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const strategy = req.query.strategy as string | undefined;
  const data = drEngine.getRecoveryPlans(service, strategy);
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

// GET /api/v1/disaster-recovery-center/drills (Viewer+)
router.get('/drills', (req: Request, res: Response) => {
  const planId = req.query.planId as string | undefined;
  const status = req.query.status as string | undefined;
  const data = drEngine.getDrills(planId, status);
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

// POST /api/v1/disaster-recovery-center/drills/simulate (Viewer+)
router.post('/drills/simulate', (req: Request, res: Response) => {
  const planId = req.body?.planId || 'plan-dr-gw-01';
  const scenario = req.body?.scenario || 'REGION_FAILURE';
  try {
    const data = drEngine.executeDrillSimulation(planId, scenario);
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
      error: { code: 'DRILL_SIMULATION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/disaster-recovery-center/backups (Viewer+)
router.get('/backups', (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const healthStatus = req.query.healthStatus as string | undefined;
  const data = drEngine.getBackups(service, healthStatus);
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

// GET /api/v1/disaster-recovery-center/spofs (Viewer+)
router.get('/spofs', (_req: Request, res: Response) => {
  const data = drEngine.getSpofs();
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

// GET /api/v1/disaster-recovery-center/heatmap (Viewer+)
router.get('/heatmap', (_req: Request, res: Response) => {
  const data = drEngine.getHeatmap();
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

// POST /api/v1/disaster-recovery-center/plans/:id/failover (Operator+)
router.post('/plans/:id/failover', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const operator = (req as any).user?.username || 'sre-lead-01';
  try {
    const data = drEngine.executeFailover(id, operator);
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
      error: { code: 'FAILOVER_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/disaster-recovery-center/plans/:id/failback (Operator+)
router.post('/plans/:id/failback', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const operator = (req as any).user?.username || 'sre-lead-01';
  try {
    const data = drEngine.executeFailback(id, operator);
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
      error: { code: 'FAILBACK_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/disaster-recovery-center/assistant (Viewer+)
router.post('/assistant', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'Summarize disaster recovery readiness';
  const data = drEngine.queryResilienceAssistant(prompt);
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
