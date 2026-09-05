import type { Request, Response } from 'express';

interface MetricCounters {
  totalRequests: number;
  totalErrors: number;
  durationHistogram: number[];
  requestsByRoute: Map<string, number>;
  errorsByRoute: Map<string, number>;
}

const serviceMetrics: MetricCounters = {
  totalRequests: 0,
  totalErrors: 0,
  durationHistogram: [],
  requestsByRoute: new Map(),
  errorsByRoute: new Map(),
};

export function recordHttpRequest(
  serviceName: string,
  method: string,
  route: string,
  statusCode: number,
  durationMs: number
): void {
  serviceMetrics.totalRequests++;
  const routeKey = `${method}_${route}`;
  serviceMetrics.requestsByRoute.set(routeKey, (serviceMetrics.requestsByRoute.get(routeKey) || 0) + 1);

  if (statusCode >= 500) {
    serviceMetrics.totalErrors++;
    serviceMetrics.errorsByRoute.set(routeKey, (serviceMetrics.errorsByRoute.get(routeKey) || 0) + 1);
  }

  serviceMetrics.durationHistogram.push(durationMs);
  if (serviceMetrics.durationHistogram.length > 500) {
    serviceMetrics.durationHistogram.shift();
  }

  // Push metric sample to local Telemetry Engine / Prometheus Exporter
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
  const nowMs = Date.now();

  fetch(`${endpoint}/api/telemetry/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metrics: [
        {
          metricName: 'http_requests_total',
          timestamp: nowMs,
          value: serviceMetrics.totalRequests,
          labels: { service: serviceName, method, route, status_code: statusCode.toString() },
        },
        {
          metricName: 'http_request_duration_ms',
          timestamp: nowMs,
          value: durationMs,
          labels: { service: serviceName, method, route },
        },
        {
          metricName: 'http_errors_total',
          timestamp: nowMs,
          value: serviceMetrics.totalErrors,
          labels: { service: serviceName, method, route },
        },
      ],
    }),
  }).catch(() => {
    // Ignore push errors in background
  });
}

// Prometheus text-format handler for GET /metrics
export function prometheusMetricsHandler(serviceName: string) {
  return (_req: Request, res: Response) => {
    let output = `# HELP http_requests_total Total number of HTTP requests processed\n`;
    output += `# TYPE http_requests_total counter\n`;
    output += `http_requests_total{service="${serviceName}"} ${serviceMetrics.totalRequests}\n\n`;

    output += `# HELP http_errors_total Total number of HTTP errors (5xx)\n`;
    output += `# TYPE http_errors_total counter\n`;
    output += `http_errors_total{service="${serviceName}"} ${serviceMetrics.totalErrors}\n\n`;

    const avgDuration =
      serviceMetrics.durationHistogram.length > 0
        ? serviceMetrics.durationHistogram.reduce((a, b) => a + b, 0) / serviceMetrics.durationHistogram.length
        : 0;

    output += `# HELP http_request_duration_ms Mean HTTP request duration in milliseconds\n`;
    output += `# TYPE http_request_duration_ms gauge\n`;
    output += `http_request_duration_ms{service="${serviceName}"} ${Math.round(avgDuration * 100) / 100}\n\n`;

    output += `# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds\n`;
    output += `# TYPE process_cpu_seconds_total counter\n`;
    output += `process_cpu_seconds_total{service="${serviceName}"} ${(process.cpuUsage().user / 1e6).toFixed(2)}\n\n`;

    output += `# HELP process_resident_memory_bytes Resident memory size in bytes\n`;
    output += `# TYPE process_resident_memory_bytes gauge\n`;
    output += `process_resident_memory_bytes{service="${serviceName}"} ${process.memoryUsage().rss}\n`;

    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    return res.status(200).send(output);
  };
}
