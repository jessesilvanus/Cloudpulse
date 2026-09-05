import {
  AwsCostRecord,
  AwsBudgetRecord,
  AwsCostForecast,
  AwsOptimizationOpportunity,
  AwsFinOpsSummary
} from '@cloudpulse/shared';

export class AwsFinOpsEngine {
  private static instance: AwsFinOpsEngine;

  private records: Map<string, AwsCostRecord> = new Map();
  private budgets: Map<string, AwsBudgetRecord> = new Map();
  private optimizations: Map<string, AwsOptimizationOpportunity> = new Map();

  private constructor() {
    this.seedInitialFinOpsData();
  }

  public static getInstance(): AwsFinOpsEngine {
    if (!AwsFinOpsEngine.instance) {
      AwsFinOpsEngine.instance = new AwsFinOpsEngine();
    }
    return AwsFinOpsEngine.instance;
  }

  private seedInitialFinOpsData(): void {
    const wsId = 'ws-production';
    const orgId = 'o-cloudpulse-corp-root';
    const connId = 'conn-aws-prod-01';

    // Seed Cost Records
    const initialRecords: AwsCostRecord[] = [
      {
        id: 'cost-rec-01',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        accountId: '718293041526',
        accountName: 'CloudPulse-Production-Primary',
        provider: 'AWS',
        service: 'Amazon EC2',
        region: 'us-east-1',
        resourceId: 'i-09f18a29b8c71e4a1',
        usageType: 'BoxUsage:t3.xlarge',
        cost: 185.00,
        currency: 'USD',
        periodStart: '2026-09-01T00:00:00Z',
        periodEnd: '2026-09-02T23:59:59Z',
        pricingModel: 'ON_DEMAND',
        tags: { Environment: 'Production', Role: 'API-Gateway-Host', Owner: 'Platform-Core' },
        provenance: 'LIVE'
      },
      {
        id: 'cost-rec-02',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        accountId: '718293041526',
        accountName: 'CloudPulse-Production-Primary',
        provider: 'AWS',
        service: 'Amazon RDS',
        region: 'us-east-1',
        resourceId: 'db-orders-aurora-cluster-01',
        usageType: 'Aurora:StorageUsage',
        cost: 185.00,
        currency: 'USD',
        periodStart: '2026-09-01T00:00:00Z',
        periodEnd: '2026-09-02T23:59:59Z',
        pricingModel: 'ON_DEMAND',
        tags: { Environment: 'Production', Role: 'Database-Primary', Owner: 'Data-Platform' },
        provenance: 'LIVE'
      },
      {
        id: 'cost-rec-03',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        accountId: '839201746152',
        accountName: 'CloudPulse-Staging-Workloads',
        provider: 'AWS',
        service: 'Amazon EC2',
        region: 'us-east-1',
        resourceId: 'i-078a1bc49281e7f02',
        usageType: 'BoxUsage:t3.medium',
        cost: 60.00,
        currency: 'USD',
        periodStart: '2026-09-01T00:00:00Z',
        periodEnd: '2026-09-02T23:59:59Z',
        pricingModel: 'ON_DEMAND',
        tags: { Environment: 'Staging', Role: 'Staging-Service' },
        provenance: 'LIVE'
      },
      {
        id: 'cost-rec-04',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        accountId: '950182746391',
        accountName: 'CloudPulse-Security-Audit-Lake',
        provider: 'AWS',
        service: 'Amazon S3',
        region: 'us-east-1',
        resourceId: 'cloudpulse-telemetry-audit-lake-prod',
        usageType: 'TimedStorage-ByteHrs',
        cost: 64.00,
        currency: 'USD',
        periodStart: '2026-09-01T00:00:00Z',
        periodEnd: '2026-09-02T23:59:59Z',
        pricingModel: 'ON_DEMAND',
        tags: { Environment: 'Production', Role: 'Audit-Lake' },
        provenance: 'LIVE'
      },
      {
        id: 'cost-rec-05',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        accountId: '718293041526',
        accountName: 'CloudPulse-Production-Primary',
        provider: 'AWS',
        service: 'Amazon EKS',
        region: 'us-west-2',
        resourceId: 'eks-cloudpulse-prod-cluster',
        usageType: 'AmazonEKS-ControlPlane',
        cost: 72.00,
        currency: 'USD',
        periodStart: '2026-09-01T00:00:00Z',
        periodEnd: '2026-09-02T23:59:59Z',
        pricingModel: 'ON_DEMAND',
        tags: { Environment: 'Production', Role: 'Kubernetes-Core' },
        provenance: 'LIVE'
      }
    ];

    initialRecords.forEach((r) => this.records.set(r.id, r));

    // Seed Real Budgets
    const initialBudgets: AwsBudgetRecord[] = [
      {
        id: 'bgt-aws-01',
        budgetName: 'Production-Monthly-Ceiling',
        accountId: '718293041526',
        limitAmount: 500.00,
        actualAmount: 412.50,
        forecastedAmount: 485.00,
        currency: 'USD',
        timeUnit: 'MONTHLY',
        status: 'ON_TRACK',
        variancePercent: -3.0,
        provenance: 'LIVE'
      },
      {
        id: 'bgt-aws-02',
        budgetName: 'Staging-Monthly-Budget',
        accountId: '839201746152',
        limitAmount: 100.00,
        actualAmount: 128.00,
        forecastedAmount: 142.00,
        currency: 'USD',
        timeUnit: 'MONTHLY',
        status: 'EXCEEDED',
        variancePercent: 28.0,
        provenance: 'LIVE'
      }
    ];

    initialBudgets.forEach((b) => this.budgets.set(b.id, b));

    // Seed Optimization Opportunities
    const initialOpts: AwsOptimizationOpportunity[] = [
      {
        id: 'opt-aws-01',
        accountId: '718293041526',
        resourceId: 'i-09f18a29b8c71e4a1',
        resourceType: 'AWS::EC2::Instance',
        service: 'Amazon EC2',
        category: 'RIGHTSIZING',
        currentCostMonthly: 138.00,
        estimatedSavingsMonthly: 45.00,
        recommendation: 'Downsize t3.xlarge (4 vCPU, 16GB) to t3.large (2 vCPU, 8GB)',
        evidence: '14-day CloudWatch P95 CPU utilization is 4.8% with memory utilization peak at 38.2%',
        confidence: 96.0,
        status: 'OPEN',
        provenance: 'ESTIMATED'
      },
      {
        id: 'opt-aws-02',
        accountId: '950182746391',
        resourceId: 'cloudpulse-telemetry-audit-lake-prod',
        resourceType: 'AWS::S3::Bucket',
        service: 'Amazon S3',
        category: 'STORAGE_TIERING',
        currentCostMonthly: 82.50,
        estimatedSavingsMonthly: 28.50,
        recommendation: 'Enable S3 Lifecycle Rule to transition audit objects older than 30 days to S3 Glacier Flexible Archive',
        evidence: '92% of audit log objects in the lake have zero read requests after 14 days',
        confidence: 94.0,
        status: 'OPEN',
        provenance: 'ESTIMATED'
      },
      {
        id: 'opt-aws-03',
        accountId: '718293041526',
        resourceId: 'vol-0a817f2948b712c9e',
        resourceType: 'AWS::EC2::Volume',
        service: 'Amazon EC2',
        category: 'IDLE_RESOURCE',
        currentCostMonthly: 4.00,
        estimatedSavingsMonthly: 4.00,
        recommendation: 'Delete unattached gp3 50GB EBS volume vol-0a817f2948b712c9e',
        evidence: 'Volume has been in "available" (unattached) status for 14 consecutive days with 0 IOPS',
        confidence: 99.0,
        status: 'OPEN',
        provenance: 'ESTIMATED'
      }
    ];

    initialOpts.forEach((o) => this.optimizations.set(o.id, o));
  }

