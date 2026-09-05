import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSlos } from '../api/hooks.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { FilterBar, SelectFilter } from '../components/ui/FilterBar.tsx';
import { DataTable, type Column } from '../components/ui/DataTable.tsx';
import { Drawer } from '../components/ui/Drawer.tsx';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart.tsx';
import { LoadingState, ErrorState } from '../components/ui/States.tsx';
import type { SloDefinition } from '@cloudpulse/shared';

export function SlosPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSlo, setSelectedSlo] = useState<SloDefinition | null>(null);

  const { data: slos, loading, error, refetch } = useSlos(
    {
      status: statusFilter !== 'all' ? statusFilter : undefined,
    },
    15000
  );

  // Sync route param :id
  useEffect(() => {
    if (id && slos) {
      const match = slos.find((s) => s.id === id);
      if (match) {
        setSelectedSlo(match);
      }
    } else if (!id) {
      setSelectedSlo(null);
    }
  }, [id, slos]);

  if (loading && !slos) {
    return (
      <div className="page-container">
        <LoadingState message="Calculating Multi-Window Error Budget Consumption..." />
      </div>
    );
  }

  if (error && !slos) {
    return (
      <div className="page-container">
        <ErrorState title="SLO Engine Error" message={error} onRetry={refetch} />
      </div>
    );
  }

  const allSlos = slos || [];
  const filtered = allSlos.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCloseDrawer = () => {
    setSelectedSlo(null);
    if (id) {
      navigate('/slos');
    }
  };

  const handleSelectSlo = (s: SloDefinition) => {
    setSelectedSlo(s);
    navigate(`/slos/${s.id}`);
  };

  const columns: Column<SloDefinition>[] = [
    {
      key: 'name',
      header: 'SLO Objective & Description',
      sortable: true,
      sortValue: (s) => s.name,
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '12.5px' }}>
            {s.name}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.description}
          </span>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      sortable: true,
      sortValue: (s) => s.serviceName,
      render: (s) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--brand)' }}>
          {s.serviceName}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (s) => s.status,
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'current',
      header: 'Target vs Current',
      sortable: true,
      sortValue: (s) => s.currentPercent,
      align: 'right',
      render: (s) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          <span style={{ color: s.currentPercent < s.targetPercent ? 'var(--status-critical)' : 'var(--status-healthy)' }}>
            {s.currentPercent.toFixed(3)}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}> / {s.targetPercent}%</span>
        </span>
      ),
    },
    {
      key: 'errorBudget',
      header: 'Budget Remaining',
      sortable: true,
      sortValue: (s) => s.errorBudgetRemainingPercent,
      align: 'right',
      render: (s) => {
        const pct = Math.max(0, s.errorBudgetRemainingPercent);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: pct === 0 ? 'var(--status-critical)' : pct < 20 ? 'var(--status-warning)' : 'var(--status-healthy)',
              }}
            >
              {pct.toFixed(1)}% ({s.errorBudgetRemainingMinutes}m)
            </span>
            <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: pct === 0 ? 'var(--status-critical)' : pct < 20 ? 'var(--status-warning)' : 'var(--status-healthy)',
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'burnRate',
      header: 'Burn Rate',
      sortable: true,
      sortValue: (s) => s.burnRate,
      align: 'right',
      render: (s) => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: s.burnRate > 6 ? 'var(--status-critical)' : s.burnRate > 2 ? 'var(--status-warning)' : 'var(--text-primary)',
          }}
        >
          {s.burnRate}x
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="SLO & Error Budget Tracking"
        subtitle="Google SRE multi-window multi-burn-rate alerting, rolling compliance windows, and reliability budgets"
        badge={
          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            DEMO SRE DATA · 30D WINDOW
          </span>
        }
      />

      {/* Filter Controls */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter SLO definitions or services..."
        totalCount={allSlos.length}
        filteredCount={filtered.length}
        filters={
          <SelectFilter
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'All SLOs', value: 'all' },
              { label: 'Met (Compliant)', value: 'met' },
              { label: 'At Risk', value: 'at_risk' },
              { label: 'Breached (Exhausted)', value: 'breached' },
            ]}
          />
        }
      />

      {/* Main Table */}
      <Card padding="0">
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(s) => s.id}
          onRowClick={handleSelectSlo}
          pageSize={10}
        />
      </Card>

      {/* ── SLO Detail Drawer ─────────────────────────────────────────────── */}
      <Drawer
        isOpen={selectedSlo !== null}
        onClose={handleCloseDrawer}
        title={selectedSlo?.name || 'SLO Objective Detail'}
        subtitle={`Target: ${selectedSlo?.targetPercent}% · Service: ${selectedSlo?.serviceName}`}
        badge={selectedSlo ? <StatusBadge status={selectedSlo.status} /> : null}
        width="720px"
      >
        {selectedSlo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Description */}
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>SLI Specification</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px' }}>
                {selectedSlo.description}
              </div>
            </div>

            {/* Error Budget Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Current SLI</div>
                <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: selectedSlo.currentPercent < selectedSlo.targetPercent ? 'var(--status-critical)' : 'var(--status-healthy)', marginTop: '2px' }}>
                  {selectedSlo.currentPercent.toFixed(3)}%
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Budget Remaining</div>
                <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: selectedSlo.errorBudgetRemainingPercent === 0 ? 'var(--status-critical)' : 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedSlo.errorBudgetRemainingPercent.toFixed(1)}% ({selectedSlo.errorBudgetRemainingMinutes}m)
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Burn Rate (1h)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: selectedSlo.burnRate > 6 ? 'var(--status-critical)' : selectedSlo.burnRate > 2 ? 'var(--status-warning)' : 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedSlo.burnRate}x
                </div>
              </div>
            </div>

            {/* Achievement Trend Chart */}
            <Card title="30-Day SLI Achievement Trend" subtitle="Percentage of valid compliant events">
              <TimeSeriesChart
                data={selectedSlo.achievementHistory}
                unit="%"
                color={selectedSlo.currentPercent < selectedSlo.targetPercent ? '#ef4444' : '#10b981'}
                height={160}
              />
            </Card>

            {/* Error Budget Burn Down Chart */}
            <Card title="Error Budget Burn Down" subtitle="Remaining error budget minutes over 30d window">
              <TimeSeriesChart
                data={selectedSlo.burnDownHistory}
                unit="min"
                color="#f59e0b"
                height={160}
              />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
