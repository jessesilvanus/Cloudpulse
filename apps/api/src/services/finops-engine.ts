import {
  FinOpsSummary,
  CostRecord,
  ServiceCostBreakdown,
  ResourceCostBreakdown,
  CostAllocationDimension,
  CostBudget,
  CostForecast,
  CostAnomaly,
  OptimizationRecommendation,
  CostDataSource,
  CurrencyCode,
  FinOpsPlatformSummary,
  TaggingGovernanceScore,
  UnitEconomicsMetric,
  KubernetesFinOpsMetrics,
  CostPolicyRule
} from '@cloudpulse/shared';

export interface CostProvider {
  getDataSource(): CostDataSource;
  isAvailable(): boolean;
  getDailyCosts(days: number): CostRecord[];
  getServiceCosts(): ServiceCostBreakdown[];
  getResourceCosts(): ResourceCostBreakdown[];
}

export class DemoCostProvider implements CostProvider {
  public getDataSource(): CostDataSource {
    return 'demo_local';
  }

  public isAvailable(): boolean {
    return true;
  }

  public getDailyCosts(days: number): CostRecord[] {
    const records: CostRecord[] = [];
    const now = Date.now();
    const baseDaily = 18.4; // Base daily cloud spend in USD

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 86400000).toISOString().split('T')[0] || '';
      const variance = Math.sin(i * 0.8) * 1.5 + (Math.random() * 0.8 - 0.4);
      const amount = Number((baseDaily + variance).toFixed(2));

      records.push({
        id: `cost-rec-${date}`,
        date,
        amount,
        currency: 'USD',
        service: 'all',
        environment: 'production'
      });
    }

    return records;
  }

  public getServiceCosts(): ServiceCostBreakdown[] {
    return [
      {
        serviceId: 'eks-cluster',
        serviceName: 'Amazon EKS & Spot Nodes (t3.medium)',
        category: 'compute',
        monthlyCost: 218.4,
        percentageOfTotal: 39.5,
        costTrendPercent: -4.2
      },
      {
        serviceId: 'alb-ingress',
        serviceName: 'Application Load Balancer',
        category: 'networking',
        monthlyCost: 96.5,
        percentageOfTotal: 17.5,
        costTrendPercent: 0.0
      },
      {
        serviceId: 'cloudwatch-telemetry',
        serviceName: 'Amazon CloudWatch Logs & Metrics',
        category: 'observability',
        monthlyCost: 78.2,
        percentageOfTotal: 14.1,
        costTrendPercent: 6.8
      },
      {
        serviceId: 'ecr-registry',
        serviceName: 'Amazon Elastic Container Registry',
        category: 'storage',
        monthlyCost: 14.8,
        percentageOfTotal: 2.7,
        costTrendPercent: -1.5
      },
      {
        serviceId: 'ebs-volumes',
        serviceName: 'Amazon EBS gp3 Storage',
        category: 'storage',
        monthlyCost: 42.1,
        percentageOfTotal: 7.6,
        costTrendPercent: 1.2
      },
      {
        serviceId: 'nat-gateway-dev',
        serviceName: 'VPC Endpoints & Data Transfer',
        category: 'networking',
        monthlyCost: 102.8,
        percentageOfTotal: 18.6,
        costTrendPercent: 12.4
      }
    ];
  }

  public getResourceCosts(): ResourceCostBreakdown[] {
    return [
      {
        resourceId: 'pod-api-gateway',
        resourceName: 'api-gateway (Deployment: 2 replicas)',
        resourceType: 'k8s_deployment',
        region: 'us-east-1',
        environment: 'production',
        monthlyCost: 24.6,
        cpuRequested: '200m',
        cpuUsed: '65m',
        memoryRequested: '256Mi',
        memoryUsed: '112Mi',
        efficiencyScore: 42,
        dataSource: 'estimated_k8s_allocation'
      },
      {
        resourceId: 'pod-order-service',
        resourceName: 'order-service (Deployment: 2 replicas)',
        resourceType: 'k8s_deployment',
        region: 'us-east-1',
        environment: 'production',
        monthlyCost: 24.6,
        cpuRequested: '200m',
        cpuUsed: '85m',
        memoryRequested: '256Mi',
        memoryUsed: '138Mi',
        efficiencyScore: 51,
        dataSource: 'estimated_k8s_allocation'
      },
      {
        resourceId: 'pod-payment-service',
        resourceName: 'payment-service (Deployment: 2 replicas)',
        resourceType: 'k8s_deployment',
        region: 'us-east-1',
        environment: 'production',
        monthlyCost: 24.6,
        cpuRequested: '200m',
        cpuUsed: '45m',
        memoryRequested: '256Mi',
        memoryUsed: '98Mi',
        efficiencyScore: 36,
        dataSource: 'estimated_k8s_allocation'
      },
      {
        resourceId: 'pod-otel-collector',
        resourceName: 'otel-collector (Deployment: 1 replica)',
        resourceType: 'k8s_deployment',
        region: 'us-east-1',
        environment: 'production',
        monthlyCost: 18.2,
        cpuRequested: '250m',
        cpuUsed: '190m',
        memoryRequested: '512Mi',
        memoryUsed: '380Mi',
        efficiencyScore: 75,
        dataSource: 'estimated_k8s_allocation'
      }
    ];
  }
}

