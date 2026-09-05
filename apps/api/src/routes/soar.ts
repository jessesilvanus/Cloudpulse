import { Router, Request, Response } from 'express';
import { SoarEngine } from '../services/soar-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const soarEngine = SoarEngine.getInstance();

// GET /api/v1/soar/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = soarEngine.getSoarSummary();
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

// GET /api/v1/soar/incidents (Viewer+)
router.get('/incidents', (req: Request, res: Response) => {
  const priority = req.query.priority as string | undefined;
  const severity = req.query.severity as string | undefined;
  const status = req.query.status as string | undefined;
  const data = soarEngine.getIncidents(priority, severity, status);
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

// GET /api/v1/soar/incidents/:id (Viewer+)
router.get('/incidents/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const incident = soarEngine.getIncidentById(id);
  if (!incident) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Incident '${id}' not found` },
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

// POST /api/v1/soar/incidents/:id/triage (Operator+)
router.post('/incidents/:id/triage', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = soarEngine.triageIncident(id);
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

// GET /api/v1/soar/playbooks (Viewer+)
router.get('/playbooks', (_req: Request, res: Response) => {
  const data = soarEngine.getPlaybooks();
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

// GET /api/v1/soar/playbooks/:id (Viewer+)
router.get('/playbooks/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const playbook = soarEngine.getPlaybookById(id);
  if (!playbook) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Playbook '${id}' not found` },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const response: ApiResponse<typeof playbook> = {
    ok: true,
    data: playbook,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

// POST /api/v1/soar/playbooks/:id/execute (Requires Operator+)
router.post('/playbooks/:id/execute', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { incidentId, dryRun, actor } = req.body;
  if (!incidentId) {
    return res.status(400).json({
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Missing required field: incidentId' },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  try {
    const data = soarEngine.executePlaybook(
      incidentId,
      id,
      Boolean(dryRun),
      actor || 'soar-operator@cloudpulse.internal'
    );
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
      error: { code: 'EXECUTION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/soar/actions (Viewer+)
router.get('/actions', (req: Request, res: Response) => {
  const incidentId = req.query.incidentId as string | undefined;
  const data = soarEngine.getActionExecutions(incidentId);
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

// GET /api/v1/soar/approvals (Viewer+)
router.get('/approvals', (_req: Request, res: Response) => {
  const data = soarEngine.getApprovalRequests();
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

// POST /api/v1/soar/approvals/:id/decide (Requires Admin)
router.post('/approvals/:id/decide', requireRole('admin'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { decision, approver, reason } = req.body;
  if (!decision || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
    return res.status(400).json({
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'decision must be APPROVED or REJECTED' },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  try {
    const data = soarEngine.decideApprovalRequest(
      id,
      decision,
      approver || 'security-commander@cloudpulse.internal',
      reason
    );
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
      error: { code: 'APPROVAL_ERROR', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/soar/pir (Viewer+)
router.get('/pir', (_req: Request, res: Response) => {
  const data = soarEngine.getPostIncidentReviews();
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

// GET /api/v1/soar/pir/:incidentId (Viewer+)
router.get('/pir/:incidentId', (req: Request, res: Response) => {
  const incidentId = req.params.incidentId as string;
  const pir = soarEngine.getPostIncidentReviewByIncidentId(incidentId);
  if (!pir) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Post-incident review for incident '${incidentId}' not found` },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const response: ApiResponse<typeof pir> = {
    ok: true,
    data: pir,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

// POST /api/v1/soar/pir (Requires Operator+)
router.post('/pir', requireRole('operator'), (req: Request, res: Response) => {
  const { incidentId, rootCause, trigger, impact, timeline, whatWorked, whatFailed, lessonsLearned, correctiveActions } = req.body;
  if (!incidentId || !rootCause || !trigger || !impact) {
    return res.status(400).json({
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Missing required PIR fields: incidentId, rootCause, trigger, impact' },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const pir = soarEngine.createPostIncidentReview({
    incidentId,
    rootCause,
    trigger,
    impact,
    timeline: timeline || [],
    whatWorked: whatWorked || [],
    whatFailed: whatFailed || [],
    lessonsLearned: lessonsLearned || [],
    correctiveActions: correctiveActions || []
  });

  const response: ApiResponse<typeof pir> = {
    ok: true,
    data: pir,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

export default router;
