import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RealMultiCloudFinOpsEngine } from '../src/services/real-multicloud-finops-engine.js';

describe('CLOUDPULSE Phase 65 Real Multi-Cloud FinOps, Unit Economics & Cost Governance Tests', () => {
  const engine = RealMultiCloudFinOpsEngine.getInstance();
  const workspaceId = 'ws-production';
  const tenantId = 'tenant-enterprise-01';

  describe('1. Multi-Cloud Billing Normalization & Provenance (AWS, Azure, GCP, K8s)', () => {
    it('should retrieve normalized billing records across all 4 providers with truthful provenance', async () => {
      const records = await engine.getCostRecords(workspaceId);
      assert.ok(records.length >= 8, 'Should have at least 8 normalized cost records');

      const providers = new Set(records.map(r => r.provider));
      assert.ok(providers.has('AWS'), 'Must contain AWS billing records');
      assert.ok(providers.has('AZURE'), 'Must contain Azure billing records');
      assert.ok(providers.has('GCP'), 'Must contain GCP billing records');
      assert.ok(providers.has('KUBERNETES'), 'Must contain Kubernetes workload cost records');

      // Verify AWS EC2 record
      const awsEc2 = records.find(r => r.service === 'Amazon EC2');
      assert.ok(awsEc2);
      assert.strictEqual(awsEc2.currency, 'USD');
      assert.strictEqual(awsEc2.allocationType, 'DIRECT');
      assert.strictEqual(awsEc2.source, 'COST_EXPLORER');
      assert.strictEqual(awsEc2.confidence, 1.0);

      // Verify Azure VM record
      const azureVm = records.find(r => r.provider === 'AZURE' && r.service === 'Virtual Machines');
      assert.ok(azureVm);
      assert.strictEqual(azureVm.source, 'AZURE_COST_MGMT');
      assert.ok(azureVm.amount > 0);

      // Verify GCP BigQuery record
      const gcpBq = records.find(r => r.provider === 'GCP' && r.service === 'BigQuery');
      assert.ok(gcpBq);
      assert.strictEqual(gcpBq.source, 'GCP_BILLING');
      assert.strictEqual(gcpBq.costCategory, 'data_analytics');
    });

    it('should adhere to Truth-in-Labeling: Untagged/unmapped storage returns UNKNOWN allocation with low confidence', async () => {
      const records = await engine.getCostRecords(workspaceId);
      const unallocated = records.find(r => r.resourceId === 's3-legacy-temp-dump-2025');
      assert.ok(unallocated, 'Legacy unallocated bucket must exist');
      assert.strictEqual(unallocated.allocationType, 'UNKNOWN');
      assert.ok(unallocated.confidence <= 0.5, 'Confidence must be low for unmapped resource');
    });

    it('should support filtering cost records by provider, category, and allocation type', async () => {
      const awsRecords = await engine.getCostRecords(workspaceId, { provider: 'AWS' });
      assert.ok(awsRecords.every(r => r.provider === 'AWS'));

      const dbRecords = await engine.getCostRecords(workspaceId, { costCategory: 'database' });
      assert.ok(dbRecords.every(r => r.costCategory === 'database'));

      const directRecords = await engine.getCostRecords(workspaceId, { allocationType: 'DIRECT' });
      assert.ok(directRecords.every(r => r.allocationType === 'DIRECT'));
    });
  });

  describe('2. Multi-Currency Support & Exchange Rate Provenance', () => {
    it('should return exact 1:1 parity when converting identical currencies', () => {
      const res = engine.convertCurrency(100.0, 'USD', 'USD');
      assert.strictEqual(res.sourceAmount, 100.0);
      assert.strictEqual(res.targetAmount, 100.0);
      assert.strictEqual(res.exchangeRate, 1.0);
      assert.strictEqual(res.conversionStatus, 'EXACT');
    });

    it('should convert EUR to USD with explicit exchange rate source and CALCULATED status', () => {
      const res = engine.convertCurrency(100.0, 'EUR', 'USD');
      assert.strictEqual(res.sourceCurrency, 'EUR');
      assert.strictEqual(res.targetCurrency, 'USD');
      assert.strictEqual(res.targetAmount, 108.50);
      assert.strictEqual(res.conversionStatus, 'CALCULATED');
      assert.ok(res.exchangeRateSource.includes('European Central Bank'));
    });

    it('should handle unconfigured currency with UNKNOWN status rather than silent conversion', () => {
      const res = engine.convertCurrency(100.0, 'XYZ_COIN', 'USD');
      assert.strictEqual(res.conversionStatus, 'UNKNOWN');
      assert.strictEqual(res.exchangeRateSource, 'UNKNOWN');
      assert.strictEqual(res.targetAmount, 100.0);
    });
  });

  describe('3. Cost Allocation & Showback/Chargeback Engine', () => {
    it('should compute executive scorecard with accurate provider, category, environment and team allocation', async () => {
      const scorecard = await engine.getScorecard(workspaceId, 'USD');
      assert.ok(scorecard);
      assert.ok(scorecard.totalSpendMtd > 1000, 'Total MTD spend should be > $1000');
      assert.strictEqual(scorecard.currency, 'USD');
      assert.strictEqual(scorecard.freshness, 'PROVISIONAL');
      assert.strictEqual(scorecard.isBillingDelayed, false);

      // Provider breakdown
      assert.ok(scorecard.spendByProvider.length >= 3);
      const awsSpend = scorecard.spendByProvider.find(p => p.provider === 'AWS');
      assert.ok(awsSpend && awsSpend.amount > 0);

      // Allocation coverage
      assert.ok(scorecard.allocationCoveragePercent >= 85, 'Allocation coverage should be >= 85%');
      assert.ok(scorecard.unallocatedSpendMtd > 0, 'Unallocated spend should be explicitly calculated');

      // Team showback
      assert.ok(scorecard.spendByTeam.length >= 3);
      const unallocatedTeam = scorecard.spendByTeam.find(t => t.isUnallocated);
      assert.ok(unallocatedTeam, 'Unallocated infrastructure must be shown as a distinct bucket');
      assert.ok(unallocatedTeam.teamName.includes('Unallocated'));
    });

    it('should maintain FinOps data quality metrics with missing tags count and score', async () => {
      const scorecard = await engine.getScorecard(workspaceId);
      const dq = scorecard.dataQualityMetrics;
      assert.ok(dq);
      assert.ok(dq.dataQualityScore >= 80, 'Data quality score should be >= 80');
      assert.ok(dq.missingTagsCount >= 1, 'Should identify resources missing tags');
      assert.ok(dq.billingDelayHours < 2, 'Billing delay should be under 2 hours');
    });
  });

  describe('4. Unit Economics Engine (Linked to Real Telemetry Denominators)', () => {
    it('should compute unit economics for services linked to OpenTelemetry, Prometheus, and CloudWatch metrics', async () => {
      const ueMetrics = await engine.getUnitEconomics(workspaceId);
      assert.ok(ueMetrics.length >= 4, 'Should have unit metrics for API Gateway, Payment, Order, and Audit Lake');

      // 1. API Gateway: Cost per HTTP Request
      const apiReq = ueMetrics.find(m => m.serviceId === 'api-gateway');
      assert.ok(apiReq);
      assert.strictEqual(apiReq.unitType, 'REQUEST');
      assert.strictEqual(apiReq.denominatorSource, 'OPENTELEMETRY');
      assert.strictEqual(apiReq.calculationType, 'CALCULATED');
      assert.ok(apiReq.unitCost > 0 && apiReq.unitCost < 0.001, 'Cost per request should be fractional cent');
      assert.ok(apiReq.formula.includes('W3C HTTP Request Count'));

      // 2. Payment Service: Cost per Transaction
      const payTxn = ueMetrics.find(m => m.serviceId === 'payment-service');
      assert.ok(payTxn);
      assert.strictEqual(payTxn.unitType, 'TRANSACTION');
      assert.strictEqual(payTxn.denominatorSource, 'PROMETHEUS');
      assert.strictEqual(payTxn.unitDenominatorCount, 850000);

      // 3. S3 Audit Lake: Cost per GB
      const s3Gb = ueMetrics.find(m => m.serviceId === 's3-audit-lake');
      assert.ok(s3Gb);
      assert.strictEqual(s3Gb.unitType, 'GB_PROCESSED');
      assert.strictEqual(s3Gb.denominatorSource, 'CLOUDWATCH');
      assert.strictEqual(s3Gb.unitCost, 0.0251);
    });
  });

  describe('5. Kubernetes FinOps (Node vs Pod vs Shared Overhead & Waste)', () => {
    it('should calculate Kubernetes workload allocation, request-vs-actual ratio, and overprovisioned waste', async () => {
      const k8sAllocations = await engine.getKubernetesFinOps(workspaceId);
      assert.ok(k8sAllocations.length >= 3, 'Should have allocation for payment-service, order-service, api-gateway');

      const payment = k8sAllocations.find(k => k.workloadName === 'payment-service');
      assert.ok(payment);
      assert.strictEqual(payment.namespace, 'cloudpulse-prod');
      assert.strictEqual(payment.allocationType, 'ALLOCATED');
      assert.ok(payment.nodeCostMonthly > 0, 'Node compute cost share must be tracked');
      assert.ok(payment.podComputeCostMonthly > 0, 'Pod compute cost must be tracked');
      assert.strictEqual(payment.cpuRequestVsActualRatio, 2.2, 'CPU ratio should reflect 2.2x overbooking');
      assert.strictEqual(payment.overprovisionedWasteMonthly, 42.00, 'Monthly overprovisioned waste should be $42.00');
    });
  });

  describe('6. Real Cost Anomaly Detection & Temporal Change Correlation', () => {
    it('should detect cost anomalies and correlate with deployments and scaling changes', async () => {
      const anomalies = await engine.getAnomalies(workspaceId);
      assert.ok(anomalies.length >= 1, 'Should detect active cost anomalies');

      const rdsAnom = anomalies[0];
      assert.strictEqual(rdsAnom.service, 'Amazon RDS');
      assert.strictEqual(rdsAnom.provider, 'AWS');
      assert.strictEqual(rdsAnom.baselineCost, 195.00);
      assert.strictEqual(rdsAnom.observedCost, 295.00);
      assert.strictEqual(rdsAnom.deltaCost, 100.00);
      assert.strictEqual(rdsAnom.deltaPercent, 51.3);
      assert.strictEqual(rdsAnom.confidence, 0.94);

      // Verify Correlated Changes
      assert.ok(rdsAnom.correlatedChanges && rdsAnom.correlatedChanges.length >= 1);
      const corr = rdsAnom.correlatedChanges[0];
      assert.strictEqual(corr.changeType, 'DEPLOYMENT');
      assert.strictEqual(corr.correlationType, 'TEMPORAL_CORRELATION');
      assert.ok(corr.summary.includes('payment-service v2.8.4'));
    });
  });

  describe('7. Cost Forecasting & Multi-Scope Budget Burn Rates', () => {
    it('should generate multi-cloud spend forecasts with confidence bands and historical windows', async () => {
      const forecasts = await engine.getForecasts(workspaceId);
      assert.ok(forecasts.length >= 3, 'Should have forecasts for Workspace, AWS, Azure, GCP');

      const wsForecast = forecasts.find(f => f.scope === 'WORKSPACE');
      assert.ok(wsForecast);
      assert.strictEqual(wsForecast.status, 'OK');
      assert.ok(wsForecast.projectedMonthlySpend > wsForecast.actualSpendMtd);
      assert.ok(wsForecast.forecastRangeLow < wsForecast.projectedMonthlySpend);
      assert.ok(wsForecast.forecastRangeHigh > wsForecast.projectedMonthlySpend);
      assert.ok(wsForecast.confidenceScore >= 0.85);
    });

    it('should monitor multi-scope budgets, alert thresholds, and projected exhaustion dates', async () => {
      const budgets = await engine.getBudgets(workspaceId);
      assert.ok(budgets.length >= 3, 'Should track Production, Payments Squad, and RDS budgets');

      const paymentsBudget = budgets.find(b => b.scopeId === 'cc-payments-squad');
      assert.ok(paymentsBudget);
      assert.strictEqual(paymentsBudget.status, 'AT_RISK');
      assert.ok(paymentsBudget.burnRateMultiplier > 1.0, 'Burn rate should be elevated');
      assert.ok(paymentsBudget.projectedExhaustionDate !== undefined);
    });
  });

  describe('8. Governed Savings Opportunities, Tradeoffs & Verification Ledger', () => {
    it('should retrieve evidence-backed savings opportunities with operational risk ratings', async () => {
      const opps = await engine.getSavingsOpportunities(workspaceId);
      assert.ok(opps.length >= 3);

      const idleBucket = opps.find(o => o.type === 'UNATTACHED_STORAGE');
      assert.ok(idleBucket);
      assert.strictEqual(idleBucket.estimatedMonthlySavings, 58.00);
      assert.strictEqual(idleBucket.operationalRisk, 'LOW');
      assert.ok(idleBucket.evidence.includes('90 days'));
      assert.ok(idleBucket.reliabilityTradeoff.length > 0);
      assert.ok(idleBucket.securityTradeoff.length > 0);
    });

    it('should evaluate Cost vs Reliability vs Security tradeoffs with explicit safety recommendations', () => {
      // Scenario A: Safe right-sizing (Low capacity reduction, no redundancy loss)
      const safeEval = engine.evaluateTradeoff({
        actionTitle: 'Right-size Dev RDS Database',
        resourceType: 'Database',
        costReductionMonthly: 45.0,
        capacityDeltaPercent: 15,
        redundancyReduced: false
      });
      assert.strictEqual(safeEval.overallRecommendation, 'RECOMMENDED');
      assert.strictEqual(safeEval.reliabilityImpact.capacityRisk, 'LOW');
      assert.strictEqual(safeEval.governanceImpact.policyCompliance, 'COMPLIANT');

      // Scenario B: Dangerous cost cutting (Removes Multi-AZ redundancy)
      const dangerousEval = engine.evaluateTradeoff({
        actionTitle: 'Disable Production Multi-AZ RDS Secondary',
        resourceType: 'Database',
        costReductionMonthly: 150.0,
        capacityDeltaPercent: 0,
        redundancyReduced: true
      });
      assert.strictEqual(dangerousEval.overallRecommendation, 'REJECT_RISK_TOO_HIGH');
      assert.ok(dangerousEval.reliabilityImpact.resilienceWarning?.includes('Single point of failure'));
      assert.strictEqual(dangerousEval.governanceImpact.policyCompliance, 'VIOLATION');
    });

    it('should record post-optimization realized savings in verified savings ledger', async () => {
      const opps = await engine.getSavingsOpportunities(workspaceId);
      const target = opps.find(o => o.id === 'opt-k8s-payment-cpu-limits');
      assert.ok(target);

      const verified = await engine.verifySavings(
        target.id,
        42.00,
        { userId: 'usr-sre-lead', name: 'Elena Rostova' },
        'Prometheus node metric verification confirmed $42.00/mo savings.'
      );

      assert.strictEqual(verified.status, 'EXECUTED');
      assert.strictEqual(verified.verificationStatus, 'VERIFIED_SAVINGS');
      assert.strictEqual(verified.observedSavingsMonthly, 42.00);

      // Scorecard reflects verified savings
      const scorecard = await engine.getScorecard(workspaceId);
      assert.ok(scorecard.totalVerifiedSavingsMonthly >= 42.00);
    });
  });

  describe('9. Cost Centers & Configurable Allocation Rules', () => {
    it('should retrieve existing cost centers with allocated spend and budget limits', async () => {
      const ccs = await engine.getCostCenters(workspaceId);
      assert.ok(ccs.length >= 3, 'Should track Platform, Payments, and Security cost centers');

      const platformCc = ccs.find(c => c.code === 'CC-ENG-PLATFORM');
      assert.ok(platformCc);
      assert.strictEqual(platformCc.owner, 'Liam O\'Connor');
      assert.ok(platformCc.allocationRules.length >= 1);
    });

    it('should allow creating a new cost center with tagging allocation rules', async () => {
      const newCc = await engine.createCostCenter(workspaceId, tenantId, {
        name: 'Data Science & GenAI Lab',
        code: 'CC-DATA-GENAI',
        owner: 'Dr. Aris Vance',
        ownerEmail: 'aris.vance@cloudpulse.internal',
        budgetLimit: 2500.00,
        currency: 'USD'
      });

      assert.ok(newCc.id.startsWith('cc-'));
      assert.strictEqual(newCc.code, 'CC-DATA-GENAI');
      assert.strictEqual(newCc.status, 'ACTIVE');

      const retrieved = (await engine.getCostCenters(workspaceId)).find(c => c.id === newCc.id);
      assert.ok(retrieved);
    });
  });

  describe('10. AI FinOps Analyst Assistant (Grounded with Evidence Citations)', () => {
    it('should answer spend increase questions citing root cause anomalies and correlated deployments', async () => {
      const result = await engine.investigate('Why did cloud spend increase this week?', workspaceId);
      assert.ok(result);
      assert.strictEqual(result.intent, 'SPEND_INCREASE_ANALYSIS');
      assert.strictEqual(result.confidence, 'HIGH');
      assert.ok(result.primaryAnswer.includes('Amazon RDS') || result.primaryAnswer.includes('+$100.00/mo'));
      assert.ok(result.evidenceCitations.length >= 2, 'Must cite anomaly and cost record');
      assert.ok(result.safeActionsRecommended && result.safeActionsRecommended.length >= 1);
    });

    it('should answer unit economics questions with exact service metrics', async () => {
      const result = await engine.investigate('What is our cost per request and transaction?', workspaceId);
      assert.ok(result);
      assert.strictEqual(result.intent, 'UNIT_ECONOMICS');
      assert.ok(result.primaryAnswer.includes('API Gateway'));
      assert.ok(result.primaryAnswer.includes('Payment Service'));
      assert.ok(result.evidenceCitations.length >= 1);
    });

    it('should answer savings opportunities questions listing credible, governed optimizations', async () => {
      const result = await engine.investigate('Where is the biggest waste or savings opportunity?', workspaceId);
      assert.ok(result);
      assert.strictEqual(result.intent, 'SAVINGS_OPPORTUNITIES');
      assert.ok(result.primaryAnswer.includes('S3 Staging Bucket') || result.primaryAnswer.includes('Azure SQL'));
      assert.ok(result.evidenceCitations.length >= 2);
    });
  });
});
