import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/States';
import { enterpriseWorkflowApi } from '../api/client';
import type {
  CloudChangeRequest,
  MaintenanceWindow,
  ChangeFreeze
} from '@cloudpulse/shared';

export function ChangeManagementPage() {
  const [changes, setChanges] = useState<CloudChangeRequest[]>([]);
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [freezes, setFreezes] = useState<ChangeFreeze[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'CALENDAR' | 'FREEZES'>('PIPELINE');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for new change request
  const [newTitle, setNewTitle] = useState('');
  const [newRationale, setNewRationale] = useState('');
  const [newRisk, setNewRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [newAction, setNewAction] = useState('scale_workload');
  const [createLoading, setCreateLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chgs, wins, frzs] = await Promise.all([
        enterpriseWorkflowApi.getChangeRequests(),
        enterpriseWorkflowApi.getMaintenanceWindows(),
        enterpriseWorkflowApi.getChangeFreezes(),
      ]);
      setChanges(chgs);
      setWindows(wins);
      setFreezes(frzs);
    } catch (err) {
      console.error('Failed to load change management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      await enterpriseWorkflowApi.createChangeRequest({
        title: newTitle,
        rationale: newRationale,
        provider: 'KUBERNETES',
        targetResources: [
          { resourceId: 'payment-service', provider: 'KUBERNETES', name: 'payment-service', type: 'Deployment' }
        ],
        proposedChange: {
          action: newAction,
          payload: { replicas: 12 },
          summary: `Governed action: ${newAction} on payment-service`
        },
        risk: newRisk,
        executionPlan: {
          steps: [
            { order: 1, action: newAction, description: 'Execute verified patch', status: 'PENDING' }
          ]
        },
        rollbackPlan: {
          steps: ['Rollback to prior stable revision'],
          automated: true
        },
        verificationPlan: {
          criteria: ['Health 200 OK', 'Error rate < 0.1%'],
          freshReadQueries: ['container_cpu_usage']
        }
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewRationale('');
      loadData();
    } catch (err) {
      console.error('Failed to create change request:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Governed Change Management & Release Calendar"
        subtitle="Multi-cloud change requests, impact simulation, two-person control, maintenance windows, and freeze protection."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: '#4f46e5',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              + New Change Request
            </button>
            <button
              onClick={loadData}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        }
      />

      {/* Active Change Freeze / Maintenance Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase' }}>
            🕒 Scheduled Maintenance Windows
          </div>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {windows.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active maintenance windows configured.</div>
            ) : (
              windows.map((w) => (
                <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-canvas)', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{w.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{w.startTime} - {w.endTime} {w.timezone} (Recurring Weekly)</div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                    ACTIVE
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 700, textTransform: 'uppercase' }}>
            🛡️ Enterprise Change Freezes
          </div>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {freezes.filter((f) => f.active).length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active change freezes currently enforcing lockouts.</div>
            ) : (
              freezes.filter((f) => f.active).map((f) => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'rgba(244, 63, 94, 0.1)', borderRadius: '6px', border: '1px solid rgba(244, 63, 94, 0.3)', fontSize: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fca5a5' }}>{f.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.reason}</div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e11d48', color: '#fff' }}>
                    ENFORCING
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', padding: '4px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
        {[
          { id: 'PIPELINE', label: 'Change Pipeline & Review Packs' },
          { id: 'CALENDAR', label: 'Maintenance Calendar' },
          { id: 'FREEZES', label: 'Freeze Policies & Windows' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: activeTab === tab.id ? '#4f46e5' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Pipeline */}
      {activeTab === 'PIPELINE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {loading ? (
            <LoadingState message="Loading governed changes from enterprise ledger..." />
          ) : changes.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              No change requests in pipeline. Click "New Change Request" to initiate governed change flow.
            </div>
          ) : (
            changes.map((chg) => (
              <div
                key={chg.id}
                style={{
                  padding: '18px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--brand)', fontWeight: 700 }}>#{chg.id}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• Provider: {chg.provider}</span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: chg.risk === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: chg.risk === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.4)'
                      }}>
                        {chg.risk} RISK
                      </span>
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{chg.title}</h3>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    backgroundColor: chg.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: chg.status === 'APPROVED' ? '#10b981' : '#f59e0b'
                  }}>
                    {chg.status.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Rationale & Impact</div>
                  <div style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{chg.rationale}</div>
                </div>

                {/* Reviews Ribbon */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Pre-Flight Review Pack:</span>
                  {chg.reviews.map((rev, i) => (
                    <span key={i} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                      <strong>{rev.reviewType}:</strong> <span style={{ color: rev.status === 'PASS' ? '#10b981' : '#f59e0b' }}>{rev.status}</span>
                    </span>
                  ))}
                  {chg.simulationResult && (
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                      💥 Blast Radius: <strong>{chg.simulationResult.blastRadiusScore}/100</strong>
                    </span>
                  )}
                </div>

                {/* Footer Requester */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div>
                    Requested by <strong style={{ color: 'var(--text-primary)' }}>{chg.requester.name}</strong> ({chg.requester.email})
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)' }}>
                    Created: {new Date(chg.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Calendar */}
      {activeTab === 'CALENDAR' && (
        <div style={{ padding: '20px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              📅 Upcoming Change Windows & Deployments
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Timezone: UTC</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <div key={d} style={{ padding: '10px', backgroundColor: 'var(--bg-canvas)', borderRadius: '6px', border: '1px solid var(--border-subtle)', minHeight: '120px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>{d}</div>
                {i === 0 || i === 6 ? (
                  <div style={{ padding: '4px 6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', color: '#10b981', fontWeight: 600 }}>
                    🟢 Maintenance (02:00 - 06:00)
                  </div>
                ) : null}
                {i === 4 ? (
                  <div style={{ padding: '4px 6px', backgroundColor: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', color: '#818cf8', fontWeight: 600 }}>
                    🚀 HPA Scale Up #chg-001
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Freezes & Windows */}
      {activeTab === 'FREEZES' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#06b6d4' }}>
              🕒 Recurring Maintenance Windows
            </h3>
            {windows.map((w) => (
              <div key={w.id} style={{ padding: '10px', backgroundColor: 'var(--bg-canvas)', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{w.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Window: {w.startTime} to {w.endTime} ({w.timezone})</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Allowed: {w.allowedActions.join(', ')}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#f43f5e' }}>
              🔒 Change Freezes
            </h3>
            {freezes.map((f) => (
              <div key={f.id} style={{ padding: '10px', backgroundColor: 'var(--bg-canvas)', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{f.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Reason: {f.reason}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Scope: {f.scope.level} ({f.scope.targetIds.join(', ')})</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: New Change Request */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', maxWidth: '500px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Submit Governed Change Request</h3>
            <form onSubmit={handleCreateChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>Change Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Scale payment-service HPA to 16 replicas"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>Business & Technical Rationale</label>
                <textarea
                  required
                  rows={3}
                  value={newRationale}
                  onChange={(e) => setNewRationale(e.target.value)}
                  placeholder="Explain why this change is necessary and intended impact..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>Risk Level</label>
                  <select
                    value={newRisk}
                    onChange={(e) => setNewRisk(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="LOW">LOW (Pre-approved)</option>
                    <option value="MEDIUM">MEDIUM (Peer Review)</option>
                    <option value="HIGH">HIGH (Two-Person Approval)</option>
                    <option value="CRITICAL">CRITICAL (Dual Lead Approval)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>Allowlisted Action</label>
                  <select
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="scale_workload">scale_workload</option>
                    <option value="restart_workload">restart_workload</option>
                    <option value="rollback_workload">rollback_workload</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#c7d2fe', fontSize: '11px' }}>
                ℹ️ All submitted changes automatically generate a multi-pillar review pack (Security, Governance, FinOps, Simulation) before gated execution.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  {createLoading ? 'Submitting...' : 'Submit Change Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default ChangeManagementPage;
