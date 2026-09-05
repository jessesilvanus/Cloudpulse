import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EnterpriseFinOpsBusinessEngine } from '../src/services/enterprise-finops-business-engine.js';

describe('CLOUDPULSE Phase 28 Enterprise FinOps, Cost Intelligence & Business Impact Engine', () => {
  const engine = EnterpriseFinOpsBusinessEngine.getInstance();

  it('should return Enterprise FinOps summary with truthful spend, budget, and readiness scores', () => {
    const summary = engine.getSummary();
    assert.strictEqual(summary.currency, 'USD');
    assert.ok(summary.totalMonthlySpend > 0, 'Spend must be positive');
    assert.strictEqual(summary.allocationReadinessScore, 96.5);
    assert.strictEqual(summary.costOptimizationScore, 94.0);
    assert.strictEqual(summary.budgetAmount, 750.0);
  });

  it('should query normalized cost records with multi-dimensional filtering (provider, team, service, environment)', () => {
    const allCosts = engine.getCostRecords();
    assert.ok(allCosts.length >= 8, 'Must maintain multi-cloud cost records');

    const k8sCosts = engine.getCostRecords('kubernetes');
    assert.ok(k8sCosts.length >= 3, 'Must filter by kubernetes provider');
    assert.ok(k8sCosts.every((c) => c.provider === 'kubernetes'));

    const rdsCosts = engine.getCostRecords('aws', undefined, 'order-service');
    assert.ok(rdsCosts.length >= 1, 'Must find AWS order service costs');
  });

  it('should query granular usage records across requests, orders, and transactions', () => {
    const usage = engine.getUsageRecords();
    assert.ok(usage.length >= 3, 'Must maintain usage records');

    const orderUsage = engine.getUsageRecords('order-service');
    assert.strictEqual(orderUsage.length, 1);
    assert.strictEqual(orderUsage[0].unit, 'Orders');
    assert.ok(orderUsage[0].value > 0);
  });

  it('should evaluate business impact and cost of downtime per service with honest confidence scores', () => {
    const impacts = engine.getBusinessImpacts();
    assert.ok(impacts.length >= 3, 'Must cover all 3 services');

    const gwImpact = impacts.find((i) => i.service === 'api-gateway');
    assert.ok(gwImpact);
    assert.strictEqual(gwImpact.businessCriticality, 'CRITICAL');
    assert.strictEqual(gwImpact.estimatedDowntimeCostPerHour, 25000.0);
    assert.strictEqual(gwImpact.source, 'CONFIGURED_ESTIMATE');
  });

  it('should track multi-cloud spend budgets against warning/critical thresholds', () => {
    const budgets = engine.getBudgets();
    assert.ok(budgets.length >= 2, 'Must track production and staging budgets');

    const prodBudget = budgets.find((b) => b.scopeId === 'production');
    assert.ok(prodBudget);
    assert.strictEqual(prodBudget.limit, 750.0);
    assert.strictEqual(prodBudget.status, 'HEALTHY');
  });

  it('should generate ARIMA/exponential cost forecasts with low/expected/high confidence intervals', () => {
    const forecasts = engine.getForecasts();
    assert.ok(forecasts.length >= 1, 'Must maintain cost forecasts');

    const f1 = forecasts[0];
    assert.strictEqual(f1.period, '2026-09');
    assert.ok(f1.confidenceInterval.low < f1.forecastedSpend);
    assert.ok(f1.forecastedSpend < f1.confidenceInterval.high);
    assert.strictEqual(f1.confidencePercent, 91.5);
  });

  it('should identify prioritized cost optimization and rightsizing opportunities with estimated monthly savings', () => {
    const opts = engine.getOptimizationOpportunities();
    assert.ok(opts.length >= 3, 'Must identify waste and rightsizing opportunities');

    const idleEbs = opts.find((o) => o.id === 'opt-ebs-idle');
    assert.ok(idleEbs);
    assert.strictEqual(idleEbs.estimatedMonthlySavings, 20.0);
    assert.strictEqual(idleEbs.reversibility, 'REVERSIBLE');
  });

  it('should simulate what-if scenario for pod CPU rightsizing without cloud mutations', () => {
    const simulation = engine.simulateWhatIf({
      resource: 'k8s-deployment/payment-service',
      changeType: 'REDUCE_CPU',
      proposedConfig: '250m CPU'
    });

    assert.strictEqual(simulation.currentMonthlyCost, 105.0);
    assert.strictEqual(simulation.projectedMonthlyCost, 65.0);
    assert.strictEqual(simulation.estimatedMonthlyDelta, -40.0);
    assert.ok(simulation.safetyNotice.includes('SIMULATED PROJECTION ONLY'));
  });

  it('should provide structured FinOps AI assistant responses with evidence citations', () => {
    const response = engine.queryAssistant('Where is our biggest cost driver?');
    assert.strictEqual(response.status, 'CALCULATED');
    assert.ok(response.evidence.length >= 3);
    assert.ok(response.recommendations.length >= 2);
    assert.ok(response.summary.includes('budget limit of $750.00/mo'));
  });
});
