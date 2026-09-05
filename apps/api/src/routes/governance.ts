import { Router, Request, Response } from 'express';
import { GovernanceEngine } from '../services/governance-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse, PolicySimulationRequest } from '@cloudpulse/shared';

const router: Router = Router();
const governanceEngine = GovernanceEngine.getInstance();

// GET /api/v1/governance/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = governanceEngine.getSummary();
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

// GET /api/v1/governance/identities (Viewer+)
router.get('/identities', (_req: Request, res: Response) => {
  const data = governanceEngine.getIdentities();
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

// GET /api/v1/governance/roles (Viewer+)
router.get('/roles', (_req: Request, res: Response) => {
  const data = governanceEngine.getRoles();
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

// GET /api/v1/governance/least-privilege (Viewer+)
router.get('/least-privilege', (_req: Request, res: Response) => {
  const data = governanceEngine.getLeastPrivilegeAnalysis();
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

// GET /api/v1/governance/policies (Viewer+)
router.get('/policies', (_req: Request, res: Response) => {
  const data = governanceEngine.getPolicies();
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

// POST /api/v1/governance/policies/simulate (Viewer+)
router.post('/policies/simulate', (req: Request, res: Response) => {
  const { identityId, resourceId, action, context } = req.body as PolicySimulationRequest;
  if (!identityId || !resourceId || !action) {
    return res.status(400).json({
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Missing required fields: identityId, resourceId, action' },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const data = governanceEngine.simulatePolicy({ identityId, resourceId, action, context });
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

// GET /api/v1/governance/violations (Viewer+)
router.get('/violations', (_req: Request, res: Response) => {
  const data = governanceEngine.getViolations();
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

// GET /api/v1/governance/access-reviews (Viewer+)
router.get('/access-reviews', (_req: Request, res: Response) => {
  const data = governanceEngine.getAccessReviews();
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

// POST /api/v1/governance/access-reviews/:id/decision (Requires Operator+)
router.post('/access-reviews/:id/decision', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { decision, reviewer } = req.body;
  if (!decision || (decision !== 'approved' && decision !== 'revoked')) {
    return res.status(400).json({
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'decision must be approved or revoked' },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  try {
    const updated = governanceEngine.updateAccessReviewDecision(id, decision, reviewer || 'operator@cloudpulse.local');
    const response: ApiResponse<typeof updated> = {
      ok: true,
      data: updated,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
    return res.json(response);
  } catch (err: any) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/governance/access-requests (Viewer+)
router.get('/access-requests', (_req: Request, res: Response) => {
  const data = governanceEngine.getAccessRequests();
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

// POST /api/v1/governance/access-requests (Requires Viewer+)
router.post('/access-requests', (req: Request, res: Response) => {
  const { requester, resource, requestedRoleOrPermission, reason, durationMinutes } = req.body;
  if (!requester || !resource || !requestedRoleOrPermission || !reason) {
    return res.status(400).json({
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Missing required access request fields' },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const created = governanceEngine.createAccessRequest(
    requester,
    resource,
    requestedRoleOrPermission,
    reason,
    durationMinutes || 60
  );

  const response: ApiResponse<typeof created> = {
    ok: true,
    data: created,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

// POST /api/v1/governance/access-requests/:id/approve (Requires Admin)
router.post('/access-requests/:id/approve', requireRole('admin'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { approver } = req.body;
  try {
    const approved = governanceEngine.approveAccessRequest(id, approver || 'admin@cloudpulse.local');
    const response: ApiResponse<typeof approved> = {
      ok: true,
      data: approved,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
    return res.json(response);
  } catch (err: any) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/governance/platform-summary (Viewer+)
router.get('/platform-summary', (_req: Request, res: Response) => {
  const data = governanceEngine.getPlatformSummary();
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

// GET /api/v1/governance/policies/catalog (Viewer+)
router.get('/policies/catalog', (_req: Request, res: Response) => {
  const data = governanceEngine.getGovernancePolicies();
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

// GET /api/v1/governance/evidence (Viewer+)
router.get('/evidence', (_req: Request, res: Response) => {
  const data = governanceEngine.getComplianceEvidence();
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

// GET /api/v1/governance/findings (Viewer+)
router.get('/findings', (_req: Request, res: Response) => {
  const data = governanceEngine.getComplianceFindings();
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

// GET /api/v1/governance/exceptions (Viewer+)
router.get('/exceptions', (_req: Request, res: Response) => {
  const data = governanceEngine.getPolicyExceptions();
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

// GET /api/v1/governance/remediations (Viewer+)
router.get('/remediations', (_req: Request, res: Response) => {
  const data = governanceEngine.getRemediationActions();
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

// POST /api/v1/governance/remediations/:id/approve (Requires Operator+)
router.post('/remediations/:id/approve', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { approver } = req.body;
  try {
    const data = governanceEngine.approveRemediationAction(id, approver || 'operator@cloudpulse.local');
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
      error: { code: 'NOT_FOUND', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/governance/scans (Viewer+)
router.get('/scans', (_req: Request, res: Response) => {
  const data = governanceEngine.getComplianceScans();
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

// POST /api/v1/governance/scans/trigger (Requires Operator+)
router.post('/scans/trigger', requireRole('operator'), (req: Request, res: Response) => {
  const { scope } = req.body;
  const data = governanceEngine.triggerComplianceScan(scope || 'all');
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

// GET /api/v1/governance/frameworks (Viewer+)
router.get('/frameworks', (_req: Request, res: Response) => {
  const data = governanceEngine.getComplianceFrameworks();
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

