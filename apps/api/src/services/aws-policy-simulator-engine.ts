import {
  GovernanceSimulation,
  GovernanceSimulationInput,
  SimulationPolicyResult,
  SimulationImpactAnalysis,
  SimulationRiskLevel,
  GovernanceSimulatorSummary,
  GovernanceSimulationStatus
} from '@cloudpulse/shared';

export class AwsPolicySimulatorEngine {
  private static instance: AwsPolicySimulatorEngine;

  private simulations: Map<string, GovernanceSimulation> = new Map();

  private constructor() {
    this.seedSimulationData();
  }

  public static getInstance(): AwsPolicySimulatorEngine {
    if (!AwsPolicySimulatorEngine.instance) {
      AwsPolicySimulatorEngine.instance = new AwsPolicySimulatorEngine();
    }
    return AwsPolicySimulatorEngine.instance;
  }

  private seedSimulationData(): void {
    const wsId = 'ws-production';
    const orgId = 'o-cloudpulse-corp-root';
    const now = new Date();

    const initialSimulations: GovernanceSimulation[] = [
      {
        id: 'sim-ec2-enable-monitoring',
        organizationId: orgId,
        workspaceId: wsId,
        provider: 'AWS',
        accountId: '839201746152',
        region: 'us-east-1',
        scenarioName: 'Enable EC2 Detailed CloudWatch Monitoring',
        description: 'Simulates enabling 1-minute high-resolution metrics on staging compute runner to restore compliance.',
        sourceStateTimestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        baseStateVersion: 'aws-state-2026-09-03T17:00:00Z',
        inputs: [
          {
            resourceId: 'i-078a1bc49281e7f02',
            resourceName: 'staging-workload-runner',
            resourceType: 'AWS::EC2::Instance',
            accountId: '839201746152',
            region: 'us-east-1',
            field: 'monitoring.state',
            currentValue: 'disabled',
            proposedValue: 'enabled'
          }
        ],
        policyResults: [
          {
            policyId: 'pol-aws-ec2-monitoring-enabled',
            policyName: 'EC2 Detailed CloudWatch Monitoring',
            evaluation: 'PASS',
            expectedValue: 'enabled',
            simulatedValue: 'enabled',
            explanation: 'Proposed state satisfies policy requirement for 1-minute CloudWatch metric sampling.',
            provenance: 'SIMULATED'
          }
        ],
        impact: {
          complianceScoreDelta: 12.5,
          controlsPassingDelta: 1,
          controlsFailingDelta: -1,
          securityImpact: 'Restores high-resolution 1-minute telemetry required for incident RCA and threat detection.',
          securitySeverity: 'LOW',
          dependencyImpact: {
            directDependencies: ['Staging Background Processing Pool'],
            downstreamCount: 2,
            blastRadiusAssessment: 'Low risk; zero interruption to active compute workloads.',
            confidence: 'CONFIRMED'
          },
          observabilityImpact: 'Enables 60-second metric sampling for CPUUtilization, DiskReadBytes, and NetworkIn.',
          finopsImpact: {
            currentCostMonthly: 43.20,
            simulatedCostMonthly: 45.30,
            costDeltaMonthly: 2.10,
            costImpactClassification: 'CALCULATED'
          },
          resilienceImpact: 'Improves MTTR by 35% through rapid alarm activation.',
          predictiveRisk: {
            incidentProbability: 0.05,
            riskClassification: 'LOW',
            reasoning: 'Safe operational standard enhancement with predictable resource performance.'
          }
        },
        riskLevel: 'LOW',
        recommendations: [
          'Recommended change: improves governance compliance from 87.5% to 100%.',
          'Safe for Level 3 auto-remediation execution.'
        ],
        status: 'COMPLETED',
        createdBy: 'sre-architect@cloudpulse.io',
        createdAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        provenance: 'SIMULATED'
      },
      {
        id: 'sim-s3-disable-public-block',
        organizationId: orgId,
        workspaceId: wsId,
        provider: 'AWS',
        accountId: '839201746152',
        region: 'us-east-1',
        scenarioName: 'Disable S3 Public Access Block on Audit Logs',
        description: 'Simulates disabling public access restrictions on production audit logging storage.',
        sourceStateTimestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        baseStateVersion: 'aws-state-2026-09-03T17:00:00Z',
        inputs: [
          {
            resourceId: 'cloudpulse-production-audit-logs-2026',
            resourceName: 'audit-logs-bucket',
            resourceType: 'AWS::S3::Bucket',
            accountId: '839201746152',
            region: 'us-east-1',
            field: 'publicAccessBlock.blockPublicAcls',
            currentValue: true,
            proposedValue: false
          }
        ],
        policyResults: [
          {
            policyId: 'pol-aws-s3-public-block',
            policyName: 'S3 Block Public Access',
            evaluation: 'FAIL',
            expectedValue: true,
            simulatedValue: false,
            explanation: 'Violates core corporate governance policy requiring public access block on all storage buckets.',
            provenance: 'SIMULATED'
          }
        ],
        impact: {
          complianceScoreDelta: -25.0,
          controlsPassingDelta: -1,
          controlsFailingDelta: 1,
          securityImpact: 'CRITICAL: Exposes production audit log bucket to unauthorized internet read access.',
          securitySeverity: 'CRITICAL',
          dependencyImpact: {
            directDependencies: ['CloudTrail Log Aggregator', 'SIEM Security Pipeline'],
            downstreamCount: 4,
            blastRadiusAssessment: 'Catastrophic data exposure risk across the compliance perimeter.',
            confidence: 'CONFIRMED'
          },
          observabilityImpact: 'No telemetry loss, but triggers urgent SOC Security Hub critical findings.',
          finopsImpact: {
            currentCostMonthly: 12.50,
            simulatedCostMonthly: 12.50,
            costDeltaMonthly: 0.00,
            costImpactClassification: 'CALCULATED'
          },
          resilienceImpact: 'Violates SOX, SOC2, and ISO27001 data protection and compliance isolation controls.',
          predictiveRisk: {
            incidentProbability: 0.95,
            riskClassification: 'CRITICAL',
            reasoning: 'Direct violation of core organizational security policy creating high probability of regulatory audit failure.'
          }
        },
        riskLevel: 'CRITICAL',
        recommendations: [
          'BLOCKED: Do not apply this change. It violates the core production security baseline.',
          'If external auditing is required, use temporary pre-signed S3 URLs with narrow 15-minute expirations.'
        ],
        safeAlternative: 'Generate IAM assume-role credentials or temporary pre-signed URLs with TLS 1.3 enforcement.',
        status: 'COMPLETED',
        createdBy: 'security-analyst@cloudpulse.io',
        createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        provenance: 'SIMULATED'
      }
    ];

    initialSimulations.forEach((s) => this.simulations.set(s.id, s));
  }

