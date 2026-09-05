import { Router, Request, Response } from 'express';
import { SecurityEngine } from '../services/security-engine.js';
import { realCloudSecurityEngine } from '../services/real-cloud-security-engine.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { ApiResponse, User } from '@cloudpulse/shared';

const router: Router = Router();
const securityEngine = SecurityEngine.getInstance();

// ─── 1. ZERO-TRUST SECURITY SCORECARD & EXECUTIVE OVERVIEW ────────────────────
router.get(['/scorecard', '/overview', '/summary'], async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudSecurityEngine.getScorecard(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 2. UNIFIED IDENTITIES & DIRECTORY ────────────────────────────────────────
router.get('/identities', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const { provider, type, risk, search } = req.query;
    const data = await realCloudSecurityEngine.getIdentities(workspaceId, {
      provider: provider as string,
      type: type as string,
      risk: risk as string,
      search: search as string
    });
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/identities/:id', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const identity = await realCloudSecurityEngine.getIdentityById(req.params.id!, workspaceId);
    if (!identity) {
      return res.status(404).json({ ok: false, error: `Identity '${req.params.id}' not found.` });
    }
    return res.json({
      ok: true,
      data: identity,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 3. EFFECTIVE ACCESS & RELATIONSHIP GRAPH ─────────────────────────────────
router.get('/effective-access', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudSecurityEngine.getEffectiveAccess(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/relationships', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudSecurityEngine.getAccessRelationships(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 4. HIGH-RISK ACCESS PATHS & PUBLIC EXPOSURE ──────────────────────────────
router.get('/paths/high-risk', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudSecurityEngine.getHighRiskAccessPaths(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/exposure/public', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudSecurityEngine.getPublicExposures(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 5. CONTROL EFFECTIVENESS ────────────────────────────────────────────────
router.get('/control-effectiveness', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudSecurityEngine.getControlEffectiveness(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 6. ACCESS REVIEWS & EXCEPTIONS ──────────────────────────────────────────
router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudSecurityEngine.getAccessReviews(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/reviews', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const { title, scope, reviewer, dueAt, identities } = req.body;
    if (!title || !reviewer || !dueAt || !identities) {
      return res.status(400).json({ ok: false, error: 'title, reviewer, dueAt, and identities are required.' });
    }
    const data = await realCloudSecurityEngine.createAccessReview(workspaceId, {
      title,
      scope: scope || 'PRIVILEGED_IDENTITIES',
      reviewer,
      dueAt,
      identities
    });
    return res.status(201).json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/exceptions', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudSecurityEngine.getExceptions(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/exceptions', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const { findingOrPolicyId, identityOrResourceId, reason, owner, approvedBy, compensatingControls, expiresAt } = req.body;
    if (!findingOrPolicyId || !identityOrResourceId || !reason || !owner) {
      return res.status(400).json({ ok: false, error: 'findingOrPolicyId, identityOrResourceId, reason, and owner are required.' });
    }
    const data = await realCloudSecurityEngine.createException(workspaceId, {
      findingOrPolicyId,
      identityOrResourceId,
      reason,
      owner,
      approvedBy: approvedBy || 'charlie.admin@enterprise.io',
      compensatingControls: compensatingControls || [],
      expiresAt: expiresAt || new Date(Date.now() + 30 * 86400000).toISOString()
    });
    return res.status(201).json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 7. WHAT-IF SECURITY SIMULATOR ───────────────────────────────────────────
router.post('/what-if/simulate', (req: Request, res: Response) => {
  try {
    const { actionType, targetEntityId, proposedChange } = req.body;
    if (!actionType || !targetEntityId) {
      return res.status(400).json({ ok: false, error: 'actionType and targetEntityId are required.' });
    }
    const data = realCloudSecurityEngine.simulateWhatIf({
      actionType,
      targetEntityId,
      proposedChange: proposedChange || 'Refactor security policy'
    });
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 8. AI ZERO-TRUST SECURITY ANALYST ────────────────────────────────────────
router.post(['/ai-analyst', '/ai-copilot', '/investigate'], async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'prompt is required.' });
    }
    const data = await realCloudSecurityEngine.investigate(prompt, workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v66' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── LEGACY ROUTES ────────────────────────────────────────────────────────────

// GET /api/v1/security/posture (Viewer+)
router.get('/posture', (_req: AuthenticatedRequest, res: Response) => {
  const data = securityEngine.getSecurityPosture();
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

// GET /api/v1/security/findings (Viewer+)
router.get('/findings', (_req: AuthenticatedRequest, res: Response) => {
  const data = securityEngine.getFindings();
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

// GET /api/v1/security/findings/:id (Viewer+)
router.get('/findings/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const finding = securityEngine.getFindingById(id);
  if (!finding) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Security finding '${id}' not found` },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const response: ApiResponse<typeof finding> = {
    ok: true,
    data: finding,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

// PATCH /api/v1/security/findings/:id (Requires Operator+)
router.patch('/findings/:id', requireRole('operator'), (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Missing required field: status' },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  try {
    const updated = securityEngine.updateFindingStatus(id, status, req.user?.email || 'anonymous');
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

// GET /api/v1/security/audit-log (Viewer+)
router.get('/audit-log', (_req: AuthenticatedRequest, res: Response) => {
  const data = securityEngine.getAuditLog();
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

// GET /api/v1/security/runbooks (Viewer+)
router.get('/runbooks', (_req: AuthenticatedRequest, res: Response) => {
  const data = securityEngine.getSecurityRunbooks();
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

// GET /api/v1/security/compliance (Viewer+)
router.get('/compliance', (_req: AuthenticatedRequest, res: Response) => {
  const data = securityEngine.getComplianceControls();
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

// GET /api/v1/security/soc-summary (Viewer+)
router.get('/soc-summary', (_req: AuthenticatedRequest, res: Response) => {
  const data = securityEngine.getCloudSocSummary();
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

// GET /api/v1/security/events (Viewer+)
router.get('/events', (req: AuthenticatedRequest, res: Response) => {
  const source = req.query.source as string | undefined;
  const severity = req.query.severity as string | undefined;
  const data = securityEngine.getSecurityEvents(source, severity);
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

// GET /api/v1/security/detection-rules (Viewer+)
router.get('/detection-rules', (_req: AuthenticatedRequest, res: Response) => {
  const data = securityEngine.getDetectionRules();
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

// GET /api/v1/security/sequences (Viewer+)
router.get('/sequences', (_req: AuthenticatedRequest, res: Response) => {
  const data = securityEngine.getSecuritySequences();
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

// GET /api/v1/security/incidents (Viewer+)
router.get('/incidents', (_req: AuthenticatedRequest, res: Response) => {
  const data = securityEngine.getSecurityIncidents();
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

// GET /api/v1/security/incidents/:id (Viewer+)
router.get('/incidents/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const incident = securityEngine.getSecurityIncidentById(id);
  if (!incident) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Security incident '${id}' not found` },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const response: ApiResponse<typeof incident> = {
    ok: true,
    data: incident,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

// POST /api/v1/security/auth/login (Simulated Token Generator)
router.post('/auth/login', (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.body;
  const selectedRole = role === 'admin' ? 'admin' : role === 'operator' ? 'operator' : 'viewer';
  const token = `${selectedRole}-token`;

  const user: User = {
    id: `usr-${selectedRole}-01`,
    email: `${selectedRole}@cloudpulse.internal`,
    name: `${selectedRole.toUpperCase()} User`,
    role: selectedRole,
    createdAt: new Date().toISOString()
  };

  const response: ApiResponse<{ token: string; user: User }> = {
    ok: true,
    data: {
      token,
      user
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// GET /api/v1/security/auth/me (Current Authenticated User)
router.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  const response: ApiResponse<{ user: User }> = {
    ok: true,
    data: {
      user: req.user!
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

export default router;

