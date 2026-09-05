import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  servicesData,
  alertsData,
  incidentsData,
  slosData,
  tracesData,
  logsData,
  infrastructureData,
  systemStatusData,
} from '../src/demo/data.ts';

describe('CLOUDPULSE Domain Models & Demo Provider Tests', () => {
  it('should have properly structured services with golden signals', () => {
    assert.ok(servicesData.length >= 6, 'Should have at least 6 microservices');
    for (const svc of servicesData) {
      assert.ok(svc.id, 'Service must have an ID');
      assert.ok(svc.name, 'Service must have a name');
      assert.ok(svc.tier, 'Service must have a tier');
      assert.ok(svc.goldenSignals, 'Service must have golden signals');
      assert.ok(typeof svc.requestRate === 'number', 'Request rate must be a number');
      assert.ok(typeof svc.errorRate === 'number', 'Error rate must be a number');
      assert.ok(typeof svc.latencyP99Ms === 'number', 'P99 latency must be a number');
    }
  });

  it('should have correlated distributed traces with root service and spans', () => {
    assert.ok(tracesData.length > 0, 'Should have traces');
    const checkoutTrace = tracesData.find((t) => t.id === 'tr-checkout-9921');
    assert.ok(checkoutTrace, 'Should find tr-checkout-9921');
    assert.strictEqual(checkoutTrace.statusCode, 'ERROR', 'tr-checkout-9921 should have error status');
    assert.ok(checkoutTrace.spans.length > 0, 'Trace must have root spans');
  });

  it('should have firing alerts and related incident correlation', () => {
    const firingAlerts = alertsData.filter((a) => a.state === 'firing');
    assert.ok(firingAlerts.length > 0, 'Should have firing alerts');
    const paymentAlert = alertsData.find((a) => a.id === 'alt-pay-err-01');
    assert.ok(paymentAlert, 'Payment alert must exist');
    assert.strictEqual(paymentAlert.severity, 'critical', 'Payment alert must be critical');
  });

  it('should have active SEV1 incident with response timeline', () => {
    const sev1Incidents = incidentsData.filter((i) => i.severity === 'sev1');
    assert.ok(sev1Incidents.length > 0, 'Should have active SEV1 incident');
    const inc = sev1Incidents[0];
    assert.ok(inc.timeline.length > 0, 'Incident must have timeline events');
    assert.ok(inc.affectedServices.includes('payment-service'), 'Affected services must include payment-service');
  });

  it('should have SLOs with valid target, error budget, and burn rate', () => {
    assert.ok(slosData.length > 0, 'Should have SLO definitions');
    for (const slo of slosData) {
      assert.ok(slo.targetPercent > 0 && slo.targetPercent <= 100, 'Target % must be valid');
      assert.ok(slo.burnRate >= 0, 'Burn rate must be non-negative');
      assert.ok(slo.achievementHistory.length > 0, 'Must have achievement history data points');
      assert.ok(slo.burnDownHistory.length > 0, 'Must have burn down history data points');
    }
  });

  it('should have infrastructure resources and system components', () => {
    assert.ok(infrastructureData.length > 0, 'Should have infrastructure resources');
    assert.ok(systemStatusData.length > 0, 'Should have system status components');
    for (const comp of systemStatusData) {
      assert.ok(comp.name, 'Component must have a name');
      assert.ok(comp.status, 'Component must have a status');
    }
  });
});
