import type { Request, Response, NextFunction } from 'express';
import { getOpenTelemetry, type SpanContext } from './tracer.js';
import { recordHttpRequest } from './metrics.js';

export interface TracedRequest extends Request {
  traceId?: string;
  spanId?: string;
}

export function openTelemetryMiddleware() {
  const sdk = getOpenTelemetry();

  return (req: TracedRequest, res: Response, next: NextFunction) => {
    // Check incoming W3C traceparent header
    const rawTraceparent = req.headers['traceparent'] as string | undefined;
    const parentCtx = sdk.parseTraceparent(rawTraceparent);

    const traceId = parentCtx?.traceId || sdk.generateTraceId();
    const spanId = sdk.generateSpanId();
    const parentSpanId = parentCtx?.parentSpanId;

    const currentContext: SpanContext = {
      traceId,
      spanId,
      parentSpanId,
    };

    req.traceId = traceId;
    req.spanId = spanId;

    // Set W3C response headers for client visibility
    res.setHeader('traceparent', sdk.formatTraceparent(currentContext));

    const spanName = `${req.method} ${req.baseUrl || req.path}`;
    const spanHandle = sdk.startSpan(spanName, 'SERVER', currentContext, {
      'http.method': req.method,
      'http.url': req.originalUrl || req.url,
      'http.route': req.route?.path || req.path,
      'http.target': req.url,
      'http.host': req.headers.host || 'localhost',
      'http.user_agent': req.headers['user-agent'] || 'unknown',
    });

    const startHrTime = process.hrtime();

    // Hook response completion
    res.on('finish', () => {
      const diff = process.hrtime(startHrTime);
      const durationMs = Math.max(1, Math.round((diff[0] * 1e9 + diff[1]) / 1e6));

      const statusCode = res.statusCode;
      const isError = statusCode >= 500;

      spanHandle.setAttribute('http.status_code', statusCode);
      spanHandle.setAttribute('http.response_duration_ms', durationMs);
      spanHandle.end(isError ? 'ERROR' : 'OK', isError ? `HTTP ${statusCode}` : undefined);

      // Record metrics into TSDB
      recordHttpRequest(sdk.getServiceName(), req.method, req.path, statusCode, durationMs);
    });

    // Run remaining middleware and handlers inside the active AsyncLocalStorage context
    sdk.runWithContext(currentContext, () => {
      next();
    });
  };
}
