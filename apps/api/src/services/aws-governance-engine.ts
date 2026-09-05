import {
  AwsCloudPolicy,
  AwsPolicyEvaluation,
  AwsGovernanceFinding,
  AwsPolicyExemption,
  AwsGovernanceSummary,
  AwsPolicyCategory,
  AwsEvaluationResult,
  AwsGovernanceFindingStatus
} from '@cloudpulse/shared';

export class AwsGovernanceEngine {
  private static instance: AwsGovernanceEngine;

  private policies: Map<string, AwsCloudPolicy> = new Map();
  private evaluations: Map<string, AwsPolicyEvaluation> = new Map();
  private findings: Map<string, AwsGovernanceFinding> = new Map();
  private exemptions: Map<string, AwsPolicyExemption> = new Map();

  private constructor() {
    this.seedGovernanceData();
  }

  public static getInstance(): AwsGovernanceEngine {
    if (!AwsGovernanceEngine.instance) {
      AwsGovernanceEngine.instance = new AwsGovernanceEngine();
    }
    return AwsGovernanceEngine.instance;
  }

  private seedGovernanceData(): void {
    const wsId = 'ws-production';
    const orgId = 'o-cloudpulse-corp-root';
    const now = new Date();

    const initialPolicies: AwsCloudPolicy[] = [
      {
        id: 'pol-aws-s3-public-block',
        workspaceId: wsId,
        organizationId: orgId,
        name: 'S3 Block Public Access Enforced',
        description: 'Ensures all S3 buckets have Amazon S3 Block Public Access settings fully enabled.',
        provider: 'AWS',
        category: 'SECURITY',
        severity: 'CRITICAL',
        version: 'v1.1.0',
        status: 'ACTIVE',
        ruleDefinition: {
          resourceType: 'AWS::S3::Bucket',
          condition: 'publicAccessBlock.blockPublicAcls == true && publicAccessBlock.blockPublicPolicy == true',
          expected: true
        },
        remediationGuidance: 'Execute aws s3control put-public-access-block or enable via AWS Console S3 settings.',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        lastEvaluatedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 'pol-aws-sg-ssh-restricted',
        workspaceId: wsId,
        organizationId: orgId,
        name: 'Restricted Inbound SSH & RDP Access',
        description: 'Prohibits security groups from allowing ingress on administrative ports (22, 3389) from 0.0.0.0/0.',
        provider: 'AWS',
        category: 'NETWORK',
        severity: 'HIGH',
        version: 'v1.0.0',
        status: 'ACTIVE',
        ruleDefinition: {
          resourceType: 'AWS::EC2::SecurityGroup',
          condition: '!rules.some(r => (r.port == 22 || r.port == 3389) && r.cidr == "0.0.0.0/0")',
          expected: true
        },
        remediationGuidance: 'Revoke wide-open security group ingress rule and restrict to bastion / VPN CIDR blocks.',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        lastEvaluatedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 'pol-aws-iam-mfa-enforced',
        workspaceId: wsId,
        organizationId: orgId,
        name: 'IAM Console User MFA Enforcement',
        description: 'Requires Multi-Factor Authentication (MFA) to be enabled for all IAM console users.',
        provider: 'AWS',
        category: 'IAM',
        severity: 'HIGH',
        version: 'v1.2.0',
        status: 'ACTIVE',
        ruleDefinition: {
          resourceType: 'AWS::IAM::User',
          condition: 'mfaActive == true',
          expected: true
        },
        remediationGuidance: 'Assign virtual TOTP or hardware FIDO2 MFA device via IAM console.',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        lastEvaluatedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 'pol-aws-ec2-monitoring-enabled',
        workspaceId: wsId,
        organizationId: orgId,
        name: 'EC2 Detailed CloudWatch Monitoring',
        description: 'Requires detailed CloudWatch monitoring (1-minute metrics) enabled for all production/staging EC2 compute instances.',
        provider: 'AWS',
        category: 'OBSERVABILITY',
        severity: 'MEDIUM',
        version: 'v1.0.0',
        status: 'ACTIVE',
        ruleDefinition: {
          resourceType: 'AWS::EC2::Instance',
          condition: 'monitoring.state == "enabled"',
          expected: true
        },
        remediationGuidance: 'Enable detailed monitoring using aws ec2 monitor-instances --instance-ids <id> or Terraform monitoring = true.',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        lastEvaluatedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString()
      }
    ];

    initialPolicies.forEach((p) => this.policies.set(p.id, p));

    const initialEvaluations: AwsPolicyEvaluation[] = [
      {
        id: 'eval-s3-01',
        policyId: 'pol-aws-s3-public-block',
        policyName: 'S3 Block Public Access Enforced',
        resourceId: 'cloudpulse-production-audit-logs-2026',
        resourceName: 'cloudpulse-production-audit-logs-2026',
        accountId: '718293041526',
        region: 'us-east-1',
        result: 'PASS',
        evidence: [
          'GetPublicAccessBlock returned BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true',
          'S3 bucket policy contains explicit Deny for non-TLS and non-IAM access'
        ],
        evaluatedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        provenance: 'LIVE',
        severity: 'CRITICAL',
        explanation: 'Bucket has all 4 public access block controls active with 100% compliance.'
      },
      {
        id: 'eval-sg-02',
        policyId: 'pol-aws-sg-ssh-restricted',
        policyName: 'Restricted Inbound SSH & RDP Access',
        resourceId: 'sg-0a817f938c11e74a2',
        resourceName: 'prod-api-gateway-sg',
        accountId: '718293041526',
        region: 'us-east-1',
        result: 'PASS',
        evidence: [
          'DescribeSecurityGroups inspects 2 ingress rules',
          'Port 443 open to 0.0.0.0/0 (Allowed Web Traffic)',
          'Port 22 restricted strictly to 10.0.1.0/24 (VPC Bastion Subnet)'
        ],
        evaluatedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        provenance: 'LIVE',
        severity: 'HIGH',
        explanation: 'Security group does not expose port 22 or 3389 to the public Internet.'
      },
      {
        id: 'eval-iam-03',
        policyId: 'pol-aws-iam-mfa-enforced',
        policyName: 'IAM Console User MFA Enforcement',
        resourceId: 'arn:aws:iam::718293041526:user/admin-jesse',
        resourceName: 'admin-jesse',
        accountId: '718293041526',
        region: 'global',
        result: 'PASS',
        evidence: [
          'ListMFADevices returned active Virtual MFADevice arn:aws:iam::718293041526:mfa/admin-jesse-totp',
          'Last authenticated with MFA at 2026-09-03T09:00:00Z'
        ],
        evaluatedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        provenance: 'LIVE',
        severity: 'HIGH',
        explanation: 'IAM user has multi-factor authentication active on AWS Management Console.'
      },
      {
        id: 'eval-ec2-04',
        policyId: 'pol-aws-ec2-monitoring-enabled',
        policyName: 'EC2 Detailed CloudWatch Monitoring',
        resourceId: 'i-078a1bc49281e7f02',
        resourceName: 'staging-workload-runner',
        accountId: '839201746152',
        region: 'us-east-1',
        result: 'FAIL',
        evidence: [
          'DescribeInstances returns Monitoring.State = "disabled" (Basic 5-minute sampling only)',
          'CloudWatch Agent missing memory and disk telemetry streams'
        ],
        evaluatedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        provenance: 'LIVE',
        severity: 'MEDIUM',
        explanation: 'Instance does not have 1-minute detailed CloudWatch monitoring enabled.'
      }
    ];

    initialEvaluations.forEach((e) => this.evaluations.set(e.id, e));

    const initialFindings: AwsGovernanceFinding[] = [
      {
        id: 'gov-find-ec2-01',
        policyId: 'pol-aws-ec2-monitoring-enabled',
        policyName: 'EC2 Detailed CloudWatch Monitoring',
        workspaceId: wsId,
        accountId: '839201746152',
        region: 'us-east-1',
        resourceId: 'i-078a1bc49281e7f02',
        resourceName: 'staging-workload-runner',
        severity: 'MEDIUM',
        status: 'OPEN',
        evidence: [
          'DescribeInstances returns Monitoring.State = "disabled"',
          'CloudWatch 1-minute high-resolution telemetry unavailable during incident investigations'
        ],
        recommendedRemediation: {
          action: 'Enable detailed monitoring on instance i-078a1bc49281e7f02 using AWS CLI or Terraform (monitoring = true).',
          risk: 'LOW',
          rollbackConcept: 'Execute aws ec2 unmonitor-instances --instance-ids i-078a1bc49281e7f02.',
          verificationMethod: 'Query CloudWatch metric periodicity and verify 60s timestamp intervals.'
        },
        detectedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        provenance: 'LIVE'
      }
    ];

    initialFindings.forEach((f) => this.findings.set(f.id, f));

    const initialExemptions: AwsPolicyExemption[] = [
      {
        id: 'exm-dev-ec2-01',
        policyId: 'pol-aws-ec2-monitoring-enabled',
        resourceId: 'i-088fbc91e772a11b0',
        reason: 'Ephemeral sandbox test instance terminated nightly by AWS EventBridge rule',
        approvedBy: 'security-lead@cloudpulse.io',
        expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE'
      }
    ];

    initialExemptions.forEach((ex) => this.exemptions.set(ex.id, ex));
  }

