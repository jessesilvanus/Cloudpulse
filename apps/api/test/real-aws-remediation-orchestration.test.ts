import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsRemediationEngine } from '../src/services/aws-remediation-engine.js';
import { AwsDriftEngine } from '../src/services/aws-drift-engine.js';
import { AwsGovernanceEngine } from '../src/services/aws-governance-engine.js';

describe('CLOUDPULSE Phase 53 Real AWS Governance Baselines & Remediation Orchestration', () => {
  const remediationEngine = AwsRemediationEngine.getInstance();
  const driftEngine = AwsDriftEngine.getInstance();
  const governanceEngine = AwsGovernanceEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should return accurate remediation orchestration summary with verified compliance score', () => {
    const summary = remediationEngine.getOrchestrationSummary(validWorkspace);
    assert.ok(summary);
    assert.strictEqual(summary.totalPlansGenerated, 1);
    assert.strictEqual(summary.pendingApprovalsCount, 1);
    assert.strictEqual(summary.verifiedComplianceScore, 87.5);
    assert.strictEqual(summary.meanTimeToVerificationMinutes, 1.2);
    assert.strictEqual(summary.provenance, 'CALCULATED');
  });

  it('should retrieve active governance baselines with structured controls and risk classifications', () => {
    const baselines = remediationEngine.getBaselines(validWorkspace);
    assert.strictEqual(baselines.length, 1);

    const b = baselines[0];
    assert.strictEqual(b.id, 'gov-base-ec2-production');
    assert.strictEqual(b.status, 'ACTIVE');
    assert.strictEqual(b.version, 'v1.2.0');
    assert.strictEqual(b.controls.length, 2);

    const c1 = b.controls.find((c) => c.id === 'ctrl-ec2-01');
    assert.ok(c1);
    assert.strictEqual(c1.field, 'monitoring.state');
    assert.strictEqual(c1.expectedValue, 'enabled');
    assert.strictEqual(c1.riskLevel, 'LOW_RISK_CHANGE');
  });

  it('should retrieve initial remediation plan in APPROVAL_PENDING status', () => {
    const plan = remediationEngine.getRemediationPlanById('rem-plan-ec2-01', validWorkspace);
    assert.ok(plan);
    assert.strictEqual(plan.resourceId, 'i-078a1bc49281e7f02');
    assert.strictEqual(plan.status, 'APPROVAL_PENDING');
    assert.strictEqual(plan.riskLevel, 'LOW_RISK_CHANGE');
    assert.strictEqual(plan.actions.length, 4);
    assert.strictEqual(plan.actions[2].type, 'CHANGE');
    assert.strictEqual(plan.actions[3].type, 'VERIFY');
  });

  it('should reject execution of unapproved remediation plan', () => {
    const res = remediationEngine.executeRemediationPlan('rem-plan-ec2-01', 'operator@cloudpulse.io', validWorkspace);
    assert.strictEqual(res.executed, false);
    assert.strictEqual(res.verified, false);
    assert.ok(res.message.includes('cannot be executed until approved'));
  });

  it('should approve remediation plan and transition status to APPROVED with approver audit trail', () => {
    const approved = remediationEngine.approveRemediationPlan('rem-plan-ec2-01', 'sre-lead@cloudpulse.io', validWorkspace);
    assert.ok(approved);
    assert.strictEqual(approved.status, 'APPROVED');
    assert.strictEqual(approved.approvedBy, 'sre-lead@cloudpulse.io');
    assert.ok(approved.auditTrail.some((a) => a.action === 'PLAN_APPROVED'));
  });

  it('should execute approved remediation plan with pre-flight check, safe mutation, and fresh AWS read verification', () => {
    const res = remediationEngine.executeRemediationPlan('rem-plan-ec2-01', 'sre-operator@cloudpulse.io', validWorkspace);
    assert.ok(res);
    assert.strictEqual(res.preflightPassed, true);
    assert.strictEqual(res.executed, true);
    assert.strictEqual(res.verified, true);
    assert.strictEqual(res.freshAwsState.monitoring.state, 'enabled');
    assert.strictEqual(res.plan?.status, 'VERIFIED');
    assert.ok(res.plan?.freshAwsReadVerifiedAt);
  });

  it('should update drift and governance finding statuses upon verified remediation', () => {
    const drift = driftEngine.getDriftById('drift-aws-ec2-01', validWorkspace);
    assert.ok(drift);
    assert.strictEqual(drift.status, 'VERIFIED');

    const finding = governanceEngine.getFindingById('gov-find-ec2-01', validWorkspace);
    assert.ok(finding);
    assert.strictEqual(finding.status, 'VERIFIED');
  });

  it('should create custom governance baseline in DRAFT status', () => {
    const custom = remediationEngine.createBaseline(validWorkspace, {
      name: 'Production S3 Governance Baseline',
      description: 'Enforces SSE-KMS encryption and public access block.',
      accountId: '839201746152',
      region: 'us-east-1',
      controls: [
        {
          id: 'ctrl-s3-01',
          name: 'S3 Block Public Access',
          resourceType: 'AWS::S3::Bucket',
          field: 'publicAccessBlock.blockPublicAcls',
          expectedValue: true,
          severity: 'CRITICAL',
          remediationAction: 'aws s3api put-public-access-block',
          riskLevel: 'MEDIUM_RISK_CHANGE',
        }
      ],
      createdBy: 'security-engineer@cloudpulse.io',
    });
    assert.ok(custom.id.startsWith('gov-base-'));
    assert.strictEqual(custom.status, 'DRAFT');
  });

  it('should approve custom baseline and transition status to ACTIVE', () => {
    const custom = remediationEngine.createBaseline(validWorkspace, {
      name: 'Temp Baseline for Approval',
      description: 'Temp baseline',
      accountId: '839201746152',
      region: 'us-east-1',
      controls: [],
      createdBy: 'sre@cloudpulse.io',
    });
    const approved = remediationEngine.approveBaseline(custom.id, 'sre-architect@cloudpulse.io', validWorkspace);
    assert.ok(approved);
    assert.strictEqual(approved.status, 'ACTIVE');
    assert.strictEqual(approved.approvedBy, 'sre-architect@cloudpulse.io');
    assert.ok(approved.effectiveAt);
  });

  it('should strictly enforce tenant isolation preventing cross-workspace remediation access', () => {
    const plans = remediationEngine.getRemediationPlans('ws-unauthorized-tenant');
    assert.strictEqual(plans.length, 0, 'Cross-workspace plans query must return 0');

    const summary = remediationEngine.getOrchestrationSummary('ws-unauthorized-tenant');
    assert.strictEqual(summary.totalPlansGenerated, 0);

    const lookup = remediationEngine.getRemediationPlanById('rem-plan-ec2-01', 'ws-unauthorized-tenant');
    assert.strictEqual(lookup, null, 'Cross-workspace lookup must return null');

    const exec = remediationEngine.executeRemediationPlan('rem-plan-ec2-01', 'hacker@malicious.com', 'ws-unauthorized-tenant');
    assert.strictEqual(exec.executed, false);
    assert.strictEqual(exec.message, 'Unauthorized workspace.');
  });
});
