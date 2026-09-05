import { Router, Request, Response } from 'express';
import { CloudConnectionEngine } from '../services/cloud-connection-engine.js';
import { AuthIdentityEngine } from '../services/auth-identity-engine.js';
import { AwsEventChangeEngine } from '../services/aws-event-change-engine.js';
import { AwsSecurityEngine } from '../services/aws-security-engine.js';
import { AwsOrganizationsEngine } from '../services/aws-organizations-engine.js';
import { AwsFinOpsEngine } from '../services/aws-finops-engine.js';
import { AwsObservabilityEngine } from '../services/aws-observability-engine.js';
import { AwsRelationshipsEngine } from '../services/aws-relationships-engine.js';
import { AwsIncidentCorrelationEngine } from '../services/aws-incident-correlation-engine.js';
import { AwsPredictiveEngine } from '../services/aws-predictive-engine.js';
import { AwsGovernanceEngine } from '../services/aws-governance-engine.js';
import { AwsDriftEngine } from '../services/aws-drift-engine.js';
import { AwsRemediationEngine } from '../services/aws-remediation-engine.js';
import { AwsAutoHealingEngine } from '../services/aws-auto-healing-engine.js';
import { AwsPolicySimulatorEngine } from '../services/aws-policy-simulator-engine.js';
import { AwsGovernanceIntelligenceEngine } from '../services/aws-governance-intelligence-engine.js';
import { AwsGovernanceDecisionEngine } from '../services/aws-governance-decision-engine.js';
import { AwsKnowledgeGraphEngine } from '../services/aws-knowledge-graph-engine.js';
import { AwsCloudQueryEngine } from '../services/aws-cloud-query-engine.js';
import { AwsCloudOperationsEngine } from '../services/aws-cloud-operations-engine.js';

export const cloudConnectionsRouter: Router = Router();
const connectionEngine = CloudConnectionEngine.getInstance();
const authEngine = AuthIdentityEngine.getInstance();
const eventEngine = AwsEventChangeEngine.getInstance();
const securityEngine = AwsSecurityEngine.getInstance();
const orgEngine = AwsOrganizationsEngine.getInstance();
const finopsEngine = AwsFinOpsEngine.getInstance();
const obsEngine = AwsObservabilityEngine.getInstance();
const relEngine = AwsRelationshipsEngine.getInstance();
const incidentEngine = AwsIncidentCorrelationEngine.getInstance();
const predictiveEngine = AwsPredictiveEngine.getInstance();
const governanceEngine = AwsGovernanceEngine.getInstance();
const driftEngine = AwsDriftEngine.getInstance();
const remediationEngine = AwsRemediationEngine.getInstance();
const autoHealingEngine = AwsAutoHealingEngine.getInstance();
const simulatorEngine = AwsPolicySimulatorEngine.getInstance();
const intelEngine = AwsGovernanceIntelligenceEngine.getInstance();
const decisionEngine = AwsGovernanceDecisionEngine.getInstance();
const knowledgeGraphEngine = AwsKnowledgeGraphEngine.getInstance();
const queryEngine = AwsCloudQueryEngine.getInstance();
const operationsEngine = AwsCloudOperationsEngine.getInstance();

// Helper to extract workspace and user from request without leaking ws-production
function getContext(req: Request) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const user = token ? authEngine.verifySession(token) : null;

  const reqWs = req.headers['x-workspace-id'] as string | undefined;
  const reqOrg = req.headers['x-organization-id'] as string | undefined;
  const reqUser = req.headers['x-user-id'] as string | undefined;

  let workspaceId = reqWs || user?.workspaceId;
  let organizationId = reqOrg || user?.organizationId;
  let userId = reqUser || user?.id;

  if (user) {
    workspaceId = workspaceId || user.workspaceId || `ws-${user.id}`;
    organizationId = organizationId || user.organizationId || 'org-default';
    userId = user.id;
  } else {
    workspaceId = workspaceId || 'ws-anonymous';
    organizationId = organizationId || 'org-anonymous';
    userId = userId || 'usr-anonymous';
  }

  return {
    user,
    userId,
    organizationId,
    workspaceId
  };
}

cloudConnectionsRouter.get('/', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const connections = connectionEngine.getConnections(workspaceId);
  return res.json({ ok: true, data: connections });
});

cloudConnectionsRouter.post('/aws/setup-info', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const setupInfo = connectionEngine.getSetupInstructions(workspaceId);
  return res.json({ ok: true, data: setupInfo });
});

