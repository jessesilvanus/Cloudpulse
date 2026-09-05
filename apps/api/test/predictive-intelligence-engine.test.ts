import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PredictiveIntelligenceEngine } from '../src/services/predictive-intelligence-engine.js';

describe('CLOUDPULSE Phase 35 Advanced AI/ML & Predictive Cloud Intelligence', () => {
  const engine = PredictiveIntelligenceEngine.getInstance();

  it('should return Predictive Intelligence summary with active anomaly and incident risk counts', () => {
    const summary = engine.getSummary();
    assert.strictEqual(summary.overallPredictiveRiskScore, 28.5);
    assert.strictEqual(summary.activeAnomaliesCount, 2);
    assert.strictEqual(summary.highProbabilityIncidentsCount, 1);
    assert.strictEqual(summary.budgetBreachPredicted, false);
    assert.strictEqual(summary.registeredModelsCount, 4);
    assert.strictEqual(summary.modelDriftAlertsCount, 0);
  });

  it('should list predictive time-series forecasts with confidence intervals and horizon', () => {
    const forecasts = engine.getForecasts();
    assert.ok(forecasts.length >= 4);

    const cpuForecast = forecasts.find((f) => f.forecastId === 'fc-cpu-gw-6h');
    assert.ok(cpuForecast);
    assert.strictEqual(cpuForecast.target, 'CPU_UTILIZATION');
    assert.strictEqual(cpuForecast.entity, 'api-gateway');
    assert.strictEqual(cpuForecast.status, 'PREDICTED');
    assert.ok(cpuForecast.predictedValue > cpuForecast.currentValue);
    assert.ok(cpuForecast.lowerBound < cpuForecast.upperBound);
    assert.ok(cpuForecast.confidencePercent >= 80.0);
  });

  it('should filter forecasts by target metric and risk level', () => {
    const storageForecasts = engine.getForecasts('STORAGE_EXHAUSTION');
    assert.strictEqual(storageForecasts.length, 1);
    assert.strictEqual(storageForecasts[0]?.entity, 'order-db-primary-volume');
    assert.strictEqual(storageForecasts[0]?.riskLevel, 'HIGH');

    const highRiskForecasts = engine.getForecasts(undefined, 'HIGH');
    assert.ok(highRiskForecasts.length >= 2);
  });

  it('should retrieve multi-signal anomalies with deviation percentages and contributing factors', () => {
    const anomalies = engine.getAnomalies();
    assert.strictEqual(anomalies.length, 2);

    const latencyAnomaly = anomalies.find((a) => a.anomalyId === 'anom-lat-gw-01');
    assert.ok(latencyAnomaly);
    assert.strictEqual(latencyAnomaly.metric, 'http_request_duration_p99');
    assert.strictEqual(latencyAnomaly.severity, 'WARNING');
    assert.ok(latencyAnomaly.deviationPercent > 40.0);
    assert.ok(latencyAnomaly.contributingFactors.length >= 2);
  });

  it('should predict high-probability reliability incidents with actionable recommendations', () => {
    const incidentRisks = engine.getIncidentPredictions();
    assert.ok(incidentRisks.length >= 1);

    const paymentRisk = incidentRisks[0];
    assert.strictEqual(paymentRisk.affectedService, 'payment-service');
    assert.strictEqual(paymentRisk.probabilityPercent, 68.5);
    assert.strictEqual(paymentRisk.riskLevel, 'HIGH');
    assert.ok(paymentRisk.contributingSignals.length >= 3);
    assert.ok(paymentRisk.recommendedAction.includes('Scale payment-service'));
  });

  it('should evaluate capacity predictions with estimated time-to-threshold', () => {
    const capacityItems = engine.getCapacityPredictions();
    assert.ok(capacityItems.length >= 2);

    const dbStorage = capacityItems.find((c) => c.resource === 'order-db-primary-volume');
    assert.ok(dbStorage);
    assert.strictEqual(dbStorage.risk, 'HIGH');
    assert.ok(dbStorage.estimatedTimeToThreshold.includes('18.4 hours'));
    assert.ok(dbStorage.recommendation.includes('Expand volume capacity'));
  });

  it('should generate predictive FinOps cost forecasts with budget breach status', () => {
    const costPred = engine.getCostPredictions();
    assert.strictEqual(costPred.currentMonthSpend, 1300.5);
    assert.strictEqual(costPred.predictedMonthEndSpend, 1440.0);
    assert.strictEqual(costPred.monthlyBudget, 1800.0);
    assert.strictEqual(costPred.predictedBudgetBreach, false);
    assert.ok(costPred.breakdown.length >= 3);
  });

  it('should maintain Model Registry with truth-in-labeling (RULE-BASED PREDICTION, SIMULATED MODEL)', () => {
    const models = engine.getModelRegistry();
    assert.strictEqual(models.length, 4);

    const arima = models.find((m) => m.modelId === 'mod-arima-ts');
    assert.ok(arima);
    assert.strictEqual(arima.modelTypeLabel, 'RULE-BASED PREDICTION');
    assert.strictEqual(arima.driftStatus, 'HEALTHY');

    const isoForest = models.find((m) => m.modelId === 'mod-iso-anom');
    assert.ok(isoForest);
    assert.strictEqual(isoForest.modelTypeLabel, 'SIMULATED MODEL');
  });

  it('should record prediction feedback loop entries', () => {
    const res = engine.submitPredictionFeedback('fc-cpu-gw-6h', 'CORRECT', 'Confirmed against actual Prometheus metric.');
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.record.predictionId, 'fc-cpu-gw-6h');
    assert.strictEqual(res.record.feedback, 'CORRECT');

    const allFeedback = engine.getFeedbackRecords();
    assert.ok(allFeedback.length >= 1);
  });

  it('should execute what-if scenario simulations with honest WHAT_IF labeling', () => {
    const sim = engine.simulateScenario({ trafficMultiplier: 1.5, nodeFailureCount: 1 });
    assert.strictEqual(sim.scenarioType, 'WHAT_IF');
    assert.strictEqual(sim.parameters.trafficMultiplier, 1.5);
    assert.strictEqual(sim.parameters.nodeFailureCount, 1);
    assert.ok(sim.projectedImpact.cpuUtilizationPercent > 70.0);
    assert.ok(sim.projectedImpact.incidentProbabilityPercent > 50);
    assert.strictEqual(sim.riskLevel, 'HIGH');
    assert.ok(sim.safetyNotice.includes('WHAT_IF'));
  });

  it('should answer natural language predictive AI queries with grounded evidence citations', () => {
    const res = engine.queryPredictiveAssistant('What are our top predicted reliability and capacity risks?');
    assert.strictEqual(res.status, 'PREDICTED');
    assert.ok(res.evidence.length >= 3);
    assert.ok(res.recommendation.includes('payment-service'));
  });
});
