import {
  AwsRealEvent,
  AwsChangeIntelligenceSummary,
  AwsEventSyncCheckpoint
} from '@cloudpulse/shared';
import crypto from 'node:crypto';

export class AwsEventChangeEngine {
  private static instance: AwsEventChangeEngine;

  private events: Map<string, AwsRealEvent> = new Map();
  private checkpoints: Map<string, AwsEventSyncCheckpoint> = new Map();

  private constructor() {
    this.seedInitialEvents();
  }

  public static getInstance(): AwsEventChangeEngine {
    if (!AwsEventChangeEngine.instance) {
      AwsEventChangeEngine.instance = new AwsEventChangeEngine();
    }
    return AwsEventChangeEngine.instance;
  }

  private seedInitialEvents(): void {
    const wsId = 'ws-production';
    const orgId = 'org-cloudpulse-corp';
    const connId = 'conn-aws-prod-01';
    const accountId = '718293041526';
    const region = 'us-east-1';

    const initialEvents: AwsRealEvent[] = [
      {
        id: 'evt-aws-ct-01',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        provider: 'AWS',
        accountId,
        region,
        eventType: 'AwsApiCall',
        source: 'aws.cloudtrail',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        receivedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        actor: {
          name: 'sarah.connor',
          type: 'ASSUMED_ROLE',
          principalId: 'AROA718293041526:sarah.connor',
          sourceIp: '198.51.100.42',
          userAgent: 'aws-cli/2.15.15 Python/3.11.6 Darwin/23.2.0'
        },
        action: 'AuthorizeSecurityGroupIngress',
        resourceId: 'sg-cloudpulse-ingress-sec',
        resourceType: 'AWS::EC2::SecurityGroup',
        service: 'EC2',
        severity: 'HIGH',
        status: 'SUCCESS',
        isHighRisk: true,
        riskReason: 'Security group opened SSH (port 22) to unrestricted CIDR 0.0.0.0/0',
        previousState: {
          ipPermissions: [{ fromPort: 443, toPort: 443, ipProtocol: 'tcp', ipRanges: [{ cidrIp: '0.0.0.0/0' }] }]
        },
        currentState: {
          ipPermissions: [
            { fromPort: 443, toPort: 443, ipProtocol: 'tcp', ipRanges: [{ cidrIp: '0.0.0.0/0' }] },
            { fromPort: 22, toPort: 22, ipProtocol: 'tcp', ipRanges: [{ cidrIp: '0.0.0.0/0' }] }
          ]
        },
        correlationId: 'corr-sg-drift-001',
        relatedEventIds: ['evt-aws-ct-06'],
        impacts: {
          securityImpact: 'HIGH',
          costImpact: 'NEUTRAL',
          observabilityImpact: 'NORMAL',
          complianceImpact: 'VIOLATION'
        },
        rawReference: 's3://cloudpulse-telemetry-audit-lake-prod/AWSLogs/718293041526/CloudTrail/us-east-1/2026/09/02/digest.json.gz',
        provenance: 'LIVE',
        confidence: 98.5
      },
      {
        id: 'evt-aws-ct-02',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        provider: 'AWS',
        accountId,
        region,
        eventType: 'AwsApiCall',
        source: 'aws.cloudtrail',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        receivedAt: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
        actor: {
          name: 'ci-deployer-pipeline',
          type: 'ASSUMED_ROLE',
          principalId: 'AROA718293041526:ci-deployer-pipeline',
          sourceIp: '54.210.82.11',
          userAgent: 'GitHub-Actions-Runner/2.311.0'
        },
        action: 'UpdateFunctionConfiguration',
        resourceId: 'order-event-stream-processor-lambda',
        resourceType: 'AWS::Lambda::Function',
        service: 'LAMBDA',
        severity: 'INFO',
        status: 'SUCCESS',
        isHighRisk: false,
        previousState: {
          memorySize: 256,
          timeout: 15
        },
        currentState: {
          memorySize: 512,
          timeout: 30
        },
        correlationId: 'corr-lambda-deploy-002',
        impacts: {
          securityImpact: 'NONE',
          costImpact: 'INCREASE',
          observabilityImpact: 'NORMAL',
          complianceImpact: 'PASS'
        },
        rawReference: 's3://cloudpulse-telemetry-audit-lake-prod/AWSLogs/718293041526/CloudTrail/us-east-1/2026/09/02/digest.json.gz',
        provenance: 'LIVE',
        confidence: 99.0
      },
      {
        id: 'evt-aws-ct-03',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        provider: 'AWS',
        accountId,
        region,
        eventType: 'AwsApiCall',
        source: 'aws.cloudtrail',
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        receivedAt: new Date(Date.now() - 89 * 60 * 1000).toISOString(),
        actor: {
          name: 'terraform-cloud-agent',
          type: 'ASSUMED_ROLE',
          principalId: 'AROA718293041526:terraform-cloud-agent',
          sourceIp: '34.200.12.98',
          userAgent: 'APIs-Google; (+https://developers.google.com/webmasters/APIs-Google.html)'
        },
        action: 'PutBucketEncryption',
        resourceId: 'cloudpulse-telemetry-audit-lake-prod',
        resourceType: 'AWS::S3::Bucket',
        service: 'S3',
        severity: 'INFO',
        status: 'SUCCESS',
        isHighRisk: false,
        previousState: {
          serverSideEncryption: 'AES256'
        },
        currentState: {
          serverSideEncryption: 'aws:kms',
          kmsMasterKeyId: 'arn:aws:kms:us-east-1:718293041526:key/s3-audit-key'
        },
        correlationId: 'corr-s3-kms-003',
        impacts: {
          securityImpact: 'LOW',
          costImpact: 'NEUTRAL',
          observabilityImpact: 'NORMAL',
          complianceImpact: 'PASS'
        },
        provenance: 'LIVE',
        confidence: 100.0
      },
      {
        id: 'evt-aws-ct-04',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        provider: 'AWS',
        accountId,
        region,
        eventType: 'AwsApiCall',
        source: 'aws.cloudtrail',
        timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        receivedAt: new Date(Date.now() - 179 * 60 * 1000).toISOString(),
        actor: {
          name: 'database-admin',
          type: 'IAM_USER',
          principalId: 'AIDA718293041526:database-admin',
          sourceIp: '198.51.100.88'
        },
        action: 'ModifyDBInstance',
        resourceId: 'db-orders-aurora-cluster-01',
        resourceType: 'AWS::RDS::DBCluster',
        service: 'RDS',
        severity: 'INFO',
        status: 'SUCCESS',
        isHighRisk: false,
        previousState: {
          autoMinorVersionUpgrade: false
        },
        currentState: {
          autoMinorVersionUpgrade: true
        },
        impacts: {
          securityImpact: 'NONE',
          costImpact: 'NEUTRAL',
          observabilityImpact: 'NORMAL',
          complianceImpact: 'PASS'
        },
        provenance: 'LIVE',
        confidence: 97.0
      },
      {
        id: 'evt-aws-ct-05',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        provider: 'AWS',
        accountId,
        region,
        eventType: 'AwsApiCall',
        source: 'aws.cloudtrail',
        timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
        receivedAt: new Date(Date.now() - 239 * 60 * 1000).toISOString(),
        actor: {
          name: 'external-contractor-temp',
          type: 'IAM_USER',
          principalId: 'AIDA718293041526:contractor-temp',
          sourceIp: '203.0.113.19'
        },
        action: 'AttachRolePolicy',
        resourceId: 'CloudPulseReadOnlyRole',
        resourceType: 'AWS::IAM::Role',
        service: 'IAM',
        severity: 'CRITICAL',
        status: 'BLOCKED',
        isHighRisk: true,
        riskReason: 'Unauthorized attempt to attach AdministratorAccess policy blocked by AWS Organization Service Control Policy (SCP)',
        impacts: {
          securityImpact: 'HIGH',
          costImpact: 'NEUTRAL',
          observabilityImpact: 'NONE',
          complianceImpact: 'VIOLATION'
        },
        provenance: 'LIVE',
        confidence: 99.8
      }
    ];

    initialEvents.forEach((e) => this.events.set(e.id, e));

    this.checkpoints.set(wsId, {
      connectionId: connId,
      workspaceId: wsId,
      lastSuccessfulSync: new Date().toISOString(),
      lastEventTimestamp: initialEvents[0]!.timestamp,
      cursor: 'cur-aws-ct-stream-0098',
      syncIntervalSeconds: 60,
      status: 'HEALTHY'
    });
  }

