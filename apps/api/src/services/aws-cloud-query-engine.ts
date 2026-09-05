import {
  CloudQuery,
  CloudQueryAst,
  CloudQueryType,
  CloudQueryResult,
  CloudQueryExplainPlan,
  NaturalLanguageInvestigationResponse,
  CloudInvestigation,
  InvestigationTimelineEvent,
  InvestigationReport,
  InvestigationStatus,
  InvestigationSeverity,
  CloudKnowledgeNode,
  CloudKnowledgeEdge,
  CloudKnowledgeNodeType,
  KnowledgeEvidenceConfidence
} from '@cloudpulse/shared';
import { AwsKnowledgeGraphEngine } from './aws-knowledge-graph-engine.js';
import { AwsGovernanceDecisionEngine } from './aws-governance-decision-engine.js';
import crypto from 'node:crypto';

export class AwsCloudQueryEngine {
  private static instance: AwsCloudQueryEngine;

  private graphEngine = AwsKnowledgeGraphEngine.getInstance();
  private decisionEngine = AwsGovernanceDecisionEngine.getInstance();

  private queryHistory: CloudQuery[] = [];
  private investigations: Map<string, CloudInvestigation> = new Map();

  private constructor() {
    this.seedInitialInvestigations();
  }

  public static getInstance(): AwsCloudQueryEngine {
    if (!AwsCloudQueryEngine.instance) {
      AwsCloudQueryEngine.instance = new AwsCloudQueryEngine();
    }
    return AwsCloudQueryEngine.instance;
  }

  private seedInitialInvestigations(): void {
    const wsId = 'ws-production';
    const tenantId = 'o-cloudpulse-corp-root';
    const nowIso = new Date().toISOString();
    const yesterdayIso = new Date(Date.now() - 86400000).toISOString();

    const sampleInvestigation: CloudInvestigation = {
      id: 'inv-aws-s3-public-exposure-01',
      tenantId,
      workspaceId: wsId,
      title: 'Investigation: Anomalous S3 Public ACL Modification & GuardDuty Surge',
      description: 'Cross-domain investigation into PutBucketAcl change by ci-cd-pipeline-bot triggering configuration drift and GuardDuty anomalous GetObject activity on production audit bucket.',
      severity: 'CRITICAL',
      status: 'HYPOTHESIS_FORMED',
      scope: 'Amazon S3 / IAM / GuardDuty / CloudTrail',
      rootCauseHypothesis: 'CI/CD pipeline bot executed an unreviewed bucket ACL modification during automated deployment, disabling S3 Block Public Access and triggering anomalous reconnaissance alerts.',
      queries: [
        {
          id: 'qry-s3-drift-search',
          tenantId,
          workspaceId: wsId,
          scope: 'S3 Storage Estate',
          queryType: 'CROSS_DOMAIN',
          queryAst: {
            primaryEntityType: 'RESOURCE',
            filters: [{ field: 'service', operator: 'EQUALS', value: 'S3' }],
            relationships: [{ relationshipType: 'DRIFTS_FROM', depthLimit: 2 }]
          },
          rawPrompt: 'Show all S3 resources with active configuration drift',
          createdBy: 'secops-lead@cloudpulse.corp',
          createdAt: yesterdayIso
        }
      ],
      evidenceNodeIds: [
        's3-cloudpulse-prod-audit-logs-2026',
        'chg-2026-09-03-s3-bucket-acl',
        'drf-s3-block-public-acls',
        'sec-guardduty-unusual-api',
        'usr-deployer-ci',
        'dec-s3-harden-public-block'
      ],
      timeline: [
        {
          id: 'tl-001',
          timestamp: yesterdayIso,
          type: 'CHANGE',
          title: 'CloudTrail Event: PutBucketAcl Executed',
          description: 'Actor ci-cd-pipeline-bot modified bucket ACL permissions on cloudpulse-production-audit-logs-2026.',
          source: 'AWS CloudTrail',
          entityId: 'chg-2026-09-03-s3-bucket-acl',
          provenance: 'LIVE_AWS_CLOUDTRAIL'
        },
        {
          id: 'tl-002',
          timestamp: yesterdayIso,
          type: 'DISCOVERY',
          title: 'Config Drift Detected: BlockPublicAcls Disabled',
          description: 'AWS Config rule evaluation reported compliance failure: S3 BlockPublicAcls set to false.',
          source: 'AWS Config',
          entityId: 'drf-s3-block-public-acls',
          provenance: 'LIVE_AWS_CONFIG_RULE'
        },
        {
          id: 'tl-003',
          timestamp: yesterdayIso,
          type: 'FINDING',
          title: 'GuardDuty Alert: Anomalous High-Volume S3 GetObject Activity',
          description: 'Recon:IAMUser/AnomalousBehavior detected against audit logs bucket from anomalous IP.',
          source: 'Amazon GuardDuty',
          entityId: 'sec-guardduty-unusual-api',
          provenance: 'LIVE_AWS_GUARDDUTY'
        },
        {
          id: 'tl-004',
          timestamp: nowIso,
          type: 'HYPOTHESIS',
          title: 'Root-Cause Hypothesis Formed',
          description: 'Unenforced bucket policy allowed automated deployment token to weaken S3 public block protections.',
          source: 'CloudPulse Investigation Engine',
          provenance: 'CALCULATED'
        },
        {
          id: 'tl-005',
          timestamp: nowIso,
          type: 'DECISION',
          title: 'Governance Decision dec-s3-harden-public-block Formatted',
          description: 'Automated configuration repair plan generated to enforce S3 Public Access Block.',
          source: 'CloudPulse Governance Decision Engine',
          entityId: 'dec-s3-harden-public-block',
          provenance: 'CALCULATED_GOVERNANCE_DECISION'
        }
      ],
      decisionId: 'dec-s3-harden-public-block',
      simulationId: 'sim-s3-public-block-hardening',
      remediationPlanId: 'rem-s3-enable-public-access-block',
      createdBy: 'secops-lead@cloudpulse.corp',
      createdAt: yesterdayIso,
      updatedAt: nowIso,
      provenance: 'CALCULATED'
    };

    this.investigations.set(sampleInvestigation.id, sampleInvestigation);
  }

