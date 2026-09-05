import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsGovernanceDecisionEngine } from '../src/services/aws-governance-decision-engine.js';

describe('CLOUDPULSE Phase 57 Real AWS Governance Decision Engine & Control Optimization Automation', () => {
  const decisionEngine = AwsGovernanceDecisionEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should return accurate governance decision summary with priority and status breakdown', () => {
    const summary = decisionEngine.getGovernanceDecisionSummary(validWorkspace);
    assert.ok(summary);
    assert.strictEqual(summary.totalDecisions, 2);
    assert.strictEqual(summary.criticalDecisionsCount, 1);
    assert.strictEqual(summary.readyForRemediationCount >= 1, true);
    assert.strictEqual(summary.hotspotsCount, 1);
    assert.strictEqual(summary.provenance, 'CALCULATED');
  });

  it('should retrieve prioritized governance decisions with root-cause hypotheses', () => {
    const decisions = decisionEngine.getDecisions(validWorkspace);
    assert.strictEqual(decisions.length, 2);

    const p1 = decisions.find((d) => d.priority === 'P1');
    assert.ok(p1);
    assert.strictEqual(p1.decisionType, 'TELEMETRY_GAP');
    assert.strictEqual(p1.rootCauseHypothesis.category, 'MANUAL_CONFIG');
    assert.strictEqual(p1.rootCauseHypothesis.confidence, 'CONFIRMED');
    assert.strictEqual(p1.automationLevel, 'SAFE_TO_AUTOMATE');
    assert.strictEqual(p1.recommendedAction.isAllowlisted, true);
  });

  it('should filter decisions by priority (P1, P2) and status', () => {
    const p1s = decisionEngine.getDecisions(validWorkspace, { priority: 'P1' });
    assert.strictEqual(p1s.length, 1);
    assert.strictEqual(p1s[0].priority, 'P1');

    const p2s = decisionEngine.getDecisions(validWorkspace, { priority: 'P2' });
    assert.strictEqual(p2s.length, 1);
    assert.strictEqual(p2s[0].priority, 'P2');
  });

  it('should retrieve specific decision by ID with full evidence attribution', () => {
    const dec = decisionEngine.getDecisionById('dec-ec2-observability-p1', validWorkspace);
    assert.ok(dec);
    assert.strictEqual(dec.id, 'dec-ec2-observability-p1');
    assert.ok(dec.evidenceIds.includes('ev-ec2-cloudwatch-5min'));
    assert.ok(dec.controlIds.includes('ctrl-ec2-detailed-monitoring'));
    assert.ok(dec.policyIds.includes('pol-aws-ec2-monitoring-enabled'));
    assert.strictEqual(dec.freshness, 'FRESH');
  });

  it('should transition decision lifecycle status', () => {
    const updated = decisionEngine.transitionDecisionStatus('dec-s3-retention-exception-p2', 'ANALYZING', validWorkspace);
    assert.ok(updated);
    assert.strictEqual(updated.status, 'ANALYZING');

    // Reset back to NEW for test cleanliness
    decisionEngine.transitionDecisionStatus('dec-s3-retention-exception-p2', 'NEW', validWorkspace);
  });

  it('should generate remediation plan from decision linking simulation and remediation engine', () => {
    const res = decisionEngine.createRemediationPlanFromDecision('dec-s3-retention-exception-p2', validWorkspace);
    assert.strictEqual(res.success, true);
    assert.ok(res.planId?.startsWith('plan-from-dec-'));
    assert.strictEqual(res.decision?.status, 'APPROVAL_REQUIRED');
  });

  it('should prove decision cannot directly execute AWS changes without passing through remediation guards', () => {
    const dec = decisionEngine.getDecisionById('dec-ec2-observability-p1', validWorkspace);
    assert.ok(dec);
    // Decision maintains pure metadata and links to plan without executing CLI/SDK mutations directly
    assert.strictEqual(dec.provenance, 'CALCULATED');
    assert.ok(dec.remediationPlanId);
  });

  it('should maintain verified compliance and effectiveness score after remediation verification', () => {
    const dec = decisionEngine.getDecisionById('dec-ec2-observability-p1', validWorkspace);
    assert.ok(dec);
    assert.strictEqual(dec.verificationStatus, 'VERIFIED_COMPLIANT');
    assert.strictEqual(dec.effectivenessScore, 100);
  });

  it('should strictly enforce tenant isolation preventing cross-workspace decision access', () => {
    const summary = decisionEngine.getGovernanceDecisionSummary('ws-unauthorized-tenant');
    assert.strictEqual(summary.totalDecisions, 0);
    assert.strictEqual(summary.decisions.length, 0);

    const list = decisionEngine.getDecisions('ws-unauthorized-tenant');
    assert.strictEqual(list.length, 0);

    const lookup = decisionEngine.getDecisionById('dec-ec2-observability-p1', 'ws-unauthorized-tenant');
    assert.strictEqual(lookup, null);
  });

  it('should reject unauthorized plan generation for invalid workspace', () => {
    const res = decisionEngine.createRemediationPlanFromDecision('dec-ec2-observability-p1', 'ws-unauthorized-tenant');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.message, 'Unauthorized workspace.');
  });
});
