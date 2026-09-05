import {
  ServiceCatalogItem,
  SliDefinition,
  ReliabilitySloDefinition,
  ErrorBudgetStatus,
  CapacityProfile,
  ReliabilityGateDecision,
  ReliabilityFinding,
  ReliabilityRunbook,
  ReliabilityCommandCenterSummary
} from '@cloudpulse/shared';


export class ReliabilityEngine {
  private static instance: ReliabilityEngine;

  private services: ServiceCatalogItem[] = [
    {
      id: 'api-gateway',
      name: 'api-gateway',
      description: 'Ingress edge routing, authentication token validation, and rate limiting proxy.',
      owner: 'infra-lead@cloudpulse.internal',
      team: 'Platform Engineering',
      environment: 'production',
      criticality: 'critical',
      tier: 'TIER_0',
      dependencies: ['order-service', 'payment-service'],
      repository: 'services/api-gateway',
      deployment: 'deploy/kubernetes/api-gateway.yaml',
      status: 'HEALTHY',
      reliabilityScore: 98.2
    },
    {
      id: 'order-service',
      name: 'order-service',
      description: 'Order processing, state machine orchestration, and distributed Saga coordinator.',
      owner: 'sre-lead@cloudpulse.internal',
      team: 'Order Processing',
      environment: 'production',
      criticality: 'critical',
      tier: 'TIER_0',
      dependencies: ['payment-service'],
      repository: 'services/order-service',
      deployment: 'deploy/kubernetes/order-service.yaml',
      status: 'HEALTHY',
      reliabilityScore: 97.4
    },
    {
      id: 'payment-service',
      name: 'payment-service',
      description: 'Secure payment gateway settlement sandbox with chaos fault injection capabilities.',
      owner: 'sec-lead@cloudpulse.internal',
      team: 'Financial Services',
      environment: 'production',
      criticality: 'high',
      tier: 'TIER_1',
      dependencies: [],
      repository: 'services/payment-service',
      deployment: 'deploy/kubernetes/payment-service.yaml',
      status: 'HEALTHY',
      reliabilityScore: 96.8
    }
  ];

  private slis: SliDefinition[] = [
    {
      id: 'sli-gw-avail',
      serviceId: 'api-gateway',
      name: 'Ingress Successful Requests Availability Ratio',
      type: 'availability',
      formula: 'sum(rate(http_requests_total{status!~"5.."}[30d])) / sum(rate(http_requests_total[30d])) * 100',
      unit: '%',
      source: 'prometheus:http_requests_total',
      window: '30d',
      currentValue: 99.98,
      status: 'HEALTHY'
    },
    {
      id: 'sli-gw-lat',
      serviceId: 'api-gateway',
      name: 'P95 Ingress Gateway Latency',
      type: 'latency',
      formula: 'histogram_quantile(0.95, sum(rate(http_request_duration_ms_bucket[5m])) by (le))',
      unit: 'ms',
      source: 'prometheus:http_request_duration_ms_bucket',
      window: '30d',
      currentValue: 42.5,
      status: 'HEALTHY'
    },
    {
      id: 'sli-ord-avail',
      serviceId: 'order-service',
      name: 'Order Processing Success Ratio',
      type: 'success_rate',
      formula: 'sum(rate(order_processed_total{status="success"}[30d])) / sum(rate(order_processed_total[30d])) * 100',
      unit: '%',
      source: 'prometheus:order_processed_total',
      window: '30d',
      currentValue: 99.95,
      status: 'HEALTHY'
    },
    {
      id: 'sli-pay-avail',
      serviceId: 'payment-service',
      name: 'Payment Settlement Availability',
      type: 'availability',
      formula: 'sum(rate(payment_tx_total{status!="500"}[30d])) / sum(rate(payment_tx_total[30d])) * 100',
      unit: '%',
      source: 'prometheus:payment_tx_total',
      window: '30d',
      currentValue: 99.92,
      status: 'HEALTHY'
    }
  ];