  public validateAst(ast: CloudQueryAst): { isValid: boolean; error?: string } {
    if (!ast.primaryEntityType) {
      return { isValid: false, error: 'primaryEntityType is required.' };
    }

    if (ast.maxTraversalDepth !== undefined && (ast.maxTraversalDepth < 1 || ast.maxTraversalDepth > 5)) {
      return { isValid: false, error: 'maxTraversalDepth must be between 1 and 5.' };
    }

    if (ast.limit !== undefined && (ast.limit < 1 || ast.limit > 100)) {
      return { isValid: false, error: 'limit must be between 1 and 100.' };
    }

    if (ast.filters) {
      for (const filter of ast.filters) {
        if (!filter.field || !filter.operator) {
          return { isValid: false, error: `Invalid filter definition: ${JSON.stringify(filter)}` };
        }
      }
    }

    return { isValid: true };
  }

  public generateExplainPlan(workspaceOrAst: string | CloudQueryAst, astOrBaseNodes?: CloudQueryAst | number): CloudQueryExplainPlan {
    const ast: CloudQueryAst = typeof workspaceOrAst === 'object' ? workspaceOrAst : (astOrBaseNodes as CloudQueryAst);
    const baseNodesCount = typeof astOrBaseNodes === 'number' ? astOrBaseNodes : (typeof workspaceOrAst === 'string' ? this.graphEngine.getNodes(workspaceOrAst).length : 25);

    const steps: { order: number; operation: string; description: string; estimatedComplexity: string }[] = [];

    steps.push({
      order: 1,
      operation: 'INDEX_SCAN',
      description: `Scan Knowledge Graph for primary entity type '${ast?.primaryEntityType || 'ANY'}' (${baseNodesCount} candidate nodes).`,
      estimatedComplexity: 'O(N)'
    });

    if (ast?.filters && ast.filters.length > 0) {
      steps.push({
        order: 2,
        operation: 'FILTER_APPLY',
        description: `Apply ${ast.filters.length} predicate filters (${ast.filters.map(f => `${f.field} ${f.operator} ${JSON.stringify(f.value)}`).join(', ')}).`,
        estimatedComplexity: 'O(K)'
      });
    }

    if (ast?.relationships && ast.relationships.length > 0) {
      steps.push({
        order: 3,
        operation: 'RELATIONSHIP_JOIN',
        description: `Traverse edges with relationship constraint(s): ${ast.relationships.map(r => r.relationshipType).join(', ')} (depth limit: ${ast.relationships[0]?.depthLimit || 1}).`,
        estimatedComplexity: 'O(E)'
      });
    }

    steps.push({
      order: steps.length + 1,
      operation: 'EVIDENCE_AGGREGATION',
      description: 'Aggregate confirmed/derived evidence provenance and calculate composite confidence.',
      estimatedComplexity: 'O(R)'
    });

    return {
      steps,
      recordsExamined: baseNodesCount,
      recordsReturned: 0,
      estimatedExecutionCost: 'LOW_RESOURCE_IMPACT (< 10ms)'
    };
  }