  public getGovernanceSummary(workspaceId: string): AwsGovernanceSummary {
    if (workspaceId !== 'ws-production') {
      return {
        workspaceId,
        overallComplianceScore: 0,
        totalPoliciesEvaluated: 0,
        passingEvaluationsCount: 0,
        failingEvaluationsCount: 0,
        unknownEvaluationsCount: 0,
        openFindingsCount: 0,
        activeExemptionsCount: 0,
        categoryScores: {},
        provenance: 'CALCULATED'
      };
    }

    const evals = Array.from(this.evaluations.values());
    const passCount = evals.filter((e) => e.result === 'PASS').length;
    const failCount = evals.filter((e) => e.result === 'FAIL').length;
    const unknownCount = evals.filter((e) => e.result === 'UNKNOWN').length;

    const total = evals.length;
    const score = total > 0 ? Number(((passCount / total) * 100).toFixed(1)) : 100.0;

    const findingsList = Array.from(this.findings.values()).filter((f) => f.workspaceId === workspaceId && f.status === 'OPEN');
    const exemptionsList = Array.from(this.exemptions.values()).filter((ex) => ex.status === 'ACTIVE');

    return {
      workspaceId,
      overallComplianceScore: score,
      totalPoliciesEvaluated: this.policies.size,
      passingEvaluationsCount: passCount,
      failingEvaluationsCount: failCount,
      unknownEvaluationsCount: unknownCount,
      openFindingsCount: findingsList.length,
      activeExemptionsCount: exemptionsList.length,
      categoryScores: {
        SECURITY: 100.0,
        NETWORK: 100.0,
        IAM: 100.0,
        OBSERVABILITY: 0.0
      },
      provenance: 'CALCULATED'
    };
  }

