import type {
  MetricSummary,
  MetricDatapoint,
  LogEntry,
  Trace,
} from '@cloudpulse/shared';

export interface OverviewTelemetry {
  requestRateRps: number;
  requestRateChangePercent: number;
  errorRatePercent: number;
  errorRateChangePercent: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyP99Ms: number;
  latencyChangePercent: number;
  requestRateSeries: MetricDatapoint[];
  errorRateSeries: MetricDatapoint[];
  latencyP99Series: MetricDatapoint[];
  latencyP50Series: MetricDatapoint[];
}

export interface IMetricsProvider {
  listMetrics(): Promise<MetricSummary[]>;
  getMetricSummary(metricName: string): Promise<MetricSummary | null>;
  queryRange(
    metricName: string,
    start: string,
    end: string,
    step?: string | undefined,
    service?: string | undefined
  ): Promise<MetricDatapoint[]>;
  getOverviewMetrics(): Promise<OverviewTelemetry>;
  getServiceGoldenSignals(serviceName: string): Promise<{
    requestRate: number;
    errorRate: number;
    latencyP50Ms: number;
    latencyP95Ms: number;
    latencyP99Ms: number;
  } | null>;
}

export interface ILogsProvider {
  queryLogs(filter?: {
    service?: string | undefined;
    level?: string | undefined;
    traceId?: string | undefined;
    q?: string | undefined;
    limit?: number | undefined;
  }): Promise<LogEntry[]>;
}

export interface ITracingProvider {
  getTrace(traceId: string): Promise<Trace | null>;
  listTraces(filter?: {
    service?: string | undefined;
    status?: string | undefined;
    limit?: number | undefined;
  }): Promise<Trace[]>;
}

export interface TelemetryStatus {
  mode: 'live' | 'demo';
  status: 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE';
  activeSources: {
    collector: { status: string; url: string };
    prometheus: { status: string; url: string };
    loki: { status: string; url: string };
    tempo: { status: string; url: string };
  };
  metricsCount: number;
  logsCount: number;
  tracesCount: number;
  updatedAt: string;
}