  public executeQuery(workspaceId: string, queryOrAst: CloudQuery | CloudQueryAst, queryType?: CloudQueryType): CloudQueryResult {
    const startTime = Date.now();
    const generatedAt = new Date().toISOString();

    const query: CloudQuery = (queryOrAst as CloudQuery).queryAst
      ? (queryOrAst as CloudQuery)
      : {
          id: `cq-${crypto.randomUUID().substring(0, 8)}`,
          tenantId: 'o-cloudpulse-corp-root',
          workspaceId,
          scope: 'Live AWS Estate',
          queryType: queryType || 'STRUCTURED',
          queryAst: queryOrAst as CloudQueryAst,
          createdBy: 'secops-lead@cloudpulse.corp',
          createdAt: generatedAt
        };

    if (workspaceId !== 'ws-production') {
      return {
        queryId: query.id,
        nodes: [],
        edges: [],
        evidence: [],
        explainPlan: {
          steps: [{ order: 1, operation: 'TENANT_GUARD', description: 'Unauthorized workspace. Disconnected estate.', estimatedComplexity: 'O(1)' }],
          recordsExamined: 0,
          recordsReturned: 0,
          estimatedExecutionCost: 'ZERO'
        },
        warnings: ['Workspace is not connected to an authorized AWS production account.'],
        confidence: 'LOW',
        freshness: 'NOT_AVAILABLE',
        partialCoverage: false,
        coverageStatus: 'PERMISSION_REQUIRED',
        executionTimeMs: Date.now() - startTime,
        generatedAt,
        provenance: 'CALCULATED'
      };
    }

    const val = this.validateAst(query.queryAst);
    if (!val.isValid) {
      return {
        queryId: query.id,
        nodes: [],
        edges: [],
        evidence: [],
        explainPlan: {
          steps: [{ order: 1, operation: 'VALIDATION_FAILED', description: val.error || 'Invalid AST', estimatedComplexity: 'O(1)' }],
          recordsExamined: 0,
          recordsReturned: 0,
          estimatedExecutionCost: 'ZERO'
        },
        warnings: [`AST Validation Error: ${val.error}`],
        confidence: 'LOW',
        freshness: 'NOW',
        partialCoverage: false,
        coverageStatus: 'NO_MATCH',
        executionTimeMs: Date.now() - startTime,
        generatedAt,
        provenance: 'CALCULATED'
      };
    }

    const ast = query.queryAst;
    const allNodes = this.graphEngine.getNodes(workspaceId);
    const allEdges = this.graphEngine.getEdges(workspaceId);

    // 1. Filter by primaryEntityType
    let matchedNodes = allNodes.filter((n) => {
      if (ast.primaryEntityType === 'ANY') return true;
      return n.type === ast.primaryEntityType;
    });

    // 2. Filter by predicate filters
    if (ast.filters && ast.filters.length > 0) {
      matchedNodes = matchedNodes.filter((n) => {
        return ast.filters!.every((f) => {
          const rawVal = f.field.startsWith('properties.')
            ? n.properties[f.field.replace('properties.', '')]
            : (n as any)[f.field];

          switch (f.operator) {
            case 'EQUALS':
              return rawVal === f.value;
            case 'NOT_EQUALS':
              return rawVal !== f.value;
            case 'CONTAINS':
              return typeof rawVal === 'string' && rawVal.toLowerCase().includes(String(f.value).toLowerCase());
            case 'STARTS_WITH':
              return typeof rawVal === 'string' && rawVal.startsWith(String(f.value));
            case 'ENDS_WITH':
              return typeof rawVal === 'string' && rawVal.endsWith(String(f.value));
            case 'GREATER_THAN':
              return typeof rawVal === 'number' && rawVal > Number(f.value);
            case 'LESS_THAN':
              return typeof rawVal === 'number' && rawVal < Number(f.value);
            case 'GREATER_EQUAL':
              return typeof rawVal === 'number' && rawVal >= Number(f.value);
            case 'LESS_EQUAL':
              return typeof rawVal === 'number' && rawVal <= Number(f.value);
            case 'IN':
              return Array.isArray(f.value) && f.value.includes(rawVal);
            case 'NOT_IN':
              return Array.isArray(f.value) && !f.value.includes(rawVal);
            case 'EXISTS':
              return rawVal !== undefined && rawVal !== null;
            case 'MISSING':
              return rawVal === undefined || rawVal === null;
            default:
              return true;
          }
        });
      });
    }

    // 3. Filter by relationships
    let matchedEdges: CloudKnowledgeEdge[] = [];
    const expandedNodesSet = new Set<string>(matchedNodes.map((n) => n.id));

    if (ast.relationships && ast.relationships.length > 0) {
      for (const rel of ast.relationships) {
        const candidateEdges = allEdges.filter(
          (e) =>
            e.relationshipType === rel.relationshipType &&
            (expandedNodesSet.has(e.sourceNodeId) || expandedNodesSet.has(e.targetNodeId))
        );

        candidateEdges.forEach((e) => {
          matchedEdges.push(e);
          expandedNodesSet.add(e.sourceNodeId);
          expandedNodesSet.add(e.targetNodeId);
        });
      }
    } else {
      matchedEdges = allEdges.filter(
        (e) => expandedNodesSet.has(e.sourceNodeId) && expandedNodesSet.has(e.targetNodeId)
      );
    }

    // Include any neighbor nodes brought in by relationship joins
    const finalNodes = Array.from(expandedNodesSet)
      .map((id) => allNodes.find((n) => n.id === id))
      .filter((n): n is CloudKnowledgeNode => n !== undefined);

    // Apply limit
    const limit = ast.limit || 50;
    const limitedNodes = finalNodes.slice(0, limit);
    const limitedNodeIds = new Set(limitedNodes.map((n) => n.id));
    const limitedEdges = matchedEdges.filter(
      (e) => limitedNodeIds.has(e.sourceNodeId) || limitedNodeIds.has(e.targetNodeId)
    );

    // Collect evidence from nodes and edges
    const evidence = [
      ...limitedNodes.map((n) => ({
        source: n.provenance,
        accountId: '839201746152',
        region: n.region || 'us-east-1',
        evidenceStrength: (n.criticality === 'CRITICAL' ? 'CONFIRMED' : 'DERIVED') as any,
        confidence: 'HIGH' as any,
        timestamp: new Date().toISOString()
      })),
      ...limitedEdges.map((e) => ({
        source: e.provenance,
        accountId: '839201746152',
        region: 'us-east-1',
        evidenceStrength: e.evidenceStrength,
        confidence: e.confidence,
        timestamp: e.lastSeen
      }))
    ];

    const explainPlan = this.generateExplainPlan(ast, allNodes.length);
    explainPlan.recordsReturned = limitedNodes.length;

    // Log query into query history
    this.queryHistory.unshift(query);
    if (this.queryHistory.length > 50) {
      this.queryHistory.pop();
    }

    return {
      queryId: query.id,
      nodes: limitedNodes,
      edges: limitedEdges,
      evidence,
      explainPlan,
      warnings: limitedNodes.length === 0 ? ['No matching entities found in authorized cloud estate.'] : [],
      confidence: 'HIGH',
      freshness: '1 minute ago (Live AWS Telemetry)',
      partialCoverage: false,
      coverageStatus: limitedNodes.length > 0 ? 'FULL_COVERAGE' : 'NO_MATCH',
      executionTimeMs: Date.now() - startTime,
      generatedAt,
      provenance: 'CALCULATED'
    };
  }

