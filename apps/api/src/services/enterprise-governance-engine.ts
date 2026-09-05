import {
  GovPolicy,
  GovResource,
  GovEvaluation,
  GovException,
  GovViolation,
  GovRemediationWorkflow,
  GovEvidenceRecord,
  GovFrameworkMapping,
  GovCommandSummary
} from '@cloudpulse/shared';

export class EnterpriseGovernanceEngine {
  private static instance: EnterpriseGovernanceEngine;

  private policies: GovPolicy[] = [
    {
      id: 'pol-mandatory-tags',
      name: 'Mandatory Resource Ownership & Cost Center Tagging',
      description: 'Ensures all cloud and container resources possess team, owner, environment, and costCenter tags.',
      category: 'COST',
      severity: 'HIGH',
      scope: 'global',
      version: 'v2.0.0',
      status: 'ACTIVE',
      rule: 'tags.owner != null && tags.team != null && tags.costCenter != null',
      evaluationMode: 'CONTINUOUS',
      createdAt: '2026-08-31T00:00:00Z',
      updatedAt: '2026-08-31T00:00:00Z',
      owner: 'Platform Engineering'
    },
    {
      id: 'pol-signed-images',
      name: 'Cryptographic Image Signing & SLSA L3 Provenance',
      description: 'Enforces that all deployed containers possess a valid Cosign ECDSA signature and SLSA L3 provenance.',
      category: 'SUPPLY_CHAIN',
      severity: 'CRITICAL',
      scope: 'kubernetes',
      version: 'v1.4.0',
      status: 'ACTIVE',
      rule: 'resource.signatureStatus == "VALID" && resource.provenanceStatus == "VERIFIED"',
      evaluationMode: 'CONTINUOUS',
      createdAt: '2026-08-31T00:00:00Z',
      updatedAt: '2026-08-31T00:00:00Z',
      owner: 'Cloud SOC'
    },
    {
      id: 'pol-encrypted-backups',
      name: 'Continuous Encrypted Backup & Immutable Snapshots',
      description: 'Requires primary relational databases and volumes to maintain encrypted and immutable backup snapshots.',
      category: 'BACKUP',
      severity: 'HIGH',
      scope: 'aws',
      version: 'v1.2.0',
      status: 'ACTIVE',
      rule: 'backup.encrypted == true && backup.retentionDays >= 30',
      evaluationMode: 'SCHEDULED',
      createdAt: '2026-08-31T00:00:00Z',
      updatedAt: '2026-08-31T00:00:00Z',
      owner: 'Platform Engineering'
    },
    {
      id: 'pol-nonroot-containers',
      name: 'Non-Root Distroless Container Execution',
      description: 'Guarantees microservice containers run under unprivileged UID (65532:65532) without root shells.',
      category: 'SECURITY',
      severity: 'HIGH',
      scope: 'kubernetes',
      version: 'v1.1.0',
      status: 'ACTIVE',
      rule: 'securityContext.runAsNonRoot == true && securityContext.readOnlyRootFilesystem == true',
      evaluationMode: 'CONTINUOUS',
      createdAt: '2026-08-31T00:00:00Z',
      updatedAt: '2026-08-31T00:00:00Z',
      owner: 'Cloud SOC'
    }
  ];

