import {
  RealCloudIdentity,
  CloudAccessRelationship,
  EffectiveAccessRule,
  HighRiskAccessPath,
  PublicExposureEntity,
  ZeroTrustControlEffectiveness,
  SecurityAccessReview,
  SecurityExceptionRecord,
  ZeroTrustSecurityScorecard,
  AiSecurityAnalystResult
} from '@cloudpulse/shared';

export class RealCloudSecurityEngine {
  private static instance: RealCloudSecurityEngine;

  private identities: Map<string, RealCloudIdentity> = new Map();
  private relationships: Map<string, CloudAccessRelationship> = new Map();
  private effectiveAccessRules: Map<string, EffectiveAccessRule> = new Map();
  private highRiskPaths: Map<string, HighRiskAccessPath> = new Map();
  private publicExposures: Map<string, PublicExposureEntity> = new Map();
  private controlEffectiveness: Map<string, ZeroTrustControlEffectiveness> = new Map();
  private accessReviews: Map<string, SecurityAccessReview> = new Map();
  private securityExceptions: Map<string, SecurityExceptionRecord> = new Map();

  private constructor() {
    this.seedSecurityData();
  }

  public static getInstance(): RealCloudSecurityEngine {
    if (!RealCloudSecurityEngine.instance) {
      RealCloudSecurityEngine.instance = new RealCloudSecurityEngine();
    }
    return RealCloudSecurityEngine.instance;
  }

  // ─── INITIAL TELEMETRY & SEEDING ────────────────────────────────────────────

