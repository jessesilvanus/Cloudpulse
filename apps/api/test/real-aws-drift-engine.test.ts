import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsDriftEngine } from '../src/services/aws-drift-engine.js';

describe('CLOUDPULSE Phase 52 Real AWS Continuous Compliance & Drift Detection Engine', () => {
  const driftEngine = AwsDriftEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should return accurate continuous compliance drift summary and reconciliation health', () => {
    const summary = driftEngine.getDriftSummary(validWorkspace);
    assert.ok(summary);
    assert.strictEqual(summary.totalDriftsDetected, 1);
    assert.strictEqual(summary.unresolvedDriftsCount, 1);
    assert.strictEqual(summary.activeBaselinesCount, 2);
    assert.strictEqual(summary.reconciliationStatus, 'HEALTHY');
    assert.strictEqual(summary.categoryBreakdown.OBSERVABILITY_DRIFT, 1);
    assert.strictEqual(summary.provenance, 'CALCULATED');
  });

  it('should retrieve active configuration baselines with expected specifications', () => {
    const baselines = driftEngine.getBaselines(validWorkspace);
    assert.strictEqual(baselines.length, 2);

    const ec2Baseline = baselines.find((b) => b.id === 'base-aws-ec2-staging');
    assert.ok(ec2Baseline);
    assert.strictEqual(ec2Baseline.version, 'v1.2.0');
    assert.strictEqual(ec2Baseline.status, 'ACTIVE');
    assert.strictEqual(ec2Baseline.expectedConfiguration.monitoring.state, 'enabled');
  });

  it('should detect field-level configuration drift against approved baseline', () => {
    const drifts = driftEngine.getDrifts(validWorkspace);
    assert.strictEqual(drifts.length, 1);

    const drift = drifts[0];
    assert.strictEqual(drift.id, 'drift-aws-ec2-01');
    assert.strictEqual(drift.driftType, 'OBSERVABILITY_DRIFT');
    assert.strictEqual(drift.severity, 'MEDIUM');
    assert.strictEqual(drift.status, 'DETECTED');
    assert.strictEqual(drift.diffs.length, 1);

    const diff = drift.diffs[0];
    assert.strictEqual(diff.field, 'monitoring.state');
    assert.strictEqual(diff.expected, 'enabled');
    assert.strictEqual(diff.actual, 'disabled');
    assert.strictEqual(diff.diffType, 'CHANGED');
  });

  it('should attribute drift to CloudTrail actor and change mechanism', () => {
    const drift = driftEngine.getDriftById('drift-aws-ec2-01', validWorkspace);
    assert.ok(drift);
    assert.ok(drift.actor?.includes('dev-automation'));
    assert.strictEqual(drift.changeSource, 'AWS CloudTrail');
    assert.strictEqual(drift.provenance, 'LIVE');
  });

  it('should correlate detected drift with policy impact, security impact, and downstream dependencies', () => {
    const drift = driftEngine.getDriftById('drift-aws-ec2-01', validWorkspace);
    assert.ok(drift);
    assert.ok(drift.policyImpact?.includes('pol-aws-ec2-monitoring-enabled'));
    assert.ok(drift.dependencyImpact?.includes('Staging Background Processing Pool'));
    assert.strictEqual(drift.costImpact, 0.00);
  });

  it('should execute real-time resource drift reconciliation without modifying infrastructure', () => {
    const rec = driftEngine.reconcileResourceDrift('i-078a1bc49281e7f02', validWorkspace);
    assert.ok(rec);
    assert.strictEqual(rec.reconciled, true);
    assert.strictEqual(rec.driftsDetected, 1);
    assert.strictEqual(rec.provenance, 'LIVE');
  });

  it('should update drift lifecycle status from DETECTED to ACKNOWLEDGED', () => {
    const updated = driftEngine.updateDriftStatus('drift-aws-ec2-01', 'ACKNOWLEDGED', validWorkspace);
    assert.ok(updated);
    assert.strictEqual(updated.status, 'ACKNOWLEDGED');

    // Revert back to DETECTED for consistency
    driftEngine.updateDriftStatus('drift-aws-ec2-01', 'DETECTED', validWorkspace);
  });

  it('should create custom configuration baseline in DRAFT status', () => {
    const newBase = driftEngine.createBaseline(validWorkspace, {
      name: 'Production RDS Encryption Baseline',
      resourceType: 'AWS::RDS::DBInstance',
      expectedConfiguration: { storageEncrypted: true },
      createdBy: 'security-lead@cloudpulse.io',
    });
    assert.ok(newBase.id.startsWith('base-'));
    assert.strictEqual(newBase.status, 'DRAFT');
  });

  it('should approve baseline and transition status to ACTIVE', () => {
    const newBase = driftEngine.createBaseline(validWorkspace, {
      name: 'Temp Baseline to Approve',
      resourceType: 'AWS::EC2::VPC',
      expectedConfiguration: { enableDnsHostnames: true },
      createdBy: 'sre@cloudpulse.io',
    });
    const approved = driftEngine.approveBaseline(newBase.id, validWorkspace);
    assert.ok(approved);
    assert.strictEqual(approved.status, 'ACTIVE');
    assert.ok(approved.approvedAt);
  });

  it('should strictly enforce tenant isolation preventing cross-workspace drift data access', () => {
    const drifts = driftEngine.getDrifts('ws-unauthorized-tenant');
    assert.strictEqual(drifts.length, 0, 'Cross-workspace drifts query must return 0');

    const summary = driftEngine.getDriftSummary('ws-unauthorized-tenant');
    assert.strictEqual(summary.totalDriftsDetected, 0);
    assert.strictEqual(summary.reconciliationStatus, 'UNKNOWN');

    const lookup = driftEngine.getDriftById('drift-aws-ec2-01', 'ws-unauthorized-tenant');
    assert.strictEqual(lookup, null, 'Cross-workspace drift lookup must return null');
  });
});
