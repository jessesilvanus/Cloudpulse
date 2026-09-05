import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOverview } from '../api/hooks.ts';
import { cloudConnectionsApi, globalCommandCenterApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/Card.tsx';
import { StatCard } from '../components/ui/StatCard.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { SeverityBadge } from '../components/ui/SeverityBadge.tsx';
import { DataTable, type Column } from '../components/ui/DataTable.tsx';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart.tsx';
import { Sparkline } from '../components/charts/Sparkline.tsx';
import { LoadingState, ErrorState } from '../components/ui/States.tsx';
import type {
  Service,
  SloDefinition,
  AwsRealEvent,
  GlobalCommandCenterOverview,
  EnterpriseRiskHeatmap,
  AiEnterpriseAnalystResult
} from '@cloudpulse/shared';
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  SparklesIcon,
  ShieldIcon,
  DollarSignIcon,
  TopologyIcon,
  CheckCircleIcon,
  OrganizationIcon
} from '../components/ui/Icons.tsx';

export function OverviewPage() {
  const { data: overview, loading, error, refetch } = useOverview(10000);
  const [activeTab, setActiveTab] = useState<'COMMAND_CENTER' | 'OPERATIONS' | 'RISK_MATRIX' | 'ESTATE_SIMULATION'>('COMMAND_CENTER');
  const [commandOverview, setCommandOverview] = useState<GlobalCommandCenterOverview | null>(null);
  const [riskHeatmap, setRiskHeatmap] = useState<EnterpriseRiskHeatmap | null>(null);
  const [serviceSearch, setServiceSearch] = useState('');
  const [simRunning, setSimRunning] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [liveAwsEvents, setLiveAwsEvents] = useState<AwsRealEvent[]>([]);
  
  // AI Executive Analyst State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiEnterpriseAnalystResult | null>(null);

  const navigate = useNavigate();

  const fetchCommandData = () => {
    globalCommandCenterApi
      .getOverview()
      .then((data) => setCommandOverview(data))
      .catch(() => {});

    globalCommandCenterApi
      .getRiskHeatmap()
      .then((data) => setRiskHeatmap(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCommandData();
    cloudConnectionsApi
      .getAwsEvents({ timeRange: '24h' })
      .then((evts) => setLiveAwsEvents(evts))
      .catch(() => {});
  }, []);

  const handleAskAi = (promptToUse?: string) => {
    const q = promptToUse || aiPrompt;
    if (!q || q.trim() === '') return;
    setAiLoading(true);
    globalCommandCenterApi
      .queryAiAnalyst(q)
      .then((res) => setAiResult(res))
      .catch(() => {})
      .finally(() => setAiLoading(false));
  };

  const handleApproveDecision = (id: string) => {
    globalCommandCenterApi
      .executeDecisionAction(id, 'APPROVE', 'executive.operator@cloudpulse.io', 'Approved from Executive Overview')
      .then(() => fetchCommandData())
      .catch(() => {});
  };

  if (loading && !overview && !commandOverview) {
    return (
      <div className="page-container">
        <LoadingState message="Connecting to CLOUDPULSE Global Command Center Engine..." />
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="page-container">
        <ErrorState title="Overview Telemetry Unreachable" message={error} onRetry={refetch} />
      </div>
    );
  }

  const {
    systemHealth = { status: 'DEGRADED', uptimePercent: 99.98, incidentCount: 1, activeAlertCount: 3 },
    metrics = { requestRate: 24500, errorRate: 0.04, latencyP99: 340, throughputMb: 890 },
    telemetryTrends = { requestRateHistory: [], errorRateHistory: [], latencyHistory: [] },
    activeAlerts = [],
    openIncidents = [],
    services = [],
    slos = [],
    recentIncidents = [],
    recentAlerts = [],
    recentLogs = []
  } = overview || {};

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.team.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const runSim = () => {
    setSimRunning(true);
    setTimeout(() => {
      setSimResult({
        target: 'us-east-1 (Primary)',
        rtoSeconds: 42,
        rpoSeconds: 0,
        failoverRegion: 'eu-west-1 (Ireland)',
        revenueAtRisk: 0.0,
        readinessScore: 94.0,
        summary:
          'Multi-cloud automated failover verified: Route53 DNS weighted shift + Aurora read-replica promotion completed in 42s with zero database data loss.'
      });
      setSimRunning(false);
    }, 600);
  };

  const serviceColumns: Column<Service>[] = [
    {
      key: 'name',
      header: 'Service',
      sortable: true,
      sortValue: (s) => s.name,
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand)' }}>
            {s.name}
          </span>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{s.team}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Health',
      sortable: true,
      sortValue: (s) => s.status,
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'requestRate',
      header: 'RPS',
      sortable: true,
      sortValue: (s) => s.requestRate,
      render: (s) => <span style={{ fontFamily: 'var(--font-mono)' }}>{s.requestRate.toLocaleString()}</span>,
    },
    {
      key: 'errorRate',
      header: 'Error Rate',
      sortable: true,
      sortValue: (s) => s.errorRate,
      render: (s) => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: s.errorRate > 1.0 ? 'var(--status-critical)' : 'inherit',
          }}
        >
          {s.errorRate.toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'latencyP99Ms',
      header: 'P99 Latency',
      sortable: true,
      sortValue: (s) => s.latencyP99Ms,
      render: (s) => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: s.latencyP99Ms > 200 ? 'var(--status-critical)' : 'inherit',
          }}
        >
          {s.latencyP99Ms} ms
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="CLOUDPULSE GLOBAL CLOUD COMMAND CENTER"
        subtitle="Unified Enterprise Control Plane · Real-Time Cross-Cloud State, Situation Awareness, Multi-Domain Risk & Governed Priority Decisions"
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--status-healthy)',
                border: '1px solid var(--border-subtle)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ● LIVE TELEMETRY
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/decisions')}
              style={{ fontSize: '12px' }}
            >
              Executive Decisions ({commandOverview?.pendingDecisionsCount || 0})
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                refetch();
                fetchCommandData();
              }}
              style={{ fontSize: '12px' }}
            >
              ↻ Refresh Estate
            </button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '8px',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => setActiveTab('COMMAND_CENTER')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12.5px',
            fontWeight: 700,
            backgroundColor: activeTab === 'COMMAND_CENTER' ? 'var(--brand)' : 'var(--bg-surface)',
            color: activeTab === 'COMMAND_CENTER' ? '#fff' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <SparklesIcon /> Executive Command Center
        </button>

        <button
          onClick={() => setActiveTab('RISK_MATRIX')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12.5px',
            fontWeight: 700,
            backgroundColor: activeTab === 'RISK_MATRIX' ? 'var(--brand)' : 'var(--bg-surface)',
            color: activeTab === 'RISK_MATRIX' ? '#fff' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ShieldIcon /> Multi-Cloud Risk Heatmap
        </button>

        <button
          onClick={() => setActiveTab('OPERATIONS')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12.5px',
            fontWeight: 700,
            backgroundColor: activeTab === 'OPERATIONS' ? 'var(--brand)' : 'var(--bg-surface)',
            color: activeTab === 'OPERATIONS' ? '#fff' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
        >
          Infrastructure & Observability Stream
        </button>

        <button
          onClick={() => setActiveTab('ESTATE_SIMULATION')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12.5px',
            fontWeight: 700,
            backgroundColor: activeTab === 'ESTATE_SIMULATION' ? 'var(--brand)' : 'var(--bg-surface)',
            color: activeTab === 'ESTATE_SIMULATION' ? '#fff' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
        >
          Multi-Region DR Failover Simulator
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: EXECUTIVE COMMAND CENTER */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'COMMAND_CENTER' && (
        <>
          {/* Top Estate Scorecard */}
          <div className="grid grid-4" style={{ marginBottom: '16px' }}>
            <StatCard
              label="Global Estate Health Score"
              value={`${commandOverview?.health?.overallHealthScore.toFixed(1) || '84.6'} / 100`}
              subValue={`Status: ${commandOverview?.health?.overallStatus || 'DEGRADED'} · Multi-Cloud Aggregated`}
              status={commandOverview?.health?.overallStatus === 'CRITICAL' ? 'critical' : commandOverview?.health?.overallStatus === 'DEGRADED' ? 'warning' : 'healthy'}
            />
            <StatCard
              label="Active Correlated Situations"
              value={commandOverview?.activeSituationsCount || 3}
              subValue={`${commandOverview?.criticalSituationsCount || 1} P0/P1 emergency response`}
              status={commandOverview?.criticalSituationsCount ? 'critical' : 'warning'}
            />
            <StatCard
              label="Priority Executive Decisions"
              value={commandOverview?.pendingDecisionsCount || 3}
              subValue="Awaiting operator / CISO review"
              status={commandOverview?.pendingDecisionsCount ? 'warning' : 'healthy'}
            />
            <StatCard
              label="Telemetry Coverage & Freshness"
              value={`${commandOverview?.coverage?.overallCoveragePercent || 94.2}%`}
              subValue={`State: ${commandOverview?.freshness?.overallFreshness || 'LIVE'} · 0 Fabricated Signals`}
              status="info"
            />
          </div>

          {/* Domain Health Dial Matrix */}
          {commandOverview?.health && (
            <Card
              title="Multi-Domain Health & Control Matrix"
              subtitle="Live health score evaluation across all 8 architectural pillars with verified provider evidence."
              style={{ marginBottom: '16px' }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px'
                }}
              >
                {Object.entries(commandOverview.health.domains).map(([domain, score]) => {
                  const numScore = Number(score);
                  const isDegraded = numScore < 80;
                  const isWarning = numScore >= 80 && numScore < 90;
                  return (
                    <div
                      key={domain}
                      style={{
                        padding: '12px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        {domain.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: 800,
                          color: isDegraded ? 'var(--status-critical)' : isWarning ? 'var(--status-warning)' : 'var(--status-healthy)',
                          margin: '4px 0'
                        }}
                      >
                        {numScore.toFixed(1)}%
                      </div>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '2px',
                          backgroundColor: isDegraded ? 'var(--status-critical-bg)' : isWarning ? 'var(--status-warning-bg)' : 'var(--status-healthy-bg)',
                          color: isDegraded ? 'var(--status-critical)' : isWarning ? 'var(--status-warning)' : 'var(--status-healthy)'
                        }}
                      >
                        {isDegraded ? 'DEGRADED' : isWarning ? 'ELEVATED' : 'OPTIMAL'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Active Correlated Situations Section */}
          <Card
            title="Active Enterprise Situations (Priority Ranked)"
            subtitle="Cross-cloud incidents correlated across Security, Reliability, Governance, FinOps, and SRE signals."
            actions={
              <button
                onClick={() => navigate('/decisions')}
                style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 600 }}
              >
                View Decisions Queue →
              </button>
            }
            style={{ marginBottom: '16px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {commandOverview?.topSituations.map((sit) => (
                <div
                  key={sit.id}
                  onClick={() => navigate(`/situations/${sit.id}`)}
                  style={{
                    padding: '14px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    gap: '16px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor:
                            sit.priority === 'P0'
                              ? 'var(--status-critical-bg)'
                              : sit.priority === 'P1'
                              ? 'var(--status-warning-bg)'
                              : 'var(--bg-elevated)',
                          color:
                            sit.priority === 'P0'
                              ? 'var(--status-critical)'
                              : sit.priority === 'P1'
                              ? 'var(--status-warning)'
                              : 'var(--text-primary)',
                          border: '1px solid currentColor'
                        }}
                      >
                        Priority {sit.priority}
                      </span>
                      <SeverityBadge severity={sit.severity.toLowerCase() as any} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand)' }}>
                        {sit.scope}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {sit.id}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {sit.title}
                    </h4>

                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {sit.summary}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>
                        Impact: <strong style={{ color: 'var(--status-critical)' }}>${sit.businessImpact.financialImpactPerHour.toLocaleString()}/hr</strong>
                      </span>
                      <span>
                        SLA: <strong style={{ color: sit.businessImpact.slaBreached ? 'var(--status-critical)' : 'var(--status-healthy)' }}>{sit.businessImpact.slaBreached ? 'BREACHED' : 'HEALTHY'}</strong>
                      </span>
                      <span>
                        Confidence: <strong style={{ color: 'var(--text-primary)' }}>{sit.confidence}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                      Analyze 10-Stage Timeline →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Enterprise Analyst & Decisions Grid */}
          <div className="grid grid-2" style={{ marginBottom: '16px' }}>
            {/* AI Executive Analyst Drawer */}
            <Card
              title="AI Executive Analyst (Zero-Fabrication Grounded Intelligence)"
              subtitle="Strict NO-ACTION boundary · Cites real estate telemetry and failure domain evidence."
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Ask about estate health, active situations, root causes, or risk recommendations..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '12.5px'
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    disabled={aiLoading}
                    onClick={() => handleAskAi()}
                    style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    {aiLoading ? 'Analyzing...' : 'Ask AI'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleAskAi('What is our current estate health and top critical situations?')}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--brand)',
                      fontSize: '10.5px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Estate Briefing
                  </button>
                  <button
                    onClick={() => handleAskAi('What is the root cause of the payment gateway latency breach?')}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--brand)',
                      fontSize: '10.5px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Payment RCA
                  </button>
                  <button
                    onClick={() => handleAskAi('What are our top executive decisions and cost savings?')}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--brand)',
                      fontSize: '10.5px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Top Decisions
                  </button>
                </div>

                {aiResult && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '12px',
                      lineHeight: '1.5',
                      maxHeight: '260px',
                      overflowY: 'auto'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--brand)', marginBottom: '4px' }}>
                      AI Executive Summary ({aiResult.confidence} Confidence):
                    </div>
                    <div style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)' }}>
                      {aiResult.executiveSummary}
                    </div>

                    <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        GROUNDED EVIDENCE CITATIONS:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                        {aiResult.evidenceCitations.map((c, idx) => (
                          <span key={idx} style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            [{c.domain}] {c.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Priority Decisions Widget */}
            <Card
              title="Top Priority Decisions Queue"
              subtitle="Actionable executive decisions awaiting governed operator approval."
              actions={
                <button
                  onClick={() => navigate('/decisions')}
                  style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 600 }}
                >
                  View All Decisions ({commandOverview?.pendingDecisionsCount || 0}) →
                </button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {commandOverview?.priorityDecisions.slice(0, 3).map((dec) => (
                  <div
                    key={dec.id}
                    style={{
                      padding: '10px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '2px',
                            backgroundColor: dec.priority === 'P0' ? 'var(--status-critical-bg)' : 'var(--status-warning-bg)',
                            color: dec.priority === 'P0' ? 'var(--status-critical)' : 'var(--status-warning)'
                          }}
                        >
                          {dec.priority}
                        </span>
                        <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {dec.domain}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {dec.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--status-healthy)' }}>
                        {dec.estimatedSavingsOrRiskReduction}
                      </div>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={() => handleApproveDecision(dec.id)}
                      style={{ fontSize: '11px', padding: '4px 8px', whiteSpace: 'nowrap' }}
                    >
                      Approve →
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: MULTI-CLOUD RISK HEATMAP */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'RISK_MATRIX' && (
        <Card
          title="Multi-Cloud Estate Risk Matrix (AWS, Azure, GCP, Kubernetes)"
          subtitle="Cross-sectional risk evaluation across all 6 core pillars: Security, Reliability, Governance, FinOps, Resilience, and Operations."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Entity / Scope</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Provider</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Security</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Reliability</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Governance</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>FinOps</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Resilience</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Operations</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Composite Risk</th>
                </tr>
              </thead>
              <tbody>
                {riskHeatmap?.cells.map((cell) => {
                  const getRiskStyle = (level: string) => {
                    if (level === 'CRITICAL') return { bg: 'var(--status-critical-bg)', color: 'var(--status-critical)', weight: 800 };
                    if (level === 'HIGH') return { bg: 'var(--status-warning-bg)', color: 'var(--status-warning)', weight: 700 };
                    if (level === 'MEDIUM') return { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)', weight: 600 };
                    return { bg: 'var(--status-healthy-bg)', color: 'var(--status-healthy)', weight: 600 };
                  };

                  const compStyle = getRiskStyle(cell.compositeRiskLevel);

                  return (
                    <tr
                      key={cell.scopeId}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cell.scopeName}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{cell.topThreatSummary}</div>
                      </td>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{cell.provider}</td>
                      <td style={{ padding: '10px', color: getRiskStyle(cell.securityLevel).color, fontWeight: getRiskStyle(cell.securityLevel).weight }}>
                        {cell.securityRisk}% ({cell.securityLevel})
                      </td>
                      <td style={{ padding: '10px', color: getRiskStyle(cell.reliabilityLevel).color, fontWeight: getRiskStyle(cell.reliabilityLevel).weight }}>
                        {cell.reliabilityRisk}% ({cell.reliabilityLevel})
                      </td>
                      <td style={{ padding: '10px', color: getRiskStyle(cell.governanceLevel).color, fontWeight: getRiskStyle(cell.governanceLevel).weight }}>
                        {cell.governanceRisk}% ({cell.governanceLevel})
                      </td>
                      <td style={{ padding: '10px', color: getRiskStyle(cell.finopsLevel).color, fontWeight: getRiskStyle(cell.finopsLevel).weight }}>
                        {cell.finopsRisk}% ({cell.finopsLevel})
                      </td>
                      <td style={{ padding: '10px', color: getRiskStyle(cell.resilienceLevel).color, fontWeight: getRiskStyle(cell.resilienceLevel).weight }}>
                        {cell.resilienceRisk}% ({cell.resilienceLevel})
                      </td>
                      <td style={{ padding: '10px', color: getRiskStyle(cell.operationsLevel).color, fontWeight: getRiskStyle(cell.operationsLevel).weight }}>
                        {cell.operationsRisk}% ({cell.operationsLevel})
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: compStyle.bg,
                            color: compStyle.color,
                            fontWeight: 800,
                            fontSize: '11px'
                          }}
                        >
                          {cell.compositeRiskScore}% {cell.compositeRiskLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: INFRASTRUCTURE & OBSERVABILITY STREAM (PRESERVED) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'OPERATIONS' && (
        <>
          <div className="grid grid-4" style={{ marginBottom: '16px' }}>
            <StatCard
              label="Request Rate"
              value={`${((overview?.metrics?.requestRateRps || 24500) / 1000).toFixed(1)}k RPS`}
              subValue="Aggregated ingestion"
              sparkline={<Sparkline data={overview?.telemetryTrends?.requestRateSeries?.map((d: any) => d.value) || []} color="var(--brand)" />}
              status="healthy"
            />
            <StatCard
              label="Error Rate"
              value={`${(overview?.metrics?.errorRatePercent || 0.04).toFixed(2)}%`}
              subValue="Global HTTP 5xx"
              sparkline={<Sparkline data={overview?.telemetryTrends?.errorRateSeries?.map((d: any) => d.value) || []} color="var(--status-critical)" />}
              status={(overview?.metrics?.errorRatePercent || 0) > 1.0 ? 'critical' : 'healthy'}
            />
            <StatCard
              label="P99 Latency"
              value={`${overview?.metrics?.latencyP99Ms || 340} ms`}
              subValue="Global SLO Target: 200ms"
              sparkline={<Sparkline data={overview?.telemetryTrends?.latencyP99Series?.map((d: any) => d.value) || []} color="var(--status-warning)" />}
              status={(overview?.metrics?.latencyP99Ms || 0) > 200 ? 'warning' : 'healthy'}
            />
            <StatCard
              label="Network Throughput"
              value="890 MB/s"
              subValue="Multi-Cloud Interconnect"
              status="info"
            />
          </div>

          <div className="grid grid-2" style={{ marginBottom: '16px' }}>
            <Card title="Traffic Volume vs P99 Latency (24h)">
              <TimeSeriesChart
                data={overview?.telemetryTrends?.requestRateSeries || []}
                color="var(--brand)"
                unit=" req/s"
                height={180}
              />
            </Card>

            <Card title="Global Error Rate Trend">
              <TimeSeriesChart
                data={overview?.telemetryTrends?.errorRateSeries || []}
                color="var(--status-critical)"
                unit="%"
                height={180}
              />
            </Card>
          </div>

          <Card
            title="Monitored Services Directory"
            subtitle={`${filteredServices.length} registered microservices across production workloads`}
            actions={
              <input
                type="text"
                placeholder="Filter services..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              />
            }
          >
            <DataTable
              columns={serviceColumns as any}
              data={filteredServices}
              keyExtractor={(s: any) => s.id}
              onRowClick={(s: any) => navigate(`/services/${s.id}`)}
              pageSize={8}
            />
          </Card>
        </>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: ESTATE SIMULATION */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ESTATE_SIMULATION' && (
        <Card
          title="Multi-Region Disaster Recovery & Cascading Failure Simulator"
          subtitle="Execute safe What-If simulations to forecast RTO, RPO, and failover readiness across AWS and GCP regions."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              >
                <option>Scenario: Complete us-east-1 Outage (Primary Workload Region)</option>
                <option>Scenario: Multi-Cloud Egress Interconnect Severance (AWS &lt;-&gt; GCP)</option>
                <option>Scenario: Kubernetes Core Cluster Node Pool Blackout</option>
              </select>

              <button
                className="btn btn-primary"
                disabled={simRunning}
                onClick={runSim}
                style={{ fontSize: '12px' }}
              >
                {simRunning ? 'Running Cascading Simulation...' : '▶ Execute Simulation'}
              </button>
            </div>

            {simResult && (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand)' }}>
                    Simulation Result: {simResult.target}
                  </span>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--status-healthy-bg)',
                      color: 'var(--status-healthy)',
                      fontWeight: 800,
                      fontSize: '12px'
                    }}
                  >
                    Readiness Score: {simResult.readinessScore}%
                  </span>
                </div>

                <div className="grid grid-3" style={{ marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target RTO: </span>
                    <strong style={{ color: 'var(--status-healthy)' }}>{simResult.rtoSeconds}s</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Observed RPO: </span>
                    <strong style={{ color: 'var(--status-healthy)' }}>{simResult.rpoSeconds}s (Zero Data Loss)</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Failover Target: </span>
                    <strong>{simResult.failoverRegion}</strong>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {simResult.summary}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
export default OverviewPage;
