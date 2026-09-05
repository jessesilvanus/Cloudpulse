import {
  ObservabilitySummary,
  DistributedTrace,
  TraceSpan,
  ServiceDependencyGraph,
  ServiceMapNode,
  ServiceMapEdge,
  RedMetrics,
  UseMetrics,
  RootCauseHypothesis,
  TelemetryQualityScore
} from '@cloudpulse/shared';

export class ObservabilityEngine {
  private static instance: ObservabilityEngine;

  private traces: DistributedTrace[] = [
    {
      traceId: 'tr-001-live-checkout',
      requestId: 'req-chk-99120',
      rootService: 'api-gateway',
      startTime: new Date(Date.now() - 120000).toISOString(),
      durationMs: 142,
      status: 'ok',
      serviceCount: 3,
      spanCount: 5,
      errorCount: 0,
      correlatedLogsCount: 8,
      spans: [
        {
          spanId: 'sp-gw-01',
          traceId: 'tr-001-live-checkout',
          service: 'api-gateway',
          operation: 'POST /api/v1/orders/checkout',
          startTime: new Date(Date.now() - 120000).toISOString(),
          durationMs: 142,
          status: 'ok',
          httpStatusCode: 200,
          attributes: { 'http.method': 'POST', 'http.route': '/api/v1/orders/checkout' }
        },
        {
          spanId: 'sp-ord-01',
          traceId: 'tr-001-live-checkout',
          parentSpanId: 'sp-gw-01',
          service: 'order-service',
          operation: 'POST /orders/process',
          startTime: new Date(Date.now() - 119980).toISOString(),
          durationMs: 118,
          status: 'ok',
          httpStatusCode: 200,
          attributes: { 'order.id': 'ord-101', 'order.amount': 150.0 }
        },
        {
          spanId: 'sp-pay-01',
          traceId: 'tr-001-live-checkout',
          parentSpanId: 'sp-ord-01',
          service: 'payment-service',
          operation: 'POST /payments/authorize',
          startTime: new Date(Date.now() - 119940).toISOString(),
          durationMs: 65,
          status: 'ok',
          httpStatusCode: 200,
          attributes: { 'payment.gateway': 'sandbox', 'payment.status': 'settled' }
        }
      ]
    },
    {
      traceId: 'tr-002-payment-timeout',
      requestId: 'req-chk-99125',
      rootService: 'api-gateway',
      startTime: new Date(Date.now() - 60000).toISOString(),
      durationMs: 1850,
      status: 'error',
      serviceCount: 3,
      spanCount: 5,
      errorCount: 2,
      correlatedLogsCount: 14,
      correlatedIncidentId: 'inc-001-payment-degradation',
      spans: [
        {
          spanId: 'sp-gw-02',
          traceId: 'tr-002-payment-timeout',
          service: 'api-gateway',
          operation: 'POST /api/v1/orders/checkout',
          startTime: new Date(Date.now() - 60000).toISOString(),
          durationMs: 1850,
          status: 'error',
          httpStatusCode: 504,
          errorMessage: 'Gateway Timeout: downstream service failure',
          attributes: { 'http.method': 'POST', 'http.status_code': 504 }
        },
        {
          spanId: 'sp-ord-02',
          traceId: 'tr-002-payment-timeout',
          parentSpanId: 'sp-gw-02',
          service: 'order-service',
          operation: 'POST /orders/process',
          startTime: new Date(Date.now() - 59980).toISOString(),
          durationMs: 1820,
          status: 'error',
          httpStatusCode: 504,
          errorMessage: 'Payment gateway timeout after 1500ms',
          attributes: { 'order.id': 'ord-102', 'error.type': 'TimeoutException' }
        },
        {
          spanId: 'sp-pay-02',
          traceId: 'tr-002-payment-timeout',
          parentSpanId: 'sp-ord-02',
          service: 'payment-service',
          operation: 'POST /payments/authorize',
          startTime: new Date(Date.now() - 59940).toISOString(),
          durationMs: 1500,
          status: 'error',
          httpStatusCode: 504,
          errorMessage: 'DB Connection Pool Exhaustion on payment ledger',
          attributes: { 'db.pool.exhausted': true, 'error.type': 'ConnectionTimeout' }
        }
      ]
    }
  ];

  public static getInstance(): ObservabilityEngine {
    if (!ObservabilityEngine.instance) {
      ObservabilityEngine.instance = new ObservabilityEngine();
    }
    return ObservabilityEngine.instance;
  }

