import { Router, Request, Response } from 'express';
import { MultiCloudEngine } from '../services/multicloud-engine.js';
import { ApiResponse, CloudProviderType } from '@cloudpulse/shared';

const router: Router = Router();
const multiCloudEngine = MultiCloudEngine.getInstance();

// GET /api/v1/multicloud/summary (Viewer+)
router.get('/summary', (_req: Request, res: Response) => {
  const data = multiCloudEngine.getSummary();
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

// GET /api/v1/multicloud/accounts (Viewer+)
router.get('/accounts', (_req: Request, res: Response) => {
  const data = multiCloudEngine.getAccounts();
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

// GET /api/v1/multicloud/capabilities (Viewer+)
router.get('/capabilities', (_req: Request, res: Response) => {
  const data = multiCloudEngine.getCapabilities();
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

// GET /api/v1/multicloud/resources (Viewer+)
router.get('/resources', (req: Request, res: Response) => {
  const provider = req.query.provider as CloudProviderType | undefined;
  const data = multiCloudEngine.getResources(provider);
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

// GET /api/v1/multicloud/compute (Viewer+)
router.get('/compute', (req: Request, res: Response) => {
  const provider = req.query.provider as CloudProviderType | undefined;
  const data = multiCloudEngine.getCompute(provider);
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

// GET /api/v1/multicloud/storage (Viewer+)
router.get('/storage', (req: Request, res: Response) => {
  const provider = req.query.provider as CloudProviderType | undefined;
  const data = multiCloudEngine.getStorage(provider);
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

// GET /api/v1/multicloud/networking (Viewer+)
router.get('/networking', (req: Request, res: Response) => {
  const provider = req.query.provider as CloudProviderType | undefined;
  const data = multiCloudEngine.getNetworking(provider);
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

// GET /api/v1/multicloud/kubernetes (Viewer+)
router.get('/kubernetes', (req: Request, res: Response) => {
  const provider = req.query.provider as CloudProviderType | undefined;
  const data = multiCloudEngine.getKubernetesClusters(provider);
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

// GET /api/v1/multicloud/portability (Viewer+)
router.get('/portability', (_req: Request, res: Response) => {
  const data = multiCloudEngine.getPortabilityScore();
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

// GET /api/v1/multicloud/migration-assessment (Viewer+)
router.get('/migration-assessment', (_req: Request, res: Response) => {
  const data = multiCloudEngine.getMigrationAssessment();
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
