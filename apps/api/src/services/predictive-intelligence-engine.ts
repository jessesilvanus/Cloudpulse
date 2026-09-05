import {
  PredictiveForecast,
  AdvancedPredictiveAnomaly,
  PredictiveIncidentRisk,
  PredictiveModelRecord,
  PredictiveIntelligenceSummary
} from '@cloudpulse/shared';

export class PredictiveIntelligenceEngine {
  private static instance: PredictiveIntelligenceEngine;

  private forecasts: PredictiveForecast[] = [

    {
      forecastId: 'fc-cpu-gw-6h',
      target: 'CPU_UTILIZATION',
      entity: 'api-gateway',
      currentValue: 42.5,
      forecastHorizon: '+6 hours',
      predictedValue: 64.0,
      lowerBound: 58.0,
      upperBound: 72.0,
      confidencePercent: 88.5,
      riskLevel: 'MEDIUM',
      status: 'PREDICTED',
      timestamp: new Date().toISOString()
    },
    {
      forecastId: 'fc-cpu-gw-24h',
      target: 'CPU_UTILIZATION',
      entity: 'api-gateway',
      currentValue: 42.5,
      forecastHorizon: '+24 hours',
      predictedValue: 78.5,
      lowerBound: 70.0,
      upperBound: 86.0,
      confidencePercent: 82.0,
      riskLevel: 'HIGH',
      status: 'PREDICTED',
      timestamp: new Date().toISOString()
    },
    {
      forecastId: 'fc-mem-order-6h',
      target: 'MEMORY_UTILIZATION',
      entity: 'order-service',
      currentValue: 58.0,
      forecastHorizon: '+6 hours',
      predictedValue: 66.5,
      lowerBound: 62.0,
      upperBound: 71.0,
      confidencePercent: 91.0,
      riskLevel: 'LOW',
      status: 'PREDICTED',
      timestamp: new Date().toISOString()
    },
    {
      forecastId: 'fc-storage-db-72h',
      target: 'STORAGE_EXHAUSTION',
      entity: 'order-db-primary-volume',
      currentValue: 72.0,
      forecastHorizon: '+72 hours',
      predictedValue: 92.5,
      lowerBound: 88.0,
      upperBound: 96.0,
      confidencePercent: 86.0,
      riskLevel: 'HIGH',
      status: 'PREDICTED',
      timestamp: new Date().toISOString()
    }
  ];

  private anomalies: AdvancedPredictiveAnomaly[] = [
    {
      anomalyId: 'anom-lat-gw-01',
      metric: 'http_request_duration_p99',
      entity: 'api-gateway',
      baselineValue: 45.0,
      observedValue: 64.1,
      deviationPercent: 42.4,
      severity: 'WARNING',
      confidencePercent: 89.0,
      contributingFactors: ['Upstream checkout ingress burst +30%', 'Transient GC pause in order-service'],
      timestamp: new Date().toISOString()
    },
    {
      anomalyId: 'anom-mem-pay-02',
      metric: 'container_memory_working_set_bytes',
      entity: 'payment-service',
      baselineValue: 65.0,
      observedValue: 83.2,
      deviationPercent: 28.0,
      severity: 'CRITICAL',
      confidencePercent: 94.0,
      contributingFactors: ['Payment gateway sandbox retry buffer accumulation', '1/3 pods in CrashLoopBackOff'],
      timestamp: new Date().toISOString()
    }
  ];

  private incidentRisks: PredictiveIncidentRisk[] = [
    {
      predictionId: 'pred-inc-pay-01',
      affectedService: 'payment-service',
      incidentCategory: 'RELIABILITY_DEGRADATION',
      probabilityPercent: 68.5,
      forecastWindow: 'Next 6 hours',
      contributingSignals: [
        'Payment P99 latency increased by 42.4%',
        'Container memory utilization at 83.2% (cgroup limit threshold 90%)',
        'Downstream API gateway retry rate +15%'
      ],
      recommendedAction: 'Scale payment-service to 4 replicas and increase heap memory limit by 512Mi.',
      riskLevel: 'HIGH',
      timestamp: new Date().toISOString()
    }
  ];

