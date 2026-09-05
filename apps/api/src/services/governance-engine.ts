import {
  GovernanceSummary,
  IdentityRecord,
  GovernanceRole,
  LeastPrivilegeAnalysis,
  SecurityPolicyRule,
  PolicySimulationRequest,
  PolicySimulationResult,
  PolicyViolation,
  AccessReviewItem,
  AccessRequestItem,
  ComplianceControlMapping,
  GovernancePolicy,
  ComplianceEvidence,
  GovernanceComplianceFinding,
  PolicyException,
  GovernanceRemediationAction,
  ComplianceScan,
  ComplianceFrameworkDetail,
  GovernancePlatformSummary
} from '@cloudpulse/shared';

export class GovernanceEngine {
  private static instance: GovernanceEngine;

  private identities: IdentityRecord[] = [
    {
      id: 'id-admin-01',
      name: 'platform-admin',
      type: 'user',
      provider: 'local',
      accountId: 'cloudpulse-master',
      status: 'active',
      lastSeenAt: new Date().toISOString(),
      roles: ['role-global-admin'],
      grantedPermissionsCount: 48,
      usedPermissionsCount: 14,
      riskScore: 65,
      isPrivileged: true
    },
    {
      id: 'id-svc-payment',
      name: 'payment-service-sa',
      type: 'workload',
      provider: 'kubernetes',
      accountId: 'cloudpulse-eks-cluster',
      status: 'active',
      lastSeenAt: new Date().toISOString(),
      roles: ['role-payment-sa'],
      grantedPermissionsCount: 6,
      usedPermissionsCount: 5,
      riskScore: 12,
      isPrivileged: false
    },
    {
      id: 'id-svc-telemetry',
      name: 'telemetry-engine-sa',
      type: 'workload',
      provider: 'kubernetes',
      accountId: 'cloudpulse-eks-cluster',
      status: 'active',
      lastSeenAt: new Date().toISOString(),
      roles: ['role-telemetry-sa'],
      grantedPermissionsCount: 8,
      usedPermissionsCount: 7,
      riskScore: 15,
      isPrivileged: false
    },
    {
      id: 'id-legacy-ci',
      name: 'legacy-ci-bot',
      type: 'service',
      provider: 'aws',
      accountId: '123456789012',
      status: 'stale',
      lastSeenAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      roles: ['role-ci-deployer'],
      grantedPermissionsCount: 32,
      usedPermissionsCount: 2,
      riskScore: 82,
      isPrivileged: true
    }
  ];

  private roles: GovernanceRole[] = [
    {
      id: 'role-global-admin',
      name: 'GlobalPlatformAdministrator',
      provider: 'local',
      scope: 'cluster-wide',
      permissions: ['*'],
      isPrivileged: true,
      riskLevel: 'critical',
      description: 'Superuser administrative access across all platform control plane APIs.'
    },
    {
      id: 'role-payment-sa',
      name: 'PaymentServiceWorkloadRole',
      provider: 'kubernetes',
      scope: 'namespace:cloudpulse',
      permissions: [
        'secrets:get(payment-sandbox-creds)',
        'configmaps:get(payment-config)',
        'events:create'
      ],
      isPrivileged: false,
      riskLevel: 'low',
      description: 'Scoped workload identity for payment microservice transaction handling.'
    },
    {
      id: 'role-ci-deployer',
      name: 'LegacyAwsCiDeployer',
      provider: 'aws',
      scope: 'account:123456789012',
      permissions: [
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'eks:DescribeCluster',
        's3:*'
      ],
      isPrivileged: true,
      riskLevel: 'high',
      description: 'Legacy long-lived CI service role superseded by GitHub Actions OIDC.'
    }
  ];

  private policies: SecurityPolicyRule[] = [
    {
      id: 'pol-no-wildcard-iam',
      name: 'Disallow Wildcard IAM Policies',
      description: 'Prohibits policies with Action: * or Resource: * on non-admin entities.',
      severity: 'critical',
      effect: 'DENY',
      resourceTypes: ['iam_policy', 'governance_role'],
      conditionDescription: 'Action contains "*" and Principal is not EmergencyBreakGlass',
      status: 'active'
    },
    {
      id: 'pol-no-public-storage',
      name: 'Enforce Private Cloud Storage',
      description: 'Blocks public read/write access policies on Amazon S3, Azure Blob, and GCS buckets.',
      severity: 'critical',
      effect: 'DENY',
      resourceTypes: ['storage_bucket'],
      conditionDescription: 'BucketPolicy contains Principal: "*" or PublicAccessBlock is disabled',
      status: 'active'
    },
    {
      id: 'pol-non-root-container',
      name: 'Enforce Non-Root Container Execution',
      description: 'Requires all Kubernetes workloads to execute with runAsNonRoot: true.',
      severity: 'high',
      effect: 'DENY',
      resourceTypes: ['kubernetes_deployment', 'kubernetes_pod'],
      conditionDescription: 'SecurityContext runAsNonRoot != true or runAsUser == 0',
      status: 'active'
    },
    {
      id: 'pol-ebs-kms-encryption',
      name: 'Enforce KMS Storage Encryption',
      description: 'Ensures all attached EBS persistent storage volumes are encrypted at rest with AWS KMS.',
      severity: 'high',
      effect: 'DENY',
      resourceTypes: ['ebs_volume'],
      conditionDescription: 'Encrypted != true',
      status: 'active'
    }
  ];

