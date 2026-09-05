import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsSecurityEngine } from '../src/services/aws-security-engine.js';

describe('CLOUDPULSE Phase 44 Real AWS Security, Audit & Threat Intelligence', () => {
  const securityEngine = AwsSecurityEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should retrieve real AWS security findings with complete evidence citations, actors, and compliance mappings', () => {
    const findings = securityEngine.getFindings(validWorkspace);
    assert.ok(findings.length >= 5, 'Should return at least 5 real AWS security findings');

    const sshFinding = findings.find((f) => f.id === 'sec-aws-01');
    assert.ok(sshFinding, 'Should locate SSH ingress security finding');
    assert.strictEqual(sshFinding.severity, 'HIGH');
    assert.strictEqual(sshFinding.service, 'EC2');
    assert.strictEqual(sshFinding.resourceId, 'sg-cloudpulse-ingress-sec');
    assert.strictEqual(sshFinding.actor, 'sarah.connor (ASSUMED_ROLE)');
    assert.ok(sshFinding.evidence.includes('AuthorizeSecurityGroupIngress'), 'Should cite exact CloudTrail event');
    assert.ok(sshFinding.complianceMappings.length >= 3, 'Should include NIST, CIS, and SOC 2 mappings');
    assert.strictEqual(sshFinding.provenance, 'LIVE');
  });

  it('should calculate transparent security score with coverage percentage and explainable rubric', () => {
    const posture = securityEngine.getPostureSummary(validWorkspace);
    assert.ok(posture, 'Should return security posture summary');
    assert.strictEqual(posture.scoreType, 'CALCULATED');
    assert.strictEqual(posture.calculatedScore, 90); // 100 - 10 (1 HIGH open finding)
    assert.strictEqual(posture.visibilityCoveragePercent, 67); // 4 out of 6 services connected/available
    assert.strictEqual(posture.coverageStatus, 'PARTIAL_SECURITY_VISIBILITY');
    assert.strictEqual(posture.breakdown.dataStorageSecurity, 100.0);
    assert.strictEqual(posture.breakdown.loggingAndAudit, 100.0);
  });

  it('should return accurate AWS native security capability matrix with real status indicators', () => {
    const caps = securityEngine.getCapabilities(validWorkspace);
    assert.ok(caps.length >= 6, 'Should report on at least 6 core AWS security sources');

    const ct = caps.find((c) => c.source === 'AWS CloudTrail');
    assert.ok(ct && ct.status === 'CONNECTED');

    const gd = caps.find((c) => c.source === 'Amazon GuardDuty');
    assert.ok(gd && gd.status === 'NOT_ENABLED');
    assert.ok(gd.reason?.includes('not enabled'), 'Should provide truthful reason for disabled state');

    const insp = caps.find((c) => c.source === 'Amazon Inspector');
    assert.ok(insp && insp.status === 'PERMISSION_REQUIRED');
    assert.ok(insp.reason?.includes('inspector2:ListFindings'), 'Should cite missing permission');
  });

  it('should evaluate explainable IAM privilege escalation risk paths with organizational policy guards', () => {
    const paths = securityEngine.getPrivilegeEscalationPaths(validWorkspace);
    assert.ok(paths.length >= 1, 'Should evaluate privilege escalation path');
    const path = paths[0];
    assert.strictEqual(path.identity, 'CloudPulseReadOnlyRole');
    assert.strictEqual(path.permission, 'iam:AttachRolePolicy');
    assert.strictEqual(path.riskLevel, 'CRITICAL');
    assert.strictEqual(path.provenance, 'CALCULATED');
    assert.ok(path.potentialImpact.includes('AWS Organization SCP'), 'Should cite SCP boundary guard');
  });

  it('should filter security findings by severity, source, status, and search query', () => {
    const criticals = securityEngine.getFindings(validWorkspace, { severity: 'CRITICAL' });
    assert.ok(criticals.every((f) => f.severity === 'CRITICAL'));

    const networkFindings = securityEngine.getFindings(validWorkspace, { source: 'NetworkAnalysis' });
    assert.ok(networkFindings.every((f) => f.source === 'NetworkAnalysis'));

    const searchResults = securityEngine.getFindings(validWorkspace, { search: 'aurora' });
    assert.ok(searchResults.length >= 1);
    assert.ok(searchResults[0].title.toLowerCase().includes('aurora') || searchResults[0].resourceId.includes('aurora'));
  });

  it('should manage finding lifecycle transitions (OPEN -> ACKNOWLEDGED -> RESOLVED)', () => {
    const updated = securityEngine.updateFindingStatus('sec-aws-01', 'ACKNOWLEDGED', 'Triage initiated by security lead', 'admin@cloudpulse.internal', validWorkspace);
    assert.ok(updated);
    assert.strictEqual(updated.status, 'ACKNOWLEDGED');

    const resolved = securityEngine.updateFindingStatus('sec-aws-01', 'RESOLVED', 'Ingress rule restricted to 10.0.0.0/16', 'admin@cloudpulse.internal', validWorkspace);
    assert.ok(resolved);
    assert.strictEqual(resolved.status, 'RESOLVED');

    // Revert for subsequent test idempotency
    securityEngine.updateFindingStatus('sec-aws-01', 'OPEN', 'Reset to OPEN', 'admin@cloudpulse.internal', validWorkspace);
  });

  it('should record security exceptions with owner, justification, and expiration dates', () => {
    const success = securityEngine.createSecurityException('sec-aws-01', 'Approved temporary maintenance window', 'security-architect@cloudpulse.corp', '7d', validWorkspace);
    assert.strictEqual(success, true);

    const finding = securityEngine.getFindingById('sec-aws-01', validWorkspace);
    assert.ok(finding);
    assert.strictEqual(finding.status, 'SUPPRESSED');

    // Reset back to OPEN
    securityEngine.updateFindingStatus('sec-aws-01', 'OPEN', 'Reset', 'admin@cloudpulse.internal', validWorkspace);
  });

  it('should detect high-risk network exposure (unrestricted SSH ingress) and provide IaC remediation', () => {
    const finding = securityEngine.getFindingById('sec-aws-01', validWorkspace);
    assert.ok(finding);
    assert.ok(finding.iacRemediation, 'Should provide Terraform remediation block');
    assert.ok(finding.iacRemediation.includes('cidr_blocks = ["10.0.0.0/16"]'));
    assert.strictEqual(finding.calculatedRisk.level, 'HIGH');
  });

  it('should return truthful NOT_CONNECTED provenance for disconnected workspaces without fake findings', () => {
    const disconnectedWs = 'ws-disconnected-workspace';
    const findings = securityEngine.getFindings(disconnectedWs);
    assert.strictEqual(findings.length, 0, 'Disconnected workspace should return 0 findings');

    const posture = securityEngine.getPostureSummary(disconnectedWs);
    assert.strictEqual(posture.provenance, 'NOT_CONNECTED');
    assert.strictEqual(posture.calculatedScore, 0);
  });

  it('should strictly enforce tenant isolation preventing cross-workspace security finding access', () => {
    const unauthorizedFinding = securityEngine.getFindingById('sec-aws-01', 'ws-unauthorized-tenant');
    assert.strictEqual(unauthorizedFinding, null, 'Unauthorized tenant must not receive finding');
  });
});
