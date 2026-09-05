import {
  AdvancedFinOpsSummary,
  GreenOpsMetric,
  AdvancedUnitEconomicsMetric,
  SavingsOpportunityRecord,
  RealizedSavingsRecord,
  GreenOpsScenarioSimulation
} from '@cloudpulse/shared';

export class AdvancedFinOpsGreenOpsEngine {
  private static instance: AdvancedFinOpsGreenOpsEngine;

  private greenOpsMetrics: GreenOpsMetric[] = [
    {
      region: 'us-east-1 (N. Virginia)',
      provider: 'aws',
      energyKwhMonthly: 1250,
      carbonIntensityGramsPerKwh: 380,
      estimatedCo2eKgMonthly: 475.0,
      resourceEfficiencyPercent: 81.5,
      pueRatio: 1.18,
      cleanEnergyPercent: 55,
      provenance: 'ESTIMATED'
    },
    {
      region: 'eu-west-1 (Ireland)',
      provider: 'aws',
      energyKwhMonthly: 980,
      carbonIntensityGramsPerKwh: 190,
      estimatedCo2eKgMonthly: 186.2,
      resourceEfficiencyPercent: 88.0,
      pueRatio: 1.14,
      cleanEnergyPercent: 82,
      provenance: 'ESTIMATED'
    },
    {
      region: 'us-central1 (Iowa)',
      provider: 'gcp',
      energyKwhMonthly: 820,
      carbonIntensityGramsPerKwh: 210,
      estimatedCo2eKgMonthly: 172.2,
      resourceEfficiencyPercent: 85.0,
      pueRatio: 1.1,
      cleanEnergyPercent: 90,
      provenance: 'ESTIMATED'
    }
  ];

  private unitEconomics: AdvancedUnitEconomicsMetric[] = [
    {
      metricName: 'Cost per 10k Ingress API Requests',
      unitCost: 0.042,
      businessVolume: 24500000,
      cloudCostTotal: 102.9,
      unitLabel: '10k requests',
      period: 'Monthly',
      efficiencyStatus: 'OPTIMAL'
    },
    {
      metricName: 'Cost per Completed Checkout Transaction',
      unitCost: 0.018,
      businessVolume: 120400,
      cloudCostTotal: 216.72,
      unitLabel: 'checkout',
      period: 'Monthly',
      efficiencyStatus: 'OPTIMAL'
    },
    {
      metricName: 'Cost per EKS Pod Running Hour',
      unitCost: 0.035,
      businessVolume: 18200,
      cloudCostTotal: 637.0,
      unitLabel: 'pod-hour',
      period: 'Monthly',
      efficiencyStatus: 'OPTIMAL'
    }
  ];

  private savingsOpportunities: SavingsOpportunityRecord[] = [
    {
      opportunityId: 'opp-rds-storage-tiering',
      title: 'Aurora RDS Automated Storage Archiving',
      resourceId: 'arn:aws:rds:us-east-1:123456789012:db:order-db-primary',
      resourceType: 'aws_rds_cluster',
      category: 'STORAGE_TIERING',
      estimatedMonthlySavings: 65.0,
      confidencePercent: 92.0,
      risk: 'LOW',
      implementationEffort: 'LOW',
      recommendation: 'Enable Aurora I/O-Optimized automated storage tiering for historical order tables > 90 days.',
      status: 'APPROVED'
    },
    {
      opportunityId: 'opp-k8s-pod-rightsizer',
      title: 'Kubernetes Workload Request Rightsizing (order-service)',
      resourceId: 'k8s:deployment:production/order-service',
      resourceType: 'kubernetes_deployment',
      category: 'RIGHTSIZING',
      estimatedMonthlySavings: 45.0,
      confidencePercent: 88.0,
      risk: 'LOW',
      implementationEffort: 'LOW',
      recommendation: 'Reduce requested container memory from 4096Mi to 2560Mi based on P95 telemetry baseline.',
      status: 'IDENTIFIED'
    },
    {
      opportunityId: 'opp-nat-gateway-consolidation',
      title: 'Staging Environment NAT Gateway Consolidation',
      resourceId: 'arn:aws:ec2:us-east-1:123456789012:natgateway/nat-staging-02',
      resourceType: 'aws_nat_gateway',
      category: 'IDLE_RESOURCE',
      estimatedMonthlySavings: 75.0,
      confidencePercent: 95.0,
      risk: 'LOW',
      implementationEffort: 'LOW',
      recommendation: 'Consolidate dual-AZ NAT gateways to single AZ for non-production staging environments.',
      status: 'APPROVED'
    }
  ];

  private realizedSavings: RealizedSavingsRecord[] = [
    {
      savingId: 'sav-pg-index-tune',
      opportunityId: 'opp-pg-index-tune',
      resourceName: 'order-db-primary (PostgreSQL CPU Optimization)',
      baselineMonthlyCost: 320.0,
      postChangeMonthlyCost: 240.0,
      verifiedSavingsMonthly: 80.0,
      verifiedAt: '2026-08-28T12:00:00Z',
      verificationStatus: 'VERIFIED'
    },
    {
      savingId: 'sav-orphan-ebs-purge',
      opportunityId: 'opp-orphan-ebs-purge',
      resourceName: 'Unattached EBS Volume Cleanup (4 volumes)',
      baselineMonthlyCost: 180.0,
      postChangeMonthlyCost: 75.0,
      verifiedSavingsMonthly: 105.0,
      verifiedAt: '2026-08-30T10:00:00Z',
      verificationStatus: 'VERIFIED'
    }
  ];

