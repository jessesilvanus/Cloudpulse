import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AdvancedFinOpsGreenOpsEngine } from '../src/services/advanced-finops-greenops-engine.js';

describe('CLOUDPULSE Phase 38 Advanced FinOps & Sustainability / GreenOps Intelligence', () => {
  const engine = AdvancedFinOpsGreenOpsEngine.getInstance();

  it('should return advanced FinOps summary with spend, forecast, budget health, efficiency, and carbon metrics', () => {
    const summary = engine.getSummary();
    assert.strictEqual(summary.totalMonthlySpend, 1440.0);
    assert.strictEqual(summary.budgetCeiling, 1800.0);
    assert.strictEqual(summary.budgetUtilizationPercent, 80.0);
    assert.strictEqual(summary.budgetBreachPredicted, false);
    assert.strictEqual(summary.allocationCoveragePercent, 94.2);
    assert.strictEqual(summary.resourceEfficiencyScore, 82.4);
    assert.strictEqual(summary.estimatedMonthlyCo2eKg, 420.5);
    assert.ok(summary.verifiedRealizedSavingsMonthly >= 185.0);
    assert.ok(summary.activeSavingsOpportunitiesCount >= 2);
  });

  it('should list GreenOps sustainability metrics by region with energy, carbon intensity, and PUE ratio', () => {
    const metrics = engine.getGreenOpsMetrics();
    assert.strictEqual(metrics.length, 3);

    const usEast = metrics.find((m) => m.region.includes('us-east-1'));
    assert.ok(usEast);
    assert.strictEqual(usEast.carbonIntensityGramsPerKwh, 380);
    assert.strictEqual(usEast.estimatedCo2eKgMonthly, 475.0);
    assert.strictEqual(usEast.provenance, 'ESTIMATED');

    const euWest = metrics.find((m) => m.region.includes('eu-west-1'));
    assert.ok(euWest);
    assert.strictEqual(euWest.carbonIntensityGramsPerKwh, 190);
    assert.strictEqual(euWest.cleanEnergyPercent, 82);
  });

  it('should compute granular cloud unit economics (cost per 10k requests, cost per checkout transaction)', () => {
    const unitMetrics = engine.getUnitEconomics();
    assert.strictEqual(unitMetrics.length, 3);

    const apiMetric = unitMetrics.find((u) => u.unitLabel === '10k requests');
    assert.ok(apiMetric);
    assert.strictEqual(apiMetric.unitCost, 0.042);
    assert.strictEqual(apiMetric.efficiencyStatus, 'OPTIMAL');

    const checkoutMetric = unitMetrics.find((u) => u.unitLabel === 'checkout');
    assert.ok(checkoutMetric);
    assert.strictEqual(checkoutMetric.unitCost, 0.018);
  });

  it('should query active savings opportunities categorized by rightsizing, storage tiering, and idle resources', () => {
    const opps = engine.getSavingsOpportunities();
    assert.strictEqual(opps.length, 3);

    const storageOpp = opps.find((o) => o.category === 'STORAGE_TIERING');
    assert.ok(storageOpp);
    assert.strictEqual(storageOpp.estimatedMonthlySavings, 65.0);
    assert.strictEqual(storageOpp.confidencePercent, 92.0);

    const rightsizeOpp = opps.find((o) => o.category === 'RIGHTSIZING');
    assert.ok(rightsizeOpp);
    assert.strictEqual(rightsizeOpp.estimatedMonthlySavings, 45.0);
  });

  it('should maintain verified realized savings records with baseline vs post-change measurement', () => {
    const savings = engine.getRealizedSavings();
    assert.strictEqual(savings.length, 2);

    const pgSave = savings.find((s) => s.savingId === 'sav-pg-index-tune');
    assert.ok(pgSave);
    assert.strictEqual(pgSave.baselineMonthlyCost, 320.0);
    assert.strictEqual(pgSave.postChangeMonthlyCost, 240.0);
    assert.strictEqual(pgSave.verifiedSavingsMonthly, 80.0);
    assert.strictEqual(pgSave.verificationStatus, 'VERIFIED');
  });

  it('should reconcile an approved savings opportunity into verified realized savings', () => {
    const realized = engine.reconcileRealizedSavings('opp-rds-storage-tiering');
    assert.ok(realized.savingId.startsWith('sav-'));
    assert.strictEqual(realized.opportunityId, 'opp-rds-storage-tiering');
    assert.strictEqual(realized.verifiedSavingsMonthly, 65.0);
    assert.strictEqual(realized.verificationStatus, 'VERIFIED');

    const updatedOpps = engine.getSavingsOpportunities();
    const targetOpp = updatedOpps.find((o) => o.opportunityId === 'opp-rds-storage-tiering');
    assert.strictEqual(targetOpp?.status, 'VERIFIED');
  });

  it('should simulate what-if GreenOps scenario analyzing cost, carbon, and latency tradeoffs', () => {
    const sim = engine.simulateGreenOpsScenario({
      trafficMultiplier: 1.5,
      targetRegion: 'eu-west-1'
    });

    assert.ok(sim.scenarioId.startsWith('sim-'));
    assert.strictEqual(sim.trafficMultiplier, 1.5);
    assert.strictEqual(sim.targetRegion, 'eu-west-1');
    assert.strictEqual(sim.estimatedSpendDelta, 245.0);
    assert.strictEqual(sim.estimatedCo2eDeltaPercent, -24.5);
    assert.strictEqual(sim.estimatedLatencyDeltaMs, 18);
    assert.strictEqual(sim.provenance, 'SIMULATED');
  });

  it('should answer natural language FinOps and GreenOps queries with grounded telemetry citations', () => {
    const res = engine.queryFinOpsGreenOpsAssistant('What is our current cloud spend and regional carbon intensity?');
    assert.strictEqual(res.status, 'OBSERVED');
    assert.ok(res.evidence.length >= 4);
    assert.ok(res.recommendation.includes('Aurora storage tiering'));
  });
});
