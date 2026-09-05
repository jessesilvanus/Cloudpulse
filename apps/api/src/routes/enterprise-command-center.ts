import { Router, Request, Response } from 'express';
import { EnterpriseCommandCenterEngine } from '../services/enterprise-command-center-engine.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const engine = EnterpriseCommandCenterEngine.getInstance();

// GET /api/v1/enterprise-command-center/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = engine.getSummary();
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

// GET /api/v1/enterprise-command-center/health (Viewer+)
router.get('/health', (_req: Request, res: Response) => {
  const data = engine.getEnterpriseHealth();
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

// GET /api/v1/enterprise-command-center/risks (Viewer+)
router.get('/risks', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const severity = req.query.severity as string | undefined;
  const data = engine.getEnterpriseRisks(category, severity);
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

// GET /api/v1/enterprise-command-center/business-impact (Viewer+)
router.get('/business-impact', (_req: Request, res: Response) => {
  const data = engine.getBusinessImpact();
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

// GET /api/v1/enterprise-command-center/situation-room (Viewer+)
router.get('/situation-room', (req: Request, res: Response) => {
  const domain = req.query.domain as string | undefined;
  const severity = req.query.severity as string | undefined;
  const data = engine.getSituationRoomEvents(domain, severity);
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

// GET /api/v1/enterprise-command-center/briefing (Viewer+)
router.get('/briefing', (_req: Request, res: Response) => {
  const data = engine.getExecutiveBriefing();
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

// GET /api/v1/enterprise-command-center/estate (Viewer+)
router.get('/estate', (_req: Request, res: Response) => {
  const data = engine.getGlobalCloudEstate();
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

// POST /api/v1/enterprise-command-center/scenarios/simulate (Viewer+)
router.post('/scenarios/simulate', (req: Request, res: Response) => {
  const { scenarioType, targetRegion } = req.body;
  try {
    const data = engine.simulateExecutiveScenario({ scenarioType, targetRegion });
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
      error: { code: 'SIMULATION_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/enterprise-command-center/search (Viewer+)
router.get('/search', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const data = engine.queryEnterpriseSearch(query);
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

// POST /api/v1/enterprise-command-center/assistant (Viewer+)
router.post('/assistant', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'What is our current enterprise health score and top risks?';
  const data = engine.queryExecutiveAssistant(prompt);
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
