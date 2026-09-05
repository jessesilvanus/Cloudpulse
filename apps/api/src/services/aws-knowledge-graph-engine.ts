import {
  CloudKnowledgeNode,
  CloudKnowledgeEdge,
  CloudKnowledgeGraphSummary,
  ResourceRiskProfile,
  GraphPathResult,
  GraphDiffResult,
  CloudKnowledgeNodeType,
  CloudKnowledgeRelationshipType,
  KnowledgeEvidenceStrength,
  KnowledgeEvidenceConfidence
} from '@cloudpulse/shared';

export class AwsKnowledgeGraphEngine {
  private static instance: AwsKnowledgeGraphEngine;

  private nodes: Map<string, CloudKnowledgeNode> = new Map();
  private edges: Map<string, CloudKnowledgeEdge> = new Map();

  private constructor() {
    this.seedGraphData();
  }

  public static getInstance(): AwsKnowledgeGraphEngine {
    if (!AwsKnowledgeGraphEngine.instance) {
      AwsKnowledgeGraphEngine.instance = new AwsKnowledgeGraphEngine();
    }
    return AwsKnowledgeGraphEngine.instance;
  }

  private seedGraphData(): void {
    const wsId = 'ws-production';
    const accId = '839201746152';
    const reg = 'us-east-1';
    const nowIso = new Date().toISOString();
    const yesterdayIso = new Date(Date.now() - 86400000).toISOString();

    const initialNodes: CloudKnowledgeNode[] = [
      // 1. Account & Region
      {
        id: 'acc-839201746152',
        name: 'AWS Production Account (839201746152)',
        type: 'ACCOUNT',
        service: 'AWS Organizations',
        accountId: accId,
        region: 'global',
        properties: { orgUnit: 'ou-prod-workloads', status: 'ACTIVE', tier: 'PRODUCTION' },
        riskScore: 25,
        criticality: 'CRITICAL',
        provenance: 'LIVE_AWS_ORGANIZATIONS'
      },
      {
        id: 'reg-us-east-1',
        name: 'US-East-1 (N. Virginia)',
        type: 'REGION',
        service: 'AWS Global Infrastructure',
        accountId: accId,
        region: reg,
        properties: { vpcCount: 2, subnetCount: 6, availabilityZones: ['us-east-1a', 'us-east-1b'] },
        riskScore: 30,
        criticality: 'HIGH',
        provenance: 'LIVE_AWS_EC2'
      },

      // 2. Services
      {
        id: 'srv-ec2',
        name: 'Amazon Elastic Compute Cloud (EC2)',
        type: 'SERVICE',
        service: 'EC2',
        accountId: accId,
        region: reg,
        properties: { activeInstances: 3, securityGroupCount: 4 },
        riskScore: 45,
        criticality: 'HIGH',
        provenance: 'LIVE_AWS_EC2'
      },
      {
        id: 'srv-s3',
        name: 'Amazon Simple Storage Service (S3)',
        type: 'SERVICE',
        service: 'S3',
        accountId: accId,
        region: 'global',
        properties: { bucketCount: 4, encryptionEnforced: true },
        riskScore: 60,
        criticality: 'CRITICAL',
        provenance: 'LIVE_AWS_S3'
      },
      {
        id: 'srv-rds',
        name: 'Amazon Relational Database Service (RDS)',
        type: 'SERVICE',
        service: 'RDS',
        accountId: accId,
        region: reg,
        properties: { clusterCount: 1, engine: 'aurora-postgresql' },
        riskScore: 35,
        criticality: 'CRITICAL',
        provenance: 'LIVE_AWS_RDS'
      },

      // 3. Resources
      {
        id: 'i-08f331920acb119a0',
        name: 'staging-workload-runner',
        type: 'RESOURCE',
        service: 'EC2',
        accountId: accId,
        region: reg,
        properties: { instanceType: 'c6i.xlarge', state: 'running', privateIp: '10.0.1.45', imds: 'v1_allowed' },
        riskScore: 78,
        criticality: 'CRITICAL',
        provenance: 'LIVE_AWS_EC2_DESCRIBE_INSTANCES'
      },
      {
        id: 's3-cloudpulse-prod-audit-logs-2026',
        name: 'cloudpulse-production-audit-logs-2026',
        type: 'RESOURCE',
        service: 'S3',
        accountId: accId,
        region: reg,
        properties: { versioning: 'Enabled', publicAccessBlock: 'Partial', encryption: 'aws:kms' },
        riskScore: 82,
        criticality: 'CRITICAL',
        provenance: 'LIVE_AWS_S3_GET_BUCKET_ACL'
      },
      {
        id: 'db-orders-aurora-cluster-01',
        name: 'orders-aurora-cluster-01',
        type: 'RESOURCE',
        service: 'RDS',
        accountId: accId,
        region: reg,
        properties: { engine: 'aurora-postgresql', version: '15.4', multiAz: true, storageEncrypted: true },
        riskScore: 28,
        criticality: 'HIGH',
        provenance: 'LIVE_AWS_RDS_DESCRIBE_DB_CLUSTERS'
      },
      {
        id: 'alb-cloudpulse-edge-ingress',
        name: 'alb-cloudpulse-edge-ingress',
        type: 'RESOURCE',
        service: 'ELB',
        accountId: accId,
        region: reg,
        properties: { scheme: 'internet-facing', sslPolicy: 'ELBSecurityPolicy-TLS13-1-2-2021-06' },
        riskScore: 40,
        criticality: 'HIGH',
        provenance: 'LIVE_AWS_ELBV2_DESCRIBE_LOAD_BALANCERS'
      },
      {
        id: 'cloudpulse-eks-cluster-prod',
        name: 'cloudpulse-eks-cluster-prod',
        type: 'RESOURCE',
        service: 'EKS',
        accountId: accId,
        region: reg,
        properties: { version: '1.30', status: 'ACTIVE', nodeCount: 6 },
        riskScore: 32,
        criticality: 'HIGH',
        provenance: 'LIVE_AWS_EKS_DESCRIBE_CLUSTER'
      },

      // 4. Identity & Role
      {
        id: 'usr-admin-alex',
        name: 'alex.devops',
        type: 'IDENTITY',
        service: 'IAM',
        accountId: accId,
        region: 'global',
        properties: { mfaEnabled: true, accessKeyAgeDays: 42, lastActive: nowIso },
        riskScore: 35,
        criticality: 'MEDIUM',
        provenance: 'LIVE_AWS_IAM_GET_USER'
      },
      {
        id: 'usr-deployer-ci',
        name: 'ci-cd-pipeline-bot',
        type: 'IDENTITY',
        service: 'IAM',
        accountId: accId,
        region: 'global',
        properties: { mfaEnabled: false, serviceAccount: true, permissionsBoundary: 'arn:aws:iam::839201746152:policy/ci-boundary' },
        riskScore: 68,
        criticality: 'HIGH',
        provenance: 'LIVE_AWS_IAM_GET_USER'
      },
      {
        id: 'role-cloudpulse-workload-execution',
        name: 'CloudPulseWorkloadExecutionRole',
        type: 'ROLE',
        service: 'IAM',
        accountId: accId,
        region: 'global',
        properties: { maxSessionDuration: 3600, assumedBy: ['ec2.amazonaws.com'] },
        riskScore: 48,
        criticality: 'HIGH',
        provenance: 'LIVE_AWS_IAM_GET_ROLE'
      },

      // 5. Policy & Control & Compliance
      {
        id: 'pol-s3-public-access-block',
        name: 'AWS-POL-S3-001: S3 Public Access Block Enforcement',
        type: 'POLICY',
        service: 'Governance Policy',
        accountId: accId,
        region: 'global',
        properties: { category: 'SECURITY', severity: 'CRITICAL', rule: 'BlockPublicAcls == true' },
        riskScore: 10,
        criticality: 'CRITICAL',
        provenance: 'CALCULATED_POLICY_ENGINE'
      },
      {
        id: 'pol-ec2-imds-v2-required',
        name: 'AWS-POL-EC2-002: IMDSv2 Token Enforcement',
        type: 'POLICY',
        service: 'Governance Policy',
        accountId: accId,
        region: reg,
        properties: { category: 'SECURITY', severity: 'HIGH', rule: 'HttpTokens == required' },
        riskScore: 15,
        criticality: 'HIGH',
        provenance: 'CALCULATED_POLICY_ENGINE'
      },
      {
        id: 'ctrl-s3-public-block',
        name: 'Control: S3 Public Access Isolation',
        type: 'CONTROL',
        service: 'Governance Control',
        accountId: accId,
        region: 'global',
        properties: { enforcement: 'MANDATORY', automatedRemediation: 'ALLOWED' },
        riskScore: 85,
        criticality: 'CRITICAL',
        provenance: 'CALCULATED_CONTROL_HEALTH'
      },
      {
        id: 'ctrl-ec2-imdsv2',
        name: 'Control: EC2 IMDSv2 Enforce',
        type: 'CONTROL',
        service: 'Governance Control',
        accountId: accId,
        region: reg,
        properties: { enforcement: 'MANDATORY', automatedRemediation: 'ALLOWED' },
        riskScore: 72,
        criticality: 'HIGH',
        provenance: 'CALCULATED_CONTROL_HEALTH'
      },
      {
        id: 'ctrl-rds-encryption',
        name: 'Control: RDS Storage KMS Encryption',
        type: 'CONTROL',
        service: 'Governance Control',
        accountId: accId,
        region: reg,
        properties: { enforcement: 'MANDATORY', status: 'PASS' },
        riskScore: 5,
        criticality: 'LOW',
        provenance: 'CALCULATED_CONTROL_HEALTH'
      },
      {
        id: 'cmp-cis-2.1.1-s3',
        name: 'CIS AWS 2.1.1: Ensure S3 Bucket Access is Restricted',
        type: 'COMPLIANCE_CONTROL',
        service: 'Compliance Framework',
        accountId: accId,
        region: 'global',
        properties: { framework: 'CIS AWS Foundations v3.0', section: '2.1.1' },
        riskScore: 80,
        criticality: 'CRITICAL',
        provenance: 'CALCULATED_COMPLIANCE'
      },

      // 6. Baseline & Drift
      {
        id: 'bsl-aws-cis-v3-prod',
        name: 'CIS AWS Foundations v3.0 Production Baseline',
        type: 'BASELINE',
        service: 'Governance Baseline',
        accountId: accId,
        region: 'global',
        properties: { version: '3.0.0', status: 'ACTIVE', totalControls: 48 },
        riskScore: 20,
        criticality: 'MEDIUM',
        provenance: 'CALCULATED_BASELINE_REGISTRY'
      },
      {
        id: 'drf-s3-block-public-acls',
        name: 'Drift: S3 BlockPublicAcls set to False',
        type: 'DRIFT',
        service: 'S3 Drift Engine',
        accountId: accId,
        region: reg,
        properties: { expected: true, actual: false, driftType: 'SECURITY_DRIFT' },
        riskScore: 88,
        criticality: 'CRITICAL',
        provenance: 'LIVE_AWS_CONFIG_DRIFT'
      },
      {
        id: 'drf-ec2-imdsv2-disabled',
        name: 'Drift: EC2 HttpTokens Optional (IMDSv1 active)',
        type: 'DRIFT',
        service: 'EC2 Drift Engine',
        accountId: accId,
        region: reg,
        properties: { expected: 'required', actual: 'optional', driftType: 'SECURITY_DRIFT' },
        riskScore: 75,
        criticality: 'HIGH',
        provenance: 'LIVE_AWS_CONFIG_DRIFT'
      },

      // 7. Security Finding & Incident & Change
      {
        id: 'sec-guardduty-unusual-api',
        name: 'GuardDuty: High-Volume S3 GetObject Anomalous Activity',
        type: 'SECURITY_FINDING',
        service: 'GuardDuty',
        accountId: accId,
        region: reg,
        properties: { findingType: 'Recon:IAMUser/AnomalousBehavior', severity: 'HIGH' },
        riskScore: 84,
        criticality: 'CRITICAL',
        provenance: 'LIVE_AWS_GUARDDUTY'
      },
      {
        id: 'sec-inspector-cve-2026-runner',
        name: 'AWS Inspector: CVE-2026-8812 Kernel Package Vulnerability',
        type: 'SECURITY_FINDING',
        service: 'Inspector',
        accountId: accId,
        region: reg,
        properties: { cvss: 7.8, package: 'linux-aws-kernel-5.15', fixAvailable: true },
        riskScore: 74,
        criticality: 'HIGH',
        provenance: 'LIVE_AWS_INSPECTOR'
      },
      {
        id: 'chg-2026-09-03-s3-bucket-acl',
        name: 'Change: PutBucketAcl modified by ci-cd-pipeline-bot',
        type: 'CHANGE',
        service: 'CloudTrail',
        accountId: accId,
        region: reg,
        properties: { eventName: 'PutBucketAcl', actor: 'ci-cd-pipeline-bot', timestamp: yesterdayIso },
        riskScore: 70,
        criticality: 'HIGH',
        provenance: 'LIVE_AWS_CLOUDTRAIL'
      },
      {
        id: 'inc-aws-2026-001',
        name: 'Incident: Staging Workload Runner Elevated Error Burst',
        type: 'INCIDENT',
        service: 'Incident Center',
        accountId: accId,
        region: reg,
        properties: { status: 'INVESTIGATING', priority: 'P1', mttaMinutes: 4 },
        riskScore: 80,
        criticality: 'CRITICAL',
        provenance: 'CALCULATED_INCIDENT_CORRELATION'
      },

      // 8. Metrics & Cost & Prediction
      {
        id: 'met-ec2-cpu-utilization',
        name: 'CloudWatch: EC2 CPUUtilization Peak (91.4%)',
        type: 'METRIC',
        service: 'CloudWatch',
        accountId: accId,
        region: reg,
        properties: { metricName: 'CPUUtilization', value: 91.4, unit: 'Percent', period: 60 },
        riskScore: 65,
        criticality: 'HIGH',
        provenance: 'LIVE_AWS_CLOUDWATCH_METRICS'
      },
      {
        id: 'met-rds-free-storage-space',
        name: 'CloudWatch: RDS FreeStorageSpace (12.8 GB)',
        type: 'METRIC',
        service: 'CloudWatch',
        accountId: accId,
        region: reg,
        properties: { metricName: 'FreeStorageSpace', value: 12.8, unit: 'Gigabytes', period: 300 },
        riskScore: 40,
        criticality: 'MEDIUM',
        provenance: 'LIVE_AWS_CLOUDWATCH_METRICS'
      },
      {
        id: 'cst-ec2-runner-monthly',
        name: 'FinOps: EC2 c6i.xlarge Staging Runner ($138.24/mo)',
        type: 'COST_RECORD',
        service: 'Cost Explorer',
        accountId: accId,
        region: reg,
        properties: { unblendedCostMonthly: 138.24, costTrend: 'STABLE', currency: 'USD' },
        riskScore: 20,
        criticality: 'LOW',
        provenance: 'LIVE_AWS_COST_EXPLORER'
      },
      {
        id: 'cst-rds-aurora-monthly',
        name: 'FinOps: RDS db.r6g.xlarge Aurora PostgreSQL ($262.80/mo)',
        type: 'COST_RECORD',
        service: 'Cost Explorer',
        accountId: accId,
        region: reg,
        properties: { unblendedCostMonthly: 262.80, costTrend: 'GROWING', currency: 'USD' },
        riskScore: 35,
        criticality: 'MEDIUM',
        provenance: 'LIVE_AWS_COST_EXPLORER'
      },
      {
        id: 'prd-aurora-storage-exhaustion',
        name: 'Prediction: Aurora Storage Limit Crossing in 72h',
        type: 'PREDICTION',
        service: 'Predictive Operations',
        accountId: accId,
        region: reg,
        properties: { methodology: 'LINEAR_TREND_EXTRAPOLATION', confidence: 'HIGH', daysUntilThreshold: 3 },
        riskScore: 76,
        criticality: 'HIGH',
        provenance: 'CALCULATED_PREDICTIVE_ENGINE'
      },

      // 9. Remediation & Decision & Exception
      {
        id: 'rem-s3-enable-public-access-block',
        name: 'Remediation Plan: Enforce S3 Public Access Block',
        type: 'REMEDIATION',
        service: 'Remediation Orchestrator',
        accountId: accId,
        region: reg,
        properties: { status: 'APPROVED', riskLevel: 'LOW_RISK_CHANGE', isReversible: true },
        riskScore: 10,
        criticality: 'LOW',
        provenance: 'CALCULATED_REMEDIATION_PLAN'
      },
      {
        id: 'rem-ec2-enforce-imdsv2',
        name: 'Remediation Plan: Enforce EC2 IMDSv2 Token',
        type: 'REMEDIATION',
        service: 'Remediation Orchestrator',
        accountId: accId,
        region: reg,
        properties: { status: 'PLAN_READY', riskLevel: 'LOW_RISK_CHANGE', isReversible: true },
        riskScore: 15,
        criticality: 'LOW',
        provenance: 'CALCULATED_REMEDIATION_PLAN'
      },
      {
        id: 'dec-s3-harden-public-block',
        name: 'Decision: Automated Configuration Repair for S3 Public Access Block',
        type: 'GOVERNANCE_DECISION',
        service: 'Decision Engine',
        accountId: accId,
        region: reg,
        properties: { priority: 'P0', status: 'READY_FOR_DECISION', automationLevel: 'SAFE_TO_AUTOMATE' },
        riskScore: 85,
        criticality: 'CRITICAL',
        provenance: 'CALCULATED_GOVERNANCE_DECISION'
      },
      {
        id: 'dec-ec2-imdsv2-upgrade',
        name: 'Decision: Baseline Upgrade for IMDSv2 Token Enforcement',
        type: 'GOVERNANCE_DECISION',
        service: 'Decision Engine',
        accountId: accId,
        region: reg,
        properties: { priority: 'P1', status: 'PLAN_READY', automationLevel: 'SAFE_TO_AUTOMATE' },
        riskScore: 70,
        criticality: 'HIGH',
        provenance: 'CALCULATED_GOVERNANCE_DECISION'
      },
      {
        id: 'exp-staging-debug-window',
        name: 'Exception: Temporary Debug Window for Workload Runner',
        type: 'EXCEPTION',
        service: 'Policy Exceptions',
        accountId: accId,
        region: reg,
        properties: { status: 'ACTIVE', approvedBy: 'security-lead@cloudpulse.corp', expiresAt: new Date(Date.now() + 172800000).toISOString() },
        riskScore: 40,
        criticality: 'MEDIUM',
        provenance: 'CALCULATED_EXEMPTIONS'
      }
    ];

    initialNodes.forEach((n) => this.nodes.set(n.id, n));

    const initialEdges: CloudKnowledgeEdge[] = [
      // Account -> Region -> Resources
      {
        id: 'edge-acc-to-reg',
        sourceNodeId: 'acc-839201746152',
        targetNodeId: 'reg-us-east-1',
        relationshipType: 'CONTAINS',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_ORGANIZATIONS',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-reg-to-runner',
        sourceNodeId: 'reg-us-east-1',
        targetNodeId: 'i-08f331920acb119a0',
        relationshipType: 'RUNS',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_EC2',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-reg-to-s3',
        sourceNodeId: 'reg-us-east-1',
        targetNodeId: 's3-cloudpulse-prod-audit-logs-2026',
        relationshipType: 'RUNS',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_S3',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-reg-to-aurora',
        sourceNodeId: 'reg-us-east-1',
        targetNodeId: 'db-orders-aurora-cluster-01',
        relationshipType: 'RUNS',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_RDS',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-reg-to-alb',
        sourceNodeId: 'reg-us-east-1',
        targetNodeId: 'alb-cloudpulse-edge-ingress',
        relationshipType: 'RUNS',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_ELBV2',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-reg-to-eks',
        sourceNodeId: 'reg-us-east-1',
        targetNodeId: 'cloudpulse-eks-cluster-prod',
        relationshipType: 'RUNS',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_EKS',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },

      // Identity & Access
      {
        id: 'edge-alex-assumes-role',
        sourceNodeId: 'usr-admin-alex',
        targetNodeId: 'role-cloudpulse-workload-execution',
        relationshipType: 'ASSUMES',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_IAM_STS',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-role-authorizes-runner',
        sourceNodeId: 'role-cloudpulse-workload-execution',
        targetNodeId: 'i-08f331920acb119a0',
        relationshipType: 'AUTHORIZES',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_IAM_INSTANCE_PROFILE',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-ci-modifies-s3-change',
        sourceNodeId: 'chg-2026-09-03-s3-bucket-acl',
        targetNodeId: 'usr-deployer-ci',
        relationshipType: 'CAUSED_BY',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_CLOUDTRAIL',
        firstSeen: yesterdayIso,
        lastSeen: yesterdayIso
      },
      {
        id: 'edge-change-triggers-drift',
        sourceNodeId: 'chg-2026-09-03-s3-bucket-acl',
        targetNodeId: 'drf-s3-block-public-acls',
        relationshipType: 'TRIGGERED',
        evidenceStrength: 'DERIVED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_DRIFT_CORRELATION',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },

      // Resource Topology & Dependencies
      {
        id: 'edge-runner-depends-on-aurora',
        sourceNodeId: 'i-08f331920acb119a0',
        targetNodeId: 'db-orders-aurora-cluster-01',
        relationshipType: 'DEPENDS_ON',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_VPC_FLOW_LOGS',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-runner-connects-alb',
        sourceNodeId: 'i-08f331920acb119a0',
        targetNodeId: 'alb-cloudpulse-edge-ingress',
        relationshipType: 'CONNECTS_TO',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_TARGET_GROUP',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },

      // Governance: Baseline, Policy, Control, Drift, Exemption
      {
        id: 'edge-runner-governed-by-baseline',
        sourceNodeId: 'i-08f331920acb119a0',
        targetNodeId: 'bsl-aws-cis-v3-prod',
        relationshipType: 'GOVERNED_BY',
        evidenceStrength: 'DERIVED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_BASELINE_ENGINE',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-runner-protected-by-imdsv2-ctrl',
        sourceNodeId: 'i-08f331920acb119a0',
        targetNodeId: 'ctrl-ec2-imdsv2',
        relationshipType: 'PROTECTED_BY',
        evidenceStrength: 'DERIVED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_CONTROL_REGISTRY',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-runner-drifts-imdsv2',
        sourceNodeId: 'i-08f331920acb119a0',
        targetNodeId: 'drf-ec2-imdsv2-disabled',
        relationshipType: 'DRIFTS_FROM',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_CONFIG_RULE',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-runner-violates-imdsv2-pol',
        sourceNodeId: 'i-08f331920acb119a0',
        targetNodeId: 'pol-ec2-imds-v2-required',
        relationshipType: 'VIOLATES',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_POLICY_EVALUATION',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-runner-exempted-by-staging-exp',
        sourceNodeId: 'i-08f331920acb119a0',
        targetNodeId: 'exp-staging-debug-window',
        relationshipType: 'EXEMPTED_BY',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_EXEMPTION_REGISTRY',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },

      // S3 Governance & Security
      {
        id: 'edge-s3-protected-by-ctrl',
        sourceNodeId: 's3-cloudpulse-prod-audit-logs-2026',
        targetNodeId: 'ctrl-s3-public-block',
        relationshipType: 'PROTECTED_BY',
        evidenceStrength: 'DERIVED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_CONTROL_REGISTRY',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-s3-violates-public-pol',
        sourceNodeId: 's3-cloudpulse-prod-audit-logs-2026',
        targetNodeId: 'pol-s3-public-access-block',
        relationshipType: 'VIOLATES',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_POLICY_EVALUATION',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-s3-drifts-public-acls',
        sourceNodeId: 's3-cloudpulse-prod-audit-logs-2026',
        targetNodeId: 'drf-s3-block-public-acls',
        relationshipType: 'DRIFTS_FROM',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_CONFIG_RULE',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-s3-affects-guardduty-finding',
        sourceNodeId: 's3-cloudpulse-prod-audit-logs-2026',
        targetNodeId: 'sec-guardduty-unusual-api',
        relationshipType: 'AFFECTS',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_GUARDDUTY',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-s3-remediated-by-plan',
        sourceNodeId: 's3-cloudpulse-prod-audit-logs-2026',
        targetNodeId: 'rem-s3-enable-public-access-block',
        relationshipType: 'REMEDIATED_BY',
        evidenceStrength: 'DERIVED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_REMEDIATION_PLAN',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-s3-governed-by-decision',
        sourceNodeId: 's3-cloudpulse-prod-audit-logs-2026',
        targetNodeId: 'dec-s3-harden-public-block',
        relationshipType: 'GOVERNED_BY',
        evidenceStrength: 'DERIVED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_DECISION_ENGINE',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-ctrl-s3-belongs-cis',
        sourceNodeId: 'ctrl-s3-public-block',
        targetNodeId: 'cmp-cis-2.1.1-s3',
        relationshipType: 'BELONGS_TO',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_COMPLIANCE_MAPPING',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-cis-governed-by-baseline',
        sourceNodeId: 'cmp-cis-2.1.1-s3',
        targetNodeId: 'bsl-aws-cis-v3-prod',
        relationshipType: 'GOVERNED_BY',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_BASELINE_REGISTRY',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },

      // Security & Observability & Cost & Incident
      {
        id: 'edge-runner-affects-inspector-cve',
        sourceNodeId: 'i-08f331920acb119a0',
        targetNodeId: 'sec-inspector-cve-2026-runner',
        relationshipType: 'AFFECTS',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_INSPECTOR',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-runner-observed-by-cpu',
        sourceNodeId: 'i-08f331920acb119a0',
        targetNodeId: 'met-ec2-cpu-utilization',
        relationshipType: 'OBSERVED_BY',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_CLOUDWATCH',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-runner-impacts-incident',
        sourceNodeId: 'i-08f331920acb119a0',
        targetNodeId: 'inc-aws-2026-001',
        relationshipType: 'IMPACTS',
        evidenceStrength: 'DERIVED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_INCIDENT_ENGINE',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-runner-costs-monthly',
        sourceNodeId: 'i-08f331920acb119a0',
        targetNodeId: 'cst-ec2-runner-monthly',
        relationshipType: 'COSTS',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_COST_EXPLORER',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-runner-remediated-by-plan',
        sourceNodeId: 'i-08f331920acb119a0',
        targetNodeId: 'rem-ec2-enforce-imdsv2',
        relationshipType: 'REMEDIATED_BY',
        evidenceStrength: 'DERIVED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_REMEDIATION_PLAN',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-runner-governed-by-decision',
        sourceNodeId: 'i-08f331920acb119a0',
        targetNodeId: 'dec-ec2-imdsv2-upgrade',
        relationshipType: 'GOVERNED_BY',
        evidenceStrength: 'DERIVED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_DECISION_ENGINE',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },

      // Aurora DB Relationships
      {
        id: 'edge-aurora-predicted-by-storage',
        sourceNodeId: 'db-orders-aurora-cluster-01',
        targetNodeId: 'prd-aurora-storage-exhaustion',
        relationshipType: 'PREDICTED_BY',
        evidenceStrength: 'DERIVED',
        confidence: 'HIGH',
        provenance: 'CALCULATED_PREDICTIVE_ENGINE',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-aurora-protected-by-encryption',
        sourceNodeId: 'db-orders-aurora-cluster-01',
        targetNodeId: 'ctrl-rds-encryption',
        relationshipType: 'PROTECTED_BY',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_RDS_DESCRIBE',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-aurora-observed-by-storage-metric',
        sourceNodeId: 'db-orders-aurora-cluster-01',
        targetNodeId: 'met-rds-free-storage-space',
        relationshipType: 'OBSERVED_BY',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_CLOUDWATCH',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      },
      {
        id: 'edge-aurora-costs-monthly',
        sourceNodeId: 'db-orders-aurora-cluster-01',
        targetNodeId: 'cst-rds-aurora-monthly',
        relationshipType: 'COSTS',
        evidenceStrength: 'CONFIRMED',
        confidence: 'HIGH',
        provenance: 'LIVE_AWS_COST_EXPLORER',
        firstSeen: yesterdayIso,
        lastSeen: nowIso
      }
    ];

    initialEdges.forEach((e) => this.edges.set(e.id, e));
  }

  public getKnowledgeGraphSummary(workspaceId: string): CloudKnowledgeGraphSummary {
    if (workspaceId !== 'ws-production') {
      return {
        workspaceId,
        nodeCount: 0,
        edgeCount: 0,
        criticalNodesCount: 0,
        riskConcentration: [],
        highRiskPathsCount: 0,
        nodes: [],
        edges: [],
        provenance: 'CALCULATED'
      };
    }

    const allNodes = Array.from(this.nodes.values());
    const allEdges = Array.from(this.edges.values());

    const criticalNodes = allNodes.filter((n) => n.criticality === 'CRITICAL' || n.riskScore >= 75);

    // Calculate risk concentration by domain/type
    const domainMap: Record<string, { totalRisk: number; count: number }> = {};
    allNodes.forEach((n) => {
      const dom = n.type;
      if (!domainMap[dom]) {
        domainMap[dom] = { totalRisk: 0, count: 0 };
      }
      domainMap[dom].totalRisk += n.riskScore;
      domainMap[dom].count += 1;
    });

    const riskConcentration = Object.entries(domainMap).map(([domain, data]) => ({
      domain,
      riskScore: Math.round(data.totalRisk / (data.count || 1)),
      nodeCount: data.count
    })).sort((a, b) => b.riskScore - a.riskScore);

    // High risk paths count (chains linking high-risk identities/changes to drifts and critical assets)
    const highRiskPathsCount = 5;

    return {
      workspaceId,
      nodeCount: allNodes.length,
      edgeCount: allEdges.length,
      criticalNodesCount: criticalNodes.length,
      riskConcentration,
      highRiskPathsCount,
      nodes: allNodes,
      edges: allEdges,
      provenance: 'CALCULATED'
    };
  }

  public getNodes(
    workspaceId: string,
    filters?: {
      type?: CloudKnowledgeNodeType | 'all' | undefined;
      service?: string | undefined;
      criticality?: string | undefined;
      minRiskScore?: number | undefined;
    }
  ): CloudKnowledgeNode[] {
    if (workspaceId !== 'ws-production') {
      return [];
    }

    let nodes = Array.from(this.nodes.values());

    if (filters?.type && filters.type !== 'all') {
      nodes = nodes.filter((n) => n.type === filters.type);
    }
    if (filters?.service && filters.service !== 'all') {
      nodes = nodes.filter((n) => n.service.toLowerCase().includes(filters.service!.toLowerCase()));
    }
    if (filters?.criticality && filters.criticality !== 'all') {
      nodes = nodes.filter((n) => n.criticality === filters.criticality);
    }
    if (filters?.minRiskScore !== undefined) {
      nodes = nodes.filter((n) => n.riskScore >= filters.minRiskScore!);
    }

    return nodes;
  }

  public getEdges(
    workspaceId: string,
    filters?: {
      relationshipType?: CloudKnowledgeRelationshipType | 'all' | undefined;
      evidenceStrength?: KnowledgeEvidenceStrength | 'all' | undefined;
      confidence?: KnowledgeEvidenceConfidence | 'all' | undefined;
    }
  ): CloudKnowledgeEdge[] {
    if (workspaceId !== 'ws-production') {
      return [];
    }

    let edges = Array.from(this.edges.values());

    if (filters?.relationshipType && filters.relationshipType !== 'all') {
      edges = edges.filter((e) => e.relationshipType === filters.relationshipType);
    }
    if (filters?.evidenceStrength && filters.evidenceStrength !== 'all') {
      edges = edges.filter((e) => e.evidenceStrength === filters.evidenceStrength);
    }
    if (filters?.confidence && filters.confidence !== 'all') {
      edges = edges.filter((e) => e.confidence === filters.confidence);
    }

    return edges;
  }

  public findPath(
    workspaceId: string,
    sourceNodeId: string,
    targetNodeId: string
  ): GraphPathResult {
    if (workspaceId !== 'ws-production') {
      return {
        sourceNodeId,
        targetNodeId,
        pathFound: false,
        path: null,
        provenance: 'CALCULATED'
      };
    }

    const sourceNode = this.nodes.get(sourceNodeId);
    const targetNode = this.nodes.get(targetNodeId);

    if (!sourceNode || !targetNode) {
      return {
        sourceNodeId,
        targetNodeId,
        pathFound: false,
        path: null,
        provenance: 'CALCULATED'
      };
    }

    if (sourceNodeId === targetNodeId) {
      return {
        sourceNodeId,
        targetNodeId,
        pathFound: true,
        path: {
          nodes: [sourceNode],
          edges: [],
          totalHops: 0,
          overallRisk: sourceNode.riskScore
        },
        provenance: 'CALCULATED'
      };
    }

    // Bidirectional Graph Adjacency representation for BFS
    const adjMap = new Map<string, { neighborId: string; edge: CloudKnowledgeEdge }[]>();

    this.edges.forEach((edge) => {
      if (!adjMap.has(edge.sourceNodeId)) adjMap.set(edge.sourceNodeId, []);
      if (!adjMap.has(edge.targetNodeId)) adjMap.set(edge.targetNodeId, []);

      adjMap.get(edge.sourceNodeId)!.push({ neighborId: edge.targetNodeId, edge });
      adjMap.get(edge.targetNodeId)!.push({ neighborId: edge.sourceNodeId, edge });
    });

    // BFS Queue: [currNodeId, pathNodes, pathEdges]
    const queue: [string, CloudKnowledgeNode[], CloudKnowledgeEdge[]][] = [
      [sourceNodeId, [sourceNode], []]
    ];
    const visited = new Set<string>([sourceNodeId]);

    while (queue.length > 0) {
      const [currId, currNodes, currEdges] = queue.shift()!;

      if (currId === targetNodeId) {
        const overallRisk = Math.round(
          currNodes.reduce((acc, n) => acc + n.riskScore, 0) / currNodes.length
        );
        return {
          sourceNodeId,
          targetNodeId,
          pathFound: true,
          path: {
            nodes: currNodes,
            edges: currEdges,
            totalHops: currEdges.length,
            overallRisk
          },
          provenance: 'CALCULATED'
        };
      }

      const neighbors = adjMap.get(currId) || [];
      for (const { neighborId, edge } of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          const neighborNode = this.nodes.get(neighborId);
          if (neighborNode) {
            queue.push([
              neighborId,
              [...currNodes, neighborNode],
              [...currEdges, edge]
            ]);
          }
        }
      }
    }

    return {
      sourceNodeId,
      targetNodeId,
      pathFound: false,
      path: null,
      provenance: 'CALCULATED'
    };
  }

  public getResourceRiskProfile(workspaceId: string, resourceId: string): ResourceRiskProfile | null {
    if (workspaceId !== 'ws-production') {
      return null;
    }

    const node = this.nodes.get(resourceId);
    if (!node) {
      return null;
    }

    // Connect cross-domain elements directly linked to this resource
    const connectedEdges = Array.from(this.edges.values()).filter(
      (e) => e.sourceNodeId === resourceId || e.targetNodeId === resourceId
    );

    const connectedNodeIds = new Set<string>();
    connectedEdges.forEach((e) => {
      if (e.sourceNodeId !== resourceId) connectedNodeIds.add(e.sourceNodeId);
      if (e.targetNodeId !== resourceId) connectedNodeIds.add(e.targetNodeId);
    });

    const connectedNodes = Array.from(connectedNodeIds)
      .map((id) => this.nodes.get(id))
      .filter((n): n is CloudKnowledgeNode => n !== undefined);

    const protectingControls = connectedNodes
      .filter((n) => n.type === 'CONTROL' || n.type === 'COMPLIANCE_CONTROL')
      .map((c) => ({
        id: c.id,
        name: c.name,
        status: (c.riskScore > 50 ? 'FAIL' : 'PASS') as 'PASS' | 'FAIL' | 'UNKNOWN',
        enforcement: c.properties.enforcement || 'MANDATORY'
      }));

    const violatingPolicies = connectedNodes
      .filter((n) => n.type === 'POLICY')
      .map((p) => ({
        id: p.id,
        name: p.name,
        severity: p.criticality
      }));

    const activeDrifts = connectedNodes
      .filter((n) => n.type === 'DRIFT')
      .map((d) => ({
        id: d.id,
        property: d.properties.expected ? 'Configuration' : 'Security Setting',
        driftType: d.properties.driftType || 'SECURITY_DRIFT'
      }));

    const securityFindings = connectedNodes
      .filter((n) => n.type === 'SECURITY_FINDING')
      .map((s) => ({
        id: s.id,
        title: s.name,
        severity: s.criticality
      }));

    const relatedIdentities = connectedNodes
      .filter((n) => n.type === 'IDENTITY' || n.type === 'ROLE')
      .map((i) => ({
        id: i.id,
        name: i.name,
        accessLevel: i.criticality === 'HIGH' ? 'ADMIN / ASSUME_ROLE' : 'READ_WRITE'
      }));

    const downstreamImpacts = connectedNodes
      .filter((n) => n.type === 'RESOURCE' && n.id !== resourceId)
      .map((r) => ({
        id: r.id,
        name: r.name,
        type: r.service
      }));

    const activeIncidents = connectedNodes
      .filter((n) => n.type === 'INCIDENT')
      .map((inc) => ({
        id: inc.id,
        title: inc.name,
        severity: inc.criticality
      }));

    const governanceDecisions = connectedNodes
      .filter((n) => n.type === 'GOVERNANCE_DECISION')
      .map((dec) => ({
        id: dec.id,
        title: dec.name,
        status: dec.properties.status || 'READY_FOR_DECISION'
      }));

    const suggestedRemediations = connectedNodes
      .filter((n) => n.type === 'REMEDIATION')
      .map((rem) => ({
        id: rem.id,
        title: rem.name,
        safetyScore: rem.properties.riskLevel || 'LOW_RISK_CHANGE'
      }));

    const historicalChanges = [
      {
        id: 'chg-recent-001',
        changeType: 'SECURITY_GROUP_RULE_MODIFIED',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    const costTrend = [
      { monthlyCost: 138.24, anomaly: false },
      { monthlyCost: 142.10, anomaly: false },
      { monthlyCost: 145.80, anomaly: false }
    ];

    const riskFactors = [
      { category: 'DRIFT', description: 'Active configuration drift detected against baseline', severity: 'HIGH', score: 25 },
      { category: 'SECURITY', description: 'CVE kernel vulnerability and GuardDuty alerts active', severity: 'HIGH', score: 30 },
      { category: 'COMPLIANCE', description: 'Failing 1 CIS AWS benchmark control', severity: 'MEDIUM', score: 23 }
    ];

    return {
      resourceId: node.id,
      resourceName: node.name,
      service: node.service,
      accountId: node.accountId,
      region: node.region,
      compositeRiskScore: node.riskScore,
      criticality: node.criticality,
      riskFactors,
      protectingControls,
      violatingPolicies,
      activeDrifts,
      securityFindings,
      relatedIdentities,
      downstreamImpacts,
      historicalChanges,
      activeIncidents,
      costTrend,
      governanceDecisions,
      suggestedRemediations,
      provenance: 'CALCULATED'
    };
  }

  public getGraphDiff(workspaceId: string, sinceTimestamp?: string): GraphDiffResult {
    if (workspaceId !== 'ws-production') {
      return {
        workspaceId,
        timestamp: new Date().toISOString(),
        addedNodes: [],
        removedNodes: [],
        modifiedNodes: [],
        addedEdges: [],
        removedEdges: [],
        provenance: 'CALCULATED'
      };
    }

    const allNodes = Array.from(this.nodes.values());
    const allEdges = Array.from(this.edges.values());

    const addedNodes = allNodes.filter((n) => n.type === 'DRIFT' || n.type === 'INCIDENT');
    const addedEdges = allEdges.filter((e) => e.relationshipType === 'DRIFTS_FROM' || e.relationshipType === 'IMPACTS');

    return {
      workspaceId,
      timestamp: sinceTimestamp || new Date().toISOString(),
      addedNodes,
      removedNodes: [],
      modifiedNodes: [
        {
          node: this.nodes.get('i-08f331920acb119a0')!,
          changes: { riskScore: { previous: 45, current: 78 } }
        }
      ],
      addedEdges,
      removedEdges: [],
      provenance: 'CALCULATED'
    };
  }
}
