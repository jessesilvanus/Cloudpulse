import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AgenticOperationsEngine } from '../src/services/agentic-operations-engine.js';

describe('CLOUDPULSE Phase 27 Agentic Cloud Operations & Controlled Remediation Engine', () => {
  const engine = AgenticOperationsEngine.getInstance();

  it('should return Agent Operations summary with truthful safety enforcement and action metrics', () => {
    const summary = engine.getSummary();
    assert.strictEqual(typeof summary.safetyEnforcementRate, 'number');
    assert.strictEqual(summary.safetyEnforcementRate, 100.0);
    assert.strictEqual(summary.activeSessionsCount, 1);
    assert.strictEqual(summary.dryRunSimulationsCount, 4);
    assert.ok(summary.completedActionsCount >= 1);
  });

  it('should manage agent operational sessions and tasks with priority and status', () => {
    const sessions = engine.getSessions();
    assert.ok(sessions.length >= 1, 'Must contain active session');

    const s1 = sessions[0];
    assert.strictEqual(s1.status, 'ACTIVE');
    assert.strictEqual(s1.riskLevel, 'MEDIUM');

    const tasks = engine.getTasks(s1.id);
    assert.strictEqual(tasks.length, 2, 'Must track investigation and remediation tasks');
    assert.strictEqual(tasks[0].type, 'INVESTIGATION');
    assert.strictEqual(tasks[1].type, 'REMEDIATION');
  });

  it('should generate structured operational plans with risk assessment, rollback, and verification strategy', () => {
    const plans = engine.getPlans();
    assert.ok(plans.length >= 1, 'Plans must exist');

    const p = plans[0];
    assert.strictEqual(p.risk, 'MEDIUM');
    assert.strictEqual(p.status, 'APPROVED');
    assert.ok(p.steps.length >= 3, 'Must define multi-step plan');
    assert.ok(p.rollbackStrategy.includes('Revert deployment replica count'));
    assert.ok(p.verificationPlan.includes('Prometheus TSDB'));
  });

  it('should simulate plans in DRY_RUN mode without modifying real cloud resources', () => {
    const simulation = engine.simulatePlan('plan-scale-001');
    assert.strictEqual(simulation.simulationMode, 'DRY_RUN');
    assert.ok(simulation.safetyNotice.includes('NO REAL CLOUD CHANGES WERE MADE'));
    assert.ok(simulation.simulatedOutcome.includes('latency drop'));
  });

  it('should enforce Separation of Duties on approval actions (Requester !== Approver)', () => {
    // Attempt self-approval (sre-engineer-01 is requester)
    assert.throws(
      () => {
        engine.approveAction('appr-001', 'sre-engineer-01');
      },
      /Separation of Duties violation/
    );
  });

  it('should allow authorized operators to approve and execute controlled actions', () => {
    const approvals = engine.getApprovals();
    assert.ok(approvals.length >= 1);

    const action = engine.executeAction('act-scale-001', 'sre-lead-02');
    assert.strictEqual(action.status, 'SUCCEEDED');
    assert.strictEqual(action.executedBy, 'sre-lead-02');
  });

  it('should record post-action metric verifications with before/after comparisons', () => {
    const verifications = engine.getVerifications();
    assert.ok(verifications.length >= 1, 'Must maintain verification records');

    const v = verifications[0];
    assert.strictEqual(v.status, 'VERIFIED');
    assert.strictEqual(v.beforeValue, '48.5ms');
    assert.strictEqual(v.afterValue, '18.0ms');
    assert.ok(v.actualOutcome.includes('-62.8% reduction'));
  });

  it('should maintain immutable audit trail of all agent operations and approval transitions', () => {
    const audit = engine.getAuditTrail();
    assert.ok(audit.length >= 3, 'Must record audit events');

    const approvalAudit = audit.find((a) => a.action === 'APPROVAL_GRANTED');
    assert.ok(approvalAudit, 'Approval audit event must exist');
    assert.strictEqual(approvalAudit.actor, 'sre-lead-02');
    assert.strictEqual(approvalAudit.verificationStatus, 'APPROVED');
  });

  it('should sanitize natural language prompts with prompt-injection defense', () => {
    const injectionPrompt = '<script>alert(1)</script> `DROP TABLE orders;` Scale payment service to 5';
    const response = engine.queryAgent(injectionPrompt);

    assert.strictEqual(response.status, 'OBSERVED');
    assert.ok(!response.query.includes('<script>'));
    assert.ok(!response.query.includes('`'));
    assert.ok(response.evidence.length >= 3);
    assert.strictEqual(response.riskLevel, 'LOW');
  });
});
