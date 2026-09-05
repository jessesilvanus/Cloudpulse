import { Router, Request, Response } from 'express';
import { EnterpriseGovernanceEngine } from '../services/enterprise-governance-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const govEngine = EnterpriseGovernanceEngine.getInstance();

// GET /api/v1/governance-center/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = govEngine.getSummary();
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

// GET /api/v1/governance-center/policies (Viewer+)
router.get('/policies', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const status = req.query.status as string | undefined;
  const data = govEngine.getPolicies(category, status);
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

// GET /api/v1/governance-center/resources (Viewer+)
router.get('/resources', (req: Request, res: Response) => {
  const provider = req.query.provider as string | undefined;
  const team = req.query.team as string | undefined;
  const status = req.query.status as string | undefined;
  const data = govEngine.getResources(provider, team, status);
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

// GET /api/v1/governance-center/evaluations (Viewer+)
router.get('/evaluations', (req: Request, res: Response) => {
  const policyId = req.query.policyId as string | undefined;
  const resourceId = req.query.resourceId as string | undefined;
  const data = govEngine.getEvaluations(policyId, resourceId);
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

// GET /api/v1/governance-center/violations (Viewer+)
router.get('/violations', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const severity = req.query.severity as string | undefined;
  const data = govEngine.getViolations(status, severity);
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

// GET /api/v1/governance-center/exceptions (Viewer+)
router.get('/exceptions', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const data = govEngine.getExceptions(status);
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

// POST /api/v1/governance-center/exceptions (Operator+)
router.post('/exceptions', requireRole('operator'), (req: Request, res: Response) => {
  try {
    const data = govEngine.requestException(req.body);
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
      error: { code: 'EXCEPTION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/governance-center/remediations (Viewer+)
router.get('/remediations', (_req: Request, res: Response) => {
  const data = govEngine.getRemediations();
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

// POST /api/v1/governance-center/remediations/:id/execute (Operator+)
router.post('/remediations/:id/execute', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = govEngine.executeRemediation(id, (req as any).user?.username);
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
      error: { code: 'REMEDIATION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/governance-center/evidence (Viewer+)
router.get('/evidence', (req: Request, res: Response) => {
  const policyId = req.query.policyId as string | undefined;
  const data = govEngine.getEvidence(policyId);
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

// GET /api/v1/governance-center/frameworks (Viewer+)
router.get('/frameworks', (_req: Request, res: Response) => {
  const data = govEngine.getFrameworkMappings();
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
