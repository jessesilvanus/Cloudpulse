import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import platformRouter from '../src/routes/platform.js';
import healthRouter from '../src/routes/health.js';
import { RealCloudPulsePlatformEngine } from '../src/services/real-cloudpulse-platform-engine.js';
import { platformRateLimiter } from '../src/middleware/platform-rate-limiter.js';
import { requireTenantIsolation, guardTenantResource } from '../src/middleware/tenant-isolation.js';
import { standardizedErrorHandler } from '../src/middleware/error-handler.js';
import type {
  PlatformHealthCheckResult,
  PlatformOverviewSummary,
  PlatformMetrics,
  PlatformSlo,
  PlatformSyncWorkerStatus,
  PlatformCostRecord,
  PlatformRateLimitStatus,
  PlatformStandardError
} from '@cloudpulse/shared';

describe('Phase 69: Real CloudPulse Production Platform, Deployment, Observability & Infrastructure Hardening', () => {
  let engine: RealCloudPulsePlatformEngine;
  let server: Server;
  let baseUrl: string;

  before(async () => {
    engine = RealCloudPulsePlatformEngine.getInstance();
    const app = express();
    app.use(express.json());

    // Mount routers
    app.use('/health', healthRouter);
    app.use('/api/v1/platform', platformRouter);

    // Test route for rate limiting
    app.get('/test-rate-limit/auth', platformRateLimiter('AUTH'), (req, res) => {
      res.json({ success: true, message: 'auth ok' });
    });

    // Test route for tenant isolation
    app.get('/test-tenant-scoped', requireTenantIsolation, (req, res) => {
      res.json({ success: true, tenantId: (req as any).tenantId });
    });

    // Test route for tenant resource guard
    app.get('/test-tenant-resource/:tenantId', requireTenantIsolation, (req, res, next) => {
      try {
        guardTenantResource(req, req.params.tenantId);
        res.json({ success: true, authorized: true });
      } catch (err) {
        next(err);
      }
    });

    // Test route for error handling
    app.get('/test-error', (req, res, next) => {
      const err: any = new Error('Database pool timeout error');
      err.statusCode = 503;
      err.code = 'ERR_DEPENDENCY_UNAVAILABLE';
      next(err);
    });

    app.use(standardizedErrorHandler);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('1. Multi-Tier Health Probes & Deep Dependency Probing', () => {
    it('should return 200 OK for platform liveness probe (/health/live)', async () => {
      const res = await fetch(`${baseUrl}/health/live`);
      const body = (await res.json()) as any;
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(typeof body.uptimeSeconds === 'number');
      assert.ok(body.timestamp);
    });

    it('should return 200 OK for platform readiness probe (/health/ready)', async () => {
      const res = await fetch(`${baseUrl}/health/ready`);
      const body = (await res.json()) as any;
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'ready');
      assert.strictEqual(body.initialized, true);
    });

    it('should probe internal dependencies without cascading cloud outages (/health/dependencies)', async () => {
      const res = await fetch(`${baseUrl}/health/dependencies`);
      const resJson = (await res.json()) as any;
      const body = resJson.data || resJson;
      assert.strictEqual(res.status, 200);
      assert.ok(body.database);
      assert.strictEqual(body.database.status, 'HEALTHY');
      assert.ok(body.database.connectionPoolActive <= body.database.connectionPoolMax);
      assert.ok(body.telemetryEngine);
      assert.strictEqual(body.telemetryEngine.status, 'HEALTHY');
      assert.strictEqual(body.telemetryEngine.otlpReceiverPort, 4318);
      assert.ok(body.inMemoryTsdb);
      assert.ok(body.cloudAdapters.aws);
      assert.ok(body.cloudAdapters.azure);
      assert.ok(body.cloudAdapters.gcp);
      assert.ok(body.cloudAdapters.kubernetes);
    });

    it('should provide unified multi-component health report via engine', () => {
      const health = engine.getPlatformHealth();
      assert.strictEqual(health.status, 'HEALTHY');
      assert.ok(health.components.length >= 4);
      const apiComp = health.components.find((c) => c.id === 'comp-api-gateway');
      assert.ok(apiComp);
      assert.strictEqual(apiComp?.status, 'HEALTHY');
    });
  });

  describe('2. Internal Platform Self-Observability & Telemetry Dials', () => {
    it('should collect API latencies with p50, p90, p95, and p99 percentiles', () => {
      const metrics = engine.getPlatformMetrics();
      assert.ok(metrics.apiLatency.p50 > 0 && metrics.apiLatency.p50 < metrics.apiLatency.p99);
      assert.ok(metrics.apiLatency.p90 > 0);
      assert.ok(metrics.apiLatency.p95 > 0);
      assert.ok(metrics.apiLatency.p99 > 0);
      assert.ok(metrics.requestsPerSecond > 0);
      assert.ok(typeof metrics.errorRatePercent === 'number');
    });

    it('should track container resource consumption (CPU & Node.js memory)', () => {
      const metrics = engine.getPlatformMetrics();
      assert.ok(metrics.cpuUsagePercent > 0);
      assert.ok(metrics.memoryUsageMb > 0);
      assert.ok(metrics.memoryUsagePercent > 0);
    });

    it('should monitor internal queues, processing rates, and backpressure', () => {
      const metrics = engine.getPlatformMetrics();
      assert.ok(metrics.queues.length >= 3);
      const otelQueue = metrics.queues.find((q) => q.name.includes('ingestion'));
      assert.ok(otelQueue);
      assert.ok(otelQueue?.processingRatePerSec > 0);
    });

    it('should track AI subsystem token consumption and unit cost attribution', () => {
      const metrics = engine.getPlatformMetrics();
      assert.ok(metrics.aiUsage.totalTokens > 0);
      assert.ok(metrics.aiUsage.estimatedCostUsd > 0);
      assert.ok(metrics.aiUsage.totalRequests > 0);
    });
  });

  describe('3. Internal Platform SLOs & Error Budgets', () => {
    it('should compute internal SLO attainments across all 4 key service tiers', () => {
      const slos = engine.getPlatformSlos();
      assert.strictEqual(slos.length, 4);

      const apiAvail = slos.find((s) => s.id === 'slo-plat-01');
      assert.ok(apiAvail);
      assert.strictEqual(apiAvail?.targetPercent, 99.9);
      assert.ok(apiAvail?.actualPercent >= 99.9);
      assert.ok(apiAvail?.errorBudgetRemainingPercent >= 0);

      const latencySlo = slos.find((s) => s.id === 'slo-plat-02');
      assert.ok(latencySlo);
      assert.strictEqual(latencySlo?.targetPercent, 99.0);

      const syncSlo = slos.find((s) => s.id === 'slo-plat-03');
      assert.ok(syncSlo);
      assert.strictEqual(syncSlo?.targetPercent, 99.0);

      const otelSlo = slos.find((s) => s.id === 'slo-plat-04');
      assert.ok(otelSlo);
      assert.strictEqual(otelSlo?.targetPercent, 99.5);
    });

    it('should compute 1-hour and 24-hour error budget burn rates', () => {
      const slos = engine.getPlatformSlos();
      for (const slo of slos) {
        assert.ok(typeof slo.burnRate1h === 'number');
        assert.ok(typeof slo.burnRate24h === 'number');
        assert.strictEqual(slo.status, 'HEALTHY');
      }
    });
  });

  describe('4. Multi-Cloud Sync Workers, Checkpointing & DLQ Management', () => {
    it('should maintain status for all multi-cloud sync background workers', () => {
      const workers = engine.getSyncWorkers();
      assert.strictEqual(workers.length, 4);

      const awsWorker = workers.find((w) => w.provider === 'AWS');
      assert.ok(awsWorker);
      assert.strictEqual(awsWorker?.status, 'IDLE');
      assert.ok(awsWorker?.checkpointId?.includes('-chk-'));
      assert.ok(awsWorker?.successRate >= 99.0);

      const k8sWorker = workers.find((w) => w.provider === 'KUBERNETES');
      assert.ok(k8sWorker);
      assert.strictEqual(k8sWorker?.status, 'IDLE');
    });

    it('should manage Dead Letter Queue (DLQ) records with manual retry capability', () => {
      const dlq = engine.getDlqRecords();
      assert.ok(Array.isArray(dlq));

      // Attempt to retry a non-existent DLQ record
      const retryResult = engine.retryDlqTask('dlq-invalid-id');
      assert.strictEqual(retryResult.success, false);
      assert.ok(retryResult.error?.includes('not found'));
    });
  });

  describe('5. Differentiated Rate Limiting & Circuit Breakers', () => {
    it('should return rate limit configuration and circuit breaker states', () => {
      const status = engine.getRateLimitStatus();
      assert.ok(status.circuitBreakers.length >= 4);

      const awsCb = status.circuitBreakers.find((cb) => cb.target === 'aws-cloudwatch-api');
      assert.ok(awsCb);
      assert.strictEqual(awsCb?.state, 'CLOSED');
      assert.strictEqual(awsCb?.failureCount, 0);
    });

    it('should enforce rate limits with standard RFC headers', async () => {
      const res = await fetch(`${baseUrl}/test-rate-limit/auth`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('x-ratelimit-limit'), '10');
      assert.ok(res.headers.get('x-ratelimit-remaining'));
      assert.ok(res.headers.get('x-ratelimit-reset'));
    });

    it('should trigger circuit breaker after threshold consecutive failures and recover', () => {
      const cbKey = 'Test-Cloud-API';
      // Record 5 failures to trigger circuit breaker OPEN
      for (let i = 0; i < 5; i++) {
        engine.recordCircuitBreakerFailure(cbKey);
      }
      assert.strictEqual(engine.isCircuitBreakerAllowed(cbKey), false, 'Circuit breaker should be OPEN');

      // Record success to reset circuit breaker CLOSED
      engine.recordCircuitBreakerSuccess(cbKey);
      assert.strictEqual(engine.isCircuitBreakerAllowed(cbKey), true, 'Circuit breaker should be CLOSED after success');
    });
  });

  describe('6. Tenant Isolation Guard & IDOR Defense-in-Depth', () => {
    it('should reject requests without tenant scope header', async () => {
      const res = await fetch(`${baseUrl}/test-tenant-scoped`);
      const body = (await res.json()) as any;
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.code, 'ERR_TENANT_CONTEXT_MISSING');
    });

    it('should accept requests with valid tenant header', async () => {
      const res = await fetch(`${baseUrl}/test-tenant-scoped`, {
        headers: { 'x-tenant-id': 'tenant-enterprise-1' }
      });
      const body = (await res.json()) as any;
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.tenantId, 'tenant-enterprise-1');
    });

    it('should block cross-tenant IDOR resource access', async () => {
      const res = await fetch(`${baseUrl}/test-tenant-resource/tenant-other-company`, {
        headers: { 'x-tenant-id': 'tenant-enterprise-1' }
      });
      const resJson = (await res.json()) as any;
      assert.strictEqual(res.status, 403);
      assert.strictEqual(resJson.error?.code, 'FORBIDDEN');
    });
  });

  describe('7. Standardized Error Handling & Secret Sanitization', () => {
    it('should format backend errors with standard error contract', async () => {
      const res = await fetch(`${baseUrl}/test-error`);
      const resJson = (await res.json()) as any;
      const body = resJson.error as PlatformStandardError;
      assert.strictEqual(res.status, 503);
      assert.strictEqual(body.code, 'PROVIDER_UNAVAILABLE');
      assert.ok(body.message.includes('Database pool timeout error'));
      assert.ok(body.timestamp);
    });

    it('should sanitize credentials, tokens, passwords, and private keys from objects', () => {
      const dirtyObject = {
        name: 'cloud-connection',
        awsSecretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        token: 'eyJhGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
        password: 'SuperSecretProductionPassword123!',
        privateKey: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0\n-----END RSA PRIVATE KEY-----',
        region: 'us-east-1'
      };

      const clean = engine.sanitizeSecrets(dirtyObject);
      assert.strictEqual(clean.awsSecretAccessKey, '[REDACTED]');
      assert.strictEqual(clean.token, '[REDACTED]');
      assert.strictEqual(clean.password, '[REDACTED]');
      assert.strictEqual(clean.privateKey, '[REDACTED]');
      assert.strictEqual(clean.region, 'us-east-1');
    });
  });

  describe('8. Platform Maintenance Window Management', () => {
    it('should allow scheduling a platform maintenance window', () => {
      const window = engine.scheduleMaintenanceWindow({
        title: 'Database Engine Major Upgrade',
        reason: 'Upgrading Aurora PostgreSQL storage engine',
        scope: 'DATABASE_MIGRATION',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        status: 'SCHEDULED',
        createdBy: 'admin@cloudpulse.internal'
      });

      assert.ok(window);
      assert.strictEqual(window.status, 'SCHEDULED');
      assert.strictEqual(window.scope, 'DATABASE_MIGRATION');
      assert.ok(engine.getActiveMaintenanceWindow() !== null);
    });

    it('should prevent scheduling overlapping maintenance windows', () => {
      assert.throws(
        () => {
          engine.scheduleMaintenanceWindow({
            title: 'Conflicting Maintenance',
            reason: 'Should fail due to overlap',
            scope: 'FULL_PLATFORM',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString(),
            status: 'SCHEDULED',
            createdBy: 'admin@cloudpulse.internal'
          });
        },
        /Another platform maintenance window is currently active/,
        'Should reject overlapping maintenance'
      );
    });

    it('should allow cancelling active platform maintenance window', () => {
      const canceled = engine.cancelMaintenanceWindow();
      assert.ok(canceled);
      assert.strictEqual(canceled?.status, 'CANCELLED');
      assert.strictEqual(engine.getActiveMaintenanceWindow(), null);
    });
  });

  describe('9. Platform Hosting Unit Economics', () => {
    it('should compute real CloudPulse hosting costs with itemized breakdowns and provenance', () => {
      const costs = engine.getPlatformCosts();
      assert.ok(costs.totalMonthToDateUsd > 0);
      assert.strictEqual(costs.currency, 'USD');
      assert.ok(costs.breakdown.length >= 5);

      const computeCost = costs.breakdown.find((c) => c.category === 'COMPUTE');
      assert.ok(computeCost);
      assert.strictEqual(computeCost?.provenance, 'ACTUAL');

      const dbCost = costs.breakdown.find((c) => c.category === 'DATABASE');
      assert.ok(dbCost);
      assert.ok(dbCost?.costUsdMonthToDate > 0);

      const aiCost = costs.breakdown.find((c) => c.category === 'AI_INFERENCE');
      assert.ok(aiCost);
      assert.ok(aiCost?.costUsdMonthToDate > 0);
    });
  });

  describe('10. REST API Endpoints Integration', () => {
    it('GET /api/v1/platform/overview returns complete summary', async () => {
      const res = await fetch(`${baseUrl}/api/v1/platform/overview`, {
        headers: { 'x-tenant-id': 'tenant-cloudpulse-main' }
      });
      const resJson = (await res.json()) as any;
      const body = resJson.data || resJson;
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.health.status, 'HEALTHY');
      assert.ok(body.metrics.requestsPerSecond > 0);
      assert.strictEqual(body.slos.length, 4);
      assert.strictEqual(body.workers.length, 4);
      assert.ok(body.costs.totalMonthToDateUsd > 0);
    });

    it('GET /api/v1/platform/slos returns SLO list', async () => {
      const res = await fetch(`${baseUrl}/api/v1/platform/slos`, {
        headers: { 'x-tenant-id': 'tenant-cloudpulse-main' }
      });
      const resJson = (await res.json()) as any;
      const body = resJson.data || resJson;
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.length, 4);
    });

    it('GET /api/v1/platform/workers returns workers list', async () => {
      const res = await fetch(`${baseUrl}/api/v1/platform/workers`, {
        headers: { 'x-tenant-id': 'tenant-cloudpulse-main' }
      });
      const resJson = (await res.json()) as any;
      const body = resJson.data || resJson;
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.length, 4);
    });

    it('GET /api/v1/platform/costs returns hosting unit economics', async () => {
      const res = await fetch(`${baseUrl}/api/v1/platform/costs`, {
        headers: { 'x-tenant-id': 'tenant-cloudpulse-main' }
      });
      const resJson = (await res.json()) as any;
      const body = resJson.data || resJson;
      assert.strictEqual(res.status, 200);
      assert.ok(body.totalMonthToDateUsd > 0);
    });
  });
});