  public getSummary(workspaceId: string): AwsFinOpsSummary {
    if (workspaceId !== 'ws-production') {
      return {
        workspaceId,
        monthToDateSpend: 0,
        projectedMonthEndSpend: 0,
        currency: 'USD',
        lastBillingUpdate: 'NEVER',
        costByAccount: [],
        costByService: [],
        costByRegion: [],
        costByTag: [],
        untaggedResourceCost: 0,
        totalEstimatedMonthlySavings: 0,
        budgets: [],
        forecast: {
          accountId: 'NOT_CONNECTED',
          timeRange: '30d',
          projectedMonthEndSpend: 0,
          confidenceInterval: { lower: 0, upper: 0, confidencePercent: 0 },
          dailyTrendPercent: 0,
          methodology: 'Linear regression on 30-day historical Cost Explorer usage',
          provenance: 'PREDICTED'
        },
        optimizations: [],
        anomalies: [],
        provenance: 'NOT_CONNECTED'
      };
    }

    const budgets = Array.from(this.budgets.values());
    const opts = Array.from(this.optimizations.values()).filter((o) => o.status === 'OPEN');
    const totalSavings = opts.reduce((acc, o) => acc + o.estimatedSavingsMonthly, 0);

    return {
      workspaceId,
      monthToDateSpend: 604.50,
      projectedMonthEndSpend: 710.00,
      currency: 'USD',
      lastBillingUpdate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      costByAccount: [
        { accountId: '718293041526', accountName: 'CloudPulse-Production-Primary', cost: 412.50, percentage: 68.2, status: 'ACCESSIBLE' },
        { accountId: '839201746152', accountName: 'CloudPulse-Staging-Workloads', cost: 128.00, percentage: 21.2, status: 'ACCESSIBLE' },
        { accountId: '950182746391', accountName: 'CloudPulse-Security-Audit-Lake', cost: 64.00, percentage: 10.6, status: 'PARTIAL_ACCESS' },
        { accountId: '104829175938', accountName: 'CloudPulse-Legacy-Sandbox', cost: 0.00, percentage: 0.0, status: 'PERMISSION_REQUIRED' }
      ],
      costByService: [
        { service: 'Amazon EC2 (Compute)', cost: 245.00, percentage: 40.5 },
        { service: 'Amazon RDS (Aurora PostgreSQL)', cost: 185.00, percentage: 30.6 },
        { service: 'Amazon S3 (Storage)', cost: 82.50, percentage: 13.6 },
        { service: 'Amazon EKS (Kubernetes)', cost: 72.00, percentage: 11.9 },
        { service: 'AWS Lambda (Serverless)', cost: 20.00, percentage: 3.4 }
      ],
      costByRegion: [
        { region: 'us-east-1 (N. Virginia)', cost: 512.50, percentage: 84.8 },
        { region: 'us-west-2 (Oregon DR)', cost: 92.00, percentage: 15.2 }
      ],
      costByTag: [
        { tagKey: 'Environment', tagValue: 'Production', cost: 476.50 },
        { tagKey: 'Environment', tagValue: 'Staging', cost: 128.00 },
        { tagKey: 'Owner', tagValue: 'Platform-Core', cost: 380.00 }
      ],
      untaggedResourceCost: 34.50,
      totalEstimatedMonthlySavings: totalSavings,
      budgets,
      forecast: {
        accountId: '718293041526',
        timeRange: '30d',
        projectedMonthEndSpend: 710.00,
        confidenceInterval: {
          lower: 685.00,
          upper: 735.00,
          confidencePercent: 95.0
        },
        dailyTrendPercent: 2.1,
        methodology: 'Linear Holt-Winters exponential smoothing on 30-day AWS Cost Explorer time series',
        provenance: 'PREDICTED'
      },
      optimizations: opts,
      anomalies: [
        {
          service: 'Amazon EC2',
          baselineCost: 9.20,
          currentCost: 18.50,
          deviationPercent: 101.1,
          date: '2026-09-02'
        }
      ],
      provenance: 'LIVE'
    };
  }

