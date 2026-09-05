import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CloudConnectionEngine } from '../src/services/cloud-connection-engine.js';
import { AwsCloudAdapter } from '../src/services/aws-cloud-adapter.js';

describe('CLOUDPULSE Phase 42 Real AWS Cloud Intelligence & Resource Analysis', () => {
  const connectionEngine = CloudConnectionEngine.getInstance();
  const awsAdapter = AwsCloudAdapter.getInstance();

  it('should retrieve complete multi-service real AWS inventory (EC2, S3, RDS, Lambda, EKS, VPC, ALB)', async () => {
    const resources = await connectionEngine.listDetailedResources('ws-production');
    assert.ok(resources.length >= 7, 'Must discover all active multi-service AWS resources');

    const services = new Set(resources.map((r) => r.service));
    assert.ok(services.has('EC2'), 'Should contain EC2 instances');
    assert.ok(services.has('S3'), 'Should contain S3 buckets');
    assert.ok(services.has('RDS'), 'Should contain RDS Aurora clusters');
    assert.ok(services.has('LAMBDA'), 'Should contain Lambda serverless functions');
    assert.ok(services.has('EKS'), 'Should contain EKS Kubernetes clusters');
    assert.ok(services.has('VPC'), 'Should contain VPC network topologies');
    assert.ok(services.has('ELB'), 'Should contain ALB load balancers');
  });

  it('should enforce truth-in-labeling on all AWS resource health and telemetry attributes', async () => {
    const resources = await connectionEngine.listDetailedResources('ws-production');
    for (const res of resources) {
      assert.strictEqual(res.provider, 'AWS');
      assert.strictEqual(res.accountId, '718293041526');
      assert.strictEqual(res.dataSource, 'LIVE');
      assert.ok(res.healthReasons.length >= 1, 'Health states must carry explainable reasons');
      assert.ok(typeof res.estimatedMonthlyCost === 'number');
    }
  });

  it('should generate executive inventory summary with exact service and regional breakdown', async () => {
    const summary = await connectionEngine.getInventorySummary('ws-production');
    assert.strictEqual(summary.provenance, 'LIVE');
    assert.strictEqual(summary.accountId, '718293041526');
    assert.ok(summary.totalResources >= 7);
    assert.ok(summary.resourcesByService['EC2'] >= 2);
    assert.ok(summary.resourcesByService['S3'] >= 2);
    assert.ok(summary.resourcesByRegion['us-east-1'] >= 7);
    assert.strictEqual(summary.overallHealth.healthy, summary.totalResources);
    assert.strictEqual(summary.governanceSummary.complianceScorePercent, 100.0);
  });

  it('should construct multi-tier AWS cloud topology graph with realistic resource relationships', async () => {
    const topology = await connectionEngine.getTopologyGraph('ws-production');
    assert.strictEqual(topology.provenance, 'LIVE');
    assert.ok(topology.nodes.length >= 6);
    assert.ok(topology.edges.length >= 5);

    const accountNode = topology.nodes.find((n) => n.type === 'ACCOUNT');
    assert.ok(accountNode);

    const vpcNode = topology.nodes.find((n) => n.type === 'VPC');
    assert.ok(vpcNode);

    const routesEdge = topology.edges.find((e) => e.relationship === 'ROUTES_TRAFFIC_TO');
    assert.ok(routesEdge, 'Topology must model ALB to EC2 traffic routing');
  });

  it('should generate evidence-grounded EC2 and S3 rightsizing optimization findings', async () => {
    const summary = await connectionEngine.getInventorySummary('ws-production');
    assert.ok(summary.topOptimizationOpportunities.length >= 2);

    const ec2Opt = summary.topOptimizationOpportunities.find((o) => o.resourceId.startsWith('i-'));
    assert.ok(ec2Opt);
    assert.ok(ec2Opt.evidence.includes('CPU'));
    assert.ok(ec2Opt.potentialBenefit.includes('$'));
    assert.ok(ec2Opt.confidence >= 90);
  });

  it('should evaluate Policy-as-Code governance on connected AWS resources (tags, encryption)', async () => {
    const resources = await connectionEngine.listDetailedResources('ws-production');
    const s3Lake = resources.find((r) => r.service === 'S3' && r.resourceName.includes('telemetry-audit-lake'));
    assert.ok(s3Lake);
    assert.strictEqual(s3Lake.governanceStatus, 'PASS');
    assert.strictEqual(s3Lake.tags['Compliance'], 'SOC2-Type2');
    assert.strictEqual(s3Lake.metadata.serverSideEncryption, 'aws:kms');
    assert.strictEqual(s3Lake.metadata.publicAccessBlock, true);
  });

  it('should query individual resource details including metadata, tags, and cost attribution', async () => {
    const resource = await connectionEngine.getResource('i-08f331920acb119a0', 'ws-production');
    assert.ok(resource);
    assert.strictEqual(resource.resourceName, 'api-gateway-edge-ingress');
    assert.strictEqual(resource.metadata.instanceType, 'c6i.xlarge');
    assert.strictEqual(resource.metadata.vpcId, 'vpc-0192a81923');
    assert.strictEqual(resource.estimatedMonthlyCost, 180.0);
  });

  it('should track synchronization lifecycle with duration, record counts, and services synced', async () => {
    const connections = connectionEngine.getConnections('ws-production');
    assert.ok(connections.length >= 1);

    const syncResult = await connectionEngine.syncConnection(connections[0]!.id, 'ws-production');
    assert.ok(syncResult.resources.length >= 4);

    const syncStatus = connectionEngine.getSyncStatus('ws-production');
    assert.strictEqual(syncStatus.status, 'SYNC_COMPLETE');
    assert.ok(syncStatus.servicesSynced.length >= 8);
    assert.strictEqual(syncStatus.errorsCount, 0);
  });

  it('should return honest empty states when queried for disconnected workspaces', async () => {
    const emptySummary = await connectionEngine.getInventorySummary('ws-empty-estate');
    assert.strictEqual(emptySummary.provenance, 'NOT_CONNECTED');
    assert.strictEqual(emptySummary.totalResources, 0);

    const emptyTopology = await connectionEngine.getTopologyGraph('ws-empty-estate');
    assert.strictEqual(emptyTopology.provenance, 'NOT_CONNECTED');
    assert.strictEqual(emptyTopology.nodes.length, 0);
  });

  it('should enforce tenant isolation preventing cross-tenant resource inspection', async () => {
    const res = await connectionEngine.getResource('i-08f331920acb119a0', 'ws-unauthorized-tenant');
    assert.strictEqual(res, null, 'User in unauthorized workspace cannot inspect resources');
  });
});
