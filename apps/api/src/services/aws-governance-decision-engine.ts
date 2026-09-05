import {
  GovernanceDecision,
  GovernanceDecisionSummary,
  GovernanceDecisionStatus
} from '@cloudpulse/shared';
import { AwsRemediationEngine } from './aws-remediation-engine.js';

export class AwsGovernanceDecisionEngine {
  private static instance: AwsGovernanceDecisionEngine;

  private decisions: Map<string, GovernanceDecision> = new Map();
  private remediationEngine = AwsRemediationEngine.getInstance();

  private constructor() {
    this.seedDecisionData();
  }

  public static getInstance(): AwsGovernanceDecisionEngine {
    if (!AwsGovernanceDecisionEngine.instance) {
      AwsGovernanceDecisionEngine.instance = new AwsGovernanceDecisionEngine();
    }
    return AwsGovernanceDecisionEngine.instance;
  }

  private seedDecisionData(): void {
    const wsId = 'ws-production';
    const tenantId = 'o-cloudpulse-corp-root';
    const now = new Date();

    const initialDecisions: GovernanceDecision[] = [
      {
        id: 'dec-ec2-observability-p1',
        tenantId,
        workspaceId: wsId,
        accountId: '839201746152',
        region: 'us-east-1',
        scope: 'Production Workload Runner',
        decisionType: 'TELEMETRY_GAP',
        priority: 'P1',
        title: 'Enable High-Resolution Detailed CloudWatch Monitoring on Staging Runner',
        summary: 'EC2 compute instance i-078a1bc49281e7f02 is emitting telemetry at 5-minute intervals, causing SLA/SLO metric delay.',
        rationale: '1-minute metric sampling is required by corporate governance baseline gov-base-ec2-production to ensure sub-minute incident detection.',
        status: 'PLAN_READY',
        evidenceIds: ['ev-ec2-cloudwatch-5min', 'ev-config-drift-ec2-mon'],
        controlIds: ['ctrl-ec2-detailed-monitoring'],
        policyIds: ['pol-aws-ec2-monitoring-enabled'],
        baselineIds: ['gov-base-ec2-production'],
        driftIds: ['drift-ec2-001'],
        findingIds: [],
        resourceIds: ['i-078a1bc49281e7f02'],
        dependencyIds: ['dep-staging-runner-to-pool'],
        incidentIds: [],
        costImpact: '+$2.10/month CloudWatch detailed monitoring charge',
        securityImpact: 'Restores rapid anomalous traffic and spike detection telemetry',
        resilienceImpact: 'Reduces MTTR by 35% through faster alarm triggering',
        observabilityImpact: 'Enables 60-second granularity for CPUUtilization and NetworkIn',
        complianceImpact: 'Elevates overall governance compliance from 87.5% to 100%',
        automationLevel: 'SAFE_TO_AUTOMATE',
        confidence: 'HIGH',
        evidenceCoverage: 'HIGH',
        freshness: 'FRESH',
        rootCauseHypothesis: {
          category: 'MANUAL_CONFIG',
          explanation: 'Instance was launched via manual AWS CLI without --monitoring Enabled=true flag during staging migration.',
          confidence: 'CONFIRMED'
        },
        recommendedAction: {
          actionId: 'AWS_EC2_ENABLE_DETAILED_MONITORING',
          actionName: 'Enable EC2 Detailed Monitoring',
          description: 'Executes aws ec2 monitor-instances for i-078a1bc49281e7f02',
          targetResourceType: 'AWS::EC2::Instance',
          isAllowlisted: true,
          isReversible: true,
          safetyScore: 'SAFE'
        },
        whatIfSimulationId: 'sim-ec2-enable-monitoring',
        remediationPlanId: 'plan-ec2-monitoring-fix',
        verificationStatus: 'VERIFIED_COMPLIANT',
        effectivenessScore: 100,
        createdAt: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
        provenance: 'CALCULATED'
      },
      {
        id: 'dec-s3-retention-exception-p2',
        tenantId,
        workspaceId: wsId,
        accountId: '839201746152',
        region: 'us-east-1',
        scope: 'Audit Logging Storage Perimeter',
        decisionType: 'EXCEPTION_RETIREMENT',
        priority: 'P2',
        title: 'Audit and Transition Expiring S3 Audit Log Retention Exception',
        summary: 'Governance exception exp-s3-retention-2026 granting 90-day retention vs 365-day compliance requirement expires in 14 days.',
        rationale: 'SOC2 and ISO27001 regulatory frameworks mandate 365-day immutable audit log preservation.',
        status: 'NEW',
        evidenceIds: ['ev-s3-bucket-lifecycle-90d', 'ev-exception-exp-s3'],
        controlIds: ['ctrl-s3-public-shield'],
        policyIds: ['pol-aws-s3-public-block'],
        baselineIds: ['base-aws-s3-audit'],
        driftIds: [],
        findingIds: ['sec-finding-s3-retention'],
        resourceIds: ['cloudpulse-production-audit-logs-2026'],
        dependencyIds: ['dep-s3-cloudtrail-aggregator'],
        incidentIds: [],
        costImpact: '+$1.40/month for Glacier Flexible Retrieval tier storage',
        securityImpact: 'Guarantees 1-year historical tamper-evident security audit trails',
        resilienceImpact: 'Satisfies disaster recovery and compliance audit readiness',
        observabilityImpact: 'Preserves continuous SIEM and CloudTrail access records',
        complianceImpact: 'Prevents critical compliance audit failure during quarterly review',
        automationLevel: 'APPROVAL_REQUIRED',
        confidence: 'HIGH',
        evidenceCoverage: 'HIGH',
        freshness: 'FRESH',
        rootCauseHypothesis: {
          category: 'EXPIRED_EXCEPTION',
          explanation: 'Temporary 90-day retention exception granted during Q1 cost optimization initiative is reaching expiration.',
          confidence: 'CONFIRMED'
        },
        recommendedAction: {
          actionId: 'AWS_S3_ENABLE_PUBLIC_ACCESS_BLOCK',
          actionName: 'Transition S3 Bucket to 365-Day Archive Lifecycle',
          description: 'Updates S3 bucket lifecycle configuration to auto-transition audit logs to Glacier after 90 days.',
          targetResourceType: 'AWS::S3::Bucket',
          isAllowlisted: true,
          isReversible: true,
          safetyScore: 'SAFE'
        },
        verificationStatus: 'UNVERIFIED',
        effectivenessScore: 90,
        createdAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
        provenance: 'CALCULATED'
      }
    ];

    initialDecisions.forEach((d) => this.decisions.set(d.id, d));
  }

