import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/States';
import { enterpriseWorkflowApi } from '../api/client';
import type {
  EnterpriseWorkflowSummary,
  CloudWorkItem,
  WorkItemComment,
  ActivityTimelineEvent,
  EnterpriseApprovalRequest,
  AiWorkflowAssistantResult
} from '@cloudpulse/shared';

export function WorkInboxPage() {
  const [summary, setSummary] = useState<EnterpriseWorkflowSummary | null>(null);
  const [workItems, setWorkItems] = useState<CloudWorkItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CloudWorkItem | null>(null);
  const [comments, setComments] = useState<WorkItemComment[]>([]);
  const [timeline, setTimeline] = useState<ActivityTimelineEvent[]>([]);
  const [activeSection, setActiveSection] = useState<string>('MY_WORK');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<AiWorkflowAssistantResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const filterPayload: { section?: string; priority?: string } = {};
      if (activeSection !== 'ALL') filterPayload.section = activeSection;
      if (selectedPriority !== 'ALL') filterPayload.priority = selectedPriority;

      const [sum, items] = await Promise.all([
        enterpriseWorkflowApi.getWorkflowSummary(),
        enterpriseWorkflowApi.getWorkflowWorkItems(filterPayload),
      ]);
      setSummary(sum);
      setWorkItems(items);
      if (items.length > 0 && !selectedItem) {
        selectWorkItem(items[0]!);
      }
    } catch (err) {
      console.error('Failed to load workflow items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSection, selectedPriority]);

  const selectWorkItem = async (item: CloudWorkItem) => {
    setSelectedItem(item);
    setApprovalError(null);
    setApprovalSuccess(null);
    try {
      const [cmts, tml] = await Promise.all([
        enterpriseWorkflowApi.getWorkItemComments(item.id),
        enterpriseWorkflowApi.getWorkItemTimeline(item.id),
      ]);
      setComments(cmts);
      setTimeline(tml);
    } catch (err) {
      console.error('Failed to load item details:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !newComment.trim()) return;
    try {
      setActionLoading(true);
      const cmt = await enterpriseWorkflowApi.addWorkItemComment(selectedItem.id, newComment.trim());
      setComments((prev) => [...prev, cmt]);
      setNewComment('');
      const tml = await enterpriseWorkflowApi.getWorkItemTimeline(selectedItem.id);
      setTimeline(tml);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecideApproval = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedItem) return;
    setApprovalError(null);
    setApprovalSuccess(null);
    try {
      setActionLoading(true);
      await enterpriseWorkflowApi.decideApproval('app-req-001', {
        decision,
        comment: `Enterprise decision submitted via Work Item #${selectedItem.id}`,
        approverUserId: 'usr-sre-lead',
        approverName: 'Elena Rostova',
        approverRole: 'SRE',
      });
      setApprovalSuccess(`Approval decision recorded: ${decision}. Policy compliance confirmed.`);
      loadData();
    } catch (err: any) {
      setApprovalError(err.message || 'Approval decision failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    try {
      setAiLoading(true);
      const res = await enterpriseWorkflowApi.investigateWorkflow(aiPrompt.trim());
      setAiResult(res);
    } catch (err) {
      console.error('Failed AI investigation:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredItems = workItems.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.assigneeUserName && item.assigneeUserName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Enterprise Work Items & Governed Collaboration"
        subtitle="Multi-user cloud operations coordination, role-based approvals, two-person control, and activity timelines."
        actions={
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
        }
      />

      {/* KPI Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Work Items</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{summary?.activeWorkItems.total ?? 0}</div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>3 Teams Active</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Waiting Approval</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>{summary?.pendingApprovalsCount ?? 0}</div>
          <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>Two-Person Control</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Critical (P0/P1)</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>{summary?.activeWorkItems.p0p1Count ?? 0}</div>
          <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>Incident SLA Active</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Overdue Items</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f97316', marginTop: '4px' }}>{summary?.activeWorkItems.overdue ?? 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Target Adherence</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Change Freezes</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>{summary?.activeFreezesCount ?? 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Gated Protection</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Team Members</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#6366f1', marginTop: '4px' }}>{summary?.totalMembers ?? 0}</div>
          <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '4px' }}>RBAC Enforced</div>
        </div>
      </div>

      {/* AI SRE & Workflow Assistant */}
      <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
        <form onSubmit={handleAiQuery} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ color: '#818cf8', fontSize: '13px', fontWeight: 700 }}>
            ✨ AI Workflow Copilot:
          </div>
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. Who owns payment-service? / Which approvals are waiting? / Summarize incident"
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={aiLoading}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#4f46e5',
              color: '#fff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {aiLoading ? 'Analyzing...' : 'Ask Copilot'}
          </button>
        </form>

        {aiResult && (
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '13px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>{aiResult.primaryAnswer}</div>
            {aiResult.evidenceCitations.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {aiResult.evidenceCitations.map((ev, i) => (
                  <span key={i} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    📄 {ev.title} {ev.snippet ? `(${ev.snippet})` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section Navigation Tabs & Search Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', padding: '4px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          {[
            { id: 'MY_WORK', label: 'My Work', count: workItems.filter((i) => i.assigneeUserId === 'usr-sre-lead').length },
            { id: 'TEAM_WORK', label: 'Team Work', count: workItems.filter((i) => i.assigneeTeamId === 'team-sre').length },
            { id: 'WAITING_FOR_APPROVAL', label: 'Waiting Approval', count: workItems.filter((i) => i.status === 'WAITING_APPROVAL').length },
            { id: 'BLOCKED', label: 'Blocked', count: workItems.filter((i) => i.status === 'BLOCKED').length },
            { id: 'ALL', label: 'All Items', count: workItems.length },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: activeSection === sec.id ? '#4f46e5' : 'transparent',
                color: activeSection === sec.id ? '#fff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: activeSection === sec.id ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {sec.label}
              <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '10px', backgroundColor: 'var(--bg-canvas)', color: 'var(--text-muted)' }}>
                {sec.count}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search work items..."
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
            }}
          />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="P0_CRITICAL">P0 Critical</option>
            <option value="P1_HIGH">P1 High</option>
            <option value="P2_MEDIUM">P2 Medium</option>
          </select>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '20px' }}>
        {/* Left Column: Work Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <LoadingState message="Loading work items from enterprise control plane..." />
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              No work items found for current filter.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => selectWorkItem(item)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-surface)',
                    border: isSelected ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: item.priority === 'P0_CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: item.priority === 'P0_CRITICAL' ? '#ef4444' : '#f59e0b',
                        border: '1px solid rgba(239, 68, 68, 0.4)'
                      }}>
                        {item.priority.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {item.type}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      backgroundColor: item.status === 'WAITING_APPROVAL' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: item.status === 'WAITING_APPROVAL' ? '#f59e0b' : '#10b981',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.4 }}>
                    {item.title}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>👤 {item.assigneeUserName || item.assigneeTeamName || 'Unassigned'}</span>
                    {item.slaStatus && (
                      <span style={{ color: item.slaStatus === 'AT_RISK' ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                        SLA: {item.slaStatus}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Work Item Detail, Timeline & Two-Person Control */}
        <div>
          {selectedItem ? (
            <div style={{ padding: '20px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--brand)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    #{selectedItem.id} • Source: {selectedItem.sourceId}
                  </div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {selectedItem.title}
                  </h2>
                </div>
                <span style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  backgroundColor: selectedItem.status === 'WAITING_APPROVAL' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: selectedItem.status === 'WAITING_APPROVAL' ? '#f59e0b' : '#10b981'
                }}>
                  {selectedItem.status}
                </span>
              </div>

              {/* Description */}
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Description & Context</div>
                <div style={{ marginTop: '6px', padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {selectedItem.description}
                </div>
              </div>

              {/* Linked Evidence */}
              {selectedItem.linkedEvidence.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Linked Evidence Citations</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginTop: '6px' }}>
                    {selectedItem.linkedEvidence.map((ev, i) => (
                      <div key={i} style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>🔗 {ev.title}</div>
                        {ev.snippet && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{ev.snippet}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Two-Person Control Approval Gate (If Waiting Approval) */}
              {selectedItem.status === 'WAITING_APPROVAL' && (
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '13px', fontWeight: 700 }}>
                    🔒 Two-Person Control Approval Gate
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    This action requires authorization by an authorized SRE or Approver. Segregation of duties policy strictly prohibits the requester from approving their own request.
                  </div>

                  {approvalError && (
                    <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '12px', fontWeight: 600 }}>
                      ⚠️ {approvalError}
                    </div>
                  )}
                  {approvalSuccess && (
                    <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#6ee7b7', fontSize: '12px', fontWeight: 600 }}>
                      ✅ {approvalSuccess}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button
                      onClick={() => handleDecideApproval('APPROVED')}
                      disabled={actionLoading}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        backgroundColor: '#10b981',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Authorize & Approve Change
                    </button>
                    <button
                      onClick={() => handleDecideApproval('REJECTED')}
                      disabled={actionLoading}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Reject Request
                    </button>
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Immutable Activity Timeline
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '2px solid var(--border-subtle)', marginLeft: '6px', paddingLeft: '14px', maxHeight: '180px', overflowY: 'auto' }}>
                  {timeline.map((evt) => (
                    <div key={evt.id} style={{ fontSize: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{evt.actor.name}</span>
                        <span>•</span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{evt.summary}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collaborative Comments */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                  Collaboration & Notes
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', maxHeight: '180px', overflowY: 'auto' }}>
                  {comments.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No comments yet.</div>
                  ) : (
                    comments.map((cmt) => (
                      <div key={cmt.id} style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: '#818cf8' }}>{cmt.author.name} ({cmt.author.role})</span>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{new Date(cmt.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{cmt.content}</div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add comment or reference @user..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !newComment.trim()}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      backgroundColor: '#4f46e5',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              Select a work item from the left queue to view details and collaborate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default WorkInboxPage;
