import { Router, Request, Response } from 'express';
import { SreEngine } from '../services/sre-engine.js';
import { SreReliabilityControlEngine } from '../services/sre-reliability-control-engine.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const sreEngine = SreEngine.getInstance();
const controlEngine = SreReliabilityControlEngine.getInstance();

// ─── PHASE 63: SRE & RELIABILITY CONTROL PLANE ROUTES ────────────────────────

// GET /api/v1/sre/overview
router.get('/overview', (req: Request, res: Response) => {
  const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
  const data = controlEngine.getPlatformSummary(workspaceId);
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

// GET /api/v1/sre/services
router.get('/services', (req: Request, res: Response) => {
  const workspaceId = req.headers['x-workspace-id'] as string | undefined;
  const tier = req.query.tier as string | undefined;
  const health = req.query.health as string | undefined;
  const data = controlEngine.getServices(workspaceId, tier, health);
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

// GET /api/v1/sre/services/:serviceId
router.get('/services/:serviceId', (req: Request, res: Response) => {
  const serviceId = req.params.serviceId as string;
  const data = controlEngine.getServiceDetail(serviceId);
  if (!data) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Cloud service '${serviceId}' not found in SRE catalog` },
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

// GET /api/v1/sre/slis
router.get('/slis', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = controlEngine.getSlis(serviceId);
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

// GET /api/v1/sre/slos
router.get('/slos', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const status = req.query.status as string | undefined;
  const data = controlEngine.getSlos(serviceId, status);
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

// GET /api/v1/sre/slos/:sloId
router.get('/slos/:sloId', (req: Request, res: Response) => {
  const sloId = req.params.sloId as string;
  const data = controlEngine.getSloById(sloId);
  if (!data) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `SLO '${sloId}' not found` },
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

// GET /api/v1/sre/error-budgets
router.get('/error-budgets', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = controlEngine.getErrorBudgets(serviceId);
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

// GET /api/v1/sre/dependencies
router.get('/dependencies', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = controlEngine.getDependencies(serviceId);
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

// GET /api/v1/sre/cascading-risks
router.get('/cascading-risks', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = controlEngine.getCascadingRisks(serviceId);
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

// GET /api/v1/sre/spofs
router.get('/spofs', (_req: Request, res: Response) => {
  const data = controlEngine.getSpofs();
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

// GET /api/v1/sre/failure-domains
router.get('/failure-domains', (_req: Request, res: Response) => {
  const data = controlEngine.getFailureDomainAnalysis();
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

// GET /api/v1/sre/changes/correlations
router.get('/changes/correlations', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = controlEngine.getChangeCorrelations(serviceId);
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

// GET /api/v1/sre/capacity
router.get('/capacity', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = controlEngine.getCapacityIntelligence(serviceId);
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

// POST /api/v1/sre/release-guard/evaluate
router.post('/release-guard/evaluate', (req: Request, res: Response) => {
  const { serviceId, proposedVersion, changeType } = req.body;
  if (!serviceId) {
    return res.status(400).json({
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Missing required parameter serviceId' },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const data = controlEngine.evaluateReleaseRisk({ serviceId, proposedVersion, changeType });
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

// POST /api/v1/sre/remediation/verify
router.post('/remediation/verify', (req: Request, res: Response) => {
  const { serviceId, actionId, incidentId } = req.body;
  if (!serviceId) {
    return res.status(400).json({
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Missing required parameter serviceId' },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const data = controlEngine.verifyRemediationRecovery({ serviceId, actionId, incidentId });
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

// POST /api/v1/sre/investigate
router.post('/investigate', (req: Request, res: Response) => {
  const { prompt, serviceId } = req.body;
  if (!prompt) {
    return res.status(400).json({
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Missing required parameter prompt' },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const data = controlEngine.investigate(prompt, serviceId);
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

// ─── LEGACY SRE COMPATIBILITY ROUTES ──────────────────────────────────────────

// GET /api/v1/sre/metrics
router.get('/metrics', (_req: Request, res: Response) => {
  const data = sreEngine.getSreMetrics();
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

// GET /api/v1/sre/runbooks
router.get('/runbooks', (_req: Request, res: Response) => {
  const data = sreEngine.getRunbooks();
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

// GET /api/v1/sre/runbooks/:id
router.get('/runbooks/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const runbook = sreEngine.getRunbookById(id);
  if (!runbook) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Runbook '${id}' not found` },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const response: ApiResponse<typeof runbook> = {
    ok: true,
    data: runbook,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

// GET /api/v1/sre/remediations
router.get('/remediations', (_req: Request, res: Response) => {
  const data = {
    actions: sreEngine.getRemediations(),
    auditLog: sreEngine.getRemediationAuditLog()
  };
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

// POST /api/v1/sre/remediations/execute
router.post('/remediations/execute', (req: Request, res: Response) => {
  const { actionId, triggeredBy } = req.body;
  if (!actionId) {
    return res.status(400).json({
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'Missing required field actionId' },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  try {
    const logEntry = sreEngine.executeRemediation(actionId, triggeredBy || 'sre_operator');
    const response: ApiResponse<typeof logEntry> = {
      ok: true,
      data: logEntry,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
    return res.json(response);
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: { code: 'REMEDIATION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/sre/postmortems
router.get('/postmortems', (_req: Request, res: Response) => {
  const data = sreEngine.getPostmortems();
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

// GET /api/v1/sre/postmortems/:id
router.get('/postmortems/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const postmortem = sreEngine.getPostmortemById(id);
  if (!postmortem) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Postmortem '${id}' not found` },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const response: ApiResponse<typeof postmortem> = {
    ok: true,
    data: postmortem,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

// GET /api/v1/sre/deployments
router.get('/deployments', (_req: Request, res: Response) => {
  const data = sreEngine.getDeployments();
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

// GET /api/v1/sre/notifications
router.get('/notifications', (_req: Request, res: Response) => {
  const data = sreEngine.getNotificationChannels();
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
