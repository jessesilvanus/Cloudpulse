import { Router, type IRouter, type Request, type Response } from 'express';
import { telemetryStore, type RawSpan } from './store.js';
import type { LogEntry } from '@cloudpulse/shared';

export const receiverRouter: IRouter = Router();

// Helper to convert OTLP attributes array [{ key, value: { stringValue, intValue } }] to object
function parseOtlpAttributes(attrs: any[] = []): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const a of attrs) {
    if (!a.key) continue;
    if (a.value) {
      if ('stringValue' in a.value) result[a.key] = a.value.stringValue;
      else if ('intValue' in a.value) result[a.key] = Number(a.value.intValue);
      else if ('doubleValue' in a.value) result[a.key] = Number(a.value.doubleValue);
      else if ('boolValue' in a.value) result[a.key] = Boolean(a.value.boolValue);
      else result[a.key] = String(a.value);
    }
  }
  return result;
}

// ── OTLP HTTP /v1/traces ───────────────────────────────────────────────────
receiverRouter.post('/v1/traces', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (body?.resourceSpans) {
      for (const resSpan of body.resourceSpans) {
        const resourceAttrs = parseOtlpAttributes(resSpan.resource?.attributes);
        const serviceName = (resourceAttrs['service.name'] as string) || 'unknown-service';

        for (const scopeSpan of resSpan.scopeSpans || []) {
          for (const s of scopeSpan.spans || []) {
            const spanAttrs = parseOtlpAttributes(s.attributes);
            const mergedAttrs = { ...resourceAttrs, ...spanAttrs };

            const startTime = Number(s.startTimeUnixNano) || Date.now() * 1_000_000;
            const endTime = Number(s.endTimeUnixNano) || startTime + 10_000_000;

            const statusCode =
              s.status?.code === 2 || s.status?.code === 'STATUS_CODE_ERROR' || s.status?.code === 'ERROR'
                ? 'ERROR'
                : 'OK';

            const rawSpan: RawSpan = {
              traceId: s.traceId,
              spanId: s.spanId,
              parentSpanId: s.parentSpanId || undefined,
              name: s.name || 'unnamed-span',
              serviceName,
              kind: s.kind === 2 ? 'SERVER' : s.kind === 3 ? 'CLIENT' : 'INTERNAL',
              startTimeUnixNano: startTime,
              endTimeUnixNano: endTime,
              statusCode,
              statusMessage: s.status?.message,
              attributes: mergedAttrs,
              events: s.events,
            };

            telemetryStore.ingestSpan(rawSpan);
          }
        }
      }
    }
    return res.status(200).json({});
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── OTLP HTTP /v1/metrics ──────────────────────────────────────────────────
receiverRouter.post('/v1/metrics', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (body?.resourceMetrics) {
      for (const resMetric of body.resourceMetrics) {
        const resourceAttrs = parseOtlpAttributes(resMetric.resource?.attributes);
        const serviceName = (resourceAttrs['service.name'] as string) || 'unknown-service';

        for (const scopeMetric of resMetric.scopeMetrics || []) {
          for (const m of scopeMetric.metrics || []) {
            const metricName = m.name;
            const dataPoints =
              m.sum?.dataPoints ||
              m.gauge?.dataPoints ||
              m.histogram?.dataPoints ||
              [];

            for (const dp of dataPoints) {
              const dpAttrs = parseOtlpAttributes(dp.attributes);
              const labels: Record<string, string> = {
                service: serviceName,
              };
              for (const [k, v] of Object.entries({ ...resourceAttrs, ...dpAttrs })) {
                labels[k] = String(v);
              }

              const val = dp.asDouble ?? dp.asInt ?? dp.sum ?? 1;
              const timeNano = Number(dp.timeUnixNano) || Date.now() * 1_000_000;
              const timestampMs = Math.round(timeNano / 1_000_000);

              telemetryStore.ingestMetricSample({
                metricName,
                timestamp: timestampMs,
                value: Number(val),
                labels,
              });
            }
          }
        }
      }
    }
    return res.status(200).json({});
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── OTLP HTTP /v1/logs ─────────────────────────────────────────────────────
receiverRouter.post('/v1/logs', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (body?.resourceLogs) {
      for (const resLog of body.resourceLogs) {
        const resourceAttrs = parseOtlpAttributes(resLog.resource?.attributes);
        const serviceName = (resourceAttrs['service.name'] as string) || 'unknown-service';

        for (const scopeLog of resLog.scopeLogs || []) {
          for (const logRec of scopeLog.logRecords || []) {
            const logAttrs = parseOtlpAttributes(logRec.attributes);
            const timeNano = Number(logRec.timeUnixNano) || Date.now() * 1_000_000;
            const timestamp = new Date(Math.round(timeNano / 1_000_000)).toISOString();
            const level = logRec.severityText || 'INFO';
            const message = logRec.body?.stringValue || JSON.stringify(logRec.body) || '';

            const logEntry: LogEntry = {
              id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              timestamp,
              level: level.toUpperCase() as any,
              service: serviceName,
              environment: 'production',
              message,
              traceId: logRec.traceId || undefined,
              spanId: logRec.spanId || undefined,
              attributes: { ...resourceAttrs, ...logAttrs },
            };

            telemetryStore.ingestLog(logEntry);
          }
        }
      }
    }
    return res.status(200).json({});
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── DIRECT SIMPLIFIED INGESTION (For Microservice SDK) ───────────────────────
receiverRouter.post('/api/telemetry/ingest', (req: Request, res: Response) => {
  try {
    const { spans, metrics, logs } = req.body;
    if (Array.isArray(spans)) {
      for (const s of spans) telemetryStore.ingestSpan(s);
    }
    if (Array.isArray(metrics)) {
      for (const m of metrics) telemetryStore.ingestMetricSample(m);
    }
    if (Array.isArray(logs)) {
      for (const l of logs) {
        telemetryStore.ingestLog({
          ...l,
          environment: l.environment || 'production',
        });
      }
    }
    return res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
