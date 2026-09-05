import { Router, Request, Response } from 'express';
import { realMultiCloudFinOpsEngine } from '../services/real-multicloud-finops-engine.js';
import { FinOpsEngine } from '../services/finops-engine.js';
import { ApiResponse, CostCategoryType, CostAllocationType } from '@cloudpulse/shared';

const router: Router = Router();
const legacyFinOpsEngine = FinOpsEngine.getInstance();

// ─── 1. SCORECARD & EXECUTIVE OVERVIEW ────────────────────────────────────────
router.get(['/scorecard', '/overview', '/summary'], async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const currency = (req.query.currency as string) || 'USD';
    const data = await realMultiCloudFinOpsEngine.getScorecard(workspaceId, currency);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 2. NORMALIZED COST RECORDS ──────────────────────────────────────────────
router.get('/records', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const { provider, service, teamId, environment, costCenterId, costCategory, allocationType } = req.query;

    const filters: any = {};
    if (provider) filters.provider = provider as string;
    if (service) filters.service = service as string;
    if (teamId) filters.teamId = teamId as string;
    if (environment) filters.environment = environment as string;
    if (costCenterId) filters.costCenterId = costCenterId as string;
    if (costCategory) filters.costCategory = costCategory as CostCategoryType;
    if (allocationType) filters.allocationType = allocationType as CostAllocationType;

    const data = await realMultiCloudFinOpsEngine.getCostRecords(workspaceId, filters);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 3. SHOWBACK & ALLOCATION ────────────────────────────────────────────────
router.get(['/allocation', '/allocations'], async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const currency = (req.query.currency as string) || 'USD';
    const scorecard = await realMultiCloudFinOpsEngine.getScorecard(workspaceId, currency);
    return res.json({
      ok: true,
      data: {
        spendByTeam: scorecard.spendByTeam,
        spendByEnvironment: scorecard.spendByEnvironment,
        spendByCategory: scorecard.spendByCategory,
        spendByProvider: scorecard.spendByProvider,
        allocationCoveragePercent: scorecard.allocationCoveragePercent,
        unallocatedSpendMtd: scorecard.unallocatedSpendMtd
      },
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 4. UNIT ECONOMICS ────────────────────────────────────────────────────────
router.get('/unit-economics', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realMultiCloudFinOpsEngine.getUnitEconomics(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 5. KUBERNETES FINOPS ────────────────────────────────────────────────────
router.get('/kubernetes', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const clusterId = (req.query.clusterId as string) || 'k8s-prod-eks-us-east-1';
    const data = await realMultiCloudFinOpsEngine.getKubernetesFinOps(workspaceId, clusterId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 6. REAL COST ANOMALIES ──────────────────────────────────────────────────
router.get('/anomalies', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realMultiCloudFinOpsEngine.getAnomalies(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 7. FORECASTS ─────────────────────────────────────────────────────────────
router.get(['/forecasts', '/forecast'], async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realMultiCloudFinOpsEngine.getForecasts(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 8. BUDGETS & BURN RATES ─────────────────────────────────────────────────
router.get('/budgets', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realMultiCloudFinOpsEngine.getBudgets(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 9. SAVINGS OPPORTUNITIES & VERIFICATION ─────────────────────────────────
router.get(['/opportunities', '/recommendations'], async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realMultiCloudFinOpsEngine.getSavingsOpportunities(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/opportunities/:id/verify', async (req: Request, res: Response) => {
  try {
    const { observedSavingsMonthly, notes } = req.body;
    if (observedSavingsMonthly === undefined) {
      return res.status(400).json({ ok: false, error: 'observedSavingsMonthly is required' });
    }
    const verifiedBy = {
      userId: (req.headers['x-user-id'] as string) || 'usr-sre-lead',
      name: (req.headers['x-user-name'] as string) || 'Elena Rostova'
    };
    const updated = await realMultiCloudFinOpsEngine.verifySavings(
      req.params.id!,
      Number(observedSavingsMonthly),
      verifiedBy,
      notes || 'Post-change billing verification'
    );
    return res.json({
      ok: true,
      data: updated,
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 10. TRADEOFF SIMULATOR ──────────────────────────────────────────────────
router.post('/tradeoffs/simulate', (req: Request, res: Response) => {
  try {
    const { actionTitle, resourceType, costReductionMonthly, capacityDeltaPercent, redundancyReduced, logsReducedPercent } = req.body;
    if (!actionTitle || costReductionMonthly === undefined) {
      return res.status(400).json({ ok: false, error: 'actionTitle and costReductionMonthly are required' });
    }
    const evaluation = realMultiCloudFinOpsEngine.evaluateTradeoff({
      actionTitle,
      resourceType: resourceType || 'Compute',
      costReductionMonthly: Number(costReductionMonthly),
      capacityDeltaPercent: Number(capacityDeltaPercent || 0),
      redundancyReduced: Boolean(redundancyReduced),
      logsReducedPercent: logsReducedPercent !== undefined ? Number(logsReducedPercent) : undefined
    });
    return res.json({
      ok: true,
      data: evaluation,
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 11. COST CENTERS & DATA QUALITY ─────────────────────────────────────────
router.get('/cost-centers', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const data = await realMultiCloudFinOpsEngine.getCostCenters(workspaceId);
    return res.json({
      ok: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/cost-centers', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-enterprise-01';
    const { name, code, owner, ownerEmail, budgetLimit, currency } = req.body;
    if (!name || !code || !owner) {
      return res.status(400).json({ ok: false, error: 'name, code, and owner are required' });
    }
    const cc = await realMultiCloudFinOpsEngine.createCostCenter(workspaceId, tenantId, {
      name,
      code,
      owner,
      ownerEmail,
      budgetLimit,
      currency
    });
    return res.status(201).json({
      ok: true,
      data: cc,
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/data-quality', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const scorecard = await realMultiCloudFinOpsEngine.getScorecard(workspaceId);
    return res.json({
      ok: true,
      data: {
        dataQualityMetrics: scorecard.dataQualityMetrics,
        allocationCoveragePercent: scorecard.allocationCoveragePercent,
        freshness: scorecard.freshness,
        isBillingDelayed: scorecard.isBillingDelayed,
        lastBillingSync: scorecard.lastBillingSync
      },
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 12. AI FINOPS ANALYST COPILOT ───────────────────────────────────────────
router.post(['/ai-analyst', '/ai-copilot', '/investigate'], async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'prompt is required' });
    }
    const result = await realMultiCloudFinOpsEngine.investigate(prompt, workspaceId);
    return res.json({
      ok: true,
      data: result,
      meta: { timestamp: new Date().toISOString(), version: 'v65' }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 13. LEGACY BACKWARD COMPATIBILITY ───────────────────────────────────────
router.get('/trends', (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
  const data = legacyFinOpsEngine.getDailyTrends(isNaN(days) ? 30 : days);
  return res.json({ ok: true, data, meta: { timestamp: new Date().toISOString(), version: 'v1' } });
});

router.get('/services', (_req: Request, res: Response) => {
  const data = legacyFinOpsEngine.getServiceCosts();
  return res.json({ ok: true, data, meta: { timestamp: new Date().toISOString(), version: 'v1' } });
});

router.get('/resources', (_req: Request, res: Response) => {
  const data = legacyFinOpsEngine.getResourceCosts();
  return res.json({ ok: true, data, meta: { timestamp: new Date().toISOString(), version: 'v1' } });
});

router.get('/platform-summary', (_req: Request, res: Response) => {
  const data = legacyFinOpsEngine.getPlatformSummary();
  return res.json({ ok: true, data, meta: { timestamp: new Date().toISOString(), version: 'v1' } });
});

router.get('/tagging', (_req: Request, res: Response) => {
  const data = legacyFinOpsEngine.getTaggingGovernance();
  return res.json({ ok: true, data, meta: { timestamp: new Date().toISOString(), version: 'v1' } });
});

router.get('/policies', (_req: Request, res: Response) => {
  const data = legacyFinOpsEngine.getCostPolicies();
  return res.json({ ok: true, data, meta: { timestamp: new Date().toISOString(), version: 'v1' } });
});

export default router;