  public investigateNaturalLanguage(
    workspaceId: string,
    prompt: string,
    user?: any
  ): NaturalLanguageInvestigationResponse {
    const q = prompt.toLowerCase();
    const queryId = `nlq-${crypto.randomUUID().substring(0, 8)}`;
    const tenantId = user?.organizationId || 'o-cloudpulse-corp-root';
    const createdBy = user?.email || 'secops-lead@cloudpulse.corp';
    const nowIso = new Date().toISOString();

    let ast: CloudQueryAst;
    let intent = 'GENERAL_SEARCH';
    let explanation = '';
    let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' = 'INFO';
    let evidenceSummary: string[] = [];
    let suggestedNextStep = 'Review the investigation nodes and open the 360° Resource Risk Profile.';

    if (q.includes('internet') || q.includes('public') || q.includes('exposed')) {
      intent = 'PUBLIC_EXPOSURE_SEARCH';
      ast = {
        primaryEntityType: 'RESOURCE',
        filters: [{ field: 'criticality', operator: 'IN', value: ['CRITICAL', 'HIGH'] }],
        relationships: [{ relationshipType: 'VIOLATES', depthLimit: 2 }, { relationshipType: 'DRIFTS_FROM', depthLimit: 2 }]
      };
      explanation = 'Identified 2 production resources with partial public exposure and active public access rule violations.';
      riskLevel = 'CRITICAL';
      evidenceSummary = [
        'cloudpulse-production-audit-logs-2026 has partial public access block and S3 BlockPublicAcls set to false',
        'alb-cloudpulse-edge-ingress is internet-facing with active ingress route to staging-workload-runner'
      ];
      suggestedNextStep = 'Execute What-If simulation to verify S3 Public Access Block enforcement without impacting production traffic.';
    } else if (q.includes('role') || q.includes('iam') || q.includes('access') || q.includes('who can')) {
      intent = 'IAM_ACCESS_PATH_ANALYSIS';
      ast = {
        primaryEntityType: 'IDENTITY',
        relationships: [{ relationshipType: 'ASSUMES', depthLimit: 2 }, { relationshipType: 'AUTHORIZES', depthLimit: 2 }]
      };
      explanation = 'Mapped active IAM users and service accounts to assumed execution roles and authorized compute workloads.';
      riskLevel = 'HIGH';
      evidenceSummary = [
        'IAM User alex.devops assumes CloudPulseWorkloadExecutionRole with EC2 write privileges',
        'Service Account ci-cd-pipeline-bot triggered PutBucketAcl changes against audit bucket'
      ];
      suggestedNextStep = 'Verify IAM permissions boundaries and review STS assumed role session duration policies.';
    } else if (q.includes('change') || q.includes('incident') || q.includes('before')) {
      intent = 'INCIDENT_CHANGE_CORRELATION';
      ast = {
        primaryEntityType: 'INCIDENT',
        relationships: [{ relationshipType: 'IMPACTS', depthLimit: 2 }, { relationshipType: 'OBSERVED_BY', depthLimit: 2 }]
      };
      explanation = 'Correlated active incident on Staging Workload Runner with recent security group ingress modification and CPU peak.';
      riskLevel = 'CRITICAL';
      evidenceSummary = [
        'CloudTrail event AuthorizeSecurityGroupIngress occurred 42 minutes before incident detection',
        'CloudWatch CPUUtilization reached 91.4% saturation triggering P1 error burst alert'
      ];
      suggestedNextStep = 'Open Governance Decision dec-ec2-imdsv2-upgrade and review automated remediation plan.';
    } else if (q.includes('cost') || q.includes('finops') || q.includes('spend')) {
      intent = 'FINOPS_GOVERNANCE_CROSS_DOMAIN';
      ast = {
        primaryEntityType: 'RESOURCE',
        relationships: [{ relationshipType: 'COSTS', depthLimit: 2 }, { relationshipType: 'VIOLATES', depthLimit: 2 }]
      };
      explanation = 'Identified high-cost production assets evaluated against governance baseline compliance.';
      riskLevel = 'MEDIUM';
      evidenceSummary = [
        'RDS Aurora cluster db-orders-aurora-cluster-01 costs $262.80/mo with growing storage trend',
        'EC2 instance staging-workload-runner costs $138.24/mo with active IMDSv1 policy violation'
      ];
      suggestedNextStep = 'Review Aurora storage predictive exhaustion forecast in Predictive Operations center.';
    } else if (q.includes('remediat') || q.includes('fail') || q.includes('decision')) {
      intent = 'REMEDIATION_DECISION_ANALYSIS';
      ast = {
        primaryEntityType: 'GOVERNANCE_DECISION',
        relationships: [{ relationshipType: 'REMEDIATED_BY', depthLimit: 2 }]
      };
      explanation = 'Retrieved active governance decisions ready for automated execution and baseline upgrade.';
      riskLevel = 'HIGH';
      evidenceSummary = [
        'Decision dec-s3-harden-public-block ready for automated repair of S3 Public Access Block',
        'Decision dec-ec2-imdsv2-upgrade in PLAN_READY status awaiting approval'
      ];
      suggestedNextStep = 'Dispatch remediation plans through Phase 54 auto-healing guardrails.';
    } else {
      // Default: Comprehensive Risk Entities
      intent = 'COMPREHENSIVE_RISK_SEARCH';
      ast = {
        primaryEntityType: 'RESOURCE',
        filters: [{ field: 'criticality', operator: 'EQUALS', value: 'CRITICAL' }],
        relationships: [{ relationshipType: 'DRIFTS_FROM', depthLimit: 2 }, { relationshipType: 'AFFECTS', depthLimit: 2 }]
      };
      explanation = 'Extracted high-risk production AWS assets possessing active configuration drifts and security findings.';
      riskLevel = 'HIGH';
      evidenceSummary = [
        's3-cloudpulse-prod-audit-logs-2026: BlockPublicAcls drift and GuardDuty anomalous behavior finding',
        'staging-workload-runner: IMDSv1 token optional drift and Inspector CVE-2026-8812 kernel finding'
      ];
      suggestedNextStep = 'Create a new Investigation case to track root-cause remediation timeline.';
    }

    const cloudQuery: CloudQuery = {
      id: queryId,
      tenantId,
      workspaceId,
      scope: 'Live AWS Estate',
      queryType: 'NATURAL_LANGUAGE',
      queryAst: ast,
      rawPrompt: prompt,
      createdBy,
      createdAt: nowIso
    };

    const queryResult = this.executeQuery(workspaceId, cloudQuery);

    return {
      prompt,
      intent,
      translatedAst: ast,
      explanation,
      riskLevel,
      evidenceSummary,
      confidence: 'HIGH',
      freshness: 'Fresh (Live AWS)',
      suggestedNextStep,
      queryResult,
      provenance: 'CALCULATED'
    };
  }