cloudConnectionsRouter.post('/aws/connect', async (req: Request, res: Response) => {
  const { user, workspaceId, organizationId, userId } = getContext(req);
  const { displayName, roleArn, externalId } = req.body;

  if (!roleArn || !externalId) {
    return res.status(400).json({
      ok: false,
      error: { message: 'roleArn and externalId are required for AWS IAM cross-account role assumption.' }
    });
  }

  const roleArnRegex = /^arn:aws:iam::\d{12}:role\/[\w+=,.@-]{1,64}$/;
  if (!roleArnRegex.test(roleArn)) {
    return res.status(400).json({
      ok: false,
      error: { message: `Invalid Role ARN: '${roleArn}'. Must match 'arn:aws:iam::<12-digit-account-id>:role/<role-name>'.` }
    });
  }

  try {
    const conn = await connectionEngine.connectAws(workspaceId, organizationId, userId, {
      displayName,
      roleArn,
      externalId
    });
    if (user?.id && conn.status === 'CONNECTED') authEngine.completeOnboarding(user.id);
    return res.status(201).json({ ok: true, data: conn });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
});

// Azure Setup and Connect
cloudConnectionsRouter.get('/azure/setup-info', (req: Request, res: Response) => {
  const steps = connectionEngine.getAzureSetupGuide();
  return res.json({ ok: true, data: { steps } });
});

cloudConnectionsRouter.post('/azure/setup-info', (req: Request, res: Response) => {
  const steps = connectionEngine.getAzureSetupGuide();
  return res.json({ ok: true, data: { steps } });
});

cloudConnectionsRouter.post('/azure/connect', async (req: Request, res: Response) => {
  const { user, workspaceId, organizationId, userId } = getContext(req);
  const { displayName, tenantId, subscriptionId, clientId } = req.body;

  if (!tenantId || !subscriptionId) {
    return res.status(400).json({
      ok: false,
      error: { message: 'tenantId and subscriptionId are required for Azure Entra authorization.' }
    });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantId) || !uuidRegex.test(subscriptionId)) {
    return res.status(400).json({
      ok: false,
      error: { message: 'tenantId and subscriptionId must be valid GUID/UUID formats.' }
    });
  }

  try {
    const conn = await connectionEngine.connectAzure(workspaceId, organizationId, userId, {
      displayName,
      tenantId,
      subscriptionId,
      clientId
    });
    if (user?.id && conn.status === 'CONNECTED') authEngine.completeOnboarding(user.id);
    return res.status(201).json({ ok: true, data: conn });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
});

// GCP Setup and Connect
cloudConnectionsRouter.get('/gcp/setup-info', (req: Request, res: Response) => {
  const steps = connectionEngine.getGcpSetupGuide();
  return res.json({ ok: true, data: { steps } });
});

cloudConnectionsRouter.post('/gcp/setup-info', (req: Request, res: Response) => {
  const steps = connectionEngine.getGcpSetupGuide();
  return res.json({ ok: true, data: { steps } });
});

cloudConnectionsRouter.post('/gcp/connect', async (req: Request, res: Response) => {
  const { user, workspaceId, organizationId, userId } = getContext(req);
  const { displayName, projectId, clientEmail, projectNumber } = req.body;

  if (!projectId) {
    return res.status(400).json({
      ok: false,
      error: { message: 'projectId is required for Google Cloud connection.' }
    });
  }

  const projectIdRegex = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
  if (!projectIdRegex.test(projectId)) {
    return res.status(400).json({
      ok: false,
      error: { message: `Invalid GCP Project ID: '${projectId}'. Must be 6-30 lowercase characters, digits, and hyphens.` }
    });
  }

  try {
    const conn = await connectionEngine.connectGcp(workspaceId, organizationId, userId, {
      displayName,
      projectId,
      clientEmail,
      projectNumber
    });
    if (user?.id && conn.status === 'CONNECTED') authEngine.completeOnboarding(user.id);
    return res.status(201).json({ ok: true, data: conn });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
});

// Multi-Cloud Overview, Scorecard, Comparison, and Search
cloudConnectionsRouter.get('/multicloud/resources', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const provider = (req.query.provider as any) || undefined;
  const resources = await connectionEngine.listMultiCloudResources(workspaceId, provider);
  return res.json({ ok: true, data: resources });
});

cloudConnectionsRouter.get('/multicloud/scorecard', async (req: Request, res: Response) => {
  const { workspaceId, organizationId } = getContext(req);
  const scorecard = await connectionEngine.getMultiCloudScorecard(workspaceId, organizationId);
  return res.json({ ok: true, data: scorecard });
});

cloudConnectionsRouter.get('/multicloud/comparison', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const comparison = await connectionEngine.getMultiCloudComparison(workspaceId);
  return res.json({ ok: true, data: comparison });
});

cloudConnectionsRouter.get('/multicloud/search', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const query = (req.query.q as string) || '';
  const result = await connectionEngine.searchMultiCloud(workspaceId, query);
  return res.json({ ok: true, data: result });
});

cloudConnectionsRouter.post('/:id/validate', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const id = req.params.id || '';
  try {
    const result = await connectionEngine.validateConnection(id, workspaceId);
    return res.json({ ok: true, data: result });
  } catch (err: any) {
    return res.status(404).json({ ok: false, error: { message: err.message } });
  }
});

cloudConnectionsRouter.post('/:id/sync', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const id = req.params.id || '';
  try {
    const data = await connectionEngine.syncConnection(id, workspaceId);
    return res.json({ ok: true, data });
  } catch (err: any) {
    return res.status(404).json({ ok: false, error: { message: err.message } });
  }
});

cloudConnectionsRouter.post('/:id/disconnect', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const id = req.params.id || '';
  const success = connectionEngine.disconnectConnection(id, workspaceId);
  if (!success) {
    return res.status(404).json({ ok: false, error: { message: `Connection '${id}' not found.` } });
  }
  const conn = connectionEngine.getConnection(id, workspaceId);
  return res.json({
    ok: true,
    data: {
      id,
      status: conn?.status || 'DISCONNECTED',
      dataSource: conn?.dataSource || 'NOT_CONNECTED',
      message: 'Cloud connection successfully disconnected.'
    }
  });
});

cloudConnectionsRouter.delete('/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const id = req.params.id || '';
  const success = connectionEngine.disconnectConnection(id, workspaceId);
  if (!success) {
    return res.status(404).json({ ok: false, error: { message: `Connection '${id}' not found.` } });
  }
  const conn = connectionEngine.getConnection(id, workspaceId);
  return res.json({
    ok: true,
    data: {
      id,
      status: conn?.status || 'DISCONNECTED',
      dataSource: conn?.dataSource || 'NOT_CONNECTED',
      message: 'Cloud connection successfully disconnected.'
    }
  });
});

cloudConnectionsRouter.post('/:id/revalidate', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const id = req.params.id || '';
  try {
    const result = await connectionEngine.revalidateConnection(id, workspaceId);
    return res.json({ ok: true, data: result });
  } catch (err: any) {
    return res.status(404).json({ ok: false, error: { message: err.message } });
  }
});

cloudConnectionsRouter.get('/aws/live-data', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const data = await connectionEngine.getRealAccountData(workspaceId);
  return res.json({ ok: true, data });
});

cloudConnectionsRouter.get('/aws/inventory', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const resources = await connectionEngine.listDetailedResources(workspaceId);
  return res.json({ ok: true, data: resources });
});

cloudConnectionsRouter.get('/aws/inventory/summary', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = await connectionEngine.getInventorySummary(workspaceId);
  return res.json({ ok: true, data: summary });
});

cloudConnectionsRouter.get('/aws/resources/:id', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const resource = await connectionEngine.getResource(req.params.id || '', workspaceId);
  if (!resource) {
    return res.status(404).json({ ok: false, error: { message: `Resource '${req.params.id}' not found in connected AWS inventory.` } });
  }
  return res.json({ ok: true, data: resource });
});

cloudConnectionsRouter.get('/aws/topology', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const topology = await connectionEngine.getTopologyGraph(workspaceId);
  return res.json({ ok: true, data: topology });
});

cloudConnectionsRouter.get('/aws/sync-status', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const status = connectionEngine.getSyncStatus(workspaceId);
  return res.json({ ok: true, data: status });
});

