import { Router, Request, Response } from 'express';
import { AiOpsIntelligenceEngine } from '../services/aiops-intelligence-engine.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const aiops = AiOpsIntelligenceEngine.getInstance();

// GET /api/v1/aiops-center/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = aiops.getSummary();
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

// GET /api/v1/aiops-center/events (Viewer+)
router.get('/events', (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const eventType = req.query.eventType as string | undefined;
  const severity = req.query.severity as string | undefined;
  const source = req.query.source as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

  const data = aiops.getEvents(service, eventType, severity, source, limit);
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

// GET /api/v1/aiops-center/correlations (Viewer+)
router.get('/correlations', (req: Request, res: Response) => {
  const eventId = req.query.eventId as string | undefined;
  const data = aiops.getCorrelations(eventId);
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

// GET /api/v1/aiops-center/services (Viewer+)
router.get('/services', (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const data = aiops.getServiceHealth(service);
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

// GET /api/v1/aiops-center/root-causes (Viewer+)
router.get('/root-causes', (req: Request, res: Response) => {
  const incidentId = req.query.incidentId as string | undefined;
  const data = aiops.getRootCauseCandidates(incidentId);
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

// GET /api/v1/aiops-center/predictions (Viewer+)
router.get('/predictions', (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const data = aiops.getPredictions(service);
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

// GET /api/v1/aiops-center/quality (Viewer+)
router.get('/quality', (_req: Request, res: Response) => {
  const data = aiops.getObservabilityQuality();
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

// POST /api/v1/aiops-center/similar-incidents (Viewer+)
router.post('/similar-incidents', (req: Request, res: Response) => {
  const data = aiops.searchSimilarIncidents(req.body || {});
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

// POST /api/v1/aiops-center/assistant (Viewer+)
router.post('/assistant', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'System Health Overview';
  const data = aiops.queryAssistant(prompt);
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
