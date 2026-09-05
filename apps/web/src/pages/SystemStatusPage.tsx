import React from 'react';
import { useSystemStatus } from '../api/hooks.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { DataTable, type Column } from '../components/ui/DataTable.tsx';
import { LoadingState, ErrorState } from '../components/ui/States.tsx';
import type { SystemComponentStatus } from '@cloudpulse/shared';

export function SystemStatusPage() {
  const { data: components, loading, error, refetch } = useSystemStatus();

  if (loading && !components) {
    return (
      <div className="page-container">
        <LoadingState message="Checking CloudPulse internal health..." />
      </div>
    );
  }

  if (error && !components) {
    return (
      <div className="page-container">
        <ErrorState title="System Status Unreachable" message={error} onRetry={refetch} />
      </div>
    );
  }

  const allComponents = components || [];

  const columns: Column<SystemComponentStatus>[] = [
    {
      key: 'name',
      header: 'Component Name',
      sortable: true,
      sortValue: (c) => c.name,
      render: (c) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '12px' }}>
            {c.name}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.details}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Subsystem Category',
      sortable: true,
      sortValue: (c) => c.category,
      render: (c) => (
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
          {c.category}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Health Status',
      sortable: true,
      sortValue: (c) => c.status,
      render: (c) => <StatusBadge status={c.status === 'operational' ? 'healthy' : c.status === 'down' ? 'unhealthy' : 'degraded'} label={c.status.toUpperCase()} />,
    },
    {
      key: 'mode',
      header: 'Engine Mode',
      render: (c) => (
        <span
          style={{
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            backgroundColor: c.mode === 'real' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
            color: c.mode === 'real' ? 'var(--status-healthy)' : 'var(--brand)',
            textTransform: 'uppercase',
          }}
        >
          {c.mode === 'real' ? 'Local Active' : 'Simulated TSDB'}
        </span>
      ),
    },
    {
      key: 'latency',
      header: 'Heartbeat Latency',
      sortable: true,
      sortValue: (c) => c.latencyMs,
      align: 'right',
      render: (c) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {c.latencyMs} ms
        </span>
      ),
    },
    {
      key: 'version',
      header: 'Engine Version',
      render: (c) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{c.version}</span>,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="System Status & Internal Health"
        subtitle="Self-observability of CloudPulse gateway, telemetry collectors, TSDB storage engines, and alerting daemons"
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot" />
            <span style={{ fontSize: '11.5px', color: 'var(--status-healthy)', fontWeight: 700 }}>
              All Systems Operational
            </span>
          </div>
        }
      />

      <Card padding="0">
        <DataTable
          data={allComponents}
          columns={columns}
          keyExtractor={(c) => c.id}
          pageSize={10}
        />
      </Card>
    </div>
  );
}
