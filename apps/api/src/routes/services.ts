import { Router, type IRouter, type Request, type Response } from 'express';
import type { ApiResponse, Service } from '@cloudpulse/shared';
import { servicesData } from '../demo/data.js';
import { telemetryManager } from '../providers/telemetryManager.js';
import { getLiveServices } from '../services/healthChecker.js';

export const servicesRouter: IRouter = Router();

servicesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { environment, status, team } = req.query;
    const mode = telemetryManager.getMode();

    let result: Service[];

    if (mode === 'live') {
      result = await getLiveServices();
    } else {
      result = [...servicesData];
    }

    if (typeof environment === 'string' && environment && environment !== 'all') {
      result = result.filter((s) => s.environment === environment);
    }

    if (typeof status === 'string' && status && status !== 'all') {
      result = result.filter((s) => s.status === status);
    }

    if (typeof team === 'string' && team && team !== 'all') {
      result = result.filter((s) => s.team.toLowerCase().includes(team.toLowerCase()));
    }

    const body: ApiResponse<Service[]> = {
      ok: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        version: '0.0.2',
      },
    };
    return res.status(200).json(body);
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

servicesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params['id'];
    const mode = telemetryManager.getMode();

    let serviceList: Service[];
    if (mode === 'live') {
      serviceList = await getLiveServices();
    } else {
      serviceList = servicesData;
    }

    const service = serviceList.find((s) => s.id === id || s.name === id);
    if (!service) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Service not found' } });
    }

    const body: ApiResponse<Service> = {
      ok: true,
      data: service,
      meta: {
        timestamp: new Date().toISOString(),
        version: '0.0.2',
      },
    };
    return res.status(200).json(body);
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});
