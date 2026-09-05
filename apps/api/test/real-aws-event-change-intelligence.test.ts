import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsEventChangeEngine } from '../src/services/aws-event-change-engine.js';
import type { AwsRealEvent } from '@cloudpulse/shared';

describe('CLOUDPULSE Phase 43 Real AWS Continuous Monitoring, Event Ingestion & Change Intelligence', () => {
  const eventEngine = AwsEventChangeEngine.getInstance();

  it('should retrieve normalized real AWS events with complete actor intelligence and timestamps', () => {
    const events = eventEngine.getEvents('ws-production');
    assert.ok(events.length >= 5, 'Must discover all active real AWS events');

    for (const evt of events) {
      assert.strictEqual(evt.provider, 'AWS');
      assert.strictEqual(evt.accountId, '718293041526');
      assert.strictEqual(evt.provenance, 'LIVE');
      assert.ok(evt.actor.name, 'Actor name must exist');
      assert.ok(evt.actor.principalId, 'Principal ID must exist');
      assert.ok(['IAM_USER', 'ASSUMED_ROLE', 'FEDERATED', 'AWS_SERVICE', 'ROOT', 'UNKNOWN'].includes(evt.actor.type));
    }
  });

  it('should enforce deduplication on incoming duplicate CloudTrail event records', () => {
    const duplicateEvent: AwsRealEvent = {
      id: 'evt-test-dup-01',
      workspaceId: 'ws-production',
      organizationId: 'org-cloudpulse-corp',
      connectionId: 'conn-aws-prod-01',
      provider: 'AWS',
      accountId: '718293041526',
      region: 'us-east-1',
      eventType: 'AwsApiCall',
      source: 'aws.cloudtrail',
      timestamp: '2026-09-02T12:00:00.000Z',
      receivedAt: '2026-09-02T12:00:05.000Z',
      actor: {
        name: 'test-user',
        type: 'IAM_USER',
        principalId: 'AIDA718293041526:test-user'
      },
      action: 'DescribeInstances',
      resourceId: 'i-08f331920acb119a0',
      resourceType: 'AWS::EC2::Instance',
      service: 'EC2',
      severity: 'INFO',
      status: 'SUCCESS',
      isHighRisk: false,
      impacts: { securityImpact: 'NONE', costImpact: 'NEUTRAL', observabilityImpact: 'NORMAL', complianceImpact: 'PASS' },
      provenance: 'LIVE',
      confidence: 100
    };

    const firstIngest = eventEngine.ingestEvent(duplicateEvent);
    assert.strictEqual(firstIngest.success, true);
    assert.strictEqual(firstIngest.deduplicated, false);

    const secondIngest = eventEngine.ingestEvent(duplicateEvent);
    assert.strictEqual(secondIngest.success, true);
    assert.strictEqual(secondIngest.deduplicated, true, 'Subsequent identical event must be deduplicated');
  });

  it('should generate executive Change Intelligence summary with accurate KPI metrics', () => {
    const summary = eventEngine.getChangeSummary('ws-production');
    assert.strictEqual(summary.provenance, 'LIVE');
    assert.strictEqual(summary.accountId, '718293041526');
    assert.ok(summary.totalEventsCount >= 5);
    assert.ok(summary.criticalChangesCount >= 1);
    assert.ok(summary.highRiskChangesCount >= 2);
    assert.ok(summary.affectedResourcesCount >= 4);
    assert.strictEqual(summary.pipelineQuality.cloudTrailStatus, 'CONNECTED');
    assert.strictEqual(summary.pipelineQuality.eventBridgeStatus, 'CONNECTED');
  });

  it('should evaluate before and after configuration state diffs on AWS resources', () => {
    const event = eventEngine.getEventById('evt-aws-ct-01', 'ws-production');
    assert.ok(event);
    assert.strictEqual(event.action, 'AuthorizeSecurityGroupIngress');
    assert.ok(event.previousState);
    assert.ok(event.currentState);
    assert.strictEqual(event.isHighRisk, true);
    assert.ok(event.riskReason?.includes('port 22'));
  });

  it('should detect high-risk operations (unrestricted SSH ingress, SCP blocked policy attachments)', () => {
    const events = eventEngine.getEvents('ws-production');
    const scpBlocked = events.find((e) => e.action === 'AttachRolePolicy' && e.status === 'BLOCKED');
    assert.ok(scpBlocked);
    assert.strictEqual(scpBlocked.severity, 'CRITICAL');
    assert.strictEqual(scpBlocked.isHighRisk, true);
    assert.strictEqual(scpBlocked.impacts.securityImpact, 'HIGH');
  });

  it('should construct evidence-grounded change correlation chains without unsupported causality claims', () => {
    const summary = eventEngine.getChangeSummary('ws-production');
    assert.ok(summary.correlationGroups.length >= 2);

    const sgGroup = summary.correlationGroups.find((g) => g.id === 'corr-sg-drift-001');
    assert.ok(sgGroup);
    assert.strictEqual(sgGroup.relationship, 'LIKELY_RELATED');
    assert.ok(sgGroup.rootCauseCandidate?.includes('sarah.connor'));
  });

  it('should perform multi-attribute filtering (service, severity, actor, time range, search)', () => {
    const filteredByService = eventEngine.getEvents('ws-production', { service: 'LAMBDA' });
    assert.ok(filteredByService.every((e) => e.service === 'LAMBDA'));

    const filteredBySeverity = eventEngine.getEvents('ws-production', { severity: 'CRITICAL' });
    assert.ok(filteredBySeverity.every((e) => e.severity === 'CRITICAL'));

    const filteredBySearch = eventEngine.getEvents('ws-production', { search: 'sarah' });
    assert.ok(filteredBySearch.every((e) => e.actor.name.includes('sarah')));
  });

  it('should manage incremental sync checkpoints and track pipeline data quality', async () => {
    const syncRes = await eventEngine.syncEvents('ws-production', 'conn-aws-prod-01', '6h');
    assert.strictEqual(syncRes.window, '6h');
    assert.ok(typeof syncRes.eventsSynced === 'number');

    const checkpoint = eventEngine.getSyncCheckpoint('ws-production');
    assert.ok(checkpoint);
    assert.strictEqual(checkpoint.status, 'HEALTHY');
    assert.strictEqual(checkpoint.syncIntervalSeconds, 60);
  });

  it('should return truthful empty / not connected state for unconfigured workspaces', () => {
    const emptySummary = eventEngine.getChangeSummary('ws-disconnected-workspace');
    assert.strictEqual(emptySummary.provenance, 'NOT_CONNECTED');
    assert.strictEqual(emptySummary.totalEventsCount, 0);
    assert.strictEqual(emptySummary.pipelineQuality.cloudTrailStatus, 'UNAVAILABLE');
  });

  it('should strictly enforce tenant isolation preventing cross-workspace event access', () => {
    const crossTenantEvent = eventEngine.getEventById('evt-aws-ct-01', 'ws-unauthorized-tenant');
    assert.strictEqual(crossTenantEvent, null, 'Cannot access events across workspace boundaries');
  });
});
