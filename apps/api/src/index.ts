import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { loadConfig } from './config.js';
import { logger } from './logger.js';
import { healthRouter } from './routes/health.js';
import { overviewRouter } from './routes/overview.js';
import { servicesRouter } from './routes/services.js';
import { metricsRouter } from './routes/metrics.js';
import { logsRouter } from './routes/logs.js';
import { tracesRouter } from './routes/traces.js';
import { alertsRouter } from './routes/alerts.js';
import { incidentsRouter } from './routes/incidents.js';
import { slosRouter } from './routes/slos.js';
import { infrastructureRouter } from './routes/infrastructure.js';
import { systemStatusRouter } from './routes/systemStatus.js';
import { simulationRouter } from './routes/simulation.js';
import { telemetryRouter } from './routes/telemetry.js';
import sreRouter from './routes/sre.js';
import securityRouter from './routes/security.js';
import finopsRouter from './routes/finops.js';
import intelligenceRouter from './routes/intelligence.js';
import resilienceRouter from './routes/resilience.js';
import multiCloudRouter from './routes/multicloud.js';
import governanceRouter from './routes/governance.js';
import observabilityRouter from './routes/observability.js';
import soarRouter from './routes/soar.js';
import reliabilityRouter from './routes/reliability.js';
import idpRouter from './routes/idp.js';
import supplyChainRouter from './routes/supply-chain.js';
import finopsCenterRouter from './routes/finops-center.js';
import resilienceCenterRouter from './routes/resilience-center.js';
import governanceCenterRouter from './routes/governance-center.js';
import aiopsCenterRouter from './routes/aiops-center.js';
import agentOperationsRouter from './routes/agent-operations.js';
import finopsEnterpriseRouter from './routes/finops-enterprise.js';
import marketplacePortalRouter from './routes/marketplace-portal.js';
import disasterRecoveryCenterRouter from './routes/disaster-recovery-center.js';
import eventIntelligenceRouter from './routes/event-intelligence.js';
import serviceMeshRouter from './routes/service-mesh.js';
import kubernetesPlatformRouter from './routes/kubernetes-platform.js';
import { kubernetesRouter } from './routes/kubernetes.js';
import cloudIdentityIamRouter from './routes/cloud-identity-iam.js';
import predictiveIntelligenceRouter from './routes/predictive-intelligence.js';
import iacAutomationRouter from './routes/iac-automation.js';
import cloudComplianceRouter from './routes/cloud-compliance.js';
import advancedFinOpsGreenOpsRouter from './routes/advanced-finops-greenops.js';
import enterpriseCommandCenterRouter from './routes/enterprise-command-center.js';
import globalCommandCenterRouter from './routes/global-command-center.js';
import platformRouter from './routes/platform.js';
import { authRouter } from './routes/auth.js';
import { cloudConnectionsRouter } from './routes/cloud-connections.js';
import workflowRouter from './routes/workflow.js';
import { authenticate, securityHeaders } from './middleware/auth.js';
import { standardizedErrorHandler } from './middleware/error-handler.js';
import { RealCloudPulsePlatformEngine } from './services/real-cloudpulse-platform-engine.js';
import { receiverRouter, queryRouter, startTelemetryEngine } from '@cloudpulse/telemetry-engine';

const config = loadConfig();
const app = express();

// Trust reverse proxy (Render, Vercel, etc.) for correct client IP detection
app.set('trust proxy', 1);

// ─── Middleware ──────────────────────────────────────────────────────────────

