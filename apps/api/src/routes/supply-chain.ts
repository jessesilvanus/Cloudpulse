import { Router, Request, Response } from 'express';
import { SupplyChainEngine } from '../services/supply-chain-engine.js';
import { requireRole } from '../middleware/auth.js';
import { ApiResponse } from '@cloudpulse/shared';

const router: Router = Router();
const supplyChainEngine = SupplyChainEngine.getInstance();

// GET /api/v1/supply-chain/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = supplyChainEngine.getSummary();
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

// GET /api/v1/supply-chain/repositories (Viewer+)
router.get('/repositories', (_req: Request, res: Response) => {
  const data = supplyChainEngine.getRepositories();
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

// GET /api/v1/supply-chain/repositories/:id (Viewer+)
router.get('/repositories/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const repo = supplyChainEngine.getRepositoryById(id);
  if (!repo) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Repository '${id}' not found` },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }

  const response: ApiResponse<typeof repo> = {
    ok: true,
    data: repo,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  };
  return res.json(response);
});

// GET /api/v1/supply-chain/builds (Viewer+)
router.get('/builds', (req: Request, res: Response) => {
  const repositoryId = req.query.repositoryId as string | undefined;
  const data = supplyChainEngine.getBuilds(repositoryId);
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

// GET /api/v1/supply-chain/dependencies (Viewer+)
router.get('/dependencies', (req: Request, res: Response) => {
  const repositoryId = req.query.repositoryId as string | undefined;
  const data = supplyChainEngine.getDependencies(repositoryId);
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

// GET /api/v1/supply-chain/vulnerabilities (Viewer+)
router.get('/vulnerabilities', (req: Request, res: Response) => {
  const severity = req.query.severity as string | undefined;
  const status = req.query.status as string | undefined;
  const data = supplyChainEngine.getVulnerabilities(severity, status);
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

// GET /api/v1/supply-chain/sboms (Viewer+)
router.get('/sboms', (req: Request, res: Response) => {
  const repositoryId = req.query.repositoryId as string | undefined;
  const buildId = req.query.buildId as string | undefined;
  const data = supplyChainEngine.getSboms(repositoryId, buildId);
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

// POST /api/v1/supply-chain/sboms/diff (Viewer+)
router.post('/sboms/diff', (req: Request, res: Response) => {
  const { baseSbomId, targetSbomId } = req.body;
  try {
    const data = supplyChainEngine.compareSboms(baseSbomId, targetSbomId);
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
      error: { code: 'COMPARISON_FAILED', message: err.message },
      meta: { timestamp: new Date().toISOString(), version: 'v1' }
    });
  }
});

// GET /api/v1/supply-chain/containers (Viewer+)
router.get('/containers', (_req: Request, res: Response) => {
  const data = supplyChainEngine.getContainers();
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

// GET /api/v1/supply-chain/artifacts (Viewer+)
router.get('/artifacts', (_req: Request, res: Response) => {
  const data = supplyChainEngine.getArtifacts();
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

// GET /api/v1/supply-chain/signatures (Viewer+)
router.get('/signatures', (_req: Request, res: Response) => {
  const data = supplyChainEngine.getSignatures();
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

// GET /api/v1/supply-chain/provenance (Viewer+)
router.get('/provenance', (req: Request, res: Response) => {
  const artifactId = req.query.artifactId as string | undefined;
  const data = supplyChainEngine.getProvenance(artifactId);
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

// POST /api/v1/supply-chain/gate/:artifactId (Operator+)
router.post('/gate/:artifactId', requireRole('operator'), (req: Request, res: Response) => {
  const artifactId = req.params.artifactId as string;
  const data = supplyChainEngine.evaluateSupplyChainGate(artifactId);
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
