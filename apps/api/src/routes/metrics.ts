import { Router, type IRouter, type Request, type Response } from 'express';
import type { ApiResponse, MetricSummary, MetricDatapoint } from '@cloudpulse/shared';
import { telemetryManager } from '../providers/telemetryManager.js';

export const metricsRouter: IRouter = Router();

// GET /api/v1/metrics
metricsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { metric, service } = req.query;
    let list = await telemetryManager.metrics.listMetrics();

    if (typeof metric === 'string' && metric && metric !== 'all') {
      list = list.filter((m) => m.metricName.toLowerCase().includes(metric.toLowerCase()));
    }

    const body: ApiResponse<MetricSummary[]> = {
      ok: true,
      data: list,
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

// GET /api/v1/metrics/query (Range query)
metricsRouter.get('/query', async (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string) || 'http_requests_total';
    const start = (req.query.start as string) || new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const end = (req.query.end as string) || new Date().toISOString();
    const step = (req.query.step as string) || '15s';
    const service = req.query.service as string | undefined;

    const dataPoints = await telemetryManager.metrics.queryRange(query, start, end, step, service);

    const body: ApiResponse<MetricDatapoint[]> = {
      ok: true,
      data: dataPoints,
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
