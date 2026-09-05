import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingState } from '../components/ui/States';
import { enterpriseWorkflowApi } from '../api/client';
import type { EnterpriseNotification } from '@cloudpulse/shared';
import { useNavigate } from 'react-router-dom';

export function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<EnterpriseNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notifs = await enterpriseWorkflowApi.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await enterpriseWorkflowApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, acknowledged: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.read;
    if (activeFilter === 'WARNING') return n.severity === 'WARNING';
    if (activeFilter === 'CRITICAL') return n.severity === 'CRITICAL';
    return true;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Enterprise Notification Center"
        subtitle="Role-based operational alerts, approval requests, incident escalations, and verification results."
        actions={
          <button
            onClick={loadNotifications}
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

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', padding: '4px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
        {[
          { id: 'ALL', label: 'All Notifications', count: notifications.length },
          { id: 'UNREAD', label: 'Unread', count: notifications.filter((n) => !n.read).length },
          { id: 'WARNING', label: 'Warnings', count: notifications.filter((n) => n.severity === 'WARNING').length },
          { id: 'CRITICAL', label: 'Critical', count: notifications.filter((n) => n.severity === 'CRITICAL').length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: activeFilter === tab.id ? '#4f46e5' : 'transparent',
              color: activeFilter === tab.id ? '#fff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: activeFilter === tab.id ? 700 : 500,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {tab.label}
            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'var(--bg-canvas)', color: 'var(--text-muted)' }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <LoadingState message="Loading notification stream..." />
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            🔔 No notifications found. You're completely up to date.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: !n.read ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface)',
                border: !n.read ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: n.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: n.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                  fontSize: '16px'
                }}>
                  {n.type === 'APPROVAL_REQUEST' ? '🔒' : n.type === 'INCIDENT_ALERT' ? '🔥' : '🔔'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{n.title}</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: n.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: n.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.4)'
                    }}>
                      {n.severity}
                    </span>
                    {!n.read && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
                    )}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(n.createdAt).toLocaleTimeString()} • Type: {n.type}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {n.targetRoute && (
                  <button
                    onClick={() => navigate(n.targetRoute!)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    View →
                  </button>
                )}
                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
export default NotificationCenterPage;
