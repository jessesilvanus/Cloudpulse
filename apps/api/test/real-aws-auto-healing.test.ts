import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsAutoHealingEngine } from '../src/services/aws-auto-healing-engine.js';

describe('CLOUDPULSE Phase 54 Real AWS Governance Auto-Healing & Controlled Self-Repair', () => {
  const autoHealingEngine = AwsAutoHealingEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should return accurate auto-healing summary with healthy circuit breaker status', () => {
    const summary = autoHealingEngine.getAutoHealingSummary(validWorkspace);
    assert.ok(summary);
    assert.strictEqual(summary.totalAutoRemediations >= 2, true);
    assert.strictEqual(summary.activeAutomationPoliciesCount, 2);
    assert.strictEqual(summary.circuitBreakersTrippedCount, 0);
    assert.strictEqual(summary.autoHealingStatus, 'HEALTHY');
    assert.strictEqual(summary.meanSelfHealingTimeSeconds, 40);
    assert.strictEqual(summary.provenance, 'CALCULATED');
  });

  it('should retrieve active automation policies with automation levels', () => {
    const policies = autoHealingEngine.getAutomationPolicies(validWorkspace);
    assert.strictEqual(policies.length, 2);

    const p1 = policies.find((p) => p.id === 'auto-pol-ec2-monitoring');
    assert.ok(p1);
    assert.strictEqual(p1.automationLevel, 'LEVEL_3_SAFE_AUTO_REMEDIATE');
    assert.strictEqual(p1.status, 'ACTIVE');
    assert.strictEqual(p1.isCircuitBroken, false);

    const p2 = policies.find((p) => p.id === 'auto-pol-s3-security');
    assert.ok(p2);
    assert.strictEqual(p2.automationLevel, 'LEVEL_2_APPROVAL_REQUIRED');
  });

  it('should retrieve action allowlist with preconditions and verification methods', () => {
    const list = autoHealingEngine.getActionAllowlist();
    assert.ok(list.length >= 2);

    const ec2Act = list.find((a) => a.actionId === 'AWS_EC2_ENABLE_DETAILED_MONITORING');
    assert.ok(ec2Act);
    assert.strictEqual(ec2Act.riskLevel, 'LOW_RISK_CHANGE');
    assert.strictEqual(ec2Act.reversible, true);
    assert.ok(ec2Act.preconditions.length > 0);
  });

  it('should pause and resume automation policy updating status', () => {
    const paused = autoHealingEngine.pauseAutomationPolicy('auto-pol-ec2-monitoring', validWorkspace);
    assert.ok(paused);
    assert.strictEqual(paused.status, 'PAUSED');

    const resumed = autoHealingEngine.resumeAutomationPolicy('auto-pol-ec2-monitoring', validWorkspace);
    assert.ok(resumed);
    assert.strictEqual(resumed.status, 'ACTIVE');
    assert.strictEqual(resumed.isCircuitBroken, false);
  });

  it('should reject event-driven self-healing for unallowlisted actions', () => {
    const res = autoHealingEngine.triggerEventDrivenSelfHealing(validWorkspace, {
      resourceId: 'i-078a1bc49281e7f02',
      resourceName: 'staging-workload-runner',
      resourceType: 'AWS::EC2::Instance',
      actionId: 'AWS_UNSUPPORTED_RANDOM_MUTATION',
      changeActor: 'test-actor@cloudpulse.internal',
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.queueItem, null);
    assert.ok(res.message.includes('not in the Governance Action Allowlist'));
  });

  it('should execute event-driven self-healing for LEVEL_3 allowlisted low-risk actions', () => {
    const res = autoHealingEngine.triggerEventDrivenSelfHealing(validWorkspace, {
      resourceId: 'i-078a1bc49281e7f02',
      resourceName: 'staging-workload-runner',
      resourceType: 'AWS::EC2::Instance',
      actionId: 'AWS_EC2_ENABLE_DETAILED_MONITORING',
      changeActor: 'cloudtrail-ssm-session',
    });
    assert.ok(res);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.queueItem?.status, 'COMPLETED');
    assert.strictEqual(res.queueItem?.automationLevel, 'LEVEL_3_SAFE_AUTO_REMEDIATE');
    assert.ok(res.queueItem?.idempotencyKey.startsWith('idemp-'));
    assert.ok(res.message.includes('Pre-flight verified, safe mutation executed'));
  });

  it('should enqueue medium-risk actions in READY status for LEVEL_2 approval-required policies', () => {
    const res = autoHealingEngine.triggerEventDrivenSelfHealing(validWorkspace, {
      resourceId: 'cloudpulse-production-audit-logs-2026',
      resourceName: 'audit-logs-bucket',
      resourceType: 'AWS::S3::Bucket',
      actionId: 'AWS_S3_ENABLE_PUBLIC_ACCESS_BLOCK',
      changeActor: 'cloudtrail-s3-admin',
    });
    assert.ok(res);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.queueItem?.status, 'READY');
    assert.strictEqual(res.queueItem?.automationLevel, 'LEVEL_2_APPROVAL_REQUIRED');
    assert.ok(res.message.includes('requires explicit human approval'));
  });

  it('should reject self-healing when automation policy is paused or circuit breaker is tripped', () => {
    autoHealingEngine.pauseAutomationPolicy('auto-pol-ec2-monitoring', validWorkspace);

    const res = autoHealingEngine.triggerEventDrivenSelfHealing(validWorkspace, {
      resourceId: 'i-078a1bc49281e7f02',
      resourceName: 'staging-workload-runner',
      resourceType: 'AWS::EC2::Instance',
      actionId: 'AWS_EC2_ENABLE_DETAILED_MONITORING',
      changeActor: 'test',
    });
    assert.strictEqual(res.success, false);
    assert.ok(res.message.includes('No active automation policy found'));

    // Resume for subsequent tests
    autoHealingEngine.resumeAutomationPolicy('auto-pol-ec2-monitoring', validWorkspace);
  });

  it('should create custom automation policy in DRAFT status', () => {
    const custom = autoHealingEngine.createAutomationPolicy(validWorkspace, {
      name: 'RDS Deletion Protection Auto-Healing',
      description: 'Enforces deletion protection on RDS instances.',
      automationLevel: 'LEVEL_2_APPROVAL_REQUIRED',
      resourceType: 'AWS::RDS::DBInstance',
      allowedActions: ['AWS_RDS_ENABLE_DELETION_PROTECTION'],
      createdBy: 'db-admin@cloudpulse.io',
    });
    assert.ok(custom.id.startsWith('auto-pol-'));
    assert.strictEqual(custom.status, 'DRAFT');
  });

  it('should strictly enforce tenant isolation preventing cross-workspace auto-healing triggers', () => {
    const policies = autoHealingEngine.getAutomationPolicies('ws-unauthorized-tenant');
    assert.strictEqual(policies.length, 0);

    const summary = autoHealingEngine.getAutoHealingSummary('ws-unauthorized-tenant');
    assert.strictEqual(summary.totalAutoRemediations, 0);
    assert.strictEqual(summary.autoHealingStatus, 'PAUSED');

    const res = autoHealingEngine.triggerEventDrivenSelfHealing('ws-unauthorized-tenant', {
      resourceId: 'i-078a1bc49281e7f02',
      resourceName: 'staging-workload-runner',
      resourceType: 'AWS::EC2::Instance',
      actionId: 'AWS_EC2_ENABLE_DETAILED_MONITORING',
      changeActor: 'hacker',
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.message, 'Unauthorized workspace.');
  });
});