  public static getInstance(): AdvancedFinOpsGreenOpsEngine {
    if (!AdvancedFinOpsGreenOpsEngine.instance) {
      AdvancedFinOpsGreenOpsEngine.instance = new AdvancedFinOpsGreenOpsEngine();
    }
    return AdvancedFinOpsGreenOpsEngine.instance;
  }

  public getSummary(): AdvancedFinOpsSummary {
    const verifiedSavings = this.realizedSavings.reduce((acc, s) => acc + s.verifiedSavingsMonthly, 0);
    return {
      totalMonthlySpend: 1440.0,
      forecastedMonthEndSpend: 1440.0,
      budgetCeiling: 1800.0,
      budgetUtilizationPercent: 80.0,
      budgetBreachPredicted: false,
      allocationCoveragePercent: 94.2,
      resourceEfficiencyScore: 82.4,
      estimatedMonthlyCo2eKg: 420.5,
      verifiedRealizedSavingsMonthly: verifiedSavings,
      activeSavingsOpportunitiesCount: this.savingsOpportunities.filter((o) => o.status !== 'VERIFIED').length,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getGreenOpsMetrics(): GreenOpsMetric[] {
    return this.greenOpsMetrics;
  }

  public getUnitEconomics(): AdvancedUnitEconomicsMetric[] {
    return this.unitEconomics;
  }

  public getSavingsOpportunities(): SavingsOpportunityRecord[] {
    return this.savingsOpportunities;
  }

  public getRealizedSavings(): RealizedSavingsRecord[] {
    return this.realizedSavings;
  }

  public reconcileRealizedSavings(opportunityId: string): RealizedSavingsRecord {
    const opp = this.savingsOpportunities.find((o) => o.opportunityId === opportunityId);
    if (!opp) {
      throw new Error(`Savings opportunity '${opportunityId}' not found.`);
    }

    opp.status = 'VERIFIED';
    const realized: RealizedSavingsRecord = {
      savingId: `sav-${Date.now()}`,
      opportunityId,
      resourceName: `${opp.title} (${opp.resourceType})`,
      baselineMonthlyCost: 200.0,
      postChangeMonthlyCost: 200.0 - opp.estimatedMonthlySavings,
      verifiedSavingsMonthly: opp.estimatedMonthlySavings,
      verifiedAt: new Date().toISOString(),
      verificationStatus: 'VERIFIED'
    };

    this.realizedSavings.push(realized);
    return realized;
  }

  public simulateGreenOpsScenario(payload: {
    trafficMultiplier?: number;
    targetRegion?: string;
    rightsizingAggressiveness?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  }): GreenOpsScenarioSimulation {
    const mult = payload.trafficMultiplier || 1.0;
    const targetRegion = payload.targetRegion || 'eu-west-1';

    let spendDelta = (mult - 1.0) * 450.0;
    let co2eDeltaPercent = (mult - 1.0) * 35.0;
    let latencyDelta = 0;

    if (targetRegion === 'eu-west-1') {
      co2eDeltaPercent -= 42.0; // Clean Irish hydro/wind grid
      spendDelta += 20.0; // Slight AWS EU pricing delta
      latencyDelta = 18; // Transatlantic RTT
    }

    return {
      scenarioId: `sim-${Date.now()}`,
      name: `Multi-Cloud GreenOps Scenario: ${targetRegion} @ ${mult}x load`,
      trafficMultiplier: mult,
      targetRegion,
      estimatedSpendDelta: Math.round(spendDelta * 100) / 100,
      estimatedCo2eDeltaPercent: Math.round(co2eDeltaPercent * 10) / 10,
      estimatedLatencyDeltaMs: latencyDelta,
      tradeoffSummary: `Migrating to ${targetRegion} reduces estimated carbon emissions by 42.0% with +$20.00/mo spend delta and +18ms network latency impact.`,
      provenance: 'SIMULATED'
    };
  }

  public queryFinOpsGreenOpsAssistant(prompt: string) {
    return {
      query: prompt,
      status: 'OBSERVED',
      summary: 'Evaluated cloud financial unit economics, cost allocation, and regional sustainability intensity.',
      evidence: [
        'Total monthly spend: $1,440.00 against $1,800.00 budget ceiling (80.0% utilization, no breach predicted)',
        '3 active savings opportunities totaling $185.00/mo in potential optimizations',
        'Verified realized savings to date: $185.00/mo across PostgreSQL index tuning and unattached EBS cleanup',
        'Regional carbon footprint: 420.5 kg CO2e/month with eu-west-1 offering 50% lower carbon intensity than us-east-1'
      ],
      recommendation: 'Execute Aurora storage tiering and order-service pod memory rightsizing to save an additional $110.00/mo.',
      timestamp: new Date().toISOString()
    };
  }
}
