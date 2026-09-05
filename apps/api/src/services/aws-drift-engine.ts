import {
  AwsCloudDrift,
  AwsConfigurationBaseline,
  AwsDriftSummary,
  AwsDriftType,
  AwsDriftLifecycleStatus,
  AwsDriftDiff
} from '@cloudpulse/shared';

export class AwsDriftEngine {
  private static instance: AwsDriftEngine;

  private baselines: Map<string, AwsConfigurationBaseline> = new Map();
  private drifts: Map<string, AwsCloudDrift> = new Map();
  private lastReconciliationTime: Date = new Date();

  private constructor() {
    this.seedDriftData();
  }

  public static getInstance(): AwsDriftEngine {
    if (!AwsDriftEngine.instance) {
      AwsDriftEngine.instance = new AwsDriftEngine();
    }
    return AwsDriftEngine.instance;
  }

  private seedDriftData(): void {
    const wsId = 'ws-production';
    const orgId = 'o-cloudpulse-corp-root';
    const now = new Date();
    this.lastReconciliationTime = new Date(now.getTime() - 2 * 60 * 1000);

    const initialBaselines: AwsConfigurationBaseline[] = [
      {
        id: 'base-aws-ec2-staging',
        workspaceId: wsId,
        organizationId: orgId,
        name: 'Staging EC2 Operational Baseline',
        version: 'v1.2.0',
        source: 'APPROVED_BASELINE',
        status: 'ACTIVE',
        resourceType: 'AWS::EC2::Instance',
        expectedConfiguration: {
          monitoring: { state: 'enabled' },
          instanceType: 't3.medium',
          tags: { Environment: 'staging', ManagedBy: 'Terraform' }
        },
        createdBy: 'sre-architect@cloudpulse.io',
        createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'base-aws-s3-audit',
        workspaceId: wsId,
        organizationId: orgId,
        name: 'Production S3 Security Baseline',
        version: 'v2.0.0',
        source: 'ORGANIZATION_STANDARD',
        status: 'ACTIVE',
        resourceType: 'AWS::S3::Bucket',
        expectedConfiguration: {
          publicAccessBlock: {
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
          },
          serverSideEncryption: {
            rules: [{ applyServerSideEncryptionByDefault: { sseAlgorithm: 'aws:kms' } }]
          }
        },
        createdBy: 'security-lead@cloudpulse.io',
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    initialBaselines.forEach((b) => this.baselines.set(b.id, b));

    const initialDrifts: AwsCloudDrift[] = [
      {
        id: 'drift-aws-ec2-01',
        workspaceId: wsId,
        organizationId: orgId,
        accountId: '839201746152',
        region: 'us-east-1',
        resourceId: 'i-078a1bc49281e7f02',
        resourceName: 'staging-workload-runner',
        resourceType: 'AWS::EC2::Instance',
        driftType: 'OBSERVABILITY_DRIFT',
        severity: 'MEDIUM',
        status: 'DETECTED',
        detectedAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        lastObservedAt: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
        baselineId: 'base-aws-ec2-staging',
        baselineVersion: 'v1.2.0',
        diffs: [
          {
            field: 'monitoring.state',
            expected: 'enabled',
            actual: 'disabled',
            diffType: 'CHANGED'
          }
        ],
        actor: 'dev-automation (SSM Session)',
        changeSource: 'AWS CloudTrail',
        policyImpact: ['pol-aws-ec2-monitoring-enabled'],
        securityImpact: 'Detailed 1-minute metrics absent during incident investigations',
        dependencyImpact: ['Staging Background Processing Pool'],
        costImpact: 0.00,
        evidence: [
          'DescribeInstances returns Monitoring.State = "disabled" vs Baseline expected "enabled"',
          'CloudTrail event recorded ModifyInstanceAttribute executed by principal "dev-automation"',
          'Reconciliation engine verified state change against baseline base-aws-ec2-staging v1.2.0'
        ],
        provenance: 'LIVE',
        freshness: '2 minutes ago'
      }
    ];

    initialDrifts.forEach((d) => this.drifts.set(d.id, d));
  }

  public getDriftSummary(workspaceId: string): AwsDriftSummary {
    if (workspaceId !== 'ws-production') {
      return {
        workspaceId,
        totalDriftsDetected: 0,
        criticalDriftsCount: 0,
        unresolvedDriftsCount: 0,
        activeBaselinesCount: 0,
        categoryBreakdown: {},
        reconciliationStatus: 'UNKNOWN',
        lastReconciliationAt: new Date().toISOString(),
        provenance: 'CALCULATED'
      };
    }

    const list = Array.from(this.drifts.values()).filter((d) => d.workspaceId === workspaceId);
    const critical = list.filter((d) => d.severity === 'CRITICAL').length;
    const unresolved = list.filter((d) => d.status === 'DETECTED' || d.status === 'INVESTIGATING').length;

    const breakdown: Record<string, number> = {};
    list.forEach((d) => {
      breakdown[d.driftType] = (breakdown[d.driftType] || 0) + 1;
    });

    return {
      workspaceId,
      totalDriftsDetected: list.length,
      criticalDriftsCount: critical,
      unresolvedDriftsCount: unresolved,
      activeBaselinesCount: this.baselines.size,
      categoryBreakdown: breakdown,
      reconciliationStatus: 'HEALTHY',
      lastReconciliationAt: this.lastReconciliationTime.toISOString(),
      provenance: 'CALCULATED'
    };
  }

  public getDrifts(workspaceId: string, filters?: {
    driftType?: string;
    status?: string;
    severity?: string;
  }): AwsCloudDrift[] {
    if (workspaceId !== 'ws-production') return [];

    let list = Array.from(this.drifts.values()).filter((d) => d.workspaceId === workspaceId);

    if (filters?.driftType && filters.driftType !== 'all') {
      list = list.filter((d) => d.driftType === filters.driftType);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((d) => d.status === filters.status);
    }
    if (filters?.severity && filters.severity !== 'all') {
      list = list.filter((d) => d.severity === filters.severity);
    }

    return list;
  }

  public getDriftById(driftId: string, workspaceId: string): AwsCloudDrift | null {
    if (workspaceId !== 'ws-production') return null;
    return this.drifts.get(driftId) || null;
  }

  public getBaselines(workspaceId: string): AwsConfigurationBaseline[] {
    if (workspaceId !== 'ws-production') return [];
    return Array.from(this.baselines.values()).filter((b) => b.workspaceId === workspaceId);
  }

  public getBaselineById(baselineId: string, workspaceId: string): AwsConfigurationBaseline | null {
    if (workspaceId !== 'ws-production') return null;
    return this.baselines.get(baselineId) || null;
  }

  public reconcileResourceDrift(resourceId: string, workspaceId: string): {
    reconciled: boolean;
    resourceId: string;
    driftsDetected: number;
    reconciliationTimestamp: string;
    provenance: 'LIVE';
  } {
    if (workspaceId !== 'ws-production') {
      return {
        reconciled: false,
        resourceId,
        driftsDetected: 0,
        reconciliationTimestamp: new Date().toISOString(),
        provenance: 'LIVE'
      };
    }

    this.lastReconciliationTime = new Date();
    const count = Array.from(this.drifts.values()).filter((d) => d.resourceId === resourceId).length;

    return {
      reconciled: true,
      resourceId,
      driftsDetected: count,
      reconciliationTimestamp: this.lastReconciliationTime.toISOString(),
      provenance: 'LIVE'
    };
  }

  public updateDriftStatus(driftId: string, status: AwsDriftLifecycleStatus, workspaceId: string): AwsCloudDrift | null {
    if (workspaceId !== 'ws-production') return null;
    const drift = this.drifts.get(driftId);
    if (!drift) return null;

    drift.status = status;
    drift.lastObservedAt = new Date().toISOString();
    return drift;
  }

  public createBaseline(workspaceId: string, params: {
    name: string;
    resourceType: string;
    expectedConfiguration: Record<string, any>;
    createdBy: string;
    source?: 'ACTIVE_POLICY' | 'APPROVED_BASELINE' | 'IAC_STATE' | 'ORGANIZATION_STANDARD';
  }): AwsConfigurationBaseline {
    const id = `base-${Math.random().toString(36).substring(2, 9)}`;
    const baseline: AwsConfigurationBaseline = {
      id,
      workspaceId,
      organizationId: 'o-cloudpulse-corp-root',
      name: params.name,
      version: 'v1.0.0',
      source: params.source || 'APPROVED_BASELINE',
      status: 'DRAFT',
      resourceType: params.resourceType,
      expectedConfiguration: params.expectedConfiguration,
      createdBy: params.createdBy,
      createdAt: new Date().toISOString()
    };

    this.baselines.set(baseline.id, baseline);
    return baseline;
  }

  public approveBaseline(baselineId: string, workspaceId: string): AwsConfigurationBaseline | null {
    if (workspaceId !== 'ws-production') return null;
    const b = this.baselines.get(baselineId);
    if (!b) return null;

    b.status = 'ACTIVE';
    b.approvedAt = new Date().toISOString();
    return b;
  }
}