  private models: PredictiveModelRecord[] = [
    {
      modelId: 'mod-arima-ts',
      name: 'CloudPulse-Time-Series-Forecaster',
      version: 'v2.1.0',
      type: 'TIME_SERIES_FORECAST',
      status: 'ACTIVE',
      modelTypeLabel: 'RULE-BASED PREDICTION',
      mae: 3.2,
      rmse: 4.8,
      f1Score: 0.91,
      driftStatus: 'HEALTHY',
      lastTrained: '2026-09-01T00:00:00Z'
    },
    {
      modelId: 'mod-iso-anom',
      name: 'Multi-Signal-Anomaly-Detector',
      version: 'v1.4.0',
      type: 'ANOMALY_DETECTOR',
      status: 'ACTIVE',
      modelTypeLabel: 'SIMULATED MODEL',
      mae: 1.8,
      rmse: 2.5,
      f1Score: 0.94,
      driftStatus: 'HEALTHY',
      lastTrained: '2026-09-01T00:00:00Z'
    },
    {
      modelId: 'mod-gbdt-inc',
      name: 'Incident-Probability-Classifier',
      version: 'v1.8.0',
      type: 'INCIDENT_PREDICTOR',
      status: 'ACTIVE',
      modelTypeLabel: 'RULE-BASED PREDICTION',
      mae: 2.1,
      rmse: 3.4,
      f1Score: 0.88,
      driftStatus: 'HEALTHY',
      lastTrained: '2026-08-28T00:00:00Z'
    },
    {
      modelId: 'mod-linear-cap',
      name: 'Linear-Capacity-Exhaustion-Predictor',
      version: 'v1.2.0',
      type: 'CAPACITY_PLANNER',
      status: 'ACTIVE',
      modelTypeLabel: 'SIMULATED MODEL',
      mae: 4.0,
      rmse: 5.2,
      f1Score: 0.89,
      driftStatus: 'HEALTHY',
      lastTrained: '2026-08-30T00:00:00Z'
    }
  ];

  private feedbackRecords: {
    predictionId: string;
    feedback: 'CORRECT' | 'INCORRECT' | 'PARTIALLY_CORRECT';
    notes?: string | undefined;
    timestamp: string;
  }[] = [];

  public static getInstance(): PredictiveIntelligenceEngine {
    if (!PredictiveIntelligenceEngine.instance) {
      PredictiveIntelligenceEngine.instance = new PredictiveIntelligenceEngine();
    }
    return PredictiveIntelligenceEngine.instance;
  }

