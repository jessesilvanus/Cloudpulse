import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTraces } from '../api/hooks.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { FilterBar, SelectFilter } from '../components/ui/FilterBar.tsx';
import { DataTable, type Column } from '../components/ui/DataTable.tsx';
import { Drawer } from '../components/ui/Drawer.tsx';
import { GanttWaterfall } from '../components/charts/GanttWaterfall.tsx';
import { SeverityBadge } from '../components/ui/SeverityBadge.tsx';
import { LoadingState, ErrorState } from '../components/ui/States.tsx';
import type { Trace } from '@cloudpulse/shared';

export function TracesPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);

  const { data: traces, loading, error, refetch } = useTraces(
    {
      status: statusFilter !== 'all' ? statusFilter : undefined,
    },
    10000
  );

  // Sync route param :id
  useEffect(() => {
    if (id && traces) {
      const match = traces.find((t) => t.id === id);
      if (match) {
        setSelectedTrace(match);
      }
    } else if (!id) {
      setSelectedTrace(null);
    }
  }, [id, traces]);

  if (loading && !traces) {
    return (
      <div className="page-container">
        <LoadingState message="Fetching distributed traces from Tempo backend..." />
      </div>
    );
  }

  if (error && !traces) {
    return (
      <div className="page-container">
        <ErrorState title="Tracing Backend Error" message={error} onRetry={refetch} />
      </div>
    );
  }

  const allTraces = traces || [];
  const filtered = allTraces.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.operation.toLowerCase().includes(search.toLowerCase()) ||
      t.rootService.toLowerCase().includes(search.toLowerCase())
  );

  const handleCloseDrawer = () => {
    setSelectedTrace(null);
    if (id) {
      navigate('/traces');
    }
  };

  const handleSelectTrace = (t: Trace) => {
    setSelectedTrace(t);
    navigate(`/traces/${t.id}`);
  };

  const columns: Column<Trace>[] = [
    {
      key: 'id',
      header: 'Trace ID',
      sortable: true,
      sortValue: (t) => t.id,
      render: (t) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand)' }}>
          {t.id}
        </span>
      ),
    },
    {
      key: 'rootService',
      header: 'Root Service',
      sortable: true,
      sortValue: (t) => t.rootService,
      render: (t) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
          {t.rootService}
        </span>
      ),
    },
    {
      key: 'operation',
      header: 'Entrypoint Operation',
      sortable: true,
      sortValue: (t) => t.operation,
      render: (t) => (
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          {t.operation}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (t) => t.statusCode,
      render: (t) =>
        t.statusCode === 'ERROR' ? (
          <SeverityBadge severity="critical" label="ERROR" />
        ) : (
          <SeverityBadge severity="low" label="OK" />
        ),
    },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      sortValue: (t) => t.durationMs,
      align: 'right',
      render: (t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: t.statusCode === 'ERROR' ? 'var(--status-critical)' : t.durationMs > 500 ? 'var(--status-warning)' : 'var(--text-primary)',
            }}
          >
            {t.durationMs}ms
          </span>
          <div
            style={{
              width: '40px',
              height: '4px',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, (t.durationMs / 1500) * 100)}%`,
                height: '100%',
                backgroundColor: t.statusCode === 'ERROR' ? 'var(--status-critical)' : 'var(--brand)',
              }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'spans',
      header: 'Spans / Depth',
      sortable: true,
      sortValue: (t) => t.spanCount,
      align: 'right',
      render: (t) => (
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {t.spanCount} spans · depth {t.depth}
        </span>
      ),
    },
    {
      key: 'startTime',
      header: 'Timestamp (UTC)',
      sortable: true,
      sortValue: (t) => t.startTime,
      align: 'right',
      render: (t) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
          {new Date(t.startTime).toLocaleTimeString()}
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Distributed Tracing"
        subtitle="End-to-end request latency profiling, OpenTelemetry span waterfall graphs, and distributed microservice call chains"
        badge={
          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            DEMO OTLP TRACES
          </span>
        }
      />

      {/* Filter Controls */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter by Trace ID, operation, or root service..."
        totalCount={allTraces.length}
        filteredCount={filtered.length}
        filters={
          <SelectFilter
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'All Traces', value: 'all' },
              { label: 'Error Spans Only', value: 'ERROR' },
              { label: 'OK Only', value: 'OK' },
            ]}
          />
        }
      />

      {/* Main Traces Table */}
      <Card padding="0">
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(t) => t.id}
          onRowClick={handleSelectTrace}
          pageSize={10}
        />
      </Card>

      {/* ── Interactive Trace Waterfall Modal/Drawer ──────────────────────── */}
      <Drawer
        isOpen={selectedTrace !== null}
        onClose={handleCloseDrawer}
        title={selectedTrace?.operation || 'Distributed Trace Waterfall'}
        subtitle={`Trace ID: ${selectedTrace?.id} · Total Duration: ${selectedTrace?.durationMs}ms`}
        badge={
          selectedTrace?.statusCode === 'ERROR' ? (
            <SeverityBadge severity="critical" label="FAILED" />
          ) : (
            <SeverityBadge severity="low" label="SUCCESS" />
          )
        }
        width="820px"
      >
        {selectedTrace && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top Stat Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Root Service</div>
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--brand)', marginTop: '2px' }}>
                  {selectedTrace.rootService}
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Duration</div>
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: selectedTrace.statusCode === 'ERROR' ? 'var(--status-critical)' : 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedTrace.durationMs} ms
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Span Count</div>
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedTrace.spanCount} spans
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Services Involved</div>
                <div style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedTrace.servicesInvolved.join(', ')}
                </div>
              </div>
            </div>

            {/* Visual Gantt Waterfall */}
            <Card title="Span Execution Timeline & Waterfall" subtitle="Click any span to inspect OpenTelemetry attributes and events">
              <GanttWaterfall trace={selectedTrace} />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
