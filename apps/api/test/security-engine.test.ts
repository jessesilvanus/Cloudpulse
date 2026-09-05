import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SecurityEngine } from '../src/services/security-engine.js';

describe('CLOUDPULSE Phase 8 Cloud Security & Zero Trust Engine', () => {
  const securityEngine = SecurityEngine.getInstance();

  it('should calculate accurate security posture score and grade', () => {
    const posture = securityEngine.getSecurityPosture();
    assert.ok(posture.overallScore >= 0 && posture.overallScore <= 100);
    assert.ok(['A+', 'A', 'B', 'C', 'D', 'F'].includes(posture.grade));
    assert.ok(posture.categories.iam.score > 0);
    assert.ok(posture.categories.secrets.score > 0);
    assert.ok(posture.categories.network.score > 0);
    assert.ok(posture.categories.container.score > 0);
  });

  it('should manage security findings and allow status updates', () => {
    const findings = securityEngine.getFindings();
    assert.ok(findings.length >= 3, 'Must have initial security findings');

    const finding = findings[0];
    assert.ok(finding.id);
    assert.ok(finding.category);
    assert.ok(finding.severity);

    const updated = securityEngine.updateFindingStatus(finding.id, 'acknowledged', 'test-operator@cloudpulse.internal');
    assert.strictEqual(updated.status, 'acknowledged');
  });

  it('should record immutable security audit log events', () => {
    const initialCount = securityEngine.getAuditLog().length;
    const entry = securityEngine.logSecurityEvent({
      eventType: 'AUTH_SUCCESS',
      actor: 'security-tester@cloudpulse.internal',
      role: 'operator',
      resource: '/api/v1/security/findings',
      action: 'GET',
      status: 'allow',
      ipAddress: '127.0.0.1',
      details: 'Test security event log entry'
    });

    assert.ok(entry.id);
    assert.strictEqual(entry.eventType, 'AUTH_SUCCESS');
    assert.strictEqual(securityEngine.getAuditLog().length, initialCount + 1);
  });

  it('should provide operational security runbooks for threat containment', () => {
    const runbooks = securityEngine.getSecurityRunbooks();
    assert.ok(runbooks.length >= 2, 'Must have at least 2 security runbooks');

    const credRunbook = securityEngine.getSecurityRunbookById('srb-credential-leak');
    assert.ok(credRunbook, 'Credential leak runbook must exist');
    assert.ok(credRunbook.detection.length > 0);
    assert.ok(credRunbook.containment.length > 0);
    assert.ok(credRunbook.remediation.length > 0);
  });

  it('should map implemented cloud security controls to industry compliance frameworks', () => {

    const controls = securityEngine.getComplianceControls();
    assert.ok(controls.length >= 4, 'Must have mapped compliance controls');
    const cisK8s = controls.find((c) => c.framework === 'CIS_K8S');
    assert.ok(cisK8s);
    assert.strictEqual(cisK8s.status, 'compliant');
    assert.ok(cisK8s.evidence.length > 0);
  });


  it('should generate Cloud SOC summary with overall score, threat level, and event volume', () => {
    const soc = securityEngine.getCloudSocSummary();
    assert.ok(soc.overallSecurityScore >= 90);
    assert.strictEqual(soc.threatLevel, 'low');
    assert.ok(soc.totalEventsIngested24h > 1000);
    assert.ok(soc.coveragePercent >= 90);
  });

  it('should query security events with optional source and severity filtering', () => {
    const events = securityEngine.getSecurityEvents();
    assert.ok(events.length >= 2);
    const iamEvents = securityEngine.getSecurityEvents('iam');
    assert.ok(iamEvents.every((e) => e.source === 'iam'));
  });

  it('should maintain active detection rules for auth bursts and privilege escalation', () => {
    const rules = securityEngine.getDetectionRules();
    assert.ok(rules.length >= 3);
    assert.ok(rules.some((r) => r.id === 'rule-failed-auth-burst'));
    assert.ok(rules.some((r) => r.id === 'rule-privilege-escalation'));
    assert.ok(rules.every((r) => r.enabled));
  });

  it('should maintain security correlation sequences with risk scores and attack patterns', () => {
    const sequences = securityEngine.getSecuritySequences();
    assert.ok(sequences.length >= 1);
    const seq = sequences[0];
    assert.ok(seq.riskScore > 0);
    assert.strictEqual(seq.confidence, 'high');
    assert.ok(seq.events.length > 0);
  });

  it('should manage security incident lifecycle and track investigation timelines', () => {
    const incidents = securityEngine.getSecurityIncidents();
    assert.ok(incidents.length >= 1);
    const incident = incidents[0];
    assert.ok(incident.id);
    assert.ok(incident.timeline.length >= 2);
    assert.strictEqual(incident.status, 'resolved');
  });
});

