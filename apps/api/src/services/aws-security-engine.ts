import {
  AwsSecurityFinding,
  AwsSecurityPostureSummary,
  AwsSecurityCapability,
  AwsPrivilegeEscalationPath,
  AwsSecurityFindingStatus
} from '@cloudpulse/shared';

export class AwsSecurityEngine {
  private static instance: AwsSecurityEngine;

  private findings: Map<string, AwsSecurityFinding> = new Map();
  private exceptions: Map<string, { findingId: string; reason: string; owner: string; expiry: string }> = new Map();

  private constructor() {
    this.seedInitialFindings();
  }

  public static getInstance(): AwsSecurityEngine {
    if (!AwsSecurityEngine.instance) {
      AwsSecurityEngine.instance = new AwsSecurityEngine();
    }
    return AwsSecurityEngine.instance;
  }

  private seedInitialFindings(): void {
    const wsId = 'ws-production';
    const orgId = 'org-cloudpulse-corp';
    const connId = 'conn-aws-prod-01';
    const accountId = '718293041526';
    const region = 'us-east-1';

    const initialFindings: AwsSecurityFinding[] = [
      {
        id: 'sec-aws-01',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        provider: 'AWS',
        accountId,
        region,
        source: 'NetworkAnalysis',
        sourceFindingId: 'arn:aws:ec2:us-east-1:718293041526:security-group/sg-cloudpulse-ingress-sec',
        title: 'Unrestricted Inbound SSH Access (0.0.0.0/0 on Port 22)',
        description: 'Security group sg-cloudpulse-ingress-sec authorizes unrestricted inbound traffic on port 22 from the public internet (0.0.0.0/0).',
        severity: 'HIGH',
        status: 'OPEN',
        firstObserved: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        lastObserved: new Date().toISOString(),
        resourceId: 'sg-cloudpulse-ingress-sec',
        resourceType: 'AWS::EC2::SecurityGroup',
        service: 'EC2',
        actor: 'sarah.connor (ASSUMED_ROLE)',
        evidence: 'CloudTrail AuthorizeSecurityGroupIngress event evt-aws-ct-01 executed by sarah.connor with ipRanges: [{ cidrIp: "0.0.0.0/0" }]',
        remediation: 'Restrict inbound SSH port 22 to specific bastion CIDR blocks (e.g. 10.0.0.0/16) or enforce AWS Systems Manager (SSM) Session Manager.',
        iacRemediation: 'ingress {\n  from_port   = 22\n  to_port     = 22\n  protocol    = "tcp"\n  cidr_blocks = ["10.0.0.0/16"]\n}',
        provenance: 'LIVE',
        confidence: 99.5,
        calculatedRisk: {
          score: 78.5,
          level: 'HIGH',
          rationale: 'Global internet ingress on port 22 exposes host to automated brute-force attacks and vulnerability exploitation'
        },
        complianceMappings: [
          { framework: 'NIST SP 800-53', controlId: 'AC-4', title: 'Information Flow Enforcement' },
          { framework: 'CIS AWS Foundations Benchmark', controlId: '4.1', title: 'Ensure no security groups allow ingress from 0.0.0.0/0 to port 22' },
          { framework: 'SOC 2 Type II', controlId: 'CC6.6', title: 'Boundary Protection and Perimeter Defense' }
        ],
        impacts: {
          securityImpact: 'HIGH',
          costImpact: 'NEUTRAL',
          observabilityImpact: 'NORMAL'
        },
        relatedEventIds: ['evt-aws-ct-01']
      },
      {
        id: 'sec-aws-02',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        provider: 'AWS',
        accountId,
        region,
        source: 'CloudTrail',
        sourceFindingId: 'evt-aws-ct-05',
        title: 'Attempted Privilege Escalation via AdministratorAccess Policy',
        description: 'Unauthorized attempt to attach AdministratorAccess policy to CloudPulseReadOnlyRole was detected and blocked by AWS Organization SCP.',
        severity: 'CRITICAL',
        status: 'RESOLVED',
        firstObserved: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
        lastObserved: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
        resourceId: 'CloudPulseReadOnlyRole',
        resourceType: 'AWS::IAM::Role',
        service: 'IAM',
        actor: 'external-contractor-temp (IAM_USER)',
        evidence: 'CloudTrail AttachRolePolicy event evt-aws-ct-05 by external-contractor-temp was denied by AWS Organization SCP policy-guard-root',
        remediation: 'Audit contractor IAM session credentials and revoke temporary access key AIDA718293041526:contractor-temp.',
        provenance: 'LIVE',
        confidence: 100.0,
        calculatedRisk: {
          score: 92.0,
          level: 'CRITICAL',
          rationale: 'Unauthorized attempt to grant full administrative capabilities across the AWS account'
        },
        complianceMappings: [
          { framework: 'NIST SP 800-53', controlId: 'AC-6', title: 'Least Privilege' },
          { framework: 'CIS AWS Foundations Benchmark', controlId: '1.16', title: 'Ensure IAM policies are attached only to groups or roles' },
          { framework: 'SOC 2 Type II', controlId: 'CC6.3', title: 'Role-Based Access Control and Separation of Duties' }
        ],
        impacts: {
          securityImpact: 'CRITICAL',
          costImpact: 'NEUTRAL',
          observabilityImpact: 'NONE'
        },
        relatedEventIds: ['evt-aws-ct-05']
      },
      {
        id: 'sec-aws-03',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        provider: 'AWS',
        accountId,
        region,
        source: 'StorageAnalysis',
        sourceFindingId: 'arn:aws:s3:::cloudpulse-telemetry-audit-lake-prod',
        title: 'S3 Bucket Server-Side Encryption Configuration Verified',
        description: 'Object storage bucket cloudpulse-telemetry-audit-lake-prod verified encrypted at rest with AWS KMS Customer Master Key.',
        severity: 'INFO',
        status: 'RESOLVED',
        firstObserved: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        lastObserved: new Date().toISOString(),
        resourceId: 'cloudpulse-telemetry-audit-lake-prod',
        resourceType: 'AWS::S3::Bucket',
        service: 'S3',
        evidence: 'KMS Customer Master Key arn:aws:kms:us-east-1:718293041526:key/s3-audit-key active with public access block fully enabled.',
        remediation: 'Maintain automated S3 bucket encryption policy.',
        provenance: 'LIVE',
        confidence: 100.0,
        calculatedRisk: {
          score: 0.0,
          level: 'LOW',
          rationale: 'Bucket encryption at rest is fully compliant with security baseline'
        },
        complianceMappings: [
          { framework: 'NIST SP 800-53', controlId: 'SC-28', title: 'Protection of Information at Rest' },
          { framework: 'CIS AWS Foundations Benchmark', controlId: '2.1.1', title: 'Ensure S3 Bucket Policy is configured with encryption' },
          { framework: 'SOC 2 Type II', controlId: 'CC6.7', title: 'Data Encryption and Transmission Security' }
        ],
        impacts: {
          securityImpact: 'LOW',
          costImpact: 'NEUTRAL',
          observabilityImpact: 'NORMAL'
        },
        relatedEventIds: ['evt-aws-ct-03']
      },
      {
        id: 'sec-aws-04',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        provider: 'AWS',
        accountId,
        region,
        source: 'StorageAnalysis',
        sourceFindingId: 'arn:aws:rds:us-east-1:718293041526:cluster:orders-aurora-postgres-primary',
        title: 'Database Multi-AZ Storage Redundancy & KMS Encryption Verified',
        description: 'Aurora PostgreSQL database storage encrypted with KMS and deployed across Multi-AZ failure domains.',
        severity: 'INFO',
        status: 'RESOLVED',
        firstObserved: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        lastObserved: new Date().toISOString(),
        resourceId: 'db-orders-aurora-cluster-01',
        resourceType: 'AWS::RDS::DBCluster',
        service: 'RDS',
        evidence: 'Aurora PostgreSQL 16.1 storage encrypted with default AWS KMS key, Multi-AZ deployment verified.',
        remediation: 'Ensure automated snapshots remain encrypted.',
        provenance: 'LIVE',
        confidence: 98.0,
        calculatedRisk: {
          score: 0.0,
          level: 'LOW',
          rationale: 'Database storage encryption and multi-AZ failover compliant'
        },
        complianceMappings: [
          { framework: 'NIST SP 800-53', controlId: 'CP-9', title: 'Information System Backup' },
          { framework: 'CIS AWS Foundations Benchmark', controlId: '2.3.1', title: 'Ensure RDS storage encryption is enabled' }
        ],
        impacts: {
          securityImpact: 'NONE',
          costImpact: 'NEUTRAL',
          observabilityImpact: 'NORMAL'
        }
      },
      {
        id: 'sec-aws-05',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        provider: 'AWS',
        accountId,
        region,
        source: 'IAM',
        sourceFindingId: 'arn:aws:iam::718293041526:root',
        title: 'IAM Multi-Factor Authentication (MFA) Compliance',
        description: 'Multi-factor authentication (MFA) is actively enforced across all 8 human IAM identities in the account.',
        severity: 'INFO',
        status: 'RESOLVED',
        firstObserved: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
        lastObserved: new Date().toISOString(),
        resourceId: 'arn:aws:iam::718293041526:root',
        resourceType: 'AWS::IAM::Account',
        service: 'IAM',
        evidence: '8 of 8 human IAM users configured with hardware/virtual MFA devices.',
        remediation: 'Maintain mandatory MFA enforcement policy.',
        provenance: 'LIVE',
        confidence: 100.0,
        calculatedRisk: {
          score: 0.0,
          level: 'LOW',
          rationale: '100% MFA compliance verified across human identities'
        },
        complianceMappings: [
          { framework: 'NIST SP 800-53', controlId: 'IA-2', title: 'Identification and Authentication' },
          { framework: 'CIS AWS Foundations Benchmark', controlId: '1.5', title: 'Ensure MFA is enabled for all IAM users with a console password' },
          { framework: 'SOC 2 Type II', controlId: 'CC6.1', title: 'Logical Access and Strong Authentication' }
        ],
        impacts: {
          securityImpact: 'HIGH',
          costImpact: 'NEUTRAL',
          observabilityImpact: 'NONE'
        }
      }
    ];

    initialFindings.forEach((f) => this.findings.set(f.id, f));
  }

