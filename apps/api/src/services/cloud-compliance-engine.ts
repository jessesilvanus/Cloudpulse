import {
  ComplianceFrameworkRecord,
  ComplianceControlRecord,
  ComplianceGovernancePolicy,
  ComplianceFindingRecord,
  PolicyExceptionRecord,
  ComplianceEvidenceRecord,
  ComplianceGovernanceSummary
} from '@cloudpulse/shared';

export class CloudComplianceEngine {
  private static instance: CloudComplianceEngine;

  private frameworks: ComplianceFrameworkRecord[] = [
    {
      frameworkId: 'cis-aws-v2.0',
      name: 'CIS Amazon Web Services Foundations Benchmark',
      version: 'v2.0.0',
      category: 'CIS',
      supportLevel: 'SUPPORTED',
      totalControlsCount: 18,
      passingControlsCount: 16,
      compliancePercent: 88.9,
      lastAssessedAt: '2026-09-02T08:00:00Z'
    },
    {
      frameworkId: 'nist-sp-800-53',
      name: 'NIST Special Publication 800-53 Revision 5',
      version: 'Rev 5',
      category: 'NIST',
      supportLevel: 'SUPPORTED',
      totalControlsCount: 14,
      passingControlsCount: 13,
      compliancePercent: 92.8,
      lastAssessedAt: '2026-09-02T08:00:00Z'
    },
    {
      frameworkId: 'soc2-type-2',
      name: 'SOC 2 Type II Security & Availability Controls',
      version: '2024.1',
      category: 'SOC2',
      supportLevel: 'PARTIALLY_SUPPORTED',
      totalControlsCount: 11,
      passingControlsCount: 9,
      compliancePercent: 81.8,
      lastAssessedAt: '2026-09-02T08:00:00Z'
    }
  ];

  private controls: ComplianceControlRecord[] = [
    {
      controlId: 'CIS-AWS-1.16',
      frameworkId: 'cis-aws-v2.0',
      title: 'Ensure MFA is enabled for all IAM users with a console password',
      description: 'Multi-Factor Authentication adds an extra layer of protection on top of user credentials.',
      domain: 'IAM',
      severity: 'CRITICAL',
      status: 'COMPLIANT',
      applicablePolicyId: 'pol-iam-mfa-required',
      owner: 'iam-security-team@enterprise.io'
    },
    {
      controlId: 'NIST-SC-28',
      frameworkId: 'nist-sp-800-53',
      title: 'Protection of Information at Rest (KMS Encryption)',
      description: 'Information at rest within databases and object stores must be encrypted using approved cryptographic modules.',
      domain: 'ENCRYPTION',
      severity: 'HIGH',
      status: 'NON_COMPLIANT',
      applicablePolicyId: 'pol-mandatory-kms-encryption',
      owner: 'storage-team@enterprise.io'
    },
    {
      controlId: 'K8S-PSS-01',
      frameworkId: 'cis-aws-v2.0',
      title: 'Ensure containers run as non-root user (Pod Security Standards)',
      description: 'Containers should not run with root privileges to minimize host escalation risks.',
      domain: 'KUBERNETES',
      severity: 'HIGH',
      status: 'PARTIAL',
      applicablePolicyId: 'pol-k8s-non-root',
      owner: 'platform-team@enterprise.io'
    }
  ];

