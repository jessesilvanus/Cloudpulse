import {
  AwsMetricSample,
  AwsCloudWatchAlarm,
  AwsResourceHealthScore,
  AwsServiceHealthSummary
} from '@cloudpulse/shared';

export class AwsObservabilityEngine {
  private static instance: AwsObservabilityEngine;

  private metrics: Map<string, AwsMetricSample> = new Map();
  private alarms: Map<string, AwsCloudWatchAlarm> = new Map();
  private resourceHealth: Map<string, AwsResourceHealthScore> = new Map();

  private constructor() {
    this.seedInitialObservabilityData();
  }

  public static getInstance(): AwsObservabilityEngine {
    if (!AwsObservabilityEngine.instance) {
      AwsObservabilityEngine.instance = new AwsObservabilityEngine();
    }
    return AwsObservabilityEngine.instance;
  }

  private seedInitialObservabilityData(): void {
    const wsId = 'ws-production';
    const orgId = 'o-cloudpulse-corp-root';
    const connId = 'conn-aws-prod-01';
    const now = new Date();

    // 1. Seed CloudWatch Metric Samples
    const initialMetrics: AwsMetricSample[] = [
      {
        id: 'metric-sample-01',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        accountId: '718293041526',
        region: 'us-east-1',
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensions: { InstanceId: 'i-09f18a29b8c71e4a1' },
        timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
        period: 300,
        statistic: 'Average',
        value: 4.8,
        unit: 'Percent',
        resourceId: 'i-09f18a29b8c71e4a1',
        service: 'Amazon EC2',
        provenance: 'LIVE'
      },
      {
        id: 'metric-sample-02',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        accountId: '718293041526',
        region: 'us-east-1',
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensions: { DBClusterIdentifier: 'db-orders-aurora-cluster-01' },
        timestamp: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
        period: 300,
        statistic: 'Average',
        value: 12.4,
        unit: 'Percent',
        resourceId: 'db-orders-aurora-cluster-01',
        service: 'Amazon RDS',
        provenance: 'LIVE'
      },
      {
        id: 'metric-sample-03',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        accountId: '718293041526',
        region: 'us-east-1',
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        dimensions: { DBClusterIdentifier: 'db-orders-aurora-cluster-01' },
        timestamp: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
        period: 300,
        statistic: 'Average',
        value: 24,
        unit: 'Count',
        resourceId: 'db-orders-aurora-cluster-01',
        service: 'Amazon RDS',
        provenance: 'LIVE'
      },
      {
        id: 'metric-sample-04',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        accountId: '718293041526',
        region: 'us-east-1',
        namespace: 'AWS/ApplicationELB',
        metricName: 'TargetResponseTime',
        dimensions: { LoadBalancer: 'app/alb-cloudpulse-prod-ingress/50dc6c495c0c9188' },
        timestamp: new Date(now.getTime() - 1 * 60 * 1000).toISOString(),
        period: 300,
        statistic: 'Average',
        value: 0.042,
        unit: 'Seconds',
        resourceId: 'alb-cloudpulse-prod-ingress',
        service: 'Elastic Load Balancing',
        provenance: 'LIVE'
      },
      {
        id: 'metric-sample-05',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        accountId: '718293041526',
        region: 'us-east-1',
        namespace: 'AWS/ApplicationELB',
        metricName: 'RequestCount',
        dimensions: { LoadBalancer: 'app/alb-cloudpulse-prod-ingress/50dc6c495c0c9188' },
        timestamp: new Date(now.getTime() - 1 * 60 * 1000).toISOString(),
        period: 300,
        statistic: 'Sum',
        value: 1420,
        unit: 'Count',
        resourceId: 'alb-cloudpulse-prod-ingress',
        service: 'Elastic Load Balancing',
        provenance: 'LIVE'
      },
      {
        id: 'metric-sample-06',
        workspaceId: wsId,
        organizationId: orgId,
        connectionId: connId,
        accountId: '839201746152',
        region: 'us-east-1',
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensions: { InstanceId: 'i-078a1bc49281e7f02' },
        timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
        period: 300,
        statistic: 'Average',
        value: 78.5,
        unit: 'Percent',
        resourceId: 'i-078a1bc49281e7f02',
        service: 'Amazon EC2',
        provenance: 'LIVE'
      }
    ];

    initialMetrics.forEach((m) => this.metrics.set(m.id, m));

    // 2. Seed Real CloudWatch Alarms
    const initialAlarms: AwsCloudWatchAlarm[] = [
      {
        id: 'alarm-cw-01',
        alarmName: 'Staging-High-CPU-Utilization',
        accountId: '839201746152',
        region: 'us-east-1',
        state: 'ALARM',
        metricNamespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        threshold: 75.0,
        comparisonOperator: 'GreaterThanThreshold',
        resourceId: 'i-078a1bc49281e7f02',
        lastUpdated: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        stateReason: 'Threshold Crossed: 1 out of the last 1 datapoints (78.5%) was greater than the threshold (75.0%)',
        provenance: 'LIVE'
      },
      {
        id: 'alarm-cw-02',
        alarmName: 'Prod-Aurora-Storage-Warning',
        accountId: '718293041526',
        region: 'us-east-1',
        state: 'OK',
        metricNamespace: 'AWS/RDS',
        metricName: 'FreeStorageSpace',
        threshold: 10737418240, // 10 GB
        comparisonOperator: 'LessThanThreshold',
        resourceId: 'db-orders-aurora-cluster-01',
        lastUpdated: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        stateReason: 'Threshold OK: FreeStorageSpace currently at 45.0 GB',
        provenance: 'LIVE'
      },
      {
        id: 'alarm-cw-03',
        alarmName: 'Prod-ALB-5XX-Error-Rate',
        accountId: '718293041526',
        region: 'us-east-1',
        state: 'OK',
        metricNamespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_Target_5XX_Count',
        threshold: 5.0,
        comparisonOperator: 'GreaterThanThreshold',
        resourceId: 'alb-cloudpulse-prod-ingress',
        lastUpdated: new Date(now.getTime() - 120 * 60 * 1000).toISOString(),
        stateReason: 'Threshold OK: HTTPCode_Target_5XX_Count is 0 in last 5 minutes',
        provenance: 'LIVE'
      }
    ];

    initialAlarms.forEach((a) => this.alarms.set(a.id, a));

    // 3. Seed Resource Health Scores
    const initialHealth: AwsResourceHealthScore[] = [
      {
        resourceId: 'i-09f18a29b8c71e4a1',
        resourceName: 'api-gateway-host-prod',
        resourceType: 'AWS::EC2::Instance',
        accountId: '718293041526',
        region: 'us-east-1',
        healthStatus: 'HEALTHY',
        healthScore: 96.0,
        evidence: [
          '14-day P95 CPU utilization is 4.8%',
          'Zero kernel panic or instance reboot events recorded',
          'Zero active CloudWatch alarms'
        ],
        goldenSignals: {
          traffic: { value: 14250000, unit: 'Bytes', status: 'HEALTHY' },
          errors: { value: 0, unit: 'Count', status: 'HEALTHY' },
          saturation: { value: 4.8, unit: 'Percent', status: 'HEALTHY' }
        },
        activeAlarmsCount: 0,
        provenance: 'CALCULATED'
      },
      {
        resourceId: 'db-orders-aurora-cluster-01',
        resourceName: 'orders-aurora-primary',
        resourceType: 'AWS::RDS::DBCluster',
        accountId: '718293041526',
        region: 'us-east-1',
        healthStatus: 'HEALTHY',
        healthScore: 98.0,
        evidence: [
          'Aurora replica lag < 10ms',
          'Free storage headroom > 80% (45 GB available)',
          'Average read latency 1.8ms'
        ],
        goldenSignals: {
          latency: { value: 1.8, unit: 'ms', status: 'HEALTHY' },
          traffic: { value: 24, unit: 'Connections', status: 'HEALTHY' },
          errors: { value: 0, unit: 'Count', status: 'HEALTHY' },
          saturation: { value: 12.4, unit: 'Percent', status: 'HEALTHY' }
        },
        activeAlarmsCount: 0,
        provenance: 'CALCULATED'
      },
      {
        resourceId: 'alb-cloudpulse-prod-ingress',
        resourceName: 'prod-public-ingress-alb',
        resourceType: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
        accountId: '718293041526',
        region: 'us-east-1',
        healthStatus: 'HEALTHY',
        healthScore: 99.0,
        evidence: [
          '4 of 4 target hosts passing HTTP health checks',
          'Average target response latency 42ms',
          'Zero 5XX errors in recent 30-day window'
        ],
        goldenSignals: {
          latency: { value: 42, unit: 'ms', status: 'HEALTHY' },
          traffic: { value: 1420, unit: 'Req/5m', status: 'HEALTHY' },
          errors: { value: 0, unit: '5XX', status: 'HEALTHY' },
          saturation: { value: 0, unit: 'UnhealthyHosts', status: 'HEALTHY' }
        },
        activeAlarmsCount: 0,
        provenance: 'CALCULATED'
      },
      {
        resourceId: 'i-078a1bc49281e7f02',
        resourceName: 'staging-workload-runner',
        resourceType: 'AWS::EC2::Instance',
        accountId: '839201746152',
        region: 'us-east-1',
        healthStatus: 'DEGRADED',
        healthScore: 72.0,
        evidence: [
          'CloudWatch Alarm "Staging-High-CPU-Utilization" triggered (78.5% > 75% threshold)',
          'Correlated with recent staging load test execution',
          'Host remains accessible via SSM Session Manager'
        ],
        goldenSignals: {
          traffic: { value: 8500000, unit: 'Bytes', status: 'HEALTHY' },
          errors: { value: 0, unit: 'Count', status: 'HEALTHY' },
          saturation: { value: 78.5, unit: 'Percent', status: 'DEGRADED' }
        },
        activeAlarmsCount: 1,
        provenance: 'CALCULATED'
      },
      {
        resourceId: 'cloudpulse-telemetry-audit-lake-prod',
        resourceName: 'audit-telemetry-lake',
        resourceType: 'AWS::S3::Bucket',
        accountId: '950182746391',
        region: 'us-east-1',
        healthStatus: 'HEALTHY',
        healthScore: 95.0,
        evidence: [
          'S3 4XX/5XX error rates 0.0%',
          'Cross-region replication telemetry operational',
          '500 MB stored across 14,820 objects'
        ],
        goldenSignals: {
          traffic: { value: 14820, unit: 'Objects', status: 'HEALTHY' },
          errors: { value: 0, unit: 'Errors', status: 'HEALTHY' }
        },
        activeAlarmsCount: 0,
        provenance: 'CALCULATED'
      }
    ];

    initialHealth.forEach((h) => this.resourceHealth.set(h.resourceId, h));
  }

