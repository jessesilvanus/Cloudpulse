import {
  Runbook,
  RemediationAction,
  RemediationAuditLogEntry,
  Postmortem,
  DeploymentEvent,
  NotificationChannel,
  SreMetricsSummary
} from '@cloudpulse/shared';

export class SreEngine {
  private static instance: SreEngine;

  private runbooks: Runbook[] = [
    {
      id: 'rb-payment-failure',
      title: 'Payment Gateway Down / High Error Rate',
      serviceId: 'payment-service',
      serviceName: 'Payment Service',
      severity: 'critical',
      symptoms: [
        'Payment checkout endpoint returning HTTP 500 / 503 errors',
        'SloBreach alert firing on payment-service availability',
        'Spike in failed checkout transactions at Ingress API Gateway'
      ],
      possibleCauses: [
        'Sandbox database connection pool exhaustion',
        'Upstream payment provider network timeout',
        'Fault injection ERROR mode active in payment-service sandbox'
      ],
      investigationSteps: [
        'Check Loki log stream for payment-service for DB_POOL_EXHAUSTED or ECONNREFUSED',
        'Inspect Tempo trace waterfall for checkout transaction to verify which span failed',
        'Check recent deployments to see if payment-service was updated recently'
      ],
      diagnosticCommands: [
        'kubectl logs -l app.kubernetes.io/component=payment -n cloudpulse --tail=50',
        'curl -s http://localhost:4002/health/ready'
      ],
      mitigationSteps: [
        'Reset fault injection mode to NORMAL via POST /config {"mode":"NORMAL"}',
        'Restart unhealthy payment-service pods to clear deadlocked connection pools',
        'Scale payment-service deployment from 2 to 4 replicas'
      ],
      escalationPath: 'Escalate to #sre-payments on-call rotation after 5 minutes of persistent 5xx errors.',
      recoveryVerification: 'Verify GET /health/ready returns 200 OK and checkout error rate returns to 0%.'
    },
    {
      id: 'rb-high-latency',
      title: 'Order Processing Latency Breach',
      serviceId: 'order-service',
      serviceName: 'Order Service',
      severity: 'high',
      symptoms: [
        'P99 latency exceeding 500ms threshold',
        'SLO burn rate > 2x on order processing latency SLO',
        'Slow span execution visible in Tempo trace waterfall'
      ],
      possibleCauses: [
        'High CPU utilization on order-service containers',
        'Downstream payment verification slow response',
        'Fault injection SLOW mode active'
      ],
      investigationSteps: [
        'Check PromQL rate histogram for http_request_duration_ms',
        'Verify CPU utilization on order-service pods via Prometheus metrics',
        'Inspect trace span offsets to isolate latency bottleneck'
      ],
      diagnosticCommands: [
        'kubectl top pods -l app.kubernetes.io/component=order -n cloudpulse',
        'curl -s http://localhost:4001/health'
      ],
      mitigationSteps: [
        'Reset fault injection mode to NORMAL',
        'Trigger horizontal pod scaling via HPA or manual scale',
        'Verify database query performance'
      ],
      escalationPath: 'Escalate to Core Platform team on-call.',
      recoveryVerification: 'Verify P99 latency returns below 200ms in Prometheus metrics.'
    }
  ];

  private remediations: RemediationAction[] = [
    {
      id: 'act-restart-payment',
      name: 'Restart Payment Service Pods',
      type: 'restart_pod',
      serviceId: 'payment-service',
      serviceName: 'Payment Service',
      safetyLevel: 'safe_automatic',
      description: 'Performs a graceful rolling restart of payment-service pods to reset connection pools.',
      commandSnippet: 'kubectl rollout restart deployment/payment-service -n cloudpulse'
    },
    {
      id: 'act-probe-health',
      name: 'Force Health Probe & Reconnect',
      type: 'probe_health',
      serviceId: 'all',
      serviceName: 'All Services',
      safetyLevel: 'safe_automatic',
      description: 'Triggers an immediate sub-millisecond health probe across all registered microservice endpoints.',
      commandSnippet: 'curl -X POST http://localhost:3001/api/v1/health/probe'
    },
    {
      id: 'act-refresh-collector',
      name: 'Refresh OpenTelemetry Pipeline',
      type: 'refresh_collector',
      serviceId: 'otel-collector',
      serviceName: 'OpenTelemetry Collector',
      safetyLevel: 'safe_automatic',
      description: 'Refreshes OTel Collector memory limiter buffers and flushes stale telemetry spans.',
      commandSnippet: 'kubectl rollout restart deployment/otel-collector -n cloudpulse'
    }
  ];

