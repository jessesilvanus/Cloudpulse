import { Router, Request, Response } from 'express';
import { PredictiveIntelligenceEngine } from '../services/predictive-intelligence-engine.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const predictiveEngine = PredictiveIntelligenceEngine.getInstance();

// GET /api/v1/predictive/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = predictiveEngine.getSummary();
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

// GET /api/v1/predictive/forecasts (Viewer+)
router.get('/forecasts', (req: Request, res: Response) => {
  const target = req.query.target as string | undefined;
  const risk = req.query.risk as string | undefined;
  const data = predictiveEngine.getForecasts(target, risk);
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

// GET /api/v1/predictive/anomalies (Viewer+)
router.get('/anomalies', (req: Request, res: Response) => {
  const severity = req.query.severity as string | undefined;
  const data = predictiveEngine.getAnomalies(severity);
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

// GET /api/v1/predictive/incidents (Viewer+)
router.get('/incidents', (_req: Request, res: Response) => {
  const data = predictiveEngine.getIncidentPredictions();
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

// GET /api/v1/predictive/capacity (Viewer+)
router.get('/capacity', (_req: Request, res: Response) => {
  const data = predictiveEngine.getCapacityPredictions();
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

// GET /api/v1/predictive/cost (Viewer+)
router.get('/cost', (_req: Request, res: Response) => {
  const data = predictiveEngine.getCostPredictions();
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

// GET /api/v1/predictive/models (Viewer+)
router.get('/models', (_req: Request, res: Response) => {
  const data = predictiveEngine.getModelRegistry();
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

// POST /api/v1/predictive/feedback (Viewer+)
router.post('/feedback', (req: Request, res: Response) => {
  const { predictionId, feedback, notes } = req.body;
  if (!predictionId || !feedback) {
    return res.status(400).json({
      ok: false,
      error: { code: 'INVALID_INPUT', message: 'predictionId and feedback are required.' },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
  const data = predictiveEngine.submitPredictionFeedback(predictionId, feedback, notes);
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

// POST /api/v1/predictive/simulate (Viewer+)
router.post('/simulate', (req: Request, res: Response) => {
  const { trafficMultiplier, storageGrowthMultiplier, nodeFailureCount } = req.body || {};
  const data = predictiveEngine.simulateScenario({ trafficMultiplier, storageGrowthMultiplier, nodeFailureCount });
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

// POST /api/v1/predictive/assistant (Viewer+)
router.post('/assistant', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'What are our top predicted reliability and capacity risks?';
  const data = predictiveEngine.queryPredictiveAssistant(prompt);
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
