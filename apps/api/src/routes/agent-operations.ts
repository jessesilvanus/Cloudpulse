import { Router, Request, Response } from 'express';
import { AgenticOperationsEngine } from '../services/agentic-operations-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const agentEngine = AgenticOperationsEngine.getInstance();

// GET /api/v1/agent-operations/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = agentEngine.getSummary();
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

// GET /api/v1/agent-operations/sessions (Viewer+)
router.get('/sessions', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const data = agentEngine.getSessions(status);
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

// POST /api/v1/agent-operations/sessions (Operator+)
router.post('/sessions', requireRole('operator'), (req: Request, res: Response) => {
  try {
    const data = agentEngine.createSession(req.body);
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
      error: { code: 'SESSION_CREATE_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/agent-operations/tasks (Viewer+)
router.get('/tasks', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined;
  const data = agentEngine.getTasks(sessionId);
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

// GET /api/v1/agent-operations/plans (Viewer+)
router.get('/plans', (req: Request, res: Response) => {
  const taskId = req.query.taskId as string | undefined;
  const data = agentEngine.getPlans(taskId);
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

// POST /api/v1/agent-operations/plans/:id/simulate (Viewer+)
router.post('/plans/:id/simulate', (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = agentEngine.simulatePlan(id);
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
      error: { code: 'PLAN_SIMULATION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/agent-operations/approvals (Viewer+)
router.get('/approvals', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const data = agentEngine.getApprovals(status);
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

// POST /api/v1/agent-operations/approvals/:id/approve (Operator+)
router.post('/approvals/:id/approve', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const approver = (req as any).user?.username || 'sre-lead-02';
  try {
    const data = agentEngine.approveAction(id, approver);
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

// POST /api/v1/agent-operations/approvals/:id/reject (Operator+)
router.post('/approvals/:id/reject', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const approver = (req as any).user?.username || 'sre-lead-02';
  const reason = req.body?.reason || 'Rejected by operational authority';
  try {
    const data = agentEngine.rejectAction(id, approver, reason);
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
      error: { code: 'REJECT_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/agent-operations/actions/:id/execute (Operator+)
router.post('/actions/:id/execute', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const operator = (req as any).user?.username || 'sre-lead-02';
  try {
    const data = agentEngine.executeAction(id, operator);
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
      error: { code: 'EXECUTION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/agent-operations/verifications (Viewer+)
router.get('/verifications', (req: Request, res: Response) => {
  const actionId = req.query.actionId as string | undefined;
  const data = agentEngine.getVerifications(actionId);
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

// GET /api/v1/agent-operations/audit (Viewer+)
router.get('/audit', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined;
  const data = agentEngine.getAuditTrail(sessionId);
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

// POST /api/v1/agent-operations/query (Viewer+)
router.post('/query', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'System Health Summary';
  const context = req.body?.context;
  const data = agentEngine.queryAgent(prompt, context);
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
