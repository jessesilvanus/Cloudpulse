import { Router, Request, Response } from 'express';
import { RealGlobalCommandCenterEngine } from '../services/real-global-command-center-engine.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const engine = RealGlobalCommandCenterEngine.getInstance();

// GET /api/v1/global-command-center/overview
router.get('/overview', (req: Request, res: Response) => {
  const workspaceId = req.query.workspaceId as string | undefined;
  const data = engine.getOverview(workspaceId);
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

// GET /api/v1/global-command-center/situations
router.get('/situations', (req: Request, res: Response) => {
  const filters: any = {};
  if (req.query.severity) filters.severity = req.query.severity;
  if (req.query.priority) filters.priority = req.query.priority;
  if (req.query.category) filters.category = req.query.category;
  if (req.query.status) filters.status = req.query.status;
  if (req.query.provider) filters.provider = String(req.query.provider);

  const data = engine.getSituations(filters);
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

// GET /api/v1/global-command-center/situations/:id
router.get('/situations/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = engine.getSituationById(id);
  if (!data) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Situation with ID '${id}' not found.` },
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

// GET /api/v1/global-command-center/risk-heatmap
router.get('/risk-heatmap', (_req: Request, res: Response) => {
  const data = engine.getRiskHeatmap();
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

// GET /api/v1/global-command-center/health
router.get('/health', (_req: Request, res: Response) => {
  const data = engine.getGlobalHealth();
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

// GET /api/v1/global-command-center/coverage
router.get('/coverage', (_req: Request, res: Response) => {
  const data = engine.getCoverage();
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

// GET /api/v1/global-command-center/freshness
router.get('/freshness', (_req: Request, res: Response) => {
  const data = engine.getFreshness();
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

// GET /api/v1/global-command-center/decisions
router.get('/decisions', (req: Request, res: Response) => {
  const filters: any = {};
  if (req.query.domain) filters.domain = req.query.domain;
  if (req.query.status) filters.status = req.query.status;
  if (req.query.priority) filters.priority = req.query.priority;

  const data = engine.getDecisions(filters);
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

// POST /api/v1/global-command-center/decisions/:id/action
router.post('/decisions/:id/action', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const action = req.body?.action as 'APPROVE' | 'REJECT' | 'EXECUTE' | 'DISMISS';
  const actor = req.body?.actor || 'executive.operator@cloudpulse.io';
  const reason = req.body?.reason;

  if (!action || !['APPROVE', 'REJECT', 'EXECUTE', 'DISMISS'].includes(action)) {
    return res.status(400).json({
      ok: false,
      error: { code: 'INVALID_ACTION', message: 'Valid action must be APPROVE, REJECT, EXECUTE, or DISMISS.' },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  try {
    const data = engine.executeDecisionAction(id, action, actor, reason);
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
      error: { code: 'ACTION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/global-command-center/search
router.get('/search', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const data = engine.searchGlobal(query);
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

// GET /api/v1/global-command-center/reports
router.get('/reports', (_req: Request, res: Response) => {
  const data = engine.getReports();
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

// POST /api/v1/global-command-center/reports/generate
router.post('/reports/generate', (req: Request, res: Response) => {
  const reportType = req.body?.type || 'DAILY_EXECUTIVE_BRIEFING';
  const data = engine.generateReport(reportType);
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

// POST /api/v1/global-command-center/ai-analyst
router.post('/ai-analyst', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'What is our current estate health and top critical situations?';
  const data = engine.queryAiAnalyst(prompt);
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
