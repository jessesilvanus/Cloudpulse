import { Router, Request, Response } from 'express';
import { KubernetesPlatformEngine } from '../services/kubernetes-platform-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const k8sEngine = KubernetesPlatformEngine.getInstance();

// GET /api/v1/kubernetes/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = k8sEngine.getSummary();
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// GET /api/v1/kubernetes/clusters (Viewer+)
router.get('/clusters', (req: Request, res: Response) => {
  const environment = req.query.environment as string | undefined;
  const provider = req.query.provider as string | undefined;
  const data = k8sEngine.getClusters(environment, provider);
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// GET /api/v1/kubernetes/clusters/:id (Viewer+)
router.get('/clusters/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = k8sEngine.getClusterById(id);
  if (!data) {
    return res.status(404).json({
      ok: false,
      error: { code: 'CLUSTER_NOT_FOUND', message: `Cluster '${id}' not found.` },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

// GET /api/v1/kubernetes/nodes (Viewer+)
router.get('/nodes', (req: Request, res: Response) => {
  const clusterId = req.query.clusterId as string | undefined;
  const data = k8sEngine.getNodes(clusterId);
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// GET /api/v1/kubernetes/namespaces (Viewer+)
router.get('/namespaces', (req: Request, res: Response) => {
  const clusterId = req.query.clusterId as string | undefined;
  const data = k8sEngine.getNamespaces(clusterId);
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// GET /api/v1/kubernetes/workloads (Viewer+)
router.get('/workloads', (req: Request, res: Response) => {
  const namespace = req.query.namespace as string | undefined;
  const kind = req.query.kind as string | undefined;
  const data = k8sEngine.getWorkloads(namespace, kind);
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// GET /api/v1/kubernetes/pods (Viewer+)
router.get('/pods', (req: Request, res: Response) => {
  const namespace = req.query.namespace as string | undefined;
  const status = req.query.status as string | undefined;
  const data = k8sEngine.getPods(namespace, status);
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// GET /api/v1/kubernetes/autoscalers (Viewer+)
router.get('/autoscalers', (req: Request, res: Response) => {
  const namespace = req.query.namespace as string | undefined;
  const data = k8sEngine.getAutoscalers(namespace);
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// POST /api/v1/kubernetes/workloads/:namespace/:name/restart (Operator+)
router.post('/workloads/:namespace/:name/restart', requireRole('operator'), (req: Request, res: Response) => {
  const namespace = req.params.namespace as string;
  const name = req.params.name as string;
  try {
    const data = k8sEngine.restartWorkload(namespace, name);
    const response: ApiResponse<typeof data> = {
      ok: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
    return res.json(response);
  } catch (err: any) {
    return res.status(400).json({
      ok: false,
      error: { code: 'WORKLOAD_RESTART_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/kubernetes/workloads/:namespace/:name/scale (Operator+)
router.post('/workloads/:namespace/:name/scale', requireRole('operator'), (req: Request, res: Response) => {
  const namespace = req.params.namespace as string;
  const name = req.params.name as string;
  const targetReplicas = Number(req.body.targetReplicas);
  try {
    const data = k8sEngine.scaleWorkload(namespace, name, targetReplicas);
    const response: ApiResponse<typeof data> = {
      ok: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
    return res.json(response);
  } catch (err: any) {
    return res.status(400).json({
      ok: false,
      error: { code: 'WORKLOAD_SCALE_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/kubernetes/nodes/:name/cordon (Operator+)
router.post('/nodes/:name/cordon', requireRole('operator'), (req: Request, res: Response) => {
  const name = req.params.name as string;
  try {
    const data = k8sEngine.cordonNode(name);
    const response: ApiResponse<typeof data> = {
      ok: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
    return res.json(response);
  } catch (err: any) {
    return res.status(400).json({
      ok: false,
      error: { code: 'NODE_CORDON_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/kubernetes/nodes/:name/drain (Operator+)
router.post('/nodes/:name/drain', requireRole('operator'), (req: Request, res: Response) => {
  const name = req.params.name as string;
  try {
    const data = k8sEngine.drainNode(name);
    const response: ApiResponse<typeof data> = {
      ok: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
    return res.json(response);
  } catch (err: any) {
    return res.status(400).json({
      ok: false,
      error: { code: 'NODE_DRAIN_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// POST /api/v1/kubernetes/simulate (Operator+)
router.post('/simulate', requireRole('operator'), (req: Request, res: Response) => {
  const scenario = req.body?.scenario || 'OOMKilled pod crash';
  const data = k8sEngine.simulateClusterScenario(scenario);
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

// POST /api/v1/kubernetes/assistant (Viewer+)
router.post('/assistant', (req: Request, res: Response) => {
  const prompt = req.body?.prompt || 'What is our current cluster health?';
  const data = k8sEngine.queryK8sAssistant(prompt);
  const response: ApiResponse<typeof data> = {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  res.json(response);
});

export default router;
