import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlerts } from '../api/hooks.ts';
import { api } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { FilterBar, SelectFilter } from '../components/ui/FilterBar.tsx';
import { DataTable, type Column } from '../components/ui/DataTable.tsx';
import { Drawer } from '../components/ui/Drawer.tsx';
import { SeverityBadge } from '../components/ui/SeverityBadge.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { LoadingState, ErrorState } from '../components/ui/States.tsx';
import { PlayIcon, TracesIcon, LogsIcon } from '../components/ui/Icons.tsx';
import type { Alert } from '@cloudpulse/shared';

export function AlertsPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const { data: alerts, loading, error, refetch } = useAlerts(
    {
      severity: severityFilter !== 'all' ? severityFilter : undefined,
      state: stateFilter !== 'all' ? stateFilter : undefined,
    },
    10000
  );

  // Sync route param :id
  useEffect(() => {
    if (id && alerts) {
      const match = alerts.find((a) => a.id === id);
      if (match) {
        setSelectedAlert(match);
      }
    } else if (!id) {
      setSelectedAlert(null);
    }
  }, [id, alerts]);

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    try {
      await api.evaluateAlerts();
      await refetch();
    } finally {
      setIsEvaluating(false);
    }
  };

  if (loading && !alerts) {
    return (
      <div className="page-container">
        <LoadingState message="Loading Alert Rules and Active Evaluations..." />
      </div>
    );
  }

  if (error && !alerts) {
    return (
      <div className="page-container">
        <ErrorState title="Alert Engine Error" message={error} onRetry={refetch} />
      </div>
    );
  }

  const allAlerts = alerts || [];
  const filtered = allAlerts.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase()) ||
      (a.serviceName && a.serviceName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCloseDrawer = () => {
    setSelectedAlert(null);
    if (id) {
      navigate('/alerts');
    }
  };

  const handleSelectAlert = (a: Alert) => {
    setSelectedAlert(a);
    navigate(`/alerts/${a.id}`);
  };

  const columns: Column<Alert>[] = [
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      sortValue: (a) => a.severity,
      render: (a) => <SeverityBadge severity={a.severity} />,
    },
    {
      key: 'name',
      header: 'Alert Name & Summary',
      sortable: true,
      sortValue: (a) => a.name,
      render: (a) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '12.5px' }}>
            {a.name}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {a.summary}
          </span>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Target Service',
      sortable: true,
      sortValue: (a) => a.serviceName || '',
      render: (a) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--brand)' }}>
          {a.serviceName || 'Cluster'}
        </span>
      ),
    },
    {
      key: 'currentValue',
      header: 'Current / Threshold',
      sortable: true,
      sortValue: (a) => a.currentValue,
      align: 'right',
      render: (a) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          <strong style={{ color: a.currentValue >= a.threshold ? 'var(--status-critical)' : 'var(--status-healthy)' }}>
            {a.currentValue}{a.unit}
          </strong>
          <span style={{ color: 'var(--text-muted)' }}> / {a.threshold}{a.unit}</span>
        </span>
      ),
    },
    {
      key: 'state',
      header: 'State',
      sortable: true,
      sortValue: (a) => a.state,
      render: (a) => <StatusBadge status={a.state === 'firing' ? 'unhealthy' : 'healthy'} label={a.state} />,
    },
    {
      key: 'duration',
      header: 'Active Duration',
      sortable: true,
      sortValue: (a) => a.durationMinutes,
      align: 'right',
      render: (a) => (
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          {a.durationMinutes}m ago
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Alert Management"
        subtitle="Automated Prometheus PromQL condition evaluations, trigger thresholds, and incident correlation"
        badge={
          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            DEMO ALERT ENGINE
          </span>
        }
        actions={
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontSize: '11.5px',
              fontWeight: 600,
            }}
          >
            <PlayIcon /> {isEvaluating ? 'Evaluating Rules...' : 'Trigger Rule Evaluation'}
          </button>
        }
      />

      {/* Filter Controls */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter by alert name, condition, or service..."
        totalCount={allAlerts.length}
        filteredCount={filtered.length}
        filters={
          <>
            <SelectFilter
              label="Severity"
              value={severityFilter}
              onChange={setSeverityFilter}
              options={[
                { label: 'All Severities', value: 'all' },
                { label: 'Critical Only', value: 'critical' },
                { label: 'High Only', value: 'high' },
                { label: 'Medium Only', value: 'medium' },
              ]}
            />
            <SelectFilter
              label="State"
              value={stateFilter}
              onChange={setStateFilter}
              options={[
                { label: 'All States', value: 'all' },
                { label: 'Firing Only', value: 'firing' },
                { label: 'Resolved Only', value: 'resolved' },
              ]}
            />
          </>
        }
      />

      {/* Alerts Table */}
      <Card padding="0">
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(a) => a.id}
          onRowClick={handleSelectAlert}
          pageSize={10}
        />
      </Card>

      {/* ── Alert Detail Drawer ───────────────────────────────────────────── */}
      <Drawer
        isOpen={selectedAlert !== null}
        onClose={handleCloseDrawer}
        title={selectedAlert?.name || 'Alert Detail'}
        subtitle={`Alert ID: ${selectedAlert?.id} · Target: ${selectedAlert?.serviceName}`}
        badge={selectedAlert ? <SeverityBadge severity={selectedAlert.severity} /> : null}
      >
        {selectedAlert && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Condition Formula Card */}
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>
                PromQL Trigger Condition
              </div>
              <div style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: 'var(--brand)', wordBreak: 'break-all' }}>
                {selectedAlert.condition}
              </div>
            </div>

            {/* Threshold Values Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Current Telemetry Value</div>
                <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-critical)', marginTop: '2px' }}>
                  {selectedAlert.currentValue} {selectedAlert.unit}
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Firing Threshold</div>
                <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedAlert.threshold} {selectedAlert.unit}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Summary & Impact</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px' }}>
                {selectedAlert.summary}
              </div>
            </div>

            {/* Correlated Actions */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Correlated Observability Drilldowns
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedAlert.relatedTraceId && (
                  <button
                    onClick={() => {
                      navigate(`/traces/${selectedAlert.relatedTraceId}`);
                      setSelectedAlert(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--status-purple)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      textAlign: 'left',
                    }}
                  >
                    <TracesIcon /> Correlated Trace: {selectedAlert.relatedTraceId} →
                  </button>
                )}

                {selectedAlert.relatedLogId && (
                  <button
                    onClick={() => {
                      navigate('/logs');
                      setSelectedAlert(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--brand)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      textAlign: 'left',
                    }}
                  >
                    <LogsIcon /> Correlated Error Log Stream →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
