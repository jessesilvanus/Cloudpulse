import { Router, Request, Response } from 'express';
import { EnterpriseFinOpsBusinessEngine } from '../services/enterprise-finops-business-engine.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const finopsEngine = EnterpriseFinOpsBusinessEngine.getInstance();

// GET /api/v1/finops-enterprise/summary (Viewer+)
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

// GET /api/v1/finops-enterprise/costs (Viewer+)
router.get('/costs', (req: Request, res: Response) => {
  const provider = req.query.provider as string | undefined;
  const team = req.query.team as string | undefined;
  const service = req.query.service as string | undefined;
  const environment = req.query.environment as string | undefined;

  const data = finopsEngine.getCostRecords(provider, team, service, environment);
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

// GET /api/v1/finops-enterprise/usage (Viewer+)
router.get('/usage', (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const data = finopsEngine.getUsageRecords(service);
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

// GET /api/v1/finops-enterprise/impacts (Viewer+)
router.get('/impacts', (_req: Request, res: Response) => {
  const data = finopsEngine.getBusinessImpacts();
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

// GET /api/v1/finops-enterprise/budgets (Viewer+)
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

// GET /api/v1/finops-enterprise/forecasts (Viewer+)
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

// GET /api/v1/finops-enterprise/optimizations (Viewer+)
router.get('/optimizations', (_req: Request, res: Response) => {
  const data = finopsEngine.getOptimizationOpportunities();
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

// POST /api/v1/finops-enterprise/simulate-what-if (Viewer+)
router.post('/simulate-what-if', (req: Request, res: Response) => {
  const scenario = req.body || {
    resource: 'k8s-deployment/payment-service',
    changeType: 'REDUCE_CPU',
    proposedConfig: '250m CPU'
  };
  const data = finopsEngine.simulateWhatIf(scenario);
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

// POST /api/v1/finops-enterprise/assistant (Viewer+)
router.post('/assistant', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'Summarize top cost drivers';
  const data = finopsEngine.queryAssistant(prompt);
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