  private resources: GovResource[] = [
    {
      id: 'res-gw-01',
      provider: 'kubernetes',
      account: 'acc-prod-k8s-01',
      region: 'us-east-1',
      service: 'api-gateway',
      resource: 'k8s-deployment/api-gateway',
      type: 'Deployment',
      environment: 'production',
      owner: 'Platform Engineering Lead',
      team: 'Platform Engineering',
      costCenter: 'CC-PLATFORM-101',
      tags: { owner: 'Platform Lead', team: 'Platform Engineering', costCenter: 'CC-PLATFORM-101', env: 'production' },
      status: 'HEALTHY',
      lastSeen: '2026-08-31T06:00:00Z'
    },
    {
      id: 'res-ord-01',
      provider: 'kubernetes',
      account: 'acc-prod-k8s-01',
      region: 'us-east-1',
      service: 'order-service',
      resource: 'k8s-deployment/order-service',
      type: 'Deployment',
      environment: 'production',
      owner: 'Order Processing Squad',
      team: 'Core Backend',
      costCenter: 'CC-BACKEND-202',
      tags: { owner: 'Order Squad', team: 'Core Backend', costCenter: 'CC-BACKEND-202', env: 'production' },
      status: 'HEALTHY',
      lastSeen: '2026-08-31T06:00:00Z'
    },
    {
      id: 'res-pay-01',
      provider: 'kubernetes',
      account: 'acc-prod-k8s-01',
      region: 'us-east-1',
      service: 'payment-service',
      resource: 'k8s-deployment/payment-service',
      type: 'Deployment',
      environment: 'production',
      owner: 'Payment Platform Squad',
      team: 'FinOps & Payments',
      costCenter: 'CC-PAYMENTS-303',
      tags: { owner: 'Payment Squad', team: 'FinOps & Payments', costCenter: 'CC-PAYMENTS-303', env: 'production' },
      status: 'HEALTHY',
      lastSeen: '2026-08-31T06:00:00Z'
    },
    {
      id: 'res-rds-01',
      provider: 'aws',
      account: 'acc-aws-prod-99',
      region: 'us-east-1',
      service: 'order-service',
      resource: 'aws_rds/order-db-primary',
      type: 'RDS PostgreSQL Instance',
      environment: 'production',
      owner: 'Order Processing Squad',
      team: 'Core Backend',
      costCenter: 'CC-BACKEND-202',
      tags: { owner: 'Order Squad', team: 'Core Backend', costCenter: 'CC-BACKEND-202', env: 'production' },
      status: 'HEALTHY',
      lastSeen: '2026-08-31T06:00:00Z'
    },
    {
      id: 'res-ebs-qa',
      provider: 'aws',
      account: 'acc-aws-prod-99',
      region: 'us-east-1',
      service: 'order-service',
      resource: 'aws_ebs/vol-unattached-qa-99',
      type: 'EBS Volume',
      environment: 'staging',
      owner: 'QA Engineering',
      team: 'Core Backend',
      costCenter: 'CC-BACKEND-202',
      tags: { owner: 'QA Lead', team: 'Core Backend', costCenter: 'CC-BACKEND-202', env: 'staging' },
      status: 'NON_COMPLIANT',
      lastSeen: '2026-08-31T06:00:00Z'
    },
    {
      id: 'res-sqs-01',
      provider: 'aws',
      account: 'acc-aws-prod-99',
      region: 'us-east-1',
      service: 'payment-service',
      resource: 'aws_sqs/payment-events-queue',
      type: 'SQS Queue',
      environment: 'production',
      owner: 'Payment Platform Squad',
      team: 'FinOps & Payments',
      costCenter: 'CC-PAYMENTS-303',
      tags: { owner: 'Payment Squad', team: 'FinOps & Payments', costCenter: 'CC-PAYMENTS-303', env: 'production' },
      status: 'HEALTHY',
      lastSeen: '2026-08-31T06:00:00Z'
    }
  ];

