import { Router, Request, Response } from 'express';
import { AdvancedFinOpsGreenOpsEngine } from '../services/advanced-finops-greenops-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const engine = AdvancedFinOpsGreenOpsEngine.getInstance();

// GET /api/v1/finops-greenops/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = engine.getSummary();
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

// GET /api/v1/finops-greenops/greenops (Viewer+)
router.get('/greenops', (_req: Request, res: Response) => {
  const data = engine.getGreenOpsMetrics();
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

// GET /api/v1/finops-greenops/unit-economics (Viewer+)
router.get('/unit-economics', (_req: Request, res: Response) => {
  const data = engine.getUnitEconomics();
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

// GET /api/v1/finops-greenops/savings/opportunities (Viewer+)
router.get('/savings/opportunities', (_req: Request, res: Response) => {
  const data = engine.getSavingsOpportunities();
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

// GET /api/v1/finops-greenops/savings/realized (Viewer+)
router.get('/savings/realized', (_req: Request, res: Response) => {
  const data = engine.getRealizedSavings();
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

// POST /api/v1/finops-greenops/savings/opportunities/:id/reconcile (Operator+)
router.post('/savings/opportunities/:id/reconcile', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = engine.reconcileRealizedSavings(id);
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
      error: { code: 'RECONCILIATION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/finops-greenops/scenarios/simulate (Viewer+)
router.post('/scenarios/simulate', (req: Request, res: Response) => {
  const { trafficMultiplier, targetRegion, rightsizingAggressiveness } = req.body;
  try {
    const data = engine.simulateGreenOpsScenario({
      trafficMultiplier,
      targetRegion,
      rightsizingAggressiveness
    });
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

// POST /api/v1/finops-greenops/assistant (Viewer+)
router.post('/assistant', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'What is our current cloud spend and regional carbon intensity?';
  const data = engine.queryFinOpsGreenOpsAssistant(prompt);
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