  private slos: ReliabilitySloDefinition[] = [

    {
      id: 'slo-gw-avail',
      serviceId: 'api-gateway',
      sliId: 'sli-gw-avail',
      name: '99.9% Monthly Ingress Availability',
      target: 99.9,
      window: '30d',
      warningThreshold: 99.92,
      criticalThreshold: 99.9,
      currentAttainment: 99.98,
      status: 'HEALTHY'
    },
    {
      id: 'slo-gw-lat',
      serviceId: 'api-gateway',
      sliId: 'sli-gw-lat',
      name: 'P95 Ingress Latency < 150ms',
      target: 150.0,
      window: '30d',
      warningThreshold: 120.0,
      criticalThreshold: 150.0,
      currentAttainment: 42.5,
      status: 'HEALTHY'
    },
    {
      id: 'slo-ord-avail',
      serviceId: 'order-service',
      sliId: 'sli-ord-avail',
      name: '99.9% Order Processing Success Rate',
      target: 99.9,
      window: '30d',
      warningThreshold: 99.92,
      criticalThreshold: 99.9,
      currentAttainment: 99.95,
      status: 'HEALTHY'
    },
    {
      id: 'slo-pay-avail',
      serviceId: 'payment-service',
      sliId: 'sli-pay-avail',
      name: '99.9% Payment Gateway Settlement',
      target: 99.9,
      window: '30d',
      warningThreshold: 99.91,
      criticalThreshold: 99.9,
      currentAttainment: 99.92,
      status: 'HEALTHY'
    }
  ];

  private errorBudgets: ErrorBudgetStatus[] = [
    {
      serviceId: 'api-gateway',
      sloId: 'slo-gw-avail',
      totalBudgetPercentage: 0.1, // 100% - 99.9% = 0.1% allowed unreliability
      remainingPercentage: 80.0, // 80% error budget remaining
      state: 'HEALTHY',
      currentBurnRate: 0.2, // 1.0 is normal baseline consumption
      shortWindowBurnRate: 0.15,
      longWindowBurnRate: 0.22,
      burnAlertLevel: 'NONE',
      exhaustionForecastHours: 720
    },
    {
      serviceId: 'order-service',
      sloId: 'slo-ord-avail',
      totalBudgetPercentage: 0.1,
      remainingPercentage: 50.0,
      state: 'HEALTHY',
      currentBurnRate: 0.5,
      shortWindowBurnRate: 0.45,
      longWindowBurnRate: 0.52,
      burnAlertLevel: 'NONE',
      exhaustionForecastHours: 360
    },
    {
      serviceId: 'payment-service',
      sloId: 'slo-pay-avail',
      totalBudgetPercentage: 0.1,
      remainingPercentage: 20.0,
      state: 'LOW',
      currentBurnRate: 0.8,
      shortWindowBurnRate: 0.85,
      longWindowBurnRate: 0.78,
      burnAlertLevel: 'SLOW_BURN',
      exhaustionForecastHours: 120
    }
  ];

  private capacityProfiles: CapacityProfile[] = [
    {
      serviceId: 'api-gateway',
      cpuUtilizationPercent: 24.5,
      memoryUtilizationPercent: 38.2,
      storageUtilizationPercent: 12.0,
      networkThroughputMbps: 18.4,
      activeConnections: 120,
      queueDepth: 0,
      cpuHeadroomPercent: 75.5,
      memoryHeadroomPercent: 61.8,
      riskState: 'HEALTHY',
      forecastCpu7dPercent: 28.0,
      forecastConfidence: 'high'
    },
    {
      serviceId: 'order-service',
      cpuUtilizationPercent: 32.1,
      memoryUtilizationPercent: 44.6,
      storageUtilizationPercent: 18.5,
      networkThroughputMbps: 12.8,
      activeConnections: 64,
      queueDepth: 2,
      cpuHeadroomPercent: 67.9,
      memoryHeadroomPercent: 55.4,
      riskState: 'HEALTHY',
      forecastCpu7dPercent: 36.5,
      forecastConfidence: 'high'
    },
    {
      serviceId: 'payment-service',
      cpuUtilizationPercent: 18.7,
      memoryUtilizationPercent: 29.4,
      storageUtilizationPercent: 8.0,
      networkThroughputMbps: 8.2,
      activeConnections: 32,
      queueDepth: 0,
      cpuHeadroomPercent: 81.3,
      memoryHeadroomPercent: 70.6,
      riskState: 'HEALTHY',
      forecastCpu7dPercent: 21.0,
      forecastConfidence: 'high'
    }
  ];