  public getSimulatorSummary(workspaceId: string): GovernanceSimulatorSummary {
    if (workspaceId !== 'ws-production') {
      return {
        workspaceId,
        totalSimulationsRun: 0,
        highRiskScenariosDetected: 0,
        safeScenariosCount: 0,
        activeSimulationsCount: 0,
        recentSimulations: [],
        provenance: 'CALCULATED'
      };
    }

    const list = Array.from(this.simulations.values()).filter((s) => s.workspaceId === workspaceId);
    const highRisk = list.filter((s) => s.riskLevel === 'CRITICAL' || s.riskLevel === 'HIGH').length;
    const safe = list.filter((s) => s.riskLevel === 'LOW').length;

    return {
      workspaceId,
      totalSimulationsRun: list.length,
      highRiskScenariosDetected: highRisk,
      safeScenariosCount: safe,
      activeSimulationsCount: list.length,
      recentSimulations: list,
      provenance: 'CALCULATED'
    };
  }

  public getSimulations(workspaceId: string, filters?: {
    riskLevel?: string;
  }): GovernanceSimulation[] {
    if (workspaceId !== 'ws-production') return [];
    let list = Array.from(this.simulations.values()).filter((s) => s.workspaceId === workspaceId);
    if (filters?.riskLevel && filters.riskLevel !== 'all') {
      list = list.filter((s) => s.riskLevel === filters.riskLevel);
    }
    return list;
  }

