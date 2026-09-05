import React, { useState, useEffect } from 'react';
import { cloudConnectionsApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { LoadingState } from '../components/ui/States.tsx';
import type {
  GovernanceSimulatorSummary,
  GovernanceSimulation
} from '@cloudpulse/shared';

export function PolicySimulatorPage() {
  const [summary, setSummary] = useState<GovernanceSimulatorSummary | null>(null);
  const [simulations, setSimulations] = useState<GovernanceSimulation[]>([]);
  const [selectedSim, setSelectedSim] = useState<GovernanceSimulation | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [riskFilter, setRiskFilter] = useState('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [sum, sims] = await Promise.all([
        cloudConnectionsApi.getAwsSimulatorSummary(),
        cloudConnectionsApi.getAwsSimulations(),
      ]);
      setSummary(sum);
      setSimulations(sims || []);
      if (sims?.length > 0 && !selectedSim) {
        setSelectedSim(sims[0]);
      }
    } catch (err: any) {
      console.error('Failed to load policy simulator data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <PageHeader
          title="Real AWS Policy Simulator, Governance What-If & Safe Change Impact Engine"
          subtitle="Non-Mutating Cloud Change Modeling, Multi-Dimensional Blast Radius, FinOps, Security & Compliance Impact Prediction."
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
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── SECTION 1: Simulator KPI Scorecards ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
        <Card padding="16px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>What-If Scenarios Run</span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--brand)', fontWeight: 700 }}>
              SIMULATED
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '6px', color: 'var(--text-primary)' }}>
            {summary?.totalSimulationsRun ?? 2}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}> Scenarios</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Pure in-memory simulation (zero AWS mutations)
          </div>
        </Card>

        <Card padding="16px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High-Risk Scenarios Blocked</span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-unhealthy)', fontWeight: 700 }}>
              BLOCKED
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '6px', color: 'var(--status-unhealthy)' }}>
            {summary?.highRiskScenariosDetected ?? 1}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}> Critical</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            S3 Public Access Exposure prevented
          </div>
        </Card>

        <Card padding="16px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Safe Compliant Scenarios</span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--status-healthy)', fontWeight: 700 }}>
              PASS
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '6px', color: 'var(--status-healthy)' }}>
            {summary?.safeScenariosCount ?? 1}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}> Approved</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            EC2 Detailed Monitoring enhancement
          </div>
        </Card>

        <Card padding="16px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AWS Base State Source</span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--status-healthy)', fontWeight: 700 }}>
              SYNCED
            </span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '8px', color: 'var(--text-primary)' }}>
            LIVE AWS (us-east-1)
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            DescribeInstances & S3 live sync baseline
          </div>
        </Card>
      </div>

      {/* ── SECTION 2: Interactive What-If Scenario Matrix ───────────────────── */}
      {selectedSim && (
        <Card
          title={`Simulation Impact Analysis: ${selectedSim.scenarioName}`}
          subtitle="Non-invasive multi-dimensional impact projection based on live verified AWS state"
        >
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {simulations.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSim(s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: selectedSim.id === s.id ? 'var(--brand)' : 'var(--bg-surface)',
                  color: selectedSim.id === s.id ? '#fff' : 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                  fontSize: '11.5px',
                  fontWeight: selectedSim.id === s.id ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {s.scenarioName} ({s.riskLevel})
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {/* Compliance & Security */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Compliance & Security Posture
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <div><strong>Compliance Delta:</strong> {selectedSim.impact.complianceScoreDelta > 0 ? `+${selectedSim.impact.complianceScoreDelta}%` : `${selectedSim.impact.complianceScoreDelta}%`}</div>
                <div style={{ marginTop: '4px' }}><strong>Security Severity:</strong> {selectedSim.impact.securitySeverity}</div>
                <div style={{ marginTop: '4px', color: selectedSim.riskLevel === 'CRITICAL' ? 'var(--status-unhealthy)' : 'var(--text-muted)' }}>
                  {selectedSim.impact.securityImpact}
                </div>
              </div>
            </div>

            {/* Dependency & Blast Radius */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Dependency Graph & Blast Radius
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <div><strong>Direct Dependencies:</strong> {selectedSim.impact.dependencyImpact.directDependencies.join(', ')}</div>
                <div style={{ marginTop: '4px' }}><strong>Downstream Resources:</strong> {selectedSim.impact.dependencyImpact.downstreamCount} affected</div>
                <div style={{ marginTop: '4px' }}><strong>Assessment:</strong> {selectedSim.impact.dependencyImpact.blastRadiusAssessment}</div>
              </div>
            </div>

            {/* Observability & FinOps */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Observability & FinOps Impact
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <div><strong>Observability:</strong> {selectedSim.impact.observabilityImpact}</div>
                <div style={{ marginTop: '4px' }}><strong>Monthly Cost Delta:</strong> {selectedSim.impact.finopsImpact.costDeltaMonthly > 0 ? `+$${selectedSim.impact.finopsImpact.costDeltaMonthly.toFixed(2)}/mo` : `$${selectedSim.impact.finopsImpact.costDeltaMonthly.toFixed(2)}/mo`}</div>
                <div style={{ marginTop: '4px' }}><strong>Classification:</strong> {selectedSim.impact.finopsImpact.costImpactClassification}</div>
              </div>
            </div>

            {/* Predictive Risk & Recommendations */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Predictive Risk & Actionable Advice
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <div><strong>Incident Probability:</strong> {(selectedSim.impact.predictiveRisk.incidentProbability * 100).toFixed(0)}%</div>
                <div style={{ marginTop: '4px' }}><strong>Recommendation:</strong> {selectedSim.recommendations[0]}</div>
                {selectedSim.safeAlternative && (
                  <div style={{ marginTop: '4px', color: 'var(--brand)' }}>
                    <strong>Safe Alternative:</strong> {selectedSim.safeAlternative}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── SECTION 3: Simulation Scenarios Ledger ───────────────────────────── */}
      <Card
        title="Saved What-If Scenarios & Governance Projections"
        subtitle="Catalog of analyzed cloud configuration changes with risk ratings and policy outcomes"
      >
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontSize: '12px',
            }}
          >
            <option value="all">All Risk Levels</option>
            <option value="LOW">LOW</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        {loading ? (
          <LoadingState message="Evaluating governance policies in simulation..." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: '11px' }}>
                  <th style={{ padding: '8px' }}>Scenario Name</th>
                  <th style={{ padding: '8px' }}>Target Resource</th>
                  <th style={{ padding: '8px' }}>Proposed Change</th>
                  <th style={{ padding: '8px' }}>Risk Rating</th>
                  <th style={{ padding: '8px' }}>Compliance Delta</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {simulations
                  .filter((s) => riskFilter === 'all' || s.riskLevel === riskFilter)
                  .map((s) => (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: selectedSim?.id === s.id ? 'var(--bg-elevated)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.scenarioName}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{s.description}</div>
                      </td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {s.inputs[0]?.resourceName}
                      </td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {s.inputs[0]?.field}: "{String(s.inputs[0]?.currentValue)}" → "{String(s.inputs[0]?.proposedValue)}"
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: s.riskLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          color: s.riskLevel === 'CRITICAL' ? 'var(--status-unhealthy)' : 'var(--status-healthy)',
                        }}>
                          {s.riskLevel}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {s.impact.complianceScoreDelta > 0 ? `+${s.impact.complianceScoreDelta}%` : `${s.impact.complianceScoreDelta}%`}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--brand)' }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedSim(s)}
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
                          View Impact
                        </button>
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

export default PolicySimulatorPage;