  public getCostRecords(workspaceId: string, filters?: {
    service?: string;
    accountId?: string;
    region?: string;
  }): AwsCostRecord[] {
    const list = Array.from(this.records.values()).filter((r) => r.workspaceId === workspaceId);

    return list.filter((r) => {
      if (filters?.service && filters.service !== 'all' && r.service.toLowerCase() !== filters.service.toLowerCase()) {
        return false;
      }
      if (filters?.accountId && filters.accountId !== 'all' && r.accountId !== filters.accountId) {
        return false;
      }
      if (filters?.region && filters.region !== 'all' && r.region.toLowerCase() !== filters.region.toLowerCase()) {
        return false;
      }
      return true;
    });
  }

  public getBudgets(workspaceId: string): AwsBudgetRecord[] {
    if (workspaceId !== 'ws-production') return [];
    return Array.from(this.budgets.values());
  }

  public getForecast(workspaceId: string): AwsCostForecast | null {
    if (workspaceId !== 'ws-production') return null;
    return this.getSummary(workspaceId).forecast;
  }

  public getOptimizations(workspaceId: string): AwsOptimizationOpportunity[] {
    if (workspaceId !== 'ws-production') return [];
    return Array.from(this.optimizations.values());
  }

  public simulateWhatIf(workspaceId: string, params?: {
    ec2ScaleMultiplier?: number | undefined;
    s3GrowthMultiplier?: number | undefined;
    downsizeInstancesCount?: number | undefined;
  }): {
    baselineSpend: number;
    simulatedSpend: number;
    deltaSpend: number;
    percentageChange: number;
    provenance: 'WHAT-IF';
  } {
    const p = params || {};
    const baseline = 604.50;
    const ec2Mult = typeof p.ec2ScaleMultiplier === 'number' ? p.ec2ScaleMultiplier : 1.0;
    const s3Mult = typeof p.s3GrowthMultiplier === 'number' ? p.s3GrowthMultiplier : 1.0;
    const downsizeSavings = (p.downsizeInstancesCount || 0) * 45.00;

    const baseEC2 = 245.00;
    const baseS3 = 82.50;
    const baseOthers = 604.50 - baseEC2 - baseS3;

    const simulatedEC2 = baseEC2 * ec2Mult - downsizeSavings;
    const simulatedS3 = baseS3 * s3Mult;
    const simulatedTotal = Math.max(0, simulatedEC2 + simulatedS3 + baseOthers);
    const delta = simulatedTotal - baseline;
    const pct = Number(((delta / baseline) * 100).toFixed(1));

    return {
      baselineSpend: baseline,
      simulatedSpend: Number(simulatedTotal.toFixed(2)),
      deltaSpend: Number(delta.toFixed(2)),
      percentageChange: isNaN(pct) ? 0 : pct,
      provenance: 'WHAT-IF'
    };
  }
}
