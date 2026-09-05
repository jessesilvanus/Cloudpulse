import { describe, it } from 'node:test';
import assert from 'node:assert';
import { IaCAutomationEngine } from '../src/services/iac-automation-engine.js';

describe('CLOUDPULSE Phase 36 Infrastructure-as-Code & Advanced Platform Automation', () => {
  const engine = IaCAutomationEngine.getInstance();

  it('should return IaC platform summary with managed resources and success rates', () => {
    const summary = engine.getSummary();
    assert.strictEqual(summary.totalProjectsCount, 2);
    assert.strictEqual(summary.totalManagedResourcesCount, 22);
    assert.strictEqual(summary.detectedDriftsCount, 1);
    assert.strictEqual(summary.deploymentSuccessRatePercent, 98.4);
    assert.strictEqual(summary.estimatedTotalMonthlySpend, 1300.5);
  });

  it('should list IaC projects across AWS and Kubernetes with cost estimates', () => {
    const projects = engine.getProjects();
    assert.strictEqual(projects.length, 2);

    const awsProj = projects.find((p) => p.projectId === 'proj-aws-prod-core');
    assert.ok(awsProj);
    assert.strictEqual(awsProj.provider, 'aws');
    assert.strictEqual(awsProj.environment, 'production');
    assert.ok(awsProj.monthlyCostEstimate > 900.0);

    const k8sProj = projects.find((p) => p.projectId === 'proj-k8s-platform');
    assert.ok(k8sProj);
    assert.strictEqual(k8sProj.provider, 'kubernetes');
    assert.strictEqual(k8sProj.status, 'DRIFTED');
  });

  it('should retrieve stacks for specific project with state versions and lock status', () => {
    const stacks = engine.getStacks('proj-aws-prod-core');
    assert.strictEqual(stacks.length, 1);
    assert.strictEqual(stacks[0]?.name, 'vpc-production-network');
    assert.strictEqual(stacks[0]?.status, 'SYNCHRONIZED');
    assert.strictEqual(stacks[0]?.isLocked, false);
    assert.ok(stacks[0].resources.includes('aws_vpc.primary'));
  });

  it('should provide infrastructure blueprints with parameters and security requirements', () => {
    const blueprints = engine.getBlueprints();
    assert.ok(blueprints.length >= 2);

    const microservicesBp = blueprints.find((b) => b.blueprintId === 'bp-prod-microservices');
    assert.ok(microservicesBp);
    assert.strictEqual(microservicesBp.category, 'Microservices');
    assert.strictEqual(microservicesBp.availabilityTier, 'Multi-AZ');
    assert.ok(microservicesBp.securityRequirements.includes('KMS Encryption at rest'));
  });

  it('should create declarative execution plan with action counts and cost delta', () => {
    const plan = engine.createPlan({
      stackId: 'stack-k8s-workloads',
      resourceType: 'kubernetes_deployment',
      resourceName: 'payment-service',
      action: 'UPDATE',
      newState: { replicas: 4, memoryLimit: '2048Mi' },
      costImpactMonthly: 35.0
    });

    assert.strictEqual(plan.status, 'PLANNED');
    assert.strictEqual(plan.actionCounts.update, 1);
    assert.strictEqual(plan.actionCounts.create, 0);
    assert.strictEqual(plan.costDeltaMonthly, 35.0);
    assert.strictEqual(plan.riskLevel, 'LOW');
    assert.ok(plan.planId.startsWith('plan-'));
  });

  it('should validate plan against policy-as-code guards (MandatoryTagging, KmsEncryption, LeastPrivilege)', () => {
    const plans = engine.getPlans();
    assert.ok(plans.length > 0);
    const target = plans[0];

    const validation = engine.validatePlan(target.planId);
    assert.strictEqual(validation.validationResult, 'PASS');
    assert.strictEqual(validation.policyChecks.length, 3);
    assert.strictEqual(validation.costCheck.budgetCompliant, true);
  });

  it('should approve plan and update status to APPROVED', () => {
    const newPlan = engine.createPlan({
      stackId: 'stack-vpc-network',
      resourceType: 'aws_security_group_rule',
      resourceName: 'allow_https_inbound',
      action: 'CREATE',
      costImpactMonthly: 0
    });

    const approved = engine.approvePlan(newPlan.planId, 'lead-architect@enterprise.io');
    assert.strictEqual(approved.status, 'APPROVED');
  });

  it('should execute simulated deployment with step durations and rollback capability', () => {
    const plans = engine.getPlans();
    const approvedPlan = plans.find((p) => p.status === 'APPROVED');
    assert.ok(approvedPlan);

    const exec = engine.executeDeployment(approvedPlan.planId, 'SIMULATED');
    assert.strictEqual(exec.status, 'SUCCEEDED');
    assert.strictEqual(exec.executionMode, 'SIMULATED');
    assert.strictEqual(exec.rollbackPlanAvailable, true);
    assert.strictEqual(exec.steps.length, 4);
    assert.ok(exec.deploymentId.startsWith('dep-'));
  });

  it('should execute dry-run deployment without mutating production state', () => {
    const dryRunPlan = engine.createPlan({
      stackId: 'stack-vpc-network',
      resourceType: 'aws_nat_gateway',
      resourceName: 'nat_gateway_az_c',
      action: 'CREATE',
      costImpactMonthly: 32.5
    });

    const exec = engine.executeDeployment(dryRunPlan.planId, 'DRY_RUN');
    assert.strictEqual(exec.status, 'SUCCEEDED');
    assert.strictEqual(exec.executionMode, 'DRY_RUN');
    assert.strictEqual(dryRunPlan.status, 'EXECUTED');
  });

  it('should execute safe rollback restoring state snapshot to verified baseline', () => {
    const rollbackRes = engine.rollbackDeployment('dep-exec-2026-091');
    assert.strictEqual(rollbackRes.status, 'ROLLED_BACK');
    assert.ok(rollbackRes.message.includes('State snapshot restored'));
    assert.strictEqual(rollbackRes.revertedSteps.length, 4);
  });

  it('should detect configuration drift between declared and observed state', () => {
    const drifts = engine.getDriftRecords();
    assert.strictEqual(drifts.length, 1);

    const k8sDrift = drifts[0];
    assert.strictEqual(k8sDrift.resourceName, 'k8s_deployment.payment_service');
    assert.strictEqual(k8sDrift.driftType, 'CONFIG_MISMATCH');
    assert.strictEqual(k8sDrift.severity, 'MEDIUM');
    assert.strictEqual(k8sDrift.declaredValue.replicas, 2);
    assert.strictEqual(k8sDrift.observedValue.replicas, 3);
  });

  it('should reconcile detected drift and clear drift queue', () => {
    const drifts = engine.getDriftRecords();
    assert.ok(drifts.length > 0);
    const targetDrift = drifts[0];

    const reconcileRes = engine.reconcileDrift(targetDrift.driftId);
    assert.strictEqual(reconcileRes.status, 'RECONCILED');
    assert.ok(reconcileRes.message.includes('reconciled with observed state'));

    const remainingDrifts = engine.getDriftRecords();
    assert.strictEqual(remainingDrifts.length, 0);
  });

  it('should answer natural language IaC queries with grounded evidence citations', () => {
    const res = engine.queryIacAssistant('What is our current IaC drift and deployment status?');
    assert.strictEqual(res.status, 'OBSERVED');
    assert.ok(res.evidence.length >= 3);
    assert.ok(res.recommendation.includes('SIMULATED'));
  });
});
