import { getOpenTelemetry, type SpanContext } from './tracer.js';

export interface TracedFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function tracedFetch(url: string, options: TracedFetchOptions = {}): Promise<Response> {
  const sdk = getOpenTelemetry();
  const activeCtx = sdk.getActiveContext();

  const clientSpanId = sdk.generateSpanId();
  const clientContext: SpanContext = {
    traceId: activeCtx?.traceId || sdk.generateTraceId(),
    spanId: clientSpanId,
    parentSpanId: activeCtx?.spanId,
  };

  const parsedUrl = new URL(url);
  const method = options.method || 'GET';
  const spanName = `HTTP ${method} ${parsedUrl.pathname}`;

  const spanHandle = sdk.startSpan(spanName, 'CLIENT', clientContext, {
    'http.method': method,
    'http.url': url,
    'http.host': parsedUrl.host,
    'http.target': parsedUrl.pathname,
  });

  const headers = new Headers(options.headers || {});
  headers.set('traceparent', sdk.formatTraceparent(clientContext));

  const startHrTime = process.hrtime();

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const diff = process.hrtime(startHrTime);
    const durationMs = Math.max(1, Math.round((diff[0] * 1e9 + diff[1]) / 1e6));
    const isError = response.status >= 500;

    spanHandle.setAttribute('http.status_code', response.status);
    spanHandle.setAttribute('http.response_duration_ms', durationMs);
    spanHandle.end(isError ? 'ERROR' : 'OK', isError ? `HTTP ${response.status}` : undefined);

    return response;
  } catch (error: any) {
    const diff = process.hrtime(startHrTime);
    const durationMs = Math.max(1, Math.round((diff[0] * 1e9 + diff[1]) / 1e6));

    spanHandle.setAttribute('http.response_duration_ms', durationMs);
    spanHandle.end('ERROR', error.message);
    throw error;
  }
}
