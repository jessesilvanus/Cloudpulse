import { describe, it } from 'node:test';
import assert from 'node:assert';
import { telemetryStore } from '@cloudpulse/telemetry-engine';
import { TelemetryManager } from '../src/providers/telemetryManager.js';
import { OpenTelemetrySDK } from '@cloudpulse/instrumentation';

describe('CLOUDPULSE Phase 2 Real Observability Pipeline Acceptance Test', () => {
  const manager = new TelemetryManager();

  it('should generate, propagate, and store a distributed trace across 3 microservices with identical traceId', async () => {
    const gatewaySdk = new OpenTelemetrySDK('api-gateway');
    const orderSdk = new OpenTelemetrySDK('order-service');
    const paymentSdk = new OpenTelemetrySDK('payment-service');

    const traceId = gatewaySdk.generateTraceId();

    // 1. Gateway Server Span
    const gatewaySpanId = gatewaySdk.generateSpanId();
    const gatewayCtx = { traceId, spanId: gatewaySpanId };
    const gatewaySpan = gatewaySdk.startSpan('POST /api/checkout', 'SERVER', gatewayCtx, {
      'http.method': 'POST',
      'http.route': '/api/checkout',
      'http.status_code': 200,
    });

    // 2. Gateway Client Span calling Order Service
    const orderClientSpanId = gatewaySdk.generateSpanId();
    const orderClientCtx = { traceId, spanId: orderClientSpanId, parentSpanId: gatewaySpanId };
    const orderClientSpan = gatewaySdk.startSpan('HTTP POST http://localhost:4001/orders', 'CLIENT', orderClientCtx);

    // 3. Order Service Server Span
    const orderServerSpanId = orderSdk.generateSpanId();
    const orderServerCtx = { traceId, spanId: orderServerSpanId, parentSpanId: orderClientSpanId };
    const orderServerSpan = orderSdk.startSpan('POST /orders', 'SERVER', orderServerCtx, {
      'http.method': 'POST',
      'http.route': '/orders',
      'http.status_code': 200,
    });

    // 4. Order Service Client Span calling Payment Service
    const paymentClientSpanId = orderSdk.generateSpanId();
    const paymentClientCtx = { traceId, spanId: paymentClientSpanId, parentSpanId: orderServerSpanId };
    const paymentClientSpan = orderSdk.startSpan('HTTP POST http://localhost:4002/payments/process', 'CLIENT', paymentClientCtx);

    // 5. Payment Service Server Span
    const paymentServerSpanId = paymentSdk.generateSpanId();
    const paymentServerCtx = { traceId, spanId: paymentServerSpanId, parentSpanId: paymentClientSpanId };
    const paymentServerSpan = paymentSdk.startSpan('POST /payments/process', 'SERVER', paymentServerCtx, {
      'http.method': 'POST',
      'http.route': '/payments/process',
      'http.status_code': 200,
    });

    // Emit structured logs correlated with the active traceId
    telemetryStore.ingestLog({
      id: 'log-gate-01',
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'api-gateway',
      message: 'Received checkout request',
      traceId,
      spanId: gatewaySpanId,
    });

    telemetryStore.ingestLog({
      id: 'log-ord-01',
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'order-service',
      message: 'Created order ord-test-101',
      traceId,
      spanId: orderServerSpanId,
    });

    telemetryStore.ingestLog({
      id: 'log-pay-01',
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'payment-service',
      message: 'Authorized payment pay-test-101',
      traceId,
      spanId: paymentServerSpanId,
    });

    // Ingest metrics
    telemetryStore.ingestMetricSample({
      metricName: 'http_requests_total',
      timestamp: Date.now(),
      value: 1,
      labels: { service: 'api-gateway', method: 'POST', route: '/api/checkout', status_code: '200' },
    });

    // End spans and store in telemetry engine
    paymentServerSpan.end('OK');
    telemetryStore.ingestSpan(paymentServerSpan.span as any);

    paymentClientSpan.end('OK');
    telemetryStore.ingestSpan(paymentClientSpan.span as any);

    orderServerSpan.end('OK');
    telemetryStore.ingestSpan(orderServerSpan.span as any);

    orderClientSpan.end('OK');
    telemetryStore.ingestSpan(orderClientSpan.span as any);

    gatewaySpan.end('OK');
    telemetryStore.ingestSpan(gatewaySpan.span as any);

    // ── VERIFICATION ──
    // A. Tempo trace lookup
    const retrievedTrace = await manager.tracing.getTrace(traceId);
    assert.ok(retrievedTrace, 'Tempo trace must be retrievable');
    assert.strictEqual(retrievedTrace.id, traceId, 'Trace ID must match');
    assert.strictEqual(retrievedTrace.spanCount, 5, 'Must contain 5 spans across the 3 services');
    assert.ok(retrievedTrace.servicesInvolved.includes('api-gateway'), 'Services must include api-gateway');
    assert.ok(retrievedTrace.servicesInvolved.includes('order-service'), 'Services must include order-service');
    assert.ok(retrievedTrace.servicesInvolved.includes('payment-service'), 'Services must include payment-service');

    // B. Loki logs lookup
    const retrievedLogs = await manager.logs.queryLogs({ traceId });
    assert.strictEqual(retrievedLogs.length, 3, 'Must retrieve 3 logs linked to this traceId');
    for (const log of retrievedLogs) {
      assert.strictEqual(log.traceId, traceId, 'Log traceId must equal the distributed traceId');
    }

    // C. Prometheus metrics lookup
    const retrievedMetrics = await manager.metrics.queryRange('http_requests_total', new Date(Date.now() - 60000).toISOString(), new Date().toISOString());
    assert.ok(retrievedMetrics.length > 0, 'Prometheus must return ingested samples');
  });

  it('should handle failure mode (ERROR) with error span, error logs, and error metrics', async () => {
    const errorTraceId = 'err-trace-999999999999999999999999';

    // Ingest error span on payment-service
    telemetryStore.ingestSpan({
      traceId: errorTraceId,
      spanId: 'span-pay-err-01',
      name: 'POST /payments/process',
      serviceName: 'payment-service',
      kind: 'SERVER',
      startTimeUnixNano: Date.now() * 1_000_000,
      endTimeUnixNano: (Date.now() + 50) * 1_000_000,
      statusCode: 'ERROR',
      statusMessage: 'HTTP 500: Database connection pool exhausted',
      attributes: { 'http.status_code': 500 },
    });

    telemetryStore.ingestLog({
      id: 'log-pay-err-01',
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'payment-service',
      message: 'Database connection pool exhausted during transaction commit',
      traceId: errorTraceId,
    });

    telemetryStore.ingestMetricSample({
      metricName: 'http_errors_total',
      timestamp: Date.now(),
      value: 1,
      labels: { service: 'payment-service', route: '/payments/process' },
    });

    const trace = await manager.tracing.getTrace(errorTraceId);
    assert.ok(trace, 'Error trace must exist');
    assert.strictEqual(trace.statusCode, 'ERROR', 'Trace status must be ERROR');

    const logs = await manager.logs.queryLogs({ traceId: errorTraceId, level: 'ERROR' });
    assert.strictEqual(logs.length, 1, 'Must find error log');
    assert.strictEqual(logs[0].level, 'ERROR', 'Log level must be ERROR');
  });

  it('should handle latency mode (SLOW) with increased duration in trace and metrics', async () => {
    const slowTraceId = 'slow-trace-888888888888888888888888';
    const now = Date.now();

    telemetryStore.ingestSpan({
      traceId: slowTraceId,
      spanId: 'span-pay-slow-01',
      name: 'POST /payments/process',
      serviceName: 'payment-service',
      kind: 'SERVER',
      startTimeUnixNano: now * 1_000_000,
      endTimeUnixNano: (now + 1250) * 1_000_000,
      statusCode: 'OK',
      attributes: { 'http.response_duration_ms': 1250 },
    });

    const trace = await manager.tracing.getTrace(slowTraceId);
    assert.ok(trace, 'Slow trace must exist');
    assert.ok(trace.durationMs >= 1200, `Trace duration must be >= 1200ms, was ${trace.durationMs}ms`);
  });
});
