import { Router, type IRouter, type Request, type Response } from 'express';
import type { ApiResponse, Alert } from '@cloudpulse/shared';
import { alertsData } from '../demo/data.js';
import { telemetryManager } from '../providers/telemetryManager.js';
import { getLiveServices } from '../services/healthChecker.js';

export const alertsRouter: IRouter = Router();

alertsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { severity, state, service } = req.query;
    const mode = telemetryManager.getMode();

    let result: Alert[];

    if (mode === 'live') {
      const liveServices = await getLiveServices();
      const dynamicAlerts: Alert[] = [];

      for (const svc of liveServices) {
        if (svc.status === 'unhealthy') {
          dynamicAlerts.push({
            id: `alert-${svc.id}-5xx`,
            name: `${svc.name} Error Rate Spike`,
            serviceId: svc.id,
            serviceName: svc.name,
            severity: 'critical',
            state: 'firing',
            summary: `HTTP 5xx error rate on ${svc.name} is ${svc.errorRate.toFixed(1)}%`,
            condition: `rate(http_errors_total{service="${svc.name}"}[5m]) > 5%`,
            currentValue: svc.errorRate,
            threshold: 5.0,
            unit: '%',
            firedAt: new Date(Date.now() - 120000).toISOString(),
            resolvedAt: null,
            durationMinutes: 2,
            environment: 'production',
          });
        } else if (svc.status === 'degraded') {
          dynamicAlerts.push({
            id: `alert-${svc.id}-latency`,
            name: `${svc.name} P99 Latency Breach`,
            serviceId: svc.id,
            serviceName: svc.name,
            severity: 'high',
            state: 'firing',
            summary: `P99 response latency on ${svc.name} has degraded to ${svc.latencyP99Ms}ms`,
            condition: `p99(http_request_duration_ms{service="${svc.name}"}[5m]) > 400ms`,
            currentValue: svc.latencyP99Ms,
            threshold: 400,
            unit: 'ms',
            firedAt: new Date(Date.now() - 60000).toISOString(),
            resolvedAt: null,
            durationMinutes: 1,
            environment: 'production',
          });
        } else {
          dynamicAlerts.push({
            id: `alert-${svc.id}-healthy`,
            name: `${svc.name} High Error Rate Rule`,
            serviceId: svc.id,
            serviceName: svc.name,
            severity: 'critical',
            state: 'resolved',
            summary: `HTTP 5xx server error rate rule for ${svc.name}`,
            condition: `rate(http_errors_total{service="${svc.name}"}[5m]) > 5%`,
            currentValue: svc.errorRate,
            threshold: 5.0,
            unit: '%',
            firedAt: new Date(Date.now() - 3600000).toISOString(),
            resolvedAt: new Date().toISOString(),
            durationMinutes: 0,
            environment: 'production',
          });
        }
      }
      result = dynamicAlerts;
    } else {
      result = [...alertsData];
    }

    if (typeof severity === 'string' && severity && severity !== 'all') {
      result = result.filter((a) => a.severity === severity);
    }

    if (typeof state === 'string' && state && state !== 'all') {
      result = result.filter((a) => a.state === state);
    }

    if (typeof service === 'string' && service && service !== 'all') {
      result = result.filter((a) => a.serviceName === service || a.serviceId === service);
    }

    const body: ApiResponse<Alert[]> = {
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

alertsRouter.post('/evaluate', async (_req: Request, res: Response) => {
  try {
    const liveServices = await getLiveServices();
    const firing = liveServices.filter((s) => s.status !== 'healthy').length;

    const body: ApiResponse<{ evaluated: number; firing: number }> = {
      ok: true,
      data: {
        evaluated: liveServices.length,
        firing,
      },
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