  private policies: ComplianceGovernancePolicy[] = [
    {
      policyId: 'pol-mandatory-kms-encryption',
      name: 'Mandatory KMS Encryption for Storage & Databases',
      version: 'v2.1.0',
      description: 'All persistent cloud storage, RDS instances, and EBS volumes must specify customer-managed KMS encryption.',
      domain: 'ENCRYPTION',
      enforcementMode: 'BLOCKING',
      severity: 'HIGH',
      ruleExpression: 'resource.encryption.kmsKeyId != null && resource.encryption.enabled == true',
      remediationGuidance: 'Enable AWS KMS or Azure Key Vault encryption using customer-managed keys.',
      status: 'ACTIVE'
    },
    {
      policyId: 'pol-iam-mfa-required',
      name: 'Mandatory MFA for Privileged Access',
      version: 'v1.4.0',
      description: 'Enforce hardware or virtual MFA authentication on all identities possessing administrator or operator roles.',
      domain: 'IAM',
      enforcementMode: 'BLOCKING',
      severity: 'CRITICAL',
      ruleExpression: 'identity.roles.includes("admin") ? identity.mfaActive == true : true',
      remediationGuidance: 'Enroll virtual authenticator or FIDO2 security key via IAM self-service portal.',
      status: 'ACTIVE'
    },
    {
      policyId: 'pol-k8s-non-root',
      name: 'Kubernetes Pod Security Standard: RunAsNonRoot',
      version: 'v1.2.0',
      description: 'All container workloads deployed in production namespaces must explicitly define runAsNonRoot: true.',
      domain: 'KUBERNETES',
      enforcementMode: 'AUDIT',
      severity: 'HIGH',
      ruleExpression: 'pod.spec.securityContext.runAsNonRoot == true',
      remediationGuidance: 'Configure securityContext.runAsNonRoot: true and specify a UID > 1000 in container image.',
      status: 'ACTIVE'
    }
  ];

  private findings: ComplianceFindingRecord[] = [
    {
      findingId: 'find-enc-rds-unencrypted-backup',
      frameworkId: 'nist-sp-800-53',
      controlId: 'NIST-SC-28',
      policyId: 'pol-mandatory-kms-encryption',
      resourceId: 'arn:aws:rds:us-east-1:123456789012:snapshot:order-db-manual-snap-01',
      resourceType: 'aws_rds_snapshot',
      resourceName: 'order-db-manual-snap-01',
      severity: 'HIGH',
      status: 'OPEN',
      evidence: 'Snapshot order-db-manual-snap-01 was created without an explicit KMS Key ARN reference.',
      firstDetected: '2026-09-01T14:20:00Z',
      lastDetected: '2026-09-02T08:00:00Z',
      owner: 'database-admins@enterprise.io',
      remediationPlan: 'Re-encrypt RDS snapshot with primary KMS Customer Master Key (CMK).',
      verificationStatus: 'PENDING'
    },
    {
      findingId: 'find-k8s-payment-root-container',
      frameworkId: 'cis-aws-v2.0',
      controlId: 'K8S-PSS-01',
      policyId: 'pol-k8s-non-root',
      resourceId: 'k8s:deployment:production/payment-service',
      resourceType: 'kubernetes_deployment',
      resourceName: 'payment-service',
      severity: 'HIGH',
      status: 'IN_PROGRESS',
      evidence: 'Deployment manifest lacks pod.spec.securityContext.runAsNonRoot: true definition.',
      firstDetected: '2026-09-02T04:10:00Z',
      lastDetected: '2026-09-02T08:00:00Z',
      owner: 'platform-team@enterprise.io',
      remediationPlan: 'Update Helm chart templates to enforce non-root UID 10001.',
      verificationStatus: 'PENDING'
    }
  ];

  private exceptions: PolicyExceptionRecord[] = [
    {
      exceptionId: 'exc-legacy-auth-bypass-01',
      policyId: 'pol-iam-mfa-required',
      resourceId: 'arn:aws:iam::123456789012:user/legacy-build-service-account',
      scope: 'CI/CD Automated Build Service Account',
      reason: 'Legacy Jenkins build worker authenticating via short-lived STS AssumeRole tokens.',
      requester: 'devops-lead@enterprise.io',
      approver: 'ciso-office@enterprise.io',
      expiresAt: '2026-09-30T00:00:00Z',
      compensatingControl: 'IP whitelisting restricted strictly to build VPC CIDR 10.0.128.0/24.',
      isExpired: false
    }
  ];

