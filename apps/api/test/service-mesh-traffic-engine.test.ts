import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ServiceMeshTrafficEngine } from '../src/services/service-mesh-traffic-engine.js';

describe('CLOUDPULSE Phase 32 Cloud Service Mesh & Distributed Traffic Engineering', () => {
  const engine = ServiceMeshTrafficEngine.getInstance();

  it('should return Service Mesh platform summary with health score and throughput metrics', () => {
    const summary = engine.getSummary();
    assert.strictEqual(summary.overallMeshHealthScore, 96.8);
    assert.strictEqual(summary.totalServicesCount, 3);
    assert.ok(summary.activeRoutesCount >= 4);
    assert.strictEqual(summary.mTLSComplianceRate, 100.0);
    assert.strictEqual(summary.circuitBreakersCount.closed, 2);
    assert.strictEqual(summary.circuitBreakersCount.open, 1);
  });

  it('should list mesh services with namespace, version, replicas, and mTLS status', () => {
    const services = engine.getServices('production');
    assert.strictEqual(services.length, 3);

    const gw = services.find((s) => s.name === 'api-gateway');
    assert.ok(gw);
    assert.strictEqual(gw.mTLSEnabled, true);
    assert.strictEqual(gw.certificateStatus, 'VALID');
    assert.ok(gw.dependencies.includes('order-service'));
  });

  it('should retrieve specific mesh service by ID with dependency graph and endpoints', () => {
    const ord = engine.getServiceById('mesh-svc-order');
    assert.ok(ord);
    assert.strictEqual(ord.name, 'order-service');
    assert.strictEqual(ord.replicas, 4);
    assert.ok(ord.endpoints.some((e) => e.includes('/api/v1/orders/checkout')));
  });

  it('should query service mesh instances with CPU, memory, latency, and error rates', () => {
    const instances = engine.getInstances();
    assert.ok(instances.length >= 4);

    const canaryInst = instances.find((i) => i.version === 'v2.4.0-canary');
    assert.ok(canaryInst);
    assert.strictEqual(canaryInst.health, 'HEALTHY');
    assert.ok(canaryInst.latencyMs <= 20.0);
  });

  it('should list API gateway routes with rate limits, timeout, and circuit breaker configs', () => {
    const routes = engine.getRoutes();
    assert.ok(routes.length >= 4);

    const checkoutRoute = routes.find((r) => r.id === 'route-orders-checkout');
    assert.ok(checkoutRoute);
    assert.strictEqual(checkoutRoute.method, 'POST');
    assert.strictEqual(checkoutRoute.weight, 90);
    assert.strictEqual(checkoutRoute.timeoutMs, 3000);
    assert.strictEqual(checkoutRoute.circuitBreaker.failureThresholdPercent, 25);
  });

  it('should manage weighted traffic splitting and enforce 100% weight sum validation', () => {
    const updated = engine.updateTrafficSplit('order-service', [
      { version: 'v2.3.0', weight: 80, requestsCount: 100, errorRatePercent: 0, latencyP95Ms: 12, estimatedCostPerHour: 0.2 },
      { version: 'v2.4.0-canary', weight: 20, requestsCount: 20, errorRatePercent: 0, latencyP95Ms: 11, estimatedCostPerHour: 0.05 }
    ]);
    assert.strictEqual(updated.splits[0].weight, 80);
    assert.strictEqual(updated.splits[1].weight, 20);

    // Invalid sum (!== 100)
    assert.throws(
      () => {
        engine.updateTrafficSplit('order-service', [
          { version: 'v2.3.0', weight: 80 },
          { version: 'v2.4.0-canary', weight: 10 }
        ]);
      },
      /Traffic split weights must sum exactly to 100%/
    );
  });

  it('should execute canary rollout lifecycle (start, advance, and rollback)', () => {
    // Start canary
    const canary = engine.startCanaryRollout('order-service', 'v2.4.0-canary', 10);
    assert.strictEqual(canary.mode, 'CANARY');
    assert.strictEqual(canary.splits[1].weight, 10);

    // Advance canary
    const advanced = engine.advanceCanary('order-service');
    assert.strictEqual(advanced.splits[1].weight, 20);
    assert.strictEqual(advanced.splits[0].weight, 80);

    // Rollback canary
    const rolledBack = engine.rollbackCanary('order-service');
    assert.strictEqual(rolledBack.splits[0].weight, 100);
    assert.strictEqual(rolledBack.splits[1].weight, 0);
  });

  it('should manage circuit breaker states (CLOSED, OPEN, reset) and track consecutive failures', () => {
    const tripped = engine.tripCircuitBreaker('order-service');
    assert.strictEqual(tripped.state, 'OPEN');
    assert.ok(tripped.consecutiveFailures >= 5);

    const reset = engine.resetCircuitBreaker('order-service');
    assert.strictEqual(reset.state, 'CLOSED');
    assert.strictEqual(reset.consecutiveFailures, 0);
  });

  it('should evaluate intelligent Release Guard with error rate, latency, and SLO checks', () => {
    const evalResult = engine.evaluateReleaseGuard('order-service', 'v2.4.0-canary');
    assert.strictEqual(evalResult.decision, 'SAFE_TO_PROCEED');
    assert.strictEqual(evalResult.confidenceScore, 0.98);
    assert.strictEqual(evalResult.checks.length, 4);
    assert.ok(evalResult.checks.every((c) => c.status === 'PASS'));
  });

  it('should simulate fault injection with honest SIMULATED labeling and safety notice', () => {
    const fault = engine.simulateFaultInjection('order-service', 'HTTP_503', 15);
    assert.strictEqual(fault.mode, 'SIMULATED');
    assert.strictEqual(fault.percentage, 15);
    assert.ok(fault.safetyNotice.includes('SIMULATION ONLY'));
  });

  it('should answer natural language service mesh queries with evidence citations', () => {
    const response = engine.queryMeshAssistant('Is it safe to increase traffic to order-service canary?');
    assert.strictEqual(response.status, 'OBSERVED');
    assert.ok(response.evidence.length >= 3);
    assert.ok(response.recommendation.includes('SAFE_TO_PROCEED'));
  });
});
