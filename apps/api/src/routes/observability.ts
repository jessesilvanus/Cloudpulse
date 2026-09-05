import { Router, Request, Response } from 'express';
import { ObservabilityEngine } from '../services/observability-engine.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const observabilityEngine = ObservabilityEngine.getInstance();

// GET /api/v1/observability/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = observabilityEngine.getSummary();
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

// GET /api/v1/observability/traces (Viewer+, with pagination & filtering)
router.get('/traces', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const service = req.query.service as string | undefined;
  const status = req.query.status as string | undefined;

  const data = observabilityEngine.getTraces(page, limit, service, status);
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

// GET /api/v1/observability/traces/:id (Viewer+)
router.get('/traces/:id', (req: Request, res: Response) => {
  const traceId = req.params.id as string;
  const data = observabilityEngine.getTraceById(traceId);
  if (!data) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Trace '${traceId}' not found` },
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

// GET /api/v1/observability/service-map (Viewer+)
router.get('/service-map', (_req: Request, res: Response) => {
  const data = observabilityEngine.getServiceDependencyGraph();
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

// GET /api/v1/observability/red-metrics (Viewer+)
router.get('/red-metrics', (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const data = observabilityEngine.getRedMetrics(service);
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

// GET /api/v1/observability/use-metrics (Viewer+)
router.get('/use-metrics', (_req: Request, res: Response) => {
  const data = observabilityEngine.getUseMetrics();
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

// GET /api/v1/observability/root-cause (Viewer+)
router.get('/root-cause', (_req: Request, res: Response) => {
  const data = observabilityEngine.getRootCauseHypotheses();
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

// GET /api/v1/observability/quality (Viewer+)
router.get('/quality', (_req: Request, res: Response) => {
  const data = observabilityEngine.getTelemetryQualityScore();
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