  private governancePolicies: GovernancePolicy[] = [
    {
      id: 'gov-pol-001',
      name: 'Zero-Trust Workload Identity Policy',
      description: 'Workloads must use OIDC-federated IAM roles or Kubernetes ServiceAccounts with least privilege.',
      category: 'IDENTITY',
      severity: 'critical',
      scope: 'global',
      version: '1.3.0',
      status: 'active',
      enabled: true,
      createdAt: '2026-08-28T04:00:00Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'gov-pol-002',
      name: 'Mandatory Resource Tagging Governance',
      description: 'All cloud resources must define Environment, Project, Owner, and CostCenter tags.',
      category: 'RESOURCE_OWNERSHIP',
      severity: 'medium',
      scope: 'aws,azure,gcp',
      version: '1.1.0',
      status: 'active',
      enabled: true,
      createdAt: '2026-08-28T04:30:00Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'gov-pol-003',
      name: 'Kubernetes Pod Security Standards (Restricted)',
      description: 'Pods must run as non-root, drop ALL Linux capabilities, and mount read-only filesystems.',
      category: 'KUBERNETES',
      severity: 'high',
      scope: 'kubernetes:all',
      version: '2.0.1',
      status: 'active',
      enabled: true,
      createdAt: '2026-08-28T05:00:00Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'gov-pol-004',
      name: 'Continuous Multi-AZ Backup & RTO SLA',
      description: 'Critical Tier-0 database snapshots must replicate across AZs with validated RTO < 60s.',
      category: 'RESILIENCE',
      severity: 'critical',
      scope: 'storage:tier-0',
      version: '1.0.0',
      status: 'active',
      enabled: true,
      createdAt: '2026-08-28T05:30:00Z',
      updatedAt: new Date().toISOString()
    }
  ];

  private complianceEvidence: ComplianceEvidence[] = [
    {
      id: 'evd-001',
      controlId: 'CIS-1.16',
      resourceId: 'arn:aws:iam::123456789012:role/cloudpulse-prod-role',
      source: 'AWS IAM API & Terraform State',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'pass',
      reference: 'infra/terraform/modules/iam/main.tf',
      metadata: { attachedPoliciesCount: 2, inlinePoliciesCount: 0 },
      freshness: 'fresh'
    },
    {
      id: 'evd-002',
      controlId: 'CIS-K8S-5.2.6',
      resourceId: 'deploy/kubernetes/api-gateway.yaml',
      source: 'Kubernetes API Server Audit Log',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      status: 'pass',
      reference: 'deploy/kubernetes/*.yaml:securityContext',
      metadata: { runAsNonRoot: true, runAsUser: 1000 },
      freshness: 'fresh'
    }
  ];

  private complianceFindings: GovernanceComplianceFinding[] = [
    {
      id: 'gfind-001',
      controlId: 'NIST-AC-6',
      resourceId: 'role-ci-deployer',
      severity: 'high',
      status: 'remediation_planned',
      evidence: 'Role grants s3:* wildcard permissions across account:123456789012.',
      description: 'Legacy CI deployer role contains unused administrative S3 permissions.',
      recommendation: 'Decommission legacy IAM role and migrate remaining pipelines to GitHub Actions OIDC.',
      createdAt: '2026-08-29T10:00:00Z',
      updatedAt: new Date().toISOString()
    }
  ];

  private policyExceptions: PolicyException[] = [
    {
      id: 'exc-001',
      policyId: 'gov-pol-002',
      resourceId: 'arn:aws:s3:::cloudpulse-legacy-assets-tmp',
      reason: 'Temporary staging bucket for data migration; scheduled for decommissioning.',
      owner: 'infra-team@cloudpulse.internal',
      approvedBy: 'security-lead@cloudpulse.internal',
      expiresAt: new Date(Date.now() + 86400000 * 14).toISOString(),
      status: 'active'
    }
  ];

