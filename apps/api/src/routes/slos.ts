import { Router, type IRouter, type Request, type Response } from 'express';
import type { ApiResponse, SloDefinition } from '@cloudpulse/shared';
import { slosData } from '../demo/data.js';
import { telemetryManager } from '../providers/telemetryManager.js';

export const slosRouter: IRouter = Router();

slosRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, service } = req.query;
    const mode = telemetryManager.getMode();

    let result: SloDefinition[];

    if (mode === 'live') {
      const liveMetrics = await telemetryManager.metrics.getOverviewMetrics();
      const liveSlos: SloDefinition[] = [
        {
          id: 'slo-gateway-avail',
          name: 'API Gateway Availability (Live)',
          serviceId: 'api-gateway',
          serviceName: 'api-gateway',
          type: 'availability',
          targetPercent: 99.9,
          currentPercent: liveMetrics.errorRatePercent > 0 ? Math.max(90, 100 - liveMetrics.errorRatePercent) : 99.95,
          windowDays: 30,
          errorBudgetRemainingPercent: liveMetrics.errorRatePercent > 5 ? 12.5 : 88.0,
          errorBudgetRemainingMinutes: liveMetrics.errorRatePercent > 5 ? 45 : 380,
          burnRate: liveMetrics.errorRatePercent > 5 ? 14.2 : 0.8,
          status: liveMetrics.errorRatePercent > 5 ? 'breached' : liveMetrics.errorRatePercent > 1 ? 'at_risk' : 'met',
          description: 'Ratio of 2xx/3xx/4xx HTTP requests to total HTTP requests over 30-day window',
          achievementHistory: [],
          burnDownHistory: [],
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'slo-gateway-latency',
          name: 'API Gateway Ingress Latency (Live)',
          serviceId: 'api-gateway',
          serviceName: 'api-gateway',
          type: 'latency',
          targetPercent: 99.0,
          currentPercent: liveMetrics.latencyP99Ms > 1000 ? 94.2 : 99.6,
          windowDays: 30,
          errorBudgetRemainingPercent: liveMetrics.latencyP99Ms > 1000 ? 24.0 : 94.5,
          errorBudgetRemainingMinutes: liveMetrics.latencyP99Ms > 1000 ? 92 : 410,
          burnRate: liveMetrics.latencyP99Ms > 1000 ? 8.5 : 0.4,
          status: liveMetrics.latencyP99Ms > 1000 ? 'at_risk' : 'met',
          description: 'Percentage of API Gateway requests completed within 500ms over 30 days',
          achievementHistory: [],
          burnDownHistory: [],
          updatedAt: new Date().toISOString(),
        },
      ];
      result = liveSlos;
    } else {
      result = [...slosData];
    }

    if (typeof status === 'string' && status && status !== 'all') {
      result = result.filter((s) => s.status === status);
    }

    if (typeof service === 'string' && service && service !== 'all') {
      result = result.filter((s) => s.serviceName === service || s.serviceId === service);
    }

    const body: ApiResponse<SloDefinition[]> = {
      ok: true,
      data: result,
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

slosRouter.get('/:id', (req: Request, res: Response) => {
  const slo = slosData.find((s) => s.id === req.params['id']);
  if (!slo) {
    res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'SLO not found' } });
    return;
  }
  const body: ApiResponse<SloDefinition> = {
    ok: true,
    data: slo,
    meta: {
      timestamp: new Date().toISOString(),
      version: '0.0.2',
    },
  };
  res.status(200).json(body);
});