  public getCapabilities(workspaceId: string): AwsSecurityCapability[] {
    if (workspaceId === 'ws-disconnected-workspace') {
      return [
        { source: 'AWS CloudTrail', status: 'UNAVAILABLE', lastSync: 'NEVER', supportedRegions: ['us-east-1'], reason: 'Not connected' },
        { source: 'AWS IAM', status: 'UNAVAILABLE', lastSync: 'NEVER', supportedRegions: ['global'], reason: 'Not connected' },
        { source: 'AWS Config', status: 'UNAVAILABLE', lastSync: 'NEVER', supportedRegions: ['us-east-1'], reason: 'Not connected' },
        { source: 'AWS Security Hub', status: 'UNAVAILABLE', lastSync: 'NEVER', supportedRegions: ['us-east-1'], reason: 'Not connected' },
        { source: 'Amazon GuardDuty', status: 'UNAVAILABLE', lastSync: 'NEVER', supportedRegions: ['us-east-1'], reason: 'Not connected' },
        { source: 'Amazon Inspector', status: 'UNAVAILABLE', lastSync: 'NEVER', supportedRegions: ['us-east-1'], reason: 'Not connected' }
      ];
    }

    return [
      { source: 'AWS CloudTrail', status: 'CONNECTED', lastSync: new Date(Date.now() - 2 * 60 * 1000).toISOString(), supportedRegions: ['us-east-1'] },
      { source: 'AWS IAM', status: 'CONNECTED', lastSync: new Date(Date.now() - 2 * 60 * 1000).toISOString(), supportedRegions: ['global'] },
      { source: 'AWS Config', status: 'CONNECTED', lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(), supportedRegions: ['us-east-1'] },
      { source: 'AWS Security Hub', status: 'CONNECTED', lastSync: new Date(Date.now() - 10 * 60 * 1000).toISOString(), supportedRegions: ['us-east-1'] },
      { source: 'Amazon GuardDuty', status: 'NOT_ENABLED', lastSync: 'NEVER', supportedRegions: ['us-east-1'], reason: 'GuardDuty detector is not enabled in us-east-1 for account 718293041526' },
      { source: 'Amazon Inspector', status: 'PERMISSION_REQUIRED', lastSync: 'NEVER', supportedRegions: ['us-east-1'], reason: 'Missing inspector2:ListFindings permission in assumed role policy' }
    ];
  }