export class FinOpsEngine {
  private static instance: FinOpsEngine;
  private provider: CostProvider;
  private currency: CurrencyCode = 'USD';

  private budgets: CostBudget[] = [
    {
      id: 'bgt-prod-total',
      name: 'Production Total Infrastructure',
      scope: 'environment:production',
      amount: 650.0,
      currency: 'USD',
      period: 'monthly',
      spent: 552.8,
      remaining: 97.2,
      percentageConsumed: 85.0,
      forecastAmount: 618.5,
      status: 'warning',
      owner: 'Platform FinOps Team'
    },
    {
      id: 'bgt-observability',
      name: 'Observability & Logging Tier',
      scope: 'category:observability',
      amount: 100.0,
      currency: 'USD',
      period: 'monthly',
      spent: 78.2,
      remaining: 21.8,
      percentageConsumed: 78.2,
      forecastAmount: 89.4,
      status: 'ok',
      owner: 'SRE Team'
    }
  ];

  private anomalies: CostAnomaly[] = [
    {
      id: 'anom-nat-spike-01',
      serviceId: 'nat-gateway-dev',
      serviceName: 'VPC Endpoints & Data Transfer',
      detectedAt: new Date(Date.now() - 43200000).toISOString(),
      expectedCost: 2.8,
      actualCost: 6.4,
      deviationPercent: 128.5,
      severity: 'medium',
      possibleCause: 'Cross-AZ inter-service traffic burst during distributed trace load testing.',
      status: 'open'
    }
  ];

  private recommendations: OptimizationRecommendation[] = [
    {
      id: 'rec-rightsize-payment',
      title: 'Rightsize payment-service CPU & Memory Requests',
      category: 'rightsizing',
      priority: 'high',
      risk: 'low',
      confidence: 'high',
      resource: 'deploy/kubernetes/payment-service.yaml',
      currentConfig: 'CPU: 200m, Mem: 256Mi (Observed: 45m, 98Mi)',
      recommendedConfig: 'CPU: 100m, Mem: 160Mi',
      estimatedMonthlySavings: 14.8,
      estimatedAnnualSavings: 177.6,
      reason: 'Workload consistently utilizes <25% of requested CPU. Downsizing frees up node allocation capacity.',
      actionRequired: 'Update Kubernetes Deployment resource requests and verify under staging load test.',
      status: 'review_required'
    },
    {
      id: 'rec-ecr-lifecycle',
      title: 'Apply ECR Image Retention Lifecycle Policy',
      category: 'storage',
      priority: 'medium',
      risk: 'low',
      confidence: 'high',
      resource: 'Amazon ECR (6 repositories)',
      currentConfig: 'Untagged & old development builds retained indefinitely',
      recommendedConfig: 'Expire untagged images after 7 days; retain last 15 release images',
      estimatedMonthlySavings: 8.4,
      estimatedAnnualSavings: 100.8,
      reason: 'Accumulated untagged container layers consume unneeded S3-backed ECR storage.',
      actionRequired: 'Apply terraform ECR lifecycle policy module.',
      status: 'review_required'
    },
    {
      id: 'rec-spot-nodes',
      title: 'Maintain Spot Instance Node Groups for EKS Dev/Staging',
      category: 'kubernetes',
      priority: 'critical',
      risk: 'low',
      confidence: 'high',
      resource: 'infra/terraform/modules/eks',
      currentConfig: 'Spot instances (t3.medium) yielding 68% savings over On-Demand',
      recommendedConfig: 'Keep SPOT capacity-type with On-Demand fallback',
      estimatedMonthlySavings: 84.5,
      estimatedAnnualSavings: 1014.0,
      reason: 'Spot nodes provide resilient fault-tolerant compute for microservices backed by Kubernetes ReplicaSets.',
      actionRequired: 'Active policy verified compliant.',
      status: 'approved'
    }
  ];

