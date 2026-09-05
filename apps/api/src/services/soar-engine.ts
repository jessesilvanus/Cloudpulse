import {
  ResponseIncident,
  ResponsePlaybook,
  ResponseActionExecution,
  ApprovalRequest,
  PostIncidentReview,
  SoarPlatformSummary
} from '@cloudpulse/shared';

export class SoarEngine {
  private static instance: SoarEngine;

  private incidents: ResponseIncident[] = [
    {
      id: 'rinc-001',
      title: 'Privilege Escalation via Wildcard IAM Policy Attachment',
      severity: 'critical',
      priority: 'P1',
      status: 'INVESTIGATING',
      source: 'aws_cloudtrail',
      detections: ['rule-privilege-escalation'],
      affectedAssets: ['arn:aws:iam::123456789012:role/LegacyAwsCiDeployer'],
      riskScore: 88,
      assignedTo: 'sec-analyst@cloudpulse.internal',
      incidentCommander: 'security-commander@cloudpulse.internal',
      triageDetails: {
        what: 'Wildcard AdministratorAccess policy attached to service principal role',
        why: 'Violates Zero-Trust policy pol-no-wildcard-iam with critical blast radius',
        evidence: [
          'CloudTrail event: iam:AttachRolePolicy by 198.51.100.24',
          'Resource: arn:aws:iam::123456789012:role/LegacyAwsCiDeployer',
          'Policy: arn:aws:iam::aws:policy/AdministratorAccess'
        ],
        confidence: 'high',
        recommendedPlaybookId: 'pb-iam-containment-01'
      },
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'rinc-002',
      title: 'Production Kubernetes Pod Interactive Exec Session',
      severity: 'medium',
      priority: 'P3',
      status: 'RESOLVED',
      source: 'k8s_audit',
      detections: ['rule-k8s-exec-container'],
      affectedAssets: ['k8s:pod/cloudpulse/order-service-7d84b84c8f-9x2pl'],
      riskScore: 42,
      assignedTo: 'sre-lead@cloudpulse.internal',
      incidentCommander: 'sre-lead@cloudpulse.internal',
      triageDetails: {
        what: 'kubectl exec interactive session attached to production pod',
        why: 'Bypasses GitOps deployment pipeline; potential manual debugging probe',
        evidence: [
          'K8s Audit: pods/exec on namespace: cloudpulse',
          'ServiceAccount: developer-jane@cloudpulse.local',
          'Just-In-Time access request req-001 approved for 60m'
        ],
        confidence: 'high',
        recommendedPlaybookId: 'pb-k8s-audit-review-02'
      },
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      resolvedAt: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  private playbooks: ResponsePlaybook[] = [
    {
      id: 'pb-iam-containment-01',
      name: 'IAM Compromised Role Isolation & Session Revocation',
      description: 'Quarantines compromised IAM role, revokes active STS credentials, and notifies security command.',
      severity: 'critical',
      trigger: 'rule-privilege-escalation',
      approvalPolicy: 'APPROVAL_REQUIRED',
      version: '1.4.0',
      status: 'ACTIVE',
      enabled: true,
      successRatePercent: 98.5,
      steps: [
        {
          id: 'step-01-notify',
          order: 1,
          type: 'NOTIFY',
          description: 'Notify Security Incident Commander and On-Call Security Lead via high-priority broadcast.',
          risk: 'SAFE',
          requiresApproval: false,
          timeoutSeconds: 30,
          onSuccess: 'step-02-capture',
          onFailure: 'step-02-capture'
        },
        {
          id: 'step-02-capture',
          order: 2,
          type: 'CAPTURE_CONTEXT',
          description: 'Snapshot active session credentials, CloudTrail activity logs, and attached policies.',
          risk: 'SAFE',
          requiresApproval: false,
          timeoutSeconds: 60,
          onSuccess: 'step-03-request-approval',
          onFailure: 'step-03-request-approval'
        },
        {
          id: 'step-03-request-approval',
          order: 3,
          type: 'REQUEST_APPROVAL',
          description: 'Request human approval from Security Operator to detach wildcard policy and revoke sessions.',
          risk: 'HIGH_RISK',
          requiresApproval: true,
          timeoutSeconds: 300,
          onSuccess: 'step-04-verify',
          onFailure: 'abort'
        },
        {
          id: 'step-04-verify',
          order: 4,
          type: 'VERIFY_STATE',
          description: 'Verify IAM role policy attachments and validate zero active STS sessions remain.',
          risk: 'SAFE',
          requiresApproval: false,
          timeoutSeconds: 30,
          onSuccess: 'complete',
          onFailure: 'escalate'
        }
      ]
    },
    {
      id: 'pb-k8s-audit-review-02',
      name: 'Kubernetes Workload Diagnostic & Runtime Verification',
      description: 'Collects pod logs, queries Prometheus metrics, and validates running container checksums.',
      severity: 'medium',
      trigger: 'rule-k8s-exec-container',
      approvalPolicy: 'AUTO',
      version: '1.1.0',
      status: 'ACTIVE',
      enabled: true,
      successRatePercent: 99.2,
      steps: [
        {
          id: 'step-k8s-01-logs',
          order: 1,
          type: 'COLLECT_LOG_REFERENCE',
          description: 'Extract stdout/stderr stream from affected container to Loki audit store.',
          risk: 'SAFE',
          requiresApproval: false,
          timeoutSeconds: 30,
          onSuccess: 'step-k8s-02-metrics',
          onFailure: 'step-k8s-02-metrics'
        },
        {
          id: 'step-k8s-02-metrics',
          order: 2,
          type: 'INCREASE_MONITORING',
          description: 'Increase Prometheus scraping frequency for target pod to 1-second interval.',
          risk: 'LOW_RISK',
          requiresApproval: false,
          timeoutSeconds: 30,
          onSuccess: 'step-k8s-03-verify',
          onFailure: 'step-k8s-03-verify'
        },
        {
          id: 'step-k8s-03-verify',
          order: 3,
          type: 'VERIFY_STATE',
          description: 'Verify pod health probes and validate container root filesystem immutability.',
          risk: 'SAFE',
          requiresApproval: false,
          timeoutSeconds: 30,
          onSuccess: 'complete',
          onFailure: 'notify'
        }
      ]
    }
  ];

  private actionExecutions: ResponseActionExecution[] = [
    {
      id: 'act-001',
      incidentId: 'rinc-001',
      playbookId: 'pb-iam-containment-01',
      stepId: 'step-01-notify',
      status: 'COMPLETED',
      actor: 'soar-engine@cloudpulse.internal',
      startedAt: new Date(Date.now() - 7100000).toISOString(),
      completedAt: new Date(Date.now() - 7098000).toISOString(),
      result: 'Incident broadcast delivered to Slack #security-soc and PagerDuty schedule.',
      verificationStatus: 'SUCCESS'
    },
    {
      id: 'act-002',
      incidentId: 'rinc-001',
      playbookId: 'pb-iam-containment-01',
      stepId: 'step-02-capture',
      status: 'COMPLETED',
      actor: 'soar-engine@cloudpulse.internal',
      startedAt: new Date(Date.now() - 7095000).toISOString(),
      completedAt: new Date(Date.now() - 7090000).toISOString(),
      result: 'Captured 14 CloudTrail log events and current IAM role policy manifest.',
      verificationStatus: 'SUCCESS'
    },
    {
      id: 'act-003',
      incidentId: 'rinc-001',
      playbookId: 'pb-iam-containment-01',
      stepId: 'step-03-request-approval',
      status: 'WAITING_APPROVAL',
      actor: 'soar-engine@cloudpulse.internal',
      startedAt: new Date(Date.now() - 7085000).toISOString(),
      result: 'Approval request app-001 queued for Security Operator review.',
      approvalId: 'app-001'
    }
  ];

  private approvalRequests: ApprovalRequest[] = [
    {
      id: 'app-001',
      incidentId: 'rinc-001',
      actionId: 'act-003',
      requestedBy: 'soar-engine@cloudpulse.internal',
      requestedAt: new Date(Date.now() - 7085000).toISOString(),
      decision: 'PENDING',
      risk: 'HIGH_RISK',
      expectedImpact: 'Detaches AdministratorAccess policy from LegacyAwsCiDeployer role. Zero workload disruption expected as CI pipeline migrated to OIDC.',
      rollbackSteps: 'Re-attach role policy via Terraform infra/terraform/modules/iam',
      expiresAt: new Date(Date.now() + 3600000 * 2).toISOString()
    }
  ];

  private postIncidentReviews: PostIncidentReview[] = [
    {
      id: 'pir-001',
      incidentId: 'rinc-002',
      rootCause: 'Manual pod exec required due to lack of ephemeral debug container support in staging cluster.',
      trigger: 'Developer required immediate heap dump to investigate transient memory spike in order-service.',
      impact: 'Zero customer downtime. Service maintained 100% availability during 15-minute investigation.',
      timeline: [
        {
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          phase: 'DETECTION',
          description: 'K8s Audit rule-k8s-exec-container triggered by kubectl exec session.'
        },
        {
          timestamp: new Date(Date.now() - 14100000).toISOString(),
          phase: 'TRIAGE',
          description: 'Automated triage verified active JIT approval ticket req-001.'
        },
        {
          timestamp: new Date(Date.now() - 13800000).toISOString(),
          phase: 'RESPONSE',
          description: 'Playbook pb-k8s-audit-review-02 executed, verified container rootfs integrity.'
        },
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          phase: 'CLOSURE',
          description: 'Session terminated normally; incident resolved by SRE Lead.'
        }
      ],
      whatWorked: [
        'Automated SOAR detection identified pod exec within 4 seconds of connection.',
        'JIT ticket correlation confirmed authorized developer identity.'
      ],
      whatFailed: [
        'Developer lacked non-intrusive memory profiling tool in staging cluster.'
      ],
      lessonsLearned: [
        {
          category: 'OBSERVABILITY',
          lesson: 'Integrate continuous pprof memory profiling into dev/staging microservice pods to eliminate need for live exec.'
        }
      ],
      correctiveActions: [
        {
          id: 'ca-001',
          description: 'Deploy Kubernetes ephemeral debug containers and configure continuous heap profiler.',
          owner: 'sre-team@cloudpulse.internal',
          priority: 'MEDIUM',
          status: 'in_progress',
          dueDate: new Date(Date.now() + 86400000 * 7).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3500000).toISOString()
    }
  ];

  public static getInstance(): SoarEngine {
    if (!SoarEngine.instance) {
      SoarEngine.instance = new SoarEngine();
    }
    return SoarEngine.instance;
  }

  public getSoarSummary(): SoarPlatformSummary {
    const activeIncidents = this.incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED');
    const criticalIncidents = activeIncidents.filter((i) => i.priority === 'P1' || i.severity === 'critical');
    const awaitingApproval = this.approvalRequests.filter((a) => a.decision === 'PENDING');

    return {
      activeIncidentsCount: activeIncidents.length,
      criticalIncidentsCount: criticalIncidents.length,
      awaitingApprovalCount: awaitingApproval.length,
      activePlaybooksCount: this.playbooks.filter((p) => p.status === 'ACTIVE').length,
      automationRatePercent: 78.5,
      playbookSuccessRatePercent: 96.2,
      mttaSeconds: 12.4,
      mttrSeconds: 45.8,
      slaBreachesCount: 0,
      responseReadinessScore: 94.0,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getIncidents(priority?: string, severity?: string, status?: string): ResponseIncident[] {
    return this.incidents.filter((i) => {
      if (priority && i.priority !== priority) return false;
      if (severity && i.severity !== severity) return false;
      if (status && i.status !== status) return false;
      return true;
    });
  }

  public getIncidentById(id: string): ResponseIncident | undefined {
    return this.incidents.find((i) => i.id === id);
  }

  public triageIncident(id: string): ResponseIncident {
    const incident = this.incidents.find((i) => i.id === id);
    if (!incident) {
      throw new Error(`Incident '${id}' not found`);
    }

    incident.status = 'TRIAGED';
    incident.updatedAt = new Date().toISOString();
    return incident;
  }

  public getPlaybooks(): ResponsePlaybook[] {
    return this.playbooks;
  }

  public getPlaybookById(id: string): ResponsePlaybook | undefined {
    return this.playbooks.find((p) => p.id === id);
  }

  public executePlaybook(
    incidentId: string,
    playbookId: string,
    dryRun: boolean = false,
    actor: string = 'soar-operator@cloudpulse.internal'
  ): { executionId: string; status: string; dryRun: boolean; executions: ResponseActionExecution[] } {
    const incident = this.incidents.find((i) => i.id === incidentId);
    if (!incident) throw new Error(`Incident '${incidentId}' not found`);

    const playbook = this.playbooks.find((p) => p.id === playbookId);
    if (!playbook) throw new Error(`Playbook '${playbookId}' not found`);

    const executionId = `exec-${Date.now()}`;
    const generatedExecutions: ResponseActionExecution[] = [];

    for (const step of playbook.steps) {
      const execution: ResponseActionExecution = {
        id: `act-${Date.now()}-${step.order}`,
        incidentId,
        playbookId,
        stepId: step.id,
        status: dryRun ? 'COMPLETED' : step.requiresApproval ? 'WAITING_APPROVAL' : 'COMPLETED',
        actor,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        result: dryRun
          ? `[DRY_RUN] Simulated execution for step: ${step.description}`
          : step.requiresApproval
          ? `Action paused. Awaiting human approval for risk level: ${step.risk}`
          : `Executed action successfully: ${step.description}`,
        ...(dryRun || !step.requiresApproval ? { verificationStatus: 'SUCCESS' as const } : {})
      };

      generatedExecutions.push(execution);
      this.actionExecutions.unshift(execution);


      if (!dryRun && step.requiresApproval) {
        const appReq: ApprovalRequest = {
          id: `app-${Date.now()}`,
          incidentId,
          actionId: execution.id,
          requestedBy: actor,
          requestedAt: new Date().toISOString(),
          decision: 'PENDING',
          risk: step.risk,
          expectedImpact: `Execute step '${step.description}' on incident '${incident.title}'`,
          rollbackSteps: 'Automated rollback supported where configuration is version-controlled.',
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        };
        this.approvalRequests.unshift(appReq);
        break; // Pause execution for approval
      }
    }

    incident.status = dryRun ? incident.status : 'RESPONDING';
    incident.updatedAt = new Date().toISOString();

    return {
      executionId,
      status: dryRun ? 'DRY_RUN_COMPLETED' : 'EXECUTING',
      dryRun,
      executions: generatedExecutions
    };
  }

  public getActionExecutions(incidentId?: string): ResponseActionExecution[] {
    if (incidentId) {
      return this.actionExecutions.filter((a) => a.incidentId === incidentId);
    }
    return this.actionExecutions;
  }

  public getApprovalRequests(): ApprovalRequest[] {
    return this.approvalRequests;
  }

  public decideApprovalRequest(
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    approver: string,
    reason?: string
  ): ApprovalRequest {
    const req = this.approvalRequests.find((a) => a.id === id);
    if (!req) {
      throw new Error(`Approval request '${id}' not found`);
    }

    if (req.requestedBy === approver) {
      throw new Error('Separation of Duties violation: Requester cannot approve their own request.');
    }

    req.decision = decision;
    req.approver = approver;
    req.decidedAt = new Date().toISOString();
    if (reason) req.reason = reason;

    const action = this.actionExecutions.find((a) => a.id === req.actionId);
    if (action) {
      action.status = decision === 'APPROVED' ? 'COMPLETED' : 'CANCELLED';
      action.completedAt = new Date().toISOString();
      action.verificationStatus = decision === 'APPROVED' ? 'SUCCESS' : 'FAILED';
    }

    return req;
  }

  public getPostIncidentReviews(): PostIncidentReview[] {
    return this.postIncidentReviews;
  }

  public getPostIncidentReviewByIncidentId(incidentId: string): PostIncidentReview | undefined {
    return this.postIncidentReviews.find((p) => p.incidentId === incidentId);
  }

  public createPostIncidentReview(data: Omit<PostIncidentReview, 'id' | 'createdAt'>): PostIncidentReview {
    const pir: PostIncidentReview = {
      id: `pir-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...data
    };
    this.postIncidentReviews.unshift(pir);
    return pir;
  }
}
