import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EnterpriseGovernanceEngine } from '../src/services/enterprise-governance-engine.js';

describe('CLOUDPULSE Phase 25 Enterprise Cloud Governance & Policy-as-Code Engine', () => {
  const gov = EnterpriseGovernanceEngine.getInstance();

  it('should return Governance Command summary with truthful compliance and governance scores', () => {
    const summary = gov.getSummary();
    assert.strictEqual(typeof summary.governanceScore, 'number');
    assert.strictEqual(typeof summary.compliancePercent, 'number');
    assert.strictEqual(summary.totalResourcesCount, 6);
    assert.strictEqual(summary.compliantResourcesCount, 5);
    assert.strictEqual(summary.nonCompliantResourcesCount, 1);
    assert.strictEqual(summary.criticalViolationsCount, 0);
    assert.strictEqual(summary.policyCoveragePercent, 100.0);
    assert.ok(summary.governanceScore >= 95.0, 'Governance score should meet baseline');
  });

  it('should list versioned policies with categories, severities, and deterministic rules', () => {
    const policies = gov.getPolicies();
    assert.strictEqual(policies.length, 4, 'Must track all 4 primary governance policies');

    const tagPol = policies.find((p) => p.id === 'pol-mandatory-tags');
    assert.ok(tagPol, 'Mandatory tags policy must exist');
    assert.strictEqual(tagPol.category, 'COST');
    assert.strictEqual(tagPol.status, 'ACTIVE');
    assert.strictEqual(tagPol.severity, 'HIGH');
    assert.ok(tagPol.rule.includes('tags.owner'));
  });

  it('should maintain unified multi-cloud resource inventory with ownership and tags', () => {
    const resources = gov.getResources();
    assert.strictEqual(resources.length, 6, 'Must contain 6 baseline multi-cloud resources');

    const k8sResources = gov.getResources('kubernetes');
    assert.strictEqual(k8sResources.length, 3, 'Must have 3 Kubernetes resources');

    const rdsRes = resources.find((r) => r.resource.includes('rds'));
    assert.ok(rdsRes, 'RDS resource must exist');
    assert.strictEqual(rdsRes.provider, 'aws');
    assert.strictEqual(rdsRes.costCenter, 'CC-BACKEND-202');
  });

  it('should record continuous policy evaluations with evidence, observed, and expected values', () => {
    const evaluations = gov.getEvaluations();
    assert.ok(evaluations.length >= 4, 'Must record policy evaluations');

    const signedEval = evaluations.find((e) => e.policyId === 'pol-signed-images');
    assert.ok(signedEval, 'Signed images evaluation must exist');
    assert.strictEqual(signedEval.result, 'PASS');
    assert.strictEqual(signedEval.severity, 'CRITICAL');
    assert.ok(signedEval.evidence.includes('Cosign signature'));
  });

  it('should manage governance violations with severity and suppression status', () => {
    const violations = gov.getViolations();
    assert.ok(violations.length >= 1, 'Should record detected violations');

    const viol1 = violations[0];
    assert.strictEqual(viol1.resourceId, 'res-ebs-qa');
    assert.strictEqual(viol1.status, 'SUPPRESSED');
    assert.strictEqual(viol1.exceptionId, 'exc-001');
  });

  it('should manage time-bounded policy exceptions with approval and expiration tracking', () => {
    const exceptions = gov.getExceptions();
    assert.strictEqual(exceptions.length, 1, 'Must track active policy exceptions');

    const exc1 = exceptions[0];
    assert.strictEqual(exc1.status, 'APPROVED');
    assert.strictEqual(exc1.approvedBy, 'Compliance Officer');
    assert.ok(exc1.expiresAt.startsWith('2026-09'), 'Must have future expiration date');
  });

  it('should allow requesting and approving new policy exceptions', () => {
    const newException = gov.requestException({
      policyId: 'pol-nonroot-containers',
      resourceId: 'res-custom-01',
      reason: 'Legacy diagnostic container requiring root for network packet capture.',
      owner: 'SecOps Team',
      approvedBy: 'CISO',
      expiresAt: '2026-10-01T00:00:00Z',
      scope: 'resource:k8s-pod/diag-01'
    });

    assert.ok(newException.id.startsWith('exc-'));
    assert.strictEqual(newException.status, 'APPROVED');

    const allExceptions = gov.getExceptions();
    assert.strictEqual(allExceptions.length, 2);
  });

  it('should orchestrate assisted remediation workflows and update status to RESOLVED', () => {
    const remediations = gov.getRemediations();
    assert.ok(remediations.length >= 1, 'Must maintain remediation workflows');

    const rem = remediations[0];
    assert.strictEqual(rem.mode, 'ASSISTED');

    const executed = gov.executeRemediation(rem.id, 'sre-lead');
    assert.strictEqual(executed.status, 'SUCCESS');
    assert.strictEqual(executed.currentStage, 'CLOSE');
  });

  it('should export compliance evidence records with cryptographic hashes and sources', () => {
    const evidence = gov.getEvidence();
    assert.ok(evidence.length >= 1, 'Must maintain compliance evidence records');

    const ev1 = evidence[0];
    assert.strictEqual(ev1.result, 'PASS');
    assert.ok(ev1.observedConfig.digest.startsWith('sha256:'));
    assert.ok(ev1.source.includes('Kubernetes Admission Controller'));
  });

  it('should map governance policies to industry compliance frameworks (SOC 2, ISO 27001, CIS)', () => {
    const frameworks = gov.getFrameworkMappings();
    assert.strictEqual(frameworks.length, 3, 'Must support SOC2, ISO27001, and CIS benchmarks');

    const soc2 = frameworks.find((f) => f.framework.includes('SOC 2'));
    assert.ok(soc2, 'SOC 2 mapping must exist');
    assert.strictEqual(soc2.coveragePercent, 100.0);
    assert.strictEqual(soc2.failingCount, 0);
  });
});
