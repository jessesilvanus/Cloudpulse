import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingState, ErrorState } from '../components/ui/States';
import { sreControlApi } from '../api/client';
import type {
  SrePlatformSummary,
  CloudService,
  ServiceLevelObjective,
  ErrorBudget,
  DependencyRisk,
  CascadingFailurePath,
  SreSinglePointOfFailure,
  FailureDomainAnalysis,
  ChangeReliabilityCorrelation,
  CapacityIntelligence,
  ReleaseRiskAssessment,
  SreInvestigationResult
} from '@cloudpulse/shared';

export function SreCommandCenterPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SrePlatformSummary | null>(null);
  const [services, setServices] = useState<CloudService[]>([]);
  const [slos, setSlos] = useState<ServiceLevelObjective[]>([]);
  const [errorBudgets, setErrorBudgets] = useState<ErrorBudget[]>([]);
  const [dependencies, setDependencies] = useState<DependencyRisk[]>([]);
  const [cascadingRisks, setCascadingRisks] = useState<CascadingFailurePath[]>([]);
  const [spofs, setSpofs] = useState<SreSinglePointOfFailure[]>([]);
  const [failureDomains, setFailureDomains] = useState<FailureDomainAnalysis | null>(null);
  const [changes, setChanges] = useState<ChangeReliabilityCorrelation[]>([]);
  const [capacity, setCapacity] = useState<CapacityIntelligence[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'services' | 'slos' | 'budgets' | 'dependencies' | 'spofs' | 'capacity' | 'changes'>('services');

  // AI Copilot
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<SreInvestigationResult | null>(null);

  // Release Guard Simulation Modal
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [selectedReleaseService, setSelectedReleaseService] = useState('payment-service');
  const [proposedVersion, setProposedVersion] = useState('v2.4.3');
  const [evaluatingRelease, setEvaluatingRelease] = useState(false);
  const [releaseAssessment, setReleaseAssessment] = useState<ReleaseRiskAssessment | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        summaryData,
        servicesData,
        slosData,
        budgetsData,
        depsData,
        cascadeData,
        spofsData,
        domainsData,
        changesData,
        capData
      ] = await Promise.all([
        sreControlApi.getSreOverview(),
        sreControlApi.getSreServices(),
        sreControlApi.getSreSlos(),
        sreControlApi.getSreErrorBudgets(),
        sreControlApi.getSreDependencies(),
        sreControlApi.getSreCascadingRisks(),
        sreControlApi.getSreSpofs(),
        sreControlApi.getSreFailureDomains(),
        sreControlApi.getSreChangeCorrelations(),
        sreControlApi.getSreCapacity()
      ]);

      setSummary(summaryData);
      setServices(servicesData);
      setSlos(slosData);
      setErrorBudgets(budgetsData);
      setDependencies(depsData);
      setCascadingRisks(cascadeData);
      setSpofs(spofsData);
      setFailureDomains(domainsData);
      setChanges(changesData);
      setCapacity(capData);
    } catch (err: any) {
      setError(err.message || 'Failed to load SRE platform data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunAiInvestigation = async (customPrompt?: string) => {
    const query = customPrompt || aiPrompt;
    if (!query.trim()) return;
    try {
      setAiLoading(true);
      const res = await sreControlApi.investigateSre(query);
      setAiResult(res);
    } catch (err: any) {
      alert(`AI SRE Investigation failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleEvaluateRelease = async () => {
    try {
      setEvaluatingRelease(true);
      const res = await sreControlApi.evaluateReleaseRisk({
        serviceId: selectedReleaseService,
        proposedVersion,
        changeType: 'FEATURE'
      });
      setReleaseAssessment(res);
    } catch (err: any) {
      alert(`Release risk evaluation failed: ${err.message}`);
    } finally {
      setEvaluatingRelease(false);
    }
  };

  if (loading) {
    return <LoadingState message="Aggregating multi-cloud telemetry and SRE reliability control plane..." />;
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorState title="SRE Control Plane Error" message={error} onRetry={loadData} />
      </div>
    );
  }

  const filteredServices = services.filter((svc) => {
    const matchesSearch = svc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      svc.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || svc.tier === tierFilter;
    const matchesHealth = healthFilter === 'all' || svc.health === healthFilter;
    return matchesSearch && matchesTier && matchesHealth;
  });

  const filteredSlos = slos.filter((slo) => {
    return slo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slo.serviceId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <PageHeader
        title="SRE & Reliability Control Plane"
        subtitle="Continuous service health, multi-window error budget burn rate tracking, cascading failure intelligence, release risk gating, and verified recovery."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setReleaseModalOpen(true);
                handleEvaluateRelease();
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: 'var(--brand)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Release Risk Guard
            </button>
            <button
              onClick={loadData}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>
        }
      />

      {/* Global Reliability KPI Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Reliability Score
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--status-healthy)', marginTop: '4px' }}>
            {summary?.globalReliabilityScore ?? 0}/100
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Grade: <strong>{summary?.globalReliabilityGrade}</strong> (8 dimensions)
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            SLO Attainment
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '4px' }}>
            {summary?.overallSloAttainmentPercent.toFixed(1) ?? 0}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {summary?.achievingSlos} met &bull; {summary?.breachedSlos} breached
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Burn Rate Alerts
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: (summary?.criticalBurnRateCount ?? 0) > 0 ? 'var(--status-critical)' : 'var(--status-healthy)', marginTop: '4px' }}>
            {summary?.criticalBurnRateCount ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: (summary?.criticalBurnRateCount ?? 0) > 0 ? 'var(--status-critical)' : 'var(--text-muted)', marginTop: '4px' }}>
            {(summary?.criticalBurnRateCount ?? 0) > 0 ? 'Critical fast-burn active' : 'Budgets stable'}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Active Incidents
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: (summary?.activeIncidentsCount ?? 0) > 0 ? 'var(--status-warning)' : 'var(--text-primary)', marginTop: '4px' }}>
            {summary?.activeIncidentsCount ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Telemetry Correlated
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Mean Time to Recover
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '4px' }}>
            {summary?.mttMetrics.mttrMinutes !== null && summary?.mttMetrics.mttrMinutes !== undefined ? `${summary.mttMetrics.mttrMinutes.toFixed(1)}m` : '—'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            MTTD: {summary?.mttMetrics.mttdMinutes?.toFixed(0) || '—'}m &bull; MTTA: {summary?.mttMetrics.mttaMinutes?.toFixed(0) || '—'}m
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Budget Policy State
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: summary?.activePolicyState === 'NORMAL' ? 'var(--status-healthy)' : 'var(--status-critical)', marginTop: '8px' }}>
            {summary?.activePolicyState}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Coverage: {summary?.observabilityCoveragePercent}%
          </div>
        </Card>
      </div>

      {/* AI SRE Copilot Investigation Bar */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              AI SRE Reliability Copilot
            </span>
            <span
              style={{
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa'
              }}
            >
              Evidence-Grounded
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunAiInvestigation();
              }}
              placeholder="Ask SRE Copilot: e.g. Why is payment-service burning budget? Which services are at risk of cascading failure?"
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            />
            <button
              onClick={() => handleRunAiInvestigation()}
              disabled={aiLoading}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                backgroundColor: 'var(--brand)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                opacity: aiLoading ? 0.7 : 1
              }}
            >
              {aiLoading ? 'Investigating Telemetry...' : 'Investigate'}
            </button>
          </div>

          {/* Quick Investigation Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              'Why is payment-service burning budget?',
              'Which services are approaching capacity limits?',
              'Show single points of failure across clusters',
              'Canary release pre-flight risk for auth-service'
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAiPrompt(prompt);
                  handleRunAiInvestigation(prompt);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  cursor: 'pointer'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* AI Result View */}
          {aiResult && (
            <div
              style={{
                marginTop: '8px',
                padding: '16px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand)' }}>
                  Diagnosis &bull; Intent: {aiResult.intent} (Confidence: {aiResult.confidence})
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(aiResult.analyzedAt).toLocaleTimeString()}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {aiResult.primaryDiagnosis}
              </p>

              {aiResult.evidenceCitations && aiResult.evidenceCitations.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Evidence Citations:
                  </span>
                  {aiResult.evidenceCitations.map((c, i) => (
                    <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '8px' }}>
                      &bull; <strong style={{ color: 'var(--text-primary)' }}>[{c.type}] {c.title}:</strong> {c.detail} {c.value !== undefined ? `(Value: ${c.value})` : ''}
                    </div>
                  ))}
                </div>
              )}

              {aiResult.recommendedAction && (
                <div style={{ padding: '10px 14px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', fontSize: '12.5px' }}>
                  <strong style={{ color: 'var(--status-healthy)' }}>Recommended Operator Action:</strong> {aiResult.recommendedAction.title} &bull; {aiResult.recommendedAction.reason} ({aiResult.recommendedAction.safetyType})
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Tabs Bar & Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
          {[
            { id: 'services', label: `Services (${services.length})` },
            { id: 'slos', label: `SLOs (${slos.length})` },
            { id: 'budgets', label: `Error Budgets (${errorBudgets.length})` },
            { id: 'dependencies', label: `Dependencies (${dependencies.length})` },
            { id: 'spofs', label: `SPOFs (${spofs.length})` },
            { id: 'capacity', label: `Capacity (${capacity.length})` },
            { id: 'changes', label: `Changes & Correlation (${changes.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--brand)' : 'var(--text-secondary)',
                backgroundColor: activeTab === tab.id ? 'var(--bg-active)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--brand)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by name..."
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              width: '180px'
            }}
          />
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px'
            }}
          >
            <option value="all">All Tiers</option>
            <option value="TIER_0">Tier 0 (Mission Critical)</option>
            <option value="TIER_1">Tier 1 (Core)</option>
            <option value="TIER_2">Tier 2 (Standard)</option>
            <option value="TIER_3">Tier 3 (Batch)</option>
          </select>
        </div>
      </div>

      {/* TAB CONTENT: SERVICES */}
      {activeTab === 'services' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredServices.map((svc) => (
            <Card key={svc.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        {svc.provider} &bull; {svc.tier}
                      </span>
                    </div>
                    <h4 style={{ margin: '6px 0 0', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {svc.name}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Owner: {svc.owner} &bull; {svc.environment}
                    </span>
                  </div>

                  <StatusBadge
                    status={
                      svc.health === 'HEALTHY'
                        ? 'healthy'
                        : svc.health === 'DEGRADED'
                        ? 'degraded'
                        : 'unhealthy'
                    }
                    label={svc.health}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '10px', backgroundColor: 'var(--bg-canvas)', borderRadius: '6px', fontSize: '11.5px' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Reliability Score</div>
                    <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {svc.reliabilityScore}/100
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Coverage</div>
                    <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {svc.telemetryCoverage.coveragePercent}%
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>P95 Latency</div>
                    <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {svc.goldenSignals.latencyP95Ms !== undefined ? `${svc.goldenSignals.latencyP95Ms.toFixed(1)} ms` : 'UNKNOWN'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Error Rate</div>
                    <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: (svc.goldenSignals.errorRatePercent ?? 0) > 1 ? 'var(--status-critical)' : 'var(--text-primary)', marginTop: '2px' }}>
                      {svc.goldenSignals.errorRatePercent !== undefined ? `${svc.goldenSignals.errorRatePercent.toFixed(2)}%` : 'UNKNOWN'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{svc.dependencies.length} dependencies</span>
                  <Link
                    to={`/sre/services/${svc.id}`}
                    style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}
                  >
                    Reliability Inspector &rarr;
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB CONTENT: SLOS */}
      {activeTab === 'slos' && (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 12px' }}>SLO Objective</th>
                  <th style={{ padding: '8px 12px' }}>Target Service</th>
                  <th style={{ padding: '8px 12px' }}>Target %</th>
                  <th style={{ padding: '8px 12px' }}>Current Observed</th>
                  <th style={{ padding: '8px 12px' }}>Time Window</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlos.map((slo) => (
                  <tr key={slo.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {slo.name}
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 400 }}>{slo.targetSource}</div>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>
                      {slo.serviceId}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {slo.target}{slo.objectiveType === 'AVAILABILITY' ? '%' : 'ms'}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                      <span style={{ color: slo.status === 'ACHIEVING' ? 'var(--status-healthy)' : 'var(--status-critical)' }}>
                        {slo.currentValue !== null ? `${slo.currentValue}${slo.objectiveType === 'AVAILABILITY' ? '%' : 'ms'}` : 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
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
                    <td style={{ padding: '10px 12px' }}>
                      <Link to={`/sre/services/${slo.serviceId}`} style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: ERROR BUDGETS */}
      {activeTab === 'budgets' && (
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
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        {eb.serviceName}
                      </span>
                      <h4 style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {eb.budgetType}
                      </h4>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: budgetColor }}>
                      {eb.remainingPercent.toFixed(1)}% Left
                    </span>
                  </div>

                  <div style={{ height: '6px', backgroundColor: 'var(--bg-canvas)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, eb.remainingPercent))}%`, backgroundColor: budgetColor, borderRadius: '3px' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', fontSize: '11px', backgroundColor: 'var(--bg-canvas)', padding: '8px', borderRadius: '4px' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>1h Burn</div>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: eb.shortWindowBurnRate > 2 ? 'var(--status-critical)' : 'inherit' }}>{eb.shortWindowBurnRate.toFixed(1)}x</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>24h Burn</div>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{eb.longWindowBurnRate.toFixed(1)}x</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>Exhaustion</div>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: eb.projectedExhaustionHours && eb.projectedExhaustionHours < 72 ? 'var(--status-critical)' : 'inherit' }}>
                        {eb.projectedExhaustionHours !== null ? `${eb.projectedExhaustionHours}h` : 'Stable'}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT: DEPENDENCY RISK */}
      {activeTab === 'dependencies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Cascading risks alerts */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Cascading Failure Propagation Paths Detected ({cascadingRisks.length})
              </h4>
              {cascadingRisks.map((c) => (
                <div key={c.id} style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: 'var(--status-critical)' }}>
                      [{c.evidenceRank} CASCADE] {c.pathDescription}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      Blast Score: {c.blastRadiusScore}/100 &bull; Impacted: {c.impactedServices.length} services
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    <strong>Origin:</strong> {c.originServiceName} &bull; <strong>Mitigation:</strong> {c.mitigationRecommendation}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Dependencies table */}
          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 12px' }}>Source Service</th>
                    <th style={{ padding: '8px 12px' }}>Target Dependency</th>
                    <th style={{ padding: '8px 12px' }}>Type</th>
                    <th style={{ padding: '8px 12px' }}>Criticality</th>
                    <th style={{ padding: '8px 12px' }}>P99 Latency</th>
                    <th style={{ padding: '8px 12px' }}>Error Rate</th>
                    <th style={{ padding: '8px 12px' }}>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {dependencies.map((d, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{d.serviceName}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--brand)', fontWeight: 600 }}>{d.dependencyName}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{d.dependencyType}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px' }}>{d.criticality}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>{d.p99LatencyMs} ms</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>{d.errorRatePercent.toFixed(2)}%</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, backgroundColor: d.riskLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: d.riskLevel === 'CRITICAL' ? 'var(--status-critical)' : 'var(--status-healthy)' }}>
                          {d.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: SPOFS */}
      {activeTab === 'spofs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {spofs.map((spof) => (
            <Card key={spof.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--status-critical)' }}>
                    {spof.blastRadius} SPOF
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Type: {spof.entityType}
                  </span>
                </div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {spof.entityName}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <strong>Impacts {spof.dependentServices.length} Dependent Services:</strong> {spof.dependentServices.join(', ')}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                  <strong>Recommendation:</strong> {spof.recommendation}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB CONTENT: CAPACITY */}
      {activeTab === 'capacity' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {capacity.map((cap) => (
            <Card key={cap.serviceId}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cap.serviceName}
                  </h4>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: cap.scalingPressure === 'CRITICAL' ? 'var(--status-critical)' : 'var(--text-secondary)' }}>
                    {cap.scalingPressure} Pressure
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '8px', backgroundColor: 'var(--bg-canvas)', borderRadius: '4px', fontSize: '11.5px' }}>
                  <div>CPU: <strong>{cap.cpuSaturationPercent !== null ? `${cap.cpuSaturationPercent.toFixed(1)}%` : 'N/A'}</strong></div>
                  <div>Memory: <strong>{cap.memorySaturationPercent !== null ? `${cap.memorySaturationPercent.toFixed(1)}%` : 'N/A'}</strong></div>
                  <div>Replicas: <strong>{cap.podCount} pods</strong></div>
                  <div>Days to Exhaust: <strong style={{ color: cap.forecastDaysToExhaustion && cap.forecastDaysToExhaustion < 7 ? 'var(--status-critical)' : 'inherit' }}>{cap.forecastDaysToExhaustion !== null ? `${cap.forecastDaysToExhaustion}d` : 'Stable'}</strong></div>
                </div>
                {cap.recommendation && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    {cap.recommendation}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB CONTENT: CHANGES */}
      {activeTab === 'changes' && (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 12px' }}>Service</th>
                  <th style={{ padding: '8px 12px' }}>Change ID</th>
                  <th style={{ padding: '8px 12px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Correlation Type</th>
                  <th style={{ padding: '8px 12px' }}>Confidence</th>
                  <th style={{ padding: '8px 12px' }}>Summary</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((ch) => (
                  <tr key={ch.changeId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--brand)' }}>{ch.serviceId}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{ch.changeId}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{ch.changeType}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px' }}>{ch.correlationType}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: ch.confidence === 'HIGH' ? 'var(--status-critical)' : 'var(--text-secondary)' }}>{ch.confidence}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', maxWidth: '350px' }}>{ch.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Release Risk Guard Simulation Modal */}
      {releaseModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              maxWidth: '650px',
              width: '100%',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Release Risk Guard &bull; Pre-Flight Gate Evaluator
              </h3>
              <button
                onClick={() => setReleaseModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  TARGET SERVICE
                </label>
                <select
                  value={selectedReleaseService}
                  onChange={(e) => setSelectedReleaseService(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.tier})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  PROPOSED VERSION
                </label>
                <input
                  type="text"
                  value={proposedVersion}
                  onChange={(e) => setProposedVersion(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            <button
              onClick={handleEvaluateRelease}
              disabled={evaluatingRelease}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                backgroundColor: 'var(--brand)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {evaluatingRelease ? 'Evaluating Live Guard...' : 'Evaluate Pre-Flight Release Guard'}
            </button>

            {releaseAssessment && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '6px',
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
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
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
                    DECISION: {releaseAssessment.decision}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Risk Level: {releaseAssessment.riskLevel} (Score: {releaseAssessment.score}/100)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {releaseAssessment.evaluationFactors.map((f, i) => (
                    <div key={i} style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      &bull; <strong style={{ color: 'var(--text-primary)' }}>{f.factor} [{f.status}]:</strong> {f.details}
                    </div>
                  ))}
                </div>

                {releaseAssessment.recommendation && (
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                    <strong>Recommendation:</strong> {releaseAssessment.recommendation}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
