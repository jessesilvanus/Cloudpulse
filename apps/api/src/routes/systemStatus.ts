import { Router, type IRouter, type Request, type Response } from 'express';
import type { ApiResponse, SystemComponentStatus } from '@cloudpulse/shared';
import { checkSystemComponents } from '../services/healthChecker.js';
import { systemStatusData } from '../demo/data.js';
import { telemetryManager } from '../providers/telemetryManager.js';

export const systemStatusRouter: IRouter = Router();

systemStatusRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const mode = telemetryManager.getMode();
    let data: SystemComponentStatus[];

    if (mode === 'live') {
      data = await checkSystemComponents();
    } else {
      data = systemStatusData;
    }

    const body: ApiResponse<SystemComponentStatus[]> = {
      ok: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: '0.0.2',
      },
    };
    res.status(200).json(body);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
