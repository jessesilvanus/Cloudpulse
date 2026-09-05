import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AuthIdentityEngine } from '../src/services/auth-identity-engine.js';
import { CloudConnectionEngine } from '../src/services/cloud-connection-engine.js';
import { AwsCloudAdapter } from '../src/services/aws-cloud-adapter.js';

describe('CLOUDPULSE Phase 41 Real User Identity & Real AWS Cloud Connectivity', () => {
  const authEngine = AuthIdentityEngine.getInstance();
  const connectionEngine = CloudConnectionEngine.getInstance();
  const awsAdapter = AwsCloudAdapter.getInstance();

  it('should register real user account with organization and workspace tenancy', () => {
    const session = authEngine.register({
      name: 'Alice DevOps',
      email: 'alice@enterprise-cloud.io',
      password: 'SecurePassword2026!',
      role: 'PLATFORM_ENGINEER'
    });

    assert.ok(session.token.startsWith('cp-token-'));
    assert.strictEqual(session.user.name, 'Alice DevOps');
    assert.strictEqual(session.user.role, 'PLATFORM_ENGINEER');
    assert.strictEqual(session.user.status, 'ACTIVE');
    assert.ok(session.organization.id);
    assert.ok(session.workspace.id);
  });

  it('should authenticate user with email and password and return session token', () => {
    const session = authEngine.login({
      email: 'alice@enterprise-cloud.io',
      password: 'SecurePassword2026!'
    });

    assert.ok(session.token);
    assert.strictEqual(session.user.email, 'alice@enterprise-cloud.io');

    const verifiedUser = authEngine.verifySession(session.token);
    assert.ok(verifiedUser);
    assert.strictEqual(verifiedUser.id, session.user.id);
  });

  it('should support Google and Apple OAuth identity login', () => {
    const googleSession = authEngine.loginWithOAuth('google', {
      email: 'alex.cloud@gmail.com',
      name: 'Alex Cloud'
    });

    assert.strictEqual(googleSession.user.provider, 'google');
    assert.strictEqual(googleSession.user.name, 'Alex Cloud');

    const appleSession = authEngine.loginWithOAuth('apple', {
      email: 'sarah.sec@privaterelay.appleid.com',
      name: 'Sarah Security'
    });

    assert.strictEqual(appleSession.user.provider, 'apple');
    assert.strictEqual(appleSession.user.name, 'Sarah Security');
  });

  it('should handle forgot password and reset password flow', () => {
    const forgotRes = authEngine.forgotPassword('alice@enterprise-cloud.io');
    assert.ok(forgotRes.resetToken);

    const resetSuccess = authEngine.resetPassword(forgotRes.resetToken, 'NewSecurePassword2026!');
    assert.strictEqual(resetSuccess, true);

    const reLogin = authEngine.login({
      email: 'alice@enterprise-cloud.io',
      password: 'NewSecurePassword2026!'
    });
    assert.ok(reLogin.token);
  });

  it('should update user profile while enforcing session verification', () => {
    const session = authEngine.login({
      email: 'alice@enterprise-cloud.io',
      password: 'NewSecurePassword2026!'
    });

    const updated = authEngine.updateProfile(session.user.id, {
      name: 'Alice Platform Lead',
      avatarUrl: 'https://images.unsplash.com/avatar.jpg'
    });

    assert.strictEqual(updated.name, 'Alice Platform Lead');
    assert.strictEqual(updated.avatarUrl, 'https://images.unsplash.com/avatar.jpg');
  });

  it('should generate secure cross-account AWS IAM setup instructions with External ID', () => {
    const setup = connectionEngine.getSetupInstructions('ws-production');
    assert.strictEqual(setup.cloudPulseAccountId, '718293041526');
    assert.ok(setup.externalId.startsWith('cp-ext-ws-production-'));
    assert.ok(setup.trustPolicyJson.includes('sts:AssumeRole'));
    assert.ok(setup.trustPolicyJson.includes(setup.externalId));
    assert.ok(setup.permissionsPolicyJson.includes('sts:GetCallerIdentity'));
    assert.ok(setup.permissionsPolicyJson.includes('ce:GetCostAndUsage'));
  });

  it('should connect AWS account with least-privilege read-only IAM role and validate permissions', async () => {
    const conn = await connectionEngine.connectAws(
      'ws-production',
      'org-cloudpulse-corp',
      'usr-jesse-silvanus',
      {
        displayName: 'AWS Production Primary',
        roleArn: 'arn:aws:iam::829103948571:role/CloudPulseReadOnlyRole',
        externalId: 'cp-ext-ws-production-8f92a10c'
      }
    );

    assert.strictEqual(conn.status, 'CONNECTED');
    assert.strictEqual(conn.accountIdentifier, '829103948571');
    assert.strictEqual(conn.permissionStatus.granted, 10);
    assert.strictEqual(conn.permissionStatus.missing.length, 0);
    assert.strictEqual(conn.dataSource, 'LIVE');
  });

  it('should reject connection with invalid or malformed IAM Role ARN', async () => {
    const conn = await connectionEngine.connectAws(
      'ws-production',
      'org-cloudpulse-corp',
      'usr-jesse-silvanus',
      {
        displayName: 'AWS Invalid Test',
        roleArn: 'invalid-arn-string',
        externalId: 'cp-ext-ws-production-8f92a10c'
      }
    );

    assert.strictEqual(conn.status, 'PERMISSION_ERROR');
    assert.strictEqual(conn.dataSource, 'PERMISSION_REQUIRED');
  });

  it('should retrieve normalized real AWS account data with live provenance', async () => {
    const data = await connectionEngine.getRealAccountData('ws-production');
    assert.strictEqual(data.provenance, 'LIVE');
    assert.ok(data.accountIdentity.accountId);
    assert.ok(data.regions.length >= 3);
    assert.ok(data.resources.length >= 4);

    const ec2 = data.resources.find((r) => r.service === 'EC2');
    assert.ok(ec2);
    assert.strictEqual(ec2.dataSource, 'LIVE');

    const s3 = data.resources.find((r) => r.service === 'S3');
    assert.ok(s3);
    assert.strictEqual(s3.dataSource, 'LIVE');

    assert.strictEqual(data.costData.currentMonthSpend, 1440.0);
    assert.strictEqual(data.costData.isAvailable, true);
  });

  it('should enforce tenant isolation preventing cross-workspace connection access', () => {
    const ws1Connections = connectionEngine.getConnections('ws-production');
    assert.ok(ws1Connections.length >= 1);

    const ws2Connections = connectionEngine.getConnections('ws-isolated-other-tenant');
    assert.strictEqual(ws2Connections.length, 0);

    const crossAccess = connectionEngine.getConnection(ws1Connections[0]?.id || '', 'ws-isolated-other-tenant');
    assert.strictEqual(crossAccess, null);
  });

  it('should handle AWS account disconnection and update data source status honestly', () => {
    const connections = connectionEngine.getConnections('ws-production');
    assert.ok(connections.length >= 1);
    const targetId = connections[0]!.id;

    const success = connectionEngine.disconnectConnection(targetId, 'ws-production');
    assert.strictEqual(success, true);

    const conn = connectionEngine.getConnection(targetId, 'ws-production');
    assert.ok(conn);
    assert.strictEqual(conn.status, 'DISCONNECTED');
    assert.strictEqual(conn.dataSource, 'NOT_CONNECTED');
  });
});
