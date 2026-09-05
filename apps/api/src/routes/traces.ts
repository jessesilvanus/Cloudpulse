import { Router, type IRouter, type Request, type Response } from 'express';
import type { ApiResponse, Trace } from '@cloudpulse/shared';
import { telemetryManager } from '../providers/telemetryManager.js';

export const tracesRouter: IRouter = Router();

tracesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { service, status, limit } = req.query;

    const result = await telemetryManager.tracing.listTraces({
      service: typeof service === 'string' ? service : undefined,
      status: typeof status === 'string' ? status : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    const body: ApiResponse<Trace[]> = {
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

tracesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params['id'];
    if (!id) {
      return res.status(400).json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Trace ID required' } });
    }
    const trace = await telemetryManager.tracing.getTrace(id);
    if (!trace) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: `Trace ${id} not found` } });
    }
    const body: ApiResponse<Trace> = {
      ok: true,
      data: trace,
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