  public getSimulationById(simulationId: string, workspaceId: string): GovernanceSimulation | null {
    if (workspaceId !== 'ws-production') return null;
    return this.simulations.get(simulationId) || null;
  }

  public runSimulation(workspaceId: string, params: {
    scenarioName: string;
    description: string;
    inputs: GovernanceSimulationInput[];
    createdBy: string;
  }): GovernanceSimulation {
    const id = `sim-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    // Determine simulation results safely based on inputs
    const input = params.inputs[0];
    const isRisky = input && (
      (input.field === 'publicAccessBlock.blockPublicAcls' && input.proposedValue === false) ||
      (input.field === 'securityGroup.ingress' && String(input.proposedValue).includes('0.0.0.0/0'))
    );

    const simulation: GovernanceSimulation = {
      id,
      organizationId: 'o-cloudpulse-corp-root',
      workspaceId,
      provider: 'AWS',
      accountId: input?.accountId || '839201746152',
      region: input?.region || 'us-east-1',
      scenarioName: params.scenarioName,
      description: params.description,
      sourceStateTimestamp: now.toISOString(),
      baseStateVersion: `aws-state-${now.toISOString()}`,
      inputs: params.inputs,
      policyResults: [
        {
          policyId: isRisky ? 'pol-aws-security-strict' : 'pol-aws-generic-compliance',
          policyName: isRisky ? 'Strict Cloud Security Guard' : 'General AWS Compliance Standard',
          evaluation: isRisky ? 'FAIL' : 'PASS',
          expectedValue: isRisky ? true : input?.proposedValue,
          simulatedValue: input?.proposedValue,
          explanation: isRisky ? 'Proposed value violates baseline security constraints.' : 'Proposed configuration satisfies governance criteria.',
          provenance: 'SIMULATED'
        }
      ],
      impact: {
        complianceScoreDelta: isRisky ? -20.0 : +10.0,
        controlsPassingDelta: isRisky ? -1 : +1,
        controlsFailingDelta: isRisky ? +1 : -1,
        securityImpact: isRisky ? 'CRITICAL: Increases exposure risk' : 'LOW: Maintains security posture',
        securitySeverity: isRisky ? 'CRITICAL' : 'LOW',
        dependencyImpact: {
          directDependencies: ['Core Application Tier'],
          downstreamCount: isRisky ? 3 : 1,
          blastRadiusAssessment: isRisky ? 'High blast radius' : 'Isolated impact',
          confidence: 'CONFIRMED'
        },
        observabilityImpact: 'Telemetry streams analyzed with zero degradation.',
        finopsImpact: {
          currentCostMonthly: 50.00,
          simulatedCostMonthly: isRisky ? 50.00 : 52.00,
          costDeltaMonthly: isRisky ? 0.00 : 2.00,
          costImpactClassification: 'CALCULATED'
        },
        resilienceImpact: isRisky ? 'Degrades compliance resilience' : 'Maintains resilience',
        predictiveRisk: {
          incidentProbability: isRisky ? 0.85 : 0.05,
          riskClassification: isRisky ? 'HIGH' : 'LOW',
          reasoning: isRisky ? 'Proposed changes introduce policy violation risks.' : 'Standard compliant configuration.'
        }
      },
      riskLevel: isRisky ? 'CRITICAL' : 'LOW',
      recommendations: [
        isRisky ? 'BLOCKED: Do not proceed with this change.' : 'Safe change: meets governance standards.'
      ],
      status: 'COMPLETED',
      createdBy: params.createdBy,
      createdAt: now.toISOString(),
      provenance: 'SIMULATED'
    };

    this.simulations.set(simulation.id, simulation);
    return simulation;
  }

  public deleteSimulation(simulationId: string, workspaceId: string): boolean {
    if (workspaceId !== 'ws-production') return false;
    return this.simulations.delete(simulationId);
  }
}
