import React, { useState, useEffect } from 'react';
import { realSecurityApi, cloudConnectionsApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { LoadingState } from '../components/ui/States.tsx';
import type {
  ZeroTrustSecurityScorecard,
  RealCloudIdentity,
  EffectiveAccessRule,
  CloudAccessRelationship,
  HighRiskAccessPath,
  PublicExposureEntity,
  ZeroTrustControlEffectiveness,
  SecurityAccessReview,
  SecurityExceptionRecord,
  AiSecurityAnalystResult,
} from '@cloudpulse/shared';

export function SecurityPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'identities' | 'paths' | 'exposure' | 'controls' | 'governance' | 'simulator'
  >('overview');

  // Core Data States
  const [scorecard, setScorecard] = useState<ZeroTrustSecurityScorecard | null>(null);
  const [identities, setIdentities] = useState<RealCloudIdentity[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<RealCloudIdentity | null>(null);
  const [identityEffectiveAccess, setIdentityEffectiveAccess] = useState<EffectiveAccessRule[]>([]);
  const [accessPaths, setAccessPaths] = useState<HighRiskAccessPath[]>([]);
  const [publicExposures, setPublicExposures] = useState<PublicExposureEntity[]>([]);
  const [controlEffectiveness, setControlEffectiveness] = useState<ZeroTrustControlEffectiveness[]>([]);
  const [reviews, setReviews] = useState<SecurityAccessReview[]>([]);
  const [exceptions, setExceptions] = useState<SecurityExceptionRecord[]>([]);

  // Filter States
  const [identityProviderFilter, setIdentityProviderFilter] = useState<string>('all');
  const [identityPrivilegeFilter, setIdentityPrivilegeFilter] = useState<string>('all');
  const [identitySearch, setIdentitySearch] = useState<string>('');
  const [pathRiskFilter, setPathRiskFilter] = useState<string>('all');
  const [exposureProviderFilter, setExposureProviderFilter] = useState<string>('all');

  // Governance Modal Form States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewIdentityId, setReviewIdentityId] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'CERTIFIED' | 'REVOKED' | 'MODIFIED_PRIVILEGES'>('CERTIFIED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionTitle, setExceptionTitle] = useState('');
  const [exceptionIdentityId, setExceptionIdentityId] = useState('');
  const [exceptionJustification, setExceptionJustification] = useState('');
  const [exceptionControls, setExceptionControls] = useState('');
  const [exceptionApprover, setExceptionApprover] = useState('SecOps Lead');
  const [exceptionDays, setExceptionDays] = useState(30);

  // Simulation State
  const [simName, setSimName] = useState('Revoke wildcards from admin role');
  const [simDesc, setSimDesc] = useState('Verify blast radius and operational safety of removing *:* wildcard');
  const [simChangeType, setSimChangeType] = useState<
    'REVOKE_ROLE' | 'REMOVE_SG_RULE' | 'ENFORCE_MFA' | 'RESTRICT_ASSUME_ROLE' | 'ROTATE_KEY'
  >('REVOKE_ROLE');
  const [simTargetIdentity, setSimTargetIdentity] = useState('arn:aws:iam::123456789012:role/admin-ops-role');
  const [simRule, setSimRule] = useState('AdministratorAccess');
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  // AI Analyst State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<AiSecurityAnalystResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // General Page State
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        sc,
        idList,
        pathList,
        expList,
        ctrlList,
        revList,
        excList,
      ] = await Promise.all([
        realSecurityApi.getSecurityScorecard(),
        realSecurityApi.getRealIdentities(),
        realSecurityApi.getHighRiskAccessPaths(),
        realSecurityApi.getPublicExposureEntities(),
        realSecurityApi.getControlEffectiveness(),
        realSecurityApi.getSecurityAccessReviews(),
        realSecurityApi.getSecurityExceptions(),
      ]);

      setScorecard(sc);
      setIdentities(idList);
      setAccessPaths(pathList);
      setPublicExposures(expList);
      setControlEffectiveness(ctrlList);
      setReviews(revList);
      setExceptions(excList);
    } catch (err: any) {
      console.error('Failed to load Zero-Trust Security data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectIdentity = async (id: RealCloudIdentity) => {
    setSelectedIdentity(id);
    try {
      const eff = await realSecurityApi.getEffectiveAccess({ identityId: id.id });
      setIdentityEffectiveAccess(eff);
    } catch (err: any) {
      console.error('Failed to fetch effective access:', err);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewIdentityId) return;
    try {
      await realSecurityApi.createSecurityAccessReview({
        identityId: reviewIdentityId,
        reviewerUserId: 'usr-sec-lead',
        reviewerName: 'Security Lead Auditor',
        decision: reviewDecision,
        notes: reviewNotes || undefined,
      });
      setFeedback(`Access review submitted for ${reviewIdentityId}: ${reviewDecision}`);
      setShowReviewModal(false);
      setReviewNotes('');
      const updated = await realSecurityApi.getSecurityAccessReviews();
      setReviews(updated);
    } catch (err: any) {
      setFeedback(`Review submission failed: ${err.message}`);
    }
  };

  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionTitle || !exceptionJustification) return;
    try {
      await realSecurityApi.createSecurityException({
        title: exceptionTitle,
        targetIdentityId: exceptionIdentityId || undefined,
        justification: exceptionJustification,
        compensatingControls: exceptionControls.split(',').map((s) => s.trim()).filter(Boolean),
        riskAcceptedBy: exceptionApprover,
        expiresInDays: exceptionDays,
      });
      setFeedback(`Security Exception granted: ${exceptionTitle}`);
      setShowExceptionModal(false);
      setExceptionTitle('');
      setExceptionJustification('');
      setExceptionControls('');
      const updated = await realSecurityApi.getSecurityExceptions();
      setExceptions(updated);
    } catch (err: any) {
      setFeedback(`Exception creation failed: ${err.message}`);
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSimulating(true);
      const res = await realSecurityApi.simulateSecurityWhatIf({
        name: simName,
        description: simDesc,
        changeType: simChangeType,
        targetIdentityId: simTargetIdentity || undefined,
        policyOrRuleToModify: simRule || undefined,
      });
      setSimResult(res);
    } catch (err: any) {
      setFeedback(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleAskAnalyst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    try {
      setAiLoading(true);
      const res = await realSecurityApi.investigateSecurity(aiPrompt);
      setAiResult(res);
    } catch (err: any) {
      setFeedback(`Security Analyst query failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredIdentities = identities.filter((id) => {
    if (identityProviderFilter !== 'all' && id.provider !== identityProviderFilter) return false;
    if (identityPrivilegeFilter !== 'all' && id.privilegeLevel !== identityPrivilegeFilter) return false;
    if (identitySearch) {
      const q = identitySearch.toLowerCase();
      return (
        id.displayName.toLowerCase().includes(q) ||
        id.id.toLowerCase().includes(q) ||
        id.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredPaths = accessPaths.filter((p) => {
    if (pathRiskFilter !== 'all' && p.riskLevel !== pathRiskFilter) return false;
    return true;
  });

  const filteredExposures = publicExposures.filter((e) => {
    if (exposureProviderFilter !== 'all' && e.provider !== exposureProviderFilter) return false;
    return true;
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Zero-Trust Cloud Security & Identity Control Plane"
        subtitle="Continuous multi-cloud identity normalization, IAM least privilege, high-risk attack paths, public exposure telemetry, and governed response."
      />

      {feedback && (
        <div
          style={{
            margin: '16px 0',
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid var(--brand)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>ℹ {feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-default)',
          marginBottom: '20px',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'overview', label: 'Overview & Scorecard' },
          { id: 'identities', label: `Unified Identities (${identities.length})` },
          { id: 'paths', label: `High-Risk Paths (${accessPaths.length})` },
          { id: 'exposure', label: `Public Exposure (${publicExposures.length})` },
          { id: 'controls', label: 'Control Effectiveness' },
          { id: 'governance', label: 'Reviews & Exceptions' },
          { id: 'simulator', label: 'Simulator & AI Analyst' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--brand)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && !scorecard && (
        <LoadingState message="Auditing multi-cloud Zero-Trust security telemetry..." />
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 1: OVERVIEW & SCORECARD
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && scorecard && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Executive Posture KPIs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            <Card padding="16px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Zero-Trust Posture Score</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    color: 'var(--brand)',
                    fontWeight: 700,
                  }}
                >
                  CALCULATED
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <span
                  style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: scorecard.overallPostureScore >= 80 ? 'var(--status-healthy)' : 'var(--status-degraded)',
                  }}
                >
                  {scorecard.overallPostureScore.toFixed(1)}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ 100</span>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Weighted across Identity, Network, Kubernetes & Data
              </div>
            </Card>

            <Card padding="16px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MFA Adoption Rate</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor:
                      scorecard.humanMfaAttainment >= 90
                        ? 'var(--status-healthy-bg)'
                        : 'rgba(245, 158, 11, 0.1)',
                    color:
                      scorecard.humanMfaAttainment >= 90
                        ? 'var(--status-healthy)'
                        : 'var(--status-degraded)',
                    fontWeight: 700,
                  }}
                >
                  HUMAN USERS
                </span>
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  marginTop: '6px',
                  color: 'var(--text-primary)',
                }}
              >
                {scorecard.humanMfaAttainment.toFixed(1)}%
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Verified across AWS IAM & Azure Entra ID
              </div>
            </Card>

            <Card padding="16px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Least-Privilege Score</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    color: 'var(--brand)',
                    fontWeight: 700,
                  }}
                >
                  ENTITLEMENTS
                </span>
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  marginTop: '6px',
                  color: 'var(--status-healthy)',
                }}
              >
                {scorecard.leastPrivilegeAttainment.toFixed(1)}%
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Observed permissions vs grant analysis
              </div>
            </Card>

            <Card padding="16px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High-Risk Attack Paths</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--status-unhealthy)',
                    fontWeight: 700,
                  }}
                >
                  PIVOT HAZARDS
                </span>
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  marginTop: '6px',
                  color: 'var(--status-unhealthy)',
                }}
              >
                {scorecard.highRiskAccessPathsCount}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Lateral movement paths to critical assets
              </div>
            </Card>
          </div>

          {/* Zero-Trust Coverage & Estate Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <Card title="Zero-Trust Multi-Source Coverage" subtitle="Evidence completeness across connected clouds">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { name: 'IAM & Identities', level: scorecard.coverage.iam, freshness: scorecard.freshness.iam },
                  { name: 'Network & Exposure', level: scorecard.coverage.network, freshness: scorecard.freshness.network },
                  { name: 'Kubernetes RBAC & Pods', level: scorecard.coverage.kubernetes, freshness: scorecard.freshness.kubernetes },
                  { name: 'Audit & Activity Logs', level: scorecard.coverage.auditLogs, freshness: scorecard.freshness.auditLogs },
                ].map((cov) => (
                  <div key={cov.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-primary)' }}>{cov.name}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Freshness: {cov.freshness}</div>
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor:
                          cov.level === 'FULL'
                            ? 'var(--status-healthy-bg)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color:
                          cov.level === 'FULL'
                            ? 'var(--status-healthy)'
                            : 'var(--status-degraded)',
                      }}
                    >
                      {cov.level}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Estate Risk Summary & Active Findings" subtitle="Directly observed risk telemetry">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Public Exposure Points</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--status-degraded)' }}>
                      {scorecard.publicExposureCount}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cross-Account / Cross-Scope Trusts</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--brand)' }}>
                      {scorecard.crossScopeAccessCount}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Control Effectiveness Score</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--status-healthy)' }}>
                      {scorecard.controlEffectivenessScore.toFixed(1)} / 100
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Workload Auth Posture</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {scorecard.workloadAuthPosture}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--bg-elevated)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Zero-Trust Guarantee:
                  </div>
                  Zero synthetic risk scores. All metrics reflect normalized multi-cloud provider IAM, network routing, and audit logs.
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Attack Path Alerts */}
          {accessPaths.length > 0 && (
            <Card title="Critical Unresolved Attack Paths" subtitle="Multi-hop privilege escalation & public lateral movement">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {accessPaths.slice(0, 3).map((path) => (
                  <div
                    key={path.id}
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {path.title}
                      </div>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor:
                            path.riskLevel === 'CRITICAL'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                          color:
                            path.riskLevel === 'CRITICAL'
                              ? 'var(--status-unhealthy)'
                              : 'var(--status-degraded)',
                          fontSize: '10.5px',
                          fontWeight: 700,
                        }}
                      >
                        {path.pathType} · {path.riskLevel}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '6px 0' }}>
                      {path.potentialImpact}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>
                      Path: {path.steps.map((s) => s.displayName).join(' ➔ ')}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 2: UNIFIED IDENTITIES & EFFECTIVE ACCESS
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'identities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="Normalized Multi-Cloud Identity Directory" subtitle="Unified inventory across AWS IAM, Azure Entra ID, GCP Service Accounts, and Kubernetes RBAC">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by identity display name, ARN, ID, or type..."
                value={identitySearch}
                onChange={(e) => setIdentitySearch(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  flex: 1,
                  minWidth: '220px',
                }}
              />
              <select
                value={identityProviderFilter}
                onChange={(e) => setIdentityProviderFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              >
                <option value="all">All Providers</option>
                <option value="AWS">AWS</option>
                <option value="AZURE">Azure</option>
                <option value="GCP">GCP</option>
                <option value="KUBERNETES">Kubernetes</option>
              </select>
              <select
                value={identityPrivilegeFilter}
                onChange={(e) => setIdentityPrivilegeFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              >
                <option value="all">All Privilege Levels</option>
                <option value="ADMIN">ADMIN</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="DEVELOPER">DEVELOPER</option>
                <option value="AUDITOR">AUDITOR</option>
                <option value="LIMITED">LIMITED</option>
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: '11px' }}>
                    <th style={{ padding: '8px' }}>Provider</th>
                    <th style={{ padding: '8px' }}>Identity Name / ID</th>
                    <th style={{ padding: '8px' }}>Type</th>
                    <th style={{ padding: '8px' }}>Privilege</th>
                    <th style={{ padding: '8px' }}>MFA</th>
                    <th style={{ padding: '8px' }}>Hygiene Status</th>
                    <th style={{ padding: '8px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIdentities.map((id) => (
                    <tr key={id.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            backgroundColor:
                              id.provider === 'AWS'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : id.provider === 'AZURE'
                                ? 'rgba(56, 189, 248, 0.15)'
                                : id.provider === 'GCP'
                                ? 'rgba(34, 197, 94, 0.15)'
                                : 'rgba(168, 85, 247, 0.15)',
                            color:
                              id.provider === 'AWS'
                                ? '#f59e0b'
                                : id.provider === 'AZURE'
                                ? '#38bdf8'
                                : id.provider === 'GCP'
                                ? '#22c55e'
                                : '#a855f7',
                          }}
                        >
                          {id.provider}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{id.displayName}</div>
                        <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {id.id}
                        </div>
                      </td>
                      <td style={{ padding: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {id.type.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor:
                              id.privilegeLevel === 'ADMIN'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : id.privilegeLevel === 'OPERATOR'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'var(--bg-elevated)',
                            color:
                              id.privilegeLevel === 'ADMIN'
                                ? 'var(--status-unhealthy)'
                                : id.privilegeLevel === 'OPERATOR'
                                ? 'var(--status-degraded)'
                                : 'var(--text-muted)',
                          }}
                        >
                          {id.privilegeLevel}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color:
                              id.mfaStatus === 'ENABLED'
                                ? 'var(--status-healthy)'
                                : id.mfaStatus === 'DISABLED'
                                ? 'var(--status-unhealthy)'
                                : 'var(--text-muted)',
                          }}
                        >
                          {id.mfaStatus === 'ENABLED'
                            ? '✓ Enabled'
                            : id.mfaStatus === 'DISABLED'
                            ? '✗ Disabled'
                            : id.mfaStatus}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        {id.credentialHygiene.isStale ? (
                          <span style={{ color: 'var(--status-degraded)', fontWeight: 600, fontSize: '11px' }}>
                            ⚠ Stale ({id.credentialHygiene.accessKeyAgeDays ?? 90}d old)
                          </span>
                        ) : id.credentialHygiene.hasAdminWildcard ? (
                          <span style={{ color: 'var(--status-unhealthy)', fontWeight: 600, fontSize: '11px' }}>
                            ⚠ Wildcard *:*
                          </span>
                        ) : (
                          <span style={{ color: 'var(--status-healthy)', fontSize: '11px' }}>Active</span>
                        )}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleSelectIdentity(id)}
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
                          <button
                            type="button"
                            onClick={() => {
                              setReviewIdentityId(id.id);
                              setShowReviewModal(true);
                            }}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '3px',
                              backgroundColor: 'transparent',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-default)',
                              fontSize: '10.5px',
                              cursor: 'pointer',
                            }}
                          >
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Selected Identity Drawer / Detail Modal */}
          {selectedIdentity && (
            <Card
              title={`Effective Access & Permission Graph: ${selectedIdentity.displayName}`}
              subtitle={`Normalized identity details for ${selectedIdentity.id}`}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assigned Roles / Policies</div>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginTop: '4px' }}>
                      {selectedIdentity.roles.join(', ') || 'Direct / None'}
                    </div>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Credential Age</div>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginTop: '4px' }}>
                      {selectedIdentity.credentialHygiene.accessKeyAgeDays ? `${selectedIdentity.credentialHygiene.accessKeyAgeDays} days` : 'N/A'}
                    </div>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last Activity</div>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginTop: '4px' }}>
                      {selectedIdentity.credentialHygiene.lastActivityTimestamp
                        ? new Date(selectedIdentity.credentialHygiene.lastActivityTimestamp).toLocaleDateString()
                        : 'Never / Stale'}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
                  Calculated Effective Access Rules ({identityEffectiveAccess.length})
                </div>

                {identityEffectiveAccess.length === 0 ? (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    No wildcard or sensitive permissions mapped for this identity.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {identityEffectiveAccess.map((rule, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px',
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {rule.permission} on <code>{rule.resourceId}</code>
                          </div>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor:
                                rule.riskScore >= 70
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : 'rgba(245, 158, 11, 0.2)',
                              color:
                                rule.riskScore >= 70
                                  ? 'var(--status-unhealthy)'
                                  : 'var(--status-degraded)',
                            }}
                          >
                            Risk: {rule.riskScore}/100 · {rule.accessMode}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Granted via: {rule.viaPolicy} · Mode: {rule.accessMode}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedIdentity(null)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Close Drawer
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 3: HIGH-RISK ACCESS PATHS & ATTACK GRAPH
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'paths' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card
            title="High-Risk Attack Paths & Privilege Escalation Chains"
            subtitle="Calculated multi-hop lateral movement chains from entry points to sensitive cloud assets"
          >
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <select
                value={pathRiskFilter}
                onChange={(e) => setPathRiskFilter(e.target.value)}
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
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredPaths.map((path) => (
                <div
                  key={path.id}
                  style={{
                    padding: '14px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {path.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        ID: {path.id} · Type: {path.pathType}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor:
                          path.riskLevel === 'CRITICAL'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(245, 158, 11, 0.2)',
                        color:
                          path.riskLevel === 'CRITICAL'
                            ? 'var(--status-unhealthy)'
                            : 'var(--status-degraded)',
                      }}
                    >
                      {path.riskLevel}
                    </span>
                  </div>

                  <p style={{ margin: '8px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {path.potentialImpact}
                  </p>

                  {/* Pivot Chain Steps */}
                  <div
                    style={{
                      margin: '10px 0',
                      padding: '10px',
                      backgroundColor: 'var(--bg-elevated)',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                      PIVOT CHAIN NODES & EVIDENCE:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {path.steps.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--brand)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 700,
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{step.displayName}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>({step.nodeType})</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--status-degraded)' }}>
                            ➔ {step.evidence}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: '11.5px', color: 'var(--status-healthy)', fontWeight: 600, marginTop: '8px' }}>
                    ✓ Remediation Guidance: {path.mitigationRecommendation}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setExceptionTitle(`Exception for ${path.title}`);
                        setExceptionIdentityId(path.id);
                        setShowExceptionModal(true);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Request Exception
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 4: PUBLIC EXPOSURE INTELLIGENCE
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'exposure' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card
            title="Multi-Cloud Public Exposure Inventory"
            subtitle="Continuously detected public IP allocations, open security groups, and internet-facing load balancers"
          >
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <select
                value={exposureProviderFilter}
                onChange={(e) => setExposureProviderFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              >
                <option value="all">All Providers</option>
                <option value="AWS">AWS</option>
                <option value="AZURE">Azure</option>
                <option value="GCP">GCP</option>
                <option value="KUBERNETES">Kubernetes</option>
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: '11px' }}>
                    <th style={{ padding: '8px' }}>Provider</th>
                    <th style={{ padding: '8px' }}>Resource Name / ID</th>
                    <th style={{ padding: '8px' }}>Exposure Vector</th>
                    <th style={{ padding: '8px' }}>Open Ports</th>
                    <th style={{ padding: '8px' }}>Risk Level</th>
                    <th style={{ padding: '8px' }}>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExposures.map((exp) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            backgroundColor:
                              exp.provider === 'AWS'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : exp.provider === 'AZURE'
                                ? 'rgba(56, 189, 248, 0.15)'
                                : 'rgba(168, 85, 247, 0.15)',
                            color:
                              exp.provider === 'AWS'
                                ? '#f59e0b'
                                : exp.provider === 'AZURE'
                                ? '#38bdf8'
                                : '#a855f7',
                          }}
                        >
                          {exp.provider}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{exp.resourceName}</div>
                        <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {exp.resourceId}
                        </div>
                      </td>
                      <td style={{ padding: '8px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {exp.exposureVector.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                        {exp.openPorts.length > 0 ? exp.openPorts.join(', ') : 'All / Direct IP'}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor:
                              exp.riskLevel === 'CRITICAL'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : exp.riskLevel === 'HIGH'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'var(--bg-elevated)',
                            color:
                              exp.riskLevel === 'CRITICAL'
                                ? 'var(--status-unhealthy)'
                                : exp.riskLevel === 'HIGH'
                                ? 'var(--status-degraded)'
                                : 'var(--text-muted)',
                          }}
                        >
                          {exp.riskLevel}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {exp.evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 5: CONTROL EFFECTIVENESS
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'controls' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card
            title="Measurable Zero-Trust Control Posture & Framework Alignment"
            subtitle="Observed compliance, violation recurrence, and remediation performance across NIST, CIS, and SOC 2"
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: '11px' }}>
                    <th style={{ padding: '8px' }}>Framework & ID</th>
                    <th style={{ padding: '8px' }}>Control Name</th>
                    <th style={{ padding: '8px' }}>Status</th>
                    <th style={{ padding: '8px' }}>Violations</th>
                    <th style={{ padding: '8px' }}>Remediation Success</th>
                    <th style={{ padding: '8px' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {controlEffectiveness.map((ctrl) => (
                    <tr key={ctrl.controlId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--brand)', fontWeight: 700 }}>
                        {ctrl.framework} [{ctrl.controlId}]
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ctrl.controlName}</div>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor:
                              ctrl.effectivenessStatus === 'EFFECTIVE'
                                ? 'var(--status-healthy-bg)'
                                : ctrl.effectivenessStatus === 'PARTIALLY_EFFECTIVE'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            color:
                              ctrl.effectivenessStatus === 'EFFECTIVE'
                                ? 'var(--status-healthy)'
                                : ctrl.effectivenessStatus === 'PARTIALLY_EFFECTIVE'
                                ? 'var(--status-degraded)'
                                : 'var(--status-unhealthy)',
                          }}
                        >
                          {ctrl.effectivenessStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: ctrl.violationsCount > 0 ? 'var(--status-unhealthy)' : 'var(--text-muted)' }}>
                        {ctrl.violationsCount} (Recurred: {ctrl.recurrenceCount})
                      </td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: 'var(--status-healthy)' }}>
                        {ctrl.remediationSuccessRate.toFixed(1)}%
                      </td>
                      <td style={{ padding: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {ctrl.trend}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 6: ACCESS REVIEWS & EXCEPTIONS
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'governance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Governed Access Reviews & Exception Registry
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--brand)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Conduct Access Review
              </button>
              <button
                type="button"
                onClick={() => setShowExceptionModal(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                + Register Exception
              </button>
            </div>
          </div>

          <Card title="Active Security Access Reviews" subtitle="Periodic IAM entitlement certifications and privilege adjustments">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: '11px' }}>
                    <th style={{ padding: '8px' }}>Review Title</th>
                    <th style={{ padding: '8px' }}>Scope</th>
                    <th style={{ padding: '8px' }}>Reviewer</th>
                    <th style={{ padding: '8px' }}>Status</th>
                    <th style={{ padding: '8px' }}>Due Date</th>
                    <th style={{ padding: '8px' }}>Decisions Made</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((rev) => (
                    <tr key={rev.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {rev.title}
                      </td>
                      <td style={{ padding: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>{rev.scope}</td>
                      <td style={{ padding: '8px' }}>{rev.reviewer.name}</td>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor:
                              rev.status === 'COMPLETED'
                                ? 'var(--status-healthy-bg)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color:
                              rev.status === 'COMPLETED'
                                ? 'var(--status-healthy)'
                                : 'var(--status-degraded)',
                          }}
                        >
                          {rev.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '11px' }}>{new Date(rev.dueAt).toLocaleDateString()}</td>
                      <td style={{ padding: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {rev.decisions.length > 0
                          ? rev.decisions.map((d) => `${d.identityId}: ${d.action}`).join('; ')
                          : `${rev.identitiesUnderReview.length} pending`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Active Security Exceptions Registry" subtitle="Formal risk acceptance with mandatory compensating controls and expiration dates">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: '11px' }}>
                    <th style={{ padding: '8px' }}>Policy / Finding</th>
                    <th style={{ padding: '8px' }}>Target Identity / Resource</th>
                    <th style={{ padding: '8px' }}>Compensating Controls</th>
                    <th style={{ padding: '8px' }}>Risk Accepted By</th>
                    <th style={{ padding: '8px' }}>Expires</th>
                    <th style={{ padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map((exc) => (
                    <tr key={exc.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>{exc.findingOrPolicyId}</td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {exc.identityOrResourceId}
                      </td>
                      <td style={{ padding: '8px', fontSize: '11px', color: 'var(--status-healthy)' }}>
                        {exc.compensatingControls.join(' · ')}
                      </td>
                      <td style={{ padding: '8px' }}>{exc.approvedBy}</td>
                      <td style={{ padding: '8px', fontSize: '11px' }}>{new Date(exc.expiresAt).toLocaleDateString()}</td>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: 'var(--status-degraded)',
                          }}
                        >
                          {exc.status}
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

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 7: SIMULATOR & AI ANALYST
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {/* What-If Security Simulator */}
            <Card
              title="Security What-If & Blast-Radius Simulator"
              subtitle="Safely test the security and operational impacts of IAM and network modifications prior to applying changes"
            >
              <form onSubmit={handleRunSimulation} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Simulation Title</label>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      marginTop: '4px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Change Action Type</label>
                  <select
                    value={simChangeType}
                    onChange={(e) => setSimChangeType(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      marginTop: '4px',
                    }}
                  >
                    <option value="REVOKE_ROLE">REVOKE_ROLE (Remove AdministratorAccess)</option>
                    <option value="REMOVE_SG_RULE">REMOVE_SG_RULE (Close port 22/3389)</option>
                    <option value="ENFORCE_MFA">ENFORCE_MFA (Strict Auth Policy)</option>
                    <option value="RESTRICT_ASSUME_ROLE">RESTRICT_ASSUME_ROLE (Limit Cross-Account Trust)</option>
                    <option value="ROTATE_KEY">ROTATE_KEY (Rotate Stale Access Key)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Identity ARN or Resource ID</label>
                  <input
                    type="text"
                    value={simTargetIdentity}
                    onChange={(e) => setSimTargetIdentity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      marginTop: '4px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Policy or Rule to Modify</label>
                  <input
                    type="text"
                    value={simRule}
                    onChange={(e) => setSimRule(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      marginTop: '4px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={simulating}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--brand)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '4px',
                  }}
                >
                  {simulating ? 'Running Zero-Trust Simulation...' : 'Run Safety Simulation'}
                </button>
              </form>

              {simResult && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Simulation Outcome:
                    </span>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        backgroundColor:
                          simResult.riskDelta < 0
                            ? 'var(--status-healthy-bg)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color:
                          simResult.riskDelta < 0
                            ? 'var(--status-healthy)'
                            : 'var(--status-unhealthy)',
                      }}
                    >
                      Risk Reduction: {simResult.riskDelta} pts
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    <strong>Mitigated Paths:</strong> {simResult.mitigatedPaths?.length ?? 1} paths broken
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <strong>SLO Impact:</strong> {simResult.potentialBreakage?.sloImpact ?? 'NONE (Safe)'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <strong>Workload Disruptions:</strong> {simResult.potentialBreakage?.affectedWorkloads?.length ?? 0} workloads
                  </div>
                </div>
              )}
            </Card>

            {/* Grounded AI Security Analyst */}
            <Card
              title="Grounded AI Security & Identity Analyst"
              subtitle="Investigate security findings, calculate least privilege paths, and audit evidence with prompt-injection defense"
            >
              <form onSubmit={handleAskAnalyst} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea
                  rows={4}
                  placeholder="Ask a question about multi-cloud identity posture, high-risk attack paths, or least privilege recommendations..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    resize: 'vertical',
                  }}
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--brand)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {aiLoading ? 'Querying Security Analyst...' : 'Ask Security Analyst'}
                </button>
              </form>

              {aiResult && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      EXECUTIVE SUMMARY & ANALYSIS:
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: 'var(--text-primary)' }}>
                      {aiResult.primaryAnswer}
                    </p>
                  </div>

                  {aiResult.suggestedFollowUps && aiResult.suggestedFollowUps.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-healthy)' }}>
                        SUGGESTED FOLLOW-UPS:
                      </div>
                      <ul style={{ margin: '4px 0', paddingLeft: '18px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {aiResult.suggestedFollowUps.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiResult.evidenceCitations && aiResult.evidenceCitations.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        AUDIT EVIDENCE CITATIONS:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        {aiResult.evidenceCitations.map((cite, i) => (
                          <div key={i} style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>
                            [{cite.type}] {cite.id}: {cite.title} {cite.snippet ? `(${cite.snippet})` : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
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
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '550px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
              Conduct Access Certification Review
            </h3>
            <form onSubmit={handleCreateReview} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Identity ID / ARN</label>
                <input
                  type="text"
                  value={reviewIdentityId}
                  onChange={(e) => setReviewIdentityId(e.target.value)}
                  placeholder="e.g. arn:aws:iam::123456789012:user/admin-lead"
                  required
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    marginTop: '4px',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Decision</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    marginTop: '4px',
                  }}
                >
                  <option value="CERTIFIED">CERTIFIED (Approve Current Access)</option>
                  <option value="REVOKED">REVOKED (Remove All Elevated Access)</option>
                  <option value="MODIFIED_PRIVILEGES">MODIFIED_PRIVILEGES (Restrict to Least Privilege)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Audit Notes</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Justification, business context, or changes required..."
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--brand)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Submit Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exception Modal */}
      {showExceptionModal && (
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
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '550px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
              Register Security Risk Exception
            </h3>
            <form onSubmit={handleCreateException} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Exception Title</label>
                <input
                  type="text"
                  value={exceptionTitle}
                  onChange={(e) => setExceptionTitle(e.target.value)}
                  placeholder="e.g. Temporary SSH access during migration"
                  required
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Identity ID or Resource</label>
                <input
                  type="text"
                  value={exceptionIdentityId}
                  onChange={(e) => setExceptionIdentityId(e.target.value)}
                  placeholder="Identity or Resource ARN/ID"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    marginTop: '4px',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Business Justification</label>
                <textarea
                  rows={2}
                  value={exceptionJustification}
                  onChange={(e) => setExceptionJustification(e.target.value)}
                  placeholder="Why cannot this be remediated immediately?"
                  required
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Compensating Controls (comma-separated)</label>
                <input
                  type="text"
                  value={exceptionControls}
                  onChange={(e) => setExceptionControls(e.target.value)}
                  placeholder="e.g. IP allowlist, Enhanced GuardDuty monitoring, Daily key rotation"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Risk Accepted By</label>
                  <input
                    type="text"
                    value={exceptionApprover}
                    onChange={(e) => setExceptionApprover(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      marginTop: '4px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expiry (Days)</label>
                  <input
                    type="number"
                    value={exceptionDays}
                    onChange={(e) => setExceptionDays(Number(e.target.value))}
                    min={1}
                    max={365}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      marginTop: '4px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowExceptionModal(false)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--brand)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Grant Exception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityPage;

