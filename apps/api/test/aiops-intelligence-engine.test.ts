import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AiOpsIntelligenceEngine } from '../src/services/aiops-intelligence-engine.js';

describe('CLOUDPULSE Phase 26 AIOps & Observability Intelligence Engine', () => {
  const aiops = AiOpsIntelligenceEngine.getInstance();

  it('should return AIOps Command summary with truthful health and maturity scores', () => {
    const summary = aiops.getSummary();
    assert.strictEqual(typeof summary.overallSystemHealthScore, 'number');
    assert.strictEqual(summary.systemStatus, 'HEALTHY');
    assert.strictEqual(summary.activeIncidentsCount, 0);
    assert.strictEqual(summary.activeAnomaliesCount, 0);
    assert.strictEqual(summary.observabilityMaturityScore, 96.0);
    assert.strictEqual(summary.alertDeduplicationRate, 84.5);
    assert.ok(summary.overallSystemHealthScore >= 95.0, 'Health score should meet baseline');
  });

  it('should list multi-source observability events with source, provider, and metadata', () => {
    const events = aiops.getEvents();
    assert.ok(events.length >= 4, 'Must contain baseline events');

    const deployEvent = events.find((e) => e.eventType === 'DEPLOYMENT');
    assert.ok(deployEvent, 'Deployment event must exist');
    assert.strictEqual(deployEvent.service, 'order-service');
    assert.strictEqual(deployEvent.source, 'LIVE');
    assert.ok(deployEvent.metadata.commit);
  });

  it('should calculate deterministic event correlation scores with relationship factors', () => {
    const correlations = aiops.getCorrelations();
    assert.ok(correlations.length >= 1, 'Correlations must exist');

    const c1 = correlations[0];
    assert.strictEqual(c1.primaryEventId, 'evt-deploy-001');
    assert.ok(c1.correlationScore >= 0.9);
    assert.ok(c1.factors.temporalProximity >= 0.9);
    assert.strictEqual(c1.factors.serviceMatch, 1.0);
    assert.ok(c1.relationshipReason.includes('Post-deployment latency normalization'));
  });

  it('should evaluate microservice health with observed dependencies and RED metrics', () => {
    const services = aiops.getServiceHealth();
    assert.strictEqual(services.length, 3, 'Must track all 3 primary microservices');

    const gw = services.find((s) => s.service === 'api-gateway');
    assert.ok(gw, 'API Gateway health must exist');
    assert.strictEqual(gw.healthStatus, 'HEALTHY');
    assert.ok(gw.p95LatencyMs < 10.0);
    assert.strictEqual(gw.dependencies.length, 2);
    assert.strictEqual(gw.dependencies[0].classification, 'OBSERVED');
  });

  it('should analyze root cause candidates with confidence percentages and evidence chains', () => {
    const candidates = aiops.getRootCauseCandidates();
    assert.ok(candidates.length >= 1, 'Must maintain root cause candidates');

    const rc = candidates[0];
    assert.strictEqual(rc.category, 'DEPENDENCY');
    assert.strictEqual(rc.status, 'CONFIRMED');
    assert.ok(rc.confidencePercent >= 90.0);
    assert.ok(rc.evidence.length >= 3);
  });

  it('should generate predictive operations forecasts with time horizon and mitigating actions', () => {
    const predictions = aiops.getPredictions();
    assert.ok(predictions.length >= 1, 'Must maintain predictive forecasts');

    const pred = predictions[0];
    assert.strictEqual(pred.service, 'order-service');
    assert.strictEqual(pred.predictionType, 'CAPACITY_EXHAUSTION');
    assert.strictEqual(pred.timeHorizon, '14 days');
    assert.ok(pred.contributingSignals.length >= 3);
    assert.ok(pred.recommendedMitigation.includes('RDS Proxy'));
  });

  it('should evaluate observability quality across signal quality, freshness, and alert noise', () => {
    const quality = aiops.getObservabilityQuality();
    assert.strictEqual(quality.overallScore, 96.0);
    assert.strictEqual(quality.telemetryFreshness, 'HEALTHY');
    assert.strictEqual(quality.metricCoveragePercent, 100.0);
    assert.strictEqual(quality.logCoveragePercent, 100.0);
    assert.strictEqual(quality.traceCoveragePercent, 100.0);
    assert.strictEqual(quality.telemetryGaps.length, 0);
  });

  it('should search similar historical incidents with matching evidence and resolution runbooks', () => {
    const results = aiops.searchSimilarIncidents({ service: 'payment-service' });
    assert.ok(results.length >= 1);

    const hit = results[0];
    assert.strictEqual(hit.service, 'payment-service');
    assert.ok(hit.similarityScore >= 0.9);
    assert.ok(hit.resolution.includes('circuit breaker'));
  });

  it('should query AIOps assistant for structured operational summaries', () => {
    const response = aiops.queryAssistant('System status');
    assert.strictEqual(response.status, 'OBSERVED');
    assert.ok(response.summary.includes('100% availability'));
    assert.ok(response.evidence.length >= 3);
    assert.ok(response.recommendations.length >= 1);
  });
});
