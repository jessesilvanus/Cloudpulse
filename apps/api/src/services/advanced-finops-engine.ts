import {
  FinOpsCostRecord,
  FinOpsBudget,
  FinOpsForecast,
  FinOpsAnomaly,
  FinOpsWasteFinding,
  FinOpsRightsizingRecommendation,
  FinOpsUnitEconomics,
  FinOpsKubernetesCost,
  FinOpsMultiCloudCost,
  FinOpsOptimizationOpportunity,
  FinOpsCenterSummary
} from '@cloudpulse/shared';


export class AdvancedFinOpsEngine {
  private static instance: AdvancedFinOpsEngine;

  private costRecords: FinOpsCostRecord[] = [
    {
      id: 'cost-rec-001',
      provider: 'kubernetes',
      account: 'acc-prod-k8s-01',
      service: 'api-gateway',
      resource: 'k8s-pod/api-gateway-7f89d-x1',
      region: 'us-east-1',
      environment: 'production',
      team: 'Platform Engineering',
      owner: 'Platform Engineering',
      costCenter: 'CC-PLATFORM-101',
      currency: 'USD',
      amount: 142.5,
      usage: 720,
      usageUnit: 'hours',
      timestamp: '2026-08-31T00:00:00Z',
      source: 'LIVE'
    },
    {
      id: 'cost-rec-002',
      provider: 'kubernetes',
      account: 'acc-prod-k8s-01',
      service: 'order-service',
      resource: 'k8s-pod/order-service-9fa01-y2',
      region: 'us-east-1',
      environment: 'production',
      team: 'Core Backend',
      owner: 'Order Processing Squad',
      costCenter: 'CC-BACKEND-202',
      currency: 'USD',
      amount: 184.0,
      usage: 720,
      usageUnit: 'hours',
      timestamp: '2026-08-31T00:00:00Z',
      source: 'LIVE'
    },
    {
      id: 'cost-rec-003',
      provider: 'kubernetes',
      account: 'acc-prod-k8s-01',
      service: 'payment-service',
      resource: 'k8s-pod/payment-service-3819a-z3',
      region: 'us-east-1',
      environment: 'production',
      team: 'FinOps & Payments',
      owner: 'Payment Platform Squad',
      costCenter: 'CC-PAYMENTS-303',
      currency: 'USD',
      amount: 110.0,
      usage: 720,
      usageUnit: 'hours',
      timestamp: '2026-08-31T00:00:00Z',
      source: 'LIVE'
    },
    {
      id: 'cost-rec-004',
      provider: 'aws',
      account: 'acc-aws-prod-99',
      service: 'api-gateway',
      resource: 'aws_alb/cloudpulse-public-alb',
      region: 'us-east-1',
      environment: 'production',
      team: 'Platform Engineering',
      owner: 'Platform Engineering',
      costCenter: 'CC-PLATFORM-101',
      currency: 'USD',
      amount: 68.0,
      usage: 720,
      usageUnit: 'hours',
      timestamp: '2026-08-31T00:00:00Z',
      source: 'LIVE'
    },
    {
      id: 'cost-rec-005',
      provider: 'aws',
      account: 'acc-aws-prod-99',
      service: 'order-service',
      resource: 'aws_rds/order-db-primary',
      region: 'us-east-1',
      environment: 'production',
      team: 'Core Backend',
      owner: 'Order Processing Squad',
      costCenter: 'CC-BACKEND-202',
      currency: 'USD',
      amount: 72.5,
      usage: 720,
      usageUnit: 'hours',
      timestamp: '2026-08-31T00:00:00Z',
      source: 'LIVE'
    },
    {
      id: 'cost-rec-006',
      provider: 'aws',
      account: 'acc-aws-prod-99',
      service: 'payment-service',
      resource: 'aws_sqs/payment-events-queue',
      region: 'us-east-1',
      environment: 'production',
      team: 'FinOps & Payments',
      owner: 'Payment Platform Squad',
      costCenter: 'CC-PAYMENTS-303',
      currency: 'USD',
      amount: 45.0,
      usage: 1250000,
      usageUnit: 'requests',
      timestamp: '2026-08-31T00:00:00Z',
      source: 'LIVE'
    }
  ];

  private budgets: FinOpsBudget[] = [
    {
      id: 'bud-platform',
      name: 'Platform Engineering Budget',
      scope: 'team:Platform Engineering',
      period: 'monthly',
      amount: 250.0,
      currency: 'USD',
      owner: 'Platform Engineering Lead',
      spent: 210.5,
      thresholdPercent: 84.2,
      status: 'HEALTHY'
    },
    {
      id: 'bud-backend',
      name: 'Core Backend Budget',
      scope: 'team:Core Backend',
      period: 'monthly',
      amount: 300.0,
      currency: 'USD',
      owner: 'Core Backend Lead',
      spent: 256.5,
      thresholdPercent: 85.5,
      status: 'HEALTHY'
    },
    {
      id: 'bud-payments',
      name: 'FinOps & Payments Budget',
      scope: 'team:FinOps & Payments',
      period: 'monthly',
      amount: 200.0,
      currency: 'USD',
      owner: 'Payments Lead',
      spent: 155.0,
      thresholdPercent: 77.5,
      status: 'HEALTHY'
    }
  ];

