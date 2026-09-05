import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GovernanceEngine } from '../src/services/governance-engine.js';

describe('CLOUDPULSE Phase 13 Zero-Trust Security, Identity Governance & Policy-as-Code Engine', () => {
  const governanceEngine = GovernanceEngine.getInstance();

  it('should generate governance summary metrics with accurate privileged counts and compliance score', () => {
    const summary = governanceEngine.getSummary();
    assert.ok(summary.totalIdentitiesCount >= 3);
    assert.ok(summary.privilegedIdentitiesCount >= 1);
    assert.ok(summary.overallComplianceScore >= 70 && summary.overallComplianceScore <= 100);
    assert.ok(summary.averageIdentityRiskScore > 0);
  });

  it('should maintain structured identity catalog with risk scoring and permission tracking', () => {
    const identities = governanceEngine.getIdentities();
    assert.ok(identities.length >= 3);

    const admin = identities.find((i) => i.name === 'platform-admin');
    assert.ok(admin);
    assert.strictEqual(admin.isPrivileged, true);
    assert.ok(admin.riskScore > 50);

    const paymentSa = identities.find((i) => i.name === 'payment-service-sa');
    assert.ok(paymentSa);
    assert.strictEqual(paymentSa.isPrivileged, false);
    assert.strictEqual(paymentSa.type, 'workload');
  });

  it('should perform least privilege analysis detecting excessive permissions and generating recommendations', () => {
    const analysis = governanceEngine.getLeastPrivilegeAnalysis();
    assert.ok(analysis.length >= 3);

    const staleCi = analysis.find((a) => a.identityName === 'legacy-ci-bot');
    assert.ok(staleCi);
    assert.strictEqual(staleCi.riskLevel, 'critical');
    assert.ok(staleCi.excessivePermissionsRatio > 0.7);
    assert.ok(staleCi.recommendation.includes('Downscope'));
  });

  it('should simulate policy evaluation adhering to Zero-Trust rules (Deny on wildcard, Allow on scoped)', () => {
    // Wildcard request by non-breakglass -> DENY
    const denyResult = governanceEngine.simulatePolicy({
      identityId: 'id-legacy-ci',
      resourceId: 'arn:aws:s3:::cloudpulse-prod-data',
      action: 's3:*'
    });
    assert.strictEqual(denyResult.decision, 'DENY');
    assert.ok(denyResult.matchedPolicyId === 'pol-no-wildcard-iam');

    // Scoped request -> ALLOW
    const allowResult = governanceEngine.simulatePolicy({
      identityId: 'id-svc-payment',
      resourceId: 'k8s:secret/payment-sandbox-creds',
      action: 'secrets:get'
    });
    assert.strictEqual(allowResult.decision, 'ALLOW');
    assert.ok(allowResult.evidence.length >= 1);
  });

  it('should manage access review workflows with human operator decision gates', () => {
    const reviews = governanceEngine.getAccessReviews();
    assert.ok(reviews.length >= 1);

    const review = reviews.find((r) => r.reviewStatus === 'review_required');
    assert.ok(review);

    const updated = governanceEngine.updateAccessReviewDecision(review.id, 'revoked', 'sec-officer@cloudpulse.local');
    assert.strictEqual(updated.reviewStatus, 'revoked');
    assert.strictEqual(updated.reviewer, 'sec-officer@cloudpulse.local');
  });

  it('should handle just-in-time (JIT) access requests with time-bound expiry and admin approval', () => {
    const req = governanceEngine.createAccessRequest(
      'engineer-bob@cloudpulse.local',
      'k8s-pod:order-service-99x',
      'pod-exec',
      'Emergency investigation of saga deadlock',
      60
    );
    assert.ok(req.id);
    assert.strictEqual(req.status, 'pending');
    assert.ok(req.expiresAt);

    const approved = governanceEngine.approveAccessRequest(req.id, 'admin@cloudpulse.local');
    assert.strictEqual(approved.status, 'approved');
    assert.strictEqual(approved.approver, 'admin@cloudpulse.local');
  });

  it('should map security controls to CIS AWS, NIST 800-53, and ISO 27001 frameworks', () => {
    const controls = governanceEngine.getComplianceControls();
    assert.ok(controls.length >= 3);
    assert.ok(controls.some((c) => c.framework === 'CIS_AWS'));
    assert.ok(controls.some((c) => c.framework === 'NIST_800_53'));
  });

  it('should generate Governance Platform summary with compliance score, risk scores, and evidence freshness', () => {
    const summary = governanceEngine.getPlatformSummary();
    assert.ok(summary.overallComplianceScore >= 80);
    assert.ok(summary.governanceRiskScore.overall <= 25);
    assert.ok(summary.activePoliciesCount >= 4);
    assert.ok(summary.evidenceFreshnessPercent >= 90);
  });

  it('should maintain structured Governance Policy-as-Code catalog with versioning and categories', () => {
    const policies = governanceEngine.getGovernancePolicies();
    assert.ok(policies.length >= 4);
    assert.ok(policies.some((p) => p.category === 'IDENTITY'));
    assert.ok(policies.some((p) => p.category === 'RESOURCE_OWNERSHIP'));
    assert.ok(policies.some((p) => p.category === 'KUBERNETES'));
    assert.ok(policies.some((p) => p.category === 'RESILIENCE'));
    assert.ok(policies.every((p) => p.status === 'active'));
  });

  it('should audit compliance evidence with freshness tracking and configuration references', () => {
    const evidence = governanceEngine.getComplianceEvidence();
    assert.ok(evidence.length >= 2);
    assert.ok(evidence.every((e) => e.freshness === 'fresh'));
    assert.ok(evidence.some((e) => e.source.includes('AWS IAM')));
  });

  it('should manage compliance findings and link to remediation actions requiring approval', () => {
    const findings = governanceEngine.getComplianceFindings();
    assert.ok(findings.length >= 1);
    const finding = findings[0];
    assert.strictEqual(finding.status, 'remediation_planned');

    const remediations = governanceEngine.getRemediationActions();
    assert.ok(remediations.length >= 1);
    const rem = remediations[0];
    assert.strictEqual(rem.status, 'pending_approval');
    assert.strictEqual(rem.approval.required, true);

    const approved = governanceEngine.approveRemediationAction(rem.id, 'security-officer@cloudpulse.internal');
    assert.strictEqual(approved.status, 'approved');
    assert.strictEqual(approved.approval.approver, 'security-officer@cloudpulse.internal');
  });

  it('should manage time-bound policy exceptions with expiration dates and justifications', () => {
    const exceptions = governanceEngine.getPolicyExceptions();
    assert.ok(exceptions.length >= 1);
    const exc = exceptions[0];
    assert.strictEqual(exc.status, 'active');
    assert.ok(exc.reason.length > 0);
    assert.ok(exc.expiresAt);
  });

  it('should execute continuous compliance scans on demand and record completed scan results', () => {
    const initialCount = governanceEngine.getComplianceScans().length;
    const scan = governanceEngine.triggerComplianceScan('all');
    assert.ok(scan.id);
    assert.strictEqual(scan.status, 'completed');
    assert.ok(scan.resourcesCount > 0);
    assert.strictEqual(governanceEngine.getComplianceScans().length, initialCount + 1);
  });

  it('should maintain comprehensive compliance framework mappings (CIS AWS, CIS K8s, NIST, ISO)', () => {
    const frameworks = governanceEngine.getComplianceFrameworks();
    assert.ok(frameworks.length >= 4);
    assert.ok(frameworks.some((f) => f.id === 'framework-cis-aws'));
    assert.ok(frameworks.some((f) => f.id === 'framework-cis-k8s'));
    assert.ok(frameworks.some((f) => f.id === 'framework-nist-800-53'));
    assert.ok(frameworks.some((f) => f.id === 'framework-iso-27001'));
  });
});

