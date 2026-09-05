import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AwsCloudQueryEngine } from '../src/services/aws-cloud-query-engine.js';
import type { CloudQueryAst } from '@cloudpulse/shared';

describe('CLOUDPULSE Phase 59 Real AWS Cloud Graph Query Engine & Natural-Language Investigation', () => {
  const queryEngine = AwsCloudQueryEngine.getInstance();
  const validWorkspace = 'ws-production';
  const invalidWorkspace = 'ws-unauthorized-tenant';

  it('should validate AST and reject missing primaryEntityType, excessive limits, and invalid depth', () => {
    // Valid AST
    const validAst: CloudQueryAst = {
      primaryEntityType: 'RESOURCE',
      filters: [{ field: 'region', operator: 'EQUALS', value: 'us-east-1' }],
      limit: 50,
      maxTraversalDepth: 3
    };
    const validValidation = queryEngine.validateAst(validAst);
    assert.equal(validValidation.isValid, true);
    assert.equal(validValidation.error, undefined);

    // Missing primary entity type
    const missingEntityAst = {
      filters: [{ field: 'region', operator: 'EQUALS', value: 'us-east-1' }]
    } as unknown as CloudQueryAst;
    const missingValidation = queryEngine.validateAst(missingEntityAst);
    assert.equal(missingValidation.isValid, false);
    assert.ok(missingValidation.error?.includes('primaryEntityType is required'));

    // Excessive limit (> 100)
    const excessiveLimitAst: CloudQueryAst = {
      primaryEntityType: 'RESOURCE',
      limit: 500
    };
    const limitValidation = queryEngine.validateAst(excessiveLimitAst);
    assert.equal(limitValidation.isValid, false);
    assert.ok(limitValidation.error?.includes('limit must be between 1 and 100'));

    // Excessive depth (> 5)
    const excessiveDepthAst: CloudQueryAst = {
      primaryEntityType: 'RESOURCE',
      maxTraversalDepth: 6
    };
    const depthValidation = queryEngine.validateAst(excessiveDepthAst);
    assert.equal(depthValidation.isValid, false);
    assert.ok(depthValidation.error?.includes('maxTraversalDepth must be between 1 and 5'));
  });

  it('should generate an explain plan detailing execution steps and complexity metrics', () => {
    const ast: CloudQueryAst = {
      primaryEntityType: 'RESOURCE',
      filters: [
        { field: 'criticality', operator: 'EQUALS', value: 'CRITICAL' },
        { field: 'riskScore', operator: 'GREATER_THAN', value: 50 }
      ],
      relationships: [
        {
          relationshipType: 'VIOLATES',
          targetNodeType: 'CONTROL',
          depthLimit: 2
        }
      ],
      limit: 10
    };

    const explainPlan = queryEngine.generateExplainPlan(validWorkspace, ast);

    assert.ok(explainPlan.steps.length >= 4, `Expected at least 4 steps, got ${explainPlan.steps.length}`);
    assert.ok(explainPlan.steps.some((s) => s.operation === 'INDEX_SCAN'));
    assert.ok(explainPlan.steps.some((s) => s.operation === 'FILTER_APPLY'));
    assert.ok(explainPlan.steps.some((s) => s.operation === 'RELATIONSHIP_JOIN'));
    assert.ok(explainPlan.steps.some((s) => s.operation === 'EVIDENCE_AGGREGATION'));
    assert.ok(explainPlan.recordsExamined > 0);
    assert.ok(explainPlan.estimatedExecutionCost.length > 0);
  });

  it('should safely execute structured AST query and filter resources by field predicates', () => {
    const ast: CloudQueryAst = {
      primaryEntityType: 'RESOURCE',
      filters: [
        { field: 'criticality', operator: 'EQUALS', value: 'CRITICAL' }
      ],
      limit: 10
    };

    const result = queryEngine.executeQuery(validWorkspace, ast, 'VISUAL_BUILDER');

    assert.ok(result.nodes.length >= 2, `Expected at least 2 critical nodes, got ${result.nodes.length}`);
    assert.ok(result.nodes.every((n) => n.criticality === 'CRITICAL'));
    assert.ok(result.executionTimeMs >= 0);
    assert.equal(result.coverageStatus, 'FULL_COVERAGE');
    assert.equal(result.provenance, 'CALCULATED');
    assert.ok(result.evidence.length > 0);
  });

  it('should traverse multi-hop relationships across security controls and drift', () => {
    // Find resources that VIOLATE controls
    const ast: CloudQueryAst = {
      primaryEntityType: 'RESOURCE',
      relationships: [
        {
          relationshipType: 'VIOLATES',
          depthLimit: 2
        }
      ],
      limit: 20
    };

    const result = queryEngine.executeQuery(validWorkspace, ast, 'STRUCTURED');

    assert.ok(result.nodes.length >= 2, `Expected at least 2 nodes violating controls, got ${result.nodes.length}`);
    assert.ok(result.edges.some((e) => e.relationshipType === 'VIOLATES'));
    assert.ok(result.evidence.some((ev) => ev.evidenceStrength === 'CONFIRMED'));
  });

  it('should enforce strict tenant isolation and return empty node sets for unauthorized workspace', () => {
    const ast: CloudQueryAst = {
      primaryEntityType: 'RESOURCE',
      limit: 50
    };

    const result = queryEngine.executeQuery(invalidWorkspace, ast, 'NATURAL_LANGUAGE');

    assert.equal(result.nodes.length, 0);
    assert.equal(result.edges.length, 0);
    assert.deepEqual(result.nodes, []);
    assert.deepEqual(result.edges, []);
    assert.equal(result.coverageStatus, 'PERMISSION_REQUIRED');
  });

  it('should translate natural language prompt into AST and return evidence-backed findings', () => {
    const prompt = 'Show all production resources exposed to the internet or violating controls';
    const nlResponse = queryEngine.investigateNaturalLanguage(validWorkspace, prompt);

    assert.equal(nlResponse.prompt, prompt);
    assert.equal(nlResponse.intent, 'PUBLIC_EXPOSURE_SEARCH');
    assert.ok(nlResponse.translatedAst !== undefined);
    assert.ok(nlResponse.queryResult.nodes.length > 0);
    assert.ok(nlResponse.explanation.length > 20);
    assert.ok(nlResponse.evidenceSummary.length >= 2);
    assert.equal(nlResponse.confidence, 'HIGH');
    assert.equal(nlResponse.provenance, 'CALCULATED');

    // Verify S3 bucket is found in query results
    assert.ok(
      nlResponse.queryResult.nodes.some((n) => n.id === 's3-cloudpulse-prod-audit-logs-2026'),
      'Expected S3 audit bucket in query result nodes'
    );
  });

  it('should produce honest response with comprehensive findings for general risk query', () => {
    const prompt = 'Comprehensive security assessment of estate';
    const nlResponse = queryEngine.investigateNaturalLanguage(validWorkspace, prompt);

    assert.ok(nlResponse.queryResult.nodes.length > 0);
    assert.ok(nlResponse.explanation.length > 0);
    assert.equal(nlResponse.provenance, 'CALCULATED');
  });

  it('should support full investigation case lifecycle from creation to status progression', () => {
    // 1. Create Investigation
    const investigation = queryEngine.createInvestigation(validWorkspace, {
      title: 'S3 Public Exposure Deep Dive',
      description: 'Investigating unblocked public access on audit bucket and associated blast radius',
      severity: 'HIGH',
      scope: 'AWS Production Estate',
      createdBy: 'usr-lead-sre'
    });

    assert.ok(investigation.id.startsWith('inv-'));
    assert.equal(investigation.status, 'OPEN');
    assert.equal(investigation.severity, 'HIGH');
    assert.equal(investigation.timeline.length, 1);
    assert.equal(investigation.timeline[0]?.title, 'Investigation Case Opened');

    // 2. Add Timeline Event
    const updatedWithEvent = queryEngine.addTimelineEvent(validWorkspace, investigation.id, {
      type: 'EVIDENCE',
      title: 'Evidence Attached',
      description: 'Attached query result showing bucket ACL drift and IAM role permissions',
      source: 'CloudPulse Investigation Engine',
      entityId: 's3-cloudpulse-prod-audit-logs-2026'
    });
    assert.ok(updatedWithEvent !== null);
    assert.equal(updatedWithEvent?.timeline.length, 2);

    // 3. Update Status to HYPOTHESIS_FORMED
    const hypothesisStatus = queryEngine.updateInvestigationStatus(
      validWorkspace,
      investigation.id,
      'HYPOTHESIS_FORMED',
      'Bucket was exposed due to manual ACL override in CI pipeline'
    );
    assert.ok(hypothesisStatus !== null);
    assert.equal(hypothesisStatus?.status, 'HYPOTHESIS_FORMED');
    assert.equal(hypothesisStatus?.rootCauseHypothesis, 'Bucket was exposed due to manual ACL override in CI pipeline');

    // 4. Update Status to DECISION_READY
    const decisionReadyStatus = queryEngine.updateInvestigationStatus(
      validWorkspace,
      investigation.id,
      'DECISION_READY'
    );
    assert.ok(decisionReadyStatus !== null);
    assert.equal(decisionReadyStatus?.status, 'DECISION_READY');
  });

  it('should generate comprehensive executive investigation report', () => {
    const list = queryEngine.getInvestigations(validWorkspace);
    assert.ok(list.length > 0);
    const targetInv = list[0]!;

    const report = queryEngine.generateInvestigationReport(validWorkspace, targetInv.id);

    assert.ok(report !== null);
    assert.equal(report?.investigation.id, targetInv.id);
    assert.ok(report!.executiveSummary.length > 30);
    assert.ok(report!.findings.length > 0);
    assert.ok(report!.recommendedActions.length > 0);
    assert.ok(report!.riskPathSummary.length > 0);
    assert.equal(report!.provenance, 'CALCULATED');
  });

  it('should convert investigation findings into a Phase 57 Governance Decision', () => {
    const inv = queryEngine.createInvestigation(validWorkspace, {
      title: 'Aurora DB Overprivileged Access',
      description: 'Audit of role privileges for production database',
      severity: 'CRITICAL',
      scope: 'Live AWS Estate'
    });

    const decisionResult = queryEngine.convertInvestigationToDecision(
      validWorkspace,
      inv.id
    );

    assert.equal(decisionResult.success, true);
    assert.ok(decisionResult.decisionId?.startsWith('dec-'));

    // Verify investigation was updated with linked decision ID
    const updatedInv = queryEngine.getInvestigationById(validWorkspace, inv.id);
    assert.equal(updatedInv?.decisionId, decisionResult.decisionId);
    assert.equal(updatedInv?.status, 'DECISION_READY');
  });

  it('should provide pre-built query suggestion templates and log query history', () => {
    const suggestions = queryEngine.getQuerySuggestions(validWorkspace);
    assert.ok(suggestions.length >= 5, `Expected at least 5 suggestions, got ${suggestions.length}`);
    assert.ok(suggestions.some((s) => s.category.includes('SECURITY')));
    assert.ok(suggestions.some((s) => s.category.includes('IAM')));
    assert.ok(suggestions.some((s) => s.category.includes('INCIDENT')));
    assert.ok(suggestions.some((s) => s.category.includes('FINOPS')));

    const history = queryEngine.getQueryHistory(validWorkspace);
    assert.ok(Array.isArray(history));
    assert.ok(history.length > 0, 'Expected query history to contain executed queries');
  });
});
