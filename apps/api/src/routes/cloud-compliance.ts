import { Router, Request, Response } from 'express';
import { CloudComplianceEngine } from '../services/cloud-compliance-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const complianceEngine = CloudComplianceEngine.getInstance();

// GET /api/v1/compliance-governance/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = complianceEngine.getSummary();
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

// GET /api/v1/compliance-governance/frameworks (Viewer+)
router.get('/frameworks', (_req: Request, res: Response) => {
  const data = complianceEngine.getFrameworks();
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

// GET /api/v1/compliance-governance/controls (Viewer+)
router.get('/controls', (req: Request, res: Response) => {
  const frameworkId = req.query.frameworkId as string | undefined;
  const domain = req.query.domain as string | undefined;
  const data = complianceEngine.getControls(frameworkId, domain);
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

// GET /api/v1/compliance-governance/policies (Viewer+)
router.get('/policies', (req: Request, res: Response) => {
  const domain = req.query.domain as string | undefined;
  const data = complianceEngine.getPolicies(domain);
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

// POST /api/v1/compliance-governance/policies/evaluate (Viewer+)
router.post('/policies/evaluate', (req: Request, res: Response) => {
  const { policyId, resource } = req.body;
  try {
    const data = complianceEngine.evaluatePolicy(policyId, resource);
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
      error: { code: 'EVALUATION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/compliance-governance/policies/simulate (Viewer+)
router.post('/policies/simulate', (req: Request, res: Response) => {
  const { policyId, newMode } = req.body;
  try {
    const data = complianceEngine.simulatePolicyImpact(policyId, newMode || 'BLOCKING');
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

// GET /api/v1/compliance-governance/findings (Viewer+)
router.get('/findings', (req: Request, res: Response) => {
  const severity = req.query.severity as string | undefined;
  const status = req.query.status as string | undefined;
  const data = complianceEngine.getFindings(severity, status);
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

// GET /api/v1/compliance-governance/findings/:id/evidence (Viewer+)
router.get('/findings/:id/evidence', (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = complianceEngine.getEvidenceChain(id);
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
      error: { code: 'FINDING_NOT_FOUND', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/compliance-governance/findings/:id/remediate (Operator+)
router.post('/findings/:id/remediate', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = complianceEngine.remediateFinding(id);
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
      error: { code: 'REMEDIATION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/compliance-governance/exceptions (Viewer+)
router.get('/exceptions', (_req: Request, res: Response) => {
  const data = complianceEngine.getExceptions();
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

// POST /api/v1/compliance-governance/exceptions (Operator+)
router.post('/exceptions', requireRole('operator'), (req: Request, res: Response) => {
  const { policyId, resourceId, scope, reason, expiresAt, compensatingControl } = req.body;
  const requester = (req as any).user?.email || 'security-operator@enterprise.io';
  const approver = 'ciso-office@enterprise.io';
  try {
    const data = complianceEngine.createException({
      policyId,
      resourceId,
      scope,
      reason,
      requester,
      approver,
      expiresAt: expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
      compensatingControl
    });
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
      error: { code: 'EXCEPTION_CREATION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/compliance-governance/assistant (Viewer+)
router.post('/assistant', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'What is our current compliance posture across CIS and NIST frameworks?';
  const data = complianceEngine.queryComplianceAssistant(prompt);
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
