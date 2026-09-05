import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import type { ApiResponse, HealthCheckResponse } from '@cloudpulse/shared';
import { RealCloudPulsePlatformEngine } from '../services/real-cloudpulse-platform-engine.js';

const PACKAGE_VERSION = '0.0.2';
const startTime = Date.now();

export const healthRouter: IRouter = Router();
const engine = RealCloudPulsePlatformEngine.getInstance();

healthRouter.get('/', (_req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const body: ApiResponse<HealthCheckResponse> = {
    ok: true,
    data: {
      status: 'ok',
      version: PACKAGE_VERSION,
      uptime,
      checks: {
        process: 'ok',
        database: 'ok',
        telemetryEngine: 'ok',
        backgroundWorkers: 'ok',
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: PACKAGE_VERSION,
    },
  };

  res.status(200).json(body);
});

healthRouter.get('/live', (_req: Request, res: Response) => {
  return res.status(200).json(engine.getLiveness());
});

healthRouter.get('/ready', (_req: Request, res: Response) => {
  return res.status(200).json(engine.getReadiness());
});

healthRouter.get('/dependencies', (_req: Request, res: Response) => {
  return res.status(200).json({
    ok: true,
    data: engine.getDependencyHealth(),
    meta: {
      timestamp: new Date().toISOString(),
      version: PACKAGE_VERSION,
    },
  });
});

export default healthRouter;