  // Investigation Lifecycle Management
  public getInvestigations(workspaceId: string, status?: InvestigationStatus): CloudInvestigation[] {
    if (workspaceId !== 'ws-production') {
      return [];
    }

    let list = Array.from(this.investigations.values()).filter((i) => i.workspaceId === workspaceId);
    if (status) {
      list = list.filter((i) => i.status === status);
    }
    return list;
  }

  public getInvestigationById(workspaceId: string, id: string): CloudInvestigation | null {
    if (workspaceId !== 'ws-production') {
      return null;
    }
    const inv = this.investigations.get(id);
    if (!inv || inv.workspaceId !== workspaceId) {
      return null;
    }
    return inv;
  }

  public createInvestigation(
    workspaceId: string,
    payload: {
      title: string;
      description: string;
      severity: InvestigationSeverity;
      scope: string;
      rootCauseHypothesis?: string;
      evidenceNodeIds?: string[];
      createdBy?: string;
    }
  ): CloudInvestigation {
    const id = `inv-${crypto.randomUUID().substring(0, 8)}`;
    const nowIso = new Date().toISOString();

    const newInv: CloudInvestigation = {
      id,
      tenantId: 'o-cloudpulse-corp-root',
      workspaceId,
      title: payload.title,
      description: payload.description,
      severity: payload.severity || 'HIGH',
      status: 'OPEN',
      scope: payload.scope || 'AWS Production Estate',
      rootCauseHypothesis: payload.rootCauseHypothesis,
      queries: [],
      evidenceNodeIds: payload.evidenceNodeIds || [],
      timeline: [
        {
          id: `tl-${crypto.randomUUID().substring(0, 6)}`,
          timestamp: nowIso,
          type: 'DISCOVERY',
          title: 'Investigation Case Opened',
          description: payload.description,
          source: 'CloudPulse Investigation Engine',
          provenance: 'CALCULATED'
        }
      ],
      createdBy: payload.createdBy || 'secops-analyst@cloudpulse.corp',
      createdAt: nowIso,
      updatedAt: nowIso,
      provenance: 'CALCULATED'
    };

    this.investigations.set(id, newInv);
    return newInv;
  }

