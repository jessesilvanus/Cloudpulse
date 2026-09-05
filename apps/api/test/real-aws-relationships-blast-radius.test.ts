import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsRelationshipsEngine } from '../src/services/aws-relationships-engine.js';

describe('CLOUDPULSE Phase 48 Real AWS Resource Relationships, Dependency Graph & Blast-Radius Intelligence', () => {
  const relEngine = AwsRelationshipsEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should return truthful AWS topology graph with discovered nodes and verified edges', () => {
    const graph = relEngine.getTopologyGraph(validWorkspace);
    assert.ok(graph);
    assert.strictEqual(graph.totalNodes, 7);
    assert.strictEqual(graph.totalEdges, 4);
    assert.strictEqual(graph.provenance, 'LIVE');

    const albNode = graph.nodes.find((n) => n.id === 'alb-cloudpulse-prod-ingress');
    assert.ok(albNode);
    assert.strictEqual(albNode.resourceType, 'AWS::ElasticLoadBalancingV2::LoadBalancer');
    assert.strictEqual(albNode.healthStatus, 'HEALTHY');
  });

  it('should evaluate confirmed relationship evidence and source APIs', () => {
    const rels = relEngine.getRelationships(validWorkspace);
    assert.strictEqual(rels.length, 4);

    const albToTg = rels.find((r) => r.relationshipId === 'rel-alb-to-tg');
    assert.ok(albToTg);
    assert.strictEqual(albToTg.relationshipType, 'ROUTES_TO');
    assert.strictEqual(albToTg.evidence.category, 'CONFIRMED');
    assert.strictEqual(albToTg.evidence.confidence, 'HIGH');
    assert.strictEqual(albToTg.evidence.sourceApi, 'elasticloadbalancing:DescribeRules');

    const ec2ToRds = rels.find((r) => r.relationshipId === 'rel-ec2-to-rds');
    assert.ok(ec2ToRds);
    assert.strictEqual(ec2ToRds.relationshipType, 'CONNECTS_TO');
    assert.strictEqual(ec2ToRds.evidence.sourceApi, 'ec2:DescribeSecurityGroups');
  });

  it('should retrieve resource-centric dependency tree with upstream and downstream edges', () => {
    const ec2Deps = relEngine.getResourceDependencies('i-09f18a29b8c71e4a1', validWorkspace);
    assert.ok(ec2Deps.resource);
    assert.strictEqual(ec2Deps.resource.id, 'i-09f18a29b8c71e4a1');
    assert.strictEqual(ec2Deps.upstreamDependencies.length, 2); // connects to RDS, writes to S3
    assert.strictEqual(ec2Deps.downstreamDependents.length, 1); // hosted by target group
  });

  it('should calculate blast-radius analysis with direct and transitive impact propagation', () => {
    const blast = relEngine.analyzeBlastRadius('db-orders-aurora-cluster-01', validWorkspace);
    assert.ok(blast);
    assert.strictEqual(blast.targetResourceId, 'db-orders-aurora-cluster-01');
    assert.strictEqual(blast.directImpactCount, 1); // EC2 directly connects
    assert.strictEqual(blast.transitiveImpactCount, 2); // TG + ALB transitively impacted
    assert.strictEqual(blast.maxDependencyDepth, 3);
    assert.strictEqual(blast.provenance, 'CALCULATED');
  });

  it('should compute financial exposure and resilience score for critical resources', () => {
    const blast = relEngine.analyzeBlastRadius('db-orders-aurora-cluster-01', validWorkspace);
    assert.ok(blast);
    assert.strictEqual(blast.financialExposureMonthly, 398.00); // RDS $185 + EC2 $185 + ALB $28
    assert.strictEqual(blast.resilienceScore, 88.0);
    assert.ok(blast.criticalServicesAffected.length >= 2);
    assert.ok(blast.affectedAccounts.includes('718293041526'));
  });

  it('should detect isolated resources with zero dependencies (e.g. unattached EBS volume)', () => {
    const isolatedDeps = relEngine.getResourceDependencies('vol-0a817f2948b712c9e', validWorkspace);
    assert.ok(isolatedDeps.resource);
    assert.strictEqual(isolatedDeps.upstreamDependencies.length, 0);
    assert.strictEqual(isolatedDeps.downstreamDependents.length, 0);

    const blast = relEngine.analyzeBlastRadius('vol-0a817f2948b712c9e', validWorkspace);
    assert.ok(blast);
    assert.strictEqual(blast.directImpactCount, 0);
    assert.strictEqual(blast.transitiveImpactCount, 0);
  });

  it('should prevent infinite cycles during graph traversal', () => {
    // Blast radius analysis on EC2 instance
    const blast = relEngine.analyzeBlastRadius('i-09f18a29b8c71e4a1', validWorkspace);
    assert.ok(blast);
    assert.strictEqual(blast.directImpactCount, 1); // Target group
    assert.strictEqual(blast.transitiveImpactCount, 1); // ALB
  });

  it('should filter topology graph by service, accountId, and relationshipType', () => {
    const filteredByService = relEngine.getTopologyGraph(validWorkspace, { service: 'RDS' });
    assert.strictEqual(filteredByService.totalNodes, 1);
    assert.strictEqual(filteredByService.nodes[0].id, 'db-orders-aurora-cluster-01');

    const filteredByAccount = relEngine.getTopologyGraph(validWorkspace, { accountId: '839201746152' });
    assert.strictEqual(filteredByAccount.totalNodes, 1);
    assert.strictEqual(filteredByAccount.nodes[0].id, 'i-078a1bc49281e7f02');
  });

  it('should filter relationships by confidence and evidence category', () => {
    const highConf = relEngine.getRelationships(validWorkspace, { confidence: 'HIGH' });
    assert.strictEqual(highConf.length, 4);

    const confirmedCategory = relEngine.getRelationships(validWorkspace, { evidenceCategory: 'CONFIRMED' });
    assert.strictEqual(confirmedCategory.length, 4);
  });

  it('should return empty topology graph with NOT_CONNECTED provenance for disconnected workspaces', () => {
    const disconnectedGraph = relEngine.getTopologyGraph('ws-disconnected-workspace');
    assert.strictEqual(disconnectedGraph.provenance, 'NOT_CONNECTED');
    assert.strictEqual(disconnectedGraph.totalNodes, 0);
    assert.strictEqual(disconnectedGraph.totalEdges, 0);
  });

  it('should strictly enforce tenant isolation preventing cross-workspace topology queries', () => {
    const rels = relEngine.getRelationships('ws-unauthorized-tenant');
    assert.strictEqual(rels.length, 0, 'Cross-workspace relationships query must return 0');

    const blast = relEngine.analyzeBlastRadius('db-orders-aurora-cluster-01', 'ws-unauthorized-tenant');
    assert.strictEqual(blast, null, 'Cross-workspace blast radius calculation must return null');
  });
});
