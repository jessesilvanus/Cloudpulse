import {
  IntelligenceSummary,
  PredictiveAnomaly,
  CapacityForecast,
  SloRiskPrediction,
  RootCauseAnalysis,
  DeploymentRiskAssessment,
  AiSreRecommendation
} from '@cloudpulse/shared';

export class IntelligenceEngine {
  private static instance: IntelligenceEngine;

  private anomalies: PredictiveAnomaly[] = [
    {
      id: 'anom-ai-001',
      metric: 'payment_pool_utilization_percent',
      serviceId: 'payment-service',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      observedValue: 92.4,
      expectedRange: [30.0, 75.0],
      deviationPercent: 23.2,
      severity: 'critical',
      confidence: 'high',
      method: 'statistical',
      explanation: 'Database connection pool utilization exceeded the 30-day statistical baseline (μ=52.4%, σ=8.1%) by >4.9σ during burst traffic.'
    },
    {
      id: 'anom-ai-002',
      metric: 'http_req_duration_p99_ms',
      serviceId: 'order-service',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      observedValue: 485.0,
      expectedRange: [80.0, 250.0],
      deviationPercent: 94.0,
      severity: 'high',
      confidence: 'high',
      method: 'statistical',
      explanation: 'P99 request latency increased by 94% following downstream payment-service transaction queuing.'
    }
  ];

  private capacityForecasts: CapacityForecast[] = [
    {
      metric: 'cpu_percent',
      serviceId: 'api-gateway',
      horizon: '24h',
      currentUsage: 54.2,
      predictedUsage: 78.6,
      capacityLimit: 80.0,
      riskLevel: 'moderate',
      confidence: 'high',
      method: 'statistical',
      trainingWindow: '7d rolling history',
      forecastPoints: [
        { timestamp: new Date(Date.now() + 3600000).toISOString(), value: 56.4, lowerBand: 51.0, upperBand: 61.8 },
        { timestamp: new Date(Date.now() + 14400000).toISOString(), value: 64.2, lowerBand: 58.0, upperBand: 70.4 },
        { timestamp: new Date(Date.now() + 43200000).toISOString(), value: 72.8, lowerBand: 65.5, upperBand: 80.1 },
        { timestamp: new Date(Date.now() + 86400000).toISOString(), value: 78.6, lowerBand: 70.2, upperBand: 87.0 }
      ]
    },
    {
      metric: 'memory_mb',
      serviceId: 'payment-service',
      horizon: '24h',
      currentUsage: 198.0,
      predictedUsage: 242.0,
      capacityLimit: 256.0,
      riskLevel: 'high',
      confidence: 'high',
      method: 'statistical',
      trainingWindow: '7d rolling history',
      forecastPoints: [
        { timestamp: new Date(Date.now() + 3600000).toISOString(), value: 204.0, lowerBand: 190.0, upperBand: 218.0 },
        { timestamp: new Date(Date.now() + 14400000).toISOString(), value: 218.0, lowerBand: 202.0, upperBand: 234.0 },
        { timestamp: new Date(Date.now() + 43200000).toISOString(), value: 232.0, lowerBand: 214.0, upperBand: 250.0 },
        { timestamp: new Date(Date.now() + 86400000).toISOString(), value: 242.0, lowerBand: 222.0, upperBand: 262.0 }
      ]
    }
  ];

  private sloRisks: SloRiskPrediction[] = [
    {
      sloId: 'slo-payment-avail',
      sloName: 'Payment Verification Availability (99.9%)',
      serviceId: 'payment-service',
      currentBurnRate: 6.2,
      remainingErrorBudgetPercent: 28.4,
      projectedExhaustionHours: 18.2,
      riskLevel: 'high',
      confidence: 'high',
      method: 'statistical',
      rationale: 'Current 6.2x error budget burn rate will exhaust the remaining 28.4% budget in ~18.2 hours if unmitigated.'
    },
    {
      sloId: 'slo-gateway-avail',
      sloName: 'Ingress Gateway Availability (99.95%)',
      serviceId: 'api-gateway',
      currentBurnRate: 1.1,
      remainingErrorBudgetPercent: 84.6,
      projectedExhaustionHours: null,
      riskLevel: 'low',
      confidence: 'high',
      method: 'statistical',
      rationale: 'Burn rate is nominal (1.1x); error budget consumption is well within 30-day budget envelope.'
    }
  ];