  private seedSecurityData(): void {
    const wsId = 'ws-production';
    const tenantId = 'tenant-enterprise-01';
    const now = new Date().toISOString();

    // 1. Normalized Identities across AWS, Azure, GCP, K8s, Okta
    const idList: RealCloudIdentity[] = [
      {
        id: 'id-aws-human-admin-01',
        tenantId,
        workspaceId: wsId,
        provider: 'AWS',
        scope: '718293041526 (AWS Production)',
        providerIdentityId: 'arn:aws:iam::718293041526:user/charlie.admin',
        type: 'HUMAN',
        displayName: 'Charlie Admin (SecOps Lead)',
        status: 'ACTIVE',
        source: 'AWS_IAM',
        lastObserved: now,
        freshness: 'FRESH',
        risk: 'HIGH',
        confidence: 1.0,
        privilegeLevel: 'ADMIN',
        mfaStatus: 'ENABLED',
        credentialHygiene: {
          accessKeyAgeDays: 42,
          hasMultipleActiveKeys: false,
          lastActivityTimestamp: '2026-09-04T12:30:00Z',
          isStale: false,
          hasAdminWildcard: true
        },
        roles: ['AWS-AdministratorAccess'],
        attachedPolicies: ['arn:aws:iam::aws:policy/AdministratorAccess'],
        reachableResourcesCount: 42,
        leastPrivilegeScore: 68.5,
        excessivePrivilegeFindings: ['Attached wildcard AdministratorAccess policy permits unchecked full account administration.'],
        governanceExceptions: [],
        lastReviewedAt: '2026-07-15T00:00:00Z',
        tags: { team: 'Security', tier: 'break-glass' }
      },
      {
        id: 'id-aws-human-dev-01',
        tenantId,
        workspaceId: wsId,
        provider: 'AWS',
        scope: '718293041526 (AWS Production)',
        providerIdentityId: 'arn:aws:iam::718293041526:user/alice.chen',
        type: 'HUMAN',
        displayName: 'Alice Chen (Core Backend)',
        status: 'ACTIVE',
        source: 'AWS_IAM',
        lastObserved: now,
        freshness: 'FRESH',
        risk: 'LOW',
        confidence: 0.98,
        privilegeLevel: 'DEVELOPER',
        mfaStatus: 'ENABLED',
        credentialHygiene: {
          accessKeyAgeDays: 18,
          hasMultipleActiveKeys: false,
          lastActivityTimestamp: '2026-09-04T15:10:00Z',
          isStale: false,
          hasAdminWildcard: false
        },
        roles: ['AWS-DeveloperReadOnlyRole'],
        attachedPolicies: ['arn:aws:iam::aws:policy/ReadOnlyAccess'],
        reachableResourcesCount: 15,
        leastPrivilegeScore: 94.2,
        excessivePrivilegeFindings: [],
        governanceExceptions: [],
        lastReviewedAt: '2026-08-01T00:00:00Z',
        tags: { team: 'Backend', environment: 'production' }
      },
      {
        id: 'id-aws-role-payment-svc',
        tenantId,
        workspaceId: wsId,
        provider: 'AWS',
        scope: '718293041526 (AWS Production)',
        providerIdentityId: 'arn:aws:iam::718293041526:role/PaymentServiceEc2Role',
        type: 'ROLE',
        displayName: 'PaymentServiceEc2Role',
        status: 'ACTIVE',
        source: 'AWS_IAM',
        lastObserved: now,
        freshness: 'FRESH',
        risk: 'MEDIUM',
        confidence: 0.96,
        privilegeLevel: 'OPERATOR',
        mfaStatus: 'EXEMPT',
        credentialHygiene: {
          lastActivityTimestamp: '2026-09-04T16:00:00Z',
          isStale: false,
          hasAdminWildcard: false
        },
        roles: ['PaymentServiceEc2Role'],
        attachedPolicies: [
          'arn:aws:iam::718293041526:policy/PaymentDatabaseAccess',
          'arn:aws:iam::718293041526:policy/PaymentS3BucketReadWrite'
        ],
        reachableResourcesCount: 8,
        leastPrivilegeScore: 78.0,
        excessivePrivilegeFindings: ['Permission "s3:DeleteBucket" attached but not exercised in last 90 days.'],
        governanceExceptions: [],
        lastReviewedAt: '2026-08-10T00:00:00Z',
        tags: { service: 'payment-service', pci: 'scope' }
      },
      {
        id: 'id-aws-role-ci-deployer',
        tenantId,
        workspaceId: wsId,
        provider: 'AWS',
        scope: '718293041526 (AWS Production)',
        providerIdentityId: 'arn:aws:iam::718293041526:role/GitHubActionsOidcDeployer',
        type: 'FEDERATED_IDENTITY',
        displayName: 'GitHub Actions OIDC Deployer',
        status: 'ACTIVE',
        source: 'OIDC_GITHUB',
        lastObserved: now,
        freshness: 'FRESH',
        risk: 'LOW',
        confidence: 0.99,
        privilegeLevel: 'OPERATOR',
        mfaStatus: 'EXEMPT',
        credentialHygiene: {
          lastActivityTimestamp: '2026-09-04T14:45:00Z',
          isStale: false,
          hasAdminWildcard: false
        },
        roles: ['GitHubActionsOidcDeployer'],
        attachedPolicies: ['arn:aws:iam::718293041526:policy/EcsDeployOnly'],
        reachableResourcesCount: 6,
        leastPrivilegeScore: 92.0,
        excessivePrivilegeFindings: [],
        governanceExceptions: [],
        lastReviewedAt: '2026-08-20T00:00:00Z',
        tags: { repo: 'cloudpulse/core', oidc: 'github' }
      },
      {
        id: 'id-azure-sp-analytics',
        tenantId,
        workspaceId: wsId,
        provider: 'AZURE',
        scope: 'sub-01 (Azure Production)',
        providerIdentityId: 'sp-cloudpulse-analytics-prod-01',
        type: 'SERVICE',
        displayName: 'sp-cloudpulse-analytics-prod',
        status: 'ACTIVE',
        source: 'AZURE_ENTRA',
        lastObserved: now,
        freshness: 'FRESH',
        risk: 'HIGH',
        confidence: 0.95,
        privilegeLevel: 'ADMIN',
        mfaStatus: 'EXEMPT',
        credentialHygiene: {
          accessKeyAgeDays: 190,
          hasMultipleActiveKeys: true,
          lastActivityTimestamp: '2026-09-04T11:00:00Z',
          isStale: false,
          hasAdminWildcard: true
        },
        roles: ['Contributor'],
        attachedPolicies: ['/subscriptions/sub-01/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c'],
        reachableResourcesCount: 22,
        leastPrivilegeScore: 61.0,
        excessivePrivilegeFindings: [
          'Service Principal has broad subscription-wide Contributor role. Scope should be restricted to rg-analytics-prod.',
          'Client secret certificate has not been rotated in > 180 days.'
        ],
        governanceExceptions: [],
        lastReviewedAt: '2026-06-01T00:00:00Z',
        tags: { app: 'analytics-pipeline', environment: 'production' }
      },
      {
        id: 'id-azure-human-sre',
        tenantId,
        workspaceId: wsId,
        provider: 'AZURE',
        scope: 'sub-01 (Azure Production)',
        providerIdentityId: 'elena.rostova@enterprise.io',
        type: 'HUMAN',
        displayName: 'Elena Rostova (SRE Lead)',
        status: 'ACTIVE',
        source: 'AZURE_ENTRA',
        lastObserved: now,
        freshness: 'FRESH',
        risk: 'LOW',
        confidence: 0.99,
        privilegeLevel: 'OPERATOR',
        mfaStatus: 'ENABLED',
        credentialHygiene: {
          accessKeyAgeDays: 12,
          hasMultipleActiveKeys: false,
          lastActivityTimestamp: '2026-09-04T15:45:00Z',
          isStale: false,
          hasAdminWildcard: false
        },
        roles: ['Monitoring Contributor', 'Reader'],
        attachedPolicies: [],
        reachableResourcesCount: 18,
        leastPrivilegeScore: 96.0,
        excessivePrivilegeFindings: [],
        governanceExceptions: [],
        lastReviewedAt: '2026-08-15T00:00:00Z',
        tags: { team: 'SRE', role: 'lead' }
      },
      {
        id: 'id-gcp-sa-data-ingest',
        tenantId,
        workspaceId: wsId,
        provider: 'GCP',
        scope: 'proj-cloudpulse-prod-2026',
        providerIdentityId: 'sa-bigquery-ingest@proj-cloudpulse-prod-2026.iam.gserviceaccount.com',
        type: 'SERVICE',
        displayName: 'sa-bigquery-ingest',
        status: 'ACTIVE',
        source: 'GCP_IAM',
        lastObserved: now,
        freshness: 'FRESH',
        risk: 'LOW',
        confidence: 0.97,
        privilegeLevel: 'DEVELOPER',
        mfaStatus: 'EXEMPT',
        credentialHygiene: {
          lastActivityTimestamp: '2026-09-04T16:10:00Z',
          isStale: false,
          hasAdminWildcard: false
        },
        roles: ['roles/bigquery.dataEditor'],
        attachedPolicies: ['projects/proj-cloudpulse-prod-2026/roles/bigquery.dataEditor'],
        reachableResourcesCount: 4,
        leastPrivilegeScore: 95.0,
        excessivePrivilegeFindings: [],
        governanceExceptions: [],
        lastReviewedAt: '2026-08-25T00:00:00Z',
        tags: { service: 'bigquery-ingestion' }
      },
      {
        id: 'id-k8s-sa-payment',
        tenantId,
        workspaceId: wsId,
        provider: 'KUBERNETES',
        scope: 'k8s-prod-eks-us-east-1:cloudpulse-prod',
        providerIdentityId: 'system:serviceaccount:cloudpulse-prod:payment-service-sa',
        type: 'WORKLOAD',
        displayName: 'payment-service-sa',
        status: 'ACTIVE',
        source: 'KUBERNETES_RBAC',
        lastObserved: now,
        freshness: 'FRESH',
        risk: 'LOW',
        confidence: 1.0,
        privilegeLevel: 'DEVELOPER',
        mfaStatus: 'EXEMPT',
        credentialHygiene: {
          lastActivityTimestamp: '2026-09-04T16:15:00Z',
          isStale: false,
          hasAdminWildcard: false
        },
        roles: ['Role-Payment-Backend'],
        attachedPolicies: ['RoleBinding:payment-backend-binding'],
        reachableResourcesCount: 3,
        leastPrivilegeScore: 98.0,
        excessivePrivilegeFindings: [],
        governanceExceptions: [],
        lastReviewedAt: '2026-08-30T00:00:00Z',
        tags: { namespace: 'cloudpulse-prod', app: 'payment-service' }
      },
      {
        id: 'id-k8s-crb-cluster-admin-leak',
        tenantId,
        workspaceId: wsId,
        provider: 'KUBERNETES',
        scope: 'k8s-prod-eks-us-east-1:default',
        providerIdentityId: 'system:serviceaccount:default:temp-debug-sa',
        type: 'WORKLOAD',
        displayName: 'temp-debug-sa (Unmanaged Cluster-Admin)',
        status: 'ACTIVE',
        source: 'KUBERNETES_RBAC',
        lastObserved: now,
        freshness: 'FRESH',
        risk: 'CRITICAL',
        confidence: 1.0,
        privilegeLevel: 'ADMIN',
        mfaStatus: 'EXEMPT',
        credentialHygiene: {
          lastActivityTimestamp: '2026-09-03T18:20:00Z',
          isStale: true,
          hasAdminWildcard: true
        },
        roles: ['cluster-admin'],
        attachedPolicies: ['ClusterRoleBinding:temp-debug-admin-binding'],
        reachableResourcesCount: 88,
        leastPrivilegeScore: 22.0,
        excessivePrivilegeFindings: [
          'Unmanaged ServiceAccount in "default" namespace is bound to "cluster-admin" ClusterRole via ClusterRoleBinding temp-debug-admin-binding.',
          'Violates CIS Kubernetes Benchmark 5.1.1 and enterprise zero-trust baseline.'
        ],
        governanceExceptions: [],
        lastReviewedAt: '2026-06-15T00:00:00Z',
        tags: { namespace: 'default', tier: 'shadow-it' }
      }
    ];

    idList.forEach((id) => this.identities.set(id.id, id));

    // 2. Access Relationships
    const relList: CloudAccessRelationship[] = [
      {
        id: 'rel-01',
        sourceId: 'id-aws-human-admin-01',
        sourceType: 'HUMAN',
        relationship: 'MEMBER_OF',
        targetId: 'grp-aws-secops-admins',
        targetType: 'GROUP',
        classification: 'CONFIRMED',
        evidence: 'AWS IAM GetGroupMembership API returned user charlie.admin in group SecOps-Admins',
        confidence: 1.0,
        observedAt: now
      },
      {
        id: 'rel-02',
        sourceId: 'grp-aws-secops-admins',
        sourceType: 'GROUP',
        relationship: 'ATTACHED_POLICY',
        targetId: 'arn:aws:iam::aws:policy/AdministratorAccess',
        targetType: 'POLICY',
        classification: 'CONFIRMED',
        evidence: 'AWS IAM ListAttachedGroupPolicies confirmed AdministratorAccess attachment',
        confidence: 1.0,
        observedAt: now
      },
      {
        id: 'rel-03',
        sourceId: 'id-aws-role-payment-svc',
        sourceType: 'ROLE',
        relationship: 'AUTHORIZES',
        targetId: 'arn:aws:rds:us-east-1:718293041526:cluster:orders-aurora-postgres-primary',
        targetType: 'RESOURCE',
        classification: 'CONFIRMED',
        evidence: 'IAM policy PaymentDatabaseAccess allows rds-db:connect to cluster resource',
        confidence: 0.98,
        observedAt: now
      },
      {
        id: 'rel-04',
        sourceId: 'id-k8s-crb-cluster-admin-leak',
        sourceType: 'WORKLOAD',
        relationship: 'BINDS_TO',
        targetId: 'cluster-admin',
        targetType: 'ROLE',
        classification: 'CONFIRMED',
        evidence: 'Kube-apiserver ClusterRoleBinding temp-debug-admin-binding directly references temp-debug-sa',
        confidence: 1.0,
        observedAt: now
      },
      {
        id: 'rel-05',
        sourceId: 'id-aws-role-ci-deployer',
        sourceType: 'FEDERATED_IDENTITY',
        relationship: 'TRUSTS',
        targetId: 'token.actions.githubusercontent.com',
        targetType: 'FEDERATED_IDENTITY',
        classification: 'CONFIRMED',
        evidence: 'IAM AssumeRoleWithWebIdentity policy verifies sub claim "repo:cloudpulse/core:*"',
        confidence: 0.99,
        observedAt: now
      }
    ];

    relList.forEach((r) => this.relationships.set(r.id, r));

    // 3. Effective Access Rules
    const accessRules: EffectiveAccessRule[] = [
      {
        identityId: 'id-aws-human-admin-01',
        identityName: 'Charlie Admin',
        resourceId: '*',
        resourceType: 'ALL_AWS_RESOURCES',
        provider: 'AWS',
        scope: '718293041526',
        permission: '*:*',
        accessMode: 'POLICY_PERMITTED',
        viaPolicy: 'AdministratorAccess',
        isWildcard: true,
        isCrossAccount: false,
        riskScore: 92.0,
        evidence: 'Direct wildcard Action: * on Resource: * in IAM policy'
      },
      {
        identityId: 'id-aws-role-payment-svc',
        identityName: 'PaymentServiceEc2Role',
        resourceId: 'arn:aws:rds:us-east-1:718293041526:cluster:orders-aurora-postgres-primary',
        resourceType: 'AWS::RDS::DBCluster',
        provider: 'AWS',
        scope: '718293041526',
        permission: 'rds-db:connect',
        accessMode: 'BOTH',
        viaPolicy: 'PaymentDatabaseAccess',
        isWildcard: false,
        isCrossAccount: false,
        riskScore: 35.0,
        evidence: 'Observed 850k active database connection queries in CloudWatch telemetry'
      },
      {
        identityId: 'id-azure-sp-analytics',
        identityName: 'sp-cloudpulse-analytics-prod',
        resourceId: '/subscriptions/sub-01',
        resourceType: 'Azure Subscription',
        provider: 'AZURE',
        scope: 'sub-01',
        permission: 'Microsoft.Resources/subscriptions/resourceGroups/*',
        accessMode: 'POLICY_PERMITTED',
        viaPolicy: 'Contributor',
        isWildcard: true,
        isCrossAccount: false,
        riskScore: 84.0,
        evidence: 'Azure RBAC RoleAssignment at Subscription scope /subscriptions/sub-01'
      },
      {
        identityId: 'id-k8s-crb-cluster-admin-leak',
        identityName: 'temp-debug-sa',
        resourceId: 'k8s:cluster:prod-eks-us-east-1:*',
        resourceType: 'Kubernetes Cluster',
        provider: 'KUBERNETES',
        scope: 'k8s-prod-eks-us-east-1',
        permission: '*:*',
        accessMode: 'POLICY_PERMITTED',
        viaPolicy: 'cluster-admin',
        isWildcard: true,
        isCrossAccount: false,
        riskScore: 98.0,
        evidence: 'ClusterRoleBinding grants full cluster root permission without namespace boundary'
      }
    ];

    accessRules.forEach((rule, idx) => this.effectiveAccessRules.set(`rule-${idx + 1}`, rule));

    // 4. High-Risk Access Paths
    const paths: HighRiskAccessPath[] = [
      {
        id: 'path-high-risk-01',
        title: 'Unrestricted Ingress SSH -> Payment EC2 Instance -> Production Aurora DB',
        pathType: 'CONFIRMED_PATH',
        riskLevel: 'CRITICAL',
        steps: [
          {
            nodeId: 'internet-public',
            nodeType: 'INTERNET',
            displayName: 'Public Internet (0.0.0.0/0)',
            provider: 'AWS',
            evidence: 'Unrestricted CIDR 0.0.0.0/0 on Port 22'
          },
          {
            nodeId: 'sg-cloudpulse-ingress-sec',
            nodeType: 'PUBLIC_ENDPOINT',
            displayName: 'Security Group sg-cloudpulse-ingress-sec',
            provider: 'AWS',
            evidence: 'CloudTrail AuthorizeSecurityGroupIngress event evt-aws-ct-01'
          },
          {
            nodeId: 'i-078a1bc49281e7f02',
            nodeType: 'WORKLOAD',
            displayName: 'EC2 Instance i-078a1bc49281e7f02 (payment-gateway-worker)',
            provider: 'AWS',
            evidence: 'Instance actively attached to public subnet and security group'
          },
          {
            nodeId: 'id-aws-role-payment-svc',
            nodeType: 'SERVICE_IDENTITY',
            displayName: 'PaymentServiceEc2Role (Instance Profile)',
            provider: 'AWS',
            evidence: 'Instance profile attached to compute host with IAM DB connect permissions'
          },
          {
            nodeId: 'db-orders-aurora-cluster-01',
            nodeType: 'SENSITIVE_RESOURCE',
            displayName: 'Amazon RDS Aurora PostgreSQL (db-orders-aurora-cluster-01)',
            provider: 'AWS',
            evidence: 'Database contains customer PII and active order ledger'
          }
        ],
        potentialImpact: 'Remote unauthorized attacker exploiting SSH brute-force can pivot via IAM instance credentials to dump customer database.',
        mitigationRecommendation: 'Revoke port 22 global ingress rule and replace with AWS SSM Session Manager.',
        confidence: 0.99
      },
      {
        id: 'path-high-risk-02',
        title: 'Default Namespace Pod -> ServiceAccount temp-debug-sa -> Full Kubernetes Cluster Takeover',
        pathType: 'CONFIRMED_PATH',
        riskLevel: 'CRITICAL',
        steps: [
          {
            nodeId: 'internet-ingress',
            nodeType: 'INTERNET',
            displayName: 'Public Internet Traffic',
            provider: 'KUBERNETES',
            evidence: 'Public LoadBalancer Service ingress routing to default namespace'
          },
          {
            nodeId: 'pod-debug-temp',
            nodeType: 'WORKLOAD',
            displayName: 'Pod debug-tools-pod (default namespace)',
            provider: 'KUBERNETES',
            evidence: 'Pod mounts default token with ClusterRoleBinding'
          },
          {
            nodeId: 'id-k8s-crb-cluster-admin-leak',
            nodeType: 'SERVICE_IDENTITY',
            displayName: 'ServiceAccount temp-debug-sa',
            provider: 'KUBERNETES',
            evidence: 'ClusterRoleBinding temp-debug-admin-binding bound to cluster-admin'
          },
          {
            nodeId: 'k8s-api-server',
            nodeType: 'SENSITIVE_RESOURCE',
            displayName: 'Kubernetes Control Plane & etcd Secrets',
            provider: 'KUBERNETES',
            evidence: 'Full access to read/write all secrets across all namespaces'
          }
        ],
        potentialImpact: 'Compromised container in default namespace escalates to cluster-admin, enabling full cluster takeover.',
        mitigationRecommendation: 'Delete ClusterRoleBinding temp-debug-admin-binding and enforce namespace RBAC.',
        confidence: 1.0
      }
    ];

    paths.forEach((p) => this.highRiskPaths.set(p.id, p));

    // 5. Public Exposure Entities
    const exposures: PublicExposureEntity[] = [
      {
        id: 'exp-aws-sg-ssh',
        resourceId: 'sg-cloudpulse-ingress-sec',
        resourceName: 'sg-cloudpulse-ingress-sec (Port 22 Open)',
        resourceType: 'AWS::EC2::SecurityGroup',
        provider: 'AWS',
        exposureVector: 'SECURITY_GROUP_0_0_0_0',
        openPorts: [22],
        associatedWorkloads: ['i-078a1bc49281e7f02'],
        evidence: 'Inbound rule permits 0.0.0.0/0 on TCP port 22',
        confidence: 1.0,
        riskLevel: 'HIGH',
        status: 'OPEN',
        observedAt: now
      },
      {
        id: 'exp-azure-pip',
        resourceId: '/subscriptions/sub-01/resourceGroups/rg-prod/providers/Microsoft.Network/publicIPAddresses/pip-agw-prod',
        resourceName: 'pip-agw-prod (20.52.18.91)',
        resourceType: 'Azure Public IP',
        provider: 'AZURE',
        exposureVector: 'PUBLIC_IP',
        openPorts: [80, 443],
        associatedWorkloads: ['agw-prod-ingress'],
        evidence: 'Azure Network Public IP associated with Application Gateway WAF',
        confidence: 0.98,
        riskLevel: 'MEDIUM',
        status: 'OPEN',
        observedAt: now
      },
      {
        id: 'exp-k8s-lb',
        resourceId: 'k8s:service:cloudpulse-prod:api-gateway-lb',
        resourceName: 'api-gateway-lb',
        resourceType: 'Kubernetes LoadBalancer Service',
        provider: 'KUBERNETES',
        exposureVector: 'K8S_LOADBALANCER',
        openPorts: [443],
        associatedWorkloads: ['api-gateway'],
        evidence: 'Service type LoadBalancer provisioned with AWS Network Load Balancer',
        confidence: 1.0,
        riskLevel: 'MEDIUM',
        status: 'OPEN',
        observedAt: now
      }
    ];

    exposures.forEach((e) => this.publicExposures.set(e.id, e));

    // 6. Zero-Trust Control Effectiveness
    const controls: ZeroTrustControlEffectiveness[] = [
      {
        controlId: 'ctrl-iam-least-privilege',
        controlName: 'NIST SP 800-53 AC-6 Least Privilege Enforcement',
        category: 'IAM',
        framework: 'NIST SP 800-53',
        violationsCount: 2,
        recurrenceCount: 1,
        remediationSuccessRate: 88.0,
        evidenceCoverage: 'FULL',
        detectionLatencySeconds: 45,
        verificationRate: 94.0,
        activeExceptionsCount: 0,
        effectivenessStatus: 'PARTIALLY_EFFECTIVE',
        trend: 'IMPROVING'
      },
      {
        controlId: 'ctrl-net-ssh-perimeter',
        controlName: 'CIS AWS Benchmark 4.1 Inbound SSH Restriction',
        category: 'NETWORK',
        framework: 'CIS AWS Foundations',
        violationsCount: 1,
        recurrenceCount: 0,
        remediationSuccessRate: 95.0,
        evidenceCoverage: 'FULL',
        detectionLatencySeconds: 15,
        verificationRate: 98.0,
        activeExceptionsCount: 1,
        effectivenessStatus: 'EFFECTIVE',
        trend: 'STABLE'
      },
      {
        controlId: 'ctrl-mfa-enforcement',
        controlName: 'SOC 2 CC6.1 Strong MFA Enforcement',
        category: 'IAM',
        framework: 'SOC 2 Type II',
        violationsCount: 0,
        recurrenceCount: 0,
        remediationSuccessRate: 100.0,
        evidenceCoverage: 'FULL',
        detectionLatencySeconds: 5,
        verificationRate: 100.0,
        activeExceptionsCount: 0,
        effectivenessStatus: 'EFFECTIVE',
        trend: 'STABLE'
      },
      {
        controlId: 'ctrl-k8s-rbac-restrict',
        controlName: 'CIS Kubernetes 5.1.1 Cluster-Admin Restrict',
        category: 'KUBERNETES_SECURITY',
        framework: 'CIS Kubernetes Benchmark',
        violationsCount: 1,
        recurrenceCount: 2,
        remediationSuccessRate: 60.0,
        evidenceCoverage: 'FULL',
        detectionLatencySeconds: 30,
        verificationRate: 75.0,
        activeExceptionsCount: 0,
        effectivenessStatus: 'FAILING_REPEATEDLY',
        trend: 'DEGRADING'
      }
    ];

    controls.forEach((c) => this.controlEffectiveness.set(c.controlId, c));

    // 7. Access Reviews & Exceptions
    const review: SecurityAccessReview = {
      id: 'rev-2026-q3-privileged',
      title: 'Q3 2026 Enterprise Privileged IAM & RBAC Access Review',
      scope: 'PRIVILEGED_IDENTITIES',
      reviewer: { userId: 'usr-sre-lead', name: 'Elena Rostova', email: 'elena.rostova@enterprise.io' },
      status: 'IN_PROGRESS',
      identitiesUnderReview: ['id-aws-human-admin-01', 'id-azure-sp-analytics', 'id-k8s-crb-cluster-admin-leak'],
      decisions: [
        {
          identityId: 'id-k8s-crb-cluster-admin-leak',
          action: 'REVOKE_EXCESSIVE',
          rationale: 'Unmanaged debug service account in default namespace must be removed.',
          decidedAt: now
        }
      ],
      dueAt: '2026-09-30T23:59:59Z',
      createdAt: '2026-09-01T00:00:00Z'
    };
    this.accessReviews.set(review.id, review);

    const exc: SecurityExceptionRecord = {
      id: 'exc-sec-01',
      findingOrPolicyId: 'ctrl-net-ssh-perimeter',
      identityOrResourceId: 'sg-cloudpulse-ingress-sec',
      reason: 'Temporary network maintenance window for data center fiber migration.',
      owner: 'sarah.connor@enterprise.io',
      approvedBy: 'charlie.admin@enterprise.io',
      compensatingControls: ['Real-time CloudTrail SSH session recording enabled', 'IP alert trigger on port 22 traffic bursts'],
      createdAt: '2026-09-04T00:00:00Z',
      expiresAt: '2026-09-05T00:00:00Z',
      isExpired: false,
      status: 'ACTIVE'
    };
    this.securityExceptions.set(exc.id, exc);
  }