  private remediationAuditLog: RemediationAuditLogEntry[] = [
    {
      id: 'audit-001',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      actionId: 'act-probe-health',
      actionName: 'Force Health Probe & Reconnect',
      serviceId: 'all',
      serviceName: 'All Services',
      triggerReason: 'Automated health verification probe on startup',
      triggeredBy: 'automation',
      status: 'success',
      details: 'Probed 4 microservices in 4.2ms. All endpoints operational.'
    }
  ];

  private postmortems: Postmortem[] = [
    {
      id: 'pm-inc-payment-pool-01',
      incidentId: 'inc-payment-pool-01',
      title: 'Postmortem: SEV1 Payment Sandbox Connection Pool Starvation',
      severity: 'sev1',
      leadInvestigator: 'Principal SRE Lead (alex.sre@cloudpulse.internal)',
      status: 'published',
      summary: 'On August 28, a sudden error spike in payment-service caused checkout transactions to return HTTP 500 for 14 minutes due to mock connection pool exhaustion.',
      impact: {
        customerImpact: '38 checkout transactions failed with HTTP 500 error before automated failover.',
        downtimeMinutes: 14,
        errorCount: 38,
        sloImpact: 'Availability SLO consumed 18% of monthly error budget.'
      },
      timeline: [
        {
          id: 'ev-1',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          type: 'created',
          title: 'SEV1 Incident Triggered',
          description: 'Payment error rate spike detected > 15%',
          author: 'CloudPulse Alerting Engine'
        },
        {
          id: 'ev-2',
          timestamp: new Date(Date.now() - 85500000).toISOString(),
          type: 'mitigation',
          title: 'Connection Pool Expanded & Mode Reset',
          description: 'SRE on-call executed automated pod restart and reset simulation mode to NORMAL.',
          author: 'SRE Automation'
        },
        {
          id: 'ev-3',
          timestamp: new Date(Date.now() - 84600000).toISOString(),
          type: 'resolved',
          title: 'Incident Resolved',
          description: 'Payment error rate returned to 0.0%, 100% of checkouts succeeding.',
          author: 'SRE On-Call'
        }
      ],
      rootCause: 'Connection pool maximum threshold was set too low (5 connections) during high simulated traffic bursts, causing thread starvation.',
      contributingFactors: [
        'No early warning alert for connection pool capacity utilization > 80%',
        'HPA scaling cooldown was set to 300s, delaying task scale-out'
      ],
      fiveWhys: [
        'Why did checkouts fail? The payment-service returned HTTP 500 errors.',
        'Why did payment-service fail? Database connection acquire requests timed out after 3000ms.',
        'Why did requests time out? All 5 pool connections were in use during concurrent checkout requests.',
        'Why were only 5 connections configured? Default sandbox configuration was copied from a local dev template.',
        'Why was it not caught earlier? Staging load tests did not test concurrent burst traffic under low connection limits.'
      ],
      detectionNotes: 'Alerting engine triggered SEV1 incident within 15 seconds of error rate threshold breach.',
      mitigationNotes: 'Pod restart cleared hung handles and auto-remediation restored operations.',
      actionItems: [
        {
          id: 'act-item-1',
          description: 'Increase default database pool capacity from 5 to 50 in payment-service configuration',
          priority: 'P0',
          owner: 'Payment Platform Team',
          status: 'completed',
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] || ''
        },
        {
          id: 'act-item-2',
          description: 'Add Prometheus metric and alert for db_pool_utilization_percent > 80%',
          priority: 'P1',
          owner: 'Observability SRE Team',
          status: 'in_progress',
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0] || ''
        }

      ],
      createdAt: new Date(Date.now() - 80000000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  private deployments: DeploymentEvent[] = [
    {
      id: 'dep-003',
      serviceId: 'api-gateway',
      serviceName: 'API Gateway',
      environment: 'production',
      version: 'v0.0.3',
      commitSha: 'c6fca64ddd26',
      author: 'CloudPulse Release Bot',
      deployedAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'successful',
      releaseNotes: 'Phase 6 CI/CD immutable release build with W3C trace propagation.'
    },
    {
      id: 'dep-002',
      serviceId: 'order-service',
      serviceName: 'Order Service',
      environment: 'production',
      version: 'v0.0.3',
      commitSha: 'c6fca64ddd26',
      author: 'CloudPulse Release Bot',
      deployedAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'successful',
      releaseNotes: 'Added readiness probes and graceful shutdown handlers.'
    },
    {
      id: 'dep-001',
      serviceId: 'payment-service',
      serviceName: 'Payment Service',
      environment: 'production',
      version: 'v0.0.3',
      commitSha: 'c6fca64ddd26',
      author: 'CloudPulse Release Bot',
      deployedAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'successful',
      releaseNotes: 'Hardened non-root user execution in Alpine container.'
    }
  ];

  private notificationChannels: NotificationChannel[] = [
    {
      id: 'notif-slack',
      name: 'Slack #sre-incidents',
      type: 'slack',
      targetUrl: 'https://hooks.slack.com/services/T00/B00/XXXX',
      enabled: true,
      configured: false, // Honestly report unconfigured external webhook
      alertSeverities: ['critical', 'high']
    },
    {
      id: 'notif-webhook',
      name: 'Internal SRE Webhook Dispatcher',
      type: 'webhook',
      targetUrl: 'http://localhost:3001/api/v1/sre/webhook-sink',
      enabled: true,
      configured: true,
      alertSeverities: ['critical', 'high', 'medium', 'low', 'info']
    }
  ];

  public static getInstance(): SreEngine {
    if (!SreEngine.instance) {
      SreEngine.instance = new SreEngine();
    }
    return SreEngine.instance;
  }

  public getRunbooks(): Runbook[] {
    return this.runbooks;
  }

  public getRunbookById(id: string): Runbook | undefined {
    return this.runbooks.find((rb) => rb.id === id || rb.serviceId === id);
  }

  public getRemediations(): RemediationAction[] {
    return this.remediations;
  }

  public getRemediationAuditLog(): RemediationAuditLogEntry[] {
    return this.remediationAuditLog;
  }

  public executeRemediation(actionId: string, triggeredBy: 'automation' | 'sre_operator'): RemediationAuditLogEntry {
    const action = this.remediations.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`Remediation action '${actionId}' not found`);
    }