  private recommendations: AiSreRecommendation[] = [
    {
      id: 'ai-rec-scale-payment',
      category: 'scaling',
      priority: 'high',
      title: 'Proactively scale payment-service replicas from 2 to 3',
      reason: 'Predicted memory consumption will approach 94.5% of container limit (242Mi / 256Mi) within 24 hours.',
      evidence: [
        'Forecasted memory trend: +44Mi over next 24 hours',
        'Current container limit: 256Mi',
        'Database connection handle utilization at 92.4%'
      ],
      confidence: 'high',
      method: 'statistical',
      actionRequired: 'Apply HPA scaling or execute kubectl scale deployment/payment-service --replicas=3',
      requiresHumanApproval: true,
      status: 'review_required'
    },
    {
      id: 'ai-rec-db-pool',
      category: 'latency',
      priority: 'critical',
      title: 'Increase payment-service connection pool size in Helm values',
      reason: 'Root cause analysis confirms DB pool exhaustion is the primary driver of P99 latency degradation.',
      evidence: [
        'Span payment.db_acquire duration accounts for 74% of total transaction latency',
        'Loki error log signature: DB_POOL_EXHAUSTED',
        'Correlated with recent commit c6fca64ddd26'
      ],
      confidence: 'high',
      method: 'statistical',
      actionRequired: 'Update database pool capacity setting in values-prod.yaml and trigger rollout.',
      requiresHumanApproval: true,
      status: 'review_required'
    }
  ];

  public static getInstance(): IntelligenceEngine {
    if (!IntelligenceEngine.instance) {
      IntelligenceEngine.instance = new IntelligenceEngine();
    }
    return IntelligenceEngine.instance;
  }

  public getSummary(): IntelligenceSummary {
    return {
      activeAnomaliesCount: this.anomalies.length,
      capacityRiskCount: this.capacityForecasts.filter((c) => c.riskLevel === 'high' || c.riskLevel === 'critical').length,
      sloRiskCount: this.sloRisks.filter((s) => s.riskLevel === 'high' || s.riskLevel === 'critical').length,
      pendingRecommendationsCount: this.recommendations.filter((r) => r.status === 'review_required').length,
      averageConfidence: 'high',
      primaryMethod: 'statistical',
      evaluatedAt: new Date().toISOString()
    };
  }

  public getAnomalies(): PredictiveAnomaly[] {
    return this.anomalies;
  }

  public getCapacityForecasts(): CapacityForecast[] {
    return this.capacityForecasts;
  }

  public getSloRisks(): SloRiskPrediction[] {
    return this.sloRisks;
  }

  public getRootCauseAnalysis(incidentId: string): RootCauseAnalysis {
    return {
      incidentId,
      likelyCause: 'Database connection pool starvation in payment-service during concurrent Saga transactions.',
      confidence: 'high',
      method: 'statistical',
      evidence: [
        'Tempo distributed trace waterfall identifies span payment.db_acquire taking 420ms (88% of total trace)',
        'Loki structured log cluster contains 42 occurrences of DB_POOL_EXHAUSTED within 3-minute window',
        'Prometheus metric db_pool_utilization spiked from 45% to 96%',
        'Change correlation: Occurred 14 minutes following deployment dep-001 (v0.0.3)'
      ],
      alternativeHypotheses: [
        'External payment gateway sandbox network timeout (Confidence: Low - gateway HTTP ping was 12ms)',
        'Node CPU throttling (Confidence: Low - node CPU was 42% at time of incident)'
      ],
      correlatedDeploymentId: 'dep-001',
      correlatedAlertIds: ['alt-payment-errors', 'alt-payment-latency'],
      recommendedInvestigation: 'Inspect payment-service pool connection metrics and consider increasing pool size to 50.'
    };
  }

  public getDeploymentRisk(deploymentId: string): DeploymentRiskAssessment {
    return {
      deploymentId,
      serviceId: 'payment-service',
      version: 'v0.0.3',
      commitSha: 'c6fca64ddd26',
      riskLevel: 'medium',
      confidence: 'high',
      method: 'statistical',
      riskFactors: [
        'Core transactional payment service touched',
        'Historical rollback rate for payment-service is 4.2%',
        'Database connection handling logic modified in commit'
      ],
      rollbackRecommended: false,
      rationale: 'While risk is elevated due to core financial transaction modifications, canary validation and smoke test suites passed without regressions.'
    };
  }

  public getRecommendations(): AiSreRecommendation[] {
    return this.recommendations;
  }

  public updateRecommendationStatus(
    id: string,
    status: AiSreRecommendation['status']
  ): AiSreRecommendation {
    const rec = this.recommendations.find((r) => r.id === id);
    if (!rec) {
      throw new Error(`Recommendation '${id}' not found`);
    }
    rec.status = status;
    return rec;
  }
}