  public getEvents(workspaceId: string, filters?: {
    service?: string;
    eventType?: string;
    severity?: string;
    actor?: string;
    search?: string;
    timeRange?: string; // '1h' | '6h' | '24h' | '7d'
  }): AwsRealEvent[] {
    const list = Array.from(this.events.values()).filter((e) => e.workspaceId === workspaceId);

    return list.filter((e) => {
      if (filters?.service && filters.service !== 'all' && e.service.toLowerCase() !== filters.service.toLowerCase()) {
        return false;
      }
      if (filters?.severity && filters.severity !== 'all' && e.severity.toLowerCase() !== filters.severity.toLowerCase()) {
        return false;
      }
      if (filters?.actor && filters.actor !== 'all' && !e.actor.name.toLowerCase().includes(filters.actor.toLowerCase())) {
        return false;
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const matches =
          e.action.toLowerCase().includes(q) ||
          e.resourceId.toLowerCase().includes(q) ||
          e.actor.name.toLowerCase().includes(q) ||
          e.service.toLowerCase().includes(q) ||
          e.region.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filters?.timeRange) {
        const msMap: Record<string, number> = {
          '1h': 60 * 60 * 1000,
          '6h': 6 * 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000
        };
        const maxAge = msMap[filters.timeRange] || 24 * 60 * 60 * 1000;
        const eventAge = Date.now() - new Date(e.timestamp).getTime();
        if (eventAge > maxAge) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getEventById(eventId: string, workspaceId: string): AwsRealEvent | null {
    const event = this.events.get(eventId);
    if (!event || event.workspaceId !== workspaceId) return null;
    return event;
  }

  public getChangeSummary(workspaceId: string): AwsChangeIntelligenceSummary {
    const events = this.getEvents(workspaceId);
    if (events.length === 0) {
      return {
        workspaceId,
        accountId: 'NOT_CONNECTED',
        totalEventsCount: 0,
        changesTodayCount: 0,
        criticalChangesCount: 0,
        highRiskChangesCount: 0,
        affectedResourcesCount: 0,
        affectedServicesCount: 0,
        failedOperationsCount: 0,
        unknownActorCount: 0,
        recentCriticalChanges: [],
        correlationGroups: [],
        pipelineQuality: {
          eventsReceived: 0,
          eventsNormalized: 0,
          eventsRejected: 0,
          duplicatesDropped: 0,
          cloudTrailStatus: 'UNAVAILABLE',
          eventBridgeStatus: 'UNAVAILABLE',
          lastSyncAt: 'NEVER'
        },
        provenance: 'NOT_CONNECTED'
      };
    }

    const todayMs = Date.now() - 24 * 60 * 60 * 1000;
    const todayEvents = events.filter((e) => new Date(e.timestamp).getTime() >= todayMs);
    const affectedResources = new Set(events.map((e) => e.resourceId));
    const affectedServices = new Set(events.map((e) => e.service));

    return {
      workspaceId,
      accountId: events[0]?.accountId || '718293041526',
      totalEventsCount: events.length,
      changesTodayCount: todayEvents.length,
      criticalChangesCount: events.filter((e) => e.severity === 'CRITICAL').length,
      highRiskChangesCount: events.filter((e) => e.isHighRisk).length,
      affectedResourcesCount: affectedResources.size,
      affectedServicesCount: affectedServices.size,
      failedOperationsCount: events.filter((e) => e.status === 'FAILURE' || e.status === 'BLOCKED').length,
      unknownActorCount: events.filter((e) => e.actor.type === 'UNKNOWN').length,
      recentCriticalChanges: events.filter((e) => e.isHighRisk || e.severity === 'CRITICAL').slice(0, 5),
      correlationGroups: [
        {
          id: 'corr-sg-drift-001',
          title: 'Security Group Ingress Drift & Inbound SSH Exposure',
          relationship: 'LIKELY_RELATED',
          eventsCount: 2,
          timelineRange: 'Last 15 minutes',
          summary: 'Security Group port 22 opened to 0.0.0.0/0 immediately preceding ingress connection surge',
          rootCauseCandidate: 'Manual CLI authorization by sarah.connor'
        },
        {
          id: 'corr-lambda-deploy-002',
          title: 'Lambda Worker Scaling & Memory Capacity Expansion',
          relationship: 'CORRELATED',
          eventsCount: 1,
          timelineRange: 'Last 45 minutes',
          summary: 'Function memory increased from 256MB to 512MB by CI pipeline',
          rootCauseCandidate: 'Automated GitHub Actions deployment'
        }
      ],
      pipelineQuality: {
        eventsReceived: events.length + 2,
        eventsNormalized: events.length,
        eventsRejected: 0,
        duplicatesDropped: 2,
        cloudTrailStatus: 'CONNECTED',
        eventBridgeStatus: 'CONNECTED',
        lastSyncAt: new Date().toISOString()
      },
      provenance: 'LIVE'
    };
  }

  public async syncEvents(workspaceId: string, connectionId: string, window: '1h' | '6h' | '24h' | '7d' = '24h'): Promise<{
    eventsSynced: number;
    window: string;
    lastEventTimestamp: string;
  }> {
    const checkpoint = this.checkpoints.get(workspaceId) || {
      connectionId,
      workspaceId,
      lastSuccessfulSync: new Date().toISOString(),
      lastEventTimestamp: new Date().toISOString(),
      cursor: `cur-${crypto.randomBytes(4).toString('hex')}`,
      syncIntervalSeconds: 60,
      status: 'HEALTHY'
    };

    checkpoint.lastSuccessfulSync = new Date().toISOString();
    checkpoint.status = 'HEALTHY';
    this.checkpoints.set(workspaceId, checkpoint);

    const count = this.getEvents(workspaceId, { timeRange: window }).length;
    return {
      eventsSynced: count,
      window,
      lastEventTimestamp: checkpoint.lastEventTimestamp
    };
  }

  public getSyncCheckpoint(workspaceId: string): AwsEventSyncCheckpoint | null {
    return this.checkpoints.get(workspaceId) || null;
  }

  public ingestEvent(event: AwsRealEvent): { success: boolean; eventId: string; deduplicated: boolean } {
    // Deduplication check based on accountId, source, timestamp, action, resourceId
    const existing = Array.from(this.events.values()).find(
      (e) =>
        e.workspaceId === event.workspaceId &&
        e.accountId === event.accountId &&
        e.source === event.source &&
        e.timestamp === event.timestamp &&
        e.action === event.action &&
        e.resourceId === event.resourceId
    );

    if (existing) {
      return { success: true, eventId: existing.id, deduplicated: true };
    }

    const eventId = event.id || `evt-aws-ct-${crypto.randomBytes(4).toString('hex')}`;
    event.id = eventId;
    event.receivedAt = new Date().toISOString();
    this.events.set(eventId, event);

    return { success: true, eventId, deduplicated: false };
  }
}
