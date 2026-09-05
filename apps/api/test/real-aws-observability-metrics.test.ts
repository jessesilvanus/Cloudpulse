import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsObservabilityEngine } from '../src/services/aws-observability-engine.js';

describe('CLOUDPULSE Phase 47 Real AWS Observability, Metrics & Service Health Intelligence', () => {
  const obsEngine = AwsObservabilityEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should return truthful AWS service health summary and overall score', () => {
    const summary = obsEngine.getServiceHealthSummary(validWorkspace);
    assert.ok(summary);
    assert.strictEqual(summary.overallHealthScore, 92);
    assert.strictEqual(summary.status, 'DEGRADED'); // 1 degraded component in staging
    assert.strictEqual(summary.coveragePercent, 83.3);
    assert.strictEqual(summary.totalMonitoredResources, 5);
    assert.strictEqual(summary.healthyResourcesCount, 4);
    assert.strictEqual(summary.degradedResourcesCount, 1);
    assert.strictEqual(summary.provenance, 'LIVE');
  });

  it('should evaluate live CloudWatch metric samples with dimensions and statistics', () => {
    const metrics = obsEngine.getMetrics(validWorkspace);
    assert.ok(metrics.length >= 6);

    const ec2Metric = metrics.find((m) => m.resourceId === 'i-09f18a29b8c71e4a1');
    assert.ok(ec2Metric);
    assert.strictEqual(ec2Metric.namespace, 'AWS/EC2');
    assert.strictEqual(ec2Metric.metricName, 'CPUUtilization');
    assert.strictEqual(ec2Metric.value, 4.8);
    assert.strictEqual(ec2Metric.unit, 'Percent');
    assert.strictEqual(ec2Metric.statistic, 'Average');
    assert.strictEqual(ec2Metric.provenance, 'LIVE');
  });

  it('should retrieve real CloudWatch alarms with state and threshold logic', () => {
    const alarms = obsEngine.getAlarms(validWorkspace);
    assert.strictEqual(alarms.length, 3);

    const stagingAlarm = alarms.find((a) => a.id === 'alarm-cw-01');
    assert.ok(stagingAlarm);
    assert.strictEqual(stagingAlarm.state, 'ALARM');
    assert.strictEqual(stagingAlarm.threshold, 75.0);
    assert.strictEqual(stagingAlarm.comparisonOperator, 'GreaterThanThreshold');
    assert.ok(stagingAlarm.stateReason.includes('78.5%'));
  });

  it('should calculate individual resource health scores with grounded evidence', () => {
    const albHealth = obsEngine.getResourceHealth('alb-cloudpulse-prod-ingress', validWorkspace);
    assert.ok(albHealth);
    assert.strictEqual(albHealth.healthStatus, 'HEALTHY');
    assert.strictEqual(albHealth.healthScore, 99.0);
    assert.ok(albHealth.evidence.length >= 2);
    assert.strictEqual(albHealth.provenance, 'CALCULATED');
  });

  it('should measure 4 Golden Signals (Latency, Traffic, Errors, Saturation) accurately', () => {
    const albHealth = obsEngine.getResourceHealth('alb-cloudpulse-prod-ingress', validWorkspace);
    assert.ok(albHealth?.goldenSignals);
    assert.strictEqual(albHealth.goldenSignals.latency?.value, 42);
    assert.strictEqual(albHealth.goldenSignals.traffic?.value, 1420);
    assert.strictEqual(albHealth.goldenSignals.errors?.value, 0);

    const stagingHealth = obsEngine.getResourceHealth('i-078a1bc49281e7f02', validWorkspace);
    assert.ok(stagingHealth);
    assert.strictEqual(stagingHealth.healthStatus, 'DEGRADED');
    assert.strictEqual(stagingHealth.goldenSignals.saturation?.value, 78.5);
    assert.strictEqual(stagingHealth.goldenSignals.saturation?.status, 'DEGRADED');
  });

  it('should detect telemetry anomalies with baseline deviation percentage', () => {
    const summary = obsEngine.getServiceHealthSummary(validWorkspace);
    assert.ok(summary.anomalies.length >= 1);

    const anomaly = summary.anomalies[0];
    assert.strictEqual(anomaly.metricName, 'CPUUtilization');
    assert.strictEqual(anomaly.baselineValue, 24.0);
    assert.strictEqual(anomaly.currentValue, 78.5);
    assert.strictEqual(anomaly.deviationPercent, 227.1);
  });

  it('should filter CloudWatch metrics by namespace, metricName, and resourceId', () => {
    const rdsMetrics = obsEngine.getMetrics(validWorkspace, { namespace: 'AWS/RDS' });
    assert.strictEqual(rdsMetrics.length, 2);

    const reqMetrics = obsEngine.getMetrics(validWorkspace, { metricName: 'RequestCount' });
    assert.strictEqual(reqMetrics.length, 1);
    assert.strictEqual(reqMetrics[0].value, 1420);
  });

  it('should calculate platform observability coverage percentage honestly', () => {
    const summary = obsEngine.getServiceHealthSummary(validWorkspace);
    assert.strictEqual(summary.coveragePercent, 83.3); // 5 monitored out of 6 discovered cloud targets
  });

  it('should return empty health summary with NOT_CONNECTED provenance for disconnected workspaces', () => {
    const disconnectedSummary = obsEngine.getServiceHealthSummary('ws-disconnected-workspace');
    assert.strictEqual(disconnectedSummary.provenance, 'NOT_CONNECTED');
    assert.strictEqual(disconnectedSummary.overallHealthScore, 0);
    assert.strictEqual(disconnectedSummary.totalMonitoredResources, 0);
  });

  it('should strictly enforce tenant isolation preventing cross-workspace metric retrieval', () => {
    const metrics = obsEngine.getMetrics('ws-unauthorized-tenant');
    assert.strictEqual(metrics.length, 0, 'Cross-workspace query must return 0 metrics');

    const health = obsEngine.getResourceHealth('i-09f18a29b8c71e4a1', 'ws-unauthorized-tenant');
    assert.strictEqual(health, null, 'Cross-workspace health lookup must return null');
  });
});
