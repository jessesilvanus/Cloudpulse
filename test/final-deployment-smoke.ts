/**
 * CLOUDPULSE — Final Live Deployment & Multi-Tier Smoke Test
 * 
 * Verifies live application runtime across API Gateway (3001), Web UI (5173),
 * Auth, RBAC, Onboarding, Multi-Cloud Adapters, Workers, and Tenant Isolation.
 */

import assert from 'node:assert/strict';

const API_BASE = 'http://localhost:3001';
const WEB_BASE = 'http://localhost:5173';

async function runDeploymentVerification() {
  console.log('==================================================================');
  console.log(' CLOUDPULSE — LIVE DEPLOYMENT SMOKE TEST & POST-DEPLOY VALIDATION');
  console.log('==================================================================\n');

  let passed = 0;
  let total = 0;

  async function check(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✔ [${total}/20] PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✖ [${total}/20] FAIL: ${name} -> ${err.message}`);
      throw err;
    }
  }

  let sessionToken = '';
  let userEmail = `deploy.tester-${Date.now()}@cloudpulse.io`;
  let workspaceId = '';

  // 1. Liveness
  await check('Liveness Probe (GET /health/live)', async () => {
    const res = await fetch(`${API_BASE}/health/live`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.status, 'ok');
    assert.ok(json.uptimeSeconds >= 0);
  });

  // 2. Readiness
  await check('Readiness Probe (GET /health/ready)', async () => {
    const res = await fetch(`${API_BASE}/health/ready`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.status, 'ready');
    assert.strictEqual(json.initialized, true);
  });

  // 3. Deep Dependencies Probe
  await check('Deep Dependencies Health Probe (GET /health/dependencies)', async () => {
    const res = await fetch(`${API_BASE}/health/dependencies`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.strictEqual(json.data.database.status, 'HEALTHY');
    assert.ok(json.data.telemetryEngine);
  });

  // 4. Platform Health Check
  await check('Platform Health & Core SLO (GET /api/v1/platform/health)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/platform/health`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.strictEqual(json.data.status, 'HEALTHY');
  });

  // 5. Platform Sync Workers & Queue
  await check('Platform Background Sync Workers (GET /api/v1/platform/workers)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/platform/workers`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.ok(json.data.length >= 4);
    assert.ok(json.data.some((w: any) => w.name.includes('AWS')));
  });

  // 6. Identity Provider Discovery
  await check('Configured Identity Providers Discovery (GET /api/v1/auth/providers)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/auth/providers`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.strictEqual(json.data.emailPassword.enabled, true);
    assert.ok(json.data.google && typeof json.data.google.enabled === 'boolean');
    assert.ok(json.data.microsoft && typeof json.data.microsoft.enabled === 'boolean');
    assert.ok(json.data.apple && typeof json.data.apple.enabled === 'boolean');
  });

  // 7. User Registration
  await check('User Account Registration (POST /api/v1/auth/register)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Deployment Smoke Lead',
        email: userEmail,
        password: 'DeployCloudPulse2026!',
        role: 'PLATFORM_ENGINEER'
      })
    });
    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.ok(json.data.token);
    assert.ok(json.data.workspace.id);
    sessionToken = json.data.token;
    workspaceId = json.data.workspace.id;
  });

  // 8. User Login & Token Issuance
  await check('User Login Authentication (POST /api/v1/auth/login)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: 'DeployCloudPulse2026!'
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.strictEqual(json.data.user.email, userEmail);
  });

  // 9. Authenticated Session Profile
  await check('User Profile & Workspace Session Context (GET /api/v1/auth/me)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.strictEqual(json.data.user.email, userEmail);
    assert.strictEqual(json.data.workspace.id, workspaceId);
  });

  // 10. Protected Route Authorization Guard
  await check('Protected Route rejects unauthenticated request with 401', async () => {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`);
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.ok, false);
  });

  // 11. Multi-Tenant Isolation
  await check('Multi-Tenant isolation prevents cross-tenant data access', async () => {
    const res = await fetch(`${API_BASE}/api/v1/cloud-connections`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'x-workspace-id': `ws-foreign-${Date.now()}`
      }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.deepStrictEqual(json.data, []); // Empty, no foreign data leak
  });

  // 12. AWS Setup Info & Trust Policy Generation
  await check('AWS Least-Privilege Trust Policy Generation (POST /cloud-connections/aws/setup-info)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/cloud-connections/aws/setup-info`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'x-workspace-id': workspaceId
      }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.ok(json.data.externalId.includes(workspaceId));
    assert.strictEqual(json.data.cloudPulseAccountId, '718293041526');
  });

  // 13. AWS Cross-Account Connection
  await check('AWS Cross-Account IAM Role Connection (POST /cloud-connections/aws/connect)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/cloud-connections/aws/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
        'x-workspace-id': workspaceId
      },
      body: JSON.stringify({
        displayName: 'Production AWS Account (US-East-1)',
        roleArn: 'arn:aws:iam::718293041526:role/CloudPulseReadOnlyRole',
        externalId: `cp-ext-${workspaceId}-live`
      })
    });
    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.strictEqual(json.data.provider, 'AWS');
    assert.strictEqual(json.data.accountIdentifier, '718293041526');
  });

  // 14. AWS Real Telemetry & Provenance
  await check('AWS Live Telemetry & Truth-in-Labeling (GET /cloud-connections/aws/live-data)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/cloud-connections/aws/live-data`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'x-workspace-id': workspaceId
      }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.strictEqual(json.data.provenance, 'LIVE');
  });

  // 15. Azure Setup Guide
  await check('Microsoft Azure Entra ID Setup Guide (GET /cloud-connections/azure/setup-info)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/cloud-connections/azure/setup-info`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.steps.length >= 4);
  });

  // 16. Google Cloud Setup Guide
  await check('Google Cloud Service Account Setup Guide (GET /cloud-connections/gcp/setup-info)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/cloud-connections/gcp/setup-info`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.steps.length >= 4);
  });

  // 17. Kubernetes Platform Overview
  await check('Kubernetes Cluster Operations & Topology (GET /kubernetes/overview)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/kubernetes/overview`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'x-workspace-id': workspaceId
      }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.ok(json.data.totalClusters !== undefined);
  });

  // 18. Frontend Web Application Serving
  await check('Web UI Shell & HTML Index Serving (GET /)', async () => {
    const res = await fetch(`${WEB_BASE}/`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('<!DOCTYPE html>') || text.includes('CLOUDPULSE') || text.includes('root'));
  });

  // 19. Web Login Page Serving
  await check('Web UI Login Route Serving (GET /login)', async () => {
    const res = await fetch(`${WEB_BASE}/login`);
    assert.strictEqual(res.status, 200);
  });

  // 20. Session Logout
  await check('User Logout & Session Invalidation (POST /api/v1/auth/logout)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert.strictEqual(res.status, 200);

    const checkRes = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert.strictEqual(checkRes.status, 401);
  });

  console.log('\n==================================================================');
  console.log(` ✓ ALL ${passed}/${total} LIVE DEPLOYMENT SMOKE TESTS PASSED!`);
  console.log('==================================================================\n');
}

runDeploymentVerification().catch((err) => {
  console.error('Fatal Deployment Smoke Failure:', err);
  process.exit(1);
});
