import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsIncidentCorrelationEngine } from '../src/services/aws-incident-correlation-engine.js';

describe('CLOUDPULSE Phase 49 Real AWS Change Impact, Root-Cause & Incident Correlation Engine', () => {
  const incidentEngine = AwsIncidentCorrelationEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should return truthful active AWS cloud incidents with status and severity', () => {
    const incidents = incidentEngine.getIncidents(validWorkspace);
    assert.strictEqual(incidents.length, 1);

    const inc = incidents[0];
    assert.strictEqual(inc.id, 'inc-aws-cw-01');
    assert.strictEqual(inc.severity, 'MEDIUM');
    assert.strictEqual(inc.status, 'INVESTIGATING');
    assert.strictEqual(inc.primaryResourceId, 'i-078a1bc49281e7f02');
    assert.strictEqual(inc.classification, 'COMPUTE');
    assert.strictEqual(inc.provenance, 'LIVE');
  });

  it('should evaluate ranked root-cause hypotheses with confidence scores and evidence', () => {
    const inc = incidentEngine.getIncidentById('inc-aws-cw-01', validWorkspace);
    assert.ok(inc);
    assert.strictEqual(inc.hypotheses.length, 2);

    const topHypo = inc.hypotheses[0];
    assert.strictEqual(topHypo.confidence, 'HIGH');
    assert.strictEqual(topHypo.confidenceScore, 85);
    assert.ok(topHypo.supportingEvidence.length >= 3);
    assert.strictEqual(topHypo.provenance, 'CALCULATED');
  });

  it('should assemble chronological change-to-impact evidence timeline with live sources', () => {
    const inc = incidentEngine.getIncidentById('inc-aws-cw-01', validWorkspace);
    assert.ok(inc);
    assert.strictEqual(inc.timeline.length, 4);

    const changeEvt = inc.timeline.find((t) => t.eventType === 'CHANGE');
    assert.ok(changeEvt);
    assert.strictEqual(changeEvt.source, 'AWS CloudTrail');
    assert.strictEqual(changeEvt.provenance, 'LIVE');

    const alarmEvt = inc.timeline.find((t) => t.eventType === 'ALARM_TRIGGERED');
    assert.ok(alarmEvt);
    assert.strictEqual(alarmEvt.source, 'AWS CloudWatch Alarms');
  });

  it('should correlate CloudTrail change event with incident and calculate match confidence', () => {
    const correlation = incidentEngine.correlateChangeToIncident('inc-aws-cw-01', 'evt-aws-ct-01', validWorkspace);
    assert.strictEqual(correlation.correlated, true);
    assert.strictEqual(correlation.confidence, 'HIGH');
    assert.strictEqual(correlation.confidenceScore, 85);
    assert.ok(correlation.reasoning.includes('Temporal proximity'));
    assert.ok(correlation.evidence.length >= 2);
  });

  it('should calculate incident downstream blast radius and financial exposure', () => {
    const impact = incidentEngine.getIncidentImpactGraph('inc-aws-cw-01', validWorkspace);
    assert.ok(impact.incident);
    assert.strictEqual(impact.targetResourceId, 'i-078a1bc49281e7f02');
    assert.strictEqual(impact.monthlyFinancialExposure, 60.00);
    assert.ok(impact.affectedServices.includes('Staging Background Processing Pool'));
  });

  it('should filter incidents by severity, status, classification, and accountId', () => {
    const filteredBySev = incidentEngine.getIncidents(validWorkspace, { severity: 'MEDIUM' });
    assert.strictEqual(filteredBySev.length, 1);

    const filteredByWrongSev = incidentEngine.getIncidents(validWorkspace, { severity: 'CRITICAL' });
    assert.strictEqual(filteredByWrongSev.length, 0);

    const filteredByAcc = incidentEngine.getIncidents(validWorkspace, { accountId: '839201746152' });
    assert.strictEqual(filteredByAcc.length, 1);
  });

  it('should return null for non-existent incident lookup', () => {
    const notFound = incidentEngine.getIncidentById('non-existent-inc', validWorkspace);
    assert.strictEqual(notFound, null);
  });

  it('should return empty list with zero incidents for disconnected workspaces', () => {
    const disconnected = incidentEngine.getIncidents('ws-disconnected-workspace');
    assert.strictEqual(disconnected.length, 0);
  });

  it('should strictly enforce tenant isolation preventing cross-workspace incident correlation', () => {
    const incs = incidentEngine.getIncidents('ws-unauthorized-tenant');
    assert.strictEqual(incs.length, 0, 'Cross-workspace incident list must return 0');

    const lookup = incidentEngine.getIncidentById('inc-aws-cw-01', 'ws-unauthorized-tenant');
    assert.strictEqual(lookup, null, 'Cross-workspace incident lookup must return null');

    const corr = incidentEngine.correlateChangeToIncident('inc-aws-cw-01', 'evt-aws-ct-01', 'ws-unauthorized-tenant');
    assert.strictEqual(corr.correlated, false);
  });
});