  public getSummary(): PredictiveIntelligenceSummary {
    return {
      overallPredictiveRiskScore: 28.5,
      activeAnomaliesCount: this.anomalies.length,
      highProbabilityIncidentsCount: this.incidentRisks.filter((r) => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL').length,
      budgetBreachPredicted: false,
      capacityExhaustionAlertsCount: this.forecasts.filter((f) => f.target === 'STORAGE_EXHAUSTION' && f.riskLevel === 'HIGH').length,
      registeredModelsCount: this.models.length,
      modelDriftAlertsCount: this.models.filter((m) => m.driftStatus !== 'HEALTHY').length,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getForecasts(target?: string, risk?: string): PredictiveForecast[] {
    return this.forecasts.filter((f) => {
      if (target && f.target !== target) return false;
      if (risk && f.riskLevel !== risk) return false;
      return true;
    });
  }

  public getAnomalies(severity?: string): AdvancedPredictiveAnomaly[] {
    return this.anomalies.filter((a) => {
      if (severity && a.severity !== severity) return false;
      return true;
    });
  }

  public getIncidentPredictions(): PredictiveIncidentRisk[] {
    return this.incidentRisks;
  }

  public getCapacityPredictions() {
    return [
      {
        resource: 'order-db-primary-volume',
        type: 'EBS gp3 Storage',
        currentUtilizationPercent: 72.0,
        growthRateDailyPercent: 4.5,
        estimatedTimeToThreshold: '18.4 hours to 90% threshold',
        confidencePercent: 86.0,
        risk: 'HIGH',
        recommendation: 'Expand volume capacity from 500GB to 1TB before peak batch processing.'
      },
      {
        resource: 'eks-prod-us-east-1-nodepool',
        type: 'Compute Node Pool (m6i.2xlarge)',
        currentUtilizationPercent: 42.5,
        growthRateDailyPercent: 1.2,
        estimatedTimeToThreshold: '> 30 days to capacity',
        confidencePercent: 92.0,
        risk: 'LOW',
        recommendation: 'Capacity is stable; maintain current autoscaling bounds.'
      }
    ];
  }

  public getCostPredictions() {
    return {
      currentMonthSpend: 1300.5,
      predictedMonthEndSpend: 1440.0,
      monthlyBudget: 1800.0,
      predictedBudgetBreach: false,
      spendAccelerationPercent: 3.2,
      confidencePercent: 91.5,
      breakdown: [
        { service: 'Amazon EKS Nodes', currentSpend: 620.0, projectedSpend: 680.0 },
        { service: 'Amazon RDS Aurora DB', currentSpend: 380.5, projectedSpend: 420.0 },
        { service: 'Data Transfer & NAT', currentSpend: 300.0, projectedSpend: 340.0 }
      ],
      recommendation: 'Spending is well within the $1,800 monthly ceiling (projected 80.0% utilization).'
    };
  }

  public getModelRegistry(): PredictiveModelRecord[] {
    return this.models;
  }

  public submitPredictionFeedback(
    predictionId: string,
    feedback: 'CORRECT' | 'INCORRECT' | 'PARTIALLY_CORRECT',
    notes?: string
  ) {
    const record = {
      predictionId,
      feedback,
      notes,
      timestamp: new Date().toISOString()
    };
    this.feedbackRecords.push(record);
    return { ok: true, record };
  }

  public getFeedbackRecords() {
    return this.feedbackRecords;
  }

  public simulateScenario(scenario: {
    trafficMultiplier?: number;
    storageGrowthMultiplier?: number;
    nodeFailureCount?: number;
  }) {
    const trafficMult = scenario.trafficMultiplier || 1.0;
    const nodeLoss = scenario.nodeFailureCount || 0;

    const projectedCpu = Math.min(100, Math.round(42.5 * trafficMult * (nodeLoss > 0 ? 1.33 : 1.0) * 10) / 10);
    const projectedP99 = Math.round(45.0 * Math.pow(trafficMult, 1.4) * 10) / 10;
    const projectedIncidentProb = Math.min(99, Math.round(15.0 * trafficMult * (nodeLoss > 0 ? 2.5 : 1.0)));
    const projectedSpend = Math.round(1300.5 * (1 + (trafficMult - 1) * 0.4) * 100) / 100;

    return {
      scenarioType: 'WHAT_IF',
      parameters: {
        trafficMultiplier: trafficMult,
        storageGrowthMultiplier: scenario.storageGrowthMultiplier || 1.0,
        nodeFailureCount: nodeLoss
      },
      projectedImpact: {
        cpuUtilizationPercent: projectedCpu,
        p99LatencyMs: projectedP99,
        incidentProbabilityPercent: projectedIncidentProb,
        projectedMonthlySpend: projectedSpend,
        sloAttainmentPercent: projectedCpu > 85 ? 98.2 : 99.9
      },
      riskLevel: projectedCpu > 80 || projectedIncidentProb > 60 ? 'HIGH' : 'LOW',
      safetyNotice: 'Simulation result only (WHAT_IF). No production resources were modified.',
      timestamp: new Date().toISOString()
    };
  }

  public queryPredictiveAssistant(prompt: string) {
    return {
      query: prompt,
      status: 'PREDICTED',
      modelProvenance: 'Rule-Based Telemetry Pattern Evaluator + Time-Series Extrapolator',
      summary: 'Evaluated predictive forecasts, multi-signal anomalies, and capacity headroom.',
      evidence: [
        'API Gateway CPU utilization forecast: 64.0% in +6h, 78.5% in +24h (Confidence: 82%)',
        'Payment Service reliability incident probability: 68.5% over next 6 hours due to P99 latency anomaly (+42.4%)',
        'Storage capacity exhaustion: order-db-primary-volume projected to cross 90% in 18.4 hours'
      ],
      recommendation: 'Scale payment-service replicas to 4 and trigger volume expansion for order-db-primary.',
      timestamp: new Date().toISOString()
    };
  }
}
