import type {
  IMetricsProvider,
  ILogsProvider,
  ITracingProvider,
  TelemetryStatus,
} from './interfaces.js';
import { DemoMetricsProvider, DemoLogsProvider, DemoTracingProvider } from './demoProviders.js';
import { LiveMetricsProvider, LiveLogsProvider, LiveTracingProvider } from './liveProviders.js';
import { telemetryStore } from '@cloudpulse/telemetry-engine';

export class TelemetryManager {
  private mode: 'live' | 'demo';
  private demoMetrics: IMetricsProvider;
  private demoLogs: ILogsProvider;
  private demoTracing: ITracingProvider;

  private liveMetrics: IMetricsProvider;
  private liveLogs: ILogsProvider;
  private liveTracing: ITracingProvider;

  constructor() {
    // Default to 'live' if specified or in local dev with microservices running
    const envMode = process.env.TELEMETRY_MODE?.toLowerCase();
    this.mode = envMode === 'demo' ? 'demo' : 'live';

    this.demoMetrics = new DemoMetricsProvider();
    this.demoLogs = new DemoLogsProvider();
    this.demoTracing = new DemoTracingProvider();

    this.liveMetrics = new LiveMetricsProvider();
    this.liveLogs = new LiveLogsProvider();
    this.liveTracing = new LiveTracingProvider();
  }

  public getMode(): 'live' | 'demo' {
    return this.mode;
  }

  public setMode(newMode: 'live' | 'demo'): void {
    this.mode = newMode;
  }

  public get metrics(): IMetricsProvider {
    return this.mode === 'live' ? this.liveMetrics : this.demoMetrics;
  }

  public get logs(): ILogsProvider {
    return this.mode === 'live' ? this.liveLogs : this.demoLogs;
  }

  public get tracing(): ITracingProvider {
    return this.mode === 'live' ? this.liveTracing : this.demoTracing;
  }

  public async getStatus(): Promise<TelemetryStatus> {
    const stats = telemetryStore.getStats();
    const isLive = this.mode === 'live';

    return {
      mode: this.mode,
      status: 'OPERATIONAL',
      activeSources: {
        collector: {
          status: 'OPERATIONAL',
          url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
        },
        prometheus: {
          status: 'OPERATIONAL',
          url: process.env.PROMETHEUS_URL || 'http://localhost:9090',
        },
        loki: {
          status: 'OPERATIONAL',
          url: process.env.LOKI_URL || 'http://localhost:3100',
        },
        tempo: {
          status: 'OPERATIONAL',
          url: process.env.TEMPO_URL || 'http://localhost:3200',
        },
      },
      metricsCount: isLive ? stats.metricSampleCount : 240,
      logsCount: isLive ? stats.logCount : 150,
      tracesCount: isLive ? stats.traceCount : 45,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const telemetryManager = new TelemetryManager();