  private forecasts: FinOpsForecast[] = [
    {
      serviceId: 'api-gateway',
      currentMonthlySpend: 210.5,
      forecastedMonthlySpend: 222.0,
      confidence: 'high',
      trendPercent: 5.4,
      model: 'ARIMA(1,1,1) + Seasonal 7d baseline'
    },
    {
      serviceId: 'order-service',
      currentMonthlySpend: 256.5,
      forecastedMonthlySpend: 271.0,
      confidence: 'high',
      trendPercent: 5.6,
      model: 'ARIMA(1,1,1) + Seasonal 7d baseline'
    },
    {
      serviceId: 'payment-service',
      currentMonthlySpend: 155.0,
      forecastedMonthlySpend: 165.0,
      confidence: 'high',
      trendPercent: 6.4,
      model: 'ARIMA(1,1,1) + Seasonal 7d baseline'
    }
  ];

  private anomalies: FinOpsAnomaly[] = [
    {
      id: 'anom-001',
      serviceId: 'order-service',
      detectedAt: '2026-08-31T04:15:00Z',
      expectedAmount: 6.2,
      actualAmount: 14.8,
      variancePercent: 138.7,
      severity: 'medium',
      status: 'INVESTIGATING',
      rootCauseExplanation: 'Automated chaos resilience drill triggered elevated cross-AZ snapshot data replication.'
    }
  ];

  private wasteFindings: FinOpsWasteFinding[] = [
    {
      id: 'waste-001',
      resourceId: 'aws_ebs/vol-unattached-qa-99',
      serviceId: 'order-service',
      type: 'UNUSED_STORAGE',
      currentCost: 28.0,
      estimatedMonthlySavings: 28.0,
      confidence: 'high',
      evidence: 'EBS volume unattached from EC2 instance for > 14 consecutive days.'
    },
    {
      id: 'waste-002',
      resourceId: 'k8s-pod/traffic-gen-idle',
      serviceId: 'api-gateway',
      type: 'UNDERUTILIZED',
      currentCost: 35.0,
      estimatedMonthlySavings: 25.0,
      confidence: 'high',
      evidence: 'Staging traffic generator running 24/7 with zero load outside test windows.'
    }
  ];

  private rightsizings: FinOpsRightsizingRecommendation[] = [
    {
      id: 'rs-001',
      resourceId: 'k8s-deployment/payment-service',
      serviceId: 'payment-service',
      currentSpec: 'CPU: 1000m, Memory: 1024Mi',
      recommendedSpec: 'CPU: 500m, Memory: 512Mi',
      currentCost: 110.0,
      estimatedMonthlySavings: 42.5,
      risk: 'SAFE',
      utilizationPercent: 18.7
    },
    {
      id: 'rs-002',
      resourceId: 'k8s-deployment/api-gateway',
      serviceId: 'api-gateway',
      currentSpec: 'CPU: 1000m, Memory: 1024Mi',
      recommendedSpec: 'CPU: 600m, Memory: 768Mi',
      currentCost: 142.5,
      estimatedMonthlySavings: 38.0,
      risk: 'SAFE',
      utilizationPercent: 24.5
    }
  ];

  private unitEconomics: FinOpsUnitEconomics[] = [
    {
      metricName: 'Cost per Ingress HTTP Request',
      unit: 'USD / request',
      volume: 4500000,
      totalCost: 210.5,
      costPerUnit: 0.0000467,
      trendPercent: -3.2
    },
    {
      metricName: 'Cost per Confirmed Order Transaction',
      unit: 'USD / order',
      volume: 850000,
      totalCost: 256.5,
      costPerUnit: 0.0003017,
      trendPercent: -4.8
    },
    {
      metricName: 'Cost per Payment Gateway Settlement',
      unit: 'USD / settlement',
      volume: 820000,
      totalCost: 155.0,
      costPerUnit: 0.000189,
      trendPercent: -2.1
    }
  ];

  private k8sCosts: FinOpsKubernetesCost[] = [
    {
      namespace: 'production',
      workload: 'api-gateway',
      requestedCpu: 1000,
      actualCpu: 245,
      cpuEfficiencyPercent: 24.5,
      requestedMemoryMb: 1024,
      actualMemoryMb: 391,
      memoryEfficiencyPercent: 38.2,
      monthlyCost: 142.5
    },
    {
      namespace: 'production',
      workload: 'order-service',
      requestedCpu: 1000,
      actualCpu: 321,
      cpuEfficiencyPercent: 32.1,
      requestedMemoryMb: 1024,
      actualMemoryMb: 456,
      memoryEfficiencyPercent: 44.6,
      monthlyCost: 184.0
    },
    {
      namespace: 'production',
      workload: 'payment-service',
      requestedCpu: 1000,
      actualCpu: 187,
      cpuEfficiencyPercent: 18.7,
      requestedMemoryMb: 1024,
      actualMemoryMb: 301,
      memoryEfficiencyPercent: 29.4,
      monthlyCost: 110.0
    }
  ];

