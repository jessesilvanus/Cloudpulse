import { describe, it } from 'node:test';
import assert from 'node:assert';
import { IntelligenceEngine } from '../src/services/intelligence-engine.js';

describe('CLOUDPULSE Phase 10 AI/ML-Powered SRE & Predictive Intelligence Engine', () => {
  const intelligenceEngine = IntelligenceEngine.getInstance();

  it('should generate intelligence summary metrics with truthful method classification', () => {
    const summary = intelligenceEngine.getSummary();
    assert.ok(summary.activeAnomaliesCount > 0);
    assert.ok(summary.capacityRiskCount >= 1);
    assert.ok(summary.sloRiskCount >= 1);
    assert.strictEqual(summary.primaryMethod, 'statistical');
    assert.strictEqual(summary.averageConfidence, 'high');
  });

  it('should detect predictive anomalies using statistical baselines', () => {
    const anomalies = intelligenceEngine.getAnomalies();
    assert.ok(anomalies.length >= 2);

    const poolAnomaly = anomalies.find((a) => a.metric === 'payment_pool_utilization_percent');
    assert.ok(poolAnomaly);
    assert.strictEqual(poolAnomaly.severity, 'critical');
    assert.strictEqual(poolAnomaly.method, 'statistical');
    assert.ok(poolAnomaly.explanation.includes('30-day statistical baseline'));
  });

  it('should generate capacity forecasts with confidence bands and horizon intervals', () => {
    const forecasts = intelligenceEngine.getCapacityForecasts();
    assert.ok(forecasts.length >= 2);

    const cpuForecast = forecasts.find((f) => f.metric === 'cpu_percent');
    assert.ok(cpuForecast);
    assert.strictEqual(cpuForecast.horizon, '24h');
    assert.strictEqual(cpuForecast.method, 'statistical');
    assert.ok(cpuForecast.forecastPoints.length >= 4);
    assert.ok(cpuForecast.forecastPoints[0].upperBand >= cpuForecast.forecastPoints[0].value);
    assert.ok(cpuForecast.forecastPoints[0].lowerBand <= cpuForecast.forecastPoints[0].value);
  });

  it('should predict SLO error-budget exhaustion and risk level', () => {
    const sloRisks = intelligenceEngine.getSloRisks();
    assert.ok(sloRisks.length >= 2);

    const paymentSlo = sloRisks.find((s) => s.sloId === 'slo-payment-avail');
    assert.ok(paymentSlo);
    assert.strictEqual(paymentSlo.riskLevel, 'high');
    assert.ok(paymentSlo.currentBurnRate > 2.0);
    assert.ok(paymentSlo.projectedExhaustionHours && paymentSlo.projectedExhaustionHours > 0);
  });

  it('should perform multi-signal root cause analysis correlating traces, logs, and deployments', () => {
    const rca = intelligenceEngine.getRootCauseAnalysis('inc-001');
    assert.ok(rca);
    assert.ok(rca.likelyCause.length > 0);
    assert.ok(rca.evidence.length >= 3);
    assert.strictEqual(rca.method, 'statistical');
    assert.strictEqual(rca.correlatedDeploymentId, 'dep-001');
    assert.ok(rca.alternativeHypotheses.length >= 1);
  });

  it('should evaluate deployment risk and generate AI SRE recommendations requiring human approval', () => {
    const risk = intelligenceEngine.getDeploymentRisk('dep-001');
    assert.ok(risk);
    assert.strictEqual(risk.riskLevel, 'medium');
    assert.strictEqual(risk.rollbackRecommended, false);
    assert.ok(risk.riskFactors.length >= 2);

    const recommendations = intelligenceEngine.getRecommendations();
    assert.ok(recommendations.length >= 2);

    const scaleRec = recommendations.find((r) => r.category === 'scaling');
    assert.ok(scaleRec);
    assert.strictEqual(scaleRec.requiresHumanApproval, true); // Must enforce human-in-the-loop
    assert.strictEqual(scaleRec.status, 'review_required');

    const updated = intelligenceEngine.updateRecommendationStatus(scaleRec.id, 'approved');
    assert.strictEqual(updated.status, 'approved');
  });
});
