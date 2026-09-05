import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CloudDataEventIntelligenceEngine } from '../src/services/cloud-data-event-intelligence-engine.js';

describe('CLOUDPULSE Phase 31 Cloud Data Intelligence & Real-Time Decision Engine', () => {
  const engine = CloudDataEventIntelligenceEngine.getInstance();

  it('should return Event Intelligence pipeline summary with health score and throughput metrics', () => {
    const summary = engine.getSummary();
    assert.strictEqual(summary.healthScore, 97.2);
    assert.strictEqual(summary.eventsPerSecond, 142.5);
    assert.strictEqual(summary.eventsPerMinute, 8550);
    assert.ok(summary.totalIngestedCount >= 125000);
    assert.ok(summary.averageLatencyMs <= 5.0);
    assert.strictEqual(summary.deadLetterQueueCount, 1);
  });

  it('should list normalized cloud events with provider, source, and severity filtering', () => {
    const allEvents = engine.getEvents();
    assert.ok(allEvents.length >= 4, 'Must list initial event stream');

    const k8sEvents = engine.getEvents('kubernetes');
    assert.ok(k8sEvents.length >= 1);
    assert.strictEqual(k8sEvents[0].eventType, 'pod.crashloop');

    const critEvents = engine.getEvents(undefined, undefined, undefined, 'CRITICAL');
    assert.ok(critEvents.length >= 1);
    assert.strictEqual(critEvents[0].service, 'order-service');
  });

  it('should retrieve specific cloud event by ID with full envelope payload and trace correlation', () => {
    const evt = engine.getEventById('evt-k8s-pod-101');
    assert.ok(evt);
    assert.strictEqual(evt.service, 'api-gateway');
    assert.strictEqual(evt.payload.exitCode, 137);
    assert.strictEqual(evt.traceId, '5db386efe7318a2f568ade39e62f0bde');
  });

  it('should ingest new cloud event, validate against schema, and enrich with telemetry metadata', () => {
    const ingested = engine.ingestEvent({
      service: 'payment-service',
      eventType: 'pod.crashloop',
      payload: { exitCode: 1, restartCount: 1, reason: 'ConfigError' },
      severity: 'HIGH'
    });

    assert.strictEqual(ingested.service, 'payment-service');
    assert.strictEqual(ingested.status, 'ENRICHED');
    assert.strictEqual(ingested.ingestionMode, 'LIVE');
    assert.ok(ingested.id.startsWith('evt-'));
  });

  it('should reject malformed event lacking required schema fields and route to Dead Letter Queue (DLQ)', () => {
    assert.throws(
      () => {
        engine.ingestEvent({
          service: 'order-service',
          eventType: 'database.connection.exhaustion',
          payload: { cpuUtilizationPercent: 95.0 } // Missing activeConnections & maxConnections
        });
      },
      /Event failed schema validation: Missing required field/
    );

    const dlqs = engine.getDeadLetters('QUEUED');
    assert.ok(dlqs.length >= 2, 'Malformed event must be routed to DLQ');
  });

  it('should retrieve and execute controlled retry of dead-lettered events', () => {
    const dlq = engine.getDeadLetters('QUEUED')[0];
    assert.ok(dlq);

    const retried = engine.retryDeadLetter(dlq.id);
    assert.strictEqual(retried.status, 'RESOLVED');
    assert.ok(retried.retryCount >= 1);
  });

  it('should query correlated event incident groups with root cause hypothesis', () => {
    const correlations = engine.getCorrelations();
    assert.ok(correlations.length >= 2);

    const corr = correlations.find((c) => c.service === 'api-gateway');
    assert.ok(corr);
    assert.strictEqual(corr.ruleId, 'rule-corr-oom-cascade');
    assert.ok(corr.rootCauseHypothesis.includes('memory limit'));
  });

  it('should evaluate policy-aware real-time decision rules with explainable evidence and recommended actions', () => {
    const decisions = engine.getDecisions();
    assert.ok(decisions.length >= 2);

    const scaleDec = decisions.find((d) => d.service === 'api-gateway');
    assert.ok(scaleDec);
    assert.strictEqual(scaleDec.outcome, 'SCALE_SERVICE');
    assert.strictEqual(scaleDec.policyGateStatus, 'REQUIRES_OPERATOR_APPROVAL');
    assert.ok(scaleDec.confidenceScore >= 0.95);
  });

  it('should simulate synthetic multi-cloud event traffic scenarios with honest SIMULATED labeling', () => {
    const sim = engine.simulateScenario('TRAFFIC_SPIKE', 5, 'production');
    assert.strictEqual(sim.ingestionMode, 'SIMULATED');
    assert.strictEqual(sim.eventsGenerated, 5);
    assert.ok(sim.safetyNotice.includes('SIMULATED'));
  });

  it('should replay historical event sequences at designated speeds with REPLAYED labeling', () => {
    const replay = engine.replayEvents('session-hist-01', '5x');
    assert.strictEqual(replay.replaySpeed, '5x');
    assert.strictEqual(replay.ingestionMode, 'REPLAYED');
    assert.strictEqual(replay.status, 'REPLAYING');
  });

  it('should answer natural language event queries strictly grounded in observable event evidence', () => {
    const response = engine.queryEventAssistant('What caused the high latency in API gateway?');
    assert.strictEqual(response.status, 'OBSERVED');
    assert.ok(response.evidence.length >= 4);
    assert.ok(response.decisionsEvaluated.length >= 2);
    assert.ok(response.recommendation.includes('api-gateway scaling decision'));
  });
});
