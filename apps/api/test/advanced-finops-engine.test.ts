import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AdvancedFinOpsEngine } from '../src/services/advanced-finops-engine.js';

describe('CLOUDPULSE Phase 23 Advanced Cloud FinOps & Cost Intelligence Engine', () => {
  const finops = AdvancedFinOpsEngine.getInstance();

  it('should return FinOps summary with accurate mathematical totals and variance percentage', () => {
    const summary = finops.getSummary();
    assert.strictEqual(typeof summary.totalMonthlyCost, 'number');
    assert.strictEqual(typeof summary.forecastedMonthlyCost, 'number');
    assert.strictEqual(typeof summary.budgetTotal, 'number');
    assert.strictEqual(typeof summary.budgetVariancePercent, 'number');
    assert.strictEqual(summary.allocationCoveragePercent, 100.0);
    assert.strictEqual(summary.totalMonthlyCost, 622.0);
    assert.strictEqual(summary.budgetTotal, 750.0);
    assert.ok(summary.finopsMaturityScore >= 90.0, 'FinOps maturity score should be >= 90%');
    assert.ok(summary.potentialMonthlySavings > 0, 'Should have potential savings');
  });

  it('should list normalized cost records with provider, team, and environment filtering', () => {
    const records = finops.getCostRecords();
    assert.strictEqual(records.length, 6, 'Must contain 6 baseline cost records');

    const k8sRecords = finops.getCostRecords('kubernetes');
    assert.strictEqual(k8sRecords.length, 3, 'Must have 3 Kubernetes records');

    const platformRecords = finops.getCostRecords(undefined, 'Platform Engineering');
    assert.strictEqual(platformRecords.length, 2, 'Must have 2 Platform Engineering records');

    const rec1 = records[0];
    assert.strictEqual(rec1.currency, 'USD');
    assert.strictEqual(rec1.source, 'LIVE');
    assert.ok(rec1.costCenter.startsWith('CC-'), 'Must have cost center tag');
  });

  it('should track team budgets with utilization percentage and healthy threshold status', () => {
    const budgets = finops.getBudgets();
    assert.strictEqual(budgets.length, 3, 'Must track budgets for 3 engineering squads');

    const platformBud = budgets.find((b) => b.id === 'bud-platform');
    assert.ok(platformBud, 'Platform budget must exist');
    assert.strictEqual(platformBud.amount, 250.0);
    assert.strictEqual(platformBud.spent, 210.5);
    assert.strictEqual(platformBud.status, 'HEALTHY');
  });

  it('should generate predictive spend forecasts with confidence intervals and trend percentages', () => {
    const forecasts = finops.getForecasts();
    assert.strictEqual(forecasts.length, 3, 'Must forecast spend for 3 services');

    const gwForecast = forecasts.find((f) => f.serviceId === 'api-gateway');
    assert.ok(gwForecast, 'Gateway forecast must exist');
    assert.strictEqual(gwForecast.confidence, 'high');
    assert.strictEqual(gwForecast.currentMonthlySpend, 210.5);
    assert.strictEqual(gwForecast.forecastedMonthlySpend, 222.0);
  });

  it('should detect and explain cost anomalies with root cause breakdown', () => {
    const anomalies = finops.getAnomalies();
    assert.ok(anomalies.length >= 1, 'Should record detected anomalies');

    const anom1 = anomalies[0];
    assert.strictEqual(anom1.serviceId, 'order-service');
    assert.strictEqual(anom1.status, 'INVESTIGATING');
    assert.strictEqual(anom1.variancePercent, 138.7);
    assert.ok(anom1.rootCauseExplanation.length > 0, 'Must provide root cause explanation');
  });

  it('should identify cloud waste findings with evidence and estimated monthly savings', () => {
    const waste = finops.getWasteFindings();
    assert.ok(waste.length >= 2, 'Must identify waste findings');

    const storageWaste = waste.find((w) => w.type === 'UNUSED_STORAGE');
    assert.ok(storageWaste, 'Unused storage finding must exist');
    assert.strictEqual(storageWaste.estimatedMonthlySavings, 28.0);
    assert.strictEqual(storageWaste.confidence, 'high');
  });

  it('should generate rightsizing recommendations with utilization metrics and safety risks', () => {
    const rightsizings = finops.getRightsizingRecommendations();
    assert.ok(rightsizings.length >= 2, 'Must provide rightsizing recommendations');

    const payRs = rightsizings.find((r) => r.serviceId === 'payment-service');
    assert.ok(payRs, 'Payment service rightsizing must exist');
    assert.strictEqual(payRs.risk, 'SAFE');
    assert.strictEqual(payRs.estimatedMonthlySavings, 42.5);
    assert.strictEqual(payRs.utilizationPercent, 18.7);
  });

  it('should calculate truthful unit economics (cost per request, cost per order, cost per settlement)', () => {
    const unitEcon = finops.getUnitEconomics();
    assert.strictEqual(unitEcon.length, 3, 'Must compute 3 primary unit economic metrics');

    const reqEcon = unitEcon.find((u) => u.metricName.includes('HTTP Request'));
    assert.ok(reqEcon, 'Cost per request must exist');
    assert.strictEqual(reqEcon.volume, 4500000);
    assert.ok(reqEcon.costPerUnit > 0, 'Cost per unit must be > 0');
  });

  it('should evaluate Kubernetes workload efficiency across CPU and memory dimensions', () => {
    const k8s = finops.getKubernetesCost();
    assert.strictEqual(k8s.length, 3, 'Must analyze 3 Kubernetes workloads');

    const gwK8s = k8s.find((k) => k.workload === 'api-gateway');
    assert.ok(gwK8s, 'Gateway Kubernetes cost must exist');
    assert.strictEqual(gwK8s.requestedCpu, 1000);
    assert.strictEqual(gwK8s.actualCpu, 245);
    assert.strictEqual(gwK8s.cpuEfficiencyPercent, 24.5);
  });

  it('should compare multi-cloud infrastructure spend across AWS and Kubernetes workloads', () => {
    const multiCloud = finops.getMultiCloudCost();
    assert.strictEqual(multiCloud.length, 2, 'Must compare Kubernetes vs AWS spend');

    const k8sSpend = multiCloud.find((m) => m.provider === 'kubernetes');
    const awsSpend = multiCloud.find((m) => m.provider === 'aws');
    assert.ok(k8sSpend && awsSpend, 'Both providers must be represented');
    assert.strictEqual(k8sSpend.monthlySpend + awsSpend.monthlySpend, 622.0);
  });

  it('should manage optimization opportunities and support operator approval workflow', () => {
    const opportunities = finops.getOptimizationOpportunities();
    assert.ok(opportunities.length >= 3, 'Must maintain optimization opportunities');

    const opt2 = opportunities.find((o) => o.id === 'opt-002');
    assert.ok(opt2, 'opt-002 must exist');
    assert.strictEqual(opt2.status, 'REVIEWING');

    const approved = finops.approveOptimization('opt-002', 'finops-lead');
    assert.strictEqual(approved.status, 'APPROVED');
  });
});