  public getSummary(): ObservabilitySummary {
    const graph = this.getServiceDependencyGraph();
    const degradedCount = graph.nodes.filter((n) => n.health !== 'healthy').length;
    const quality = this.getTelemetryQualityScore();

    return {
      totalTracesIngested: 14280,
      totalLogsIngested: 89450,
      totalMetricsSamples: 1450200,
      activeServicesCount: graph.nodes.length,
      degradedServicesCount: degradedCount,
      telemetryQualityScore: quality.overallScore,
      telemetryVolumeMbPerHour: 48.5,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getTraces(
    page: number = 1,
    limit: number = 10,
    service?: string,
    status?: string
  ): { traces: DistributedTrace[]; total: number; page: number; limit: number } {
    let filtered = [...this.traces];
    if (service) {
      filtered = filtered.filter((t) => t.rootService === service || t.spans.some((s) => s.service === service));
    }
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    return {
      traces: paginated,
      total: filtered.length,
      page,
      limit
    };
  }

  public getTraceById(traceId: string): DistributedTrace | undefined {
    return this.traces.find((t) => t.traceId === traceId);
  }

  public getServiceDependencyGraph(): ServiceDependencyGraph {
    const nodes: ServiceMapNode[] = [
      {
        id: 'node-api-gateway',
        name: 'api-gateway',
        health: 'healthy',
        requestRatePerSec: 125.4,
        errorRatePercent: 0.8,
        p95LatencyMs: 85,
        cpuUtilizationPercent: 32.5,
        memoryUtilizationPercent: 44.0,
        podCount: 2,
        cloudProvider: 'kubernetes'
      },
      {
        id: 'node-order-service',
        name: 'order-service',
        health: 'healthy',
        requestRatePerSec: 94.2,
        errorRatePercent: 1.1,
        p95LatencyMs: 110,
        cpuUtilizationPercent: 38.0,
        memoryUtilizationPercent: 52.1,
        podCount: 2,
        cloudProvider: 'kubernetes'
      },
      {
        id: 'node-payment-service',
        name: 'payment-service',
        health: 'degraded',
        requestRatePerSec: 68.5,
        errorRatePercent: 3.4,
        p95LatencyMs: 340,
        cpuUtilizationPercent: 68.2,
        memoryUtilizationPercent: 74.5,
        podCount: 2,
        cloudProvider: 'kubernetes'
      }
    ];

    const edges: ServiceMapEdge[] = [
      {
        source: 'api-gateway',
        target: 'order-service',
        requestRatePerSec: 94.2,
        errorRatePercent: 1.1,
        p95LatencyMs: 110,
        health: 'healthy'
      },
      {
        source: 'order-service',
        target: 'payment-service',
        requestRatePerSec: 68.5,
        errorRatePercent: 3.4,
        p95LatencyMs: 340,
        health: 'degraded'
      }
    ];

    return {
      nodes,
      edges,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getRedMetrics(service?: string): RedMetrics[] {
    const allMetrics: RedMetrics[] = [
      {
        service: 'api-gateway',
        ratePerSec: 125.4,
        errorRatePercent: 0.8,
        p50Ms: 32,
        p90Ms: 65,
        p95Ms: 85,
        p99Ms: 145,
        timeRange: 'last_1h'
      },
      {
        service: 'order-service',
        ratePerSec: 94.2,
        errorRatePercent: 1.1,
        p50Ms: 45,
        p90Ms: 85,
        p95Ms: 110,
        p99Ms: 210,
        timeRange: 'last_1h'
      },
      {
        service: 'payment-service',
        ratePerSec: 68.5,
        errorRatePercent: 3.4,
        p50Ms: 85,
        p90Ms: 220,
        p95Ms: 340,
        p99Ms: 780,
        timeRange: 'last_1h'
      }
    ];

    if (service) {
      return allMetrics.filter((m) => m.service === service);
    }
    return allMetrics;
  }

  public getUseMetrics(): UseMetrics[] {
    return [
      {
        resourceId: 'pod-api-gateway-7f89d4-1',
        resourceType: 'kubernetes_pod',
        utilizationPercent: 32.5,
        saturationPercent: 15.0,
        errorCount: 2
      },
      {
        resourceId: 'pod-order-service-6b45a9-1',
        resourceType: 'kubernetes_pod',
        utilizationPercent: 38.0,
        saturationPercent: 18.2,
        errorCount: 4
      },
      {
        resourceId: 'pod-payment-service-9c12b7-1',
        resourceType: 'kubernetes_pod',
        utilizationPercent: 68.2,
        saturationPercent: 42.0,
        errorCount: 18
      },
      {
        resourceId: 'k8s-node-worker-01',
        resourceType: 'ec2_instance',
        utilizationPercent: 54.1,
        saturationPercent: 22.4,
        errorCount: 0
      }
    ];
  }

  public getRootCauseHypotheses(): RootCauseHypothesis[] {
    return [
      {
        id: 'rca-001-db-pool-timeout',
        suspectedRootCause: 'Payment Ledger DB Connection Pool Saturation',
        affectedService: 'payment-service',
        confidence: 'high',
        confidenceScore: 0.94,
        evidenceSignals: [
          'Trace tr-002-payment-timeout recorded 1500ms timeout on payment-service span',
          'Loki logs recorded 14 occurrences of ConnectionTimeout on payment database pool',
          'Prometheus payment_service_latency_seconds p95 spiked from 85ms to 340ms',
          'Cascading failure observed propagating to order-service and api-gateway (504 status)'
        ],
        cascadingFailurePath: [
          'payment-service: Database Pool Exhaustion',
          'order-service: Payment Client Gateway Timeout (504)',
          'api-gateway: Ingress Request Timeout (504)'
        ],
        recommendedMitigation:
          'Increase RDS PostgreSQL max_connections parameter and restart payment-service deployment pods.',
        detectedAt: new Date(Date.now() - 300000).toISOString()
      }
    ];
  }

  public getTelemetryQualityScore(): TelemetryQualityScore {
    const traceCompleteness = 98;
    const correlationCoverage = 96;
    const cardinalityHealth = 95;
    const redactionIntegrity = 100;
    const timestampAccuracy = 99;

    const overallScore = Math.round(
      traceCompleteness * 0.25 +
        correlationCoverage * 0.25 +
        cardinalityHealth * 0.2 +
        redactionIntegrity * 0.15 +
        timestampAccuracy * 0.15
    ); // 97%

    return {
      overallScore,
      grade: 'A+',
      traceCompletenessPercent: traceCompleteness,
      correlationCoveragePercent: correlationCoverage,
      cardinalityHealthPercent: cardinalityHealth,
      redactionIntegrityPercent: redactionIntegrity,
      timestampAccuracyPercent: timestampAccuracy,
      evaluatedAt: new Date().toISOString()
    };
  }
}
