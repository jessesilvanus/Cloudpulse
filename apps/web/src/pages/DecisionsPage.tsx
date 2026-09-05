import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { globalCommandCenterApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/Card.tsx';
import { StatCard } from '../components/ui/StatCard.tsx';
import { SeverityBadge } from '../components/ui/SeverityBadge.tsx';
import { LoadingState, ErrorState } from '../components/ui/States.tsx';
import type { ExecutiveDecision, ExecutiveDecisionDomain, ExecutiveDecisionStatus } from '@cloudpulse/shared';
import { CheckCircleIcon, AlertTriangleIcon, ShieldIcon, DollarSignIcon, TopologyIcon, SparklesIcon } from '../components/ui/Icons.tsx';

export function DecisionsPage() {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState<ExecutiveDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchDecisions = () => {
    setLoading(true);
    const filterObj: { domain?: string; status?: string } = {};
    if (selectedDomain !== 'ALL') filterObj.domain = selectedDomain;
    if (selectedStatus !== 'ALL') filterObj.status = selectedStatus;

    globalCommandCenterApi
      .getDecisions(filterObj)
      .then((data) => {
        setDecisions(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load executive decisions.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDecisions();
  }, [selectedDomain, selectedStatus]);

  const handleDecisionAction = (id: string, action: 'APPROVE' | 'REJECT' | 'EXECUTE' | 'DISMISS') => {
    setActionInProgress(id);
    setActionFeedback(null);
    globalCommandCenterApi
      .executeDecisionAction(id, action, 'operator@cloudpulse.io', `Executive action ${action} performed`)
      .then((res) => {
        setActionFeedback(`Decision ${id} successfully marked as ${res.decision.status}.`);
        fetchDecisions();
      })
      .catch((err) => {
        setActionFeedback(`Action failed: ${err.message}`);
      })
      .finally(() => setActionInProgress(null));
  };

  const domainIcons: Record<string, React.ReactNode> = {
    RELIABILITY: <SparklesIcon />,
    SECURITY: <ShieldIcon />,
    FINOPS: <DollarSignIcon />,
    RESILIENCE: <TopologyIcon />,
    GOVERNANCE: <ShieldIcon />,
    OPERATIONS: <SparklesIcon />
  };

  const pendingCount = decisions.filter((d) => d.status === 'PENDING').length;
  const p0Count = decisions.filter((d) => d.priority === 'P0').length;

  return (
    <div className="page-container">
      <PageHeader
        title="Executive Priority Decisions & Governance Queue"
        subtitle="Unified cross-cloud decision engine aggregating high-impact recommendations across Reliability, Security, FinOps, and Resilience."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/overview')} style={{ fontSize: '12px' }}>
              ← Command Center
            </button>
            <button className="btn btn-primary" onClick={fetchDecisions} style={{ fontSize: '12px' }}>
              ↻ Refresh Decisions
            </button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-4" style={{ marginBottom: '16px' }}>
        <StatCard
          label="Pending Executive Decisions"
          value={pendingCount}
          subValue="Requiring operator / CISO review"
          status={pendingCount > 0 ? 'warning' : 'healthy'}
        />
        <StatCard
          label="P0 Emergency Actions"
          value={p0Count}
          subValue="Immediate outage / SLA risk"
          status={p0Count > 0 ? 'critical' : 'healthy'}
        />
        <StatCard
          label="Est. Monthly Cost Optimization"
          value="$3,800 / mo"
          subValue="Identified cross-region savings"
          status="healthy"
        />
        <StatCard
          label="Zero Trust Compliance Guard"
          value="SOC2 / HIPAA"
          subValue="Grounded policy validation"
          status="info"
        />
      </div>

      {actionFeedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: actionFeedback.includes('failed') ? 'var(--status-critical-bg)' : 'var(--status-healthy-bg)',
            color: actionFeedback.includes('failed') ? 'var(--status-critical)' : 'var(--status-healthy)',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          {actionFeedback}
        </div>
      )}

      {/* Filters Bar */}
      <Card padding="0" style={{ marginBottom: '16px' }}>
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Domain:
            </span>
            {['ALL', 'RELIABILITY', 'SECURITY', 'FINOPS', 'RESILIENCE', 'GOVERNANCE'].map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: selectedDomain === dom ? 'var(--brand)' : 'var(--bg-surface)',
                  color: selectedDomain === dom ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                {dom}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Status:
            </span>
            {['ALL', 'PENDING', 'APPROVED', 'EXECUTED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: selectedStatus === st ? 'var(--brand)' : 'var(--bg-surface)',
                  color: selectedStatus === st ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Decision Cards List */}
      {loading ? (
        <LoadingState message="Loading executive decisions..." />
      ) : decisions.length === 0 ? (
        <Card>
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No decisions found matching the selected domain and status filters.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {decisions.map((decision) => (
            <Card key={decision.id}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor:
                          decision.priority === 'P0'
                            ? 'var(--status-critical-bg)'
                            : decision.priority === 'P1'
                            ? 'var(--status-warning-bg)'
                            : 'var(--bg-elevated)',
                        color:
                          decision.priority === 'P0'
                            ? 'var(--status-critical)'
                            : decision.priority === 'P1'
                            ? 'var(--status-warning)'
                            : 'var(--text-primary)',
                        border: '1px solid currentColor'
                      }}
                    >
                      Priority {decision.priority}
                    </span>

                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {decision.domain}
                    </span>

                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {decision.id}
                    </span>

                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        backgroundColor:
                          decision.status === 'APPROVED' || decision.status === 'EXECUTED'
                            ? 'var(--status-healthy-bg)'
                            : decision.status === 'REJECTED'
                            ? 'var(--status-critical-bg)'
                            : 'var(--status-warning-bg)',
                        color:
                          decision.status === 'APPROVED' || decision.status === 'EXECUTED'
                            ? 'var(--status-healthy)'
                            : decision.status === 'REJECTED'
                            ? 'var(--status-critical)'
                            : 'var(--status-warning)'
                      }}
                    >
                      {decision.status}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {decision.title}
                  </h3>

                  <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {decision.recommendedAction}
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '8px',
                      padding: '10px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11.5px'
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Impact & Benefit: </span>
                      <strong style={{ color: 'var(--status-healthy)' }}>
                        {decision.estimatedSavingsOrRiskReduction}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Risk of Inaction: </span>
                      <strong style={{ color: 'var(--status-critical)' }}>{decision.riskOfInaction}</strong>
                    </div>
                    {decision.targetResourceId && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Target Resource: </span>
                        <code style={{ fontSize: '11px', color: 'var(--brand)' }}>{decision.targetResourceId}</code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Button Group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' }}>
                  {decision.situationId && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/situations/${decision.situationId}`)}
                      style={{ fontSize: '11.5px' }}
                    >
                      View Situation →
                    </button>
                  )}

                  {decision.status === 'PENDING' && (
                    <>
                      <button
                        className="btn btn-primary"
                        disabled={actionInProgress === decision.id}
                        onClick={() => handleDecisionAction(decision.id, 'APPROVE')}
                        style={{ fontSize: '12px' }}
                      >
                        ✓ Approve Decision
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={actionInProgress === decision.id}
                        onClick={() => handleDecisionAction(decision.id, 'REJECT')}
                        style={{ fontSize: '11.5px', color: 'var(--status-critical)' }}
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}

                  {decision.status === 'APPROVED' && (
                    <button
                      className="btn btn-primary"
                      disabled={actionInProgress === decision.id}
                      onClick={() => handleDecisionAction(decision.id, 'EXECUTE')}
                      style={{ fontSize: '12px' }}
                    >
                      ▶ Execute Workflow
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
export default DecisionsPage;
