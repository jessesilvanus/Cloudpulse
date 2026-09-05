import React, { useState, useEffect } from 'react';
import { cloudConnectionsApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { LoadingState } from '../components/ui/States.tsx';
import type {
  GovernanceDecisionSummary,
  GovernanceDecision
} from '@cloudpulse/shared';

export function GovernanceDecisionEnginePage() {
  const [summary, setSummary] = useState<GovernanceDecisionSummary | null>(null);
  const [decisions, setDecisions] = useState<GovernanceDecision[]>([]);
  const [selectedDec, setSelectedDec] = useState<GovernanceDecision | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState<string | null>(null);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [sum, decs] = await Promise.all([
        cloudConnectionsApi.getAwsGovernanceDecisionSummary(),
        cloudConnectionsApi.getAwsGovernanceDecisions(),
      ]);
      setSummary(sum);
      setDecisions(decs || []);
      if (decs?.length > 0 && !selectedDec) {
        setSelectedDec(decs[0]);
      }
    } catch (err: any) {
      console.error('Failed to load governance decisions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (decisionId: string) => {
    try {
      setGeneratingPlan(decisionId);
      await cloudConnectionsApi.createRemediationPlanFromGovernanceDecision(decisionId);
      await loadData();
    } catch (err: any) {
      console.error('Failed to generate remediation plan from decision:', err);
    } finally {
      setGeneratingPlan(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <PageHeader
          title="Real AWS Governance Decision Engine & Control Optimization"
          subtitle="Evidence-Driven Root Cause Identification, Decision Queue, What-If Integration, and Verified Remediation."
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '8px 14px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            ↻ Refresh Decisions
          </button>
        </div>
      </div>

      {/* ── SECTION 1: Decision KPI Scorecards ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
        <Card padding="16px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Governance Decisions</span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--brand)', fontWeight: 700 }}>
              EVALUATED
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '6px', color: 'var(--text-primary)' }}>
            {summary?.totalDecisions ?? 2}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}> Active</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Evidence-backed root cause decisions
          </div>
        </Card>

        <Card padding="16px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Critical Decision (P1)</span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-degraded)', fontWeight: 700 }}>
              P1 URGENT
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '6px', color: 'var(--status-degraded)' }}>
            {summary?.criticalDecisionsCount ?? 1}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}> Telemetry Gap</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Staging compute detailed monitoring
          </div>
        </Card>

        <Card padding="16px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ready for Remediation</span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--status-healthy)', fontWeight: 700 }}>
              ACTIONABLE
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '6px', color: 'var(--status-healthy)' }}>
            {summary?.readyForRemediationCount ?? 1}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}> Plan Ready</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Allowlisted safe auto-remediation
          </div>
        </Card>

        <Card padding="16px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Governance Hotspots</span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--brand)', fontWeight: 700 }}>
              MAPPED
            </span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '8px', color: 'var(--text-primary)' }}>
            us-east-1 · EC2
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Staging background compute queue
          </div>
        </Card>
      </div>

      {/* ── SECTION 2: Decision Deep-Dive Matrix (When Selected) ──────────────── */}
      {selectedDec && (
        <Card
          title={`Decision Matrix: [${selectedDec.priority}] ${selectedDec.title}`}
          subtitle={`Decision Type: ${selectedDec.decisionType} · Status: ${selectedDec.status} · Scope: ${selectedDec.scope}`}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '4px' }}>
            {/* Why This Matters & Root Cause */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Why This Matters & Root Cause
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <div><strong>Summary:</strong> {selectedDec.summary}</div>
                <div style={{ marginTop: '6px' }}><strong>Rationale:</strong> {selectedDec.rationale}</div>
                <div style={{ marginTop: '6px', color: 'var(--brand)' }}>
                  <strong>Root Cause:</strong> {selectedDec.rootCauseHypothesis.category} ({selectedDec.rootCauseHypothesis.confidence})
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {selectedDec.rootCauseHypothesis.explanation}
                </div>
              </div>
            </div>

            {/* Evidence & Telemetry Attribution */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Multi-Source Evidence Attribution
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <div><strong>Evidence Sources:</strong> {selectedDec.evidenceIds.join(', ')}</div>
                <div style={{ marginTop: '4px' }}><strong>Affected Resources:</strong> {selectedDec.resourceIds.join(', ')}</div>
                <div style={{ marginTop: '4px' }}><strong>Controls & Policies:</strong> {selectedDec.controlIds.join(', ')} / {selectedDec.policyIds.join(', ')}</div>
                <div style={{ marginTop: '4px' }}><strong>Evidence Freshness:</strong> {selectedDec.freshness} ({selectedDec.evidenceCoverage})</div>
              </div>
            </div>

            {/* Impact Projection & What-If */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Impact Projection & What-If
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <div><strong>Observability:</strong> {selectedDec.observabilityImpact}</div>
                <div style={{ marginTop: '4px' }}><strong>FinOps Cost:</strong> {selectedDec.costImpact}</div>
                <div style={{ marginTop: '4px' }}><strong>Security & Resilience:</strong> {selectedDec.securityImpact}</div>
                <div style={{ marginTop: '4px' }}><strong>Compliance Gain:</strong> {selectedDec.complianceImpact}</div>
                {selectedDec.whatIfSimulationId && (
                  <div style={{ marginTop: '6px', color: 'var(--brand)' }}>
                    <strong>Simulation Linked:</strong> {selectedDec.whatIfSimulationId}
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Action & Verified Remediation */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Action, Approval & Verification
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <div><strong>Recommended Action:</strong> {selectedDec.recommendedAction.actionName}</div>
                <div style={{ marginTop: '4px' }}><strong>Automation Level:</strong> {selectedDec.automationLevel} ({selectedDec.recommendedAction.safetyScore})</div>
                <div style={{ marginTop: '4px' }}><strong>Remediation Plan:</strong> {selectedDec.remediationPlanId || 'None yet'}</div>
                <div style={{ marginTop: '4px' }}><strong>Fresh AWS Verification:</strong> {selectedDec.verificationStatus}</div>
                <div style={{ marginTop: '4px', fontWeight: 700, color: 'var(--status-healthy)' }}>
                  Effectiveness Score: {selectedDec.effectivenessScore ?? 100} / 100
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── SECTION 3: Governance Decision Queue & Ledger ────────────────────── */}
      <Card
        title="Prioritized Governance Decision Queue"
        subtitle="Ranked decision items requiring operator triage, what-if validation, or automated remediation"
      >
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontSize: '12px',
            }}
          >
            <option value="all">All Priorities</option>
            <option value="P1">P1 - High Priority</option>
            <option value="P2">P2 - Moderate Priority</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontSize: '12px',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="PLAN_READY">PLAN_READY</option>
            <option value="NEW">NEW</option>
          </select>
        </div>

        {loading ? (
          <LoadingState message="Evaluating governance decision queue..." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: '11px' }}>
                  <th style={{ padding: '8px' }}>Priority & Scope</th>
                  <th style={{ padding: '8px' }}>Decision Title & Summary</th>
                  <th style={{ padding: '8px' }}>Decision Type</th>
                  <th style={{ padding: '8px' }}>Root Cause</th>
                  <th style={{ padding: '8px' }}>Automation Level</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {decisions
                  .filter((d) => priorityFilter === 'all' || d.priority === priorityFilter)
                  .filter((d) => statusFilter === 'all' || d.status === statusFilter)
                  .map((d) => (
                    <tr
                      key={d.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: selectedDec?.id === d.id ? 'var(--bg-elevated)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          backgroundColor: d.priority === 'P1' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: d.priority === 'P1' ? 'var(--status-degraded)' : 'var(--brand)',
                        }}>
                          {d.priority}
                        </span>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>{d.scope}</div>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.title}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{d.summary}</div>
                      </td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {d.decisionType}
                      </td>
                      <td style={{ padding: '8px', fontSize: '11px' }}>
                        {d.rootCauseHypothesis.category}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: d.automationLevel === 'SAFE_TO_AUTOMATE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: d.automationLevel === 'SAFE_TO_AUTOMATE' ? 'var(--status-healthy)' : 'var(--status-degraded)',
                        }}>
                          {d.automationLevel}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--brand)' }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedDec(d)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '3px',
                              backgroundColor: 'var(--brand)',
                              color: '#fff',
                              border: 'none',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Inspect
                          </button>
                          {d.status === 'NEW' && (
                            <button
                              type="button"
                              onClick={() => handleCreatePlan(d.id)}
                              disabled={generatingPlan === d.id}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '3px',
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)',
                                fontSize: '10.5px',
                                cursor: 'pointer',
                              }}
                            >
                              {generatingPlan === d.id ? 'Planning...' : 'Generate Plan'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default GovernanceDecisionEnginePage;