  private evidenceRecords: ComplianceEvidenceRecord[] = [
    {
      evidenceId: 'ev-rds-snap-01',
      findingId: 'find-enc-rds-unencrypted-backup',
      source: 'CONFIG',
      provenance: 'OBSERVED',
      confidencePercent: 99.0,
      evidenceData: {
        snapshotArn: 'arn:aws:rds:us-east-1:123456789012:snapshot:order-db-manual-snap-01',
        encrypted: false,
        kmsKeyId: null
      },
      collectedAt: '2026-09-02T08:00:00Z'
    }
  ];

  public static getInstance(): CloudComplianceEngine {
    if (!CloudComplianceEngine.instance) {
      CloudComplianceEngine.instance = new CloudComplianceEngine();
    }
    return CloudComplianceEngine.instance;
  }

  public getSummary(): ComplianceGovernanceSummary {
    return {
      overallComplianceScorePercent: 88.5,
      totalEvaluatedControlsCount: 43,
      passingControlsCount: 38,
      openFindingsCount: this.findings.filter((f) => f.status === 'OPEN' || f.status === 'IN_PROGRESS').length,
      criticalFindingsCount: this.findings.filter((f) => f.severity === 'CRITICAL' && f.status === 'OPEN').length,
      activeExceptionsCount: this.exceptions.filter((e) => !e.isExpired).length,
      expiredExceptionsCount: this.exceptions.filter((e) => e.isExpired).length,
      frameworkScores: {
        'cis-aws-v2.0': 88.9,
        'nist-sp-800-53': 92.8,
        'soc2-type-2': 81.8
      },
      evaluatedAt: new Date().toISOString()
    };
  }

  public getFrameworks(): ComplianceFrameworkRecord[] {
    return this.frameworks;
  }

  public getControls(frameworkId?: string, domain?: string): ComplianceControlRecord[] {
    return this.controls.filter((c) => {
      if (frameworkId && c.frameworkId !== frameworkId) return false;
      if (domain && c.domain !== domain) return false;
      return true;
    });
  }

  public getPolicies(domain?: string): ComplianceGovernancePolicy[] {
    return this.policies.filter((p) => {
      if (domain && p.domain !== domain) return false;
      return true;
    });
  }

