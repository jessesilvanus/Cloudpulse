import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsFinOpsEngine } from '../src/services/aws-finops-engine.js';

describe('CLOUDPULSE Phase 46 Real AWS FinOps, Cost Forecasting & Resource Economics', () => {
  const finopsEngine = AwsFinOpsEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should return truthful AWS FinOps summary with MTD and projected spend', () => {
    const summary = finopsEngine.getSummary(validWorkspace);
    assert.ok(summary);
    assert.strictEqual(summary.monthToDateSpend, 604.50);
    assert.strictEqual(summary.projectedMonthEndSpend, 710.00);
    assert.strictEqual(summary.currency, 'USD');
    assert.strictEqual(summary.provenance, 'LIVE');
  });

  it('should attribute costs across multiple AWS accounts with transparency', () => {
    const summary = finopsEngine.getSummary(validWorkspace);
    assert.strictEqual(summary.costByAccount.length, 4);

    const primary = summary.costByAccount.find((a) => a.accountId === '718293041526');
    assert.ok(primary);
    assert.strictEqual(primary.cost, 412.50);
    assert.strictEqual(primary.percentage, 68.2);
    assert.strictEqual(primary.status, 'ACCESSIBLE');

    const sandbox = summary.costByAccount.find((a) => a.accountId === '104829175938');
    assert.ok(sandbox);
    assert.strictEqual(sandbox.status, 'PERMISSION_REQUIRED');
  });

  it('should categorize costs by AWS service and compute percentages', () => {
    const summary = finopsEngine.getSummary(validWorkspace);
    assert.ok(summary.costByService.length >= 5);

    const ec2 = summary.costByService.find((s) => s.service.includes('EC2'));
    assert.ok(ec2);
    assert.strictEqual(ec2.cost, 245.00);
    assert.strictEqual(ec2.percentage, 40.5);

    const rds = summary.costByService.find((s) => s.service.includes('RDS'));
    assert.ok(rds);
    assert.strictEqual(rds.cost, 185.00);
  });

  it('should attribute costs by AWS region without fabricating missing regions', () => {
    const summary = finopsEngine.getSummary(validWorkspace);
    assert.strictEqual(summary.costByRegion.length, 2);

    const usEast1 = summary.costByRegion.find((r) => r.region.includes('us-east-1'));
    assert.ok(usEast1);
    assert.strictEqual(usEast1.cost, 512.50);
    assert.strictEqual(usEast1.percentage, 84.8);
  });

  it('should evaluate AWS Budgets status and compute variances accurately', () => {
    const budgets = finopsEngine.getBudgets(validWorkspace);
    assert.strictEqual(budgets.length, 2);

    const prodBudget = budgets.find((b) => b.id === 'bgt-aws-01');
    assert.ok(prodBudget);
    assert.strictEqual(prodBudget.status, 'ON_TRACK');
    assert.strictEqual(prodBudget.limitAmount, 500.00);
    assert.strictEqual(prodBudget.actualAmount, 412.50);

    const stagingBudget = budgets.find((b) => b.id === 'bgt-aws-02');
    assert.ok(stagingBudget);
    assert.strictEqual(stagingBudget.status, 'EXCEEDED');
    assert.strictEqual(stagingBudget.variancePercent, 28.0);
  });

  it('should detect cost anomalies and compute historical baseline deviations', () => {
    const summary = finopsEngine.getSummary(validWorkspace);
    assert.ok(summary.anomalies.length >= 1);

    const ec2Anomaly = summary.anomalies.find((a) => a.service === 'Amazon EC2');
    assert.ok(ec2Anomaly);
    assert.strictEqual(ec2Anomaly.baselineCost, 9.20);
    assert.strictEqual(ec2Anomaly.currentCost, 18.50);
    assert.strictEqual(ec2Anomaly.deviationPercent, 101.1);
  });

  it('should generate ML-based cost forecast with 95% confidence intervals', () => {
    const forecast = finopsEngine.getForecast(validWorkspace);
    assert.ok(forecast);
    assert.strictEqual(forecast.projectedMonthEndSpend, 710.00);
    assert.strictEqual(forecast.confidenceInterval.lower, 685.00);
    assert.strictEqual(forecast.confidenceInterval.upper, 735.00);
    assert.strictEqual(forecast.confidenceInterval.confidencePercent, 95.0);
    assert.strictEqual(forecast.provenance, 'PREDICTED');
  });

  it('should generate evidence-grounded optimization opportunities with estimated savings', () => {
    const optimizations = finopsEngine.getOptimizations(validWorkspace);
    assert.strictEqual(optimizations.length, 3);

    const rightSizing = optimizations.find((o) => o.id === 'opt-aws-01');
    assert.ok(rightSizing);
    assert.strictEqual(rightSizing.category, 'RIGHTSIZING');
    assert.strictEqual(rightSizing.estimatedSavingsMonthly, 45.00);
    assert.strictEqual(rightSizing.confidence, 96.0);
    assert.ok(rightSizing.evidence.includes('P95 CPU utilization is 4.8%'));
    assert.strictEqual(rightSizing.provenance, 'ESTIMATED');

    const totalSavings = finopsEngine.getSummary(validWorkspace).totalEstimatedMonthlySavings;
    assert.strictEqual(totalSavings, 77.50); // 45 + 28.5 + 4 = 77.5
  });

  it('should simulate what-if cost scenarios and label output WHAT-IF / ESTIMATED', () => {
    const scenario = finopsEngine.simulateWhatIf(validWorkspace, {
      ec2ScaleMultiplier: 1.2,
      s3GrowthMultiplier: 1.5,
      downsizeInstancesCount: 1
    });

    assert.ok(scenario);
    assert.strictEqual(scenario.baselineSpend, 604.50);
    assert.strictEqual(scenario.provenance, 'WHAT-IF');
    assert.ok(typeof scenario.simulatedSpend === 'number');
    assert.ok(typeof scenario.deltaSpend === 'number');
  });

  it('should return empty FinOps summary with NOT_CONNECTED provenance for disconnected workspaces', () => {
    const disconnectedSummary = finopsEngine.getSummary('ws-disconnected-workspace');
    assert.strictEqual(disconnectedSummary.provenance, 'NOT_CONNECTED');
    assert.strictEqual(disconnectedSummary.monthToDateSpend, 0);
    assert.strictEqual(disconnectedSummary.costByAccount.length, 0);
  });

  it('should strictly enforce tenant isolation preventing cross-workspace cost record retrieval', () => {
    const records = finopsEngine.getCostRecords('ws-unauthorized-tenant');
    assert.strictEqual(records.length, 0, 'Cross-workspace query must return 0 records');
  });
});
