import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ReliabilityEngine } from '../src/services/reliability-engine.js';

describe('CLOUDPULSE Phase 20 Cloud Reliability Command Center & SRE Platform', () => {
  const rel = ReliabilityEngine.getInstance();

  it('should generate Reliability Command Center summary with truthful metrics', () => {
    const summary = rel.getSummary();
    assert.strictEqual(typeof summary.overallReliabilityScore, 'number');
    assert.strictEqual(typeof summary.servicesCount, 'number');
    assert.strictEqual(typeof summary.tier0ServicesCount, 'number');
    assert.strictEqual(typeof summary.activeSlosCount, 'number');
    assert.strictEqual(typeof summary.alertFatigueScore, 'number');
    assert.ok(summary.overallReliabilityScore >= 90, 'Overall reliability score should meet baseline');
    assert.ok(summary.servicesCount >= 3, 'Should track at least 3 critical microservices');
  });

  it('should list service catalog items with tier, criticality, and dependencies', () => {
    const services = rel.getServices();
    assert.ok(services.length >= 3, 'Must contain baseline services');

    const tier0 = rel.getServices('TIER_0');
    assert.ok(tier0.length >= 2, 'Must contain at least 2 Tier-0 services');
    assert.ok(tier0.some((s) => s.id === 'api-gateway'), 'api-gateway must be Tier-0');
    assert.ok(tier0.some((s) => s.id === 'order-service'), 'order-service must be Tier-0');

    const gw = rel.getServiceById('api-gateway');
    assert.ok(gw, 'api-gateway must exist');
    assert.strictEqual(gw.status, 'HEALTHY');
    assert.ok(gw.dependencies.includes('order-service'), 'api-gateway must depend on order-service');
  });

  it('should query SLI definitions with mathematical formulas and measurement windows', () => {
    const slis = rel.getSlis();
    assert.ok(slis.length >= 4, 'Must define at least 4 SLIs');

    const gwAvail = slis.find((s) => s.id === 'sli-gw-avail');
    assert.ok(gwAvail, 'Ingress availability SLI must exist');
    assert.strictEqual(gwAvail.type, 'availability');
    assert.strictEqual(gwAvail.unit, '%');
    assert.ok(gwAvail.formula.includes('http_requests_total'), 'Formula must reference Prometheus metric');
    assert.ok(gwAvail.currentValue >= 99.9, 'Availability attainment must meet target');
  });

  it('should query SLO definitions and calculate current attainment vs target', () => {
    const slos = rel.getSlos();
    assert.ok(slos.length >= 4, 'Must define at least 4 SLOs');

    const gwLatSlo = slos.find((s) => s.id === 'slo-gw-lat');
    assert.ok(gwLatSlo, 'P95 latency SLO must exist');
    assert.strictEqual(gwLatSlo.target, 150.0);
    assert.strictEqual(gwLatSlo.status, 'HEALTHY');
    assert.ok(gwLatSlo.currentAttainment < gwLatSlo.target, 'Current attainment must satisfy target constraint');
  });

  it('should calculate error budget status, burn rates, and burn alert levels', () => {
    const budgets = rel.getErrorBudgets();
    assert.ok(budgets.length >= 3, 'Must track error budgets for all services');

    const gwBudget = budgets.find((b) => b.serviceId === 'api-gateway');
    assert.ok(gwBudget, 'api-gateway error budget must exist');
    assert.strictEqual(gwBudget.state, 'HEALTHY');
    assert.strictEqual(gwBudget.remainingPercentage, 80.0);
    assert.strictEqual(gwBudget.burnAlertLevel, 'NONE');

    const payBudget = budgets.find((b) => b.serviceId === 'payment-service');
    assert.ok(payBudget, 'payment-service error budget must exist');
    assert.strictEqual(payBudget.state, 'LOW');
    assert.strictEqual(payBudget.remainingPercentage, 20.0);
    assert.strictEqual(payBudget.burnAlertLevel, 'SLOW_BURN');
  });

  it('should evaluate capacity profiles with headroom percentages and 7-day forecasts', () => {
    const profiles = rel.getCapacityProfiles();
    assert.ok(profiles.length >= 3, 'Must track capacity profiles for all microservices');

    const ordCap = profiles.find((c) => c.serviceId === 'order-service');
    assert.ok(ordCap, 'order-service capacity profile must exist');
    assert.strictEqual(ordCap.riskState, 'HEALTHY');
    assert.strictEqual(ordCap.cpuHeadroomPercent, 67.9);
    assert.strictEqual(ordCap.memoryHeadroomPercent, 55.4);
    assert.strictEqual(ordCap.forecastConfidence, 'high');
  });

  it('should evaluate CI/CD reliability gate decisions (PASS / WARN / BLOCK)', () => {
    // Healthy error budget -> PASS
    const gwDecision = rel.evaluateReliabilityGate('api-gateway');
    assert.strictEqual(gwDecision.decision, 'PASS');
    assert.strictEqual(gwDecision.serviceId, 'api-gateway');

    // Low error budget -> WARN
    const payDecision = rel.evaluateReliabilityGate('payment-service');
    assert.strictEqual(payDecision.decision, 'WARN');
    assert.strictEqual(payDecision.serviceId, 'payment-service');
  });

  it('should maintain reliability findings and recommend operational remediations', () => {
    const findings = rel.getReliabilityFindings();
    assert.ok(findings.length > 0, 'Must contain seeded reliability findings');

    const highBurn = findings.find((f) => f.type === 'HIGH_BURN_RATE');
    assert.ok(highBurn, 'High burn rate finding must exist');
    assert.strictEqual(highBurn.serviceId, 'payment-service');
    assert.ok(highBurn.recommendation.length > 0, 'Recommendation must be present');
  });

  it('should maintain structured reliability runbooks with dry-run execution support', () => {
    const runbooks = rel.getReliabilityRunbooks();
    assert.ok(runbooks.length >= 2, 'Must contain at least 2 runbooks');

    const latRunbook = runbooks.find((r) => r.type === 'LATENCY');
    assert.ok(latRunbook, 'Latency mitigation runbook must exist');
    assert.strictEqual(latRunbook.serviceId, 'api-gateway');
    assert.ok(latRunbook.steps.length >= 3, 'Should contain at least 3 steps');

    const execution = rel.executeReliabilityRunbook(latRunbook.id, 'DRY_RUN');
    assert.strictEqual(execution.status, 'COMPLETED');
    assert.strictEqual(execution.mode, 'DRY_RUN');
    assert.strictEqual(execution.executedStepsCount, latRunbook.steps.length);
  });
});
