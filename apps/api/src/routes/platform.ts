import { Router, Request, Response, type IRouter } from 'express';
import { RealCloudPulsePlatformEngine } from '../services/real-cloudpulse-platform-engine.js';
import { createRateLimiter } from '../middleware/platform-rate-limiter.js';
import { tenantIsolationGuard } from '../middleware/tenant-isolation.js';
import { requireRole, AuthenticatedRequest } from '../middleware/auth.js';

export const platformRouter: IRouter = Router();
const engine = RealCloudPulsePlatformEngine.getInstance();

// Apply rate limiting and tenant isolation across platform routes
platformRouter.use(createRateLimiter('DEFAULT'));
platformRouter.use(tenantIsolationGuard);

// ─── Platform Overview & Health ──────────────────────────────────────────────

platformRouter.get('/overview', (_req: Request, res: Response) => {
  const overview = engine.getOverview();
  res.json({
    ok: true,
    data: overview,
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

platformRouter.get('/health', (_req: Request, res: Response) => {
  const health = engine.getHealthSummary();
  res.json({
    ok: true,
    data: health,
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

platformRouter.get('/health/live', (_req: Request, res: Response) => {
  const live = engine.getLiveness();
  res.status(200).json(live);
});

platformRouter.get('/health/ready', (_req: Request, res: Response) => {
  const ready = engine.getReadiness();
  res.status(200).json(ready);
});

platformRouter.get('/health/dependencies', (_req: Request, res: Response) => {
  const deps = engine.getDependencyHealth();
  res.json({
    ok: true,
    data: deps,
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

// ─── Metrics & Internal Telemetry ───────────────────────────────────────────

platformRouter.get('/metrics', (_req: Request, res: Response) => {
  const metrics = engine.getMetrics();
  res.json({
    ok: true,
    data: metrics,
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

platformRouter.get('/slos', (_req: Request, res: Response) => {
  const slos = engine.getSlos();
  res.json({
    ok: true,
    data: slos,
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

// ─── Background Workers & DLQ ────────────────────────────────────────────────

platformRouter.get('/workers', (_req: Request, res: Response) => {
  const workers = engine.getWorkers();
  res.json({
    ok: true,
    data: workers,
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

platformRouter.get('/workers/dlq', (_req: Request, res: Response) => {
  const dlq = engine.getDlqJobs();
  res.json({
    ok: true,
    data: dlq,
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

platformRouter.post('/workers/dlq/:id/retry', requireRole('operator'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user?.email || 'operator@cloudpulse.internal';
  const jobId = (req.params['id'] || '') as string;
  const result = engine.retryDlqJob(jobId, actor);
  if (!result.success) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: result.message },
      meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
    });
  }
  res.json({
    ok: true,
    data: result,
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

// ─── Rate Limits & Circuit Breakers ─────────────────────────────────────────

platformRouter.get('/rate-limits', (_req: Request, res: Response) => {
  const status = engine.getRateLimitStatus();
  res.json({
    ok: true,
    data: status,
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

// ─── Platform Incidents & Maintenance ────────────────────────────────────────

platformRouter.get('/incidents', (_req: Request, res: Response) => {
  const incidents = engine.getIncidents();
  res.json({
    ok: true,
    data: incidents,
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

platformRouter.get('/maintenance', (_req: Request, res: Response) => {
  const maint = engine.getMaintenanceWindow();
  res.json({
    ok: true,
    data: maint,
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

platformRouter.post('/maintenance', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { title, reason, scope, startTime, endTime } = req.body;
  const createdBy = req.user?.email || 'admin@cloudpulse.internal';
  const scheduled = engine.scheduleMaintenanceWindow({
    title: title || 'Scheduled Platform Infrastructure Upgrade',
    reason: reason || 'Database minor version upgrade and index optimization',
    scope: scope || 'DATABASE_MIGRATION',
    status: 'SCHEDULED',
    startTime: startTime || new Date(Date.now() + 86400000).toISOString(),
    endTime: endTime || new Date(Date.now() + 86400000 + 7200000).toISOString(),
    createdBy
  });
  res.json({
    ok: true,
    data: scheduled,
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

platformRouter.delete('/maintenance', requireRole('admin'), (_req: AuthenticatedRequest, res: Response) => {
  engine.cancelMaintenanceWindow();
  res.json({
    ok: true,
    message: 'Active maintenance window cancelled.',
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

// ─── Platform Infrastructure Costs ──────────────────────────────────────────

platformRouter.get('/costs', (_req: Request, res: Response) => {
  const costs = engine.getCosts();
  res.json({
    ok: true,
    data: costs,
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' }
  });
});

export default platformRouter;