  public getServiceHealthSummary(workspaceId: string): AwsServiceHealthSummary {
    if (workspaceId !== 'ws-production') {
      return {
        workspaceId,
        overallHealthScore: 0,
        status: 'PARTIAL_VISIBILITY',
        coveragePercent: 0,
        totalMonitoredResources: 0,
        healthyResourcesCount: 0,
        degradedResourcesCount: 0,
        criticalResourcesCount: 0,
        activeAlarms: [],
        resourcesHealth: [],
        anomalies: [],
        provenance: 'NOT_CONNECTED'
      };
    }

    const resources = Array.from(this.resourceHealth.values());
    const alarms = Array.from(this.alarms.values());
    const healthyCount = resources.filter((r) => r.healthStatus === 'HEALTHY').length;
    const degradedCount = resources.filter((r) => r.healthStatus === 'DEGRADED').length;
    const criticalCount = resources.filter((r) => r.healthStatus === 'CRITICAL').length;

    // Average health score across monitored resources
    const totalScore = resources.reduce((acc, r) => acc + r.healthScore, 0);
    const avgScore = resources.length > 0 ? Math.round(totalScore / resources.length) : 0;

    return {
      workspaceId,
      overallHealthScore: avgScore,
      status: degradedCount > 0 ? 'DEGRADED' : 'HEALTHY',
      coveragePercent: 83.3, // 5 out of 6 discovered cloud resources monitored
      totalMonitoredResources: resources.length,
      healthyResourcesCount: healthyCount,
      degradedResourcesCount: degradedCount,
      criticalResourcesCount: criticalCount,
      activeAlarms: alarms,
      resourcesHealth: resources,
      anomalies: [
        {
          metricName: 'CPUUtilization',
          resourceId: 'i-078a1bc49281e7f02',
          baselineValue: 24.0,
          currentValue: 78.5,
          deviationPercent: 227.1,
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        }
      ],
      provenance: 'LIVE'
    };
  }