const allowedOrigins = (process.env['CORS_ORIGIN'] || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(securityHeaders);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(
  morgan(config.nodeEnv === 'production' ? 'combined' : 'dev', {
    stream: {
      write: (message: string) => logger.info(message.trim(), { source: 'http' }),
    },
  }),
);
app.use(authenticate);

// ─── Ingestion & Observability Engine Mounting ────────────────────────────────
// Also mount OTLP and Prometheus/Loki/Tempo query routes directly on API server
app.use(receiverRouter);
app.use(queryRouter);

// ─── Routes ──────────────────────────────────────────────────────────────────

const apiBase = `/api/${config.apiVersion}`;

app.use('/health', healthRouter);
app.use(`${apiBase}/overview`, overviewRouter);
app.use(`${apiBase}/services`, servicesRouter);
app.use(`${apiBase}/metrics`, metricsRouter);
app.use(`${apiBase}/logs`, logsRouter);
app.use(`${apiBase}/traces`, tracesRouter);
app.use(`${apiBase}/alerts`, alertsRouter);
app.use(`${apiBase}/incidents`, incidentsRouter);
app.use(`${apiBase}/slos`, slosRouter);
app.use(`${apiBase}/infrastructure`, infrastructureRouter);
app.use(`${apiBase}/system-status`, systemStatusRouter);
app.use(`${apiBase}/simulation`, simulationRouter);
app.use(`${apiBase}/telemetry`, telemetryRouter);
app.use(`${apiBase}/sre`, sreRouter);
app.use(`${apiBase}/security`, securityRouter);
app.use(`${apiBase}/finops`, finopsRouter);
app.use(`${apiBase}/intelligence`, intelligenceRouter);
app.use(`${apiBase}/resilience`, resilienceRouter);
app.use(`${apiBase}/multicloud`, multiCloudRouter);
app.use(`${apiBase}/governance`, governanceRouter);
app.use(`${apiBase}/observability`, observabilityRouter);
app.use(`${apiBase}/soar`, soarRouter);
app.use(`${apiBase}/reliability`, reliabilityRouter);
app.use(`${apiBase}/idp`, idpRouter);
app.use(`${apiBase}/supply-chain`, supplyChainRouter);
app.use(`${apiBase}/finops-center`, finopsCenterRouter);
app.use(`${apiBase}/resilience-center`, resilienceCenterRouter);
app.use(`${apiBase}/governance-center`, governanceCenterRouter);
app.use(`${apiBase}/aiops-center`, aiopsCenterRouter);
app.use(`${apiBase}/agent-operations`, agentOperationsRouter);
app.use(`${apiBase}/finops-enterprise`, finopsEnterpriseRouter);
app.use(`${apiBase}/marketplace-portal`, marketplacePortalRouter);
app.use(`${apiBase}/disaster-recovery-center`, disasterRecoveryCenterRouter);
app.use(`${apiBase}/event-intelligence`, eventIntelligenceRouter);
app.use(`${apiBase}/service-mesh`, serviceMeshRouter);
app.use(`${apiBase}/kubernetes`, kubernetesRouter);
app.use(`${apiBase}/kubernetes`, kubernetesPlatformRouter);
app.use(`${apiBase}/identity-iam`, cloudIdentityIamRouter);
app.use(`${apiBase}/predictive`, predictiveIntelligenceRouter);
app.use(`${apiBase}/iac`, iacAutomationRouter);
app.use(`${apiBase}/compliance-governance`, cloudComplianceRouter);
app.use(`${apiBase}/finops-greenops`, advancedFinOpsGreenOpsRouter);
app.use(`${apiBase}/enterprise-command-center`, enterpriseCommandCenterRouter);
app.use(`${apiBase}/global-command-center`, globalCommandCenterRouter);
app.use(`${apiBase}/platform`, platformRouter);
app.use(`${apiBase}/auth`, authRouter);
app.use(`${apiBase}/cloud-connections`, cloudConnectionsRouter);
app.use(`${apiBase}/workflow`, workflowRouter);
app.use('/api/sre', sreRouter);
app.use('/api/workflow', workflowRouter);
app.use('/api/finops', finopsRouter);
app.use('/api/platform', platformRouter);
app.use('/api/auth', authRouter);
app.use('/api/cloud-connections', cloudConnectionsRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    error: { code: 'NOT_FOUND', message: 'The requested resource does not exist.' },
    meta: { timestamp: new Date().toISOString(), version: '0.0.2' },
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(standardizedErrorHandler);

// ─── Start Standalone Telemetry OTLP Ingestion Engine (Port 4318) ────────────
startTelemetryEngine(4318).catch((err: any) => {
  logger.warn(`Telemetry Engine Port 4318 already in use or bypassed: ${err?.message || err}`);
});

// ─── Start CLOUDPULSE Gateway Server ──────────────────────────────────────────

const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info(`CLOUDPULSE API Gateway started`, {
    port: config.port,
    host: '0.0.0.0',
    env: config.nodeEnv,
    version: '0.0.2',
  });
  logger.info(`Health:  http://0.0.0.0:${config.port}/health`);
  logger.info(`API:     http://0.0.0.0:${config.port}${apiBase}/overview`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
async function shutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  try {
    await RealCloudPulsePlatformEngine.getInstance().executeGracefulShutdown(signal);
  } catch (err: any) {
    logger.error(`Error during platform engine shutdown: ${err.message}`);
  }
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forcefully terminating process due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));


