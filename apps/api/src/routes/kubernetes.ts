/**
 * CLOUDPULSE — Real Kubernetes Operations & Connectivity API Router (Phase 62)
 *
 * Exposes REST endpoints for cluster discovery, inventory, topology graph,
 * governance, non-mutating What-If simulation, allowlisted operations, and AI investigation.
 */

import { Router, Request, Response } from 'express';
import { KubernetesOperationsEngine } from '../services/kubernetes-operations-engine.js';
import { AuthIdentityEngine } from '../services/auth-identity-engine.js';

export const kubernetesRouter: Router = Router();
const engine = new KubernetesOperationsEngine();
const authEngine = AuthIdentityEngine.getInstance();

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

  return { workspaceId, organizationId, userId, user };
}

// 1. Overview across all clusters in workspace
kubernetesRouter.get('/overview', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  try {
    const summary = await engine.getOverview(workspaceId);
    return res.json({ ok: true, data: summary });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: { message: err.message } });
  }
});

// 2. List connected clusters
kubernetesRouter.get('/clusters', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const connections = engine.listConnections(workspaceId);
  return res.json({ ok: true, data: connections });
});

// 3. Connect a new cluster
const handleClusterConnect = async (req: Request, res: Response) => {
  const { workspaceId, organizationId, userId } = getContext(req);
  const { name, provider, clusterEndpointReference, authorizationMethod, regionOrLocation, cloudAccountOrProject, version } = req.body;

  if (!name || !provider || !clusterEndpointReference) {
    return res.status(400).json({
      ok: false,
      error: { message: 'name, provider, and clusterEndpointReference are required.' }
    });
  }

  if (!/^https:\/\//i.test(clusterEndpointReference)) {
    return res.status(400).json({
      ok: false,
      error: { message: 'clusterEndpointReference must be a secure HTTPS endpoint.' }
    });
  }

  try {
    const conn = await engine.connectCluster(workspaceId, organizationId, userId, {
      name,
      provider,
      clusterEndpointReference,
      authorizationMethod: authorizationMethod || 'AWS_IAM_IRSA',
      regionOrLocation: regionOrLocation || 'us-east-1',
      cloudAccountOrProject: cloudAccountOrProject || '123456789012',
      version
    });
    return res.status(201).json({ ok: true, data: conn });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
};

kubernetesRouter.post('/connect', handleClusterConnect);
kubernetesRouter.post('/clusters/connect', handleClusterConnect);

// Disconnect cluster
kubernetesRouter.post('/clusters/:clusterId/disconnect', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const clusterId = req.params.clusterId || '';
  const success = engine.disconnectCluster(clusterId, workspaceId);
  if (!success) {
    return res.status(404).json({ ok: false, error: { message: `Cluster '${clusterId}' not found.` } });
  }
  return res.json({ ok: true, data: { clusterId, status: 'DISCONNECTED', message: 'Cluster disconnected successfully.' } });
});

kubernetesRouter.delete('/clusters/:clusterId', (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const clusterId = req.params.clusterId || '';
  const success = engine.disconnectCluster(clusterId, workspaceId);
  if (!success) {
    return res.status(404).json({ ok: false, error: { message: `Cluster '${clusterId}' not found.` } });
  }
  return res.json({ ok: true, data: { clusterId, status: 'DISCONNECTED', message: 'Cluster disconnected successfully.' } });
});

// 4. Safe action catalog
kubernetesRouter.get('/safe-actions', (req: Request, res: Response) => {
  const catalog = engine.getSafeActionCatalog();
  return res.json({ ok: true, data: catalog });
});

// 5. Cluster detail view
kubernetesRouter.get('/clusters/:clusterId', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const clusterId = req.params.clusterId || '';
  try {
    const detail = await engine.getClusterDetail(clusterId, workspaceId);
    return res.json({ ok: true, data: detail });
  } catch (err: any) {
    return res.status(404).json({ ok: false, error: { message: err.message } });
  }
});

// 6. Cluster Knowledge Graph
kubernetesRouter.get('/clusters/:clusterId/graph', async (req: Request, res: Response) => {
  const clusterId = req.params.clusterId || '';
  try {
    const graph = await engine.getKnowledgeGraph(clusterId);
    return res.json({ ok: true, data: graph });
  } catch (err: any) {
    return res.status(404).json({ ok: false, error: { message: err.message } });
  }
});

// 7. Non-mutating What-If simulation
kubernetesRouter.post('/clusters/:clusterId/operations/simulate', (req: Request, res: Response) => {
  const clusterId = req.params.clusterId || '';
  const { actionId, target, parameters } = req.body;

  if (!actionId || !target) {
    return res.status(400).json({ ok: false, error: { message: 'actionId and target are required.' } });
  }

  const result = engine.simulateOperation(clusterId, actionId, target, parameters || {});
  return res.json({ ok: true, data: result });
});

// 8. Execute allowlisted safe operation with fresh-read verification
kubernetesRouter.post('/clusters/:clusterId/operations/execute', async (req: Request, res: Response) => {
  const { userId } = getContext(req);
  const clusterId = req.params.clusterId || '';
  const { operationId } = req.body;

  if (!operationId) {
    return res.status(400).json({ ok: false, error: { message: 'operationId is required.' } });
  }

  try {
    const op = await engine.executeOperation(clusterId, operationId, userId);
    return res.json({ ok: true, data: op });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
});

// 9. Natural language cluster investigation
kubernetesRouter.post('/investigate', async (req: Request, res: Response) => {
  const { workspaceId } = getContext(req);
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ ok: false, error: { message: 'prompt is required.' } });
  }

  try {
    const result = await engine.investigate(prompt, workspaceId);
    return res.json({ ok: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: { message: err.message } });
  }
});
