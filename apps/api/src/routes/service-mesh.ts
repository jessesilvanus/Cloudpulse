import { Router, Request, Response } from 'express';
import { ServiceMeshTrafficEngine } from '../services/service-mesh-traffic-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const meshEngine = ServiceMeshTrafficEngine.getInstance();

// GET /api/v1/service-mesh/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = meshEngine.getSummary();
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

// GET /api/v1/service-mesh/services (Viewer+)
router.get('/services', (req: Request, res: Response) => {
  const environment = req.query.environment as string | undefined;
  const provider = req.query.provider as string | undefined;
  const data = meshEngine.getServices(environment, provider);
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

// GET /api/v1/service-mesh/services/:id (Viewer+)
router.get('/services/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = meshEngine.getServiceById(id);
  if (!data) {
    return res.status(404).json({
      ok: false,
      error: { code: 'SERVICE_NOT_FOUND', message: `Service '${id}' not found in mesh.` },
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

// GET /api/v1/service-mesh/instances (Viewer+)
router.get('/instances', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;
  const data = meshEngine.getInstances(serviceId);
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

// GET /api/v1/service-mesh/routes (Viewer+)
router.get('/routes', (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const method = req.query.method as string | undefined;
  const data = meshEngine.getRoutes(service, method);
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

// GET /api/v1/service-mesh/traffic-splits (Viewer+)
router.get('/traffic-splits', (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const data = meshEngine.getTrafficSplits(service);
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

// POST /api/v1/service-mesh/traffic-splits (Operator+)
router.post('/traffic-splits', requireRole('operator'), (req: Request, res: Response) => {
  const { service, splits, mode } = req.body;
  try {
    const data = meshEngine.updateTrafficSplit(service, splits, mode);
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
      error: { code: 'TRAFFIC_SPLIT_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/service-mesh/canary/start (Operator+)
router.post('/canary/start', requireRole('operator'), (req: Request, res: Response) => {
  const { service, targetVersion, initialWeight } = req.body;
  try {
    const data = meshEngine.startCanaryRollout(service, targetVersion, initialWeight);
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
      error: { code: 'CANARY_START_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/service-mesh/canary/advance (Operator+)
router.post('/canary/advance', requireRole('operator'), (req: Request, res: Response) => {
  const { service } = req.body;
  try {
    const data = meshEngine.advanceCanary(service);
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
      error: { code: 'CANARY_ADVANCE_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/service-mesh/canary/rollback (Operator+)
router.post('/canary/rollback', requireRole('operator'), (req: Request, res: Response) => {
  const { service } = req.body;
  try {
    const data = meshEngine.rollbackCanary(service);
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
      error: { code: 'CANARY_ROLLBACK_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/service-mesh/circuit-breakers (Viewer+)
router.get('/circuit-breakers', (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const data = meshEngine.getCircuitBreakers(service);
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

// POST /api/v1/service-mesh/circuit-breakers/:service/trip (Operator+)
router.post('/circuit-breakers/:service/trip', requireRole('operator'), (req: Request, res: Response) => {
  const service = req.params.service as string;
  try {
    const data = meshEngine.tripCircuitBreaker(service);
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
      error: { code: 'CIRCUIT_BREAKER_TRIP_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/service-mesh/circuit-breakers/:service/reset (Operator+)
router.post('/circuit-breakers/:service/reset', requireRole('operator'), (req: Request, res: Response) => {
  const service = req.params.service as string;
  try {
    const data = meshEngine.resetCircuitBreaker(service);
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
      error: { code: 'CIRCUIT_BREAKER_RESET_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/service-mesh/policies (Viewer+)
router.get('/policies', (_req: Request, res: Response) => {
  const data = meshEngine.getPolicies();
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

// GET /api/v1/service-mesh/release-guard (Viewer+)
router.get('/release-guard', (req: Request, res: Response) => {
  const service = (req.query.service as string) || 'order-service';
  const version = (req.query.version as string) || 'v2.4.0-canary';
  const data = meshEngine.evaluateReleaseGuard(service, version);
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

// POST /api/v1/service-mesh/fault-injection (Operator+)
router.post('/fault-injection', requireRole('operator'), (req: Request, res: Response) => {
  const { service, faultType, percentage } = req.body;
  const data = meshEngine.simulateFaultInjection(service, faultType, percentage);
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

// POST /api/v1/service-mesh/assistant (Viewer+)
router.post('/assistant', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'What is our current service mesh health?';
  const data = meshEngine.queryMeshAssistant(prompt);
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
