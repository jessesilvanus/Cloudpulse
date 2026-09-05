import { Router, Request, Response } from 'express';
import { AdvancedFinOpsEngine } from '../services/advanced-finops-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const finopsEngine = AdvancedFinOpsEngine.getInstance();

// GET /api/v1/finops-center/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = finopsEngine.getSummary();
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

// GET /api/v1/finops-center/costs (Viewer+)
router.get('/costs', (req: Request, res: Response) => {
  const provider = req.query.provider as string | undefined;
  const team = req.query.team as string | undefined;
  const environment = req.query.environment as string | undefined;
  const data = finopsEngine.getCostRecords(provider, team, environment);
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

// GET /api/v1/finops-center/budgets (Viewer+)
router.get('/budgets', (_req: Request, res: Response) => {
  const data = finopsEngine.getBudgets();
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

// GET /api/v1/finops-center/forecasts (Viewer+)
router.get('/forecasts', (_req: Request, res: Response) => {
  const data = finopsEngine.getForecasts();
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

// GET /api/v1/finops-center/anomalies (Viewer+)
router.get('/anomalies', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const data = finopsEngine.getAnomalies(status);
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

// GET /api/v1/finops-center/waste (Viewer+)
router.get('/waste', (_req: Request, res: Response) => {
  const data = finopsEngine.getWasteFindings();
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

// GET /api/v1/finops-center/rightsizing (Viewer+)
router.get('/rightsizing', (_req: Request, res: Response) => {
  const data = finopsEngine.getRightsizingRecommendations();
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

// GET /api/v1/finops-center/unit-economics (Viewer+)
router.get('/unit-economics', (_req: Request, res: Response) => {
  const data = finopsEngine.getUnitEconomics();
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

// GET /api/v1/finops-center/kubernetes (Viewer+)
router.get('/kubernetes', (_req: Request, res: Response) => {
  const data = finopsEngine.getKubernetesCost();
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

// GET /api/v1/finops-center/multicloud (Viewer+)
router.get('/multicloud', (_req: Request, res: Response) => {
  const data = finopsEngine.getMultiCloudCost();
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

// GET /api/v1/finops-center/opportunities (Viewer+)
router.get('/opportunities', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const data = finopsEngine.getOptimizationOpportunities(status);
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

// POST /api/v1/finops-center/opportunities/:id/approve (Operator+)
router.post('/opportunities/:id/approve', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = finopsEngine.approveOptimization(id, (req as any).user?.username);
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
      error: { code: 'APPROVE_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

export default router;
