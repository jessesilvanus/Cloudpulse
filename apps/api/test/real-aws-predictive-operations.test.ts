import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsPredictiveEngine } from '../src/services/aws-predictive-engine.js';

describe('CLOUDPULSE Phase 50 Real AWS Predictive Operations & Early-Warning Intelligence', () => {
  const predictiveEngine = AwsPredictiveEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should return truthful predictive operations summary and data quality gate status', () => {
    const summary = predictiveEngine.getPredictiveSummary(validWorkspace);
    assert.ok(summary);
    assert.strictEqual(summary.totalActivePredictions, 3);
    assert.strictEqual(summary.capacityRisksCount, 1);
    assert.strictEqual(summary.costRisksCount, 1);
    assert.strictEqual(summary.incidentRisksCount, 1);
    assert.strictEqual(summary.averageModelConfidence, 88);
    assert.strictEqual(summary.dataQualityGateStatus, 'PASSED');
    assert.strictEqual(summary.provenance, 'PREDICTED');
  });

  it('should evaluate linear trend capacity risk prediction for RDS storage', () => {
    const pred = predictiveEngine.getPredictionById('pred-cap-aurora-01', validWorkspace);
    assert.ok(pred);
    assert.strictEqual(pred.predictionType, 'CAPACITY_RISK');
    assert.strictEqual(pred.methodology, 'LINEAR_TREND_EXTRAPOLATION');
    assert.strictEqual(pred.currentValue, 45.0);
    assert.strictEqual(pred.predictedValue, 10.0);
    assert.strictEqual(pred.threshold, 10.0);
    assert.strictEqual(pred.confidence, 'HIGH');
    assert.strictEqual(pred.confidenceScore, 88);
    assert.ok(pred.evidence.length >= 2);
    assert.strictEqual(pred.dataQualityGatePassed, true);
  });

  it('should evaluate Holt-Winters exponential smoothing cost risk prediction for EC2 spend', () => {
    const pred = predictiveEngine.getPredictionById('pred-cost-ec2-02', validWorkspace);
    assert.ok(pred);
    assert.strictEqual(pred.predictionType, 'COST_RISK');
    assert.strictEqual(pred.methodology, 'HOLT_WINTERS_EXPONENTIAL_SMOOTHING');
    assert.strictEqual(pred.currentValue, 185.00);
    assert.strictEqual(pred.predictedValue, 210.00);
    assert.strictEqual(pred.threshold, 150.00);
    assert.strictEqual(pred.confidenceScore, 92);
  });

  it('should evaluate statistical baseline deviation incident risk prediction for CPU saturation', () => {
    const pred = predictiveEngine.getPredictionById('pred-inc-staging-03', validWorkspace);
    assert.ok(pred);
    assert.strictEqual(pred.predictionType, 'INCIDENT_RISK');
    assert.strictEqual(pred.methodology, 'STATISTICAL_BASELINE_DEVIATION');
    assert.strictEqual(pred.currentValue, 78.5);
    assert.strictEqual(pred.threshold, 75.0);
    assert.strictEqual(pred.confidenceScore, 85);
  });

  it('should prioritize early-warning alerts with time-to-threshold metrics', () => {
    const earlyWarnings = predictiveEngine.getEarlyWarnings(validWorkspace);
    assert.strictEqual(earlyWarnings.totalWarnings, 3);
    assert.ok(earlyWarnings.warnings.length >= 3);

    const auroraWarning = earlyWarnings.warnings.find((w) => w.id === 'pred-cap-aurora-01');
    assert.ok(auroraWarning);
    assert.ok(auroraWarning.timeToThreshold.includes('days'));
  });

  it('should simulate analytical what-if scenarios with spend and capacity impacts', () => {
    const sim = predictiveEngine.simulateWhatIf(validWorkspace, {
      trafficGrowthMultiplier: 1.30,
      storageGrowthMultiplier: 1.20,
    });
    assert.ok(sim);
    assert.ok(sim.scenario.includes('+30% Traffic Growth'));
    assert.ok(sim.simulatedSpendIncrease > 0);
    assert.ok(sim.simulatedStorageDepletionDays < 19.4);
    assert.strictEqual(sim.provenance, 'PREDICTED');
  });

  it('should filter predictions by predictionType, status, and accountId', () => {
    const capacityPreds = predictiveEngine.getPredictions(validWorkspace, { predictionType: 'CAPACITY_RISK' });
    assert.strictEqual(capacityPreds.length, 1);
    assert.strictEqual(capacityPreds[0].id, 'pred-cap-aurora-01');

    const stagingPreds = predictiveEngine.getPredictions(validWorkspace, { accountId: '839201746152' });
    assert.strictEqual(stagingPreds.length, 1);
    assert.strictEqual(stagingPreds[0].id, 'pred-inc-staging-03');
  });

  it('should return null for non-existent prediction lookup', () => {
    const notFound = predictiveEngine.getPredictionById('non-existent-pred', validWorkspace);
    assert.strictEqual(notFound, null);
  });

  it('should return INSUFFICIENT_DATA and empty predictions for disconnected workspaces', () => {
    const disconnectedSummary = predictiveEngine.getPredictiveSummary('ws-disconnected-workspace');
    assert.strictEqual(disconnectedSummary.dataQualityGateStatus, 'INSUFFICIENT_DATA');
    assert.strictEqual(disconnectedSummary.totalActivePredictions, 0);
  });

  it('should strictly enforce tenant isolation preventing cross-workspace prediction retrieval', () => {
    const preds = predictiveEngine.getPredictions('ws-unauthorized-tenant');
    assert.strictEqual(preds.length, 0, 'Cross-workspace predictions query must return 0');

    const lookup = predictiveEngine.getPredictionById('pred-cap-aurora-01', 'ws-unauthorized-tenant');
    assert.strictEqual(lookup, null, 'Cross-workspace prediction lookup must return null');
  });
});