  private remediationActions: GovernanceRemediationAction[] = [
    {
      id: 'rem-001',
      findingId: 'gfind-001',
      type: 'iam_change',
      description: 'Revoke s3:* wildcard permission from LegacyAwsCiDeployer and attach scoped OIDC trust policy.',
      risk: 'low',
      status: 'pending_approval',
      approval: {
        required: true
      },
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  private complianceScans: ComplianceScan[] = [
    {
      id: 'scan-20260831-01',
      scope: 'all',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3540000).toISOString(),
      status: 'completed',
      resourcesCount: 48,
      controlsCount: 14,
      findingsCount: 1
    }
  ];

  private complianceFrameworks: ComplianceFrameworkDetail[] = [
    {
      id: 'framework-cis-aws',
      name: 'CIS Amazon Web Services Foundations Benchmark',
      version: 'v2.0.0',
      description: 'Prescriptive security recommendations for hardening AWS cloud infrastructure.',
      controls: ['CIS-1.16', 'CIS-2.1.1', 'CIS-3.1', 'CIS-4.1']
    },
    {
      id: 'framework-cis-k8s',
      name: 'CIS Kubernetes Benchmark',
      version: 'v1.8.0',
      description: 'Security configurations for Kubernetes master nodes, worker nodes, and workloads.',
      controls: ['CIS-K8S-5.2.6', 'CIS-K8S-5.3.2', 'CIS-K8S-5.4.1']
    },
    {
      id: 'framework-nist-800-53',
      name: 'NIST SP 800-53 Rev. 5',
      version: 'Rev 5',
      description: 'Security and Privacy Controls for Information Systems and Organizations.',
      controls: ['AC-6', 'IA-2', 'SC-8', 'CP-9']
    },
    {
      id: 'framework-iso-27001',
      name: 'ISO/IEC 27001:2022',
      version: '2022',
      description: 'Information security management systems specifications and control sets.',
      controls: ['A.8.1', 'A.8.20', 'A.8.24']
    }
  ];

  private violations: PolicyViolation[] = [
    {
      id: 'viol-001',
      policyId: 'pol-no-wildcard-iam',
      policyName: 'Disallow Wildcard IAM Policies',
      resourceId: 'role-ci-deployer',
      resourceName: 'LegacyAwsCiDeployer',
      provider: 'aws',
      severity: 'high',
      status: 'open',
      evidence: 'Role grants s3:* wildcard permissions across account:123456789012.',
      remediation: 'Scope s3 permissions strictly to s3:GetObject/PutObject on specific release buckets or revoke role.',
      detectedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];

  private accessReviews: AccessReviewItem[] = [
    {
      id: 'rev-001',
      identityId: 'id-legacy-ci',
      identityName: 'legacy-ci-bot',
      roleOrPermission: 'LegacyAwsCiDeployer (s3:*)',
      resource: 'arn:aws:iam::123456789012:role/LegacyAwsCiDeployer',
      riskLevel: 'high',
      lastUsedAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      reviewStatus: 'review_required'
    },
    {
      id: 'rev-002',
      identityId: 'id-admin-01',
      identityName: 'platform-admin',
      roleOrPermission: 'GlobalPlatformAdministrator (*)',
      resource: 'cloudpulse-control-plane',
      riskLevel: 'critical',
      lastUsedAt: new Date().toISOString(),
      reviewStatus: 'approved',
      reviewer: 'security-lead@cloudpulse.local',
      reviewedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  private accessRequests: AccessRequestItem[] = [
    {
      id: 'req-001',
      requester: 'developer-jane@cloudpulse.local',
      resource: 'k8s-pod:payment-service-7d84b84c8f-9x2pl',
      requestedRoleOrPermission: 'kubectl-exec-debug',
      reason: 'Live debugging of transient DB connection pool timeout issue.',
      durationMinutes: 60,
      riskLevel: 'medium',
      status: 'pending',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      expiresAt: new Date(Date.now() + 1800000).toISOString()
    }
  ];

  private complianceControls: ComplianceControlMapping[] = [
    {
      id: 'comp-cis-aws-1',
      framework: 'CIS_AWS',
      controlId: 'CIS-1.16',
      title: 'Ensure IAM policies are attached only to groups or roles',
      status: 'pass',
      evaluatedResourceCount: 8,
      passingResourceCount: 8,
      description: 'Zero inline IAM policies attached directly to individual IAM users.'
    },
    {
      id: 'comp-cis-aws-2',
      framework: 'CIS_AWS',
      controlId: 'CIS-2.1.1',
      title: 'Ensure all S3 buckets have default encryption enabled',
      status: 'pass',
      evaluatedResourceCount: 3,
      passingResourceCount: 3,
      description: 'All S3 state and asset buckets enforce AES256 or AWS-KMS default encryption.'
    },
    {
      id: 'comp-nist-1',
      framework: 'NIST_800_53',
      controlId: 'AC-6',
      title: 'Least Privilege Enforcement',
      status: 'partial',
      evaluatedResourceCount: 12,
      passingResourceCount: 10,
      description: '10 of 12 identities strictly scoped; 1 stale CI role with wildcard permissions flagged.'
    }
  ];

  public static getInstance(): GovernanceEngine {
    if (!GovernanceEngine.instance) {
      GovernanceEngine.instance = new GovernanceEngine();
    }
    return GovernanceEngine.instance;
  }

  public getSummary(): GovernanceSummary {
    const privilegedCount = this.identities.filter((i) => i.isPrivileged).length;
    const openViolations = this.violations.filter((v) => v.status === 'open').length;
    const pendingReviews = this.accessReviews.filter((r) => r.reviewStatus === 'review_required').length;
    const pendingRequests = this.accessRequests.filter((r) => r.status === 'pending').length;
    const totalRisk = this.identities.reduce((acc, i) => acc + i.riskScore, 0);
    const avgRisk = Math.round(totalRisk / Math.max(1, this.identities.length));

    const passingControls = this.complianceControls.filter((c) => c.status === 'pass').length;
    const partialControls = this.complianceControls.filter((c) => c.status === 'partial').length;
    const overallComplianceScore = Math.round(
      ((passingControls * 1.0 + partialControls * 0.5) / Math.max(1, this.complianceControls.length)) * 100
    );

    return {
      totalIdentitiesCount: this.identities.length,
      privilegedIdentitiesCount: privilegedCount,
      openPolicyViolationsCount: openViolations,
      pendingAccessReviewsCount: pendingReviews,
      pendingAccessRequestsCount: pendingRequests,
      averageIdentityRiskScore: avgRisk,
      overallComplianceScore,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getPlatformSummary(): GovernancePlatformSummary {
    const passing = this.complianceControls.filter((c) => c.status === 'pass').length;
    const partial = this.complianceControls.filter((c) => c.status === 'partial').length;
    const total = this.complianceControls.length;
    const overallComplianceScore = Math.round(((passing * 1.0 + partial * 0.5) / Math.max(1, total)) * 100);

    return {
      overallComplianceScore,
      governanceRiskScore: {
        overall: 18,
        critical: 0,
        high: 1,
        medium: 2,
        low: 4
      },
      activePoliciesCount: this.governancePolicies.filter((p) => p.status === 'active').length,
      totalControlsCount: total,
      passingControlsCount: passing,
      failingControlsCount: this.complianceControls.filter((c) => c.status === 'fail').length,
      openFindingsCount: this.complianceFindings.filter((f) => f.status === 'open' || f.status === 'remediation_planned').length,
      activeExceptionsCount: this.policyExceptions.filter((e) => e.status === 'active').length,
      evidenceFreshnessPercent: 95.0,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getGovernancePolicies(): GovernancePolicy[] {
    return this.governancePolicies;
  }

  public getComplianceEvidence(): ComplianceEvidence[] {
    return this.complianceEvidence;
  }

  public getComplianceFindings(): GovernanceComplianceFinding[] {
    return this.complianceFindings;
  }

  public getPolicyExceptions(): PolicyException[] {
    return this.policyExceptions;
  }

  public getRemediationActions(): GovernanceRemediationAction[] {
    return this.remediationActions;
  }

  public approveRemediationAction(id: string, approver: string): GovernanceRemediationAction {
    const action = this.remediationActions.find((a) => a.id === id);
    if (!action) {
      throw new Error(`Remediation action '${id}' not found`);
    }
    action.status = 'approved';
    action.approval.approver = approver;
    action.approval.approvedAt = new Date().toISOString();
    return action;
  }

  public getComplianceScans(): ComplianceScan[] {
    return this.complianceScans;
  }

  public triggerComplianceScan(scope: string = 'all'): ComplianceScan {
    const scan: ComplianceScan = {
      id: `scan-${Date.now()}`,
      scope,
      startedAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 500).toISOString(),
      status: 'completed',
      resourcesCount: 48,
      controlsCount: this.complianceControls.length,
      findingsCount: this.complianceFindings.length
    };
    this.complianceScans.unshift(scan);
    return scan;
  }

  public getComplianceFrameworks(): ComplianceFrameworkDetail[] {
    return this.complianceFrameworks;
  }

  public getIdentities(): IdentityRecord[] {
    return this.identities;
  }

  public getRoles(): GovernanceRole[] {
    return this.roles;
  }

  public getLeastPrivilegeAnalysis(): LeastPrivilegeAnalysis[] {
    return this.identities.map((identity) => {
      const granted = identity.grantedPermissionsCount;
      const used = identity.usedPermissionsCount;
      const unusedCount = Math.max(0, granted - used);
      const ratio = granted > 0 ? Number((unusedCount / granted).toFixed(2)) : 0;

      let riskLevel: LeastPrivilegeAnalysis['riskLevel'] = 'low';
      let recommendation = 'Permissions match observed operational access profile.';

      if (ratio > 0.7) {
        riskLevel = 'critical';
        recommendation = `Identity has ${unusedCount} unused permissions (${(ratio * 100).toFixed(0)}% excess). Downscope role bindings immediately.`;
      } else if (ratio > 0.4) {
        riskLevel = 'medium';
        recommendation = `Review ${unusedCount} unused permissions during the next scheduled access review cycle.`;
      }

      return {
        identityId: identity.id,
        identityName: identity.name,
        grantedPermissions: Array.from({ length: granted }, (_, i) => `permission_${i + 1}`),
        usedPermissions: Array.from({ length: used }, (_, i) => `permission_${i + 1}`),
        unusedPermissions: Array.from({ length: unusedCount }, (_, i) => `permission_unused_${i + 1}`),
        excessivePermissionsRatio: ratio,
        riskLevel,
        recommendation
      };
    });
  }

  public getPolicies(): SecurityPolicyRule[] {
    return this.policies;
  }

  public simulatePolicy(req: PolicySimulationRequest): PolicySimulationResult {
    const { identityId, action, resourceId } = req;
    const identity = this.identities.find((i) => i.id === identityId);

    if (action.includes('*') && !identity?.roles.includes('role-global-admin')) {
      return {
        decision: 'DENY',
        matchedPolicyId: 'pol-no-wildcard-iam',
        matchedPolicyName: 'Disallow Wildcard IAM Policies',
        reason: 'Wildcard actions are prohibited by Zero-Trust policy pol-no-wildcard-iam.',
        evidence: [
          `Action requested: ${action}`,
          `Identity '${identity?.name || identityId}' does not possess break-glass exemption`
        ]
      };
    }

    return {
      decision: 'ALLOW',
      matchedPolicyName: 'Standard Role-Based Access Policy',
      reason: `Action '${action}' on resource '${resourceId}' is authorized by assigned role.`,
      evidence: [
        `Identity '${identity?.name || identityId}' possesses valid role binding`,
        'Context constraints (TLS 1.3, internal VPC CIDR) satisfied'
      ]
    };
  }

  public getViolations(): PolicyViolation[] {
    return this.violations;
  }

  public getAccessReviews(): AccessReviewItem[] {
    return this.accessReviews;
  }

  public updateAccessReviewDecision(
    id: string,
    decision: 'approved' | 'revoked',
    reviewer: string
  ): AccessReviewItem {
    const review = this.accessReviews.find((r) => r.id === id);
    if (!review) {
      throw new Error(`Access review item '${id}' not found`);
    }
    review.reviewStatus = decision;
    review.reviewer = reviewer;
    review.reviewedAt = new Date().toISOString();
    return review;
  }

  public getAccessRequests(): AccessRequestItem[] {
    return this.accessRequests;
  }

  public createAccessRequest(
    requester: string,
    resource: string,
    requestedRoleOrPermission: string,
    reason: string,
    durationMinutes: number
  ): AccessRequestItem {
    const newReq: AccessRequestItem = {
      id: `req-${Date.now()}`,
      requester,
      resource,
      requestedRoleOrPermission,
      reason,
      durationMinutes,
      riskLevel: durationMinutes > 120 ? 'high' : 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + durationMinutes * 60000).toISOString()
    };
    this.accessRequests.unshift(newReq);
    return newReq;
  }

  public approveAccessRequest(id: string, approver: string): AccessRequestItem {
    const req = this.accessRequests.find((r) => r.id === id);
    if (!req) {
      throw new Error(`Access request '${id}' not found`);
    }
    req.status = 'approved';
    req.approver = approver;
    return req;
  }

  public getComplianceControls(): ComplianceControlMapping[] {
    return this.complianceControls;
  }
}