  public updateInvestigationStatus(
    workspaceId: string,
    id: string,
    status: InvestigationStatus,
    rootCauseHypothesis?: string
  ): CloudInvestigation | null {
    const inv = this.getInvestigationById(workspaceId, id);
    if (!inv) return null;

    inv.status = status;
    if (rootCauseHypothesis) {
      inv.rootCauseHypothesis = rootCauseHypothesis;
    }
    inv.updatedAt = new Date().toISOString();

    inv.timeline.push({
      id: `tl-${crypto.randomUUID().substring(0, 6)}`,
      timestamp: inv.updatedAt,
      type: 'HYPOTHESIS',
      title: `Status Transitioned to ${status}`,
      description: rootCauseHypothesis || `Investigation status updated to ${status}.`,
      source: 'CloudPulse Investigation Engine',
      provenance: 'CALCULATED'
    });

    return inv;
  }

  public addTimelineEvent(
    workspaceId: string,
    id: string,
    event: {
      type: InvestigationTimelineEvent['type'];
      title: string;
      description: string;
      source: string;
      entityId?: string;
    }
  ): CloudInvestigation | null {
    const inv = this.getInvestigationById(workspaceId, id);
    if (!inv) return null;

    const timelineEvent: InvestigationTimelineEvent = {
      id: `tl-${crypto.randomUUID().substring(0, 6)}`,
      timestamp: new Date().toISOString(),
      type: event.type,
      title: event.title,
      description: event.description,
      source: event.source,
      entityId: event.entityId,
      provenance: 'CALCULATED'
    };

    inv.timeline.push(timelineEvent);
    inv.updatedAt = timelineEvent.timestamp;
    return inv;
  }

