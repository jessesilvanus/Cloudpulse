import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EnterpriseCommandCenterEngine } from '../src/services/enterprise-command-center-engine.js';

describe('CLOUDPULSE Phase 39 Enterprise Command Center & Executive Intelligence', () => {
  const engine = EnterpriseCommandCenterEngine.getInstance();

  it('should return overall enterprise health scorecard with category score breakdown and positive trend', () => {
    const health = engine.getEnterpriseHealth();
    assert.strictEqual(health.overallHealthScore, 88.4);
    assert.strictEqual(health.status, 'OPTIMAL');
    assert.strictEqual(health.scoreTrendPercent, 1.2);
    assert.strictEqual(health.contributors.reliability, 92.0);
    assert.strictEqual(health.contributors.security, 88.0);
    assert.strictEqual(health.contributors.compliance, 84.0);
    assert.strictEqual(health.contributors.finops, 80.0);
    assert.strictEqual(health.contributors.resilience, 91.0);
    assert.strictEqual(health.contributors.infrastructure, 90.0);
  });

  it('should list enterprise risk register records categorized by compliance, security, cost, and resilience', () => {
    const risks = engine.getEnterpriseRisks();
    assert.strictEqual(risks.length, 3);

    const compRisk = risks.find((r) => r.category === 'COMPLIANCE');
    assert.ok(compRisk);
    assert.strictEqual(compRisk.severity, 'HIGH');
    assert.strictEqual(compRisk.riskScore, 78);
    assert.ok(compRisk.businessImpact.includes('NIST SP 800-53'));

    const secRisk = risks.find((r) => r.category === 'SECURITY');
    assert.ok(secRisk);
    assert.strictEqual(secRisk.severity, 'HIGH');
  });

  it('should filter enterprise risks by category and severity', () => {
    const costRisks = engine.getEnterpriseRisks('COST');
    assert.strictEqual(costRisks.length, 1);
    assert.strictEqual(costRisks[0]?.riskId, 'risk-aurora-io-growth');

    const highRisks = engine.getEnterpriseRisks(undefined, 'HIGH');
    assert.strictEqual(highRisks.length, 2);
  });

  it('should compute zero active business impact for normal production operations', () => {
    const impact = engine.getBusinessImpact();
    assert.strictEqual(impact.customerImpactSeverity, 'NONE');
    assert.strictEqual(impact.estimatedDowntimeMinutes, 0);
    assert.strictEqual(impact.estimatedRevenueImpactPerHour, 0.0);
    assert.strictEqual(impact.provenance, 'CALCULATED');
  });

  it('should provide live situation room event feed across deployments, FinOps, and compliance domains', () => {
    const events = engine.getSituationRoomEvents();
    assert.strictEqual(events.length, 3);

    const deployEvent = events.find((e) => e.domain === 'DEPLOYMENT');
    assert.ok(deployEvent);
    assert.strictEqual(deployEvent.severity, 'INFO');
    assert.ok(deployEvent.actionRoute, '/mesh');

    const compEvent = events.find((e) => e.domain === 'COMPLIANCE');
    assert.ok(compEvent);
    assert.strictEqual(compEvent.severity, 'HIGH');
  });

  it('should generate structured 10-point executive briefing grounded in telemetry', () => {
    const briefing = engine.getExecutiveBriefing();
    assert.strictEqual(briefing.briefingDate, '2026-09-02');
    assert.ok(briefing.overallHealth.includes('OPTIMAL at 88.4/100'));
    assert.strictEqual(briefing.activeIncidentsCount, 0);
    assert.ok(briefing.financialStatus.includes('$1,440.00 against $1,800.00'));
    assert.ok(briefing.resilienceStatus.includes('42 seconds'));
    assert.ok(briefing.biggestRisks.length >= 2);
    assert.ok(briefing.recommendedPriorities.length >= 2);
  });

  it('should return multi-cloud global estate inventory across AWS, Azure, and GCP', () => {
    const estate = engine.getGlobalCloudEstate();
    assert.strictEqual(estate.totalProvidersCount, 3);
    assert.strictEqual(estate.totalManagedWorkloadsCount, 24);
    assert.strictEqual(estate.providers.length, 3);

    const aws = estate.providers.find((p) => p.name === 'AWS');
    assert.ok(aws);
    assert.strictEqual(aws.runningNodesCount, 12);
  });

  it('should simulate executive scenario for regional outage failover with RTO and zero data loss', () => {
    const sim = engine.simulateExecutiveScenario({
      scenarioType: 'REGION_OUTAGE',
      targetRegion: 'us-east-1'
    });

    assert.strictEqual(sim.scenarioType, 'REGION_OUTAGE');
    assert.strictEqual(sim.estimatedRtoSeconds, 42);
    assert.strictEqual(sim.estimatedDataLossRpoSeconds, 0);
    assert.strictEqual(sim.provenance, 'SIMULATED');
    assert.ok(sim.resilienceImpact.includes('completes in 42s'));
  });

  it('should search across enterprise estate resources, workloads, risks, and opportunities', () => {
    const res = engine.queryEnterpriseSearch('order');
    assert.ok(res.totalMatchesCount >= 1);
    assert.ok(res.results.some((r) => r.name === 'order-service'));
  });

  it('should answer natural language executive queries with grounded operational evidence', () => {
    const res = engine.queryExecutiveAssistant('What is our current enterprise health score and top risks?');
    assert.strictEqual(res.status, 'OBSERVED');
    assert.ok(res.evidence.length >= 4);
    assert.ok(res.recommendation.includes('order-db-manual-snap-01'));
  });

  it('should return master enterprise command center summary aggregating all high-level KPIs', () => {
    const summary = engine.getSummary();
    assert.strictEqual(summary.health.overallHealthScore, 88.4);
    assert.strictEqual(summary.monthlySpend, 1440.0);
    assert.strictEqual(summary.realizedSavingsMonthly, 185.0);
    assert.strictEqual(summary.complianceScorePercent, 88.5);
    assert.strictEqual(summary.resilienceReadinessPercent, 91.0);
    assert.strictEqual(summary.activeIncidentsCount, 0);
  });
});
