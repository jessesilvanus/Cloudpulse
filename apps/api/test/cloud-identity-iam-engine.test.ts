import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CloudIdentityIamEngine } from '../src/services/cloud-identity-iam-engine.js';

describe('CLOUDPULSE Phase 34 Cloud Identity, IAM & Zero-Trust Security Control Plane', () => {
  const engine = CloudIdentityIamEngine.getInstance();

  it('should return Cloud Identity summary with MFA compliance and least privilege scores', () => {
    const summary = engine.getSummary();
    assert.strictEqual(summary.totalIdentitiesCount, 8);
    assert.strictEqual(summary.humanIdentitiesCount, 3);
    assert.strictEqual(summary.serviceIdentitiesCount, 3);
    assert.strictEqual(summary.workloadIdentitiesCount, 2);
    assert.strictEqual(summary.privilegedIdentitiesCount, 5);
    assert.strictEqual(summary.mfaCompliancePercent, 100.0);
    assert.strictEqual(summary.leastPrivilegeScore, 94.2);
  });

  it('should list identities across HUMAN, SERVICE, and WORKLOAD types with providers', () => {
    const identities = engine.getIdentities();
    assert.strictEqual(identities.length, 8);

    const alice = identities.find((i) => i.identityId === 'id-human-alice');
    assert.ok(alice);
    assert.strictEqual(alice.type, 'HUMAN');
    assert.strictEqual(alice.mfaStatus, 'ENABLED');
    assert.strictEqual(alice.privilegeLevel, 'DEVELOPER');

    const svcGateway = identities.find((i) => i.identityId === 'id-svc-api-gw');
    assert.ok(svcGateway);
    assert.strictEqual(svcGateway.type, 'SERVICE');
    assert.strictEqual(svcGateway.authenticationMethod, 'CERTIFICATE');

    const k8sSa = identities.find((i) => i.identityId === 'id-wkld-order-sa');
    assert.ok(k8sSa);
    assert.strictEqual(k8sSa.type, 'WORKLOAD');
    assert.strictEqual(k8sSa.provider, 'kubernetes');
  });

  it('should retrieve specific identity by ID with privilege level and authentication method', () => {
    const charlie = engine.getIdentityById('id-human-charlie');
    assert.ok(charlie);
    assert.strictEqual(charlie.privilegeLevel, 'ADMIN');
    assert.strictEqual(charlie.risk, 'HIGH');
    assert.strictEqual(charlie.authenticationMethod, 'SAML');
  });

  it('should query IAM roles and detect wildcard permissions on Admin role', () => {
    const roles = engine.getRoles();
    assert.ok(roles.length >= 3);

    const adminRole = roles.find((r) => r.roleId === 'role-admin');
    assert.ok(adminRole);
    assert.strictEqual(adminRole.hasWildcard, true);
    assert.ok(adminRole.riskScore >= 90.0);

    const devRole = roles.find((r) => r.roleId === 'role-developer');
    assert.ok(devRole);
    assert.strictEqual(devRole.hasWildcard, false);
  });

  it('should evaluate policy engine and enforce explicit DENY on production database deletion', () => {
    const evalResult = engine.evaluateAccess('alice.chen@enterprise.io', 'rds:DeleteDBInstance', 'arn:aws:rds:us-east-1:123456789012:db/order-db-primary');
    assert.strictEqual(evalResult.decision, 'DENY');
    assert.strictEqual(evalResult.riskLevel, 'CRITICAL');
    assert.ok(evalResult.matchedPolicies.includes('DenyProductionDatabaseDeletion'));
    assert.ok(evalResult.denialReason?.includes('Explicit DENY'));
  });

  it('should allow read telemetry actions for developer identities', () => {
    const evalResult = engine.evaluateAccess('alice.chen@enterprise.io', 'metrics:get', 'telemetry/api-gateway');
    assert.strictEqual(evalResult.decision, 'ALLOW');
    assert.strictEqual(evalResult.riskLevel, 'LOW');
    assert.ok(evalResult.matchedPolicies.includes('AllowKubernetesReadTelemetry'));
  });

  it('should allow operational actions for operator identities', () => {
    const evalResult = engine.evaluateAccess('bob.operator@enterprise.io', 'k8s:workloads:restart', 'cloudpulse-prod/order-service');
    assert.strictEqual(evalResult.decision, 'ALLOW');
    assert.strictEqual(evalResult.riskLevel, 'LOW');
    assert.ok(evalResult.matchedPolicies.includes('Role-Operator-ExecutionPolicy'));
  });

  it('should manage JIT access request creation and pending queue', () => {
    const req = engine.createAccessRequest({
      requester: 'alice.chen@enterprise.io',
      resource: 'arn:aws:s3:::cloudpulse-audit-logs',
      permission: 's3:GetObject',
      reason: 'Investigating incident postmortem logs.',
      durationMinutes: 45
    });
    assert.strictEqual(req.status, 'PENDING');
    assert.strictEqual(req.durationMinutes, 45);
    assert.ok(req.requestId.startsWith('req-jit-'));
  });

  it('should enforce Separation of Duties on JIT access approval (self-approval prohibited)', () => {
    const pendingRequests = engine.getAccessRequests('PENDING');
    assert.ok(pendingRequests.length > 0);
    const target = pendingRequests[0];

    // Attempt self-approval
    assert.throws(
      () => {
        engine.approveAccessRequest(target.requestId, target.requester);
      },
      /Separation of duties violation: Requester .* cannot self-approve/
    );
  });

  it('should approve JIT access request with calculated expiration timestamp', () => {
    const pendingRequests = engine.getAccessRequests('PENDING');
    assert.ok(pendingRequests.length > 0);
    const target = pendingRequests[0];

    const approved = engine.approveAccessRequest(target.requestId, 'bob.operator@enterprise.io');
    assert.strictEqual(approved.status, 'APPROVED');
    assert.strictEqual(approved.approver, 'bob.operator@enterprise.io');
    assert.ok(approved.expiresAt);
  });

  it('should deny JIT access request with recorded rationale', () => {
    const newReq = engine.createAccessRequest({
      requester: 'external.auditor@partner.io',
      resource: 'arn:aws:secretsmanager:*:*:secret:prod-*',
      permission: 'secretsmanager:GetSecretValue',
      reason: 'Security scan',
      durationMinutes: 15
    });

    const denied = engine.denyAccessRequest(newReq.requestId, 'Secrets access is strictly prohibited via self-service.');
    assert.strictEqual(denied.status, 'DENIED');
    assert.ok(denied.reason.includes('Denial rationale'));
  });

  it('should retrieve least privilege analysis findings with unused permission percentages', () => {
    const findings = engine.getLeastPrivilegeFindings();
    assert.ok(findings.length >= 2);

    const wildcardFinding = findings.find((f) => f.type === 'WILDCARD_PERMISSION');
    assert.ok(wildcardFinding);
    assert.strictEqual(wildcardFinding.severity, 'HIGH');
    assert.ok(wildcardFinding.unusedPermissionsPercent > 0);
  });

  it('should answer natural language IAM queries with grounded evidence citations', () => {
    const res = engine.queryIamAssistant('Who has access to the production database?');
    assert.strictEqual(res.status, 'OBSERVED');
    assert.ok(res.evidence.length >= 3);
    assert.ok(res.recommendation.includes('JIT request'));
  });
});
