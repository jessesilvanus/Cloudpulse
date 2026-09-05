import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import { authRouter } from '../src/routes/auth.js';
import { cloudConnectionsRouter } from '../src/routes/cloud-connections.js';
import { kubernetesRouter } from '../src/routes/kubernetes.js';
import { AuthIdentityEngine } from '../src/services/auth-identity-engine.js';
import { CloudConnectionEngine } from '../src/services/cloud-connection-engine.js';
import { KubernetesOperationsEngine } from '../src/services/kubernetes-operations-engine.js';

describe('CLOUDPULSE — Multi-Cloud Connection Flow & Truthful State Isolation Suite', () => {
  let server: Server;
  let baseUrl: string;
  let authEngine: AuthIdentityEngine;
  let cloudEngine: CloudConnectionEngine;

  let userAToken: string;
  let userAWorkspaceId: string;
  let userBToken: string;
  let userBWorkspaceId: string;

  before(async () => {
    authEngine = AuthIdentityEngine.getInstance();
    cloudEngine = CloudConnectionEngine.getInstance();

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

    // Register User A
    const resA = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Engineer Alice',
        email: `alice-${Date.now()}@multicloud-audit.io`,
        password: 'Password123!Secure',
        role: 'PLATFORM_ENGINEER',
      }),
    });
    const jsonA = await resA.json();
    assert.strictEqual(resA.status, 201);
    userAToken = jsonA.data.token;
    userAWorkspaceId = jsonA.data.workspace.id;

    // Register User B
    const resB = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Engineer Bob',
        email: `bob-${Date.now()}@multicloud-audit.io`,
        password: 'Password123!Secure',
        role: 'PLATFORM_ENGINEER',
      }),
    });
    const jsonB = await resB.json();
    assert.strictEqual(resB.status, 201);
    userBToken = jsonB.data.token;
    userBWorkspaceId = jsonB.data.workspace.id;
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // ─── 1. Fresh User Initial State ──────────────────────────────────────────

  it('1. Fresh user workspace starts with 0 cloud connections and 0 clusters (no leaked default connection)', async () => {
    const resClouds = await fetch(`${baseUrl}/cloud-connections`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const jsonClouds = await resClouds.json();
    assert.strictEqual(resClouds.status, 200);
    assert.strictEqual(jsonClouds.ok, true);
    assert.strictEqual(jsonClouds.data.length, 0, 'Fresh workspace must not have pre-seeded live connections');

    const resK8s = await fetch(`${baseUrl}/kubernetes/clusters`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const jsonK8s = await resK8s.json();
    assert.strictEqual(resK8s.status, 200);
    assert.strictEqual(jsonK8s.ok, true);
    assert.strictEqual(jsonK8s.data.length, 0, 'Fresh workspace must not have pre-seeded clusters');
  });

  // ─── 2. Input Validation for Cloud Adapters ───────────────────────────────

  it('2. Connecting AWS with invalid IAM role ARN is rejected with honest error', async () => {
    const res = await fetch(`${baseUrl}/cloud-connections/aws/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        roleArn: 'invalid-arn-format',
        externalId: 'cloudpulse-ext-test',
      }),
    });
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.ok, false);
    const errText = typeof json.error === 'string' ? json.error : json.error?.message;
    assert.match(errText, /invalid role arn/i);
  });

  it('3. Connecting Azure with invalid tenantId/subscriptionId is rejected', async () => {
    const res = await fetch(`${baseUrl}/cloud-connections/azure/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        displayName: 'Test Azure Subscription',
        tenantId: 'not-a-uuid',
        subscriptionId: 'not-a-uuid',
      }),
    });
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.ok, false);
    const errText = typeof json.error === 'string' ? json.error : json.error?.message;
    assert.match(errText, /guid|uuid/i);
  });

  it('4. Connecting GCP with invalid project format is rejected', async () => {
    const res = await fetch(`${baseUrl}/cloud-connections/gcp/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        displayName: 'Test GCP Project',
        projectId: '-invalid--project-id-',
      }),
    });
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.ok, false);
    const errText = typeof json.error === 'string' ? json.error : json.error?.message;
    assert.match(errText, /project id/i);
  });

  it('5. Connecting Kubernetes with invalid endpoint is rejected', async () => {
    const res = await fetch(`${baseUrl}/kubernetes/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        name: 'test-cluster',
        provider: 'EKS',
        clusterEndpointReference: 'http://insecure-cluster.internal',
      }),
    });
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.ok, false);
    const errText = typeof json.error === 'string' ? json.error : json.error?.message;
    assert.match(errText, /https/i);
  });

  // ─── 3. Honest Disconnection Semantics ────────────────────────────────────

  it('6. Disconnecting a connection transitions status to DISCONNECTED and dataSource to NOT_CONNECTED', async () => {
    // Create valid formatted connection for User A
    const connectRes = await fetch(`${baseUrl}/cloud-connections/aws/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        displayName: 'Alice AWS Production',
        roleArn: 'arn:aws:iam::123456789012:role/CloudPulseIntegrationRole',
        externalId: 'ext-alice-12345',
      }),
    });
    assert.strictEqual(connectRes.status, 201);
    const connectJson = await connectRes.json();
    const connId = connectJson.data.id;

    // Disconnect the connection
    const disconnectRes = await fetch(`${baseUrl}/cloud-connections/${connId}/disconnect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.strictEqual(disconnectRes.status, 200);
    const disconnectJson = await disconnectRes.json();
    assert.strictEqual(disconnectJson.ok, true);
    assert.strictEqual(disconnectJson.data.status, 'DISCONNECTED');
    assert.strictEqual(disconnectJson.data.dataSource, 'NOT_CONNECTED');

    // Verify it is reflected when listing connections
    const listRes = await fetch(`${baseUrl}/cloud-connections`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const listJson = await listRes.json();
    const found = listJson.data.find((c: any) => c.id === connId);
    assert.ok(found);
    assert.strictEqual(found.status, 'DISCONNECTED');
  });

  // ─── 4. Multi-Tenant Workspace Isolation ──────────────────────────────────

  it('7. User B in Workspace B cannot access or disconnect User A connection', async () => {
    // User A creates connection
    const connectRes = await fetch(`${baseUrl}/cloud-connections/gcp/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        displayName: 'Alice GCP Project',
        projectId: 'alice-cloud-project',
      }),
    });
    assert.strictEqual(connectRes.status, 201);
    const connAId = (await connectRes.json()).data.id;

    // User B tries to view User A connection
    const getRes = await fetch(`${baseUrl}/cloud-connections/${connAId}`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert.strictEqual(getRes.status, 404, 'User B must get 404 when querying User A connection');

    // User B tries to disconnect User A connection
    const disconnectRes = await fetch(`${baseUrl}/cloud-connections/${connAId}/disconnect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert.strictEqual(disconnectRes.status, 404, 'User B cannot disconnect User A connection');

    // User B connection list should not contain User A connection
    const listResB = await fetch(`${baseUrl}/cloud-connections`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const listJsonB = await listResB.json();
    assert.strictEqual(listJsonB.data.some((c: any) => c.id === connAId), false);
  });
});