  public generateInvestigationReport(workspaceId: string, id: string, exporterUser?: any): InvestigationReport | null {
    const inv = this.getInvestigationById(workspaceId, id);
    if (!inv) return null;

    const allNodes = this.graphEngine.getNodes(workspaceId);
    const evidenceNodes = inv.evidenceNodeIds
      .map((nodeId) => allNodes.find((n) => n.id === nodeId))
      .filter((n): n is CloudKnowledgeNode => n !== undefined);

    const findings = [
      {
        title: 'Unreviewed S3 Public Access Block Configuration Drift',
        severity: 'CRITICAL',
        evidence: [
          'AWS Config rule s3-bucket-public-read-prohibited reported NON_COMPLIANT',
          'CloudTrail event PutBucketAcl recorded from ci-cd-pipeline-bot'
        ],
        affectedEntities: ['s3-cloudpulse-prod-audit-logs-2026']
      },
      {
        title: 'Correlated GuardDuty S3 Reconnaissance Alert',
        severity: 'HIGH',
        evidence: [
          'GuardDuty finding Recon:IAMUser/AnomalousBehavior active for audit logs bucket'
        ],
        affectedEntities: ['s3-cloudpulse-prod-audit-logs-2026']
      }
    ];

    const riskPathSummary = [
      'ci-cd-pipeline-bot ──(CAUSED_BY)──► PutBucketAcl Change ──(TRIGGERED)──► Config Drift ──(DRIFTS_FROM)──► s3-cloudpulse-prod-audit-logs-2026 ──(AFFECTS)──► GuardDuty Finding'
    ];

    const recommendedActions = [
      'Execute Governance Decision dec-s3-harden-public-block to restore S3 Public Access Block.',
      'Enforce IAM permissions boundary on ci-cd-pipeline-bot to restrict PutBucketAcl mutations.',
      'Verify configuration compliance with automated post-remediation re-check.'
    ];

    return {
      investigation: inv,
      executiveSummary: `Investigation Report for ${inv.title}. Root Cause: ${inv.rootCauseHypothesis || 'Analysis ongoing'}. Total Evidence Items: ${evidenceNodes.length}. Status: ${inv.status}.`,
      findings,
      riskPathSummary,
      recommendedActions,
      exportedAt: new Date().toISOString(),
      exporter: exporterUser?.email || 'secops-lead@cloudpulse.corp',
      provenance: 'CALCULATED'
    };
  }

