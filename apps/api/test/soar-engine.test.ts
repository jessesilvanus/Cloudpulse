import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SoarEngine } from '../src/services/soar-engine.js';

describe('CLOUDPULSE Phase 19 SOAR & Cloud Incident Response Platform', () => {
  const soar = SoarEngine.getInstance();

  it('should generate SOAR platform summary with truthful metrics', () => {
    const summary = soar.getSoarSummary();
    assert.strictEqual(typeof summary.activeIncidentsCount, 'number');
    assert.strictEqual(typeof summary.automationRatePercent, 'number');
    assert.strictEqual(typeof summary.playbookSuccessRatePercent, 'number');
    assert.strictEqual(typeof summary.mttaSeconds, 'number');
    assert.strictEqual(typeof summary.mttrSeconds, 'number');
    assert.strictEqual(typeof summary.responseReadinessScore, 'number');
    assert.ok(summary.responseReadinessScore >= 90, 'Response readiness score should meet baseline');
  });

  it('should query response incidents with priority, severity, and status filtering', () => {
    const all = soar.getIncidents();
    assert.ok(all.length >= 2, 'Should contain baseline seeded response incidents');

    const p1Incidents = soar.getIncidents('P1');
    assert.ok(p1Incidents.every((i) => i.priority === 'P1'), 'P1 filter must match strictly');

    const criticalIncidents = soar.getIncidents(undefined, 'critical');
    assert.ok(criticalIncidents.every((i) => i.severity === 'critical'), 'Critical severity filter must match strictly');
  });

  it('should perform automated triage with WHAT, WHY, EVIDENCE, and CONFIDENCE breakdown', () => {
    const incident = soar.getIncidentById('rinc-001');
    assert.ok(incident, 'Target incident rinc-001 must exist');
    assert.ok(incident.triageDetails, 'Triage details must be populated');
    assert.ok(incident.triageDetails.what.length > 0, 'WHAT explanation must be non-empty');
    assert.ok(incident.triageDetails.why.length > 0, 'WHY explanation must be non-empty');
    assert.ok(incident.triageDetails.evidence.length > 0, 'Evidence list must be populated');
    assert.strictEqual(incident.triageDetails.confidence, 'high');

    const triaged = soar.triageIncident('rinc-001');
    assert.strictEqual(triaged.status, 'TRIAGED');
  });

  it('should maintain defensive response playbooks with step definitions and risk levels', () => {
    const playbooks = soar.getPlaybooks();
    assert.ok(playbooks.length >= 2, 'Should contain at least 2 active playbooks');

    const iamPb = soar.getPlaybookById('pb-iam-containment-01');
    assert.ok(iamPb, 'IAM containment playbook must exist');
    assert.strictEqual(iamPb.approvalPolicy, 'APPROVAL_REQUIRED');
    assert.strictEqual(iamPb.status, 'ACTIVE');
    assert.ok(iamPb.steps.length >= 4, 'Should contain at least 4 structured steps');

    const approvalStep = iamPb.steps.find((s) => s.type === 'REQUEST_APPROVAL');
    assert.ok(approvalStep, 'Must contain a step requesting human approval');
    assert.strictEqual(approvalStep.requiresApproval, true);
    assert.strictEqual(approvalStep.risk, 'HIGH_RISK');
  });

  it('should execute playbook in DRY RUN mode without triggering approval locks', () => {
    const result = soar.executePlaybook('rinc-001', 'pb-iam-containment-01', true);
    assert.strictEqual(result.dryRun, true);
    assert.strictEqual(result.status, 'DRY_RUN_COMPLETED');
    assert.ok(result.executions.length >= 4, 'Should simulate all steps in DRY RUN mode');
    assert.ok(
      result.executions.every((e) => e.verificationStatus === 'SUCCESS'),
      'Dry run executions should simulate success verification'
    );
  });

  it('should pause live execution for high-risk steps and queue human approval requests', () => {
    const result = soar.executePlaybook(
      'rinc-001',
      'pb-iam-containment-01',
      false,
      'soar-operator@cloudpulse.internal'
    );
    assert.strictEqual(result.dryRun, false);
    assert.strictEqual(result.status, 'EXECUTING');

    const approvals = soar.getApprovalRequests();
    assert.ok(approvals.length > 0, 'Must have at least 1 pending approval request');
    const latestApproval = approvals[0];
    assert.strictEqual(latestApproval.incidentId, 'rinc-001');
    assert.strictEqual(latestApproval.decision, 'PENDING');
  });

  it('should enforce separation of duties on approval decisions', () => {
    const approvals = soar.getApprovalRequests();
    const pending = approvals.find((a) => a.decision === 'PENDING');
    assert.ok(pending, 'Must have a pending approval');

    // Requester cannot approve their own request
    assert.throws(
      () => {
        soar.decideApprovalRequest(pending.id, 'APPROVED', pending.requestedBy);
      },
      /Separation of Duties violation/,
      'Requester must be blocked from approving their own request'
    );
  });

  it('should complete approval decision and update action verification status', () => {
    const approvals = soar.getApprovalRequests();
    const pending = approvals.find((a) => a.decision === 'PENDING');
    assert.ok(pending, 'Must have a pending approval');

    const approved = soar.decideApprovalRequest(
      pending.id,
      'APPROVED',
      'independent-security-lead@cloudpulse.internal',
      'Verified zero production CI impact.'
    );
    assert.strictEqual(approved.decision, 'APPROVED');
    assert.strictEqual(approved.approver, 'independent-security-lead@cloudpulse.internal');

    const actions = soar.getActionExecutions(pending.incidentId);
    const relatedAction = actions.find((a) => a.id === pending.actionId);
    assert.ok(relatedAction, 'Related action execution must exist');
    assert.strictEqual(relatedAction.status, 'COMPLETED');
    assert.strictEqual(relatedAction.verificationStatus, 'SUCCESS');
  });

  it('should manage post-incident reviews (PIR) with 5 Whys root cause and corrective actions', () => {
    const pirs = soar.getPostIncidentReviews();
    assert.ok(pirs.length > 0, 'Must contain seeded post-incident reviews');

    const pir = soar.getPostIncidentReviewByIncidentId('rinc-002');
    assert.ok(pir, 'PIR for incident rinc-002 must exist');
    assert.ok(pir.rootCause.length > 0, 'Root cause must be populated');
    assert.ok(pir.timeline.length >= 4, 'Timeline must contain major phases');
    assert.ok(pir.lessonsLearned.length > 0, 'Lessons learned must be categorized');
    assert.ok(pir.correctiveActions.length > 0, 'Corrective action items must be tracked');
  });
});
