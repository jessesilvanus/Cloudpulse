import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CloudComplianceEngine } from '../src/services/cloud-compliance-engine.js';

describe('CLOUDPULSE Phase 37 Cloud Compliance & Policy-as-Code Governance Center', () => {
  const engine = CloudComplianceEngine.getInstance();

  it('should return compliance governance summary with overall score, control counts, and open findings', () => {
    const summary = engine.getSummary();
    assert.strictEqual(summary.overallComplianceScorePercent, 88.5);
    assert.strictEqual(summary.totalEvaluatedControlsCount, 43);
    assert.strictEqual(summary.passingControlsCount, 38);
    assert.ok(summary.openFindingsCount >= 2);
    assert.strictEqual(summary.activeExceptionsCount, 1);
    assert.strictEqual(summary.expiredExceptionsCount, 0);
    assert.strictEqual(summary.frameworkScores['cis-aws-v2.0'], 88.9);
    assert.strictEqual(summary.frameworkScores['nist-sp-800-53'], 92.8);
  });

  it('should list compliance frameworks (CIS, NIST, SOC2) with support levels and passing percentages', () => {
    const frameworks = engine.getFrameworks();
    assert.strictEqual(frameworks.length, 3);

    const cis = frameworks.find((f) => f.frameworkId === 'cis-aws-v2.0');
    assert.ok(cis);
    assert.strictEqual(cis.category, 'CIS');
    assert.strictEqual(cis.supportLevel, 'SUPPORTED');
    assert.strictEqual(cis.passingControlsCount, 16);

    const soc2 = frameworks.find((f) => f.frameworkId === 'soc2-type-2');
    assert.ok(soc2);
    assert.strictEqual(soc2.supportLevel, 'PARTIALLY_SUPPORTED');
  });

  it('should query controls by framework and domain with severity and ownership', () => {
    const iamControls = engine.getControls('cis-aws-v2.0', 'IAM');
    assert.strictEqual(iamControls.length, 1);
    assert.strictEqual(iamControls[0]?.controlId, 'CIS-AWS-1.16');
    assert.strictEqual(iamControls[0]?.severity, 'CRITICAL');
    assert.strictEqual(iamControls[0]?.status, 'COMPLIANT');

    const encControls = engine.getControls('nist-sp-800-53', 'ENCRYPTION');
    assert.strictEqual(encControls.length, 1);
    assert.strictEqual(encControls[0]?.controlId, 'NIST-SC-28');
    assert.strictEqual(encControls[0]?.status, 'NON_COMPLIANT');
  });

  it('should list governance policies with enforcement modes (BLOCKING, AUDIT)', () => {
    const policies = engine.getPolicies();
    assert.strictEqual(policies.length, 3);

    const kmsPolicy = policies.find((p) => p.policyId === 'pol-mandatory-kms-encryption');
    assert.ok(kmsPolicy);
    assert.strictEqual(kmsPolicy.enforcementMode, 'BLOCKING');
    assert.strictEqual(kmsPolicy.domain, 'ENCRYPTION');

    const k8sPolicy = policies.find((p) => p.policyId === 'pol-k8s-non-root');
    assert.ok(k8sPolicy);
    assert.strictEqual(k8sPolicy.enforcementMode, 'AUDIT');
  });

  it('should evaluate policy against compliant resource and return PASS', () => {
    const res = engine.evaluatePolicy('pol-mandatory-kms-encryption', {
      id: 'vol-prod-ebs-01',
      encryption: { enabled: true, kmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/cmk-01' }
    });

    assert.strictEqual(res.status, 'PASS');
    assert.strictEqual(res.policyId, 'pol-mandatory-kms-encryption');
    assert.ok(res.details.includes('satisfies'));
  });

  it('should evaluate policy against non-compliant resource and return FAIL (BLOCKING mode)', () => {
    const res = engine.evaluatePolicy('pol-mandatory-kms-encryption', {
      id: 'snap-unencrypted-02',
      encryption: { enabled: false, kmsKeyId: null }
    });

    assert.strictEqual(res.status, 'FAIL');
    assert.strictEqual(res.enforcementMode, 'BLOCKING');
    assert.ok(res.details.includes('Missing KMS'));
  });

  it('should query compliance findings with severity and status filtering', () => {
    const findings = engine.getFindings('HIGH', 'OPEN');
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0]?.findingId, 'find-enc-rds-unencrypted-backup');
    assert.strictEqual(findings[0]?.controlId, 'NIST-SC-28');
  });

  it('should construct structured evidence chain for a finding (Control -> Policy -> Resource -> Evidence -> Remediation)', () => {
    const chain = engine.getEvidenceChain('find-enc-rds-unencrypted-backup');
    assert.strictEqual(chain.findingId, 'find-enc-rds-unencrypted-backup');
    assert.strictEqual(chain.framework, 'nist-sp-800-53');
    assert.strictEqual(chain.evidenceChain.length, 5);
    assert.strictEqual(chain.evidenceChain[0]?.step, '1. Control Requirement');
    assert.strictEqual(chain.evidenceChain[4]?.step, '5. Remediation Protocol');
  });

  it('should track policy exceptions with expiration dates and compensating controls', () => {
    const exceptions = engine.getExceptions();
    assert.strictEqual(exceptions.length, 1);
    assert.strictEqual(exceptions[0]?.exceptionId, 'exc-legacy-auth-bypass-01');
    assert.strictEqual(exceptions[0]?.policyId, 'pol-iam-mfa-required');
    assert.strictEqual(exceptions[0]?.isExpired, false);
    assert.ok(exceptions[0]?.compensatingControl.includes('10.0.128.0/24'));
  });

  it('should create new policy exception with approval and expiration', () => {
    const newExc = engine.createException({
      policyId: 'pol-k8s-non-root',
      resourceId: 'k8s:deployment:legacy-monitoring/daemon',
      scope: 'Legacy Monitoring Daemon',
      reason: 'Requires raw socket access for kernel tracing until v2 migration.',
      requester: 'sre-lead@enterprise.io',
      approver: 'ciso-office@enterprise.io',
      expiresAt: '2026-10-31T00:00:00Z',
      compensatingControl: 'Restricted read-only hostPath mount.'
    });

    assert.strictEqual(newExc.isExpired, false);
    assert.ok(newExc.exceptionId.startsWith('exc-'));
    assert.strictEqual(engine.getExceptions().length, 2);
  });

  it('should execute automated remediation and verify finding resolution', () => {
    const res = engine.remediateFinding('find-enc-rds-unencrypted-backup');
    assert.strictEqual(res.status, 'REMEDIATED');
    assert.strictEqual(res.verificationStatus, 'VERIFIED');
    assert.ok(res.executedAction.includes('pol-mandatory-kms-encryption'));

    const updatedFinding = engine.getFindings().find((f) => f.findingId === 'find-enc-rds-unencrypted-backup');
    assert.strictEqual(updatedFinding?.status, 'REMEDIATED');
    assert.strictEqual(updatedFinding?.verificationStatus, 'VERIFIED');
  });

  it('should simulate policy impact when changing enforcement mode to BLOCKING', () => {
    const sim = engine.simulatePolicyImpact('pol-k8s-non-root', 'BLOCKING');
    assert.strictEqual(sim.policyId, 'pol-k8s-non-root');
    assert.strictEqual(sim.currentEnforcementMode, 'AUDIT');
    assert.strictEqual(sim.simulatedEnforcementMode, 'BLOCKING');
    assert.strictEqual(sim.complianceScoreImpactPercent, 4.2);
  });

  it('should answer natural language compliance queries with grounded evidence citations', () => {
    const res = engine.queryComplianceAssistant('What is our current compliance posture across CIS and NIST frameworks?');
    assert.strictEqual(res.status, 'OBSERVED');
    assert.ok(res.evidence.length >= 3);
    assert.ok(res.recommendation.includes('re-encrypt snapshot'));
  });
});
