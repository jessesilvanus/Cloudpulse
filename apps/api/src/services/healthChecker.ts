import type { SystemComponentStatus, Service } from '@cloudpulse/shared';
import { telemetryManager } from '../providers/telemetryManager.js';

interface ProbeTarget {
  id: string;
  name: string;
  category: 'core' | 'collector' | 'storage' | 'engine';
  url: string;
  version: string;
  details: string;
}

export async function checkSystemComponents(): Promise<SystemComponentStatus[]> {
  const mode = telemetryManager.getMode();

  const targets: ProbeTarget[] = [
    {
      id: 'cloudpulse-api',
      name: 'CLOUDPULSE API Gateway',
      category: 'core',
      url: 'http://localhost:3001/health',
      version: '0.0.2',
      details: 'HTTP / API v1 Core REST Gateway',
    },
    {
      id: 'otel-engine',
      name: 'OpenTelemetry Ingestion Engine',
      category: 'collector',
      url: 'http://localhost:4318/api/telemetry/status',
      version: 'v0.104.0',
      details: 'OTLP Receiver for Traces, Metrics & Logs (:4318)',
    },
    {
      id: 'prometheus-tsdb',
      name: 'Prometheus TSDB Store',
      category: 'storage',
      url: 'http://localhost:4318/api/v1/query?query=http_requests_total',
      version: 'v2.53.1',
      details: 'PromQL Matrix & Vector Engine (:9090 / :4318)',
    },
    {
      id: 'loki-store',
      name: 'Grafana Loki Log Store',
      category: 'storage',
      url: 'http://localhost:4318/loki/api/v1/labels',
      version: 'v3.0.0',
      details: 'LogQL Indexed Structured Log Store (:3100 / :4318)',
    },
    {
      id: 'tempo-store',
      name: 'Grafana Tempo Distributed Tracing',
      category: 'storage',
      url: 'http://localhost:4318/api/search',
      version: 'v2.5.0',
      details: 'W3C Distributed Trace & Span Storage (:3200 / :4318)',
    },
    {
      id: 'api-gateway-svc',
      name: 'Service: API Gateway',
      category: 'engine',
      url: 'http://localhost:4000/health',
      version: '0.0.1',
      details: 'Ingress Microservice (:4000)',
    },
    {
      id: 'order-service-svc',
      name: 'Service: Order Service',
      category: 'engine',
      url: 'http://localhost:4001/health',
      version: '0.0.1',
      details: 'Order Processing Microservice (:4001)',
    },
    {
      id: 'payment-service-svc',
      name: 'Service: Payment Service',
      category: 'engine',
      url: 'http://localhost:4002/health',
      version: '0.0.1',
      details: 'Payment Authorization & Fault Sandbox (:4002)',
    },
  ];

  const results = await Promise.all(
    targets.map(async (target): Promise<SystemComponentStatus> => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);

        const res = await fetch(target.url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const latencyMs = Math.max(1, Date.now() - start);

        if (res.ok) {
          return {
            id: target.id,
            name: target.name,
            category: target.category,
            status: latencyMs > 800 ? 'degraded' : 'operational',
            latencyMs,
            version: target.version,
            details: target.details,
            mode: mode === 'live' ? 'real' : 'simulated',
          };
        } else {
          return {
            id: target.id,
            name: target.name,
            category: target.category,
            status: 'degraded',
            latencyMs,
            version: target.version,
            details: `HTTP ${res.status} ${res.statusText}`,
            mode: mode === 'live' ? 'real' : 'simulated',
          };
        }
      } catch (err: any) {
        const latencyMs = Math.max(1, Date.now() - start);
        return {
          id: target.id,
          name: target.name,
          category: target.category,
          status: 'down',
          latencyMs,
          version: target.version,
          details: `Unreachable: ${err.message || 'Connection refused'}`,
          mode: mode === 'live' ? 'real' : 'simulated',
        };
      }
    })
  );

  return results;
}

