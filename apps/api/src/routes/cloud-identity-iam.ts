import { Router, Request, Response } from 'express';
import { CloudIdentityIamEngine } from '../services/cloud-identity-iam-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const iamEngine = CloudIdentityIamEngine.getInstance();

// GET /api/v1/identity-iam/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = iamEngine.getSummary();
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

// GET /api/v1/identity-iam/identities (Viewer+)
router.get('/identities', (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  const risk = req.query.risk as string | undefined;
  const provider = req.query.provider as string | undefined;
  const data = iamEngine.getIdentities(type, risk, provider);
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

// GET /api/v1/identity-iam/identities/:id (Viewer+)
router.get('/identities/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = iamEngine.getIdentityById(id);
  if (!data) {
    return res.status(404).json({
      ok: false,
      error: { code: 'IDENTITY_NOT_FOUND', message: `Identity '${id}' not found.` },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
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

// GET /api/v1/identity-iam/roles (Viewer+)
router.get('/roles', (_req: Request, res: Response) => {
  const data = iamEngine.getRoles();
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

// GET /api/v1/identity-iam/policies (Viewer+)
router.get('/policies', (_req: Request, res: Response) => {
  const data = iamEngine.getPolicies();
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

// POST /api/v1/identity-iam/evaluate (Viewer+)
router.post('/evaluate', (req: Request, res: Response) => {
  const { identity, action, resource, context } = req.body;
  const data = iamEngine.evaluateAccess(identity, action, resource, context);
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

// GET /api/v1/identity-iam/access-requests (Viewer+)
router.get('/access-requests', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const data = iamEngine.getAccessRequests(status);
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

// POST /api/v1/identity-iam/access-requests (Viewer+)
router.post('/access-requests', (req: Request, res: Response) => {
  const { requester, resource, permission, reason, durationMinutes } = req.body;
  try {
    const data = iamEngine.createAccessRequest({ requester, resource, permission, reason, durationMinutes });
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
      error: { code: 'ACCESS_REQUEST_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/identity-iam/access-requests/:id/approve (Operator+)
router.post('/access-requests/:id/approve', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const approver = (req.body?.approver as string) || (req as any).user?.email || 'operator@enterprise.io';
  try {
    const data = iamEngine.approveAccessRequest(id, approver);
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
      error: { code: 'ACCESS_APPROVAL_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/identity-iam/access-requests/:id/deny (Operator+)
router.post('/access-requests/:id/deny', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const reason = req.body?.reason as string | undefined;
  try {
    const data = iamEngine.denyAccessRequest(id, reason);
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
      error: { code: 'ACCESS_DENIAL_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/identity-iam/least-privilege (Viewer+)
router.get('/least-privilege', (_req: Request, res: Response) => {
  const data = iamEngine.getLeastPrivilegeFindings();
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

// POST /api/v1/identity-iam/assistant (Viewer+)
router.post('/assistant', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'What is our current IAM risk posture?';
  const data = iamEngine.queryIamAssistant(prompt);
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
