import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import globalCommandCenterRouter from '../src/routes/global-command-center.js';
import { RealGlobalCommandCenterEngine } from '../src/services/real-global-command-center-engine.js';
import type {
  EnterpriseCloudSituation,
  ExecutiveDecision,
  EnterpriseRiskHeatmap,
  GlobalCloudHealth,
  GlobalCommandCenterOverview,
  ApiResponse
} from '@cloudpulse/shared';

describe('Phase 68: Global Cloud Command Center, Executive Intelligence & Real-Time Enterprise Control', () => {
  let engine: RealGlobalCommandCenterEngine;
  let server: Server;
  let baseUrl: string;

  before(async () => {
    engine = RealGlobalCommandCenterEngine.getInstance();
    const app = express();
    app.use(express.json());
    app.use('/api/v1/global-command-center', globalCommandCenterRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}/api/v1/global-command-center`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('1. Global Overview & Situation Awareness', () => {
    it('should generate a comprehensive executive overview with real estate metrics', () => {
      const overview = engine.getOverview('ws-production');
      assert.ok(overview, 'Overview should be defined');
      assert.ok(overview.health.overallHealthScore >= 70, 'Overall health score should be valid');
      assert.strictEqual(overview.health.overallStatus, 'DEGRADED');
      assert.ok(overview.coverage.overallCoveragePercent >= 90, 'Coverage should be >= 90%');
      assert.strictEqual(overview.freshness.overallFreshness, 'LIVE');
      assert.ok(overview.topSituations.length >= 3, 'Should contain active situations');
      assert.ok(overview.priorityDecisions.length >= 3, 'Should contain priority decisions');
      assert.ok(overview.riskHeatmapSummary.totalEntities >= 8, 'Should evaluate multi-cloud entities');
    });

    it('should sort top situations by priority (P0 first)', () => {
      const overview = engine.getOverview();
      assert.strictEqual(overview.topSituations[0].priority, 'P0');
      assert.ok(overview.criticalSituationsCount >= 1);
    });

    it('should guarantee truth-in-labeling with non-empty evidence and affected resources', () => {
      const overview = engine.getOverview();
      for (const sit of overview.topSituations) {
        assert.ok(sit.evidence.length > 0, `Situation ${sit.id} must contain evidence`);
        assert.ok(sit.affectedResources.length > 0, `Situation ${sit.id} must cite affected resources`);
        assert.ok(sit.rootCauseHypotheses.length > 0, `Situation ${sit.id} must contain root cause hypotheses`);
      }
    });

    it('should fetch overview via HTTP GET /overview', async () => {
      const res = await fetch(`${baseUrl}/overview`);
      assert.strictEqual(res.status, 200);
      const json = (await res.json()) as ApiResponse<GlobalCommandCenterOverview>;
      assert.ok(json.ok);
      assert.ok(json.data.health.overallHealthScore > 0);
      assert.strictEqual(json.data.freshness.overallFreshness, 'LIVE');
    });
  });

  describe('2. Correlated Enterprise Situations & 10-Stage Lifecycle', () => {
    it('should retrieve all situations and support multi-filter queries', () => {
      const all = engine.getSituations();
      assert.ok(all.length >= 3);

      const critical = engine.getSituations({ severity: 'CRITICAL' });
      assert.ok(critical.length >= 1);
      assert.ok(critical.every((s) => s.severity === 'CRITICAL'));

      const secSits = engine.getSituations({ category: 'SECURITY' });
      assert.ok(secSits.length >= 1);
      assert.ok(secSits.every((s) => s.category === 'SECURITY'));

      const awsSits = engine.getSituations({ provider: 'AWS' });
      assert.ok(awsSits.length >= 1);
      assert.ok(awsSits.every((s) => s.affectedProviders.includes('AWS')));
    });

    it('should retrieve detailed situation by ID with full 10-stage lifecycle timeline', () => {
      const sit = engine.getSituationById('sit-prod-001');
      assert.ok(sit);
      assert.strictEqual(sit!.id, 'sit-prod-001');
      assert.strictEqual(sit!.timeline.length, 10);

      const stages = sit!.timeline.map((t) => t.stage);
      const expectedStages = [
        'BEFORE',
        'CHANGE',
        'TRIGGER',
        'DETECTION',
        'IMPACT',
        'INVESTIGATION',
        'DECISION',
        'ACTION',
        'VERIFICATION',
        'CURRENT_STATE'
      ];
      for (const st of expectedStages) {
        assert.ok(stages.includes(st as any), `Timeline should include stage ${st}`);
      }

      assert.strictEqual(sit!.businessImpact.financialImpactPerHour, 42500);
      assert.strictEqual(sit!.businessImpact.slaBreached, true);
      assert.strictEqual(sit!.rootCauseHypotheses[0].probabilityScore, 0.88);
    });

    it('should fetch situations list and detail via HTTP API', async () => {
      const listRes = await fetch(`${baseUrl}/situations?severity=CRITICAL`);
      assert.strictEqual(listRes.status, 200);
      const listJson = (await listRes.json()) as ApiResponse<EnterpriseCloudSituation[]>;
      assert.ok(listJson.ok);
      assert.ok(listJson.data.length >= 1);

      const detailRes = await fetch(`${baseUrl}/situations/sit-prod-001`);
      assert.strictEqual(detailRes.status, 200);
      const detailJson = (await detailRes.json()) as ApiResponse<EnterpriseCloudSituation>;
      assert.ok(detailJson.ok);
      assert.strictEqual(detailJson.data.id, 'sit-prod-001');

      const notFoundRes = await fetch(`${baseUrl}/situations/non-existent-sit-999`);
      assert.strictEqual(notFoundRes.status, 404);
    });
  });

  describe('3. Multi-Cloud Risk Heatmap & Health Scoring', () => {
    it('should compute cross-sectional risk matrix across AWS, Azure, GCP, and Kubernetes', () => {
      const heatmap = engine.getRiskHeatmap();
      assert.ok(heatmap.totalEntitiesEvaluated >= 8);
      assert.ok(heatmap.criticalEntitiesCount >= 1);
      assert.ok(heatmap.highRiskEntitiesCount >= 3);

      const paymentGateway = heatmap.cells.find((c) => c.scopeId === 'srv-payment-gateway');
      assert.ok(paymentGateway);
      assert.strictEqual(paymentGateway!.compositeRiskLevel, 'CRITICAL');
      assert.strictEqual(paymentGateway!.reliabilityLevel, 'CRITICAL');
      assert.strictEqual(paymentGateway!.operationsLevel, 'CRITICAL');
    });

    it('should calculate accurate multi-domain health scores across 8 architectural pillars', () => {
      const health = engine.getGlobalHealth();
      assert.ok(health.overallHealthScore > 70);
      assert.strictEqual(health.overallStatus, 'DEGRADED');

      assert.ok(health.domains.cloudInfrastructure > 80);
      assert.ok(health.domains.security > 80);
      assert.ok(health.domains.governance > 85);
      assert.ok(health.domains.reliability > 70);
      assert.ok(health.domains.resilience > 80);
      assert.ok(health.domains.finops > 80);
      assert.ok(health.domains.observability > 90);
      assert.ok(health.domains.operations > 70);

      assert.strictEqual(health.providerHealth.AWS.status, 'DEGRADED');
      assert.strictEqual(health.providerHealth.AZURE.status, 'HEALTHY');
      assert.strictEqual(health.providerHealth.GCP.status, 'HEALTHY');
      assert.strictEqual(health.providerHealth.KUBERNETES.status, 'DEGRADED');
    });

    it('should fetch risk heatmap and health via HTTP API', async () => {
      const heatRes = await fetch(`${baseUrl}/risk-heatmap`);
      assert.strictEqual(heatRes.status, 200);
      const heatJson = (await heatRes.json()) as ApiResponse<EnterpriseRiskHeatmap>;
      assert.ok(heatJson.ok);
      assert.ok(heatJson.data.cells.length >= 8);

      const healthRes = await fetch(`${baseUrl}/health`);
      assert.strictEqual(healthRes.status, 200);
      const healthJson = (await healthRes.json()) as ApiResponse<GlobalCloudHealth>;
      assert.ok(healthJson.ok);
      assert.strictEqual(healthJson.data.overallStatus, 'DEGRADED');
    });
  });

  describe('4. Coverage, Blind-Spots & Data Freshness', () => {
    it('should report coverage intelligence with explicit blind-spots', () => {
      const coverage = engine.getCoverage();
      assert.strictEqual(coverage.overallCoverageLevel, 'FULL');
      assert.ok(coverage.overallCoveragePercent >= 90);
      assert.ok(coverage.providers.AWS.blindSpots.length > 0);
      assert.ok(coverage.telemetrySources.metricPipes);
      assert.ok(coverage.telemetrySources.logStreams);
      assert.ok(coverage.telemetrySources.traceSpans);
    });

    it('should track data freshness per cloud subsystem', () => {
      const freshness = engine.getFreshness();
      assert.strictEqual(freshness.overallFreshness, 'LIVE');
      assert.strictEqual(freshness.subsystems.AWS_CLOUDWATCH.status, 'LIVE');
      assert.strictEqual(freshness.subsystems.PROMETHEUS_METRICS.status, 'LIVE');
      assert.strictEqual(freshness.subsystems.OTLP_TRACES.status, 'LIVE');
      assert.ok(freshness.subsystems.CLOUD_TRAIL_AUDIT.latencyMs > 0);
    });

    it('should fetch coverage and freshness via HTTP API', async () => {
      const covRes = await fetch(`${baseUrl}/coverage`);
      assert.strictEqual(covRes.status, 200);
      const covJson = (await covRes.json()) as ApiResponse<any>;
      assert.ok(covJson.ok);

      const freshRes = await fetch(`${baseUrl}/freshness`);
      assert.strictEqual(freshRes.status, 200);
      const freshJson = (await freshRes.json()) as ApiResponse<any>;
      assert.ok(freshJson.ok);
      assert.strictEqual(freshJson.data.overallFreshness, 'LIVE');
    });
  });

  describe('5. Executive Decision Queue & Governed Actions', () => {
    it('should manage unified priority decisions with domain and status filtering', () => {
      const all = engine.getDecisions();
      assert.ok(all.length >= 4);

      const p0 = engine.getDecisions({ priority: 'P0' });
      assert.ok(p0.length >= 1);
      assert.strictEqual(p0[0].priority, 'P0');

      const finops = engine.getDecisions({ domain: 'FINOPS' });
      assert.ok(finops.length >= 1);
      assert.strictEqual(finops[0].domain, 'FINOPS');
    });

    it('should execute decision action transitions and audit trail', () => {
      const res = engine.executeDecisionAction('DEC-EXEC-001', 'APPROVE', 'ciso@cloudpulse.io', 'Executive failover approved');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.decision.status, 'APPROVED');
      assert.strictEqual(res.decision.decidedBy, 'ciso@cloudpulse.io');
      assert.ok(res.workflowItemId);
    });

    it('should execute decision action via HTTP POST /decisions/:id/action', async () => {
      const res = await fetch(`${baseUrl}/decisions/DEC-EXEC-003/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', actor: 'sec-lead@cloudpulse.io' })
      });
      assert.strictEqual(res.status, 200);
      const json = (await res.json()) as ApiResponse<any>;
      assert.ok(json.ok);
      assert.strictEqual(json.data.decision.status, 'APPROVED');
    });
  });

  describe('6. Universal Enterprise Search & Reporting', () => {
    it('should perform cross-domain fuzzy search across all cloud assets', () => {
      const resPayment = engine.searchGlobal('payment');
      assert.ok(resPayment.totalMatches > 0);
      assert.ok(resPayment.items.some((i) => i.title.toLowerCase().includes('payment')));

      const resIam = engine.searchGlobal('iam');
      assert.ok(resIam.totalMatches > 0);
      assert.ok(resIam.items.some((i) => i.title.toLowerCase().includes('iam') || i.type === 'IDENTITY'));
    });

    it('should generate structured executive briefings via API', async () => {
      const genRes = await fetch(`${baseUrl}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'DAILY_EXECUTIVE_BRIEFING' })
      });
      assert.strictEqual(genRes.status, 200);
      const genJson = (await genRes.json()) as ApiResponse<any>;
      assert.ok(genJson.ok);
      assert.strictEqual(genJson.data.type, 'DAILY_EXECUTIVE_BRIEFING');
      assert.ok(genJson.data.sections.length >= 2);
    });
  });

  describe('7. AI Enterprise Analyst (Strict NO-ACTION Grounded Intelligence)', () => {
    it('should answer estate health inquiries with evidence citations', () => {
      const res = engine.queryAiAnalyst('What is our global estate health and top critical risks?');
      assert.strictEqual(res.intent, 'ESTATE_HEALTH_INQUIRY');
      assert.strictEqual(res.confidence, 'HIGH');
      assert.ok(res.executiveSummary.includes('84.6'));
      assert.ok(res.evidenceCitations.length >= 3);
      assert.strictEqual(res.strictNoActionEnforced, true);
      assert.ok(res.recommendedDecisions.length >= 2);
    });

    it('should handle AI analyst queries via HTTP POST /ai-analyst', async () => {
      const res = await fetch(`${baseUrl}/ai-analyst`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'What is the root cause of the payment gateway situation?' })
      });
      assert.strictEqual(res.status, 200);
      const json = (await res.json()) as ApiResponse<any>;
      assert.ok(json.ok);
      assert.strictEqual(json.data.intent, 'SITUATION_INVESTIGATION');
      assert.strictEqual(json.data.strictNoActionEnforced, true);
    });
  });
});
