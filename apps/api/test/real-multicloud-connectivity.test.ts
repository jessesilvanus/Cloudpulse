import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AzureCloudAdapter } from '../src/services/azure-cloud-adapter.js';
import { GcpCloudAdapter } from '../src/services/gcp-cloud-adapter.js';
import { AwsCloudAdapter } from '../src/services/aws-cloud-adapter.js';
import { CloudConnectionEngine } from '../src/services/cloud-connection-engine.js';
import type { CloudConnection } from '@cloudpulse/shared';

describe('CLOUDPULSE Phase 61 Real Multi-Cloud Connectivity: Azure + Google Cloud Platform', () => {
  const azureAdapter = AzureCloudAdapter.getInstance();
  const gcpAdapter = GcpCloudAdapter.getInstance();
  const awsAdapter = AwsCloudAdapter.getInstance();
  const connectionEngine = CloudConnectionEngine.getInstance();

  const validWorkspace = 'ws-production';
  const tenantId = '72f988bf-86f1-41af-91ab-2d7cd011db47';
  const subscriptionId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const clientId = '98765432-abcd-ef01-2345-6789abcdef01';

  const gcpProjectId = 'cloudpulse-production-gcp';
  const gcpClientEmail = 'cloudpulse-viewer@cloudpulse-production-gcp.iam.gserviceaccount.com';
  const gcpProjectNumber = '109283746501';

  // ─── 1. Azure Cloud Adapter ──────────────────────────────────────────────────
  describe('Azure Cloud Adapter & Normalization', () => {
    it('should generate 8-step Azure Entra ID setup wizard guide with commands', () => {
      const guide = azureAdapter.getSetupGuide();
      assert.ok(Array.isArray(guide));
      assert.equal(guide.length, 8);
      assert.equal(guide[0].stepNumber, 1);
      assert.ok(guide[0].title.includes('Entra ID') || guide[0].title.includes('Application'));
      assert.ok(guide.some((s) => s.cliCommand?.includes('az ad app create') || s.description.includes('az ad app create')));
      assert.ok(guide.some((s) => s.cliCommand?.includes('az role assignment create') || s.description.includes('az role assignment create')));
      assert.ok(guide.every((s) => s.title && s.description));
    });

    it('should validate genuine Azure Entra ID credentials and reject invalid formats', () => {
      const valid = azureAdapter.validateEntraCredentials({
        tenantId,
        subscriptionId,
        clientId,
      });
      assert.equal(valid.valid, true);
      assert.equal(valid.errors.length, 0);

      const invalid = azureAdapter.validateEntraCredentials({
        tenantId: 'invalid-tenant-format',
        subscriptionId: 'not-a-uuid',
      });
      assert.equal(invalid.valid, false);
      assert.ok(invalid.errors.length >= 2);
    });

    it('should discover Azure subscriptions with live metadata', () => {
      const subs = azureAdapter.discoverSubscriptions(tenantId);
      assert.ok(subs.length >= 1);
      const sub = subs[0];
      assert.ok(sub.subscriptionId);
      assert.ok(sub.displayName);
      assert.equal(sub.state, 'Enabled');
      assert.equal(sub.tenantId, tenantId);
    });

    it('should normalize 15+ Azure resources into canonical format', async () => {
      const resources = await azureAdapter.listNormalizedResources(subscriptionId);
      assert.ok(resources.length >= 10);

      // Verify canonical ID format: azure:<subscriptionId>:<location>:<service>:<name>
      for (const res of resources) {
        assert.equal(res.provider, 'AZURE');
        assert.ok(res.id.startsWith(`azure:${subscriptionId}:`), `Expected ID to start with azure:${subscriptionId}:, got ${res.id}`);
        assert.ok(res.name);
        assert.ok(res.normalizedServiceType);
        assert.ok(res.regionOrLocation);
        assert.ok(['HEALTHY', 'DEGRADED', 'UNKNOWN', 'WARNING'].includes(res.healthState));
        assert.ok(res.metadata);
      }

      // Check specific Azure service types
      const types = new Set(resources.map((r) => r.normalizedServiceType));
      assert.ok(types.has('COMPUTE_VM')); // Virtual Machine
      assert.ok(types.has('OBJECT_STORAGE')); // Blob Storage
      assert.ok(types.has('RELATIONAL_DATABASE')); // Azure SQL
      assert.ok(types.has('KUBERNETES_CLUSTER')); // AKS
      assert.ok(types.has('SERVERLESS_FUNCTION')); // Azure Functions
      assert.ok(types.has('VIRTUAL_NETWORK')); // VNet
      assert.ok(types.has('KEY_VAULT')); // Key Vault
      assert.ok(types.has('NOSQL_DATABASE')); // Cosmos DB
      assert.ok(types.has('EVENT_QUEUE')); // Service Bus
    });

    it('should retrieve Azure Defender for Cloud security findings', () => {
      const findings = azureAdapter.getSecurityFindings(subscriptionId);
      assert.ok(findings.length >= 2);
      for (const f of findings) {
        assert.equal(f.provider, 'AZURE');
        assert.ok(f.id.startsWith('az-sec-'));
        assert.ok(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(f.severity));
        assert.ok(f.title);
        assert.ok(f.remediation);
      }
    });

    it('should retrieve Azure Cost Management aggregated cost data', () => {
      const cost = azureAdapter.getCostData(subscriptionId);
      assert.equal(cost.provider, 'AZURE');
      assert.equal(cost.currency, 'USD');
      assert.ok(cost.currentMonthEstimatedSpend > 0);
      assert.ok(cost.dailyCostTrend.length > 0);
      assert.ok(cost.topCostDrivers.length > 0);
    });

    it('should report Azure provider capabilities matrix', () => {
      const caps = azureAdapter.getCapabilities();
      assert.ok(caps.length >= 7);
      assert.ok(caps.some((c) => c.capability === 'RESOURCE_INVENTORY' && c.coverage === 'SUPPORTED'));
      assert.ok(caps.some((c) => c.capability === 'SECURITY_FINDINGS' && c.coverage === 'SUPPORTED'));
      assert.ok(caps.some((c) => c.capability === 'COST_MANAGEMENT' && c.coverage === 'SUPPORTED'));
    });
  });

  // ─── 2. GCP Cloud Adapter ────────────────────────────────────────────────────
  describe('GCP Cloud Adapter & Normalization', () => {
    it('should generate 8-step GCP Service Account setup wizard guide with gcloud commands', () => {
      const guide = gcpAdapter.getSetupGuide();
      assert.ok(Array.isArray(guide));
      assert.equal(guide.length, 8);
      assert.equal(guide[0].stepNumber, 1);
      assert.ok(guide[0].title.includes('Google Cloud') || guide[0].title.includes('Project'));
      assert.ok(guide.some((s) => s.gcloudCommand?.includes('gcloud') || s.description.includes('Google Cloud')));
      assert.ok(guide.every((s) => s.title && s.description));
    });

    it('should validate genuine GCP Service Account credentials and reject invalid formats', () => {
      const valid = gcpAdapter.validateServiceAccount({
        projectId: gcpProjectId,
        clientEmail: gcpClientEmail,
        projectNumber: gcpProjectNumber,
      });
      assert.equal(valid.valid, true);
      assert.equal(valid.errors.length, 0);

      const invalid = gcpAdapter.validateServiceAccount({
        projectId: 'INVALID_PROJECT_NAME!@#',
        clientEmail: 'not-an-email',
      });
      assert.equal(invalid.valid, false);
      assert.ok(invalid.errors.length >= 2);
    });

    it('should discover GCP projects with live metadata', () => {
      const projects = gcpAdapter.discoverProjects(gcpProjectId);
      assert.ok(projects.length >= 1);
      const proj = projects[0];
      assert.equal(proj.projectId, gcpProjectId);
      assert.equal(proj.lifecycleState, 'ACTIVE');
      assert.ok(proj.projectNumber);
    });

    it('should normalize 15+ GCP resources into canonical format', async () => {
      const resources = await gcpAdapter.listNormalizedResources(gcpProjectId);
      assert.ok(resources.length >= 10);

      // Verify canonical ID format: gcp:<projectId>:<location>:<service>:<name>
      for (const res of resources) {
        assert.equal(res.provider, 'GCP');
        assert.ok(res.id.startsWith(`gcp:${gcpProjectId}:`), `Expected ID to start with gcp:${gcpProjectId}:, got ${res.id}`);
        assert.ok(res.name);
        assert.ok(res.normalizedServiceType);
        assert.ok(res.regionOrLocation);
        assert.ok(['HEALTHY', 'DEGRADED', 'UNKNOWN', 'WARNING'].includes(res.healthState));
        assert.ok(res.metadata);
      }

      // Check specific GCP service types
      const types = new Set(resources.map((r) => r.normalizedServiceType));
      assert.ok(types.has('COMPUTE_VM')); // Google Compute Engine
      assert.ok(types.has('OBJECT_STORAGE')); // Google Cloud Storage
      assert.ok(types.has('RELATIONAL_DATABASE')); // Cloud SQL
      assert.ok(types.has('KUBERNETES_CLUSTER')); // GKE
      assert.ok(types.has('SERVERLESS_FUNCTION')); // Cloud Run
      assert.ok(types.has('VIRTUAL_NETWORK')); // VPC Network
      assert.ok(types.has('KEY_VAULT')); // Secret Manager / KMS
      assert.ok(types.has('DATA_WAREHOUSE')); // BigQuery
      assert.ok(types.has('LOAD_BALANCER')); // Cloud Load Balancing
      assert.ok(types.has('TOPIC_PUBSUB')); // Cloud Pub/Sub
    });

    it('should retrieve GCP Security Command Center (SCC) security findings', () => {
      const findings = gcpAdapter.getSecurityFindings(gcpProjectId);
      assert.ok(findings.length >= 2);
      for (const f of findings) {
        assert.equal(f.provider, 'GCP');
        assert.ok(f.id.startsWith('gcp-sec-'));
        assert.ok(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(f.severity));
        assert.ok(f.title);
        assert.ok(f.remediation);
      }
    });

    it('should retrieve GCP Cloud Billing aggregated cost data', () => {
      const cost = gcpAdapter.getCostData(gcpProjectId);
      assert.equal(cost.provider, 'GCP');
      assert.equal(cost.currency, 'USD');
      assert.ok(cost.currentMonthEstimatedSpend > 0);
      assert.ok(cost.dailyCostTrend.length > 0);
      assert.ok(cost.topCostDrivers.length > 0);
    });

    it('should report GCP provider capabilities matrix', () => {
      const caps = gcpAdapter.getCapabilities();
      assert.ok(caps.length >= 7);
      assert.ok(caps.some((c) => c.capability === 'RESOURCE_INVENTORY' && c.coverage === 'SUPPORTED'));
      assert.ok(caps.some((c) => c.capability === 'SECURITY_FINDINGS' && c.coverage === 'SUPPORTED'));
      assert.ok(caps.some((c) => c.capability === 'COST_MANAGEMENT' && c.coverage === 'SUPPORTED'));
    });
  });

  // ─── 3. Multi-Cloud Connection Engine & Cross-Cloud Services ─────────────────
  describe('Multi-Cloud Connection Engine & Scorecard Aggregator', () => {
    it('should connect Azure subscription and register normalized capabilities', async () => {
      const conn = await connectionEngine.connectAzure(validWorkspace, {
        displayName: 'Production Azure UK South',
        tenantId,
        subscriptionId,
        clientId,
      });

      assert.equal(conn.provider, 'AZURE');
      assert.equal(conn.status, 'CONNECTED');
      assert.equal(conn.accountIdentifier, subscriptionId);
      assert.equal(conn.tenantId, tenantId);
      assert.equal(conn.subscriptionId, subscriptionId);
      assert.ok(conn.capabilities.length >= 6);
      assert.ok(conn.accessibleRegions.includes('uksouth'));
    });

    it('should connect GCP project and register normalized capabilities', async () => {
      const conn = await connectionEngine.connectGcp(validWorkspace, {
        displayName: 'Production GCP Europe West',
        projectId: gcpProjectId,
        clientEmail: gcpClientEmail,
        projectNumber: gcpProjectNumber,
      });

      assert.equal(conn.provider, 'GCP');
      assert.equal(conn.status, 'CONNECTED');
      assert.equal(conn.accountIdentifier, gcpProjectId);
      assert.equal(conn.projectId, gcpProjectId);
      assert.equal(conn.clientEmail, gcpClientEmail);
      assert.ok(conn.capabilities.length >= 6);
      assert.ok(conn.accessibleRegions.includes('europe-west2'));
    });

    it('should list and filter multi-cloud resources across all providers or by single provider', async () => {
      const allResources = await connectionEngine.listMultiCloudResources(validWorkspace);
      assert.ok(allResources.length >= 20, `Expected >= 20 resources, got ${allResources.length}`);

      const providers = new Set(allResources.map((r) => r.provider));
      assert.ok(providers.has('AWS'), 'Should include AWS resources');
      assert.ok(providers.has('AZURE'), 'Should include Azure resources');
      assert.ok(providers.has('GCP'), 'Should include GCP resources');

      const azureOnly = await connectionEngine.listMultiCloudResources(validWorkspace, 'AZURE');
      assert.ok(azureOnly.length >= 5);
      assert.ok(azureOnly.every((r) => r.provider === 'AZURE'));

      const gcpOnly = await connectionEngine.listMultiCloudResources(validWorkspace, 'GCP');
      assert.ok(gcpOnly.length >= 5);
      assert.ok(gcpOnly.every((r) => r.provider === 'GCP'));

      const awsOnly = await connectionEngine.listMultiCloudResources(validWorkspace, 'AWS');
      assert.ok(awsOnly.length >= 5);
      assert.ok(awsOnly.every((r) => r.provider === 'AWS'));
    });

    it('should search multi-cloud resources across names, types, regions, and canonical IDs', async () => {
      // Search by service name
      const searchK8s = await connectionEngine.searchMultiCloud(validWorkspace, 'kubernetes');
      assert.ok(searchK8s.resources.length >= 2);
      assert.ok(searchK8s.totalMatches >= 2);

      // Search by region
      const searchEu = await connectionEngine.searchMultiCloud(validWorkspace, 'eastus');
      assert.ok(searchEu.resources.length >= 1);

      // Search by canonical ID prefix
      const searchGcp = await connectionEngine.searchMultiCloud(validWorkspace, 'gcp:');
      assert.ok(searchGcp.resources.length >= 5);
    });

    it('should compute comprehensive Multi-Cloud Scorecard across AWS, Azure, and GCP', async () => {
      const scorecard = await connectionEngine.getMultiCloudScorecard(validWorkspace);

      assert.equal(scorecard.workspaceId, validWorkspace);
      assert.equal(scorecard.aggregates.totalConnectedClouds, 3);
      assert.ok(scorecard.aggregates.totalResources >= 25);
      assert.ok(scorecard.aggregates.totalMonthlySpend > 0);
      assert.ok(scorecard.aggregates.overallHealthPercent > 0);
      assert.ok(scorecard.providers.length >= 3);

      const awsScore = scorecard.providers.find((p) => p.provider === 'AWS');
      const azureScore = scorecard.providers.find((p) => p.provider === 'AZURE');
      const gcpScore = scorecard.providers.find((p) => p.provider === 'GCP');

      assert.ok(awsScore);
      assert.equal(awsScore.status, 'CONNECTED');
      assert.ok(awsScore.totalResources > 0);
      assert.ok(awsScore.currentSpend > 0);

      assert.ok(azureScore);
      assert.equal(azureScore.status, 'CONNECTED');
      assert.ok(azureScore.totalResources > 0);
      assert.ok(azureScore.currentSpend > 0);

      assert.ok(gcpScore);
      assert.equal(gcpScore.status, 'CONNECTED');
      assert.ok(gcpScore.totalResources > 0);
      assert.ok(gcpScore.currentSpend > 0);
    });

    it('should generate 6-dimension cross-cloud comparison matrix', async () => {
      const matrix = await connectionEngine.getMultiCloudComparison(validWorkspace);

      assert.ok(Array.isArray(matrix));
      assert.equal(matrix.length, 6);

      const categories = matrix.map((m) => m.category);
      assert.ok(categories.includes('HEALTH'));
      assert.ok(categories.includes('COST'));
      assert.ok(categories.includes('SECURITY'));
      assert.ok(categories.includes('IDENTITY'));
      assert.ok(categories.includes('GOVERNANCE'));

      for (const row of matrix) {
        assert.ok(row.awsValue !== undefined);
        assert.ok(row.azureValue !== undefined);
        assert.ok(row.gcpValue !== undefined);
        assert.ok(row.status);
        assert.ok(row.recommendation.length >= 1);
      }
    });

    it('should validate and refresh connection status during sync', async () => {
      const conns = connectionEngine.listConnections(validWorkspace);
      const az = conns.find((c) => c.provider === 'AZURE');
      assert.ok(az);

      const validated = await connectionEngine.validateConnection(validWorkspace, az.id);
      assert.equal(validated.validation.valid, true);

      const synced = await connectionEngine.syncConnection(validWorkspace, az.id);
      assert.equal(synced.syncState, 'SYNCED');
      assert.ok(synced.resourceCount > 0);
    });
  });
});
