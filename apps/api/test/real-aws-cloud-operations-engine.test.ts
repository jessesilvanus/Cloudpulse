import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AwsCloudOperationsEngine } from '../src/services/aws-cloud-operations-engine.js';
import type { OperationState } from '@cloudpulse/shared';

describe('CLOUDPULSE Phase 60 Real AWS Continuous Cloud Operations Intelligence & Autonomous SRE Control Plane', () => {
  const operationsEngine = AwsCloudOperationsEngine.getInstance();
  const validWorkspace = 'ws-production';
  const invalidWorkspace = 'ws-unauthorized-tenant';

  it('should return live cloud situation with holistic health, active incidents, and telemetry freshness', () => {
    const situation = operationsEngine.getCloudSituation(validWorkspace);

    assert.equal(situation.workspaceId, validWorkspace);
    assert.ok(situation.overallHealthScore > 0 && situation.overallHealthScore <= 100);
    assert.ok(['A', 'B', 'C', 'D', 'F'].includes(situation.healthGrade));
    assert.equal(situation.activeIncidentsCount, 1);
    assert.ok(situation.degradedResourcesCount >= 2);
    assert.ok(situation.activeSecurityIssuesCount >= 1);
    assert.ok(situation.governanceRegressionsCount >= 1);
    assert.ok(situation.operations.length >= 3);
    assert.ok(situation.recentChanges.length >= 2);
    assert.ok(situation.degradedResources.length >= 2);
    assert.equal(situation.provenance, 'CALCULATED');

    // Verify AWS Data Health
    assert.equal(situation.awsDataHealth.connectionStatus, 'CONNECTED');
    assert.equal(situation.awsDataHealth.syncState, 'LIVE_TELEMETRY');
    assert.ok(situation.awsDataHealth.cloudTrailFreshness.length > 0);
    assert.ok(situation.awsDataHealth.configFreshness.length > 0);
  });

  it('should enforce strict tenant isolation and return zero state for unauthorized workspace', () => {
    const situation = operationsEngine.getCloudSituation(invalidWorkspace);

    assert.equal(situation.workspaceId, invalidWorkspace);
    assert.equal(situation.overallHealthScore, 0);
    assert.equal(situation.healthGrade, 'F');
    assert.equal(situation.activeIncidentsCount, 0);
    assert.equal(situation.degradedResourcesCount, 0);
    assert.deepEqual(situation.operations, []);
    assert.deepEqual(situation.recentChanges, []);
    assert.equal(situation.awsDataHealth.connectionStatus, 'PERMISSION_REQUIRED');
  });

  it('should query operations work queue with priority, state, and type filtering', () => {
    const allOps = operationsEngine.getOperations(validWorkspace);
    assert.ok(allOps.length >= 3, `Expected at least 3 operations, got ${allOps.length}`);

    const p0Ops = operationsEngine.getOperations(validWorkspace, { priority: 'P0_CRITICAL' });
    assert.ok(p0Ops.length >= 1);
    assert.ok(p0Ops.every((o) => o.priority === 'P0_CRITICAL'));

    const securityOps = operationsEngine.getOperations(validWorkspace, { type: 'SECURITY_CONTAINMENT' });
    assert.ok(securityOps.length >= 1);
    assert.ok(securityOps.every((o) => o.operationType === 'SECURITY_CONTAINMENT'));
  });

  it('should validate and execute legal state transitions across operation lifecycle', () => {
    const op = operationsEngine.getOperationById(validWorkspace, 'op-ec2-imdsv2-upgrade');
    assert.ok(op !== null);

    // Initial state: DECISION_READY
    // Transition DECISION_READY -> PLAN_READY
    const res1 = operationsEngine.transitionOperationState(
      validWorkspace,
      'op-ec2-imdsv2-upgrade',
      'PLAN_READY',
      'usr-lead-sre'
    );
    assert.equal(res1.success, true);
    assert.equal(res1.operation?.state, 'PLAN_READY');

    // Transition PLAN_READY -> APPROVED
    const res2 = operationsEngine.transitionOperationState(
      validWorkspace,
      'op-ec2-imdsv2-upgrade',
      'APPROVED',
      'usr-lead-sre'
    );
    assert.equal(res2.success, true);
    assert.equal(res2.operation?.state, 'APPROVED');
  });

  it('should reject illegal state transitions and enforce server-side transition validation', () => {
    // Attempt illegal jump from DETECTED directly to EXECUTING
    const validation = operationsEngine.validateStateTransition('DETECTED', 'EXECUTING');
    assert.equal(validation.isValid, false);
    assert.ok(validation.reason?.includes('Illegal state transition'));

    // Attempt illegal transition on live operation
    const res = operationsEngine.transitionOperationState(
      validWorkspace,
      'op-aurora-storage-rebalance',
      'VERIFIED', // op-aurora-storage-rebalance is in TRIAGED
      'usr-lead-sre'
    );
    assert.equal(res.success, false);
    assert.ok(res.error?.includes('Illegal state transition'));
  });

  it('should evaluate pre-flight validation checks across authentication, IAM, inventory, and concurrency', () => {
    const preflight = operationsEngine.evaluatePreflight(validWorkspace, 'op-s3-public-access-mitigation');

    assert.equal(preflight.isReady, true);
    assert.ok(preflight.preconditions.length >= 4);
    assert.ok(preflight.preconditions.every((p) => p.status === 'PASSED'));
    assert.deepEqual(preflight.blockers, []);
  });

  it('should execute controlled remediation, perform fresh AWS read, and verify true state', () => {
    // op-s3-public-access-mitigation is in PLAN_READY status
    const result = operationsEngine.executeOperation(
      validWorkspace,
      'op-s3-public-access-mitigation',
      'usr-lead-sre'
    );

    assert.equal(result.success, true);
    assert.equal(result.verification, 'VERIFIED');
    assert.equal(result.operation?.state, 'VERIFIED');
    assert.equal(result.operation?.executionState, 'COMPLETED');
    assert.ok(result.operation?.completedAt !== undefined);
  });

  it('should support safe rollback and update state for reversible operational actions', () => {
    const rollbackRes = operationsEngine.executeRollback(
      validWorkspace,
      'op-s3-public-access-mitigation',
      'usr-lead-sre'
    );

    assert.equal(rollbackRes.success, true);
    assert.equal(rollbackRes.operation?.state, 'ROLLED_BACK');
    assert.equal(rollbackRes.operation?.rollbackState, 'ROLLED_BACK');
  });

  it('should provide unified operational timeline merging changes, drifts, alarms, and decisions', () => {
    const timeline = operationsEngine.getOperationalTimeline(validWorkspace, 24);

    assert.ok(timeline.length >= 6, `Expected at least 6 timeline items, got ${timeline.length}`);
    assert.ok(timeline.some((t) => t.domain === 'CHANGE'));
    assert.ok(timeline.some((t) => t.domain === 'GOVERNANCE'));
    assert.ok(timeline.some((t) => t.domain === 'SECURITY'));
    assert.ok(timeline.some((t) => t.domain === 'ALARM'));
    assert.ok(timeline.some((t) => t.domain === 'INCIDENT'));
    assert.ok(timeline.some((t) => t.domain === 'DECISION'));
  });

  it('should generate 10-stage operational storyline tracking problem evolution from BEFORE to AFTER', () => {
    const storyline = operationsEngine.getOperationalStoryline(validWorkspace, 'op-s3-public-access-mitigation');

    assert.ok(storyline !== null);
    assert.equal(storyline?.operationId, 'op-s3-public-access-mitigation');
    assert.equal(storyline?.stages.length, 10);
    assert.equal(storyline?.stages[0]?.stage, 'BEFORE');
    assert.equal(storyline?.stages[1]?.stage, 'TRIGGER');
    assert.equal(storyline?.stages[2]?.stage, 'CHANGE');
    assert.equal(storyline?.stages[3]?.stage, 'DEGRADATION');
    assert.equal(storyline?.stages[4]?.stage, 'IMPACT');
    assert.equal(storyline?.stages[5]?.stage, 'INVESTIGATION');
    assert.equal(storyline?.stages[6]?.stage, 'DECISION');
    assert.equal(storyline?.stages[7]?.stage, 'ACTION');
    assert.equal(storyline?.stages[8]?.stage, 'VERIFICATION');
    assert.equal(storyline?.stages[9]?.stage, 'AFTER');
    assert.equal(storyline?.provenance, 'CALCULATED');
  });

  it('should maintain registered safe action catalog with automation levels and verification methods', () => {
    const catalog = operationsEngine.getSafeActionCatalog();

    assert.ok(catalog.length >= 4, `Expected at least 4 registered safe actions, got ${catalog.length}`);
    assert.ok(catalog.some((a) => a.actionId === 'act-s3-put-public-access-block'));
    assert.ok(catalog.some((a) => a.actionId === 'act-ec2-modify-imdsv2'));
    assert.ok(catalog.some((a) => a.actionId === 'act-rds-reboot-failover'));

    const s3Action = catalog.find((a) => a.actionId === 'act-s3-put-public-access-block');
    assert.equal(s3Action?.provider, 'AWS');
    assert.equal(s3Action?.rollbackCapability, true);
    assert.ok(s3Action?.requiredPermissions.includes('s3:PutPublicAccessBlock'));
  });

  it('should answer conversational queries via AI Operations Copilot with grounded evidence and safety', () => {
    // 1. Situation query
    const res1 = operationsEngine.askCopilot(validWorkspace, 'What is happening right now?');
    assert.equal(res1.intent, 'SITUATION_SUMMARY');
    assert.ok(res1.answer.length > 20);
    assert.ok(res1.citedEvidence.length >= 2);
    assert.equal(res1.confidence, 'HIGH');
    assert.equal(res1.provenance, 'CALCULATED');
    assert.equal(res1.suggestedAction?.requiresApproval, true);

    // 2. Recent change query
    const res2 = operationsEngine.askCopilot(validWorkspace, 'What changed recently?');
    assert.equal(res2.intent, 'CHANGE_INTELLIGENCE');
    assert.ok(res2.citedEvidence.some((e) => e.source.includes('CloudTrail')));

    // 3. Root cause query
    const res3 = operationsEngine.askCopilot(validWorkspace, 'Why is production degraded?');
    assert.equal(res3.intent, 'ROOT_CAUSE_INVESTIGATION');
    assert.ok(res3.citedEvidence.some((e) => e.source.includes('Knowledge Graph')));

    // 4. Safest next action query
    const res4 = operationsEngine.askCopilot(validWorkspace, 'What is the safest next step?');
    assert.equal(res4.intent, 'RECOMMENDED_NEXT_ACTION');
    assert.equal(res4.suggestedAction?.actionType, 'SECURITY_CONTAINMENT');
  });
});