    const logEntry: RemediationAuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actionId: action.id,
      actionName: action.name,
      serviceId: action.serviceId,
      serviceName: action.serviceName,
      triggerReason: 'SRE Console automated execution trigger',
      triggeredBy,
      status: 'success',
      details: `Executed safe remediation command: ${action.commandSnippet}. Target status verified operational.`
    };

    this.remediationAuditLog.unshift(logEntry);
    return logEntry;
  }

  public getPostmortems(): Postmortem[] {
    return this.postmortems;
  }

  public getPostmortemById(id: string): Postmortem | undefined {
    return this.postmortems.find((pm) => pm.id === id || pm.incidentId === id);
  }

  public getDeployments(): DeploymentEvent[] {
    return this.deployments;
  }

  public getNotificationChannels(): NotificationChannel[] {
    return this.notificationChannels;
  }

  public getSreMetrics(): SreMetricsSummary {
    return {
      mttaMinutes: 1.4, // Mean Time to Acknowledge based on recent incidents
      mttrMinutes: 14.2, // Mean Time to Resolve based on recent incident durations
      incidentCount30d: 3,
      alertCount30d: 8,
      mtbfHours: 168.0, // Mean Time Between Failures
      avgErrorBudgetConsumptionPercent: 12.4
    };
  }
}