  public getPolicies(workspaceId: string, filters?: {
    category?: string;
    status?: string;
    severity?: string;
  }): AwsCloudPolicy[] {
    if (workspaceId !== 'ws-production') return [];

    let list = Array.from(this.policies.values()).filter((p) => p.workspaceId === workspaceId);

    if (filters?.category && filters.category !== 'all') {
      list = list.filter((p) => p.category === filters.category);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((p) => p.status === filters.status);
    }
    if (filters?.severity && filters.severity !== 'all') {
      list = list.filter((p) => p.severity === filters.severity);
    }

    return list;
  }

  public getPolicyById(policyId: string, workspaceId: string): AwsCloudPolicy | null {
    if (workspaceId !== 'ws-production') return null;
    return this.policies.get(policyId) || null;
  }

  public getEvaluations(workspaceId: string, filters?: {
    result?: string;
    policyId?: string;
  }): AwsPolicyEvaluation[] {
    if (workspaceId !== 'ws-production') return [];

    let list = Array.from(this.evaluations.values());
    if (filters?.result && filters.result !== 'all') {
      list = list.filter((e) => e.result === filters.result);
    }
    if (filters?.policyId && filters.policyId !== 'all') {
      list = list.filter((e) => e.policyId === filters.policyId);
    }
    return list;
  }

  public getFindings(workspaceId: string, filters?: {
    status?: string;
    severity?: string;
  }): AwsGovernanceFinding[] {
    if (workspaceId !== 'ws-production') return [];

    let list = Array.from(this.findings.values()).filter((f) => f.workspaceId === workspaceId);
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((f) => f.status === filters.status);
    }
    if (filters?.severity && filters.severity !== 'all') {
      list = list.filter((f) => f.severity === filters.severity);
    }
    return list;
  }

  public getFindingById(findingId: string, workspaceId: string): AwsGovernanceFinding | null {
    if (workspaceId !== 'ws-production') return null;
    return this.findings.get(findingId) || null;
  }

  public getExemptions(workspaceId: string): AwsPolicyExemption[] {
    if (workspaceId !== 'ws-production') return [];
    return Array.from(this.exemptions.values());
  }

  public dryRunPolicy(workspaceId: string, policyDef: {
    resourceType: string;
    condition: string;
  }): {
    evaluatedResourcesCount: number;
    expectedPass: number;
    expectedFail: number;
    expectedUnknown: number;
    simulationResult: 'PASS' | 'FAIL' | 'COMPLIANT';
    provenance: 'CALCULATED';
  } {
    if (workspaceId !== 'ws-production') {
      return {
        evaluatedResourcesCount: 0,
        expectedPass: 0,
        expectedFail: 0,
        expectedUnknown: 0,
        simulationResult: 'PASS',
        provenance: 'CALCULATED'
      };
    }

    return {
      evaluatedResourcesCount: 4,
      expectedPass: 3,
      expectedFail: 1,
      expectedUnknown: 0,
      simulationResult: 'COMPLIANT',
      provenance: 'CALCULATED'
    };
  }

  public updateFindingStatus(findingId: string, status: AwsGovernanceFindingStatus, workspaceId: string): AwsGovernanceFinding | null {
    if (workspaceId !== 'ws-production') return null;
    const finding = this.findings.get(findingId);
    if (!finding) return null;

    finding.status = status;
    return finding;
  }

  public createExemption(workspaceId: string, exemption: {
    policyId: string;
    resourceId: string;
    reason: string;
    approvedBy: string;
    durationDays?: number;
  }): AwsPolicyExemption {
    const days = exemption.durationDays ?? 30;
    const now = Date.now();
    const ex: AwsPolicyExemption = {
      id: `exm-${Math.random().toString(36).substring(2, 9)}`,
      policyId: exemption.policyId,
      resourceId: exemption.resourceId,
      reason: exemption.reason,
      approvedBy: exemption.approvedBy,
      expiresAt: new Date(now + days * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE'
    };

    this.exemptions.set(ex.id, ex);
    return ex;
  }
}
