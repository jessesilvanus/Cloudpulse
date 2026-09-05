import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SreEngine } from '../src/services/sre-engine.js';

describe('CLOUDPULSE Phase 7 Advanced SRE & Reliability Engine', () => {
  const sreEngine = SreEngine.getInstance();

  it('should calculate accurate SRE reliability metrics (MTTA, MTTR, MTBF)', () => {
    const metrics = sreEngine.getSreMetrics();
    assert.ok(metrics.mttaMinutes > 0, 'MTTA must be greater than 0');
    assert.ok(metrics.mttrMinutes > 0, 'MTTR must be greater than 0');
    assert.ok(metrics.mtbfHours > 0, 'MTBF must be greater than 0');
    assert.strictEqual(typeof metrics.avgErrorBudgetConsumptionPercent, 'number');
  });

  it('should retrieve structured runbooks with diagnostic commands and mitigation steps', () => {
    const runbooks = sreEngine.getRunbooks();
    assert.ok(runbooks.length >= 2, 'Must have at least 2 default runbooks');

    const paymentRunbook = sreEngine.getRunbookById('rb-payment-failure');
    assert.ok(paymentRunbook, 'Payment failure runbook must exist');
    assert.strictEqual(paymentRunbook.serviceId, 'payment-service');
    assert.ok(paymentRunbook.symptoms.length > 0);
    assert.ok(paymentRunbook.diagnosticCommands.length > 0);
    assert.ok(paymentRunbook.mitigationSteps.length > 0);
  });

  it('should execute safe automated remediation and record immutable audit logs', () => {
    const remediations = sreEngine.getRemediations();
    assert.ok(remediations.length >= 2, 'Must have safe remediation actions');

    const initialAuditCount = sreEngine.getRemediationAuditLog().length;
    const logEntry = sreEngine.executeRemediation('act-probe-health', 'sre_operator');

    assert.strictEqual(logEntry.actionId, 'act-probe-health');
    assert.strictEqual(logEntry.status, 'success');
    assert.strictEqual(sreEngine.getRemediationAuditLog().length, initialAuditCount + 1);
  });

  it('should maintain comprehensive postmortems with 5-whys and action items', () => {
    const postmortems = sreEngine.getPostmortems();
    assert.ok(postmortems.length >= 1, 'Must have published postmortem');

    const pm = postmortems[0];
    assert.strictEqual(pm.severity, 'sev1');
    assert.ok(pm.fiveWhys.length >= 5, 'Must contain 5-whys root cause analysis');
    assert.ok(pm.actionItems.length >= 2, 'Must contain action items with priority and owner');
    assert.strictEqual(pm.actionItems[0].status, 'completed');
  });

  it('should provide deployment history for change correlation during incidents', () => {
    const deployments = sreEngine.getDeployments();
    assert.ok(deployments.length >= 3, 'Must have deployment history across services');
    assert.ok(deployments[0].commitSha.length >= 7, 'Must have valid Git commit SHA');
    assert.strictEqual(deployments[0].version, 'v0.0.3');
  });

  it('should provide notification channels with truthful configuration status', () => {
    const channels = sreEngine.getNotificationChannels();
    assert.ok(channels.length >= 2, 'Must have notification channels');
    const slack = channels.find((c) => c.type === 'slack');
    assert.ok(slack);
    assert.strictEqual(slack.configured, false, 'Unconfigured external webhook must be honestly marked false');
  });
});