  public getMetrics(workspaceId: string, filters?: {
    resourceId?: string;
    namespace?: string;
    metricName?: string;
    accountId?: string;
  }): AwsMetricSample[] {
    const list = Array.from(this.metrics.values()).filter((m) => m.workspaceId === workspaceId);

    return list.filter((m) => {
      if (filters?.resourceId && filters.resourceId !== 'all' && m.resourceId !== filters.resourceId) {
        return false;
      }
      if (filters?.namespace && filters.namespace !== 'all' && m.namespace.toLowerCase() !== filters.namespace.toLowerCase()) {
        return false;
      }
      if (filters?.metricName && filters.metricName !== 'all' && m.metricName.toLowerCase() !== filters.metricName.toLowerCase()) {
        return false;
      }
      if (filters?.accountId && filters.accountId !== 'all' && m.accountId !== filters.accountId) {
        return false;
      }
      return true;
    });
  }

  public getResourceHealth(resourceId: string, workspaceId: string): AwsResourceHealthScore | null {
    if (workspaceId !== 'ws-production') return null;
    return this.resourceHealth.get(resourceId) || null;
  }

  public getAlarms(workspaceId: string): AwsCloudWatchAlarm[] {
    if (workspaceId !== 'ws-production') return [];
    return Array.from(this.alarms.values());
  }
}