  private costPolicies: CostPolicyRule[] = [
    {
      id: 'cpol-budget-warn',
      name: 'Warn at 80% Monthly Budget Consumption',
      description: 'Generates warning alert when environment spend reaches 80% of allocation.',
      ruleType: 'budget_threshold',
      severity: 'medium',
      effect: 'WARN',
      condition: 'budgetConsumedPercent >= 80',
      status: 'active'
    },
    {
      id: 'cpol-mandatory-tags',
      name: 'Enforce Mandatory Cost Allocation Tags',
      description: 'Requires environment, team, and service tags on all provisioned infrastructure.',
      ruleType: 'mandatory_tagging',
      severity: 'high',
      effect: 'BLOCK',
      condition: 'missingTagsCount > 0',
      status: 'active'
    }
  ];

  private constructor() {
    this.provider = new DemoCostProvider();
  }

  public static getInstance(): FinOpsEngine {
    if (!FinOpsEngine.instance) {
      FinOpsEngine.instance = new FinOpsEngine();
    }
    return FinOpsEngine.instance;
  }

  public getSummary(): FinOpsSummary {
    const serviceCosts = this.provider.getServiceCosts();
    const currentMonthCost = Number(serviceCosts.reduce((acc, s) => acc + s.monthlyCost, 0).toFixed(2));
    const previousMonthCost = 584.2;
    const monthOverMonthChangePercent = Number(
      (((currentMonthCost - previousMonthCost) / previousMonthCost) * 100).toFixed(1)
    );

    const totalMonthlyBudget = this.budgets.reduce((acc, b) => acc + b.amount, 0);
    const totalBudgetConsumedPercent = Number(((currentMonthCost / totalMonthlyBudget) * 100).toFixed(1));

    const totalPotentialMonthlySavings = Number(
      this.recommendations
        .filter((r) => r.status === 'review_required' || r.status === 'approved')
        .reduce((acc, r) => acc + r.estimatedMonthlySavings, 0)
        .toFixed(2)
    );

    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyRunRate = currentMonthCost / Math.max(1, currentDay);
    const forecastedMonthEndCost = Number((dailyRunRate * daysInMonth).toFixed(2));

    return {
      currentMonthCost,
      previousMonthCost,
      monthOverMonthChangePercent,
      forecastedMonthEndCost,
      totalMonthlyBudget,
      totalBudgetConsumedPercent,
      currency: this.currency,
      activeAnomaliesCount: this.anomalies.filter((a) => a.status === 'open').length,
      totalPotentialMonthlySavings,
      dataSource: this.provider.getDataSource(),
      lastUpdatedAt: new Date().toISOString()
    };
  }

  public getPlatformSummary(): FinOpsPlatformSummary {
    const baseSummary = this.getSummary();
    const tagging = this.getTaggingGovernance();

    return {
      currentMonthSpend: baseSummary.currentMonthCost,
      previousMonthSpend: baseSummary.previousMonthCost,
      forecastedMonthSpend: baseSummary.forecastedMonthEndCost,
      totalMonthlyBudget: baseSummary.totalMonthlyBudget,
      budgetConsumedPercent: baseSummary.totalBudgetConsumedPercent,
      costEfficiencyScore: 84, // Calculated from rightsizing and idle analysis
      taggingCoveragePercent: tagging.coveragePercent,
      finopsMaturityLevel: 'run_optimization',
      activeAnomaliesCount: baseSummary.activeAnomaliesCount,
      potentialMonthlySavings: baseSummary.totalPotentialMonthlySavings,
      unitCostPerRequest: 0.00014, // $0.00014 per checkout API request
      currency: this.currency,
      dataSource: 'demo',
      evaluatedAt: new Date().toISOString()
    };
  }

  public getDailyTrends(days: number = 30): CostRecord[] {
    return this.provider.getDailyCosts(days);
  }

  public getServiceCosts(): ServiceCostBreakdown[] {
    return this.provider.getServiceCosts();
  }

  public getResourceCosts(): ResourceCostBreakdown[] {
    return this.provider.getResourceCosts();
  }

