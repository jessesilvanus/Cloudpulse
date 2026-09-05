import { Router, Request, Response } from 'express';
import { IntelligenceEngine } from '../services/intelligence-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const intelligenceEngine = IntelligenceEngine.getInstance();

// GET /api/v1/intelligence/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = intelligenceEngine.getSummary();
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

// GET /api/v1/intelligence/anomalies (Viewer+)
router.get('/anomalies', (_req: Request, res: Response) => {
  const data = intelligenceEngine.getAnomalies();
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

// GET /api/v1/intelligence/forecasts/capacity (Viewer+)
router.get('/forecasts/capacity', (_req: Request, res: Response) => {
  const data = intelligenceEngine.getCapacityForecasts();
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

// GET /api/v1/intelligence/forecasts/slo-risk (Viewer+)
router.get('/forecasts/slo-risk', (_req: Request, res: Response) => {
  const data = intelligenceEngine.getSloRisks();
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

// GET /api/v1/intelligence/incidents/:id/root-cause (Viewer+)
router.get('/incidents/:id/root-cause', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = intelligenceEngine.getRootCauseAnalysis(id);
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

// GET /api/v1/intelligence/deployments/:id/risk (Viewer+)
router.get('/deployments/:id/risk', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = intelligenceEngine.getDeploymentRisk(id);
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

// GET /api/v1/intelligence/recommendations (Viewer+)
router.get('/recommendations', (_req: Request, res: Response) => {
  const data = intelligenceEngine.getRecommendations();
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

// PATCH /api/v1/intelligence/recommendations/:id (Requires Operator+)
router.patch('/recommendations/:id', requireRole('operator'), (req: Request, res: Response) => {
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
    const updated = intelligenceEngine.updateRecommendationStatus(id, status);
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

export default router;
