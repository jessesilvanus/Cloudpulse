import { Router, type IRouter, type Request, type Response } from 'express';
import type { ApiResponse, Incident } from '@cloudpulse/shared';
import { incidentsData } from '../demo/data.js';
import { telemetryManager } from '../providers/telemetryManager.js';
import { getLiveServices } from '../services/healthChecker.js';

export const incidentsRouter: IRouter = Router();

incidentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { severity, state, service } = req.query;
    const mode = telemetryManager.getMode();

    let result: Incident[];

    if (mode === 'live') {
      const liveServices = await getLiveServices();
      const unhealthyServices = liveServices.filter((s) => s.status === 'unhealthy').map((s) => s.name);

      if (unhealthyServices.length > 0) {
        result = [
          {
            id: 'INC-LIVE-001',
            title: `Active SEV1: ${unhealthyServices.join(', ')} Critical Service Disruption`,
            severity: 'sev1',
            state: 'investigating',
            affectedServices: unhealthyServices,
            startedAt: new Date(Date.now() - 300000).toISOString(),
            resolvedAt: null,
            durationMinutes: 5,
            commander: 'Local SRE On-Call',
            summary: `Automated fault detection identified critical 5xx errors and database connection exhaustion across ${unhealthyServices.join(', ')}.`,
            impact: 'Ingress checkout transactions failing on downstream dependencies',
            timeline: [
              {
                id: 'evt-01',
                timestamp: new Date(Date.now() - 300000).toISOString(),
                type: 'alert_attached',
                title: 'Automated Alert Triggered',
                description: 'Automated alert triggered on Payment Service error rate spike',
                author: 'CloudPulse Alert Evaluator',
              },
              {
                id: 'evt-02',
                timestamp: new Date(Date.now() - 120000).toISOString(),
                type: 'status_change',
                title: 'SRE Investigation Initiated',
                description: 'SRE team investigating database connection pool saturation',
                author: 'Local SRE On-Call',
              },
            ],
            relatedAlertIds: ['alert-payment-service-5xx'],
            relatedTraceIds: [],
            relatedLogIds: [],
          },
        ];
      } else {
        result = [];
      }
    } else {
      result = [...incidentsData];
    }

    if (typeof severity === 'string' && severity && severity !== 'all') {
      result = result.filter((i) => i.severity === severity);
    }

    if (typeof state === 'string' && state && state !== 'all') {
      result = result.filter((i) => i.state === state);
    }

    if (typeof service === 'string' && service && service !== 'all') {
      result = result.filter((i) => i.affectedServices.includes(service));
    }

    const body: ApiResponse<Incident[]> = {
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

incidentsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params['id'];
    const mode = telemetryManager.getMode();

    let incident: Incident | undefined;

    if (mode === 'live' && id === 'INC-LIVE-001') {
      const liveServices = await getLiveServices();
      const unhealthyServices = liveServices.filter((s) => s.status === 'unhealthy').map((s) => s.name);
      incident = {
        id: 'INC-LIVE-001',
        title: `Active SEV1: ${unhealthyServices.join(', ')} Critical Service Disruption`,
        severity: 'sev1',
        state: 'investigating',
        affectedServices: unhealthyServices,
        startedAt: new Date(Date.now() - 300000).toISOString(),
        resolvedAt: null,
        durationMinutes: 5,
        commander: 'Local SRE On-Call',
        summary: `Automated fault detection identified critical 5xx errors and database connection exhaustion across ${unhealthyServices.join(', ')}.`,
        impact: 'Ingress checkout transactions failing on downstream dependencies',
        timeline: [
          {
            id: 'evt-01',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            type: 'alert_attached',
            title: 'Automated Alert Triggered',
            description: 'Automated alert triggered on Payment Service error rate spike',
            author: 'CloudPulse Alert Evaluator',
          },
          {
            id: 'evt-02',
            timestamp: new Date(Date.now() - 120000).toISOString(),
            type: 'status_change',
            title: 'SRE Investigation Initiated',
            description: 'SRE team investigating database connection pool saturation',
            author: 'Local SRE On-Call',
          },
        ],
        relatedAlertIds: ['alert-payment-service-5xx'],
        relatedTraceIds: [],
        relatedLogIds: [],
      };
    } else {
      incident = incidentsData.find((i) => i.id === id);
    }

    if (!incident) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Incident not found' } });
    }

    const body: ApiResponse<Incident> = {
      ok: true,
      data: incident,
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
