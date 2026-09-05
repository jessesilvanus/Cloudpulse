import type {
  IMetricsProvider,
  ILogsProvider,
  ITracingProvider,
  OverviewTelemetry,
} from './interfaces.js';
import type { MetricSummary, MetricDatapoint, LogEntry, Trace } from '@cloudpulse/shared';
import { telemetryStore } from '@cloudpulse/telemetry-engine';

export class LiveMetricsProvider implements IMetricsProvider {
  public async listMetrics(): Promise<MetricSummary[]> {
    const names = [
      'http_requests_total',
      'http_request_duration_ms',
      'http_errors_total',
      'process_cpu_seconds_total',
      'process_resident_memory_bytes',
    ];

    const now = Date.now();
    const start = now - 15 * 60 * 1000;
    const summaries: MetricSummary[] = [];

    for (const name of names) {
      const dataPoints = await this.queryRange(name, new Date(start).toISOString(), new Date(now).toISOString());
      const values = dataPoints.map((d) => d.value);
      const current = values.length > 0 ? (values[values.length - 1] ?? 0) : 0;
      const min = values.length > 0 ? Math.min(...values) : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;
      const avg = values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : 0;

      summaries.push({
        metricName: name,
        displayName: name.replace(/_/g, ' ').toUpperCase(),
        description: `Live Prometheus metric: ${name}`,
        unit: name.includes('duration') ? 'ms' : name.includes('bytes') ? 'bytes' : name.includes('cpu') ? 's' : 'count',
        category: name.includes('http') ? 'http' : 'system',
        currentValue: current,
        minValue: min,
        maxValue: max,
        avgValue: avg,
        p50Value: Math.round(avg * 0.8),
        p95Value: max,
        p99Value: max,
        changePercent: 0,
        series: dataPoints,
      });
    }

    return summaries;
  }

  public async getMetricSummary(metricName: string): Promise<MetricSummary | null> {
    const list = await this.listMetrics();
    return list.find((m) => m.metricName === metricName) || null;
  }

  public async queryRange(
    metricName: string,
    start: string,
    end: string,
    _step?: string | undefined,
    service?: string | undefined
  ): Promise<MetricDatapoint[]> {
    const startMs = !isNaN(Number(start)) ? Number(start) * 1000 : new Date(start).getTime();
    const endMs = !isNaN(Number(end)) ? Number(end) * 1000 : new Date(end).getTime();

    return telemetryStore.queryMetricRange(
      metricName,
      startMs,
      endMs,
      15000,
      service && service !== 'all' ? { service } : undefined
    );
  }

  public async getOverviewMetrics(): Promise<OverviewTelemetry> {
    const now = Date.now();
    const start = now - 15 * 60 * 1000;

    const requestRateSeries = await this.queryRange('http_requests_total', new Date(start).toISOString(), new Date(now).toISOString());
    const errorRateSeries = await this.queryRange('http_errors_total', new Date(start).toISOString(), new Date(now).toISOString());
    const latencyP99Series = await this.queryRange('http_request_duration_ms', new Date(start).toISOString(), new Date(now).toISOString());

    const totalRps = requestRateSeries.length > 0 ? (requestRateSeries[requestRateSeries.length - 1]?.value ?? 0) : 0;
    const totalErrors = errorRateSeries.length > 0 ? (errorRateSeries[errorRateSeries.length - 1]?.value ?? 0) : 0;
    const errorRatePercent = totalRps > 0 ? Math.round((totalErrors / totalRps) * 10000) / 100 : 0;

    const p99 = latencyP99Series.length > 0 ? (latencyP99Series[latencyP99Series.length - 1]?.value ?? 0) : 0;
    const p50 = Math.round(p99 * 0.4);

    return {
      requestRateRps: totalRps,
      requestRateChangePercent: 0,
      errorRatePercent,
      errorRateChangePercent: 0,
      latencyP50Ms: p50,
      latencyP95Ms: Math.round(p99 * 0.8),
      latencyP99Ms: p99,
      latencyChangePercent: 0,
      requestRateSeries,
      errorRateSeries,
      latencyP99Series,
      latencyP50Series: latencyP99Series.map((d) => ({ timestamp: d.timestamp, value: Math.round(d.value * 0.4) })),
    };
  }

  public async getServiceGoldenSignals(serviceName: string) {
    const now = Date.now();
    const start = now - 60000;

    const reqs = await this.queryRange('http_requests_total', new Date(start).toISOString(), new Date(now).toISOString(), '15s', serviceName);
    const errors = await this.queryRange('http_errors_total', new Date(start).toISOString(), new Date(now).toISOString(), '15s', serviceName);
    const latency = await this.queryRange('http_request_duration_ms', new Date(start).toISOString(), new Date(now).toISOString(), '15s', serviceName);

    const requestRate = reqs.length > 0 ? (reqs[reqs.length - 1]?.value ?? 0) : 0;
    const errorCount = errors.length > 0 ? (errors[errors.length - 1]?.value ?? 0) : 0;
    const errorRate = requestRate > 0 ? Math.round((errorCount / requestRate) * 10000) / 100 : 0;
    const p99 = latency.length > 0 ? (latency[latency.length - 1]?.value ?? 0) : 0;

    return {
      requestRate,
      errorRate,
      latencyP50Ms: Math.round(p99 * 0.4),
      latencyP95Ms: Math.round(p99 * 0.8),
      latencyP99Ms: p99,
    };
  }
}

export class LiveLogsProvider implements ILogsProvider {
  public async queryLogs(filter?: {
    service?: string | undefined;
    level?: string | undefined;
    traceId?: string | undefined;
    q?: string | undefined;
    limit?: number | undefined;
  }): Promise<LogEntry[]> {
    return telemetryStore.queryLogs(filter);
  }
}

export class LiveTracingProvider implements ITracingProvider {
  public async getTrace(traceId: string): Promise<Trace | null> {
    return telemetryStore.getTrace(traceId);
  }

  public async listTraces(filter?: {
    service?: string | undefined;
    status?: string | undefined;
    limit?: number | undefined;
  }): Promise<Trace[]> {
    return telemetryStore.listTraces(filter);
  }
}
