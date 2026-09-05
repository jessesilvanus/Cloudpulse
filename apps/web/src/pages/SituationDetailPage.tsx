import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { globalCommandCenterApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/Card.tsx';
import { StatCard } from '../components/ui/StatCard.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { SeverityBadge } from '../components/ui/SeverityBadge.tsx';
import { LoadingState, ErrorState } from '../components/ui/States.tsx';
import type { EnterpriseCloudSituation, SituationStage } from '@cloudpulse/shared';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
  ShieldIcon,
  ChevronRightIcon
} from '../components/ui/Icons.tsx';

export function SituationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [situation, setSituation] = useState<EnterpriseCloudSituation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<SituationStage | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    globalCommandCenterApi
      .getSituationById(id)
      .then((data) => {
        setSituation(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load situation details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState message="Connecting to Global Situation Intelligence Engine..." />
      </div>
    );
  }

  if (error || !situation) {
    return (
      <div className="page-container">
        <ErrorState
          title="Situation Not Found"
          message={error || `Could not find situation with ID ${id}`}
          onRetry={() => navigate('/overview')}
        />
      </div>
    );
  }

  const STAGES_ORDER: SituationStage[] = [
    'BEFORE',
    'CHANGE',
    'TRIGGER',
    'DETECTION',
    'IMPACT',
    'INVESTIGATION',
    'DECISION',
    'ACTION',
    'VERIFICATION',
    'CURRENT_STATE'
  ];

  const stageLabels: Record<SituationStage, string> = {
    BEFORE: '1. Baseline State',
    CHANGE: '2. Cloud Change',
    TRIGGER: '3. Anomaly Trigger',
    DETECTION: '4. Detection',
    IMPACT: '5. Impact Assessed',
    INVESTIGATION: '6. Investigation',
    DECISION: '7. Governed Decision',
    ACTION: '8. Action Executed',
    VERIFICATION: '9. Post Verification',
    CURRENT_STATE: '10. Current State'
  };

  const currentTimelineEvent = selectedStage
    ? situation.timeline.find((t) => t.stage === selectedStage)
    : situation.timeline[situation.timeline.length - 1];

  const handleExecuteMitigation = (decisionId: string) => {
    setActionInProgress(true);
    setActionMessage(null);
    globalCommandCenterApi
      .executeDecisionAction(decisionId, 'APPROVE', 'operator@cloudpulse.io', 'Executive situation mitigation approval')
      .then(() => {
        setActionMessage(`Decision ${decisionId} successfully approved and queued for automated GitOps execution.`);
        return globalCommandCenterApi.getSituationById(situation.id);
      })
      .then((updated) => setSituation(updated))
      .catch((err) => setActionMessage(`Action failed: ${err.message}`))
      .finally(() => setActionInProgress(false));
  };

  return (
    <div className="page-container">
      {/* Header */}
      <PageHeader
        title={situation.title}
        subtitle={`Correlated Multi-Cloud Situation · ${situation.scope} · Created ${new Date(situation.createdAt).toLocaleTimeString()}`}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <SeverityBadge severity={situation.severity.toLowerCase() as any} />
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: situation.priority === 'P0' ? 'var(--status-critical-bg)' : 'var(--status-warning-bg)',
                color: situation.priority === 'P0' ? 'var(--status-critical)' : 'var(--status-warning)',
                border: '1px solid currentColor'
              }}
            >
              Priority {situation.priority}
            </span>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)'
              }}
            >
              {situation.category}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/overview')}
              style={{ fontSize: '12px' }}
            >
              ← Back to Command Center
            </button>
          </div>
        }
      />

      {/* Top Metrics Row */}
      <div className="grid grid-4" style={{ marginBottom: '16px' }}>
        <StatCard
          label="Financial Exposure / Hr"
          value={`$${situation.businessImpact.financialImpactPerHour.toLocaleString()}`}
          subValue={situation.businessImpact.tier.replace(/_/g, ' ')}
          status={situation.businessImpact.financialImpactPerHour > 20000 ? 'critical' : 'warning'}
        />
        <StatCard
          label="SLA Breached"
          value={situation.businessImpact.slaBreached ? 'YES — P99 EXCEEDED' : 'COMPLIANT'}
          subValue={`Customer Impact: ${situation.businessImpact.customersImpactedScore}/100`}
          status={situation.businessImpact.slaBreached ? 'critical' : 'healthy'}
        />
        <StatCard
          label="Confidence & Coverage"
          value={`${situation.confidence} / ${situation.coverage}`}
          subValue={`Data Freshness: ${situation.freshness}`}
          status="info"
        />
        <StatCard
          label="Current Status"
          value={situation.status}
          subValue={`Assigned: ${situation.assignedTo || 'Unassigned'}`}
          status={situation.status === 'RESOLVED' ? 'healthy' : 'warning'}
        />
      </div>

      {actionMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: actionMessage.includes('failed') ? 'var(--status-critical-bg)' : 'var(--status-healthy-bg)',
            color: actionMessage.includes('failed') ? 'var(--status-critical)' : 'var(--status-healthy)',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          {actionMessage}
        </div>
      )}

      {/* 10-Stage Lifecycle Timeline Visualizer */}
      <Card
        title="10-Stage Situation Lifecycle Timeline"
        subtitle="End-to-end incident evolution from baseline state through detection, root cause, governed action, and verification."
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '6px',
            marginBottom: '16px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}
        >
          {STAGES_ORDER.map((stage, idx) => {
            const ev = situation.timeline.find((t) => t.stage === stage);
            const isSelected = selectedStage === stage || (!selectedStage && ev === currentTimelineEvent);
            const isPresent = Boolean(ev);

            return (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                disabled={!isPresent}
                style={{
                  padding: '10px 6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected
                    ? 'var(--brand-primary-light, rgba(59, 130, 246, 0.15))'
                    : isPresent
                    ? 'var(--bg-surface)'
                    : 'var(--bg-elevated)',
                  border: isSelected
                    ? '2px solid var(--brand, #3b82f6)'
                    : isPresent
                    ? '1px solid var(--border-subtle)'
                    : '1px dashed var(--border-muted)',
                  cursor: isPresent ? 'pointer' : 'not-allowed',
                  opacity: isPresent ? 1 : 0.4,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s'
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: isSelected ? 'var(--brand)' : isPresent ? 'var(--text-primary)' : 'var(--text-muted)'
                  }}
                >
                  Step {idx + 1}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    lineHeight: '1.2',
                    color: isSelected ? 'var(--brand)' : 'var(--text-secondary)'
                  }}
                >
                  {stage.replace(/_/g, ' ')}
                </span>
                {isPresent && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor:
                        ev?.severity === 'CRITICAL'
                          ? 'var(--status-critical)'
                          : ev?.severity === 'HIGH'
                          ? 'var(--status-warning)'
                          : 'var(--status-healthy)'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail Drawer */}
        {currentTimelineEvent ? (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand)' }}>
                  {stageLabels[currentTimelineEvent.stage] || currentTimelineEvent.stage}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(currentTimelineEvent.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                Source: {currentTimelineEvent.source}
              </span>
            </div>

            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentTimelineEvent.title}
            </h4>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {currentTimelineEvent.description}
            </p>

            {currentTimelineEvent.metadata && (
              <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.entries(currentTimelineEvent.metadata).map(([k, v]) => (
                  <span
                    key={k}
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {k}: <strong style={{ color: 'var(--text-primary)' }}>{String(v)}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>
            Select a timeline step above to view evidence details.
          </div>
        )}
      </Card>

      {/* Root Cause Hypotheses & Business Impact */}
      <div className="grid grid-2" style={{ marginTop: '16px' }}>
        <Card
          title="Root Cause Hypotheses (AI Grounded Correlation)"
          subtitle="Automated root cause identification with probability scoring & telemetry evidence."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {situation.rootCauseHypotheses.map((rc, i) => (
              <div
                key={i}
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Hypothesis #{i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: rc.probabilityScore > 0.75 ? 'var(--status-critical-bg)' : 'var(--status-warning-bg)',
                      color: rc.probabilityScore > 0.75 ? 'var(--status-critical)' : 'var(--status-warning)'
                    }}
                  >
                    {(rc.probabilityScore * 100).toFixed(0)}% Probability
                  </span>
                </div>
                <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {rc.hypothesis}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {rc.evidence.map((ev, idx) => (
                    <span key={idx} style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      • {ev}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Affected Multi-Cloud Infrastructure & Services"
          subtitle="Correlated cross-cloud resources and telemetry streams under active blast radius."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Affected Providers & Regions
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {situation.affectedProviders.map((p) => (
                  <span
                    key={p}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-elevated)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: 'var(--text-primary)'
                    }}
                  >
                    {p}
                  </span>
                ))}
                {situation.affectedRegions.map((r) => (
                  <span
                    key={r}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface)',
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Impacted Services
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {situation.affectedServices.map((s) => (
                  <span
                    key={s}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: 'var(--brand)',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Target Cloud Resources
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {situation.affectedResources.map((res) => (
                  <span
                    key={res}
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                      wordBreak: 'break-all'
                    }}
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Suggested Decisions & Actions */}
      <Card
        title="Suggested Executive Decisions & Mitigations"
        subtitle="Governed action items ranked by urgency with automated rollback and remediation plans."
        style={{ marginTop: '16px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {situation.suggestedDecisions.map((decId) => (
            <div
              key={decId}
              style={{
                padding: '14px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand)', fontSize: '12px' }}>
                    {decId}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-critical)' }}>
                    P0 Emergency Action
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Rollback payment-gateway to v2.13.9 & Shift Read Traffic to Secondary Aurora Replica
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Est. Impact: Eliminates database connection saturation · Restores P99 latency under 200ms
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  disabled={actionInProgress}
                  onClick={() => handleExecuteMitigation(decId)}
                  style={{ fontSize: '12px' }}
                >
                  {actionInProgress ? 'Processing...' : 'Approve & Execute Mitigation →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
export default SituationDetailPage;