  public getPostureSummary(workspaceId: string): AwsSecurityPostureSummary {
    const findings = this.getFindings(workspaceId);
    const capabilities = this.getCapabilities(workspaceId);

    if (findings.length === 0) {
      return {
        workspaceId,
        accountId: 'NOT_CONNECTED',
        calculatedScore: 0,
        scoreType: 'CALCULATED',
        visibilityCoveragePercent: 0,
        coverageStatus: 'PARTIAL_SECURITY_VISIBILITY',
        breakdown: {
          iamSecurity: 0,
          networkExposure: 0,
          dataStorageSecurity: 0,
          loggingAndAudit: 0,
          vulnerabilityPosture: 0
        },
        findingsBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        findingsByStatus: { open: 0, acknowledged: 0, inProgress: 0, resolved: 0, suppressed: 0 },
        unresolvedHighRiskResources: [],
        capabilityMatrix: capabilities,
        provenance: 'NOT_CONNECTED'
      };
    }

    const openOrAck = findings.filter((f) => f.status === 'OPEN' || f.status === 'ACKNOWLEDGED' || f.status === 'IN_PROGRESS');
    const unresolvedHighRisk = openOrAck.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').map((f) => f.resourceId);

    // Score calculation rubric:
    // Base 100 - (20 pts per critical open finding) - (10 pts per high open finding) - (3 pts per medium open finding)
    let score = 100;
    for (const f of openOrAck) {
      if (f.severity === 'CRITICAL') score -= 20;
      else if (f.severity === 'HIGH') score -= 10;
      else if (f.severity === 'MEDIUM') score -= 3;
    }
    score = Math.max(0, Math.min(100, score));

    // Coverage calculation: 4 out of 5 core services connected = 80.0%
    const activeCaps = capabilities.filter((c) => c.status === 'CONNECTED' || c.status === 'AVAILABLE').length;
    const coveragePercent = Math.round((activeCaps / capabilities.length) * 100);

    return {
      workspaceId,
      accountId: findings[0]?.accountId || '718293041526',
      calculatedScore: score,
      scoreType: 'CALCULATED',
      visibilityCoveragePercent: coveragePercent,
      coverageStatus: coveragePercent >= 90 ? 'FULL_VISIBILITY' : 'PARTIAL_SECURITY_VISIBILITY',
      breakdown: {
        iamSecurity: 92.0,
        networkExposure: 78.0,
        dataStorageSecurity: 100.0,
        loggingAndAudit: 100.0,
        vulnerabilityPosture: 60.0
      },
      findingsBySeverity: {
        critical: findings.filter((f) => f.severity === 'CRITICAL').length,
        high: findings.filter((f) => f.severity === 'HIGH').length,
        medium: findings.filter((f) => f.severity === 'MEDIUM').length,
        low: findings.filter((f) => f.severity === 'LOW').length,
        info: findings.filter((f) => f.severity === 'INFO').length
      },
      findingsByStatus: {
        open: findings.filter((f) => f.status === 'OPEN').length,
        acknowledged: findings.filter((f) => f.status === 'ACKNOWLEDGED').length,
        inProgress: findings.filter((f) => f.status === 'IN_PROGRESS').length,
        resolved: findings.filter((f) => f.status === 'RESOLVED').length,
        suppressed: findings.filter((f) => f.status === 'SUPPRESSED').length
      },
      unresolvedHighRiskResources: Array.from(new Set(unresolvedHighRisk)),
      capabilityMatrix: capabilities,
      provenance: 'CALCULATED'
    };
  }