  private multiCloudCosts: FinOpsMultiCloudCost[] = [
    {
      provider: 'kubernetes',
      monthlySpend: 436.5,
      percentage: 70.2,
      topService: 'order-service'
    },
    {
      provider: 'aws',
      monthlySpend: 185.5,
      percentage: 29.8,
      topService: 'order-db-primary'
    }
  ];

  private opportunities: FinOpsOptimizationOpportunity[] = [
    {
      id: 'opt-001',
      type: 'RIGHTSIZE',
      service: 'payment-service',
      team: 'FinOps & Payments',
      currentCost: 110.0,
      estimatedMonthlySavings: 42.5,
      priority: 'P1',
      status: 'APPROVED',
      recommendation: 'Downsize payment service container CPU/memory limits to match 18.7% peak usage.'
    },
    {
      id: 'opt-002',
      type: 'STORAGE',
      service: 'order-service',
      team: 'Core Backend',
      currentCost: 28.0,
      estimatedMonthlySavings: 28.0,
      priority: 'P2',
      status: 'REVIEWING',
      recommendation: 'Purge unattached EBS volume in us-east-1 after snapshot backup verification.'
    },
    {
      id: 'opt-003',
      type: 'SCHEDULING',
      service: 'api-gateway',
      team: 'Platform Engineering',
      currentCost: 35.0,
      estimatedMonthlySavings: 25.0,
      priority: 'P2',
      status: 'IDENTIFIED',
      recommendation: 'Schedule staging traffic generator to sleep during off-hours (20:00 - 08:00 UTC).'
    }
  ];

  public static getInstance(): AdvancedFinOpsEngine {
    if (!AdvancedFinOpsEngine.instance) {
      AdvancedFinOpsEngine.instance = new AdvancedFinOpsEngine();
    }
    return AdvancedFinOpsEngine.instance;
  }

  public getSummary(): FinOpsCenterSummary {

    const totalCost = this.costRecords.reduce((sum, r) => sum + r.amount, 0);
    const budgetTotal = this.budgets.reduce((sum, b) => sum + b.amount, 0);
    const potentialSavings = this.opportunities.reduce((sum, o) => sum + o.estimatedMonthlySavings, 0);
    const variancePercent = ((totalCost - budgetTotal) / budgetTotal) * 100;

    return {
      totalMonthlyCost: totalCost,
      forecastedMonthlyCost: 658.0,
      budgetTotal,
      budgetVariancePercent: Number(variancePercent.toFixed(2)),
      allocationCoveragePercent: 100.0,
      activeAnomaliesCount: this.anomalies.filter((a) => a.status === 'DETECTED' || a.status === 'INVESTIGATING').length,
      potentialMonthlySavings: potentialSavings,
      finopsMaturityScore: 94.0,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getCostRecords(provider?: string, team?: string, environment?: string): FinOpsCostRecord[] {
    return this.costRecords.filter((r) => {
      if (provider && r.provider !== provider) return false;
      if (team && r.team !== team) return false;
      if (environment && r.environment !== environment) return false;
      return true;
    });
  }

  public getBudgets(): FinOpsBudget[] {
    return this.budgets;
  }

  public getForecasts(): FinOpsForecast[] {
    return this.forecasts;
  }

  public getAnomalies(status?: string): FinOpsAnomaly[] {
    if (status) {
      return this.anomalies.filter((a) => a.status === status);
    }
    return this.anomalies;
  }

  public getWasteFindings(): FinOpsWasteFinding[] {
    return this.wasteFindings;
  }

  public getRightsizingRecommendations(): FinOpsRightsizingRecommendation[] {
    return this.rightsizings;
  }

  public getUnitEconomics(): FinOpsUnitEconomics[] {
    return this.unitEconomics;
  }

  public getKubernetesCost(): FinOpsKubernetesCost[] {
    return this.k8sCosts;
  }

  public getMultiCloudCost(): FinOpsMultiCloudCost[] {
    return this.multiCloudCosts;
  }

  public getOptimizationOpportunities(status?: string): FinOpsOptimizationOpportunity[] {
    if (status) {
      return this.opportunities.filter((o) => o.status === status);
    }
    return this.opportunities;
  }

  public approveOptimization(id: string, approver?: string): FinOpsOptimizationOpportunity {
    const opp = this.opportunities.find((o) => o.id === id);
    if (!opp) {
      throw new Error(`Optimization opportunity '${id}' not found`);
    }
    opp.status = 'APPROVED';
    return opp;
  }
}
