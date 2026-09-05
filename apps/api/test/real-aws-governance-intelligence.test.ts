import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsGovernanceIntelligenceEngine } from '../src/services/aws-governance-intelligence-engine.js';

describe('CLOUDPULSE Phase 56 Real AWS Governance Intelligence Center & Control Optimization', () => {
  const intelEngine = AwsGovernanceIntelligenceEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should return accurate governance intelligence summary with 88% health score and high confidence', () => {
    const summary = intelEngine.getGovernanceIntelligenceSummary(validWorkspace);
    assert.ok(summary);
    assert.strictEqual(summary.overallGovernanceHealthScore, 88);
    assert.strictEqual(summary.evidenceConfidence, 'HIGH');
    assert.strictEqual(summary.activeControlsCount >= 4, true);
    assert.strictEqual(summary.criticalRisksCount >= 1, true);
    assert.strictEqual(summary.automationOpportunitiesCount >= 2, true);
    assert.strictEqual(summary.meanTimeToRemediationSeconds, 40);
    assert.strictEqual(summary.remediationSuccessRate, 100);
    assert.strictEqual(summary.provenance, 'CALCULATED');
  });

  it('should retrieve continuous control health matrix across security, observability, and compliance', () => {
    const controls = intelEngine.getControlHealth(validWorkspace);
    assert.strictEqual(controls.length, 4);

    const s3Ctrl = controls.find((c) => c.controlId === 'ctrl-s3-public-shield');
    assert.ok(s3Ctrl);
    assert.strictEqual(s3Ctrl.status, 'HEALTHY');
    assert.strictEqual(s3Ctrl.complianceRate, 100);
    assert.strictEqual(s3Ctrl.driftRate, 0);
    assert.strictEqual(s3Ctrl.evidenceConfidence, 'HIGH');

    const ec2Ctrl = controls.find((c) => c.controlId === 'ctrl-ec2-detailed-monitoring');
    assert.ok(ec2Ctrl);
    assert.strictEqual(ec2Ctrl.status, 'DEGRADED');
    assert.strictEqual(ec2Ctrl.complianceRate, 75);
    assert.strictEqual(ec2Ctrl.driftRate, 25);
    assert.strictEqual(ec2Ctrl.automationEligibility, 'SAFE_AUTOMATION_CANDIDATE');
  });

  it('should return prioritized governance risks (P1 to P4) with blast radius and remediation guidance', () => {
    const risks = intelEngine.getRisks(validWorkspace);
    assert.ok(risks.length >= 2);

    const p1 = risks.find((r) => r.priority === 'P1');
    assert.ok(p1);
    assert.ok(p1.title.includes('Detailed Telemetry'));
    assert.strictEqual(p1.category, 'OBSERVABILITY');
    assert.ok(p1.blastRadius.includes('Low risk'));
    assert.strictEqual(p1.remediationDifficulty, 'EASY');
    assert.strictEqual(p1.evidenceConfidence, 'HIGH');
  });

  it('should evaluate policy effectiveness with violation counts and conflict detection', () => {
    const policies = intelEngine.getPolicyEffectiveness(validWorkspace);
    assert.ok(policies.length >= 3);

    const s3Pol = policies.find((p) => p.policyId === 'pol-aws-s3-public-block');
    assert.ok(s3Pol);
    assert.strictEqual(s3Pol.effectivenessRating, 'EFFECTIVE');
    assert.strictEqual(s3Pol.policyConflictDetected, false);
    assert.strictEqual(s3Pol.remediationSuccessRate, 100);
  });

  it('should audit multi-service evidence coverage across accounts and regions', () => {
    const coverage = intelEngine.getEvidenceCoverage(validWorkspace);
    assert.ok(coverage.length >= 4);

    const s3Cov = coverage.find((c) => c.service === 'Amazon S3');
    assert.ok(s3Cov);
    assert.strictEqual(s3Cov.coverageLevel, 'HIGH');
    assert.ok(s3Cov.evidenceSources.includes('AWS CloudTrail'));

    const drCov = coverage.find((c) => c.region === 'eu-west-1');
    assert.ok(drCov);
    assert.strictEqual(drCov.coverageLevel, 'MEDIUM');
    assert.ok(drCov.reasonForLowCoverage);
  });

  it('should identify safe automation opportunities with reversibility and safety scores', () => {
    const opps = intelEngine.getAutomationOpportunities(validWorkspace);
    assert.ok(opps.length >= 2);

    const ec2Opp = opps.find((o) => o.id === 'opp-ec2-monitoring');
    assert.ok(ec2Opp);
    assert.strictEqual(ec2Opp.eligibility, 'SAFE_AUTOMATION_CANDIDATE');
    assert.strictEqual(ec2Opp.safetyScore, 'SAFE');
    assert.strictEqual(ec2Opp.reversibility, true);
    assert.strictEqual(ec2Opp.requiresHumanApproval, false);

    const s3Opp = opps.find((o) => o.id === 'opp-s3-public-block');
    assert.ok(s3Opp);
    assert.strictEqual(s3Opp.eligibility, 'APPROVAL_REQUIRED');
    assert.strictEqual(s3Opp.requiresHumanApproval, true);
  });

  it('should retrieve ranked actionable recommendations', () => {
    const recs = intelEngine.getRecommendations(validWorkspace);
    assert.ok(recs.length >= 2);

    const r1 = recs.find((r) => r.id === 'rec-ec2-auto-heal');
    assert.ok(r1);
    assert.strictEqual(r1.priority, 'P1');
    assert.strictEqual(r1.status, 'NEW');
  });

  it('should update recommendation lifecycle status from NEW to ACKNOWLEDGED and RESOLVED', () => {
    const ack = intelEngine.updateRecommendationStatus('rec-ec2-auto-heal', 'ACKNOWLEDGED', validWorkspace);
    assert.ok(ack);
    assert.strictEqual(ack.status, 'ACKNOWLEDGED');

    const res = intelEngine.updateRecommendationStatus('rec-ec2-auto-heal', 'RESOLVED', validWorkspace);
    assert.ok(res);
    assert.strictEqual(res.status, 'RESOLVED');

    // Reset back to NEW for cleanliness
    intelEngine.updateRecommendationStatus('rec-ec2-auto-heal', 'NEW', validWorkspace);
  });

  it('should filter risks and recommendations by priority and status', () => {
    const p1Risks = intelEngine.getRisks(validWorkspace, 'P1');
    assert.strictEqual(p1Risks.length, 1);
    assert.strictEqual(p1Risks[0].priority, 'P1');

    const newRecs = intelEngine.getRecommendations(validWorkspace, 'NEW');
    assert.ok(newRecs.length >= 1);
  });

  it('should strictly enforce tenant isolation preventing cross-workspace intelligence access', () => {
    const summary = intelEngine.getGovernanceIntelligenceSummary('ws-unauthorized-tenant');
    assert.strictEqual(summary.overallGovernanceHealthScore, 0);
    assert.strictEqual(summary.evidenceConfidence, 'LIMITED_COVERAGE');
    assert.strictEqual(summary.controls.length, 0);

    const controls = intelEngine.getControlHealth('ws-unauthorized-tenant');
    assert.strictEqual(controls.length, 0);

    const risks = intelEngine.getRisks('ws-unauthorized-tenant');
    assert.strictEqual(risks.length, 0);

    const recs = intelEngine.getRecommendations('ws-unauthorized-tenant');
    assert.strictEqual(recs.length, 0);

    const update = intelEngine.updateRecommendationStatus('rec-ec2-auto-heal', 'RESOLVED', 'ws-unauthorized-tenant');
    assert.strictEqual(update, null);
  });
});