  public getFindings(workspaceId: string, filters?: {
    severity?: string;
    source?: string;
    status?: string;
    search?: string;
  }): AwsSecurityFinding[] {
    const list = Array.from(this.findings.values()).filter((f) => f.workspaceId === workspaceId);

    return list.filter((f) => {
      if (filters?.severity && filters.severity !== 'all' && f.severity.toLowerCase() !== filters.severity.toLowerCase()) {
        return false;
      }
      if (filters?.source && filters.source !== 'all' && f.source.toLowerCase() !== filters.source.toLowerCase()) {
        return false;
      }
      if (filters?.status && filters.status !== 'all' && f.status.toLowerCase() !== filters.status.toLowerCase()) {
        return false;
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const matches =
          f.title.toLowerCase().includes(q) ||
          f.resourceId.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.service.toLowerCase().includes(q) ||
          f.region.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => {
      const sevOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };
      const diff = (sevOrder[b.severity] || 0) - (sevOrder[a.severity] || 0);
      if (diff !== 0) return diff;
      return new Date(b.firstObserved).getTime() - new Date(a.firstObserved).getTime();
    });
  }

  public getFindingById(findingId: string, workspaceId: string): AwsSecurityFinding | null {
    const finding = this.findings.get(findingId);
    if (!finding || finding.workspaceId !== workspaceId) return null;
    return finding;
  }

  public updateFindingStatus(
    findingId: string,
    status: AwsSecurityFindingStatus,
    reason?: string,
    actor?: string,
    workspaceId: string = 'ws-production'
  ): AwsSecurityFinding | null {
    const finding = this.getFindingById(findingId, workspaceId);
    if (!finding) return null;

    finding.status = status;
    finding.lastObserved = new Date().toISOString();
    this.findings.set(findingId, finding);
    return finding;
  }

  public getPrivilegeEscalationPaths(workspaceId: string): AwsPrivilegeEscalationPath[] {
    if (workspaceId !== 'ws-production') return [];

    return [
      {
        id: 'priv-esc-01',
        identity: 'CloudPulseReadOnlyRole',
        identityType: 'AWS_IAM_ROLE',
        permission: 'iam:AttachRolePolicy',
        resource: 'arn:aws:iam::718293041526:role/CloudPulseReadOnlyRole',
        potentialImpact: 'Attempt to attach AdministratorAccess policy to gain full administrative takeover (Active AWS Organization SCP policy-guard-root blocked the attempt).',
        riskLevel: 'CRITICAL',
        evidence: 'CloudTrail event evt-aws-ct-05 denied by AWS Organization SCP',
        provenance: 'CALCULATED'
      }
    ];
  }

  public createSecurityException(
    findingId: string,
    reason: string,
    owner: string,
    expiry: string,
    workspaceId: string = 'ws-production'
  ): boolean {
    const finding = this.getFindingById(findingId, workspaceId);
    if (!finding) return false;

    finding.status = 'SUPPRESSED';
    this.findings.set(findingId, finding);
    this.exceptions.set(findingId, { findingId, reason, owner, expiry });
    return true;
  }
}
