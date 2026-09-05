import { Router, type IRouter, type Request, type Response } from 'express';
import { telemetryStore } from './store.js';

export const queryRouter: IRouter = Router();

// ── PROMETHEUS COMPATIBILITY API ──────────────────────────────────────────

queryRouter.get('/api/v1/query_range', (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string) || 'http_requests_total';
    const startStr = req.query.start as string;
    const endStr = req.query.end as string;
    const stepStr = req.query.step as string;

    const now = Date.now();
    const endMs = endStr ? (!isNaN(Number(endStr)) ? Number(endStr) * 1000 : new Date(endStr).getTime()) : now;
    const startMs = startStr ? (!isNaN(Number(startStr)) ? Number(startStr) * 1000 : new Date(startStr).getTime()) : now - 15 * 60 * 1000;
    const stepMs = stepStr ? (!isNaN(Number(stepStr)) ? Number(stepStr) * 1000 : 15000) : 15000;

    // Normalize metric name from PromQL query
    let metricName = query;
    let serviceFilter: string | undefined;

    // Extract metric name and service label if present in PromQL syntax
    const match = query.match(/([a-zA-Z_:][a-zA-Z0-9_:]*)\s*(\{[^}]*\})?/);
    if (match) {
      metricName = match[1];
      if (match[2]) {
        const serviceMatch = match[2].match(/service=["']([^"']+)["']/);
        if (serviceMatch) serviceFilter = serviceMatch[1];
      }
    }

    const filterLabels: Record<string, string> = {};
    if (serviceFilter) filterLabels['service'] = serviceFilter;

    const datapoints = telemetryStore.queryMetricRange(
      metricName,
      startMs,
      endMs,
      stepMs,
      Object.keys(filterLabels).length > 0 ? filterLabels : undefined
    );

    // Format into standard Prometheus matrix response
    const values: [number, string][] = datapoints.map((dp) => [
      Math.floor(new Date(dp.timestamp).getTime() / 1000),
      dp.value.toString(),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        resultType: 'matrix',
        result: [
          {
            metric: {
              __name__: metricName,
              service: serviceFilter || 'all',
              job: 'cloudpulse',
            },
            values,
          },
        ],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', errorType: 'server_error', error: err.message });
  }
});

queryRouter.get('/api/v1/query', (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string) || 'http_requests_total';
    const now = Date.now();
    const datapoints = telemetryStore.queryMetricRange(query, now - 60000, now, 15000);
    const lastPoint = datapoints[datapoints.length - 1];
    const val = lastPoint ? lastPoint.value : 0;

    return res.status(200).json({
      status: 'success',
      data: {
        resultType: 'vector',
        result: [
          {
            metric: { __name__: query },
            value: [Math.floor(now / 1000), val.toString()],
          },
        ],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', errorType: 'server_error', error: err.message });
  }
});

queryRouter.get('/api/v1/label/__name__/values', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'success',
    data: [
      'http_requests_total',
      'http_request_duration_ms',
      'http_errors_total',
      'process_cpu_seconds_total',
      'process_resident_memory_bytes',
    ],
  });
});

// ── LOKI COMPATIBILITY API ────────────────────────────────────────────────

queryRouter.get('/loki/api/v1/query_range', (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string) || '';
    const limit = req.query.limit ? Number(req.query.limit) : 100;

    // Parse LogQL e.g. {service="payment-service"} |= "error"
    let serviceFilter: string | undefined;
    let levelFilter: string | undefined;
    let q: string | undefined;

    const svcMatch = query.match(/service=["']([^"']+)["']/);
    if (svcMatch) serviceFilter = svcMatch[1];

    const lvlMatch = query.match(/level=["']([^"']+)["']/);
    if (lvlMatch) levelFilter = lvlMatch[1];

    const textMatch = query.match(/\|=\s*["']([^"']+)["']/);
    if (textMatch) q = textMatch[1];

    const logs = telemetryStore.queryLogs({
      service: serviceFilter,
      level: levelFilter,
      q,
      limit,
    });

    // Format into Loki stream response
    const values: [string, string][] = logs.map((l) => {
      const nano = new Date(l.timestamp).getTime() * 1_000_000;
      return [nano.toString(), JSON.stringify(l)];
    });

    return res.status(200).json({
      status: 'success',
      data: {
        resultType: 'streams',
        result: [
          {
            stream: {
              service: serviceFilter || 'all',
              job: 'cloudpulse-logs',
            },
            values,
          },
        ],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', errorType: 'server_error', error: err.message });
  }
});

queryRouter.get('/loki/api/v1/labels', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'success',
    data: ['service', 'level', 'environment', 'traceId'],
  });
});

// ── TEMPO COMPATIBILITY API ───────────────────────────────────────────────

queryRouter.get('/api/traces/:traceId', (req: Request, res: Response) => {
  try {
    const { traceId } = req.params;
    const trace = telemetryStore.getTrace(traceId);
    if (!trace) {
      return res.status(404).json({ error: `Trace ${traceId} not found` });
    }
    return res.status(200).json(trace);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

queryRouter.get('/api/search', (req: Request, res: Response) => {
  try {
    const service = req.query.service as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const traces = telemetryStore.listTraces({ service, status, limit });
    return res.status(200).json({
      traces: traces.map((t) => ({
        traceID: t.id,
        rootServiceName: t.rootService,
        rootTraceName: t.operation,
        startTimeUnixNano: new Date(t.startTime).getTime() * 1_000_000,
        durationMs: t.durationMs,
        spanCount: t.spanCount,
        status: t.statusCode,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── TELEMETRY HEALTH / STATUS ─────────────────────────────────────────────

queryRouter.get('/api/telemetry/status', (_req: Request, res: Response) => {
  const stats = telemetryStore.getStats();
  return res.status(200).json({
    status: 'OPERATIONAL',
    mode: 'live',
    engine: 'cloudpulse-telemetry-engine',
    stats,
    components: {
      collector: { status: 'OPERATIONAL', port: 4318, protocol: 'OTLP/HTTP' },
      prometheus: { status: 'OPERATIONAL', port: 9090, protocol: 'PromQL' },
      loki: { status: 'OPERATIONAL', port: 3100, protocol: 'LogQL' },
      tempo: { status: 'OPERATIONAL', port: 3200, protocol: 'OTLP/Tempo' },
    },
  });
});
