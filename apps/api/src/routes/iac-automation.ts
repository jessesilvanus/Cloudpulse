import { Router, Request, Response } from 'express';
import { IaCAutomationEngine } from '../services/iac-automation-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const iacEngine = IaCAutomationEngine.getInstance();

// GET /api/v1/iac/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = iacEngine.getSummary();
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

// GET /api/v1/iac/projects (Viewer+)
router.get('/projects', (_req: Request, res: Response) => {
  const data = iacEngine.getProjects();
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

// GET /api/v1/iac/stacks (Viewer+)
router.get('/stacks', (req: Request, res: Response) => {
  const projectId = req.query.projectId as string | undefined;
  const data = iacEngine.getStacks(projectId);
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

// GET /api/v1/iac/blueprints (Viewer+)
router.get('/blueprints', (_req: Request, res: Response) => {
  const data = iacEngine.getBlueprints();
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

// GET /api/v1/iac/plans (Viewer+)
router.get('/plans', (req: Request, res: Response) => {
  const stackId = req.query.stackId as string | undefined;
  const data = iacEngine.getPlans(stackId);
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

// POST /api/v1/iac/plans (Viewer+)
router.post('/plans', (req: Request, res: Response) => {
  const { stackId, resourceType, resourceName, action, newState, costImpactMonthly } = req.body;
  try {
    const data = iacEngine.createPlan({ stackId, resourceType, resourceName, action, newState, costImpactMonthly });
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
      error: { code: 'PLAN_CREATION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/iac/plans/:id/validate (Viewer+)
router.post('/plans/:id/validate', (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = iacEngine.validatePlan(id);
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
      error: { code: 'PLAN_NOT_FOUND', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/iac/plans/:id/approve (Operator+)
router.post('/plans/:id/approve', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const approver = (req.body?.approver as string) || (req as any).user?.email || 'operator@enterprise.io';
  try {
    const data = iacEngine.approvePlan(id, approver);
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

// POST /api/v1/iac/plans/:id/execute (Operator+)
router.post('/plans/:id/execute', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const mode = (req.body?.mode as 'DRY_RUN' | 'SIMULATED') || 'SIMULATED';
  try {
    const data = iacEngine.executeDeployment(id, mode);
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
      error: { code: 'DEPLOYMENT_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/iac/deployments/:id/rollback (Operator+)
router.post('/deployments/:id/rollback', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = iacEngine.rollbackDeployment(id);
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
      error: { code: 'ROLLBACK_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/iac/drifts (Viewer+)
router.get('/drifts', (req: Request, res: Response) => {
  const stackId = req.query.stackId as string | undefined;
  const data = iacEngine.getDriftRecords(stackId);
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

// POST /api/v1/iac/drifts/:id/reconcile (Operator+)
router.post('/drifts/:id/reconcile', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = iacEngine.reconcileDrift(id);
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

// POST /api/v1/iac/assistant (Viewer+)
router.post('/assistant', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'What is our current IaC drift and deployment status?';
  const data = iacEngine.queryIacAssistant(prompt);
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
