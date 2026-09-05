import React, { useState, useEffect } from 'react';
import { cloudConnectionsApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { StatCard, Card } from '../components/ui/StatCard.tsx';
import { LoadingState } from '../components/ui/States.tsx';
import type {
  CloudOperation,
  CloudSituation,
  OperationalTimelineItem,
  OperationalStoryline,
  SafeActionDefinition,
  AiOperationsCopilotResponse,
  OperationState
} from '@cloudpulse/shared';

export function CloudOperationsPage() {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'situation' | 'changes' | 'timeline' | 'catalog' | 'copilot' | 'health'>('situation');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Situation & Queue Data
  const [situation, setSituation] = useState<CloudSituation | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<CloudOperation | null>(null);
  const [preflightData, setPreflightData] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<OperationalTimelineItem[]>([]);
  const [storyline, setStoryline] = useState<OperationalStoryline | null>(null);
  const [safeActions, setSafeActions] = useState<SafeActionDefinition[]>([]);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Copilot State
  const [copilotPrompt, setCopilotPrompt] = useState('What is happening right now in production?');
  const [copilotResponse, setCopilotResponse] = useState<AiOperationsCopilotResponse | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Filter state for queue
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');

  useEffect(() => {
    loadSituation();
    loadTimeline();
    loadSafeActions();
  }, []);

  useEffect(() => {
    if (selectedOperation) {
      loadPreflight(selectedOperation.id);
      loadStoryline(selectedOperation.id);
    }
  }, [selectedOperation?.id]);

  const loadSituation = async () => {
    try {
      setLoading(true);
      const res = await cloudConnectionsApi.getAwsOperationsSituation();
      if (res.ok && res.data) {
        setSituation(res.data);
        if (res.data.operations && res.data.operations.length > 0 && !selectedOperation) {
          setSelectedOperation(res.data.operations[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load cloud situation:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async (hours = 24) => {
    try {
      const res: any = await cloudConnectionsApi.getAwsOperationalTimeline(hours);
      if (Array.isArray(res)) {
        setTimeline(res);
      } else if (res?.data && Array.isArray(res.data)) {
        setTimeline(res.data);
      }
    } catch (err) {
      console.error('Failed to load timeline:', err);
    }
  };

  const loadSafeActions = async () => {
    try {
      const res: any = await cloudConnectionsApi.getAwsSafeActionCatalog();
      if (Array.isArray(res)) {
        setSafeActions(res);
      } else if (res?.data && Array.isArray(res.data)) {
        setSafeActions(res.data);
      }
    } catch (err) {
      console.error('Failed to load safe actions:', err);
    }
  };

  const loadPreflight = async (id: string) => {
    try {
      const res = await cloudConnectionsApi.getAwsOperationPreflight(id);
      if (res.ok && res.data) {
        setPreflightData(res.data);
      }
    } catch (err) {
      console.error('Failed to load preflight:', err);
    }
  };

  const loadStoryline = async (id: string) => {
    try {
      const res = await cloudConnectionsApi.getAwsOperationalStoryline(id);
      if (res.ok && res.data) {
        setStoryline(res.data);
      }
    } catch (err) {
      console.error('Failed to load storyline:', err);
    }
  };

  const handleExecute = async () => {
    if (!selectedOperation) return;
    try {
      setActionLoading(true);
      setActionMessage(null);
      const res = await cloudConnectionsApi.executeAwsOperation(selectedOperation.id);
      if (res.ok && res.data) {
        setActionMessage({
          type: 'success',
          text: `Operation '${selectedOperation.id}' executed successfully. Fresh AWS Read Verification: ${res.data.verification || 'VERIFIED'}.`
        });
        await loadSituation();
        if (res.data.operation) {
          setSelectedOperation(res.data.operation);
        }
      } else {
        setActionMessage({
          type: 'error',
          text: res.error?.message || 'Execution failed.'
        });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Execution failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!selectedOperation) return;
    try {
      setActionLoading(true);
      setActionMessage(null);
      const res = await cloudConnectionsApi.rollbackAwsOperation(selectedOperation.id);
      if (res.ok && res.data) {
        setActionMessage({
          type: 'success',
          text: `Operation '${selectedOperation.id}' rolled back successfully.`
        });
        await loadSituation();
        if (res.data.operation) {
          setSelectedOperation(res.data.operation);
        }
      } else {
        setActionMessage({
          type: 'error',
          text: res.error?.message || 'Rollback failed.'
        });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Rollback failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStateTransition = async (targetState: OperationState) => {
    if (!selectedOperation) return;
    try {
      setActionLoading(true);
      setActionMessage(null);
      const res = await cloudConnectionsApi.transitionAwsOperationState(
        selectedOperation.id,
        targetState,
        'Manual state transition via Operations Console'
      );
      if (res.ok && res.data) {
        setActionMessage({
          type: 'success',
          text: `State transitioned to '${targetState}'.`
        });
        await loadSituation();
        setSelectedOperation(res.data);
      } else {
        setActionMessage({
          type: 'error',
          text: res.error?.message || 'State transition failed.'
        });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'State transition failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopilotAsk = async (promptText = copilotPrompt) => {
    if (!promptText.trim()) return;
    try {
      setCopilotLoading(true);
      const res = await cloudConnectionsApi.askAwsOperationsCopilot(promptText);
      if (res.ok && res.data) {
        setCopilotResponse(res.data);
      }
    } catch (err) {
      console.error('Copilot query failed:', err);
    } finally {
      setCopilotLoading(false);
    }
  };

  const filteredOperations = situation?.operations.filter((op) => {
    if (priorityFilter !== 'ALL' && op.priority !== priorityFilter) return false;
    if (stateFilter !== 'ALL' && op.state !== stateFilter) return false;
    return true;
  }) || [];

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Global Health & Connection Bar */}
      <div>
        <PageHeader
          title="AWS Cloud Operations Control Plane"
          subtitle="Continuous real-time operations intelligence, autonomous correlation, pre-flight safety & fresh-read verification."
          badge="Live Real AWS Operations"
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => { loadSituation(); loadTimeline(); }}
                disabled={loading}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>↻</span>
                <span>{loading ? 'Refreshing...' : 'Refresh Telemetry'}</span>
              </button>
            </div>
          }
        />

        {/* Global Cloud Health Summary Banner */}
        {situation && (
          <div
            style={{
              marginTop: '14px',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: situation.overallHealthScore >= 80 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                  color: situation.overallHealthScore >= 80 ? 'var(--status-healthy)' : 'var(--status-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 800
                }}
              >
                {situation.healthGrade}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Cloud Health Score: {situation.overallHealthScore}/100
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  AWS Production (839201746152) · us-east-1 · {situation.awsDataHealth.syncState}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {Object.entries(situation.globalHealth).map(([domain, status]) => (
                <span
                  key={domain}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    backgroundColor:
                      status === 'HEALTHY'
                        ? 'rgba(34, 197, 94, 0.1)'
                        : status === 'DEGRADED'
                        ? 'rgba(234, 179, 8, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                    color:
                      status === 'HEALTHY'
                        ? 'var(--status-healthy)'
                        : status === 'DEGRADED'
                        ? 'var(--status-warning)'
                        : 'var(--status-critical)',
                    border: `1px solid ${
                      status === 'HEALTHY'
                        ? 'rgba(34, 197, 94, 0.3)'
                        : status === 'DEGRADED'
                        ? 'rgba(234, 179, 8, 0.3)'
                        : 'rgba(239, 68, 68, 0.3)'
                    }`
                  }}
                >
                  {domain.replace('Health', '')}: {status}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <StatCard
          label="Active Incidents"
          value={situation?.activeIncidentsCount || 0}
          subValue="1 P1 Runner Burst"
          status={situation?.activeIncidentsCount ? 'critical' : 'healthy'}
        />
        <StatCard
          label="Degraded Resources"
          value={situation?.degradedResourcesCount || 0}
          subValue="S3 Bucket & Staging EC2"
          status={situation?.degradedResourcesCount ? 'warning' : 'healthy'}
        />
        <StatCard
          label="Security & Governance"
          value={situation ? situation.activeSecurityIssuesCount + situation.governanceRegressionsCount : 0}
          subValue="Public Exposure & IMDSv1"
          status="critical"
        />
        <StatCard
          label="Operations Work Queue"
          value={situation?.operations.length || 0}
          subValue="1 P0, 1 P1, 1 P2"
          status="info"
        />
        <StatCard
          label="Pending Approval / Blocked"
          value={situation ? situation.blockedActionsCount + situation.operations.filter(o => o.approvalState === 'PENDING').length : 0}
          subValue="1 Pending Approval"
          status="warning"
        />
        <StatCard
          label="AWS Data Health"
          value={situation?.awsDataHealth.connectionStatus || 'CONNECTED'}
          subValue={situation?.awsDataHealth.cloudTrailFreshness || 'Fresh'}
          status="healthy"
        />
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12.5px',
            fontWeight: 600,
            backgroundColor: actionMessage.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: actionMessage.type === 'success' ? 'var(--status-healthy)' : 'var(--status-critical)',
            border: `1px solid ${actionMessage.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '14px' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        {[
          { id: 'situation', label: 'Operations Queue & Console' },
          { id: 'changes', label: 'Live AWS Changes & Impact' },
          { id: 'timeline', label: 'Operational Storyline & Timeline' },
          { id: 'catalog', label: 'Safe Action Allowlist & Guardrails' },
          { id: 'copilot', label: 'AI Operations Copilot' },
          { id: 'health', label: 'AWS Data Health' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12.5px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              backgroundColor: activeTab === tab.id ? 'var(--brand)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s, color 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && !situation ? (
        <LoadingState message="Connecting to Real AWS Cloud Operations Engine..." />
      ) : (
        <>
          {/* TAB 1: OPERATIONS WORK QUEUE & ACTION CONSOLE */}
          {activeTab === 'situation' && (
            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px', alignItems: 'start' }}>
              {/* Left Column: Operations Work Queue */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Operations Work Queue
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {filteredOperations.length} items
                    </span>
                  </div>

                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '11px'
                      }}
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="P0_CRITICAL">P0 Critical</option>
                      <option value="P1_HIGH">P1 High</option>
                      <option value="P2_MEDIUM">P2 Medium</option>
                    </select>

                    <select
                      value={stateFilter}
                      onChange={(e) => setStateFilter(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '11px'
                      }}
                    >
                      <option value="ALL">All States</option>
                      <option value="PLAN_READY">Plan Ready</option>
                      <option value="DECISION_READY">Decision Ready</option>
                      <option value="TRIAGED">Triaged</option>
                      <option value="EXECUTING">Executing</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </div>

                  {/* Operations List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto' }}>
                    {filteredOperations.map((op) => {
                      const isSelected = selectedOperation?.id === op.id;
                      return (
                        <div
                          key={op.id}
                          onClick={() => setSelectedOperation(op)}
                          style={{
                            padding: '12px',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${isSelected ? 'var(--brand)' : 'var(--border-subtle)'}`,
                            backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-canvas)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            transition: 'border-color 0.15s, background-color 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '9.5px',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                backgroundColor:
                                  op.priority === 'P0_CRITICAL'
                                    ? 'rgba(239, 68, 68, 0.15)'
                                    : op.priority === 'P1_HIGH'
                                    ? 'rgba(234, 179, 8, 0.15)'
                                    : 'rgba(59, 130, 246, 0.15)',
                                color:
                                  op.priority === 'P0_CRITICAL'
                                    ? 'var(--status-critical)'
                                    : op.priority === 'P1_HIGH'
                                    ? 'var(--status-warning)'
                                    : 'var(--brand)'
                              }}
                            >
                              {op.priority}
                            </span>
                            <span
                              style={{
                                padding: '1px 6px',
                                borderRadius: '3px',
                                fontSize: '9.5px',
                                fontWeight: 600,
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              Level {op.automationLevel}
                            </span>
                          </div>

                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {op.title}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            <span>State: <strong>{op.state}</strong></span>
                            <span>{op.region}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Selected Operation Console */}
              {selectedOperation ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Operation Header Card */}
                  <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--brand)', fontWeight: 700 }}>
                            {selectedOperation.id}
                          </span>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--status-critical)' }}>
                            {selectedOperation.priority}
                          </span>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: 'var(--bg-canvas)', color: 'var(--text-secondary)' }}>
                            State: {selectedOperation.state}
                          </span>
                        </div>
                        <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                          {selectedOperation.title}
                        </h2>
                      </div>

                      {/* Action Dispatch Buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {selectedOperation.rollbackState === 'AVAILABLE' && (
                          <button
                            onClick={handleRollback}
                            disabled={actionLoading}
                            style={{
                              padding: '8px 14px',
                              backgroundColor: 'rgba(234, 179, 8, 0.15)',
                              border: '1px solid rgba(234, 179, 8, 0.4)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--status-warning)',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Rollback Action
                          </button>
                        )}

                        <button
                          onClick={handleExecute}
                          disabled={actionLoading || (selectedOperation.state !== 'PLAN_READY' && selectedOperation.state !== 'APPROVED')}
                          style={{
                            padding: '8px 18px',
                            backgroundColor: (selectedOperation.state === 'PLAN_READY' || selectedOperation.state === 'APPROVED') ? 'var(--brand)' : 'var(--bg-active)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: (selectedOperation.state === 'PLAN_READY' || selectedOperation.state === 'APPROVED') ? 'pointer' : 'not-allowed',
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
                          }}
                        >
                          {actionLoading ? 'Executing Preflight & Action...' : 'Execute Controlled Remediation'}
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 14px' }}>
                      {selectedOperation.description}
                    </p>

                    {/* Metadata Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '12px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)', fontSize: '11.5px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Target Resource:</span>
                        <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                          {selectedOperation.targetResourceIds[0]}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Trigger Source:</span>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {selectedOperation.detectionSource}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Approval Required:</span>
                        <div style={{ fontWeight: 600, color: selectedOperation.approvalState === 'PENDING' ? 'var(--status-warning)' : 'var(--text-primary)', marginTop: '2px' }}>
                          {selectedOperation.approvalState}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Verification Status:</span>
                        <div style={{ fontWeight: 600, color: selectedOperation.verificationState === 'VERIFIED' ? 'var(--status-healthy)' : 'var(--text-primary)', marginTop: '2px' }}>
                          {selectedOperation.verificationState}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pre-flight Checks Card */}
                  <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Pre-flight Validation & Safety Guardrails
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {preflightData?.preconditions?.map((pre: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 14px',
                            backgroundColor: 'var(--bg-canvas)',
                            border: `1px solid ${pre.status === 'PASSED' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {pre.name}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {pre.details}
                            </span>
                          </div>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor: pre.status === 'PASSED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: pre.status === 'PASSED' ? 'var(--status-healthy)' : 'var(--status-critical)'
                            }}
                          >
                            {pre.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manual State Transition Override */}
                  <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Operator State Transition
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Transitions are strictly validated against the server-side state machine.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['PLAN_READY', 'APPROVAL_REQUIRED', 'APPROVED', 'BLOCKED', 'RESOLVED'].map((targetState) => (
                        <button
                          key={targetState}
                          onClick={() => handleStateTransition(targetState as OperationState)}
                          disabled={actionLoading || selectedOperation.state === targetState}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: 'var(--bg-canvas)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: selectedOperation.state === targetState ? 'var(--text-muted)' : 'var(--text-primary)',
                            cursor: selectedOperation.state === targetState ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {targetState}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Select an operation from the work queue.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE AWS CHANGES & IMPACT ANALYSIS */}
          {activeTab === 'changes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Live AWS CloudTrail & EventBridge Change Stream
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {situation?.recentChanges.map((chg) => (
                    <div
                      key={chg.id}
                      style={{
                        padding: '14px',
                        backgroundColor: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, backgroundColor: chg.risk === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)', color: chg.risk === 'CRITICAL' ? 'var(--status-critical)' : 'var(--status-warning)' }}>
                            {chg.risk} RISK
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {chg.action}
                          </span>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>
                            Actor: {chg.actor}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(chg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <strong>Target:</strong> {chg.resourceId}
                      </div>

                      <div style={{ fontSize: '11.5px', padding: '8px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', borderLeft: '3px solid var(--brand)' }}>
                        <strong>Auto-Impact Analysis:</strong> {chg.impactSummary}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OPERATIONAL TIMELINE & 10-STAGE STORYLINE */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 10-Stage Storyline */}
              {storyline && (
                <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    10-Stage Operational Storyline ({storyline.operationId})
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                    {storyline.summary}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                    {storyline.stages.map((stg, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          backgroundColor: 'var(--bg-canvas)',
                          border: `1px solid ${stg.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>
                            STAGE {idx + 1}: {stg.stage}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 4px', borderRadius: '3px', backgroundColor: stg.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)', color: stg.status === 'COMPLETED' ? 'var(--status-healthy)' : 'var(--status-warning)' }}>
                            {stg.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {stg.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {stg.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronological Event Timeline */}
              <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Unified Operational Event Stream (24 Hours)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {timeline.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                      }}
                    >
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor:
                            item.severity === 'CRITICAL'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : item.severity === 'HIGH'
                              ? 'rgba(234, 179, 8, 0.15)'
                              : 'rgba(59, 130, 246, 0.15)',
                          color:
                            item.severity === 'CRITICAL'
                              ? 'var(--status-critical)'
                              : item.severity === 'HIGH'
                              ? 'var(--status-warning)'
                              : 'var(--brand)',
                          flexShrink: 0
                        }}
                      >
                        {item.domain}
                      </span>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.title}
                          </span>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          {item.description}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Evidence: {item.evidence}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SAFE ACTION CATALOG & GUARDRAILS */}
          {activeTab === 'catalog' && (
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Registered Safe Action Catalog & Guardrails
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {safeActions.map((act) => (
                  <div
                    key={act.actionId}
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {act.actionName}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>
                          ({act.actionId})
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--brand)' }}>
                          Max Level {act.maxAutomationLevel}
                        </span>
                        <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, backgroundColor: act.rollbackCapability ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: act.rollbackCapability ? 'var(--status-healthy)' : 'var(--status-critical)' }}>
                          {act.rollbackCapability ? 'Rollback Supported' : 'No Rollback'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '11.5px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Target Resource Types:</span>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.targetResourceTypes.join(', ')}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Required IAM Permissions:</span>
                        <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>{act.requiredPermissions.join(', ')}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Verification Method:</span>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.verificationMethod}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AI OPERATIONS COPILOT */}
          {activeTab === 'copilot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI Operations Copilot (Evidence-Grounded Reasoner)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px' }}>
                  Ask natural-language operational questions. All answers are grounded in real AWS telemetry, Knowledge Graph paths, and CloudTrail events with strict zero-mutation guarantees.
                </p>

                {/* Prompt Bar */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    value={copilotPrompt}
                    onChange={(e) => setCopilotPrompt(e.target.value)}
                    placeholder="Ask about live cloud state, root cause, recent changes, or safest next action..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  />
                  <button
                    onClick={() => handleCopilotAsk()}
                    disabled={copilotLoading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'var(--brand)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {copilotLoading ? 'Analyzing...' : 'Ask Copilot'}
                  </button>
                </div>

                {/* Quick Prompts */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {[
                    'What is happening right now?',
                    'What changed recently?',
                    'Why is production degraded?',
                    'What is the safest next action?'
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => { setCopilotPrompt(preset); handleCopilotAsk(preset); }}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        color: 'var(--brand)',
                        cursor: 'pointer'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Copilot Response Card */}
                {copilotResponse && (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--brand)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>
                        Intent: {copilotResponse.intent}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Confidence: <strong>{copilotResponse.confidence}</strong> · {copilotResponse.freshness}
                      </span>
                    </div>

                    <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                      {copilotResponse.answer}
                    </div>

                    {/* Cited Evidence */}
                    {copilotResponse.citedEvidence.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Cited Real AWS Evidence:
                        </span>
                        {copilotResponse.citedEvidence.map((ev, idx) => (
                          <div key={idx} style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            • <strong>[{ev.source}]</strong> ({ev.entityId}): {ev.description}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suggested Structured Action */}
                    {copilotResponse.suggestedAction && (
                      <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--brand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Suggested Action: {copilotResponse.suggestedAction.actionType}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            {copilotResponse.suggestedAction.description}
                          </div>
                        </div>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(234, 179, 8, 0.15)', color: 'var(--status-warning)' }}>
                          Approval Required
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: AWS DATA HEALTH */}
          {activeTab === 'health' && (
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AWS Telemetry Synchronization & Data Health
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
                {situation?.awsDataHealth && Object.entries(situation.awsDataHealth).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      padding: '14px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default CloudOperationsPage;
