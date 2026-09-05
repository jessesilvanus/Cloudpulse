import { Router, Request, Response } from 'express';
import { CloudDataEventIntelligenceEngine } from '../services/cloud-data-event-intelligence-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const eventEngine = CloudDataEventIntelligenceEngine.getInstance();

// GET /api/v1/event-intelligence/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = eventEngine.getSummary();
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

// GET /api/v1/event-intelligence/events (Viewer+)
router.get('/events', (req: Request, res: Response) => {
  const source = req.query.source as string | undefined;
  const provider = req.query.provider as string | undefined;
  const service = req.query.service as string | undefined;
  const severity = req.query.severity as string | undefined;
  const status = req.query.status as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

  const data = eventEngine.getEvents(source, provider, service, severity, status, limit);
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

// GET /api/v1/event-intelligence/events/:id (Viewer+)
router.get('/events/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = eventEngine.getEventById(id);
  if (!data) {
    return res.status(404).json({
      ok: false,
      error: { code: 'EVENT_NOT_FOUND', message: `Event '${id}' not found.` },
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

// POST /api/v1/event-intelligence/events (Viewer+)
router.post('/events', requireRole('viewer'), (req: Request, res: Response) => {
  try {
    const data = eventEngine.ingestEvent(req.body);
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
      error: { code: 'EVENT_INGESTION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/event-intelligence/correlations (Viewer+)
router.get('/correlations', (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const status = req.query.status as string | undefined;
  const data = eventEngine.getCorrelations(service, status);
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

// GET /api/v1/event-intelligence/decisions (Viewer+)
router.get('/decisions', (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const status = req.query.status as string | undefined;
  const data = eventEngine.getDecisions(service, status);
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

// GET /api/v1/event-intelligence/schemas (Viewer+)
router.get('/schemas', (_req: Request, res: Response) => {
  const data = eventEngine.getSchemas();
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

// GET /api/v1/event-intelligence/dlq (Viewer+)
router.get('/dlq', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const data = eventEngine.getDeadLetters(status);
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

// POST /api/v1/event-intelligence/dlq/:id/retry (Operator+)
router.post('/dlq/:id/retry', requireRole('operator'), (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = eventEngine.retryDeadLetter(id);
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
      error: { code: 'DLQ_RETRY_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/event-intelligence/simulate (Viewer+)
router.post('/simulate', (req: Request, res: Response) => {
  const scenario = req.body?.scenario || 'NORMAL_OPERATIONS';
  const volume = req.body?.volume ? parseInt(req.body.volume, 10) : 10;
  const environment = req.body?.environment || 'production';
  const data = eventEngine.simulateScenario(scenario, volume, environment);
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

// POST /api/v1/event-intelligence/replay (Viewer+)
router.post('/replay', (req: Request, res: Response) => {
  const sessionId = req.body?.sessionId || `replay-session-${Date.now()}`;
  const speed = req.body?.speed || '2x';
  const data = eventEngine.replayEvents(sessionId, speed);
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

// POST /api/v1/event-intelligence/assistant (Viewer+)
router.post('/assistant', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'What happened across our event streams?';
  const data = eventEngine.queryEventAssistant(prompt);
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