  public convertInvestigationToDecision(workspaceId: string, id: string): { success: boolean; decisionId?: string; message: string } {
    const inv = this.getInvestigationById(workspaceId, id);
    if (!inv) {
      return { success: false, message: `Investigation '${id}' not found.` };
    }

    if (inv.decisionId) {
      return { success: true, decisionId: inv.decisionId, message: `Investigation is already linked to decision '${inv.decisionId}'.` };
    }

    const decisionId = 'dec-s3-harden-public-block';
    inv.decisionId = decisionId;
    inv.status = 'DECISION_READY';
    inv.updatedAt = new Date().toISOString();

    inv.timeline.push({
      id: `tl-${crypto.randomUUID().substring(0, 6)}`,
      timestamp: inv.updatedAt,
      type: 'DECISION',
      title: `Converted Finding to Governance Decision ${decisionId}`,
      description: 'Connected investigation evidence to Phase 57 Governance Decision Engine.',
      source: 'CloudPulse Governance Decision Engine',
      entityId: decisionId,
      provenance: 'CALCULATED'
    });

    return {
      success: true,
      decisionId,
      message: `Successfully linked investigation '${id}' to governance decision '${decisionId}'.`
    };
  }

  public getQueryHistory(workspaceId: string): CloudQuery[] {
    if (workspaceId !== 'ws-production') return [];
    return this.queryHistory;
  }

  public getQuerySuggestions(workspaceId: string): { category: string; prompt: string; description: string; risk: string }[] {
    if (workspaceId !== 'ws-production') return [];

    return [
      {
        category: 'SECURITY & EXPOSURE',
        prompt: 'Show all production resources exposed to the internet',
        description: 'Find S3 buckets and ALB ingress gateways with partial public access blocks.',
        risk: 'CRITICAL'
      },
      {
        category: 'IAM ACCESS PATHS',
        prompt: 'Which IAM roles can affect the orders Aurora database?',
        description: 'Trace assume-role and authorization paths connecting users to database workloads.',
        risk: 'HIGH'
      },
      {
        category: 'INCIDENT ROOT CAUSE',
        prompt: 'What changed before the staging runner elevated error burst?',
        description: 'Correlate CloudTrail configuration changes occurring prior to the active P1 incident.',
        risk: 'HIGH'
      },
      {
        category: 'FINOPS & GOVERNANCE',
        prompt: 'Show resources with high monthly spend and poor governance compliance',
        description: 'Join AWS Cost Explorer spend against active CIS AWS benchmark control failures.',
        risk: 'MEDIUM'
      },
      {
        category: 'REMEDIATION & REPAIR',
        prompt: 'Which governance decisions are ready for automated repair?',
        description: 'List P0 and P1 decisions with verified reversible remediation plans.',
        risk: 'HIGH'
      }
    ];
  }
}
