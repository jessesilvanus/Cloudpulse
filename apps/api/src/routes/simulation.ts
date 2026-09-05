import { Router, type IRouter, type Request, type Response } from 'express';
import type { ApiResponse, FaultInjectionConfig } from '@cloudpulse/shared';
import { activeFaults } from '../demo/data.js';

export const simulationRouter: IRouter = Router();

simulationRouter.get('/', (_req: Request, res: Response) => {
  const body: ApiResponse<FaultInjectionConfig> = {
    ok: true,
    data: activeFaults,
    meta: {
      timestamp: new Date().toISOString(),
      version: '0.0.2',
    },
  };
  res.status(200).json(body);
});

simulationRouter.post('/', (req: Request, res: Response) => {
  const updates = req.body as Partial<FaultInjectionConfig>;

  if (typeof updates.latencySpike === 'boolean') activeFaults.latencySpike = updates.latencySpike;
  if (typeof updates.errorRateBurst === 'boolean') activeFaults.errorRateBurst = updates.errorRateBurst;
  if (updates.serviceOutage !== undefined) activeFaults.serviceOutage = updates.serviceOutage;
  if (typeof updates.dbPoolExhaustion === 'boolean') activeFaults.dbPoolExhaustion = updates.dbPoolExhaustion;
  if (typeof updates.trafficSpike === 'boolean') activeFaults.trafficSpike = updates.trafficSpike;

  const body: ApiResponse<FaultInjectionConfig> = {
    ok: true,
    data: activeFaults,
    meta: {
      timestamp: new Date().toISOString(),
      version: '0.0.2',
    },
  };
  res.status(200).json(body);
});
