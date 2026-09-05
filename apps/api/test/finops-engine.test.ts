import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FinOpsEngine } from '../src/services/finops-engine.js';

describe('CLOUDPULSE Phase 9 FinOps & Cloud Cost Intelligence Engine', () => {
  const finOpsEngine = FinOpsEngine.getInstance();

  it('should calculate accurate FinOps summary metrics with truthful data source labeling', () => {
    const summary = finOpsEngine.getSummary();
    assert.ok(summary.currentMonthCost > 0);
    assert.ok(summary.forecastedMonthEndCost > 0);
    assert.strictEqual(summary.currency, 'USD');
    assert.strictEqual(summary.dataSource, 'demo_local');
    assert.ok(typeof summary.monthOverMonthChangePercent === 'number');
    assert.ok(summary.totalMonthlyBudget > 0);
  });

  it('should generate daily cost trends and calculate run rate forecasts', () => {
    const trends = finOpsEngine.getDailyTrends(14);
    assert.strictEqual(trends.length, 14);
    assert.ok(trends[0].amount > 0);
    assert.ok(trends[0].date);

    const forecast = finOpsEngine.getForecast();
    assert.ok(forecast.projectedMonthEnd > 0);
    assert.strictEqual(forecast.method, 'historical_run_rate');
    assert.ok(typeof forecast.projectedVariance === 'number');
  });

  it('should allocate costs across environment and team dimensions', () => {
    const allocations = finOpsEngine.getCostAllocations();
    assert.ok(allocations.length >= 2);

    const envAlloc = allocations.find((a) => a.dimension === 'environment');
    assert.ok(envAlloc);
    const prodEnv = envAlloc.items.find((i) => i.key === 'production');
    assert.ok(prodEnv);
    assert.ok(prodEnv.cost > 0);
    assert.strictEqual(prodEnv.percentage, 72.0);
  });

  it('should break down costs by cloud service and Kubernetes workloads with efficiency scores', () => {
    const serviceCosts = finOpsEngine.getServiceCosts();
    assert.ok(serviceCosts.length >= 4);
    const eksCost = serviceCosts.find((s) => s.serviceId === 'eks-cluster');
    assert.ok(eksCost);
    assert.strictEqual(eksCost.category, 'compute');

    const resourceCosts = finOpsEngine.getResourceCosts();
    assert.ok(resourceCosts.length >= 3);
    const gatewayResource = resourceCosts.find((r) => r.resourceId === 'pod-api-gateway');
    assert.ok(gatewayResource);
    assert.ok(gatewayResource.efficiencyScore > 0);
    assert.strictEqual(gatewayResource.dataSource, 'estimated_k8s_allocation');
  });

  it('should manage cloud budgets and track consumption thresholds', () => {
    const budgets = finOpsEngine.getBudgets();
    assert.ok(budgets.length >= 2);

    const prodBudget = budgets.find((b) => b.id === 'bgt-prod-total');
    assert.ok(prodBudget);
    assert.strictEqual(prodBudget.status, 'warning'); // 85% consumed
    assert.ok(prodBudget.spent <= prodBudget.amount * 1.5);
  });

  it('should detect statistical cost anomalies and provide rightsizing recommendations with review-required safety', () => {
    const anomalies = finOpsEngine.getAnomalies();
    assert.ok(anomalies.length >= 1);
    assert.ok(anomalies[0].deviationPercent > 50);

    const recommendations = finOpsEngine.getRecommendations();
    assert.ok(recommendations.length >= 2);

    const rightsizing = recommendations.find((r) => r.category === 'rightsizing');
    assert.ok(rightsizing);
    assert.strictEqual(rightsizing.status, 'review_required'); // Must be human-review required
    assert.ok(rightsizing.estimatedMonthlySavings > 0);

    // Update recommendation status
    const updated = finOpsEngine.updateRecommendationStatus(rightsizing.id, 'approved');
    assert.strictEqual(updated.status, 'approved');
  });

  it('should generate Phase 15 FinOps platform summary with maturity level and efficiency score', () => {
    const platform = finOpsEngine.getPlatformSummary();
    assert.ok(platform.currentMonthSpend > 0);
    assert.ok(platform.costEfficiencyScore >= 80);
    assert.strictEqual(platform.finopsMaturityLevel, 'run_optimization');
    assert.ok(platform.taggingCoveragePercent >= 90);
    assert.ok(platform.unitCostPerRequest > 0);
  });

  it('should evaluate tagging governance score and identify non-compliant resources', () => {
    const tagging = finOpsEngine.getTaggingGovernance();
    assert.ok(tagging.totalResources > 20);
    assert.ok(tagging.taggedResources > 20);
    assert.ok(tagging.coveragePercent > 85);
    assert.ok(tagging.mandatoryTags.includes('environment'));
    assert.ok(tagging.nonCompliantResources.length >= 1);
  });

  it('should calculate unit economics for ingress requests and checkout transactions', () => {
    const units = finOpsEngine.getUnitEconomics();
    assert.ok(units.length >= 2);
    assert.ok(units.some((u) => u.id === 'unit-cost-request'));
    assert.ok(units.some((u) => u.id === 'unit-cost-checkout'));
    assert.ok(units.every((u) => u.unitCost > 0));
  });

  it('should evaluate Kubernetes FinOps metrics including CPU/RAM efficiency and idle waste', () => {
    const k8s = finOpsEngine.getKubernetesFinOps();
    assert.ok(k8s.totalRequestedCpuCores > 0);
    assert.ok(k8s.cpuEfficiencyPercent > 0 && k8s.cpuEfficiencyPercent < 100);
    assert.ok(k8s.estimatedIdleWasteCost > 0);
    assert.ok(k8s.workloads.length >= 3);
    assert.ok(k8s.workloads.some((w) => w.status === 'overprovisioned'));
  });

  it('should manage Cost Policy-as-Code rules for budget thresholds and mandatory tags', () => {
    const policies = finOpsEngine.getCostPolicies();
    assert.ok(policies.length >= 2);
    assert.ok(policies.some((p) => p.ruleType === 'budget_threshold'));
    assert.ok(policies.some((p) => p.ruleType === 'mandatory_tagging'));
  });
});