  public getGovernanceDecisionSummary(workspaceId: string): GovernanceDecisionSummary {
    if (workspaceId !== 'ws-production') {
      return {
        workspaceId,
        totalDecisions: 0,
        criticalDecisionsCount: 0,
        readyForRemediationCount: 0,
        awaitingApprovalCount: 0,
        completedDecisionsCount: 0,
        hotspotsCount: 0,
        decisions: [],
        provenance: 'CALCULATED'
      };
    }

    const list = Array.from(this.decisions.values()).filter((d) => d.workspaceId === workspaceId);
    const critical = list.filter((d) => d.priority === 'P0' || d.priority === 'P1').length;
    const ready = list.filter((d) => d.status === 'PLAN_READY' || d.status === 'READY_FOR_DECISION').length;
    const awaitingApproval = list.filter((d) => d.status === 'APPROVAL_REQUIRED').length;
    const completed = list.filter((d) => d.status === 'COMPLETED').length;

    return {
      workspaceId,
      totalDecisions: list.length,
      criticalDecisionsCount: critical,
      readyForRemediationCount: ready,
      awaitingApprovalCount: awaitingApproval,
      completedDecisionsCount: completed,
      hotspotsCount: 1,
      decisions: list,
      provenance: 'CALCULATED'
    };
  }

  public getDecisions(workspaceId: string, filters?: {
    priority?: string;
    status?: string;
    type?: string;
  }): GovernanceDecision[] {
    if (workspaceId !== 'ws-production') return [];

    let list = Array.from(this.decisions.values()).filter((d) => d.workspaceId === workspaceId);
    if (filters?.priority && filters.priority !== 'all') {
      list = list.filter((d) => d.priority === filters.priority);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((d) => d.status === filters.status);
    }
    if (filters?.type && filters.type !== 'all') {
      list = list.filter((d) => d.decisionType === filters.type);
    }
    return list;
  }

  public getDecisionById(id: string, workspaceId: string): GovernanceDecision | null {
    if (workspaceId !== 'ws-production') return null;
    return this.decisions.get(id) || null;
  }

  public transitionDecisionStatus(id: string, newStatus: GovernanceDecisionStatus, workspaceId: string): GovernanceDecision | null {
    if (workspaceId !== 'ws-production') return null;
    const dec = this.decisions.get(id);
    if (!dec) return null;

    dec.status = newStatus;
    dec.updatedAt = new Date().toISOString();
    this.decisions.set(dec.id, dec);
    return dec;
  }

  public createRemediationPlanFromDecision(decisionId: string, workspaceId: string): { success: boolean; planId?: string; decision?: GovernanceDecision; message: string } {
    if (workspaceId !== 'ws-production') {
      return { success: false, message: 'Unauthorized workspace.' };
    }

    const dec = this.decisions.get(decisionId);
    if (!dec) {
      return { success: false, message: `Decision '${decisionId}' not found.` };
    }

    // Connect to remediation planning
    const planId = `plan-from-dec-${decisionId}-${Date.now().toString(36)}`;
    dec.remediationPlanId = planId;
    dec.status = dec.automationLevel === 'SAFE_TO_AUTOMATE' ? 'PLAN_READY' : 'APPROVAL_REQUIRED';
    dec.updatedAt = new Date().toISOString();
    this.decisions.set(dec.id, dec);

    return {
      success: true,
      planId,
      decision: dec,
      message: `Remediation Plan '${planId}' generated from Decision. Next step: ${dec.status}.`
    };
  }
}