cloudConnectionsRouter.get('/aws/events', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { service, eventType, severity, actor, search, timeRange } = req.query;
  const events = eventEngine.getEvents(workspaceId, {
    service: service as string,
    eventType: eventType as string,
    severity: severity as string,
    actor: actor as string,
    search: search as string,
    timeRange: timeRange as string
  });
  return res.json({ ok: true, data: events });
});

cloudConnectionsRouter.get('/aws/events/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const event = eventEngine.getEventById(req.params.id || '', workspaceId);
  if (!event) {
    return res.status(404).json({ ok: false, error: { message: `AWS event '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: event });
});

cloudConnectionsRouter.get('/aws/change-intelligence', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = eventEngine.getChangeSummary(workspaceId);
  return res.json({ ok: true, data: summary });
});

cloudConnectionsRouter.get('/aws/change-intelligence/correlations', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = eventEngine.getChangeSummary(workspaceId);
  return res.json({ ok: true, data: summary.correlationGroups });
});

cloudConnectionsRouter.post('/aws/events/sync', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { connectionId, window } = req.body;
  const result = await eventEngine.syncEvents(workspaceId, connectionId || 'conn-aws-prod-01', window || '24h');
  return res.json({ ok: true, data: result });
});

cloudConnectionsRouter.get('/aws/events-checkpoint', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const checkpoint = eventEngine.getSyncCheckpoint(workspaceId);
  return res.json({ ok: true, data: checkpoint });
});

cloudConnectionsRouter.get('/aws/security/posture', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const posture = securityEngine.getPostureSummary(workspaceId);
  return res.json({ ok: true, data: posture });
});

cloudConnectionsRouter.get('/aws/security/findings', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { severity, source, status, search } = req.query;
  const findings = securityEngine.getFindings(workspaceId, {
    severity: severity as string,
    source: source as string,
    status: status as string,
    search: search as string
  });
  return res.json({ ok: true, data: findings });
});

cloudConnectionsRouter.get('/aws/security/findings/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const finding = securityEngine.getFindingById(req.params.id || '', workspaceId);
  if (!finding) {
    return res.status(404).json({ ok: false, error: { message: `Security finding '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: finding });
});

cloudConnectionsRouter.patch('/aws/security/findings/:id/status', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const { status, reason } = req.body;
  const updated = securityEngine.updateFindingStatus(req.params.id || '', status, reason, user?.email || 'security-operator@cloudpulse.internal', workspaceId);
  if (!updated) {
    return res.status(404).json({ ok: false, error: { message: `Security finding '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: updated });
});

cloudConnectionsRouter.get('/aws/security/privilege-escalation', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const paths = securityEngine.getPrivilegeEscalationPaths(workspaceId);
  return res.json({ ok: true, data: paths });
});

cloudConnectionsRouter.get('/aws/security/capabilities', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const capabilities = securityEngine.getCapabilities(workspaceId);
  return res.json({ ok: true, data: capabilities });
});

cloudConnectionsRouter.post('/aws/security/findings/:id/exception', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const { reason, expiry } = req.body;
  const success = securityEngine.createSecurityException(req.params.id || '', reason || 'Business exception', user?.email || 'security-operator@cloudpulse.internal', expiry || '30d', workspaceId);
  if (!success) {
    return res.status(404).json({ ok: false, error: { message: `Security finding '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: { message: 'Security finding exception recorded.' } });
});

// ─── Phase 45: Real AWS Multi-Account & AWS Organizations Intelligence ────────

cloudConnectionsRouter.get('/aws/organization', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const org = orgEngine.getOrganization(workspaceId);
  return res.json({ ok: true, data: org });
});

cloudConnectionsRouter.get('/aws/accounts', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { status, accessStatus, search } = req.query;
  const accounts = orgEngine.getAccounts(workspaceId, {
    status: status as string,
    accessStatus: accessStatus as string,
    search: search as string,
  });
  return res.json({ ok: true, data: accounts });
});

cloudConnectionsRouter.get('/aws/accounts/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const account = orgEngine.getAccountById(req.params.id || '', workspaceId);
  if (!account) {
    return res.status(404).json({ ok: false, error: { message: `AWS Account '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: account });
});

cloudConnectionsRouter.get('/aws/organization/tree', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const tree = orgEngine.getOrganizationTree(workspaceId);
  return res.json({ ok: true, data: tree });
});

cloudConnectionsRouter.post('/aws/accounts/sync', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const result = await orgEngine.syncAccounts(workspaceId);
  return res.json({ ok: true, data: result });
});

// ─── Phase 46: Real AWS FinOps, Cost Forecasting & Resource Economics ─────────

cloudConnectionsRouter.get('/aws/finops/summary', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = finopsEngine.getSummary(workspaceId);
  return res.json({ ok: true, data: summary });
});

cloudConnectionsRouter.get('/aws/finops/records', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { service, accountId, region } = req.query;
  const records = finopsEngine.getCostRecords(workspaceId, {
    service: service as string,
    accountId: accountId as string,
    region: region as string,
  });
  return res.json({ ok: true, data: records });
});

cloudConnectionsRouter.get('/aws/finops/budgets', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const budgets = finopsEngine.getBudgets(workspaceId);
  return res.json({ ok: true, data: budgets });
});

cloudConnectionsRouter.get('/aws/finops/forecast', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const forecast = finopsEngine.getForecast(workspaceId);
  return res.json({ ok: true, data: forecast });
});

cloudConnectionsRouter.get('/aws/finops/optimizations', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const optimizations = finopsEngine.getOptimizations(workspaceId);
  return res.json({ ok: true, data: optimizations });
});

cloudConnectionsRouter.post('/aws/finops/what-if', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { ec2ScaleMultiplier, s3GrowthMultiplier, downsizeInstancesCount } = req.body || {};
  const result = finopsEngine.simulateWhatIf(workspaceId, {
    ec2ScaleMultiplier: ec2ScaleMultiplier != null ? Number(ec2ScaleMultiplier) : undefined,
    s3GrowthMultiplier: s3GrowthMultiplier != null ? Number(s3GrowthMultiplier) : undefined,
    downsizeInstancesCount: downsizeInstancesCount != null ? Number(downsizeInstancesCount) : undefined,
  });
  return res.json({ ok: true, data: result });
});

// ─── Phase 47: Real AWS Observability, Metrics & Service Health Intelligence ──

cloudConnectionsRouter.get('/aws/observability/summary', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = obsEngine.getServiceHealthSummary(workspaceId);
  return res.json({ ok: true, data: summary });
});

cloudConnectionsRouter.get('/aws/observability/metrics', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { resourceId, namespace, metricName, accountId } = req.query;
  const metrics = obsEngine.getMetrics(workspaceId, {
    resourceId: resourceId as string,
    namespace: namespace as string,
    metricName: metricName as string,
    accountId: accountId as string,
  });
  return res.json({ ok: true, data: metrics });
});

cloudConnectionsRouter.get('/aws/observability/resources/:id/health', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const health = obsEngine.getResourceHealth(req.params.id || '', workspaceId);
  if (!health) {
    return res.status(404).json({ ok: false, error: { message: `Health telemetry for resource '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: health });
});

cloudConnectionsRouter.get('/aws/observability/alarms', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const alarms = obsEngine.getAlarms(workspaceId);
  return res.json({ ok: true, data: alarms });
});

// ─── Phase 48: Real AWS Resource Relationships, Dependency Graph & Blast-Radius ──

cloudConnectionsRouter.get('/aws/topology', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { service, accountId, relationshipType } = req.query;
  const graph = relEngine.getTopologyGraph(workspaceId, {
    service: service as string,
    accountId: accountId as string,
    relationshipType: relationshipType as string,
  });
  return res.json({ ok: true, data: graph });
});

cloudConnectionsRouter.get('/aws/relationships', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { relationshipType, confidence, evidenceCategory } = req.query;
  const relationships = relEngine.getRelationships(workspaceId, {
    relationshipType: relationshipType as string,
    confidence: confidence as string,
    evidenceCategory: evidenceCategory as string,
  });
  return res.json({ ok: true, data: relationships });
});

cloudConnectionsRouter.get('/aws/resources/:id/dependencies', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const dependencies = relEngine.getResourceDependencies(req.params.id || '', workspaceId);
  return res.json({ ok: true, data: dependencies });
});

cloudConnectionsRouter.get('/aws/resources/:id/blast-radius', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const blastRadius = relEngine.analyzeBlastRadius(req.params.id || '', workspaceId);
  if (!blastRadius) {
    return res.status(404).json({ ok: false, error: { message: `Resource '${req.params.id}' not found for blast-radius analysis.` } });
  }
  return res.json({ ok: true, data: blastRadius });
});

// ─── Phase 49: Real AWS Change Impact, Root-Cause & Incident Correlation Engine ──

cloudConnectionsRouter.get('/aws/incidents', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { severity, status, classification, accountId } = req.query;
  const incidents = incidentEngine.getIncidents(workspaceId, {
    severity: severity as string,
    status: status as string,
    classification: classification as string,
    accountId: accountId as string,
  });
  return res.json({ ok: true, data: incidents });
});

cloudConnectionsRouter.get('/aws/incidents/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const incident = incidentEngine.getIncidentById(req.params.id || '', workspaceId);
  if (!incident) {
    return res.status(404).json({ ok: false, error: { message: `Incident '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: incident });
});

cloudConnectionsRouter.get('/aws/incidents/:id/impact-graph', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const impactGraph = incidentEngine.getIncidentImpactGraph(req.params.id || '', workspaceId);
  return res.json({ ok: true, data: impactGraph });
});

cloudConnectionsRouter.post('/aws/incidents/:id/correlate', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { changeId } = req.body || {};
  const correlation = incidentEngine.correlateChangeToIncident(req.params.id || '', changeId || '', workspaceId);
  return res.json({ ok: true, data: correlation });
});

// ─── Phase 50: Real AWS Predictive Operations & Early-Warning Intelligence ───

cloudConnectionsRouter.get('/aws/predictions/summary', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = predictiveEngine.getPredictiveSummary(workspaceId);
  return res.json({ ok: true, data: summary });
});

cloudConnectionsRouter.get('/aws/predictions/early-warnings', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const warnings = predictiveEngine.getEarlyWarnings(workspaceId);
  return res.json({ ok: true, data: warnings });
});

cloudConnectionsRouter.get('/aws/predictions', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { predictionType, status, accountId } = req.query;
  const predictions = predictiveEngine.getPredictions(workspaceId, {
    predictionType: predictionType as string,
    status: status as string,
    accountId: accountId as string,
  });
  return res.json({ ok: true, data: predictions });
});

cloudConnectionsRouter.get('/aws/predictions/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const prediction = predictiveEngine.getPredictionById(req.params.id || '', workspaceId);
  if (!prediction) {
    return res.status(404).json({ ok: false, error: { message: `Prediction '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: prediction });
});

cloudConnectionsRouter.post('/aws/predictions/what-if', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { trafficGrowthMultiplier, storageGrowthMultiplier, instanceScalingFactor } = req.body || {};
  const simulation = predictiveEngine.simulateWhatIf(workspaceId, {
    trafficGrowthMultiplier: trafficGrowthMultiplier != null ? Number(trafficGrowthMultiplier) : undefined,
    storageGrowthMultiplier: storageGrowthMultiplier != null ? Number(storageGrowthMultiplier) : undefined,
    instanceScalingFactor: instanceScalingFactor != null ? Number(instanceScalingFactor) : undefined,
  });
  return res.json({ ok: true, data: simulation });
});

// ─── Phase 51: Real AWS Automated Cloud Governance & Policy Enforcement Engine ───

cloudConnectionsRouter.get('/aws/governance/summary', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = governanceEngine.getGovernanceSummary(workspaceId);
  return res.json({ ok: true, data: summary });
});

cloudConnectionsRouter.get('/aws/governance/policies', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { category, status, severity } = req.query;
  const policies = governanceEngine.getPolicies(workspaceId, {
    category: category as string,
    status: status as string,
    severity: severity as string,
  });
  return res.json({ ok: true, data: policies });
});

cloudConnectionsRouter.get('/aws/governance/policies/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const policy = governanceEngine.getPolicyById(req.params.id || '', workspaceId);
  if (!policy) {
    return res.status(404).json({ ok: false, error: { message: `Policy '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: policy });
});

cloudConnectionsRouter.get('/aws/governance/evaluations', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { result, policyId } = req.query;
  const evaluations = governanceEngine.getEvaluations(workspaceId, {
    result: result as string,
    policyId: policyId as string,
  });
  return res.json({ ok: true, data: evaluations });
});

cloudConnectionsRouter.get('/aws/governance/findings', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { status, severity } = req.query;
  const findings = governanceEngine.getFindings(workspaceId, {
    status: status as string,
    severity: severity as string,
  });
  return res.json({ ok: true, data: findings });
});

cloudConnectionsRouter.get('/aws/governance/exemptions', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const exemptions = governanceEngine.getExemptions(workspaceId);
  return res.json({ ok: true, data: exemptions });
});

cloudConnectionsRouter.post('/aws/governance/test-policy', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { resourceType, condition } = req.body || {};
  const testResult = governanceEngine.dryRunPolicy(workspaceId, {
    resourceType: resourceType || 'AWS::Generic',
    condition: condition || 'true',
  });
  return res.json({ ok: true, data: testResult });
});

cloudConnectionsRouter.post('/aws/governance/exemptions', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const { policyId, resourceId, reason, durationDays } = req.body || {};
  const exemption = governanceEngine.createExemption(workspaceId, {
    policyId: policyId || 'pol-aws-generic',
    resourceId: resourceId || 'res-generic',
    reason: reason || 'Approved operational exception',
    approvedBy: user?.email || 'security-operator@cloudpulse.io',
    durationDays: durationDays ? Number(durationDays) : 30,
  });
  return res.json({ ok: true, data: exemption });
});

cloudConnectionsRouter.patch('/aws/governance/findings/:id/status', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { status } = req.body || {};
  const updated = governanceEngine.updateFindingStatus(req.params.id || '', status, workspaceId);
  if (!updated) {
    return res.status(404).json({ ok: false, error: { message: `Finding '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: updated });
});

// ─── Phase 52: Real AWS Continuous Compliance, Drift Detection & Governance Automation ───

cloudConnectionsRouter.get('/aws/drift/summary', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = driftEngine.getDriftSummary(workspaceId);
  return res.json({ ok: true, data: summary });
});

cloudConnectionsRouter.get('/aws/drift/items', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { driftType, status, severity } = req.query;
  const items = driftEngine.getDrifts(workspaceId, {
    driftType: driftType as string,
    status: status as string,
    severity: severity as string,
  });
  return res.json({ ok: true, data: items });
});

cloudConnectionsRouter.get('/aws/drift/items/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const item = driftEngine.getDriftById(req.params.id || '', workspaceId);
  if (!item) {
    return res.status(404).json({ ok: false, error: { message: `Drift item '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: item });
});

cloudConnectionsRouter.get('/aws/drift/baselines', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const baselines = driftEngine.getBaselines(workspaceId);
  return res.json({ ok: true, data: baselines });
});

cloudConnectionsRouter.get('/aws/drift/baselines/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const baseline = driftEngine.getBaselineById(req.params.id || '', workspaceId);
  if (!baseline) {
    return res.status(404).json({ ok: false, error: { message: `Baseline '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: baseline });
});

cloudConnectionsRouter.post('/aws/drift/reconcile', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { resourceId } = req.body || {};
  const result = driftEngine.reconcileResourceDrift(resourceId || 'i-078a1bc49281e7f02', workspaceId);
  return res.json({ ok: true, data: result });
});

cloudConnectionsRouter.patch('/aws/drift/items/:id/status', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { status } = req.body || {};
  const updated = driftEngine.updateDriftStatus(req.params.id || '', status, workspaceId);
  if (!updated) {
    return res.status(404).json({ ok: false, error: { message: `Drift item '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: updated });
});

cloudConnectionsRouter.post('/aws/drift/baselines', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const { name, resourceType, expectedConfiguration, source } = req.body || {};
  const baseline = driftEngine.createBaseline(workspaceId, {
    name: name || 'Custom Baseline',
    resourceType: resourceType || 'AWS::Generic',
    expectedConfiguration: expectedConfiguration || {},
    createdBy: user?.email || 'sre-lead@cloudpulse.io',
    source: source || 'APPROVED_BASELINE',
  });
  return res.json({ ok: true, data: baseline });
});

cloudConnectionsRouter.post('/aws/drift/baselines/:id/approve', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const approved = driftEngine.approveBaseline(req.params.id || '', workspaceId);
  if (!approved) {
    return res.status(404).json({ ok: false, error: { message: `Baseline '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: approved });
});

// ─── Phase 53: Real AWS Governance Baselines, Remediation Orchestration & Verified Compliance ───

cloudConnectionsRouter.get('/aws/governance-orchestration/summary', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = remediationEngine.getOrchestrationSummary(workspaceId);
  return res.json({ ok: true, data: summary });
});

cloudConnectionsRouter.get('/aws/governance-orchestration/baselines', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { status } = req.query;
  const baselines = remediationEngine.getBaselines(workspaceId, { status: status as string });
  return res.json({ ok: true, data: baselines });
});

cloudConnectionsRouter.get('/aws/governance-orchestration/baselines/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const baseline = remediationEngine.getBaselineById(req.params.id || '', workspaceId);
  if (!baseline) {
    return res.status(404).json({ ok: false, error: { message: `Governance baseline '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: baseline });
});

cloudConnectionsRouter.post('/aws/governance-orchestration/baselines', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const { name, description, accountId, region, controls } = req.body || {};
  const baseline = remediationEngine.createBaseline(workspaceId, {
    name: name || 'Custom Baseline Standard',
    description: description || 'Baseline configuration standard',
    accountId: accountId || '839201746152',
    region: region || 'us-east-1',
    controls: controls || [],
    createdBy: user?.email || 'sre-lead@cloudpulse.io',
  });
  return res.json({ ok: true, data: baseline });
});

cloudConnectionsRouter.post('/aws/governance-orchestration/baselines/:id/approve', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const approved = remediationEngine.approveBaseline(req.params.id || '', user?.email || 'security-lead@cloudpulse.io', workspaceId);
  if (!approved) {
    return res.status(404).json({ ok: false, error: { message: `Governance baseline '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: approved });
});

cloudConnectionsRouter.get('/aws/governance-orchestration/plans', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { status, riskLevel } = req.query;
  const plans = remediationEngine.getRemediationPlans(workspaceId, {
    status: status as string,
    riskLevel: riskLevel as string,
  });
  return res.json({ ok: true, data: plans });
});

cloudConnectionsRouter.get('/aws/governance-orchestration/plans/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const plan = remediationEngine.getRemediationPlanById(req.params.id || '', workspaceId);
  if (!plan) {
    return res.status(404).json({ ok: false, error: { message: `Remediation plan '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: plan });
});

cloudConnectionsRouter.post('/aws/governance-orchestration/plans/:id/approve', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const approvedPlan = remediationEngine.approveRemediationPlan(req.params.id || '', user?.email || 'sre-approver@cloudpulse.io', workspaceId);
  if (!approvedPlan) {
    return res.status(404).json({ ok: false, error: { message: `Remediation plan '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: approvedPlan });
});

cloudConnectionsRouter.post('/aws/governance-orchestration/plans/:id/execute', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const result = remediationEngine.executeRemediationPlan(req.params.id || '', user?.email || 'sre-operator@cloudpulse.io', workspaceId);
  return res.json({ ok: true, data: result });
});

// ─── Phase 54: Real AWS Governance Remediation Intelligence, Auto-Healing & Controlled Self-Repair ───

cloudConnectionsRouter.get('/aws/auto-healing/summary', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = autoHealingEngine.getAutoHealingSummary(workspaceId);
  return res.json({ ok: true, data: summary });
});

cloudConnectionsRouter.get('/aws/auto-healing/policies', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { status, level } = req.query;
  const policies = autoHealingEngine.getAutomationPolicies(workspaceId, {
    status: status as string,
    level: level as string,
  });
  return res.json({ ok: true, data: policies });
});

cloudConnectionsRouter.get('/aws/auto-healing/policies/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const policy = autoHealingEngine.getAutomationPolicyById(req.params.id || '', workspaceId);
  if (!policy) {
    return res.status(404).json({ ok: false, error: { message: `Automation policy '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: policy });
});

cloudConnectionsRouter.post('/aws/auto-healing/policies', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const { name, description, automationLevel, resourceType, allowedActions } = req.body || {};
  const policy = autoHealingEngine.createAutomationPolicy(workspaceId, {
    name: name || 'Custom Auto-Healing Policy',
    description: description || 'Automated self-healing policy',
    automationLevel: automationLevel || 'LEVEL_3_SAFE_AUTO_REMEDIATE',
    resourceType: resourceType || 'AWS::EC2::Instance',
    allowedActions: allowedActions || ['AWS_EC2_ENABLE_DETAILED_MONITORING'],
    createdBy: user?.email || 'sre-lead@cloudpulse.io',
  });
  return res.json({ ok: true, data: policy });
});

cloudConnectionsRouter.post('/aws/auto-healing/policies/:id/pause', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const paused = autoHealingEngine.pauseAutomationPolicy(req.params.id || '', workspaceId);
  if (!paused) {
    return res.status(404).json({ ok: false, error: { message: `Policy '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: paused });
});

cloudConnectionsRouter.post('/aws/auto-healing/policies/:id/resume', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const resumed = autoHealingEngine.resumeAutomationPolicy(req.params.id || '', workspaceId);
  if (!resumed) {
    return res.status(404).json({ ok: false, error: { message: `Policy '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: resumed });
});

cloudConnectionsRouter.get('/aws/auto-healing/actions-allowlist', (_req: Request, res: Response) => {
  const list = autoHealingEngine.getActionAllowlist();
  return res.json({ ok: true, data: list });
});

cloudConnectionsRouter.get('/aws/auto-healing/queue', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const queue = autoHealingEngine.getQueueItems(workspaceId);
  return res.json({ ok: true, data: queue });
});

cloudConnectionsRouter.post('/aws/auto-healing/trigger', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const { resourceId, resourceName, resourceType, actionId } = req.body || {};
  const result = autoHealingEngine.triggerEventDrivenSelfHealing(workspaceId, {
    resourceId: resourceId || 'i-078a1bc49281e7f02',
    resourceName: resourceName || 'staging-workload-runner',
    resourceType: resourceType || 'AWS::EC2::Instance',
    actionId: actionId || 'AWS_EC2_ENABLE_DETAILED_MONITORING',
    changeActor: user?.email || 'event-bridge@cloudpulse.internal',
  });
  return res.json({ ok: true, data: result });
});

// ─── Phase 55: Real AWS CloudPulse Policy Simulator, Governance What-If & Safe Change Impact Engine ───

cloudConnectionsRouter.get('/aws/simulator/summary', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = simulatorEngine.getSimulatorSummary(workspaceId);
  return res.json({ ok: true, data: summary });
});

cloudConnectionsRouter.get('/aws/simulator/simulations', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { riskLevel } = req.query;
  const simulations = simulatorEngine.getSimulations(workspaceId, { riskLevel: riskLevel as string });
  return res.json({ ok: true, data: simulations });
});

cloudConnectionsRouter.get('/aws/simulator/simulations/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const simulation = simulatorEngine.getSimulationById(req.params.id || '', workspaceId);
  if (!simulation) {
    return res.status(404).json({ ok: false, error: { message: `Simulation '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: simulation });
});

cloudConnectionsRouter.post('/aws/simulator/run', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const { scenarioName, description, inputs } = req.body || {};
  const simulation = simulatorEngine.runSimulation(workspaceId, {
    scenarioName: scenarioName || 'Custom What-If Scenario',
    description: description || 'Proposed configuration change simulation',
    inputs: inputs || [],
    createdBy: user?.email || 'sre-architect@cloudpulse.io',
  });
  return res.json({ ok: true, data: simulation });
});

cloudConnectionsRouter.delete('/aws/simulator/simulations/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const deleted = simulatorEngine.deleteSimulation(req.params.id || '', workspaceId);
  return res.json({ ok: true, data: { deleted } });
});

// ─── Phase 56: Real AWS Governance Intelligence Center & Continuous Control Optimization ───

cloudConnectionsRouter.get('/aws/governance-intelligence/summary', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = intelEngine.getGovernanceIntelligenceSummary(workspaceId);
  return res.json({ ok: true, data: summary });
});

cloudConnectionsRouter.get('/aws/governance-intelligence/controls', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const controls = intelEngine.getControlHealth(workspaceId);
  return res.json({ ok: true, data: controls });
});

cloudConnectionsRouter.get('/aws/governance-intelligence/risks', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { priority } = req.query;
  const risks = intelEngine.getRisks(workspaceId, priority as string);
  return res.json({ ok: true, data: risks });
});

cloudConnectionsRouter.get('/aws/governance-intelligence/policy-effectiveness', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const policies = intelEngine.getPolicyEffectiveness(workspaceId);
  return res.json({ ok: true, data: policies });
});

cloudConnectionsRouter.get('/aws/governance-intelligence/coverage', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const coverage = intelEngine.getEvidenceCoverage(workspaceId);
  return res.json({ ok: true, data: coverage });
});

cloudConnectionsRouter.get('/aws/governance-intelligence/automation-opportunities', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const opps = intelEngine.getAutomationOpportunities(workspaceId);
  return res.json({ ok: true, data: opps });
});

cloudConnectionsRouter.get('/aws/governance-intelligence/recommendations', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { status } = req.query;
  const recs = intelEngine.getRecommendations(workspaceId, status as string);
  return res.json({ ok: true, data: recs });
});

cloudConnectionsRouter.post('/aws/governance-intelligence/recommendations/:id/status', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { status } = req.body || {};
  const updated = intelEngine.updateRecommendationStatus(req.params.id || '', status, workspaceId);
  if (!updated) {
    return res.status(404).json({ ok: false, error: { message: `Recommendation '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: updated });
});

// ─── Phase 57: Real AWS Governance Decision Engine & Control Optimization Automation ───

cloudConnectionsRouter.get('/aws/governance-decisions/summary', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = decisionEngine.getGovernanceDecisionSummary(workspaceId);
  return res.json({ ok: true, data: summary });
});

cloudConnectionsRouter.get('/aws/governance-decisions', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { priority, status, type } = req.query;
  const decisions = decisionEngine.getDecisions(workspaceId, {
    priority: priority as string,
    status: status as string,
    type: type as string,
  });
  return res.json({ ok: true, data: decisions });
});

cloudConnectionsRouter.get('/aws/governance-decisions/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const decision = decisionEngine.getDecisionById(req.params.id || '', workspaceId);
  if (!decision) {
    return res.status(404).json({ ok: false, error: { message: `Decision '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: decision });
});

cloudConnectionsRouter.post('/aws/governance-decisions/:id/transition', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { status } = req.body || {};
  const updated = decisionEngine.transitionDecisionStatus(req.params.id || '', status, workspaceId);
  if (!updated) {
    return res.status(404).json({ ok: false, error: { message: `Decision '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: updated });
});

cloudConnectionsRouter.post('/aws/governance-decisions/:id/create-plan', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const result = decisionEngine.createRemediationPlanFromDecision(req.params.id || '', workspaceId);
  return res.json({ ok: result.success, data: result });
});

// ─── Phase 58: Real AWS Governance Knowledge Graph & Cross-Domain Risk Intelligence ───

cloudConnectionsRouter.get('/aws/knowledge-graph/summary', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const summary = knowledgeGraphEngine.getKnowledgeGraphSummary(workspaceId);
  return res.json({ ok: true, data: summary });
});

cloudConnectionsRouter.get('/aws/knowledge-graph/nodes', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { type, service, criticality, minRiskScore } = req.query;
  const nodes = knowledgeGraphEngine.getNodes(workspaceId, {
    type: type as any,
    service: service as string,
    criticality: criticality as string,
    minRiskScore: minRiskScore ? parseInt(minRiskScore as string, 10) : undefined
  });
  return res.json({ ok: true, data: nodes });
});

cloudConnectionsRouter.get('/aws/knowledge-graph/edges', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { relationshipType, evidenceStrength, confidence } = req.query;
  const edges = knowledgeGraphEngine.getEdges(workspaceId, {
    relationshipType: relationshipType as any,
    evidenceStrength: evidenceStrength as any,
    confidence: confidence as any
  });
  return res.json({ ok: true, data: edges });
});

cloudConnectionsRouter.get('/aws/knowledge-graph/path', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { sourceNodeId, targetNodeId } = req.query;
  if (!sourceNodeId || !targetNodeId) {
    return res.status(400).json({
      ok: false,
      error: { message: 'Both sourceNodeId and targetNodeId query parameters are required.' }
    });
  }
  const pathResult = knowledgeGraphEngine.findPath(
    workspaceId,
    sourceNodeId as string,
    targetNodeId as string
  );
  return res.json({ ok: true, data: pathResult });
});

cloudConnectionsRouter.get('/aws/knowledge-graph/resource-profile/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const profile = knowledgeGraphEngine.getResourceRiskProfile(workspaceId, req.params.id || '');
  if (!profile) {
    return res.status(404).json({
      ok: false,
      error: { message: `Resource risk profile for '${req.params.id}' not found.` }
    });
  }
  return res.json({ ok: true, data: profile });
});

cloudConnectionsRouter.get('/aws/knowledge-graph/diff', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { sinceTimestamp } = req.query;
  const diff = knowledgeGraphEngine.getGraphDiff(workspaceId, sinceTimestamp as string);
  return res.json({ ok: true, data: diff });
});

// ─── Phase 59: Real AWS Cloud Graph Query Engine & Natural-Language Investigation ───

cloudConnectionsRouter.post('/aws/query/execute', (req: Request, res: Response) => {
  const { workspaceId, organizationId, user } = getContext(req);
  const { queryAst, queryType, scope, rawPrompt } = req.body || {};

  const query: any = {
    id: `qry-${crypto.randomUUID().substring(0, 8)}`,
    tenantId: organizationId || 'o-cloudpulse-corp-root',
    workspaceId,
    scope: scope || 'AWS Production Estate',
    queryType: queryType || 'STRUCTURED',
    queryAst: queryAst || { primaryEntityType: 'RESOURCE' },
    rawPrompt,
    createdBy: user?.email || 'secops-analyst@cloudpulse.corp',
    createdAt: new Date().toISOString()
  };

  const result = queryEngine.executeQuery(workspaceId, query);
  return res.json({ ok: true, data: result });
});

cloudConnectionsRouter.post('/aws/query/explain', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { queryAst } = req.body || {};
  const allNodes = knowledgeGraphEngine.getNodes(workspaceId);
  const plan = queryEngine.generateExplainPlan(queryAst || { primaryEntityType: 'RESOURCE' }, allNodes.length);
  return res.json({ ok: true, data: plan });
});

cloudConnectionsRouter.post('/aws/query/natural-language', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ ok: false, error: { message: 'A prompt string is required.' } });
  }
  const response = queryEngine.investigateNaturalLanguage(workspaceId, prompt, user);
  return res.json({ ok: true, data: response });
});

cloudConnectionsRouter.get('/aws/investigations', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { status } = req.query;
  const list = queryEngine.getInvestigations(workspaceId, status as any);
  return res.json({ ok: true, data: list });
});

cloudConnectionsRouter.get('/aws/investigations/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const inv = queryEngine.getInvestigationById(workspaceId, req.params.id || '');
  if (!inv) {
    return res.status(404).json({ ok: false, error: { message: `Investigation '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: inv });
});

cloudConnectionsRouter.post('/aws/investigations', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const { title, description, severity, scope, rootCauseHypothesis, evidenceNodeIds } = req.body || {};
  const inv = queryEngine.createInvestigation(workspaceId, {
    title: title || 'New Cloud Investigation',
    description: description || 'Investigating anomalies across AWS infrastructure.',
    severity: severity || 'HIGH',
    scope: scope || 'AWS Production Estate',
    ...(rootCauseHypothesis ? { rootCauseHypothesis } : {}),
    ...(evidenceNodeIds ? { evidenceNodeIds } : {}),
    createdBy: user?.email || 'operator@cloudpulse.internal'
  });
  return res.json({ ok: true, data: inv });
});

cloudConnectionsRouter.patch('/aws/investigations/:id/status', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { status, rootCauseHypothesis } = req.body || {};
  const updated = queryEngine.updateInvestigationStatus(workspaceId, req.params.id || '', status, rootCauseHypothesis);
  if (!updated) {
    return res.status(404).json({ ok: false, error: { message: `Investigation '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: updated });
});

cloudConnectionsRouter.post('/aws/investigations/:id/timeline', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { type, title, description, source, entityId } = req.body || {};
  const updated = queryEngine.addTimelineEvent(workspaceId, req.params.id || '', {
    type: type || 'EVIDENCE',
    title: title || 'Timeline Event',
    description: description || '',
    source: source || 'CloudPulse',
    entityId
  });
  if (!updated) {
    return res.status(404).json({ ok: false, error: { message: `Investigation '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: updated });
});

cloudConnectionsRouter.get('/aws/investigations/:id/report', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const report = queryEngine.generateInvestigationReport(workspaceId, req.params.id || '', user);
  if (!report) {
    return res.status(404).json({ ok: false, error: { message: `Investigation '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: report });
});

cloudConnectionsRouter.post('/aws/investigations/:id/create-decision', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const result = queryEngine.convertInvestigationToDecision(workspaceId, req.params.id || '');
  return res.json({ ok: result.success, data: result });
});

cloudConnectionsRouter.get('/aws/query/history', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const history = queryEngine.getQueryHistory(workspaceId);
  return res.json({ ok: true, data: history });
});

cloudConnectionsRouter.get('/aws/query/suggestions', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const suggestions = queryEngine.getQuerySuggestions(workspaceId);
  return res.json({ ok: true, data: suggestions });
});

// ─── Phase 60: Real AWS Continuous Cloud Operations Control Plane ───

cloudConnectionsRouter.get('/aws/operations/situation', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const situation = operationsEngine.getCloudSituation(workspaceId);
  return res.json({ ok: true, data: situation });
});

cloudConnectionsRouter.get('/aws/operations', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { priority, state, type } = req.query;
  const ops = operationsEngine.getOperations(workspaceId, {
    priority: priority as any,
    state: state as any,
    type: type as any
  });
  return res.json({ ok: true, data: ops });
});

cloudConnectionsRouter.get('/aws/operations/timeline', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const hours = req.query.hours ? Number(req.query.hours) : 24;
  const timeline = operationsEngine.getOperationalTimeline(workspaceId, hours);
  return res.json({ ok: true, data: timeline });
});

cloudConnectionsRouter.get('/aws/operations/safe-actions', (req: Request, res: Response) => {
  const catalog = operationsEngine.getSafeActionCatalog();
  return res.json({ ok: true, data: catalog });
});

cloudConnectionsRouter.post('/aws/operations/copilot', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { prompt } = req.body || {};
  const response = operationsEngine.askCopilot(workspaceId, prompt || 'What is happening right now?');
  return res.json({ ok: true, data: response });
});

cloudConnectionsRouter.get('/aws/operations/:id', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const op = operationsEngine.getOperationById(workspaceId, req.params.id || '');
  if (!op) {
    return res.status(404).json({ ok: false, error: { message: `Operation '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: op });
});

cloudConnectionsRouter.patch('/aws/operations/:id/state', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const { targetState, notes } = req.body || {};
  const result = operationsEngine.transitionOperationState(
    workspaceId,
    req.params.id || '',
    targetState,
    user?.email || 'operator@cloudpulse.corp',
    notes
  );
  if (!result.success) {
    return res.status(400).json({ ok: false, error: { message: result.error } });
  }
  return res.json({ ok: true, data: result.operation });
});

cloudConnectionsRouter.get('/aws/operations/:id/preflight', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const preflight = operationsEngine.evaluatePreflight(workspaceId, req.params.id || '');
  return res.json({ ok: true, data: preflight });
});

cloudConnectionsRouter.post('/aws/operations/:id/execute', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const result = operationsEngine.executeOperation(
    workspaceId,
    req.params.id || '',
    user?.email || 'operator@cloudpulse.corp'
  );
  if (!result.success) {
    return res.status(400).json({ ok: false, error: { message: result.error } });
  }
  return res.json({ ok: true, data: result });
});

cloudConnectionsRouter.post('/aws/operations/:id/rollback', (req: Request, res: Response) => {
  const { workspaceId, user } = getContext(req);
  const result = operationsEngine.executeRollback(
    workspaceId,
    req.params.id || '',
    user?.email || 'operator@cloudpulse.corp'
  );
  if (!result.success) {
    return res.status(400).json({ ok: false, error: { message: result.error } });
  }
  return res.json({ ok: true, data: result });
});

cloudConnectionsRouter.get('/aws/operations/:id/storyline', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const storyline = operationsEngine.getOperationalStoryline(workspaceId, req.params.id || '');
  if (!storyline) {
    return res.status(404).json({ ok: false, error: { message: `Operation '${req.params.id}' not found.` } });
  }
  return res.json({ ok: true, data: storyline });
});


















