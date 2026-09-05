import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AwsKnowledgeGraphEngine } from '../src/services/aws-knowledge-graph-engine.js';

describe('CLOUDPULSE Phase 58 Real AWS Governance Knowledge Graph & Cross-Domain Risk Intelligence', () => {
  const graphEngine = AwsKnowledgeGraphEngine.getInstance();
  const validWorkspace = 'ws-production';
  const invalidWorkspace = 'ws-unauthorized-tenant';

  it('should return comprehensive knowledge graph summary for connected production workspace', () => {
    const summary = graphEngine.getKnowledgeGraphSummary(validWorkspace);

    assert.equal(summary.workspaceId, validWorkspace);
    assert.ok(summary.nodeCount >= 20, `Expected at least 20 nodes, got ${summary.nodeCount}`);
    assert.ok(summary.edgeCount >= 20, `Expected at least 20 edges, got ${summary.edgeCount}`);
    assert.ok(summary.criticalNodesCount >= 3, `Expected at least 3 critical nodes, got ${summary.criticalNodesCount}`);
    assert.ok(summary.riskConcentration.length > 0, 'Expected non-empty risk concentration breakdown');
    assert.equal(summary.provenance, 'CALCULATED');

    // Check presence of key entities
    const resourceNodes = summary.nodes.filter((n) => n.type === 'RESOURCE');
    assert.ok(resourceNodes.some((r) => r.id === 's3-cloudpulse-prod-audit-logs-2026'));
    assert.ok(resourceNodes.some((r) => r.id === 'i-08f331920acb119a0'));
    assert.ok(resourceNodes.some((r) => r.id === 'db-orders-aurora-cluster-01'));
  });

  it('should enforce tenant isolation and return empty summary for unauthorized workspace', () => {
    const summary = graphEngine.getKnowledgeGraphSummary(invalidWorkspace);

    assert.equal(summary.workspaceId, invalidWorkspace);
    assert.equal(summary.nodeCount, 0);
    assert.equal(summary.edgeCount, 0);
    assert.equal(summary.criticalNodesCount, 0);
    assert.deepEqual(summary.nodes, []);
    assert.deepEqual(summary.edges, []);
  });

  it('should query knowledge graph nodes filtered by domain and criticality', () => {
    const identityNodes = graphEngine.getNodes(validWorkspace, { type: 'IDENTITY' });
    assert.ok(identityNodes.length >= 2, 'Expected at least 2 identity nodes');
    assert.ok(identityNodes.every((n) => n.type === 'IDENTITY'));

    const criticalNodes = graphEngine.getNodes(validWorkspace, { criticality: 'CRITICAL' });
    assert.ok(criticalNodes.length >= 3, 'Expected at least 3 critical nodes');
    assert.ok(criticalNodes.every((n) => n.criticality === 'CRITICAL'));

    const highRiskNodes = graphEngine.getNodes(validWorkspace, { minRiskScore: 70 });
    assert.ok(highRiskNodes.length >= 4, 'Expected at least 4 high-risk nodes');
    assert.ok(highRiskNodes.every((n) => n.riskScore >= 70));
  });

  it('should query knowledge graph edges filtered by relationshipType and evidence strength', () => {
    const driftEdges = graphEngine.getEdges(validWorkspace, { relationshipType: 'DRIFTS_FROM' });
    assert.ok(driftEdges.length >= 2, 'Expected at least 2 DRIFTS_FROM edges');
    assert.ok(driftEdges.every((e) => e.relationshipType === 'DRIFTS_FROM'));
    assert.ok(driftEdges.every((e) => e.evidenceStrength === 'CONFIRMED'));

    const violatesEdges = graphEngine.getEdges(validWorkspace, { relationshipType: 'VIOLATES' });
    assert.ok(violatesEdges.length >= 2, 'Expected at least 2 VIOLATES edges');

    const confirmedEdges = graphEngine.getEdges(validWorkspace, { evidenceStrength: 'CONFIRMED' });
    assert.ok(confirmedEdges.length >= 10, 'Expected at least 10 CONFIRMED edges');
  });

  it('should find shortest risk and dependency path between connected nodes using BFS', () => {
    // Path from CI bot -> S3 Bucket (via Change and Drift)
    const result = graphEngine.findPath(
      validWorkspace,
      'chg-2026-09-03-s3-bucket-acl',
      's3-cloudpulse-prod-audit-logs-2026'
    );

    assert.equal(result.pathFound, true);
    assert.ok(result.path !== null);
    assert.ok(result.path!.totalHops >= 1, `Expected at least 1 hop, got ${result.path!.totalHops}`);
    assert.ok(result.path!.nodes.length >= 2);
    assert.ok(result.path!.overallRisk > 0);
    assert.equal(result.provenance, 'CALCULATED');
  });

  it('should find multi-hop path from IAM identity to database asset through compute instance', () => {
    // Alex DevOps -> Workload Role -> Staging Runner -> Aurora DB
    const result = graphEngine.findPath(
      validWorkspace,
      'usr-admin-alex',
      'db-orders-aurora-cluster-01'
    );

    assert.equal(result.pathFound, true);
    assert.ok(result.path !== null);
    assert.ok(result.path!.totalHops >= 3, `Expected at least 3 hops, got ${result.path!.totalHops}`);
    assert.equal(result.path!.nodes[0]?.id, 'usr-admin-alex');
    assert.equal(result.path!.nodes[result.path!.nodes.length - 1]?.id, 'db-orders-aurora-cluster-01');
  });

  it('should return 360-degree resource risk profile for S3 audit bucket', () => {
    const profile = graphEngine.getResourceRiskProfile(
      validWorkspace,
      's3-cloudpulse-prod-audit-logs-2026'
    );

    assert.ok(profile !== null, 'Expected non-null profile');
    assert.equal(profile.resourceId, 's3-cloudpulse-prod-audit-logs-2026');
    assert.equal(profile.service, 'S3');
    assert.ok(profile.compositeRiskScore >= 70);
    assert.equal(profile.criticality, 'CRITICAL');
    assert.ok(profile.riskFactors.length > 0);
    assert.ok(profile.protectingControls.length > 0);
    assert.ok(profile.violatingPolicies.length > 0);
    assert.ok(profile.activeDrifts.length > 0);
    assert.ok(profile.securityFindings.length > 0);
    assert.ok(profile.governanceDecisions.length > 0);
    assert.ok(profile.suggestedRemediations.length > 0);
    assert.equal(profile.provenance, 'CALCULATED');
  });

  it('should return 360-degree resource risk profile for EC2 workload runner', () => {
    const profile = graphEngine.getResourceRiskProfile(
      validWorkspace,
      'i-08f331920acb119a0'
    );

    assert.ok(profile !== null, 'Expected non-null profile');
    assert.equal(profile.resourceId, 'i-08f331920acb119a0');
    assert.equal(profile.service, 'EC2');
    assert.ok(profile.compositeRiskScore >= 70);
    assert.ok(profile.downstreamImpacts.length > 0);
    assert.ok(profile.historicalChanges.length > 0);
    assert.ok(profile.costTrend.length > 0);
  });

  it('should compute structural graph diff against historical state', () => {
    const diff = graphEngine.getGraphDiff(validWorkspace);

    assert.equal(diff.workspaceId, validWorkspace);
    assert.ok(diff.addedNodes.length > 0);
    assert.ok(diff.modifiedNodes.length > 0);
    assert.ok(diff.addedEdges.length > 0);
    assert.equal(diff.provenance, 'CALCULATED');
  });

  it('should handle non-existent node paths and non-existent resource profiles gracefully', () => {
    const nullProfile = graphEngine.getResourceRiskProfile(
      validWorkspace,
      'non-existent-resource-id-999'
    );
    assert.equal(nullProfile, null);

    const emptyPath = graphEngine.findPath(
      validWorkspace,
      'non-existent-source',
      'non-existent-target'
    );
    assert.equal(emptyPath.pathFound, false);
    assert.equal(emptyPath.path, null);

    const unauthPath = graphEngine.findPath(
      invalidWorkspace,
      'usr-admin-alex',
      'db-orders-aurora-cluster-01'
    );
    assert.equal(unauthPath.pathFound, false);
    assert.equal(unauthPath.path, null);
  });
});
