import type {
  IMetricsProvider,
  ILogsProvider,
  ITracingProvider,
  OverviewTelemetry,
} from './interfaces.js';
import type { MetricSummary, MetricDatapoint, LogEntry, Trace } from '@cloudpulse/shared';
import {
  metricsData,
  logsData,
  tracesData,
  servicesData,
  buildOverviewData,
} from '../demo/data.js';

export class DemoMetricsProvider implements IMetricsProvider {
  public async listMetrics(): Promise<MetricSummary[]> {
    return metricsData;
  }

  public async getMetricSummary(metricName: string): Promise<MetricSummary | null> {
    return metricsData.find((m) => m.metricName === metricName) || null;
  }

  public async queryRange(
    metricName: string,
    _start: string,
    _end: string,
    _step?: string | undefined,
    _service?: string | undefined
  ): Promise<MetricDatapoint[]> {
    const summary = metricsData.find((m) => m.metricName === metricName);
    return summary ? summary.series : [];
  }

  public async getOverviewMetrics(): Promise<OverviewTelemetry> {
    const ov = buildOverviewData();
    return {
      requestRateRps: ov.metrics.requestRateRps,
      requestRateChangePercent: ov.metrics.requestRateChangePercent,
      errorRatePercent: ov.metrics.errorRatePercent,
      errorRateChangePercent: ov.metrics.errorRateChangePercent,
      latencyP50Ms: ov.metrics.latencyP50Ms,
      latencyP95Ms: ov.metrics.latencyP95Ms,
      latencyP99Ms: ov.metrics.latencyP99Ms,
      latencyChangePercent: ov.metrics.latencyChangePercent,
      requestRateSeries: ov.telemetryTrends.requestRateSeries,
      errorRateSeries: ov.telemetryTrends.errorRateSeries,
      latencyP99Series: ov.telemetryTrends.latencyP99Series,
      latencyP50Series: ov.telemetryTrends.latencyP50Series,
    };
  }

  public async getServiceGoldenSignals(serviceName: string) {
    const svc = servicesData.find((s) => s.name === serviceName);
    if (!svc) return null;
    return {
      requestRate: svc.requestRate,
      errorRate: svc.errorRate,
      latencyP50Ms: svc.latencyP50Ms,
      latencyP95Ms: svc.latencyP95Ms,
      latencyP99Ms: svc.latencyP99Ms,
    };
  }
}

export class DemoLogsProvider implements ILogsProvider {
  public async queryLogs(filter?: {
    service?: string | undefined;
    level?: string | undefined;
    traceId?: string | undefined;
    q?: string | undefined;
    limit?: number | undefined;
  }): Promise<LogEntry[]> {
    let list = [...logsData];
    if (filter?.service && filter.service !== 'all') {
      list = list.filter((l) => l.service === filter.service);
    }
    if (filter?.level && filter.level !== 'all') {
      list = list.filter((l) => l.level === filter.level);
    }
    if (filter?.traceId) {
      list = list.filter((l) => l.traceId === filter.traceId);
    }
    if (filter?.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.service.toLowerCase().includes(q) ||
          (l.traceId && l.traceId.toLowerCase().includes(q))
      );
    }
    return list.slice(0, filter?.limit || 100);
  }
}

export class DemoTracingProvider implements ITracingProvider {
  public async getTrace(traceId: string): Promise<Trace | null> {
    return tracesData.find((t) => t.id === traceId) || null;
  }

  public async listTraces(filter?: {
    service?: string | undefined;
    status?: string | undefined;
    limit?: number | undefined;
  }): Promise<Trace[]> {
    let list = [...tracesData];
    if (filter?.service && filter.service !== 'all') {
      list = list.filter((t) => t.rootService === filter.service || t.servicesInvolved.includes(filter.service!));
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter((t) => t.statusCode === filter.status);
    }
    return list.slice(0, filter?.limit || 50);
  }
}
