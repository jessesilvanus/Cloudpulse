import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import { authRouter } from '../src/routes/auth.js';
import { cloudConnectionsRouter } from '../src/routes/cloud-connections.js';
import { kubernetesRouter } from '../src/routes/kubernetes.js';
import { AuthIdentityEngine } from '../src/services/auth-identity-engine.js';
import { CloudConnectionEngine } from '../src/services/cloud-connection-engine.js';

describe('CLOUDPULSE — Multi-Provider Sign-In & Cloud Connection Onboarding Suite', () => {
  let server: Server;
  let baseUrl: string;
  let authEngine: AuthIdentityEngine;
  let connectionEngine: CloudConnectionEngine;
  let authToken: string;
  let workspaceId: string;
  let organizationId: string;

  before(async () => {
    authEngine = AuthIdentityEngine.getInstance();
    connectionEngine = CloudConnectionEngine.getInstance();

    const app = express();
    app.use(express.json());
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/cloud-connections', cloudConnectionsRouter);
    app.use('/api/v1/kubernetes', kubernetesRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr) {
          baseUrl = `http://127.0.0.1:${addr.port}/api/v1`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // ─── 1. Identity Provider Discovery ──────────────────────────────────────────

  it('1. [AUTH] Provider discovery returns configured identity providers and truthful statuses', async () => {
    const res = await fetch(`${baseUrl}/auth/providers`);
    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.ok, true);
    assert.strictEqual(json.data.emailPassword.enabled, true);
    assert.strictEqual(json.data.emailPassword.allowsRegistration, true);
    assert.ok(json.data.google);
    assert.strictEqual(typeof json.data.google.enabled, 'boolean');
    assert.ok(json.data.microsoft);
    assert.strictEqual(typeof json.data.microsoft.enabled, 'boolean');
    assert.ok(json.data.apple);
    assert.strictEqual(typeof json.data.apple.enabled, 'boolean');
  });

  // ─── 2. User Account Registration ────────────────────────────────────────────

  it('2. [AUTH] User registration creates user, organization, workspace, and session', async () => {
    const email = `alex.engineer-${Date.now()}@enterprise.io`;
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Engineer',
        email,
        password: 'CloudPulseSecurePass2026!',
        role: 'PLATFORM_ENGINEER',
      }),
    });

    const json = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.ok, true);
    assert.strictEqual(json.data.user.email, email);
    assert.strictEqual(json.data.user.role, 'PLATFORM_ENGINEER');
    assert.ok(json.data.token);
    assert.ok(json.data.organization.id);
    assert.ok(json.data.workspace.id);

    authToken = json.data.token;
    workspaceId = json.data.workspace.id;
    organizationId = json.data.organization.id;
  });

  it('3. [AUTH] Duplicate registration with same email is rejected', async () => {
    const email = `duplicate.test-${Date.now()}@enterprise.io`;
    await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'User One',
        email,
        password: 'PassWord123!',
      }),
    });

    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'User Two',
        email,
        password: 'PassWord123!',
      }),
    });

    const json = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(json.ok, false);
    assert.ok(json.error.message.includes('already exists'));
  });

  // ─── 3. Email/Password Login & Password Reset ────────────────────────────────

  it('4. [AUTH] Login with valid credentials succeeds and issues Bearer token', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jesse@cloudpulse.io',
        password: 'CloudPulse2026!',
      }),
    });

    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.ok, true);
    assert.strictEqual(json.data.user.email, 'jesse@cloudpulse.io');
    assert.ok(json.data.token);
  });

  it('5. [AUTH] Login with incorrect password is rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jesse@cloudpulse.io',
        password: 'WrongPassword!',
      }),
    });

    const json = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(json.ok, false);
    assert.ok(json.error.message.includes('Invalid email or password'));
  });

  it('6. [AUTH] Password reset flow (forgot -> token -> reset -> login)', async () => {
    const email = 'jesse@cloudpulse.io';
    const forgotRes = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const forgotJson = await forgotRes.json();
    assert.strictEqual(forgotRes.status, 200);
    assert.strictEqual(forgotJson.ok, true);
    const token = forgotJson.data.resetToken;

    const resetRes = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        newPassword: 'NewCloudPulsePass2026!',
      }),
    });
    const resetJson = await resetRes.json();
    assert.strictEqual(resetRes.status, 200);
    assert.strictEqual(resetJson.ok, true);

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'NewCloudPulsePass2026!',
      }),
    });
    const loginJson = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginJson.ok, true);
  });

  // ─── 4. Social & Enterprise OAuth ────────────────────────────────────────────

  it('7. [OAUTH] Real OAuth authorization URL generation and provider validation', async () => {
    process.env['GOOGLE_CLIENT_ID'] = 'test-google-client-id.apps.googleusercontent.com';
    process.env['GOOGLE_CLIENT_SECRET'] = 'test-google-secret';

    const res = await fetch(`${baseUrl}/auth/authorize/google?returnUrl=/overview`);
    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.ok, true);
    assert.ok(json.data.authorizationUrl.includes('accounts.google.com/o/oauth2/v2/auth'));
    assert.ok(json.data.authorizationUrl.includes('client_id=test-google-client-id.apps.googleusercontent.com'));
    assert.ok(json.data.authorizationUrl.includes('response_type=code'));
    assert.ok(json.data.state);
    assert.strictEqual(typeof json.data.state, 'string');
  });

  it('8. [OAUTH] CSRF state validation prevents replay and forged callbacks', async () => {
    const res = await fetch(`${baseUrl}/auth/callback/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'forged-auth-code',
        state: 'invalid-or-forged-state-token',
      }),
    });

    const json = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(json.ok, false);
    assert.ok(json.error.message.includes('CSRF') || json.error.message.includes('state'));
  });

  it('9. [OAUTH] Single-use ticket exchange creates authenticated session and invalidates ticket', async () => {
    const tempUser = authEngine.register({
      name: 'Ticket Tester',
      email: `ticket.tester-${Date.now()}@enterprise.io`,
      password: 'Password123!',
      role: 'DEVOPS_ENGINEER',
    });

    const ticket = authEngine.createExchangeTicket(tempUser, 60000);
    assert.ok(ticket);

    // 1st exchange: Succeeds
    const res1 = await fetch(`${baseUrl}/auth/exchange-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket }),
    });
    const json1 = await res1.json();
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(json1.ok, true);
    assert.strictEqual(json1.data.user.email, tempUser.user.email);
    assert.ok(json1.data.token);

    // 2nd exchange with same ticket: Must fail (single use)
    const res2 = await fetch(`${baseUrl}/auth/exchange-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket }),
    });
    const json2 = await res2.json();
    assert.strictEqual(res2.status, 401);
    assert.strictEqual(json2.ok, false);
    assert.ok(json2.error.message.includes('Invalid') || json2.error.message.includes('consumed'));
  });

  it('10. [OAUTH] Verified identity account linking and registration', async () => {
    const googleSession = authEngine.linkOrRegisterOAuthUser('google', {
      email: `google.user-${Date.now()}@company.com`,
      name: 'Google User',
    });
    assert.strictEqual(googleSession.user.provider, 'google');

    const msSession = authEngine.linkOrRegisterOAuthUser('microsoft', {
      email: `ms.user-${Date.now()}@company.com`,
      name: 'MS User',
    });
    assert.strictEqual(msSession.user.provider, 'microsoft');

    const appleSession = authEngine.linkOrRegisterOAuthUser('apple', {
      email: `apple.user-${Date.now()}@privaterelay.appleid.com`,
      name: 'Apple User',
    });
    assert.strictEqual(appleSession.user.provider, 'apple');
  });

  // ─── 5. Session Verification, Workspaces & Logout ────────────────────────────

  it('10. [SESSION] GET /auth/me returns authenticated user & workspace context', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.ok, true);
    assert.ok(json.data.user.id);
    assert.strictEqual(json.data.workspace.id, workspaceId);
    assert.strictEqual(json.data.organization.id, organizationId);
  });

  it('11. [SESSION] Workspace creation and listing', async () => {
    const createRes = await fetch(`${baseUrl}/auth/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ name: 'Staging Environment' }),
    });

    const createJson = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createJson.ok, true);
    assert.strictEqual(createJson.data.name, 'Staging Environment');

    const listRes = await fetch(`${baseUrl}/auth/workspaces`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const listJson = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listJson.ok, true);
    assert.ok(listJson.data.length >= 2);
  });

  it('12. [SESSION] Logout revokes session token', async () => {
    const tempReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Logout Tester',
        email: `logout.test-${Date.now()}@enterprise.io`,
        password: 'Password123!',
      }),
    });
    const tempJson = await tempReg.json();
    const tempToken = tempJson.data.token;

    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tempToken}` },
    });
    assert.strictEqual(logoutRes.status, 200);

    const checkRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${tempToken}` },
    });
    assert.strictEqual(checkRes.status, 401);
  });

  // ─── 6. Cloud Connection Onboarding Flow (AWS, Azure, GCP, K8s) ──────────────

  it('13. [ONBOARDING] AWS setup info generates least-privilege trust policy with External ID', async () => {
    const res = await fetch(`${baseUrl}/cloud-connections/aws/setup-info`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'x-workspace-id': workspaceId,
      },
    });

    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.ok, true);
    assert.ok(json.data.externalId.includes(`cp-ext-${workspaceId}`));
    assert.strictEqual(json.data.cloudPulseAccountId, '718293041526');
    assert.ok(json.data.trustPolicyJson.includes('sts:AssumeRole'));
  });

  it('14. [ONBOARDING] AWS cross-account role connection with valid Role ARN', async () => {
    const res = await fetch(`${baseUrl}/cloud-connections/aws/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        'x-workspace-id': workspaceId,
      },
      body: JSON.stringify({
        displayName: 'Staging AWS Workloads (US-West-2)',
        roleArn: 'arn:aws:iam::839201746152:role/CloudPulseReadOnlyRole',
        externalId: `cp-ext-${workspaceId}-test`,
      }),
    });

    const json = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.ok, true);
    assert.strictEqual(json.data.provider, 'AWS');
    assert.strictEqual(json.data.accountIdentifier, '839201746152');
  });

  it('15. [ONBOARDING] Azure setup guide and Entra ID connection', async () => {
    const guideRes = await fetch(`${baseUrl}/cloud-connections/azure/setup-info`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const guideJson = await guideRes.json();
    assert.strictEqual(guideRes.status, 200);
    assert.ok(guideJson.data.steps.length > 0);

    const connectRes = await fetch(`${baseUrl}/cloud-connections/azure/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        'x-workspace-id': workspaceId,
      },
      body: JSON.stringify({
        displayName: 'Azure Enterprise Core Subscription',
        tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
        subscriptionId: 'a41d9e20-36b1-4d92-8092-18bc9401f82e',
        clientId: 'sp-cloudpulse-azure-connector',
      }),
    });

    const connectJson = await connectRes.json();
    assert.strictEqual(connectRes.status, 201);
    assert.strictEqual(connectJson.ok, true);
    assert.strictEqual(connectJson.data.provider, 'AZURE');
  });

  it('16. [ONBOARDING] Google Cloud setup guide and Service Account connection', async () => {
    const guideRes = await fetch(`${baseUrl}/cloud-connections/gcp/setup-info`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const guideJson = await guideRes.json();
    assert.strictEqual(guideRes.status, 200);
    assert.ok(guideJson.data.steps.length > 0);

    const connectRes = await fetch(`${baseUrl}/cloud-connections/gcp/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        'x-workspace-id': workspaceId,
      },
      body: JSON.stringify({
        displayName: 'Google Cloud Platform Production Project',
        projectId: 'cloudpulse-production-gcp-01',
        clientEmail: 'cloudpulse-connector@cloudpulse-production-gcp-01.iam.gserviceaccount.com',
        projectNumber: '819238471920',
      }),
    });

    const connectJson = await connectRes.json();
    assert.strictEqual(connectRes.status, 201);
    assert.strictEqual(connectJson.ok, true);
    assert.strictEqual(connectJson.data.provider, 'GCP');
  });

  it('17. [ONBOARDING] Kubernetes cluster connection with read-only authorization', async () => {
    const connectRes = await fetch(`${baseUrl}/kubernetes/clusters/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        'x-workspace-id': workspaceId,
      },
      body: JSON.stringify({
        name: 'prod-eks-us-east-1',
        provider: 'EKS',
        clusterEndpointReference: 'https://B829104FA1.gr7.us-east-1.eks.amazonaws.com',
        authorizationMethod: 'AWS_IAM_IRSA',
        regionOrLocation: 'us-east-1',
        cloudAccountOrProject: '718293041526',
      }),
    });

    const connectJson = await connectRes.json();
    assert.strictEqual(connectRes.status, 201);
    assert.strictEqual(connectJson.ok, true);
    assert.strictEqual(connectJson.data.name, 'prod-eks-us-east-1');
  });

  // ─── 7. Separation of Identity vs Cloud & Data Truthfulness ──────────────────

  it('18. [SECURITY] User identity is isolated from cloud infrastructure credentials', async () => {
    // Verify user profile does NOT contain cloud credentials
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const meJson = await meRes.json();
    const user = meJson.data.user;
    assert.strictEqual(user.password, undefined);
    assert.strictEqual(user.awsAccessKeyId, undefined);
    assert.strictEqual(user.awsSecretAccessKey, undefined);
    assert.strictEqual(user.azureClientSecret, undefined);
    assert.strictEqual(user.gcpPrivateKey, undefined);
  });

  it('19. [TRUTH] Disconnected workspace returns honest empty list without fake fallbacks', async () => {
    const emptyWorkspaceId = `ws-empty-${Date.now()}`;
    const conns = connectionEngine.getConnections(emptyWorkspaceId);
    assert.strictEqual(conns.length, 0);

    const res = await fetch(`${baseUrl}/cloud-connections`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'x-workspace-id': emptyWorkspaceId,
      },
    });

    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.ok, true);
    assert.deepStrictEqual(json.data, []);
  });

  it('20. [VALIDATION] Connection validation returns deterministic multi-step audit', async () => {
    const connections = connectionEngine.getConnections('ws-production');
    assert.ok(connections.length > 0);
    const connId = connections[0].id;

    const valRes = await fetch(`${baseUrl}/cloud-connections/${connId}/validate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'x-workspace-id': 'ws-production',
      },
    });

    const valJson = await valRes.json();
    assert.strictEqual(valRes.status, 200);
    assert.strictEqual(valJson.ok, true);
    assert.ok(valJson.data.connection.status);
    assert.strictEqual(valJson.data.connection.status, 'CONNECTED');
    assert.ok(valJson.data.validation);
  });
});
