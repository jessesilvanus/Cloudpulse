import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ObservabilityEngine } from '../src/services/observability-engine.js';

describe('CLOUDPULSE Phase 14 Advanced Observability & Distributed Tracing Engine', () => {
  const obsEngine = ObservabilityEngine.getInstance();

  it('should generate observability summary metrics with telemetry quality score and active services', () => {
    const summary = obsEngine.getSummary();
    assert.ok(summary.totalTracesIngested > 1000);
    assert.ok(summary.totalLogsIngested > 1000);
    assert.ok(summary.totalMetricsSamples > 10000);
    assert.ok(summary.activeServicesCount >= 3);
    assert.ok(summary.telemetryQualityScore >= 90);
    assert.ok(summary.telemetryVolumeMbPerHour > 0);
  });

  it('should query paginated distributed traces with service and status filters', () => {
    const result = obsEngine.getTraces(1, 10);
    assert.ok(result.traces.length >= 2);
    assert.ok(result.total >= 2);
    assert.strictEqual(result.page, 1);
    assert.strictEqual(result.limit, 10);

    const errorTraces = obsEngine.getTraces(1, 10, undefined, 'error');
    assert.ok(errorTraces.traces.length >= 1);
    assert.ok(errorTraces.traces.every((t) => t.status === 'error'));
  });

  it('should retrieve trace details with accurate span hierarchy, duration, and error attributes', () => {
    const trace = obsEngine.getTraceById('tr-002-payment-timeout');
    assert.ok(trace);
    assert.strictEqual(trace.traceId, 'tr-002-payment-timeout');
    assert.strictEqual(trace.status, 'error');
    assert.strictEqual(trace.rootService, 'api-gateway');
    assert.ok(trace.durationMs > 1000);
    assert.strictEqual(trace.spans.length, 3);

    const failedSpan = trace.spans.find((s) => s.service === 'payment-service');
    assert.ok(failedSpan);
    assert.strictEqual(failedSpan.status, 'error');
    assert.ok(failedSpan.errorMessage?.includes('DB Connection Pool'));
  });

  it('should derive dynamic service dependency graph with RED metrics and health statuses', () => {
    const graph = obsEngine.getServiceDependencyGraph();
    assert.ok(graph.nodes.length >= 3);
    assert.ok(graph.edges.length >= 2);

    const apiGwNode = graph.nodes.find((n) => n.name === 'api-gateway');
    assert.ok(apiGwNode);
    assert.strictEqual(apiGwNode.health, 'healthy');
    assert.ok(apiGwNode.requestRatePerSec > 50);

    const paymentNode = graph.nodes.find((n) => n.name === 'payment-service');
    assert.ok(paymentNode);
    assert.strictEqual(paymentNode.health, 'degraded');
    assert.ok(paymentNode.p95LatencyMs > 200);

    const edge = graph.edges.find((e) => e.source === 'api-gateway' && e.target === 'order-service');
    assert.ok(edge);
    assert.strictEqual(edge.health, 'healthy');
  });

  it('should calculate RED metrics with multi-quantile latency distribution (P50, P90, P95, P99)', () => {
    const red = obsEngine.getRedMetrics('api-gateway');
    assert.strictEqual(red.length, 1);
    assert.strictEqual(red[0].service, 'api-gateway');
    assert.ok(red[0].p50Ms < red[0].p90Ms);
    assert.ok(red[0].p90Ms <= red[0].p95Ms);
    assert.ok(red[0].p95Ms <= red[0].p99Ms);
  });

  it('should evaluate USE metrics for underlying Kubernetes pods and compute nodes', () => {
    const use = obsEngine.getUseMetrics();
    assert.ok(use.length >= 3);
    assert.ok(use.some((u) => u.resourceType === 'kubernetes_pod'));
    assert.ok(use.some((u) => u.resourceType === 'ec2_instance'));
    assert.ok(use.every((u) => u.utilizationPercent >= 0 && u.utilizationPercent <= 100));
  });

  it('should perform deterministic multi-signal root cause analysis with cascading failure chains', () => {
    const rcaList = obsEngine.getRootCauseHypotheses();
    assert.ok(rcaList.length >= 1);

    const rca = rcaList[0];
    assert.strictEqual(rca.affectedService, 'payment-service');
    assert.strictEqual(rca.confidence, 'high');
    assert.ok(rca.confidenceScore > 0.85);
    assert.ok(rca.evidenceSignals.length >= 3);
    assert.ok(rca.cascadingFailurePath.length >= 2);
    assert.ok(rca.recommendedMitigation.length > 10);
  });

  it('should evaluate telemetry quality score across completeness, correlation, and redaction dimensions', () => {
    const quality = obsEngine.getTelemetryQualityScore();
    assert.ok(quality.overallScore >= 90);
    assert.strictEqual(quality.grade, 'A+');
    assert.strictEqual(quality.redactionIntegrityPercent, 100);
    assert.ok(quality.traceCompletenessPercent >= 95);
  });
});