  public getCostAllocations(): CostAllocationDimension[] {
    const serviceCosts = this.provider.getServiceCosts();
    const total = serviceCosts.reduce((acc, s) => acc + s.monthlyCost, 0);

    return [
      {
        dimension: 'environment',
        items: [
          { key: 'production', name: 'Production', cost: Number((total * 0.72).toFixed(2)), percentage: 72.0 },
          { key: 'staging', name: 'Staging', cost: Number((total * 0.18).toFixed(2)), percentage: 18.0 },
          { key: 'development', name: 'Development', cost: Number((total * 0.1).toFixed(2)), percentage: 10.0 }
        ]
      },
      {
        dimension: 'team',
        items: [
          { key: 'platform', name: 'Platform Engineering', cost: Number((total * 0.45).toFixed(2)), percentage: 45.0 },
          { key: 'checkout', name: 'Checkout & Core Saga', cost: Number((total * 0.35).toFixed(2)), percentage: 35.0 },
          { key: 'sre', name: 'Observability & SRE', cost: Number((total * 0.2).toFixed(2)), percentage: 20.0 }
        ]
      }
    ];
  }

  public getBudgets(): CostBudget[] {
    return this.budgets;
  }

  public getForecast(): CostForecast {
    const summary = this.getSummary();
    const variance = summary.forecastedMonthEndCost - summary.totalMonthlyBudget;
    const variancePercent = Number(((variance / summary.totalMonthlyBudget) * 100).toFixed(1));

    return {
      currentSpend: summary.currentMonthCost,
      projectedMonthEnd: summary.forecastedMonthEndCost,
      budgetAmount: summary.totalMonthlyBudget,
      projectedVariance: Number(variance.toFixed(2)),
      variancePercent,
      confidenceLevel: 'high',
      method: 'historical_run_rate'
    };
  }

  public getAnomalies(): CostAnomaly[] {
    return this.anomalies;
  }

  public getRecommendations(): OptimizationRecommendation[] {
    return this.recommendations;
  }

  public updateRecommendationStatus(
    id: string,
    status: OptimizationRecommendation['status']
  ): OptimizationRecommendation {
    const rec = this.recommendations.find((r) => r.id === id);
    if (!rec) {
      throw new Error(`Recommendation '${id}' not found`);
    }
    rec.status = status;
    return rec;
  }

  public getTaggingGovernance(): TaggingGovernanceScore {
    return {
      totalResources: 24,
      taggedResources: 22,
      missingTagsCount: 2,
      coveragePercent: 91.7,
      mandatoryTags: ['environment', 'team', 'service', 'owner'],
      nonCompliantResources: [
        {
          resourceId: 'vol-ebs-backup-01',
          resourceType: 'ebs_volume',
          missingTags: ['owner', 'team']
        }
      ]
    };
  }

  public getUnitEconomics(): UnitEconomicsMetric[] {
    return [
      {
        id: 'unit-cost-request',
        name: 'Cost per Ingress Request',
        unit: 'per 10k requests',
        unitCost: 1.42,
        currency: 'USD',
        totalCost: 552.8,
        totalVolume: 3892000,
        period: 'monthly',
        trendPercent: -3.5
      },
      {
        id: 'unit-cost-checkout',
        name: 'Cost per Confirmed Order Transaction',
        unit: 'per 100 orders',
        unitCost: 0.85,
        currency: 'USD',
        totalCost: 148.5,
        totalVolume: 17480,
        period: 'monthly',
        trendPercent: -1.8
      }
    ];
  }

  public getKubernetesFinOps(): KubernetesFinOpsMetrics {
    return {
      clusterName: 'cloudpulse-eks-production',
      totalRequestedCpuCores: 4.0,
      totalUsedCpuCores: 1.85,
      cpuEfficiencyPercent: 46.3,
      totalRequestedMemoryGb: 8.0,
      totalUsedMemoryGb: 4.12,
      memoryEfficiencyPercent: 51.5,
      monthlyClusterCost: 218.4,
      estimatedIdleWasteCost: 48.6,
      workloads: [
        {
          workloadName: 'api-gateway',
          namespace: 'cloudpulse',
          cost: 24.6,
          cpuEfficiency: 42.0,
          memoryEfficiency: 44.0,
          status: 'balanced'
        },
        {
          workloadName: 'order-service',
          namespace: 'cloudpulse',
          cost: 24.6,
          cpuEfficiency: 51.0,
          memoryEfficiency: 54.0,
          status: 'balanced'
        },
        {
          workloadName: 'payment-service',
          namespace: 'cloudpulse',
          cost: 24.6,
          cpuEfficiency: 22.5,
          memoryEfficiency: 38.0,
          status: 'overprovisioned'
        }
      ]
    };
  }

  public getCostPolicies(): CostPolicyRule[] {
    return this.costPolicies;
  }
}
