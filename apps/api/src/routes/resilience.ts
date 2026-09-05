import { Router, Request, Response } from 'express';
import { ResilienceEngine } from '../services/resilience-engine.js';
import { realCloudResilienceEngine } from '../services/real-cloud-resilience-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const resilienceEngine = ResilienceEngine.getInstance();

// ─── 1. ZERO-DOWNTIME SCORECARD & EXECUTIVE OVERVIEW ─────────────────────────
router.get(['/scorecard', '/overview'], async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudResilienceEngine.getScorecard(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v67' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 2. CLOUD RESILIENCE PROFILES ─────────────────────────────────────────────
router.get('/profiles', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudResilienceEngine.getProfiles(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v67' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/profiles/:serviceId', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const profile = await realCloudResilienceEngine.getProfileByServiceId(req.params.serviceId!, workspaceId);
    if (!profile) {
      return res.status(404).json({ ok: false, error: `Resilience profile for service '${req.params.serviceId}' not found.` });
    }
    return res.json({
      ok: true,
      data: profile,
      meta: { timestamp: new Date().toISOString(), version: 'v67' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 3. FAILURE DOMAINS & SINGLE POINTS OF FAILURE ────────────────────────────
router.get('/failure-domains', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudResilienceEngine.getFailureDomains(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v67' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/spofs', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudResilienceEngine.getSpofs(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v67' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 4. MULTI-CLOUD BACKUP INVENTORY & HEALTH ─────────────────────────────────
router.get('/backups', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudResilienceEngine.getBackups(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v67' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 5. RECOVERY PLANS & DRILLS ───────────────────────────────────────────────
router.get('/recovery-plans', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudResilienceEngine.getRecoveryPlans(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v67' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/recovery-plans', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const { name, scope, scenarioType, targetRtoMinutes, targetRpoMinutes, owner, steps, recoverySteps } = req.body;
    if (!name || !scenarioType || targetRtoMinutes === undefined || targetRpoMinutes === undefined) {
      return res.status(400).json({ ok: false, error: 'name, scenarioType, targetRtoMinutes, and targetRpoMinutes are required.' });
    }
    const data = await realCloudResilienceEngine.createRecoveryPlan(workspaceId, {
      name,
      scope: scope || 'multi-cloud-production',
      scenarioType,
      targetRtoMinutes: Number(targetRtoMinutes),
      targetRpoMinutes: Number(targetRpoMinutes),
      owner: owner || 'SRE Operations Team',
      steps: steps || recoverySteps || []
    });
    return res.status(201).json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v67' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/drills', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudResilienceEngine.getDrills(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v67' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/drills', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const { name, scenarioType, scope, hypothesis, safetyControls, observedRtoMinutes, observedRpoMinutes, lessonsLearned, verifiedBy } = req.body;
    if (!name || !scenarioType || !scope || !hypothesis || !verifiedBy) {
      return res.status(400).json({ ok: false, error: 'name, scenarioType, scope, hypothesis, and verifiedBy are required.' });
    }
    const data = await realCloudResilienceEngine.recordDrill(workspaceId, {
      name,
      scenarioType,
      scope,
      hypothesis,
      safetyControls: safetyControls || [],
      observedRtoMinutes: Number(observedRtoMinutes || 0),
      observedRpoMinutes: Number(observedRpoMinutes || 0),
      lessonsLearned: lessonsLearned || [],
      verifiedBy
    });
    return res.status(201).json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v67' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 6. BUSINESS CONTINUITY MAPPING ──────────────────────────────────────────
router.get('/business-continuity', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realCloudResilienceEngine.getBusinessContinuity(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v67' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 7. WHAT-IF RESILIENCE SIMULATOR ─────────────────────────────────────────
router.post('/what-if/simulate', (req: Request, res: Response) => {
  try {
    const { scenario, targetFailureDomainOrResource, affectedFailureDomainIds, affectedServiceIds, failureTrigger } = req.body;
    const target = targetFailureDomainOrResource || (affectedFailureDomainIds && affectedFailureDomainIds[0]) || 'fd-aws-us-east-1a';
    const sc = scenario || 'AZ_OUTAGE';
    const data = realCloudResilienceEngine.simulateWhatIf({
      scenario: sc,
      targetFailureDomainOrResource: target,
      affectedFailureDomainIds,
      affectedServiceIds,
      failureTrigger
    });
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v67' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 8. AI RESILIENCE ANALYST ────────────────────────────────────────────────
router.post(['/ai-analyst', '/ai-copilot', '/investigate'], async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'prompt is required.' });
    }
    const data = await realCloudResilienceEngine.investigate(prompt, workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v67' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── LEGACY ROUTES ────────────────────────────────────────────────────────────

// GET /api/v1/resilience/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = resilienceEngine.getSummary();
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

// GET /api/v1/resilience/dependencies (Viewer+)
router.get('/dependencies', (_req: Request, res: Response) => {
  const data = resilienceEngine.getDependencies();
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

// GET /api/v1/resilience/spof (Viewer+)
router.get('/spof', (_req: Request, res: Response) => {
  const data = resilienceEngine.getSpofs();
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

// GET /api/v1/resilience/rto-rpo (Viewer+)
router.get('/rto-rpo', (_req: Request, res: Response) => {
  const data = resilienceEngine.getRtoRpoMetrics();
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

// GET /api/v1/resilience/scenarios (Viewer+)
router.get('/scenarios', (_req: Request, res: Response) => {
  const data = resilienceEngine.getScenarios();
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

// POST /api/v1/resilience/scenarios/:id/simulate (Requires Operator+)
router.post('/scenarios/:id/simulate', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const execution = resilienceEngine.executeSimulation(id);
    const response: ApiResponse<typeof execution> = {
      ok: true,
      data: execution,
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

// GET /api/v1/resilience/history (Viewer+)
router.get('/history', (_req: Request, res: Response) => {
  const data = resilienceEngine.getExecutionHistory();
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

// GET /api/v1/resilience/chaos-summary (Viewer+)
router.get('/chaos-summary', (_req: Request, res: Response) => {
  const data = resilienceEngine.getChaosLabSummary();
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

// GET /api/v1/resilience/experiments (Viewer+)
router.get('/experiments', (_req: Request, res: Response) => {
  const data = resilienceEngine.getChaosExperiments();
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

// POST /api/v1/resilience/experiments/:id/execute (Requires Operator+)
router.post('/experiments/:id/execute', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const experiment = resilienceEngine.executeChaosExperiment(id);
    const response: ApiResponse<typeof experiment> = {
      ok: true,
      data: experiment,
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

// GET /api/v1/resilience/runbooks (Viewer+)
router.get('/runbooks', (_req: Request, res: Response) => {
  const data = resilienceEngine.getRunbooks();
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