  private evaluations: GovEvaluation[] = [
    {
      id: 'eval-001',
      policyId: 'pol-mandatory-tags',
      resourceId: 'res-gw-01',
      timestamp: '2026-08-31T06:00:00Z',
      result: 'PASS',
      severity: 'HIGH',
      evidence: 'All required tags [owner, team, costCenter, env] present and verified.',
      observedValue: '4/4 tags present',
      expectedValue: '4/4 tags present',
      evaluationVersion: 'v2.0.0'
    },
    {
      id: 'eval-002',
      policyId: 'pol-signed-images',
      resourceId: 'res-gw-01',
      timestamp: '2026-08-31T06:00:00Z',
      result: 'PASS',
      severity: 'CRITICAL',
      evidence: 'Cosign signature ECDSA-P256 verified against GitHub Actions OIDC identity.',
      observedValue: 'VALID signature + SLSA L3',
      expectedValue: 'VALID signature + SLSA L3',
      evaluationVersion: 'v1.4.0'
    },
    {
      id: 'eval-003',
      policyId: 'pol-encrypted-backups',
      resourceId: 'res-rds-01',
      timestamp: '2026-08-31T06:00:00Z',
      result: 'PASS',
      severity: 'HIGH',
      evidence: 'RDS KMS encryption active with 30-day automated backup retention.',
      observedValue: 'Encrypted: true, Retention: 30d',
      expectedValue: 'Encrypted: true, Retention: >= 30d',
      evaluationVersion: 'v1.2.0'
    },
    {
      id: 'eval-004',
      policyId: 'pol-mandatory-tags',
      resourceId: 'res-ebs-qa',
      timestamp: '2026-08-31T06:00:00Z',
      result: 'WARN',
      severity: 'HIGH',
      evidence: 'Resource unattached for > 14 days; marked for FinOps waste cleanup.',
      observedValue: 'Unattached EBS Volume',
      expectedValue: 'Active Attachment',
      evaluationVersion: 'v2.0.0'
    }
  ];

  private exceptions: GovException[] = [
    {
      id: 'exc-001',
      policyId: 'pol-mandatory-tags',
      resourceId: 'res-ebs-qa',
      reason: 'Temporary 30-day snapshot archive retention during QA test migration.',
      owner: 'QA Engineering Lead',
      approvedBy: 'Compliance Officer',
      createdAt: '2026-08-15T00:00:00Z',
      expiresAt: '2026-09-15T00:00:00Z',
      status: 'APPROVED',
      scope: 'resource:aws_ebs/vol-unattached-qa-99'
    }
  ];

  private violations: GovViolation[] = [
    {
      id: 'viol-001',
      policyId: 'pol-mandatory-tags',
      resourceId: 'res-ebs-qa',
      severity: 'HIGH',
      owner: 'QA Engineering Lead',
      evidence: 'Unattached EBS storage volume in staging environment exceeding 14-day idle limit.',
      status: 'SUPPRESSED',
      exceptionId: 'exc-001',
      detectedAt: '2026-08-31T06:00:00Z'
    }
  ];

  private remediations: GovRemediationWorkflow[] = [
    {
      id: 'rem-001',
      violationId: 'viol-001',
      policyId: 'pol-mandatory-tags',
      resourceId: 'res-ebs-qa',
      currentStage: 'ANALYZE',
      status: 'PAUSED',
      mode: 'ASSISTED',
      approvedBy: 'Compliance Officer',
      timeline: [
        { stage: 'DETECT', timestamp: '2026-08-31T06:00:00Z', status: 'COMPLETED' },
        { stage: 'ANALYZE', timestamp: '2026-08-31T06:01:00Z', status: 'COMPLETED' }
      ]
    }
  ];

  private evidenceRecords: GovEvidenceRecord[] = [
    {
      id: 'ev-001',
      policyId: 'pol-signed-images',
      resourceId: 'res-gw-01',
      result: 'PASS',
      observedConfig: {
        digest: 'sha256:5a9e7f82b7c4d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
        issuer: 'https://token.actions.githubusercontent.com',
        slsaLevel: 'SLSA_BUILD_L3'
      },
      timestamp: '2026-08-31T06:00:00Z',
      source: 'Kubernetes Admission Controller + Sigstore Rekor',
      evaluationVersion: 'v1.4.0'
    }
  ];

  private frameworkMappings: GovFrameworkMapping[] = [
    {
      framework: 'SOC 2 Type II',
      controlId: 'CC6.1',
      controlName: 'Logical Access & Container Integrity',
      policyIds: ['pol-signed-images', 'pol-nonroot-containers'],
      passingCount: 3,
      failingCount: 0,
      coveragePercent: 100.0
    },
    {
      framework: 'ISO / IEC 27001',
      controlId: 'A.12.1.2',
      controlName: 'Change Management & Secure Supply Chain',
      policyIds: ['pol-signed-images'],
      passingCount: 3,
      failingCount: 0,
      coveragePercent: 100.0
    },
    {
      framework: 'CIS Kubernetes Benchmark',
      controlId: 'CIS-5.2.6',
      controlName: 'Minimize the admission of root containers',
      policyIds: ['pol-nonroot-containers'],
      passingCount: 3,
      failingCount: 0,
      coveragePercent: 100.0
    }
  ];

