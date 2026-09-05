import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsGovernanceEngine } from '../src/services/aws-governance-engine.js';

describe('CLOUDPULSE Phase 51 Real AWS Automated Cloud Governance & Policy Enforcement Engine', () => {
  const governanceEngine = AwsGovernanceEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should calculate accurate overall compliance score and category breakdown', () => {
    const summary = governanceEngine.getGovernanceSummary(validWorkspace);
    assert.ok(summary);
    assert.strictEqual(summary.overallComplianceScore, 75.0);
    assert.strictEqual(summary.totalPoliciesEvaluated, 4);
    assert.strictEqual(summary.passingEvaluationsCount, 3);
    assert.strictEqual(summary.failingEvaluationsCount, 1);
    assert.strictEqual(summary.openFindingsCount, 1);
    assert.strictEqual(summary.activeExemptionsCount, 1);
    assert.strictEqual(summary.categoryScores.SECURITY, 100.0);
    assert.strictEqual(summary.categoryScores.NETWORK, 100.0);
    assert.strictEqual(summary.categoryScores.IAM, 100.0);
    assert.strictEqual(summary.provenance, 'CALCULATED');
  });

  it('should retrieve active governance policies with rule definitions and remediation guidance', () => {
    const policies = governanceEngine.getPolicies(validWorkspace);
    assert.strictEqual(policies.length, 4);

    const s3Policy = policies.find((p) => p.id === 'pol-aws-s3-public-block');
    assert.ok(s3Policy);
    assert.strictEqual(s3Policy.category, 'SECURITY');
    assert.strictEqual(s3Policy.severity, 'CRITICAL');
    assert.strictEqual(s3Policy.status, 'ACTIVE');
    assert.ok(s3Policy.remediationGuidance.includes('put-public-access-block'));
  });

  it('should evaluate S3 public access block policy against live bucket resources', () => {
    const evaluations = governanceEngine.getEvaluations(validWorkspace, { policyId: 'pol-aws-s3-public-block' });
    assert.strictEqual(evaluations.length, 1);

    const evalS3 = evaluations[0];
    assert.strictEqual(evalS3.result, 'PASS');
    assert.strictEqual(evalS3.resourceId, 'cloudpulse-production-audit-logs-2026');
    assert.ok(evalS3.evidence.length >= 2);
    assert.strictEqual(evalS3.provenance, 'LIVE');
  });

  it('should evaluate Security Group restricted port policy against ingress rules', () => {
    const evaluations = governanceEngine.getEvaluations(validWorkspace, { policyId: 'pol-aws-sg-ssh-restricted' });
    assert.strictEqual(evaluations.length, 1);

    const evalSg = evaluations[0];
    assert.strictEqual(evalSg.result, 'PASS');
    assert.strictEqual(evalSg.resourceId, 'sg-0a817f938c11e74a2');
    assert.ok(evalSg.evidence.some((e) => e.includes('Port 22 restricted strictly')));
  });

  it('should evaluate IAM MFA enforcement policy against console user identities', () => {
    const evaluations = governanceEngine.getEvaluations(validWorkspace, { policyId: 'pol-aws-iam-mfa-enforced' });
    assert.strictEqual(evaluations.length, 1);

    const evalIam = evaluations[0];
    assert.strictEqual(evalIam.result, 'PASS');
    assert.strictEqual(evalIam.resourceName, 'admin-jesse');
    assert.ok(evalIam.evidence.some((e) => e.includes('Virtual MFADevice')));
  });

  it('should evaluate EC2 monitoring policy and record failing finding with remediation blueprint', () => {
    const evaluations = governanceEngine.getEvaluations(validWorkspace, { policyId: 'pol-aws-ec2-monitoring-enabled' });
    assert.strictEqual(evaluations.length, 1);

    const evalEc2 = evaluations[0];
    assert.strictEqual(evalEc2.result, 'FAIL');
    assert.strictEqual(evalEc2.resourceId, 'i-078a1bc49281e7f02');

    const findings = governanceEngine.getFindings(validWorkspace, { status: 'OPEN' });
    assert.strictEqual(findings.length, 1);

    const find = findings[0];
    assert.strictEqual(find.id, 'gov-find-ec2-01');
    assert.strictEqual(find.severity, 'MEDIUM');
    assert.strictEqual(find.recommendedRemediation.risk, 'LOW');
    assert.ok(find.recommendedRemediation.action.includes('Enable detailed monitoring'));
  });

  it('should simulate dry-run policy evaluation against live resources without modifying infrastructure', () => {
    const dryRun = governanceEngine.dryRunPolicy(validWorkspace, {
      resourceType: 'AWS::S3::Bucket',
      condition: 'publicAccessBlock.blockPublicAcls == true',
    });
    assert.ok(dryRun);
    assert.strictEqual(dryRun.evaluatedResourcesCount, 4);
    assert.strictEqual(dryRun.expectedPass, 3);
    assert.strictEqual(dryRun.expectedFail, 1);
    assert.strictEqual(dryRun.simulationResult, 'COMPLIANT');
    assert.strictEqual(dryRun.provenance, 'CALCULATED');
  });

  it('should create governed policy exemption with expiration timestamp', () => {
    const exemption = governanceEngine.createExemption(validWorkspace, {
      policyId: 'pol-aws-sg-ssh-restricted',
      resourceId: 'sg-test-temp-01',
      reason: 'Temporary pentest bastion port opening',
      approvedBy: 'security-lead@cloudpulse.io',
      durationDays: 7,
    });
    assert.ok(exemption.id.startsWith('exm-'));
    assert.strictEqual(exemption.status, 'ACTIVE');
    assert.ok(new Date(exemption.expiresAt).getTime() > Date.now());
  });

  it('should transition finding lifecycle status from OPEN to ACKNOWLEDGED', () => {
    const updated = governanceEngine.updateFindingStatus('gov-find-ec2-01', 'ACKNOWLEDGED', validWorkspace);
    assert.ok(updated);
    assert.strictEqual(updated.status, 'ACKNOWLEDGED');

    // Revert back to OPEN for consistency
    governanceEngine.updateFindingStatus('gov-find-ec2-01', 'OPEN', validWorkspace);
  });

  it('should strictly enforce tenant isolation preventing cross-workspace governance data access', () => {
    const policies = governanceEngine.getPolicies('ws-unauthorized-tenant');
    assert.strictEqual(policies.length, 0, 'Cross-workspace policies query must return 0');

    const summary = governanceEngine.getGovernanceSummary('ws-unauthorized-tenant');
    assert.strictEqual(summary.overallComplianceScore, 0);
    assert.strictEqual(summary.totalPoliciesEvaluated, 0);

    const lookup = governanceEngine.getPolicyById('pol-aws-s3-public-block', 'ws-unauthorized-tenant');
    assert.strictEqual(lookup, null, 'Cross-workspace policy lookup must return null');
  });
});
