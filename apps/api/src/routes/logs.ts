import { Router, type IRouter, type Request, type Response } from 'express';
import type { ApiResponse, LogEntry } from '@cloudpulse/shared';
import { telemetryManager } from '../providers/telemetryManager.js';

export const logsRouter: IRouter = Router();

logsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { service, level, traceId, q, limit } = req.query;

    const result = await telemetryManager.logs.queryLogs({
      service: typeof service === 'string' ? service : undefined,
      level: typeof level === 'string' ? level : undefined,
      traceId: typeof traceId === 'string' ? traceId : undefined,
      q: typeof q === 'string' ? q : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    const body: ApiResponse<LogEntry[]> = {
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