  public evaluatePolicy(policyId: string, resource: any) {
    const policy = this.policies.find((p) => p.policyId === policyId);
    if (!policy) {
      throw new Error(`Policy '${policyId}' not found.`);
    }

    let isCompliant = true;
    let details = 'Resource satisfies declarative governance rules.';

    if (policyId === 'pol-mandatory-kms-encryption') {
      isCompliant = Boolean(resource?.encryption?.kmsKeyId && resource?.encryption?.enabled);
      if (!isCompliant) details = 'Missing KMS Customer Master Key (CMK) configuration.';
    } else if (policyId === 'pol-k8s-non-root') {
      isCompliant = Boolean(resource?.securityContext?.runAsNonRoot);
      if (!isCompliant) details = 'Container image configured to execute as UID 0 (root).';
    }

    return {
      policyId,
      resourceId: resource?.id || 'res-evaluated-01',
      status: isCompliant ? 'PASS' : policy.enforcementMode === 'BLOCKING' ? 'FAIL' : 'WARNING',
      enforcementMode: policy.enforcementMode,
      details,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getFindings(severity?: string, status?: string): ComplianceFindingRecord[] {
    return this.findings.filter((f) => {
      if (severity && f.severity !== severity) return false;
      if (status && f.status !== status) return false;
      return true;
    });
  }

  public getEvidenceChain(findingId: string) {
    const finding = this.findings.find((f) => f.findingId === findingId);
    if (!finding) {
      throw new Error(`Finding '${findingId}' not found.`);
    }

    const control = this.controls.find((c) => c.controlId === finding.controlId);
    const policy = this.policies.find((p) => p.policyId === finding.policyId);
    const evidence = this.evidenceRecords.filter((e) => e.findingId === findingId);

    return {
      findingId,
      framework: finding.frameworkId,
      control: control || { controlId: finding.controlId, title: 'Compliance Control' },
      policy: policy || { policyId: finding.policyId, name: 'Governance Policy' },
      resource: { id: finding.resourceId, name: finding.resourceName, type: finding.resourceType },
      evidenceChain: [
        { step: '1. Control Requirement', text: control?.description || 'NIST/CIS Security Baseline' },
        { step: '2. Policy Rule Definition', text: policy?.ruleExpression || 'Declarative Rule Guard' },
        { step: '3. Observed Telemetry', text: finding.evidence },
        { step: '4. Evidence Records', items: evidence },
        { step: '5. Remediation Protocol', text: finding.remediationPlan }
      ],
      evaluatedAt: new Date().toISOString()
    };
  }

  public getExceptions(): PolicyExceptionRecord[] {
    return this.exceptions;
  }

  public createException(payload: {
    policyId: string;
    resourceId: string;
    scope: string;
    reason: string;
    requester: string;
    approver: string;
    expiresAt: string;
    compensatingControl: string;
  }): PolicyExceptionRecord {
    const exc: PolicyExceptionRecord = {
      exceptionId: `exc-${Date.now()}`,
      policyId: payload.policyId,
      resourceId: payload.resourceId,
      scope: payload.scope,
      reason: payload.reason,
      requester: payload.requester,
      approver: payload.approver,
      expiresAt: payload.expiresAt,
      compensatingControl: payload.compensatingControl,
      isExpired: new Date(payload.expiresAt) < new Date()
    };
    this.exceptions.push(exc);
    return exc;
  }

  public remediateFinding(findingId: string) {
    const finding = this.findings.find((f) => f.findingId === findingId);
    if (!finding) {
      throw new Error(`Finding '${findingId}' not found.`);
    }

    finding.status = 'REMEDIATED';
    finding.verificationStatus = 'VERIFIED';

    return {
      findingId,
      status: 'REMEDIATED',
      verificationStatus: 'VERIFIED',
      executedAction: `Executed automated safe remediation playbook for ${finding.policyId}.`,
      verifiedAt: new Date().toISOString()
    };
  }

  public simulatePolicyImpact(policyId: string, newMode: 'BLOCKING' | 'AUDIT') {
    const policy = this.policies.find((p) => p.policyId === policyId);
    if (!policy) {
      throw new Error(`Policy '${policyId}' not found.`);
    }

    const affectedFindings = this.findings.filter((f) => f.policyId === policyId && f.status === 'OPEN');

    return {
      policyId,
      currentEnforcementMode: policy.enforcementMode,
      simulatedEnforcementMode: newMode,
      potentialDeploymentBlocks: newMode === 'BLOCKING' ? affectedFindings.length : 0,
      affectedResourcesCount: affectedFindings.length,
      estimatedRemediationEffortHours: affectedFindings.length * 2.5,
      complianceScoreImpactPercent: newMode === 'BLOCKING' ? +4.2 : 0,
      simulatedAt: new Date().toISOString()
    };
  }

  public queryComplianceAssistant(prompt: string) {
    return {
      query: prompt,
      status: 'OBSERVED',
      summary: 'Evaluated compliance posture across CIS, NIST, and SOC2 framework baselines.',
      evidence: [
        'Overall compliance score: 88.5% across 43 evaluated controls',
        '2 active compliance findings (1 RDS unencrypted snapshot, 1 Kubernetes non-root violation)',
        '1 active approved policy exception (exc-legacy-auth-bypass-01 expiring 2026-09-30)'
      ],
      recommendation: 'Execute safe remediation on find-enc-rds-unencrypted-backup and re-encrypt snapshot with primary KMS CMK.',
      timestamp: new Date().toISOString()
    };
  }
}
