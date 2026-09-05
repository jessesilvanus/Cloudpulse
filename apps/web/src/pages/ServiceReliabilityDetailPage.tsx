import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingState, ErrorState } from '../components/ui/States';
import { sreControlApi } from '../api/client';
import type {
  ServiceReliabilityDetail,
  ReleaseRiskAssessment,
  RecoveryVerification
} from '@cloudpulse/shared';

export function ServiceReliabilityDetailPage() {
  const { serviceId } = useParams<{ serviceId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ServiceReliabilityDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'golden_signals' | 'slos' | 'dependencies' | 'changes_mtt' | 'capacity' | 'release_guard' | 'recovery_verify'>('overview');

  // Interactive Release Guard State
  const [proposedVersion, setProposedVersion] = useState('v2.4.4');
  const [changeType, setChangeType] = useState<'FEATURE' | 'HOTFIX' | 'CONFIG' | 'INFRASTRUCTURE'>('FEATURE');
  const [evaluatingRelease, setEvaluatingRelease] = useState(false);
  const [releaseAssessment, setReleaseAssessment] = useState<ReleaseRiskAssessment | null>(null);

  // Interactive Remediation Verification State
  const [verifyIncidentId, setVerifyIncidentId] = useState('');
  const [verifyActionId, setVerifyActionId] = useState('');
  const [verifyingRecovery, setVerifyingRecovery] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<RecoveryVerification | null>(null);

  const loadServiceDetail = async () => {
    if (!serviceId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await sreControlApi.getSreServiceDetail(serviceId);
      setDetail(data);
      if (data.activeIncidents && data.activeIncidents.length > 0) {
        setVerifyIncidentId(data.activeIncidents[0].id || 'inc-active-01');
      }
    } catch (err: any) {
      setError(err.message || `Failed to load reliability detail for service '${serviceId}'`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServiceDetail();
  }, [serviceId]);

  const handleEvaluateRelease = async () => {
    if (!serviceId) return;
    try {
      setEvaluatingRelease(true);
      const res = await sreControlApi.evaluateReleaseRisk({
        serviceId,
        proposedVersion,
        changeType
      });
      setReleaseAssessment(res);
    } catch (err: any) {
      alert(`Release risk evaluation failed: ${err.message}`);
    } finally {
      setEvaluatingRelease(false);
    }
  };

  const handleVerifyRecovery = async () => {
    if (!serviceId) return;
    try {
      setVerifyingRecovery(true);
      const payload: { serviceId: string; actionId?: string; incidentId?: string } = {
        serviceId
      };
      if (verifyIncidentId) payload.incidentId = verifyIncidentId;
      if (verifyActionId) payload.actionId = verifyActionId;

      const res = await sreControlApi.verifyRemediationRecovery(payload);
      setRecoveryResult(res);
    } catch (err: any) {
      alert(`Recovery verification failed: ${err.message}`);
    } finally {
      setVerifyingRecovery(false);
    }
  };

  if (loading) {
    return <LoadingState message={`Analyzing reliability control plane telemetry for ${serviceId}...`} />;
  }

  if (error || !detail) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorState
          title="Service Reliability Profile Not Found"
          message={error || `Service ${serviceId} could not be resolved in the SRE control plane.`}
        />
        <div style={{ marginTop: '16px' }}>
          <Link
            to="/sre"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: 'var(--brand)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            &larr; Back to SRE Command Center
          </Link>
        </div>
      </div>
    );
  }

  const { service, reliabilityScore, goldenSignals, slis, slos, errorBudgets, dependencies, cascadingRisks, recentChanges, capacity, policy } = detail;

  const scoreColor =
    reliabilityScore.overallScore >= 90
      ? 'var(--status-healthy)'
      : reliabilityScore.overallScore >= 70
      ? 'var(--status-warning)'
      : 'var(--status-critical)';

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Navigation Breadcrumb & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/sre"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            &larr; SRE Command Center
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
            {service.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={loadServiceDetail}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Service Header Profile Hero */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {service.name}
              </h1>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
              >
                {service.tier}
              </span>
              <StatusBadge
                status={
                  service.health === 'HEALTHY'
                    ? 'healthy'
                    : service.health === 'DEGRADED'
                    ? 'degraded'
                    : 'unhealthy'
                }
                label={service.health}
              />
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-canvas)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {service.provider} &bull; {service.environment}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '700px' }}>
              {service.cloudScope} &bull; Criticality: {service.criticality} &bull; Monitored under CloudPulse SRE & Resilience Control Plane.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Owner: <strong style={{ color: 'var(--text-primary)' }}>{service.owner}</strong></span>
              <span>Observed At: <span style={{ fontFamily: 'var(--font-mono)' }}>{new Date(service.observedAt).toLocaleTimeString()}</span></span>
              <span>Freshness: <strong style={{ color: service.freshness === 'LIVE' ? 'var(--status-healthy)' : 'var(--text-secondary)' }}>{service.freshness}</strong></span>
            </div>
          </div>

          {/* Reliability Score Badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 24px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-canvas)',
              border: `2px solid ${scoreColor}`,
              minWidth: '160px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Reliability Score
            </div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: scoreColor, fontFamily: 'var(--font-mono)', lineHeight: 1.1, marginTop: '4px' }}>
              {reliabilityScore.overallScore}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Grade: <strong>{reliabilityScore.grade}</strong> ({reliabilityScore.coverage}% cov)
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '2px',
          overflowX: 'auto'
        }}
      >
        {[
          { id: 'overview', label: 'Score Breakdown & Dimensions' },
          { id: 'golden_signals', label: 'Golden Signals & SLIs' },
          { id: 'slos', label: `SLOs & Error Budgets (${slos.length})` },
          { id: 'dependencies', label: `Dependencies & Cascading (${dependencies.length})` },
          { id: 'changes_mtt', label: `Recent Changes (${recentChanges.length})` },
          { id: 'capacity', label: 'Capacity & Saturation' },
          { id: 'release_guard', label: 'Release Risk Guard' },
          { id: 'recovery_verify', label: 'Recovery Verification' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '8px 16px',
              fontSize: '12.5px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? 'var(--brand)' : 'var(--text-secondary)',
              backgroundColor: activeTab === tab.id ? 'var(--bg-active)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & 8-Dimensional Score Breakdown */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Multi-Dimensional Reliability Assessment (Explainable Formula)
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {reliabilityScore.summary}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>State: <strong style={{ color: scoreColor }}>{service.reliabilityState}</strong></span>
                  <span>Confidence: <strong>{reliabilityScore.confidence}</strong></span>
                  <span>Coverage: <strong>{reliabilityScore.coverage}%</strong></span>
                </div>
              </div>

              {/* Dimensions Breakdown Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 12px' }}>Dimension</th>
                      <th style={{ padding: '8px 12px' }}>Weight</th>
                      <th style={{ padding: '8px 12px' }}>Score</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                      <th style={{ padding: '8px 12px' }}>Evidence & Telemetry Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reliabilityScore.dimensions).map(([key, dim]) => (
                      <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1')}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {(dim.weight * 100).toFixed(0)}%
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              color: dim.score >= 80 ? 'var(--status-healthy)' : dim.score >= 60 ? 'var(--status-warning)' : 'var(--status-critical)'
                            }}
                          >
                            {dim.score} / 100
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {dim.status}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11.5px', maxWidth: '350px' }}>
                          {dim.detail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Active Error Budget Policy Banner */}
          {policy && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: policy.policyState === 'NORMAL' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: policy.policyState === 'NORMAL' ? 'var(--status-healthy)' : 'var(--status-critical)',
                      fontWeight: 800
                    }}
                  >
                    !
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Active Error Budget Policy: <span style={{ fontFamily: 'var(--font-mono)' }}>{policy.policyState}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Freezes Risky Deployments: <strong>{policy.freezeDeployments ? 'YES' : 'NO'}</strong> &bull; Active Since: {new Date(policy.activeSince).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'right' }}>
                  Freeze Threshold: &lt;{policy.freezeThresholdPercent}% budget
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Golden Signals & SLIs */}
      {activeTab === 'golden_signals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Golden Signals 4-Box Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <Card>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Latency (p95)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '6px' }}>
                {goldenSignals.latencyP95Ms !== undefined ? `${goldenSignals.latencyP95Ms.toFixed(1)} ms` : 'UNKNOWN'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                p50: {goldenSignals.latencyP50Ms?.toFixed(1) || '—'} ms &bull; p99: {goldenSignals.latencyP99Ms?.toFixed(1) || '—'} ms
              </div>
            </Card>

            <Card>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Error Rate (5xx)
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: (goldenSignals.errorRatePercent ?? 0) > 1.0 ? 'var(--status-critical)' : 'var(--text-primary)',
                  marginTop: '6px'
                }}
              >
                {goldenSignals.errorRatePercent !== undefined ? `${goldenSignals.errorRatePercent.toFixed(3)}%` : 'UNKNOWN'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Source: {goldenSignals.source}
              </div>
            </Card>

            <Card>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Traffic / Throughput
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '6px' }}>
                {goldenSignals.trafficRps !== undefined ? `${goldenSignals.trafficRps.toFixed(1)} req/s` : 'UNKNOWN'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Freshness: {goldenSignals.freshness}
              </div>
            </Card>

            <Card>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Saturation (CPU / Mem)
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: (goldenSignals.cpuUtilizationPercent ?? 0) > 85 ? 'var(--status-critical)' : 'var(--text-primary)',
                  marginTop: '6px'
                }}
              >
                {goldenSignals.cpuUtilizationPercent !== undefined ? `${goldenSignals.cpuUtilizationPercent.toFixed(1)}%` : 'UNKNOWN'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Memory: {goldenSignals.memoryUtilizationPercent !== undefined ? `${goldenSignals.memoryUtilizationPercent.toFixed(1)}%` : '—'}
              </div>
            </Card>
          </div>

          {/* Detailed SLIs Table */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Service Level Indicators (SLIs)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {slis.length} Active Indicator{slis.length === 1 ? '' : 's'}
                </span>
              </div>

              {slis.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No Service Level Indicators configured for this service.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px' }}>SLI Name</th>
                        <th style={{ padding: '8px 12px' }}>Metric Type</th>
                        <th style={{ padding: '8px 12px' }}>Current Value</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                        <th style={{ padding: '8px 12px' }}>Definition & Formula</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slis.map((sli) => (
                        <tr key={sli.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {sli.name}
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {sli.type}
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {sli.currentValue !== null ? `${sli.currentValue} ${sli.unit}` : 'UNKNOWN'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                fontWeight: 600,
                                backgroundColor: sli.status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: sli.status === 'HEALTHY' ? 'var(--status-healthy)' : 'var(--status-critical)'
                              }}
                            >
                              {sli.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', maxWidth: '300px' }}>
                            {sli.definition} &bull; {sli.calculation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: SLOs & Multi-Window Error Budget */}
      {activeTab === 'slos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SLO Table */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Service Level Objectives (SLOs)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {slos.filter(s => s.status === 'ACHIEVING').length} / {slos.length} Compliant
                </span>
              </div>

              {slos.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No Service Level Objectives defined.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px' }}>SLO Name</th>
                        <th style={{ padding: '8px 12px' }}>Target</th>
                        <th style={{ padding: '8px 12px' }}>Current Observed</th>
                        <th style={{ padding: '8px 12px' }}>Time Window</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                        <th style={{ padding: '8px 12px' }}>Source Basis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slos.map((slo) => (
                        <tr key={slo.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {slo.name}
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {slo.target}{slo.objectiveType === 'AVAILABILITY' ? '%' : 'ms'}
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                            <span
                              style={{
                                color:
                                  slo.status === 'ACHIEVING'
                                    ? 'var(--status-healthy)'
                                    : slo.status === 'AT_RISK'
                                    ? 'var(--status-warning)'
                                    : 'var(--status-critical)'
                              }}
                            >
                              {slo.currentValue !== null ? `${slo.currentValue}${slo.objectiveType === 'AVAILABILITY' ? '%' : 'ms'}` : 'N/A'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                            {slo.timeWindow}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <StatusBadge
                              status={
                                slo.status === 'ACHIEVING'
                                  ? 'healthy'
                                  : slo.status === 'AT_RISK'
                                  ? 'at_risk'
                                  : 'breached'
                              }
                              label={slo.status}
                            />
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px' }}>
                            {slo.targetSource}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {/* Multi-Window Error Budget Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {errorBudgets.map((eb) => {
              const budgetColor =
                eb.remainingPercent > 50
                  ? 'var(--status-healthy)'
                  : eb.remainingPercent > 10
                  ? 'var(--status-warning)'
                  : 'var(--status-critical)';

              return (
                <Card key={eb.sloId}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {eb.budgetType}
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          color: budgetColor
                        }}
                      >
                        {eb.remainingPercent.toFixed(1)}% Remaining
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-canvas)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(0, eb.remainingPercent))}%`,
                          backgroundColor: budgetColor,
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Multi-Window Burn Rates Table */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', marginTop: '4px' }}>
                      <div style={{ padding: '6px', backgroundColor: 'var(--bg-canvas)', borderRadius: '4px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>1h Burn</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: eb.shortWindowBurnRate > 2 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                          {eb.shortWindowBurnRate.toFixed(1)}x
                        </div>
                      </div>
                      <div style={{ padding: '6px', backgroundColor: 'var(--bg-canvas)', borderRadius: '4px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>24h Burn</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: eb.longWindowBurnRate > 1.5 ? 'var(--status-warning)' : 'var(--text-primary)' }}>
                          {eb.longWindowBurnRate.toFixed(1)}x
                        </div>
                      </div>
                      <div style={{ padding: '6px', backgroundColor: 'var(--bg-canvas)', borderRadius: '4px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Exhaustion</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: eb.projectedExhaustionHours && eb.projectedExhaustionHours < 72 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                          {eb.projectedExhaustionHours !== null ? `${eb.projectedExhaustionHours}h` : 'Stable'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                      <span>Total Budget: <strong>{eb.totalBudget}m</strong></span>
                      <span>Consumed: <strong style={{ color: 'var(--status-critical)' }}>{eb.consumedBudget}m</strong></span>
                      <span>Trend: <strong>{eb.trend}</strong></span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Dependencies & Cascading Paths */}
      {activeTab === 'dependencies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Direct Dependencies Table */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Service Dependencies & Reliability Coupling
              </h3>

              {dependencies.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No dependencies recorded for this service.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px' }}>Target Dependency</th>
                        <th style={{ padding: '8px 12px' }}>Type</th>
                        <th style={{ padding: '8px 12px' }}>Criticality</th>
                        <th style={{ padding: '8px 12px' }}>P99 Latency</th>
                        <th style={{ padding: '8px 12px' }}>Failure Rate</th>
                        <th style={{ padding: '8px 12px' }}>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dependencies.map((dep, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            <Link to={`/sre/services/${dep.dependencyId}`} style={{ color: 'var(--brand)', textDecoration: 'none' }}>
                              {dep.dependencyName}
                            </Link>
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {dep.dependencyType}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                backgroundColor: dep.criticality === 'TIER_0_CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                color: dep.criticality === 'TIER_0_CRITICAL' ? 'var(--status-critical)' : '#60a5fa'
                              }}
                            >
                              {dep.criticality}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            {dep.p99LatencyMs} ms
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: dep.errorRatePercent > 1 ? 'var(--status-critical)' : 'var(--text-secondary)' }}>
                            {dep.errorRatePercent.toFixed(2)}%
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                backgroundColor: dep.riskLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: dep.riskLevel === 'CRITICAL' ? 'var(--status-critical)' : 'var(--status-healthy)'
                              }}
                            >
                              {dep.riskLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {/* Cascading Failure Paths */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Cascading Failure Propagation Paths ({cascadingRisks.length})
              </h3>

              {cascadingRisks.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No high-risk cascading failure paths detected for this service.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cascadingRisks.map((cp) => (
                    <div
                      key={cp.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              backgroundColor: cp.evidenceRank === 'CONFIRMED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: cp.evidenceRank === 'CONFIRMED' ? 'var(--status-critical)' : 'var(--status-warning)'
                            }}
                          >
                            {cp.evidenceRank} CASCADE
                          </span>
                          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {cp.pathDescription}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Blast Score: {cp.blastRadiusScore}/100 &bull; Impacted: {cp.impactedServices.length} services
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        <strong>Mitigation:</strong> {cp.mitigationRecommendation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Recent Changes */}
      {activeTab === 'changes_mtt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recent Changes & Reliability Correlation
              </h3>

              {recentChanges.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No recent changes recorded for this service.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px' }}>Change ID</th>
                        <th style={{ padding: '8px 12px' }}>Type</th>
                        <th style={{ padding: '8px 12px' }}>Timestamp</th>
                        <th style={{ padding: '8px 12px' }}>Correlation Type</th>
                        <th style={{ padding: '8px 12px' }}>Actor</th>
                        <th style={{ padding: '8px 12px' }}>Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentChanges.map((ch) => (
                        <tr key={ch.changeId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {ch.changeId}
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {ch.changeType}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                            {new Date(ch.timestamp).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                backgroundColor:
                                  ch.correlationType === 'DIRECT_CAUSAL'
                                    ? 'rgba(239, 68, 68, 0.15)'
                                    : ch.correlationType === 'EVIDENCE_BACKED'
                                    ? 'rgba(245, 158, 11, 0.15)'
                                    : 'rgba(107, 114, 128, 0.15)',
                                color:
                                  ch.correlationType === 'DIRECT_CAUSAL'
                                    ? 'var(--status-critical)'
                                    : ch.correlationType === 'EVIDENCE_BACKED'
                                    ? 'var(--status-warning)'
                                    : 'var(--text-secondary)'
                              }}
                            >
                              {ch.correlationType}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                            {ch.actor}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11.5px', maxWidth: '300px' }}>
                            {ch.summary}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 6: Capacity & Saturation Intelligence */}
      {activeTab === 'capacity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Resource Utilization & Saturation Forecasts
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Scaling Pressure: <strong style={{ color: capacity.scalingPressure === 'CRITICAL' ? 'var(--status-critical)' : 'inherit' }}>{capacity.scalingPressure}</strong>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CPU Saturation</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px', color: (capacity.cpuSaturationPercent ?? 0) > 80 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                    {capacity.cpuSaturationPercent !== null ? `${capacity.cpuSaturationPercent.toFixed(1)}%` : 'UNKNOWN'}
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Memory Saturation</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px', color: (capacity.memorySaturationPercent ?? 0) > 80 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                    {capacity.memorySaturationPercent !== null ? `${capacity.memorySaturationPercent.toFixed(1)}%` : 'UNKNOWN'}
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Days to Exhaustion</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px', color: capacity.forecastDaysToExhaustion && capacity.forecastDaysToExhaustion < 7 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                    {capacity.forecastDaysToExhaustion !== null ? `${capacity.forecastDaysToExhaustion.toFixed(0)} days` : 'Stable'}
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Workload Replicas</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px', color: 'var(--text-primary)' }}>
                    {capacity.podCount} pods &bull; {capacity.nodeCount} nodes
                  </div>
                </div>
              </div>

              {capacity.recommendation && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <strong>Capacity Recommendation:</strong> {capacity.recommendation}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 7: Release Risk Guard Pre-Flight Simulation */}
      {activeTab === 'release_guard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Pre-Flight Release Risk Guard
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Evaluates error budget consumption, active incidents, recent change failure rate, and policy freezes before deployment.
                </p>
              </div>

              {/* Simulation Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    PROPOSED VERSION
                  </label>
                  <input
                    type="text"
                    value={proposedVersion}
                    onChange={(e) => setProposedVersion(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    CHANGE TYPE
                  </label>
                  <select
                    value={changeType}
                    onChange={(e) => setChangeType(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                  >
                    <option value="FEATURE">Feature Release</option>
                    <option value="HOTFIX">Hotfix / Patch</option>
                    <option value="CONFIG">Configuration Change</option>
                    <option value="INFRASTRUCTURE">Infrastructure Update</option>
                  </select>
                </div>

                <div>
                  <button
                    onClick={handleEvaluateRelease}
                    disabled={evaluatingRelease}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--brand)',
                      color: '#fff',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      opacity: evaluatingRelease ? 0.7 : 1
                    }}
                  >
                    {evaluatingRelease ? 'Evaluating Telemetry...' : 'Evaluate Pre-Flight Gate'}
                  </button>
                </div>
              </div>

              {/* Assessment Results Display */}
              {releaseAssessment && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: `2px solid ${
                      releaseAssessment.decision === 'PASS'
                        ? 'var(--status-healthy)'
                        : releaseAssessment.decision === 'BLOCK'
                        ? 'var(--status-critical)'
                        : 'var(--status-warning)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          backgroundColor:
                            releaseAssessment.decision === 'PASS'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : releaseAssessment.decision === 'BLOCK'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                          color:
                            releaseAssessment.decision === 'PASS'
                              ? 'var(--status-healthy)'
                              : releaseAssessment.decision === 'BLOCK'
                              ? 'var(--status-critical)'
                              : 'var(--status-warning)'
                        }}
                      >
                        GATE DECISION: {releaseAssessment.decision}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Risk Level: {releaseAssessment.riskLevel} (Risk Score: {releaseAssessment.score}/100)
                      </span>
                    </div>
                  </div>

                  {releaseAssessment.evaluationFactors && releaseAssessment.evaluationFactors.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Evaluation Factors:
                      </span>
                      {releaseAssessment.evaluationFactors.map((f, i) => (
                        <div key={i} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              padding: '1px 5px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor: f.status === 'PASS' ? 'rgba(16, 185, 129, 0.15)' : f.status === 'FAIL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: f.status === 'PASS' ? 'var(--status-healthy)' : f.status === 'FAIL' ? 'var(--status-critical)' : 'var(--status-warning)'
                            }}
                          >
                            {f.status}
                          </span>
                          <strong style={{ color: 'var(--text-primary)' }}>{f.factor}:</strong>
                          <span style={{ color: 'var(--text-secondary)' }}>{f.details}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {releaseAssessment.recommendation && (
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                      <strong>Recommendation:</strong> {releaseAssessment.recommendation}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 8: Remediation Recovery Verification */}
      {activeTab === 'recovery_verify' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Fresh-Read Post-Remediation Recovery Verification
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Executes a real-time live telemetry check to verify that a completed remediation action successfully restored SLIs, error budget burn rates, and latency to acceptable baselines.
                </p>
              </div>

              {/* Input Form */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    INCIDENT ID (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={verifyIncidentId}
                    onChange={(e) => setVerifyIncidentId(e.target.value)}
                    placeholder="e.g. inc-payment-5xx"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    ACTION / REMEDIATION ID (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={verifyActionId}
                    onChange={(e) => setVerifyActionId(e.target.value)}
                    placeholder="e.g. act-scale-up-pod"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px'
                    }}
                  />
                </div>

                <div>
                  <button
                    onClick={handleVerifyRecovery}
                    disabled={verifyingRecovery}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--brand)',
                      color: '#fff',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      opacity: verifyingRecovery ? 0.7 : 1
                    }}
                  >
                    {verifyingRecovery ? 'Polling Fresh Telemetry...' : 'Verify Service Recovery'}
                  </button>
                </div>
              </div>

              {/* Recovery Verification Result */}
              {recoveryResult && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: `2px solid ${
                      recoveryResult.status === 'RECOVERED'
                        ? 'var(--status-healthy)'
                        : recoveryResult.status === 'PARTIALLY_RECOVERED'
                        ? 'var(--status-warning)'
                        : 'var(--status-critical)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          backgroundColor:
                            recoveryResult.status === 'RECOVERED'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : recoveryResult.status === 'PARTIALLY_RECOVERED'
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(239, 68, 68, 0.2)',
                          color:
                            recoveryResult.status === 'RECOVERED'
                              ? 'var(--status-healthy)'
                              : recoveryResult.status === 'PARTIALLY_RECOVERED'
                              ? 'var(--status-warning)'
                              : 'var(--status-critical)'
                        }}
                      >
                        STATUS: {recoveryResult.status}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Fresh Read: {recoveryResult.freshReadConfirmed ? 'CONFIRMED' : 'STALE'}
                      </span>
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Executed: {new Date(recoveryResult.executedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Verified Metrics Table */}
                  {recoveryResult.verifiedMetrics && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                      {recoveryResult.verifiedMetrics.map((m, i) => (
                        <div key={i} style={{ padding: '8px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px' }}>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{m.metricName}</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px', color: m.restored ? 'var(--status-healthy)' : 'var(--status-critical)' }}>
                            {m.preRemediationValue} &rarr; {m.currentFreshValue} (Target: {m.targetThreshold})
                          </div>
                          <div style={{ fontSize: '10px', color: m.restored ? 'var(--status-healthy)' : 'var(--status-critical)', marginTop: '2px' }}>
                            {m.restored ? '\u2713 Restored' : '\u2717 Non-compliant'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    <strong>Notes:</strong> {recoveryResult.notes}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