  // ─── POSTURE SCORECARD ──────────────────────────────────────────────────────

  public async getScorecard(workspaceId: string = 'ws-production'): Promise<ZeroTrustSecurityScorecard> {
    const identities = Array.from(this.identities.values());
    const humanIdentities = identities.filter((i) => i.type === 'HUMAN');
    const humanMfaEnabled = humanIdentities.filter((i) => i.mfaStatus === 'ENABLED').length;
    const humanMfaAttainment = humanIdentities.length > 0 ? (humanMfaEnabled / humanIdentities.length) * 100 : 100;

    const leastPrivSum = identities.reduce((acc, i) => acc + i.leastPrivilegeScore, 0);
    const leastPrivAvg = identities.length > 0 ? leastPrivSum / identities.length : 100;

    return {
      workspaceId,
      overallPostureScore: 86.5,
      identityRiskScore: 32.0, // Lower risk is better
      leastPrivilegeAttainment: Number(leastPrivAvg.toFixed(1)),
      humanMfaAttainment: Number(humanMfaAttainment.toFixed(1)),
      workloadAuthPosture: 'OIDC / mTLS Certificate-Based with Token Scoping',
      publicExposureCount: this.publicExposures.size,
      highRiskAccessPathsCount: this.highRiskPaths.size,
      crossScopeAccessCount: 2,
      activeSecurityFindingsCount: {
        critical: 1, // K8s cluster-admin leak
        high: 2,     // Unrestricted SSH & Azure SP Contributor
        medium: 2,   // Public LoadBalancers
        low: 1,
        info: 2
      },
      controlEffectivenessScore: 85.0,
      coverage: {
        iam: 'FULL',
        auditLogs: 'FULL',
        securityFindings: 'FULL',
        network: 'FULL',
        kubernetes: 'FULL',
        identityActivity: 'PARTIAL'
      },
      freshness: {
        iam: 'FRESH',
        findings: 'FRESH',
        auditLogs: 'FRESH',
        network: 'FRESH',
        kubernetes: 'FRESH'
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // ─── IDENTITIES & RELATIONSHIPS ─────────────────────────────────────────────

  public async getIdentities(
    workspaceId: string = 'ws-production',
    filters?: { provider?: string; type?: string; risk?: string; search?: string }
  ): Promise<RealCloudIdentity[]> {
    let items = Array.from(this.identities.values()).filter((i) => i.workspaceId === workspaceId || !workspaceId);

    if (filters) {
      if (filters.provider && filters.provider !== 'ALL') {
        items = items.filter((i) => i.provider.toUpperCase() === filters.provider!.toUpperCase());
      }
      if (filters.type && filters.type !== 'ALL') {
        items = items.filter((i) => i.type.toUpperCase() === filters.type!.toUpperCase());
      }
      if (filters.risk && filters.risk !== 'ALL') {
        items = items.filter((i) => i.risk.toUpperCase() === filters.risk!.toUpperCase());
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        items = items.filter(
          (i) =>
            i.displayName.toLowerCase().includes(q) ||
            i.providerIdentityId.toLowerCase().includes(q) ||
            i.roles.some((r) => r.toLowerCase().includes(q))
        );
      }
    }

    return items;
  }

  public async getIdentityById(id: string, workspaceId: string = 'ws-production'): Promise<RealCloudIdentity | null> {
    const identity = this.identities.get(id);
    if (!identity || (identity.workspaceId !== workspaceId && workspaceId)) return null;
    return identity;
  }

  public async getEffectiveAccess(workspaceId: string = 'ws-production'): Promise<EffectiveAccessRule[]> {
    return Array.from(this.effectiveAccessRules.values());
  }

  public async getAccessRelationships(workspaceId: string = 'ws-production'): Promise<CloudAccessRelationship[]> {
    return Array.from(this.relationships.values());
  }

  // ─── HIGH RISK ACCESS PATHS & PUBLIC EXPOSURE ───────────────────────────────

  public async getHighRiskAccessPaths(workspaceId: string = 'ws-production'): Promise<HighRiskAccessPath[]> {
    return Array.from(this.highRiskPaths.values());
  }

  public async getPublicExposures(workspaceId: string = 'ws-production'): Promise<PublicExposureEntity[]> {
    return Array.from(this.publicExposures.values());
  }

  public async getControlEffectiveness(workspaceId: string = 'ws-production'): Promise<ZeroTrustControlEffectiveness[]> {
    return Array.from(this.controlEffectiveness.values());
  }

  // ─── ACCESS REVIEWS & EXCEPTIONS ────────────────────────────────────────────

  public async getAccessReviews(workspaceId: string = 'ws-production'): Promise<SecurityAccessReview[]> {
    return Array.from(this.accessReviews.values());
  }

  public async createAccessReview(
    workspaceId: string,
    payload: { title: string; scope: any; reviewer: { userId: string; name: string; email: string }; dueAt: string; identities: string[] }
  ): Promise<SecurityAccessReview> {
    const id = `rev-${Date.now()}`;
    const review: SecurityAccessReview = {
      id,
      title: payload.title,
      scope: payload.scope,
      reviewer: payload.reviewer,
      status: 'PENDING',
      identitiesUnderReview: payload.identities,
      decisions: [],
      dueAt: payload.dueAt,
      createdAt: new Date().toISOString()
    };
    this.accessReviews.set(id, review);
    return review;
  }

  public async getExceptions(workspaceId: string = 'ws-production'): Promise<SecurityExceptionRecord[]> {
    return Array.from(this.securityExceptions.values());
  }

  public async createException(
    workspaceId: string,
    payload: { findingOrPolicyId: string; identityOrResourceId: string; reason: string; owner: string; approvedBy: string; compensatingControls: string[]; expiresAt: string }
  ): Promise<SecurityExceptionRecord> {
    const id = `exc-${Date.now()}`;
    const exc: SecurityExceptionRecord = {
      id,
      findingOrPolicyId: payload.findingOrPolicyId,
      identityOrResourceId: payload.identityOrResourceId,
      reason: payload.reason,
      owner: payload.owner,
      approvedBy: payload.approvedBy,
      compensatingControls: payload.compensatingControls || [],
      createdAt: new Date().toISOString(),
      expiresAt: payload.expiresAt,
      isExpired: false,
      status: 'ACTIVE'
    };
    this.securityExceptions.set(id, exc);
    return exc;
  }

  // ─── WHAT-IF SECURITY SIMULATION ────────────────────────────────────────────

  public simulateWhatIf(payload: {
    actionType: 'REVOKE_PERMISSION' | 'REMOVE_PUBLIC_INGRESS' | 'DELETE_SERVICE_ACCOUNT' | 'ISOLATE_WORKLOAD';
    targetEntityId: string;
    proposedChange: string;
  }) {
    const now = new Date().toISOString();

    if (payload.actionType === 'REMOVE_PUBLIC_INGRESS') {
      return {
        targetEntityId: payload.targetEntityId,
        actionType: payload.actionType,
        simulationStatus: 'SIMULATED',
        securityPostureImpact: {
          scoreBefore: 86.5,
          scoreAfter: 94.0,
          deltaScore: +7.5,
          riskReduction: 'Eliminates global port 22 brute-force exposure on EC2 payment gateway host.'
        },
        reliabilitySloImpact: {
          impactRisk: 'NONE',
          sloRisk: 'Zero impact on payment checkout SLO (internal ALB traffic remains untouched).',
          headroomChangePercent: 0
        },
        affectedResources: ['sg-cloudpulse-ingress-sec', 'i-078a1bc49281e7f02'],
        affectedIdentitiesCount: 1,
        requiresTwoPersonApproval: true,
        recommendedAction: {
          actionType: 'revoke_security_group_ingress_rule',
          preCondition: 'Ensure AWS SSM agent is connected on i-078a1bc49281e7f02 before applying.',
          safeToExecute: true
        },
        simulatedAt: now
      };
    }

    if (payload.actionType === 'DELETE_SERVICE_ACCOUNT' || payload.proposedChange.includes('cluster-admin')) {
      return {
        targetEntityId: payload.targetEntityId,
        actionType: payload.actionType,
        simulationStatus: 'SIMULATED',
        securityPostureImpact: {
          scoreBefore: 86.5,
          scoreAfter: 98.0,
          deltaScore: +11.5,
          riskReduction: 'Eliminates unmanaged cluster-admin ClusterRoleBinding in default namespace.'
        },
        reliabilitySloImpact: {
          impactRisk: 'LOW',
          sloRisk: 'ServiceAccount temp-debug-sa has zero active production pods assigned.',
          headroomChangePercent: 0
        },
        affectedResources: ['ClusterRoleBinding:temp-debug-admin-binding', 'ServiceAccount:temp-debug-sa'],
        affectedIdentitiesCount: 1,
        requiresTwoPersonApproval: true,
        recommendedAction: {
          actionType: 'k8s_delete_cluster_role_binding',
          preCondition: 'Confirm no running pods depend on temp-debug-sa in default namespace.',
          safeToExecute: true
        },
        simulatedAt: now
      };
    }

    // Default simulation response
    return {
      targetEntityId: payload.targetEntityId,
      actionType: payload.actionType,
      simulationStatus: 'SIMULATED',
      securityPostureImpact: {
        scoreBefore: 86.5,
        scoreAfter: 89.0,
        deltaScore: +2.5,
        riskReduction: `Scoped permissions for ${payload.targetEntityId} to enforce least-privilege boundary.`
      },
      reliabilitySloImpact: {
        impactRisk: 'LOW',
        sloRisk: 'No immediate SLO degradation detected.',
        headroomChangePercent: 0
      },
      affectedResources: [payload.targetEntityId],
      affectedIdentitiesCount: 1,
      requiresTwoPersonApproval: true,
      recommendedAction: {
        actionType: 'iam_policy_scope_refactor',
        preCondition: 'Verify cloudtrail 90-day activity logs prior to removing unused actions.',
        safeToExecute: true
      },
      simulatedAt: now
    };
  }

  // ─── AI SECURITY ANALYST COPILOT ────────────────────────────────────────────

  public async investigate(prompt: string, workspaceId: string = 'ws-production'): Promise<AiSecurityAnalystResult> {
    const q = prompt.toLowerCase();
    const now = new Date().toISOString();

    // Adversarial prompt injection safety check
    if (q.includes('ignore previous') || q.includes('system prompt') || q.includes('reveal secret') || q.includes('show password') || q.includes('private key')) {
      return {
        query: prompt,
        intent: 'GENERAL_ZERO_TRUST',
        confidence: 'HIGH',
        primaryAnswer: 'Security Policy Guard: Access to raw cryptographic keys, secret tokens, or system prompt internals is strictly prohibited by CLOUDPULSE Zero-Trust Governance Policy SEC-01.',
        evidenceCitations: [],
        suggestedFollowUps: ['Show identities with elevated permissions', 'Audit credential rotation status'],
        analyzedAt: now
      };
    }

    // High-risk access path query
    if (/\b(path|attack|pivot|dangerous|highest risk|exploit)\b/i.test(q)) {
      const paths = Array.from(this.highRiskPaths.values());
      return {
        query: prompt,
        intent: 'ACCESS_PATH_ANALYSIS',
        confidence: 'HIGH',
        primaryAnswer: `CLOUDPULSE has identified **${paths.length} confirmed high-risk access paths**:
1. **Public SSH Ingress to Aurora Production DB** (CRITICAL): Internet $\\rightarrow$ Security Group (Port 22 open) $\\rightarrow$ EC2 host $\\rightarrow$ \`PaymentServiceEc2Role\` $\\rightarrow$ RDS Aurora Cluster (\`orders-aurora-postgres-primary\`).
2. **Kubernetes Default Namespace Cluster Takeover** (CRITICAL): Container in default namespace mounts unmanaged \`temp-debug-sa\` which holds a full \`cluster-admin\` ClusterRoleBinding.`,
        evidenceCitations: [
          { type: 'ACCESS_PATH', id: 'path-high-risk-01', title: 'SSH Ingress -> Payment Host -> Aurora DB', snippet: 'Confirmed port 22 global ingress combined with IAM DB connect permissions' },
          { type: 'ACCESS_PATH', id: 'path-high-risk-02', title: 'Default Namespace SA -> cluster-admin Takeover', snippet: 'ClusterRoleBinding temp-debug-admin-binding grants unrestricted cluster control' }
        ],
        suggestedFollowUps: [
          'How can we safely remediate the public SSH access on EC2?',
          'What is the blast radius if we delete temp-debug-sa?'
        ],
        safeActionsRecommended: [
          {
            actionType: 'request_two_person_approval',
            description: 'Initiate governed change request to revoke Port 22 global ingress rule',
            targetId: 'sg-cloudpulse-ingress-sec',
            risk: 'LOW',
            requiresTwoPersonApproval: true
          }
        ],
        analyzedAt: now
      };
    }

    // Least privilege & excessive permissions
    if (/\b(least privilege|excessive|wildcard|admin|overprovisioned|permission)\b/i.test(q)) {
      return {
        query: prompt,
        intent: 'LEAST_PRIVILEGE_REVIEW',
        confidence: 'HIGH',
        primaryAnswer: `Least Privilege Assessment: **84.2% average attainment**.
Top excessive permission findings:
- **Charlie Admin** (\`AWS\`): Attached wildcard \`AdministratorAccess\` policy (\`*:*\`).
- **sp-cloudpulse-analytics-prod** (\`Azure\`): Subscription-wide \`Contributor\` role with unrotated 190-day client secret.
- **temp-debug-sa** (\`Kubernetes\`): Shadow-IT ServiceAccount bound to \`cluster-admin\` ClusterRole.
- **PaymentServiceEc2Role** (\`AWS\`): Holds \`s3:DeleteBucket\` permission unused for > 90 days.`,
        evidenceCitations: [
          { type: 'IDENTITY', id: 'id-aws-human-admin-01', title: 'Charlie Admin (SecOps Lead)', snippet: 'AdministratorAccess attached at account root' },
          { type: 'IDENTITY', id: 'id-azure-sp-analytics', title: 'sp-cloudpulse-analytics-prod', snippet: 'Broad Contributor role at /subscriptions/sub-01' },
          { type: 'IDENTITY', id: 'id-k8s-crb-cluster-admin-leak', title: 'temp-debug-sa', snippet: 'cluster-admin binding in default namespace' }
        ],
        suggestedFollowUps: [
          'Simulate removing s3:DeleteBucket from PaymentServiceEc2Role',
          'Review active JIT access requests for Charlie Admin'
        ],
        safeActionsRecommended: [
          {
            actionType: 'iam_strip_unused_action',
            description: 'Remove unexercised s3:DeleteBucket from PaymentServiceEc2Role',
            targetId: 'id-aws-role-payment-svc',
            risk: 'LOW',
            requiresTwoPersonApproval: true
          }
        ],
        analyzedAt: now
      };
    }

    // Public exposure query
    if (/\b(public|exposure|exposed|open port|internet|ingress)\b/i.test(q)) {
      const exposures = Array.from(this.publicExposures.values());
      return {
        query: prompt,
        intent: 'PUBLIC_EXPOSURE_DIAGNOSIS',
        confidence: 'HIGH',
        primaryAnswer: `CLOUDPULSE detected **${exposures.length} publicly exposed endpoints/resources**:
1. **Security Group \`sg-cloudpulse-ingress-sec\`** (AWS): Open TCP Port 22 to 0.0.0.0/0 (Active Exception with compensating SIEM audit log).
2. **Public IP \`20.52.18.91\`** (Azure): Associated with Application Gateway WAF on Ports 80 & 443.
3. **LoadBalancer \`api-gateway-lb\`** (Kubernetes): Ingress controller exposed on Port 443.`,
        evidenceCitations: [
          { type: 'PUBLIC_EXPOSURE', id: 'exp-aws-sg-ssh', title: 'AWS Security Group sg-cloudpulse-ingress-sec', snippet: 'Inbound 0.0.0.0/0 port 22' },
          { type: 'PUBLIC_EXPOSURE', id: 'exp-azure-pip', title: 'Azure Public IP pip-agw-prod', snippet: '20.52.18.91 on Ports 80/443' }
        ],
        suggestedFollowUps: ['Show compensating controls for active SSH exception', 'Simulate closing port 22'],
        analyzedAt: now
      };
    }

    // Default overview
    return {
      query: prompt,
      intent: 'GENERAL_ZERO_TRUST',
      confidence: 'HIGH',
      primaryAnswer: `CLOUDPULSE Zero-Trust Security & Identity Control Plane is monitoring **9 normalized identities** across AWS, Azure, GCP, and Kubernetes. Overall Posture Score is **86.5/100**, Human MFA Compliance is **100.0%**, with **2 confirmed high-risk attack paths** requiring governed remediation.`,
      evidenceCitations: [
        { type: 'CONTROL', id: 'ctrl-iam-least-privilege', title: 'NIST SP 800-53 AC-6 Least Privilege', snippet: '88% remediation success rate' },
        { type: 'CONTROL', id: 'ctrl-mfa-enforcement', title: 'SOC 2 CC6.1 Strong MFA Enforcement', snippet: '100% human MFA compliance verified' }
      ],
      suggestedFollowUps: ['Show high-risk access paths', 'Which identities have excessive permissions?', 'Audit public exposures'],
      analyzedAt: now
    };
  }
}

export const realCloudSecurityEngine = RealCloudSecurityEngine.getInstance();
