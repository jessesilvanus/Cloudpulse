import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SreReliabilityControlEngine } from '../src/services/sre-reliability-control-engine.js';

describe('CLOUDPULSE Phase 63 SRE & Reliability Control Plane Tests', () => {
  const engine = SreReliabilityControlEngine.getInstance();

  describe('1. Multi-Cloud Service Catalog & Truth-in-Labeling', () => {
    it('should return catalog of services across AWS, Kubernetes, and On-Premises', () => {
      const services = engine.getServices();
      assert.ok(services.length >= 5, 'Should track at least 5 services in default catalog');

      const providers = new Set(services.map(s => s.provider));
      assert.ok(providers.has('AWS'), 'Must include AWS services');
      assert.ok(providers.has('KUBERNETES'), 'Must include Kubernetes services');
      assert.ok(providers.has('ON_PREMISES'), 'Must include On-Premises services');
    });

    it('should adhere to Truth-in-Labeling: uninstrumented legacy service returns UNKNOWN / INSUFFICIENT_DATA', () => {
      const legacyWorker = engine.getServiceById('legacy-billing-worker');
      assert.ok(legacyWorker, 'Legacy billing worker should exist in catalog');
      assert.strictEqual(legacyWorker.health, 'UNKNOWN', 'Uninstrumented service health must be UNKNOWN');
      assert.strictEqual(legacyWorker.reliabilityState, 'INSUFFICIENT_DATA', 'Reliability state must be INSUFFICIENT_DATA');
      assert.strictEqual(legacyWorker.goldenSignals.source, 'UNAVAILABLE', 'Golden signals source must be UNAVAILABLE');
      assert.strictEqual(legacyWorker.telemetryCoverage.coveragePercent, 0, 'Coverage percent must be 0');
    });

    it('should return detailed reliability profile for a service with golden signals', () => {
      const gatewayDetail = engine.getServiceDetail('api-gateway');
      assert.ok(gatewayDetail, 'Service detail should exist for api-gateway');
      assert.strictEqual(gatewayDetail.service.name, 'api-gateway');
      assert.strictEqual(gatewayDetail.service.tier, 'TIER_0');
      assert.strictEqual(gatewayDetail.service.health, 'HEALTHY');
      assert.ok(gatewayDetail.goldenSignals.latencyP95Ms !== undefined, 'P95 latency should be calculated');
      assert.ok(gatewayDetail.goldenSignals.errorRatePercent !== undefined, 'Error rate should be calculated');
    });
  });

  describe('2. Evidence-Backed SLIs & Golden Signals', () => {
    it('should retrieve SLIs with exact metric types, definitions, and telemetry sources', () => {
      const slis = engine.getSlis('payment-service');
      assert.ok(slis.length >= 2, 'payment-service should have at least 2 SLIs (availability, latency)');

      const availSli = slis.find(s => s.type === 'AVAILABILITY');
      assert.ok(availSli, 'Availability SLI must exist');
      assert.strictEqual(availSli.unit, '%');
      assert.ok(availSli.sourceMetrics.length > 0, 'Source metrics citations must be populated');
      assert.ok(availSli.calculation.length > 0, 'Calculation formula must be populated');
    });

    it('should calculate accurate latency and error rates for degraded services', () => {
      const paymentSli = engine.getSlis('payment-service').find(s => s.type === 'LATENCY');
      assert.ok(paymentSli, 'Latency SLI must exist for payment-service');
      assert.ok(paymentSli.currentValue !== null && paymentSli.currentValue > 300, 'P99 Latency must reflect degraded state (>300ms)');
      assert.strictEqual(paymentSli.status, 'CRITICAL', 'Payment latency should be marked CRITICAL');
    });
  });

  describe('3. SLO Attainment & Multi-Window Error Budget Burn Engine', () => {
    it('should evaluate SLO attainment with exact target vs current comparison', () => {
      const slos = engine.getSlos();
      assert.ok(slos.length >= 4, 'Must have at least 4 SLOs defined across services');

      const paymentSlo = slos.find(s => s.serviceId === 'payment-service' && s.objectiveType === 'AVAILABILITY');
      assert.ok(paymentSlo, 'Payment availability SLO must exist');
      assert.strictEqual(paymentSlo.target, 99.95);
      assert.strictEqual(paymentSlo.status, 'BREACHED', 'Payment SLO must be marked BREACHED due to 14.8x burn');
    });

    it('should calculate multi-window burn rates (1h, 24h) and exhaustion forecasts', () => {
      const budgets = engine.getErrorBudgets('payment-service');
      assert.ok(budgets.length >= 1, 'Must have error budgets for payment-service');

      const paymentBudget = budgets[0];
      assert.strictEqual(paymentBudget.remainingPercent, 0, 'Payment error budget should be exhausted');
      assert.strictEqual(paymentBudget.trend, 'EXHAUSTED', 'Trend should be EXHAUSTED');
      assert.ok(paymentBudget.shortWindowBurnRate > 5.0, '1h burn rate should be critical (>5x)');
      assert.strictEqual(paymentBudget.burnRateStatus, 'CRITICAL');
    });

    it('should verify that healthy services maintain normal burn rate and positive budget', () => {
      const gwBudget = engine.getErrorBudgets('api-gateway')[0];
      assert.ok(gwBudget, 'API Gateway error budget should exist');
      assert.ok(gwBudget.remainingPercent >= 50, 'API Gateway should have >=50% error budget remaining');
      assert.ok(gwBudget.shortWindowBurnRate <= 1.5, 'API Gateway burn rate should be normal/low');
      assert.strictEqual(gwBudget.trend, 'STABLE');
    });
  });

  describe('4. Multi-Dimensional Explainable Reliability Scoring (8 Dimensions)', () => {
    it('should compute comprehensive 0-100 score across 8 distinct dimensions', () => {
      const score = engine.calculateReliabilityScore('api-gateway');
      assert.ok(score, 'Reliability score must be calculated');
      assert.ok(score.overallScore >= 80, 'API Gateway should have high reliability score (>=80)');
      assert.ok(['A+', 'A', 'B'].includes(score.grade), 'Grade should be A+, A, or B');

      const dims = score.dimensions;
      assert.ok(dims.sloCompliance, 'sloCompliance dimension must be present');
      assert.ok(dims.errorRate, 'errorRate dimension must be present');
      assert.ok(dims.latencyPerformance, 'latencyPerformance dimension must be present');
      assert.ok(dims.incidentFrequency, 'incidentFrequency dimension must be present');
      assert.ok(dims.dependencyHealth, 'dependencyHealth dimension must be present');
      assert.ok(dims.changeFailureRate, 'changeFailureRate dimension must be present');
      assert.ok(dims.recoveryEffectiveness, 'recoveryEffectiveness dimension must be present');
      assert.ok(dims.observabilityCoverage, 'observabilityCoverage dimension must be present');

      // Verify weights sum to 1.0
      const totalWeight = Object.values(dims).reduce((sum, d) => sum + d.weight, 0);
      assert.ok(Math.abs(totalWeight - 1.0) < 0.01, `Dimension weights sum (${totalWeight}) must equal 1.0`);
    });

    it('should reflect severe penalty on score for breached services', () => {
      const score = engine.calculateReliabilityScore('payment-service');
      assert.ok(score, 'Score should exist for payment service');
      assert.ok(score.overallScore < 85, 'Breached service score should be degraded (<85)');
      assert.ok(score.dimensions.sloCompliance.status === 'BREACHED');
    });
  });

  describe('5. Dependency Risk, Cascading Failures & SPOF Analysis', () => {
    it('should identify direct dependencies and concentration risk', () => {
      const deps = engine.getDependencies();
      assert.ok(deps.length >= 3, 'Should track dependencies across estate');

      const paymentDeps = engine.getDependencies('payment-service');
      const dbDep = paymentDeps.find(d => d.dependencyType === 'DATABASE');
      assert.ok(dbDep, 'payment-service -> DB dependency must exist');
      assert.strictEqual(dbDep.concentrationRisk, true, 'Primary database must be flagged with concentration risk');
      assert.strictEqual(dbDep.riskLevel, 'CRITICAL', 'Primary DB without active replica must be CRITICAL');
    });

    it('should detect cascading failure propagation paths with evidence ranking', () => {
      const cascadingRisks = engine.getCascadingRisks();
      assert.ok(cascadingRisks.length >= 1, 'Must detect cascading failure paths');

      const primaryCascade = cascadingRisks.find(c => c.originServiceId === 'payment-service');
      assert.ok(primaryCascade, 'Payment cascading failure path must be detected');
      assert.strictEqual(primaryCascade.evidenceRank, 'CONFIRMED', 'Cascade rank must be CONFIRMED');
      assert.ok(primaryCascade.impactedServices.includes('payment-service'), 'Must impact payment-service');
      assert.ok(primaryCascade.blastRadiusScore >= 80, 'Blast radius score must be high (>=80)');
    });

    it('should identify architectural single points of failure (SPOFs)', () => {
      const spofs = engine.getSpofs();
      assert.ok(spofs.length >= 2, 'Must identify critical SPOFs');

      const dbSpof = spofs.find(s => s.entityType === 'DATABASE_PRIMARY');
      assert.ok(dbSpof, 'Database primary SPOF must be identified');
      assert.strictEqual(dbSpof.blastRadius, 'CRITICAL');
      assert.ok(dbSpof.recommendation.length > 0, 'Actionable remediation recommendation required');
    });

    it('should compute failure domain concentration across AZs and regions', () => {
      const fd = engine.getFailureDomainAnalysis();
      assert.ok(fd.availabilityZoneConcentration.length >= 2, 'Must analyze AZ concentration');
      assert.ok(fd.regionConcentration.length >= 1, 'Must analyze Region concentration');
      assert.ok(fd.clusterNodeConcentration.length >= 2, 'Must analyze Cluster Node concentration');
      assert.ok(fd.summary.length > 0, 'Summary must be present');
    });
  });

  describe('6. Change-to-Reliability Correlation, DORA CFR & MTT Metrics', () => {
    it('should correlate recent deployments and config updates with SLO breaches', () => {
      const correlations = engine.getChangeCorrelations();
      assert.ok(correlations.length >= 2, 'Must have change correlations');

      const paymentChange = correlations.find(c => c.serviceId === 'payment-service');
      assert.ok(paymentChange, 'Change correlation for payment-service must exist');
      assert.strictEqual(paymentChange.correlationType, 'DIRECT_CAUSAL');
      assert.ok(paymentChange.correlatedSloBreaches.length > 0, 'Must link to breached SLOs');
    });

    it('should calculate Change Failure Rate (CFR) and MTT metrics (MTTD, MTTA, MTTR)', () => {
      const cfr = engine.getChangeFailureRate();
      assert.ok(cfr.totalChangesPeriod > 0, 'Total changes must be > 0');
      assert.ok(cfr.changeFailureRatePercent !== null, 'CFR percent must be calculated');

      const mtt = engine.getMttMetrics();
      assert.ok(mtt.mttdMinutes !== null && mtt.mttdMinutes > 0, 'MTTD must be calculated');
      assert.ok(mtt.mttaMinutes !== null && mtt.mttaMinutes > 0, 'MTTA must be calculated');
      assert.ok(mtt.mttrMinutes !== null && mtt.mttrMinutes > 0, 'MTTR must be calculated');
    });
  });

  describe('7. Pre-Flight Release Risk Guard Gate', () => {
    it('should BLOCK releases for services with exhausted error budgets or active SEV incidents', () => {
      const assessment = engine.evaluateReleaseRisk({
        serviceId: 'payment-service',
        proposedVersion: 'v2.4.3',
        changeType: 'FEATURE'
      });

      assert.strictEqual(assessment.decision, 'BLOCK', 'Release MUST be BLOCKED when budget is exhausted');
      assert.strictEqual(assessment.riskLevel, 'BLOCKED');
      assert.ok(assessment.score >= 80, 'Risk score must be high (>=80)');
      assert.ok(assessment.recommendation.toLowerCase().includes('block') || assessment.recommendation.toLowerCase().includes('freeze'), 'Recommendation must explain block');
    });

    it('should PASS or allow releases for healthy services with sufficient error budget', () => {
      const assessment = engine.evaluateReleaseRisk({
        serviceId: 'api-gateway',
        proposedVersion: 'v1.8.2',
        changeType: 'FEATURE'
      });

      assert.strictEqual(assessment.decision, 'PASS', 'Healthy service release should PASS');
      assert.strictEqual(assessment.riskLevel, 'LOW_RISK');
      assert.ok(assessment.score <= 30, 'Risk score must be low (<=30)');
    });
  });

  describe('8. Fresh-Read Post-Remediation Recovery Verification', () => {
    it('should execute live verification and record recovery status with fresh metric readings', () => {
      const verification = engine.verifyRemediationRecovery({
        serviceId: 'payment-service',
        actionId: 'act-scale-db-pool',
        incidentId: 'inc-payment-db-timeout'
      });

      assert.ok(verification.id, 'Verification ID must be generated');
      assert.strictEqual(verification.freshReadConfirmed, true, 'Fresh-read telemetry must be confirmed');
      assert.ok(['RECOVERED', 'PARTIALLY_RECOVERED', 'NOT_RECOVERED'].includes(verification.status), 'Status must be valid');
      assert.ok(verification.verifiedMetrics.length > 0, 'Verified metrics comparison must be populated');
      assert.ok(verification.notes.length > 0, 'Verification notes must be populated');
    });
  });

  describe('9. AI SRE Copilot Natural Language Investigation', () => {
    it('should answer root cause and budget burn rate questions with evidence citations', () => {
      const result = engine.investigate('Why is payment-service degraded?');
      assert.strictEqual(result.intent, 'SERVICE_HEALTH');
      assert.strictEqual(result.confidence, 'HIGH');
      assert.ok(result.primaryDiagnosis.toLowerCase().includes('payment') || result.primaryDiagnosis.toLowerCase().includes('connection'));
      assert.ok(result.evidenceCitations.length >= 2, 'Must cite at least 2 telemetry evidence points');
      assert.ok(result.recommendedAction, 'Must suggest concrete operator remediation action');
    });

    it('should answer general SRE intelligence questions accurately', () => {
      const result = engine.investigate('Overview of platform reliability');
      assert.strictEqual(result.confidence, 'HIGH');
      assert.ok(result.evidenceCitations.length > 0, 'Must cite platform telemetry');
      assert.ok(result.suggestedFollowUps.length >= 2, 'Must suggest logical follow-up questions');
    });
  });
});