  private findings: ReliabilityFinding[] = [
    {
      id: 'rel-find-001',
      serviceId: 'payment-service',
      type: 'HIGH_BURN_RATE',
      severity: 'medium',
      description: 'Payment service error budget remaining dropped to 20% following staging chaos simulation tests.',
      status: 'ACKNOWLEDGED',
      recommendation: 'Pause non-critical feature deployments to payment-service until error budget recovers above 40%.',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  private runbooks: ReliabilityRunbook[] = [
    {
      id: 'rb-lat-001',
      name: 'High Ingress Latency Mitigation & Pod Scaling',
      serviceId: 'api-gateway',
      type: 'LATENCY',
      trigger: 'P95 latency > 120ms for 3 consecutive 1m evaluation windows',
      owner: 'infra-lead@cloudpulse.internal',
      version: '1.2.0',
      status: 'ACTIVE',
      steps: [
        {
          order: 1,
          action: 'Query upstream microservice response times via OTel span waterfall',
          automated: true,
          risk: 'SAFE'
        },
        {
          order: 2,
          action: 'Inspect Kubernetes horizontal pod autoscaler (HPA) replica counts',
          automated: true,
          risk: 'SAFE'
        },
        {
          order: 3,
          action: 'Trigger horizontal pod scaling (+2 replicas) if CPU saturation > 70%',
          automated: false,
          risk: 'LOW_RISK'
        }
      ]
    },
    {
      id: 'rb-err-002',
      name: 'Order Service Connection Pool Exhaustion Recovery',
      serviceId: 'order-service',
      type: 'ERRORS',
      trigger: 'HTTP 500 error rate > 0.5% over 5m window',
      owner: 'sre-lead@cloudpulse.internal',
      version: '1.1.0',
      status: 'ACTIVE',
      steps: [
        {
          order: 1,
          action: 'Capture active PostgreSQL / Redis connection pool metrics',
          automated: true,
          risk: 'SAFE'
        },
        {
          order: 2,
          action: 'Execute graceful pod rolling restart under SRE supervision',
          automated: false,
          risk: 'HIGH_RISK'
        }
      ]
    }
  ];

  public static getInstance(): ReliabilityEngine {
    if (!ReliabilityEngine.instance) {
      ReliabilityEngine.instance = new ReliabilityEngine();
    }
    return ReliabilityEngine.instance;
  }

  public getSummary(): ReliabilityCommandCenterSummary {
    const totalServices = this.services.length;
    const tier0 = this.services.filter((s) => s.tier === 'TIER_0').length;
    const healthy = this.services.filter((s) => s.status === 'HEALTHY').length;
    const degraded = this.services.filter((s) => s.status === 'DEGRADED').length;
    const critical = this.services.filter((s) => s.status === 'CRITICAL').length;
    const activeSlos = this.slos.length;
    const breached = this.slos.filter((s) => s.status === 'BREACHED').length;
    const exhausted = this.errorBudgets.filter((b) => b.state === 'EXHAUSTED').length;
    const burnAlerts = this.errorBudgets.filter((b) => b.burnAlertLevel !== 'NONE').length;

    const avgScore = Math.round(
      this.services.reduce((acc, s) => acc + s.reliabilityScore, 0) / Math.max(1, totalServices)
    );

    return {
      overallReliabilityScore: avgScore,
      servicesCount: totalServices,
      tier0ServicesCount: tier0,
      healthyServicesCount: healthy,
      degradedServicesCount: degraded,
      criticalServicesCount: critical,
      activeSlosCount: activeSlos,
      breachedSlosCount: breached,
      exhaustedBudgetsCount: exhausted,
      activeBurnAlertsCount: burnAlerts,
      openReliabilityFindingsCount: this.findings.filter((f) => f.status === 'OPEN' || f.status === 'ACKNOWLEDGED').length,
      alertFatigueScore: 8.2, // 8.2 / 100 (Very Low Noise)
      evaluatedAt: new Date().toISOString()
    };
  }

  public getServices(tier?: string, status?: string): ServiceCatalogItem[] {
    return this.services.filter((s) => {
      if (tier && s.tier !== tier) return false;
      if (status && s.status !== status) return false;
      return true;
    });
  }

  public getServiceById(id: string): ServiceCatalogItem | undefined {
    return this.services.find((s) => s.id === id);
  }

  public getSlis(serviceId?: string): SliDefinition[] {
    if (serviceId) {
      return this.slis.filter((s) => s.serviceId === serviceId);
    }
    return this.slis;
  }

  public getSlos(serviceId?: string): ReliabilitySloDefinition[] {

    if (serviceId) {
      return this.slos.filter((s) => s.serviceId === serviceId);
    }
    return this.slos;
  }

  public getErrorBudgets(serviceId?: string): ErrorBudgetStatus[] {
    if (serviceId) {
      return this.errorBudgets.filter((b) => b.serviceId === serviceId);
    }
    return this.errorBudgets;
  }

  public getCapacityProfiles(serviceId?: string): CapacityProfile[] {
    if (serviceId) {
      return this.capacityProfiles.filter((c) => c.serviceId === serviceId);
    }
    return this.capacityProfiles;
  }

  public evaluateReliabilityGate(serviceId: string): ReliabilityGateDecision {
    const budget = this.errorBudgets.find((b) => b.serviceId === serviceId);
    const service = this.services.find((s) => s.id === serviceId);

    if (!budget || !service) {
      return {
        decision: 'WARN',
        serviceId,
        reason: `Service '${serviceId}' or associated error budget not found. Defaulting to WARN.`,
        errorBudgetRemainingPercent: 0,
        burnRate: 0,
        evaluatedAt: new Date().toISOString()
      };
    }

    if (budget.remainingPercentage < 5.0) {
      return {
        decision: 'BLOCK',
        serviceId,
        reason: `Deployment blocked: Error budget exhausted (${budget.remainingPercentage}% remaining < 5% threshold).`,
        errorBudgetRemainingPercent: budget.remainingPercentage,
        burnRate: budget.currentBurnRate,
        evaluatedAt: new Date().toISOString()
      };
    }

    if (budget.remainingPercentage <= 20.0 || budget.burnAlertLevel !== 'NONE') {
      return {
        decision: 'WARN',
        serviceId,
        reason: `Deployment warning: Error budget low (${budget.remainingPercentage}% remaining) or elevated burn rate (${budget.burnAlertLevel}).`,
        errorBudgetRemainingPercent: budget.remainingPercentage,
        burnRate: budget.currentBurnRate,
        evaluatedAt: new Date().toISOString()
      };
    }


    return {
      decision: 'PASS',
      serviceId,
      reason: `Reliability gate passed: Healthy error budget (${budget.remainingPercentage}% remaining) with stable burn rate.`,
      errorBudgetRemainingPercent: budget.remainingPercentage,
      burnRate: budget.currentBurnRate,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getReliabilityFindings(serviceId?: string): ReliabilityFinding[] {
    if (serviceId) {
      return this.findings.filter((f) => f.serviceId === serviceId);
    }
    return this.findings;
  }

  public getReliabilityRunbooks(serviceId?: string): ReliabilityRunbook[] {
    if (serviceId) {
      return this.runbooks.filter((r) => r.serviceId === serviceId);
    }
    return this.runbooks;
  }

  public executeReliabilityRunbook(
    id: string,
    mode: 'DRY_RUN' | 'SIMULATION' | 'LIVE' = 'DRY_RUN'
  ): { runbookId: string; mode: string; status: string; executedStepsCount: number; executedAt: string } {
    const runbook = this.runbooks.find((r) => r.id === id);
    if (!runbook) {
      throw new Error(`Runbook '${id}' not found`);
    }

    return {
      runbookId: id,
      mode,
      status: 'COMPLETED',
      executedStepsCount: runbook.steps.length,
      executedAt: new Date().toISOString()
    };
  }
}