export async function getLiveServices(): Promise<Service[]> {
  const serviceConfigs = [
    {
      id: 'api-gateway',
      name: 'api-gateway',
      description: 'Edge Ingress API Gateway & Traffic Router',
      tier: 'tier-1' as const,
      team: 'Edge Infrastructure',
      healthUrl: 'http://localhost:4000/health',
      dependencies: [
        {
          targetServiceId: 'order-service',
          targetServiceName: 'order-service',
          type: 'http' as const,
          callRateRps: 12.5,
          errorRatePercent: 0,
          p99LatencyMs: 45,
        },
      ],
    },
    {
      id: 'order-service',
      name: 'order-service',
      description: 'Order Placement, Validation & Saga Coordinator',
      tier: 'tier-1' as const,
      team: 'Checkout & Orders',
      healthUrl: 'http://localhost:4001/health',
      dependencies: [
        {
          targetServiceId: 'payment-service',
          targetServiceName: 'payment-service',
          type: 'http' as const,
          callRateRps: 12.5,
          errorRatePercent: 0,
          p99LatencyMs: 38,
        },
      ],
    },
    {
      id: 'payment-service',
      name: 'payment-service',
      description: 'Payment Authorization & Fault Simulation Sandbox',
      tier: 'tier-1' as const,
      team: 'Payment Platform',
      healthUrl: 'http://localhost:4002/health',
      dependencies: [],
    },
  ];

  const now = Date.now();
  const start = now - 60000;

  return Promise.all(
    serviceConfigs.map(async (cfg): Promise<Service> => {
      let isAlive = false;
      let pingLatencyMs = 0;
      let serviceMode = 'NORMAL';

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);
        const t0 = Date.now();
        const res = await fetch(cfg.healthUrl, { signal: controller.signal });
        clearTimeout(timeout);
        pingLatencyMs = Math.max(1, Date.now() - t0);
        if (res.ok) {
          isAlive = true;
          const json = await res.json();
          if (json.mode) serviceMode = json.mode;
        }
      } catch {
        isAlive = false;
      }

      const reqs = await telemetryManager.metrics.queryRange(
        'http_requests_total',
        new Date(start).toISOString(),
        new Date(now).toISOString(),
        '15s',
        cfg.name
      );
      const errors = await telemetryManager.metrics.queryRange(
        'http_errors_total',
        new Date(start).toISOString(),
        new Date(now).toISOString(),
        '15s',
        cfg.name
      );
      const latency = await telemetryManager.metrics.queryRange(
        'http_request_duration_ms',
        new Date(start).toISOString(),
        new Date(now).toISOString(),
        '15s',
        cfg.name
      );

      const requestRate = reqs.length > 0 ? (reqs[reqs.length - 1]?.value ?? 0) : 0;
      const errorCount = errors.length > 0 ? (errors[errors.length - 1]?.value ?? 0) : 0;
      const errorRate = requestRate > 0 ? Math.round((errorCount / requestRate) * 10000) / 100 : (serviceMode === 'ERROR' ? 100 : 0);
      const p99 = latency.length > 0 ? (latency[latency.length - 1]?.value ?? 0) : (serviceMode === 'SLOW' ? 1250 : pingLatencyMs);
      const p50 = Math.round(p99 * 0.4);
      const p95 = Math.round(p99 * 0.85);

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (!isAlive) {
        status = 'unhealthy';
      } else if (serviceMode === 'ERROR' || errorRate > 5) {
        status = 'unhealthy';
      } else if (serviceMode === 'SLOW' || p99 > 400 || errorRate > 1) {
        status = 'degraded';
      }

      const activeAlertCount = status === 'unhealthy' ? 1 : status === 'degraded' ? 1 : 0;

      return {
        id: cfg.id,
        name: cfg.name,
        description: cfg.description,
        tier: cfg.tier,
        team: cfg.team,
        environment: 'production',
        version: '0.0.1',
        status,
        uptimePercent: isAlive ? (status === 'unhealthy' ? 98.45 : 99.99) : 0,
        requestRate,
        errorRate,
        latencyP50Ms: p50,
        latencyP95Ms: p95,
        latencyP99Ms: p99,
        activeAlertCount,
        dependencies: cfg.dependencies,
        goldenSignals: {
          throughputRps: requestRate,
          errorRatePercent: errorRate,
          latencyP50Ms: p50,
          latencyP95Ms: p95,
          latencyP99Ms: p99,
          cpuUsagePercent: isAlive ? 14.2 : 0,
          memoryUsageMb: isAlive ? 142 : 0,
        },
        updatedAt: new Date().toISOString(),
      };
    })
  );
}
