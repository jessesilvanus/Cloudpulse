import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MultiCloudEngine } from '../src/services/multicloud-engine.js';

describe('CLOUDPULSE Phase 12 Multi-Cloud & Provider Abstraction Engine', () => {
  const multiCloudEngine = MultiCloudEngine.getInstance();

  it('should generate multi-cloud summary metrics with truthful connection status', () => {
    const summary = multiCloudEngine.getSummary();
    assert.strictEqual(summary.totalProvidersCount, 3);
    assert.strictEqual(summary.connectedProvidersCount, 1); // AWS connected, Azure/GCP demo
    assert.ok(summary.totalResourcesCount >= 3);
    assert.ok(summary.totalComputeInstances >= 2);
    assert.ok(summary.totalKubernetesClusters >= 2);
    assert.ok(summary.portabilityScore >= 80);
    assert.deepStrictEqual(summary.activeCloudProviders, ['aws', 'azure', 'gcp']);
  });

  it('should list cloud accounts with honest status labeling', () => {
    const accounts = multiCloudEngine.getAccounts();
    assert.strictEqual(accounts.length, 3);

    const aws = accounts.find((a) => a.provider === 'aws');
    assert.ok(aws);
    assert.strictEqual(aws.status, 'connected');

    const azure = accounts.find((a) => a.provider === 'azure');
    assert.ok(azure);
    assert.strictEqual(azure.status, 'demo');

    const gcp = accounts.find((a) => a.provider === 'gcp');
    assert.ok(gcp);
    assert.strictEqual(gcp.status, 'demo');
  });

  it('should provide comprehensive capability matrices across all cloud providers', () => {
    const capabilities = multiCloudEngine.getCapabilities();
    assert.strictEqual(capabilities.length, 3);

    const awsCaps = capabilities.find((c) => c.provider === 'aws');
    assert.ok(awsCaps);
    assert.strictEqual(awsCaps.compute, 'supported');
    assert.strictEqual(awsCaps.kubernetes, 'supported');
    assert.strictEqual(awsCaps.cost, 'supported');

    const azureCaps = capabilities.find((c) => c.provider === 'azure');
    assert.ok(azureCaps);
    assert.strictEqual(azureCaps.cost, 'unavailable');
  });

  it('should query normalized cloud resources with provider filtering', () => {
    const allResources = multiCloudEngine.getResources();
    assert.ok(allResources.length >= 4);

    const awsResources = multiCloudEngine.getResources('aws');
    assert.ok(awsResources.every((r) => r.provider === 'aws'));
    assert.ok(awsResources.some((r) => r.resourceType === 'kubernetes'));

    const azureResources = multiCloudEngine.getResources('azure');
    assert.ok(azureResources.every((r) => r.provider === 'azure'));
  });

  it('should query normalized compute, storage, networking, and kubernetes models', () => {
    const compute = multiCloudEngine.getCompute();
    assert.ok(compute.length >= 3);
    assert.ok(compute[0].instanceType);
    assert.ok(compute[0].vCpu > 0);

    const storage = multiCloudEngine.getStorage();
    assert.ok(storage.length >= 2);
    assert.ok(storage[0].capacityGb > 0);

    const networking = multiCloudEngine.getNetworking();
    assert.ok(networking.length >= 2);
    assert.ok(networking[0].cidrBlock);

    const k8s = multiCloudEngine.getKubernetesClusters();
    assert.ok(k8s.length >= 3);
    assert.ok(k8s.some((c) => c.platformType === 'eks'));
    assert.ok(k8s.some((c) => c.platformType === 'aks'));
    assert.ok(k8s.some((c) => c.platformType === 'gke'));
  });

  it('should calculate cloud portability score and evaluate vendor lock-in risk', () => {
    const portability = multiCloudEngine.getPortabilityScore();
    assert.ok(portability.overallScore >= 80);
    assert.strictEqual(portability.grade, 'A');
    assert.strictEqual(portability.containerPortabilityScore, 100);
    assert.strictEqual(portability.lockInRisk, 'low');
  });

  it('should generate structured workload migration assessments', () => {
    const migration = multiCloudEngine.getMigrationAssessment();
    assert.ok(migration.workloadName);
    assert.strictEqual(migration.sourceProvider, 'aws');
    assert.strictEqual(migration.targetProvider, 'gcp');
    assert.strictEqual(migration.estimatedComplexity, 'low');
    assert.ok(migration.portabilityPercent >= 90);
    assert.ok(migration.portableComponents.length >= 3);
    assert.ok(migration.recommendedSteps.length >= 3);
  });
});