  public static getInstance(): EnterpriseGovernanceEngine {
    if (!EnterpriseGovernanceEngine.instance) {
      EnterpriseGovernanceEngine.instance = new EnterpriseGovernanceEngine();
    }
    return EnterpriseGovernanceEngine.instance;
  }

  public getSummary(): GovCommandSummary {
    const totalResources = this.resources.length;
    const compliant = this.resources.filter((r) => r.status === 'HEALTHY').length;
    const nonCompliant = this.resources.filter((r) => r.status !== 'HEALTHY').length;
    const compliancePercent = totalResources > 0 ? (compliant / totalResources) * 100 : 100;
    const openViolations = this.violations.filter((v) => v.status === 'OPEN' || v.status === 'REMEDIATING').length;
    const activeExceptions = this.exceptions.filter((e) => e.status === 'APPROVED').length;

    return {
      governanceScore: 96.2,
      compliancePercent: Number(compliancePercent.toFixed(1)),
      totalResourcesCount: totalResources,
      compliantResourcesCount: compliant,
      nonCompliantResourcesCount: nonCompliant,
      criticalViolationsCount: this.violations.filter((v) => v.severity === 'CRITICAL' && v.status === 'OPEN').length,
      openViolationsCount: openViolations,
      activeExceptionsCount: activeExceptions,
      policyCoveragePercent: 100.0,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getPolicies(category?: string, status?: string): GovPolicy[] {
    return this.policies.filter((p) => {
      if (category && p.category !== category) return false;
      if (status && p.status !== status) return false;
      return true;
    });
  }

  public getResources(provider?: string, team?: string, status?: string): GovResource[] {
    return this.resources.filter((r) => {
      if (provider && r.provider !== provider) return false;
      if (team && r.team !== team) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }

  public getEvaluations(policyId?: string, resourceId?: string): GovEvaluation[] {
    return this.evaluations.filter((e) => {
      if (policyId && e.policyId !== policyId) return false;
      if (resourceId && e.resourceId !== resourceId) return false;
      return true;
    });
  }

  public getViolations(status?: string, severity?: string): GovViolation[] {
    return this.violations.filter((v) => {
      if (status && v.status !== status) return false;
      if (severity && v.severity !== severity) return false;
      return true;
    });
  }

  public getExceptions(status?: string): GovException[] {
    if (status) {
      return this.exceptions.filter((e) => e.status === status);
    }
    return this.exceptions;
  }

  public requestException(payload: Omit<GovException, 'id' | 'createdAt' | 'status'>): GovException {
    const exc: GovException = {
      id: `exc-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
      status: 'APPROVED'
    };
    this.exceptions.push(exc);
    return exc;
  }

  public getRemediations(): GovRemediationWorkflow[] {
    return this.remediations;
  }

  public executeRemediation(workflowId: string, approver?: string): GovRemediationWorkflow {
    const rem = this.remediations.find((r) => r.id === workflowId);
    if (!rem) {
      throw new Error(`Remediation workflow '${workflowId}' not found`);
    }
    if (approver) {
      rem.approvedBy = approver;
    }
    rem.status = 'SUCCESS';
    rem.currentStage = 'CLOSE';
    return rem;
  }

  public getEvidence(policyId?: string): GovEvidenceRecord[] {
    if (policyId) {
      return this.evidenceRecords.filter((e) => e.policyId === policyId);
    }
    return this.evidenceRecords;
  }

  public getFrameworkMappings(): GovFrameworkMapping[] {
    return this.frameworkMappings;
  }
}
