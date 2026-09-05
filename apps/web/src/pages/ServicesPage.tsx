import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServices, useLogs, useTraces, useAlerts, useSlos } from '../api/hooks.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { SeverityBadge } from '../components/ui/SeverityBadge.tsx';
import { FilterBar, SelectFilter } from '../components/ui/FilterBar.tsx';
import { DataTable, type Column } from '../components/ui/DataTable.tsx';
import { Drawer } from '../components/ui/Drawer.tsx';
import { Tabs } from '../components/ui/Tabs.tsx';
import { DependencyGraph } from '../components/charts/DependencyGraph.tsx';
import { LoadingState, ErrorState } from '../components/ui/States.tsx';
import type { Service } from '@cloudpulse/shared';

export function ServicesPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailTab, setDetailTab] = useState('overview');

  const { data: services, loading, error, refetch } = useServices(
    {
      environment: envFilter !== 'all' ? envFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    },
    10000
  );

  // Sync route param :id with selectedService
  useEffect(() => {
    if (id && services) {
      const match = services.find((s) => s.id === id || s.name === id);
      if (match) {
        setSelectedService(match);
      }
    } else if (!id) {
      setSelectedService(null);
    }
  }, [id, services]);

  // Sub-queries for the selected service in detail view
  const { data: serviceLogs } = useLogs(selectedService ? { service: selectedService.name } : undefined);
  const { data: serviceTraces } = useTraces(selectedService ? { service: selectedService.name } : undefined);
  const { data: serviceAlerts } = useAlerts(selectedService ? { service: selectedService.name } : undefined);
  const { data: serviceSlos } = useSlos(selectedService ? { service: selectedService.name } : undefined);

  if (loading && !services) {
    return (
      <div className="page-container">
        <LoadingState message="Loading Services Inventory..." />
      </div>
    );
  }

  if (error && !services) {
    return (
      <div className="page-container">
        <ErrorState title="Services Catalog Error" message={error} onRetry={refetch} />
      </div>
    );
  }

  const allServices = services || [];
  const filtered = allServices.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.team.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const healthyCount = allServices.filter((s) => s.status === 'healthy').length;
  const degradedCount = allServices.filter((s) => s.status === 'degraded').length;
  const unhealthyCount = allServices.filter((s) => s.status === 'unhealthy').length;

  const handleCloseDrawer = () => {
    setSelectedService(null);
    if (id) {
      navigate('/services');
    }
  };

  const handleSelectService = (s: Service) => {
    setSelectedService(s);
    navigate(`/services/${s.id}`);
  };

  const columns: Column<Service>[] = [
    {
      key: 'name',
      header: 'Service Name',
      sortable: true,
      sortValue: (s) => s.name,
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand)', fontSize: '12.5px' }}>
              {s.name}
            </span>
            <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
              {s.version}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.description}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Health',
      sortable: true,
      sortValue: (s) => s.status,
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'tier',
      header: 'Tier',
      sortable: true,
      sortValue: (s) => s.tier,
      render: (s) => (
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          {s.tier}
        </span>
      ),
    },
    {
      key: 'team',
      header: 'Owner / Team',
      sortable: true,
      sortValue: (s) => s.team,
      render: (s) => <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{s.team}</span>,
    },
    {
      key: 'requestRate',
      header: 'Throughput',
      sortable: true,
      sortValue: (s) => s.requestRate,
      align: 'right',
      render: (s) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {s.requestRate >= 1000 ? `${(s.requestRate / 1000).toFixed(1)}k` : s.requestRate} req/s
        </span>
      ),
    },
    {
      key: 'errorRate',
      header: 'Error Rate',
      sortable: true,
      sortValue: (s) => s.errorRate,
      align: 'right',
      render: (s) => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: s.errorRate > 5 ? 'var(--status-critical)' : s.errorRate > 1 ? 'var(--status-warning)' : 'var(--status-healthy)',
          }}
        >
          {s.errorRate.toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'latencyP99',
      header: 'P99 Latency',
      sortable: true,
      sortValue: (s) => s.latencyP99Ms,
      align: 'right',
      render: (s) => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: s.latencyP99Ms > 1000 ? 'var(--status-critical)' : s.latencyP99Ms > 500 ? 'var(--status-warning)' : 'var(--text-primary)',
          }}
        >
          {s.latencyP99Ms >= 1000 ? `${(s.latencyP99Ms / 1000).toFixed(2)}s` : `${s.latencyP99Ms}ms`}
        </span>
      ),
    },
    {
      key: 'alerts',
      header: 'Active Alerts',
      sortable: true,
      sortValue: (s) => s.activeAlertCount,
      align: 'center',
      render: (s) =>
        s.activeAlertCount > 0 ? (
          <SeverityBadge severity="critical" label={`${s.activeAlertCount} FIRING`} />
        ) : (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>0</span>
        ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Services Catalog"
        subtitle="Microservice topology, deployment tiers, health status, and golden signal metrics"
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            <span style={{ color: 'var(--status-healthy)', fontWeight: 600 }}>{healthyCount} healthy</span>
            <span>·</span>
            <span style={{ color: 'var(--status-warning)', fontWeight: 600 }}>{degradedCount} degraded</span>
            <span>·</span>
            <span style={{ color: 'var(--status-critical)', fontWeight: 600 }}>{unhealthyCount} unhealthy</span>
            <span>·</span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              DEMO TOPOLOGY
            </span>
          </div>
        }
      />

      {/* Filter Controls */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter by service name, team, or description..."
        totalCount={allServices.length}
        filteredCount={filtered.length}
        filters={
          <>
            <SelectFilter
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Healthy', value: 'healthy' },
                { label: 'Degraded', value: 'degraded' },
                { label: 'Unhealthy', value: 'unhealthy' },
              ]}
            />
            <SelectFilter
              label="Environment"
              value={envFilter}
              onChange={setEnvFilter}
              options={[
                { label: 'All Envs', value: 'all' },
                { label: 'Production', value: 'production' },
                { label: 'Staging', value: 'staging' },
                { label: 'Development', value: 'development' },
              ]}
            />
          </>
        }
      />

      {/* Main Services Table */}
      <Card padding="0">
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(s) => s.id}
          onRowClick={handleSelectService}
          pageSize={10}
        />
      </Card>

      {/* ── Deep Service Detail Drawer ────────────────────────────────────── */}
      <Drawer
        isOpen={selectedService !== null}
        onClose={handleCloseDrawer}
        title={selectedService?.name || 'Service Detail'}
        subtitle={`${selectedService?.team} · ${selectedService?.version} · ${selectedService?.environment}`}
        badge={selectedService ? <StatusBadge status={selectedService.status} size="md" /> : null}
        width="760px"
      >
        {selectedService && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Navigation Tabs */}
            <Tabs
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'dependencies', label: `Dependencies (${selectedService.dependencies.length})` },
                { id: 'logs', label: `Logs (${serviceLogs?.length || 0})` },
                { id: 'traces', label: `Traces (${serviceTraces?.length || 0})` },
                { id: 'alerts', label: `Alerts (${serviceAlerts?.length || 0})` },
                { id: 'slos', label: `SLOs (${serviceSlos?.length || 0})` },
              ]}
              activeTab={detailTab}
              onChange={setDetailTab}
            />

            {/* TAB: Overview */}
            {detailTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Description Banner */}
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Service Description</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedService.description}
                  </div>
                </div>

                {/* Golden Signals Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Throughput</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedService.goldenSignals.throughputRps} req/s
                    </div>
                  </div>

                  <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Error Rate</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: selectedService.errorRate > 5 ? 'var(--status-critical)' : 'var(--status-healthy)', marginTop: '2px' }}>
                      {selectedService.goldenSignals.errorRatePercent}%
                    </div>
                  </div>

                  <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>P99 Latency</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: selectedService.latencyP99Ms > 1000 ? 'var(--status-critical)' : 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedService.goldenSignals.latencyP99Ms} ms
                    </div>
                  </div>

                  <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>P50 Latency</div>
                    <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {selectedService.goldenSignals.latencyP50Ms} ms
                    </div>
                  </div>

                  <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>CPU Utilization</div>
                    <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {selectedService.goldenSignals.cpuUsagePercent}%
                    </div>
                  </div>

                  <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Memory Usage</div>
                    <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {selectedService.goldenSignals.memoryUsageMb} MB
                    </div>
                  </div>
                </div>

                {/* Mini Dependency Preview */}
                <div>
                  <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Dependency Topology
                  </h4>
                  <DependencyGraph
                    currentService={selectedService}
                    allServices={allServices}
                    onSelectService={(targetId) => {
                      const next = allServices.find((s) => s.id === targetId || s.name === targetId);
                      if (next) handleSelectService(next);
                    }}
                  />
                </div>
              </div>
            )}

            {/* TAB: Dependencies Graph */}
            {detailTab === 'dependencies' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <DependencyGraph
                  currentService={selectedService}
                  allServices={allServices}
                  onSelectService={(targetId) => {
                    const next = allServices.find((s) => s.id === targetId || s.name === targetId);
                    if (next) handleSelectService(next);
                  }}
                />

                <div style={{ marginTop: '10px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Direct Downstream Dependency Matrix
                  </h4>
                  <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Target Service</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Protocol</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Call Rate</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Error Rate</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>P99 Latency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedService.dependencies.map((d) => (
                          <tr key={d.targetServiceId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td
                              onClick={() => {
                                const next = allServices.find((s) => s.id === d.targetServiceId || s.name === d.targetServiceName);
                                if (next) handleSelectService(next);
                              }}
                              style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--brand)', cursor: 'pointer' }}
                            >
                              {d.targetServiceName}
                            </td>
                            <td style={{ padding: '8px 10px', textTransform: 'uppercase', fontSize: '10px' }}>{d.type}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{d.callRateRps} rps</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: d.errorRatePercent > 5 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                              {d.errorRatePercent}%
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{d.p99LatencyMs}ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Service Logs */}
            {detailTab === 'logs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(!serviceLogs || serviceLogs.length === 0) ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recent log entries for {selectedService.name}
                  </div>
                ) : (
                  serviceLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '8px 10px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: log.level === 'ERROR' ? 'var(--status-critical)' : 'var(--text-muted)' }}>
                          [{log.level}] {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {log.traceId && (
                          <span
                            onClick={() => navigate(`/traces/${log.traceId}`)}
                            style={{ color: 'var(--status-purple)', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            trace:{log.traceId}
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-primary)' }}>{log.message}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: Service Traces */}
            {detailTab === 'traces' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(!serviceTraces || serviceTraces.length === 0) ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recent distributed traces involving {selectedService.name}
                  </div>
                ) : (
                  serviceTraces.map((tr) => (
                    <div
                      key={tr.id}
                      onClick={() => navigate(`/traces/${tr.id}`)}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {tr.operation}
                        </div>
                        <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {tr.id} · {tr.spanCount} spans · {tr.servicesInvolved.join(' → ')}
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: tr.statusCode === 'ERROR' ? 'var(--status-critical)' : 'var(--text-secondary)' }}>
                        {tr.durationMs}ms
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: Service Alerts */}
            {detailTab === 'alerts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(!serviceAlerts || serviceAlerts.length === 0) ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--status-healthy)' }}>
                    ✓ No active alerts firing on {selectedService.name}
                  </div>
                ) : (
                  serviceAlerts.map((alt) => (
                    <div
                      key={alt.id}
                      onClick={() => navigate(`/alerts/${alt.id}`)}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--status-critical-border)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {alt.name}
                        </span>
                        <SeverityBadge severity={alt.severity} />
                      </div>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>{alt.summary}</p>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>
                        Condition: {alt.condition}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: Service SLOs */}
            {detailTab === 'slos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(!serviceSlos || serviceSlos.length === 0) ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No SLO definitions assigned to {selectedService.name}
                  </div>
                ) : (
                  serviceSlos.map((slo) => (
                    <div
                      key={slo.id}
                      onClick={() => navigate(`/slos/${slo.id}`)}
                      style={{
                        padding: '12px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{slo.name}</span>
                        <StatusBadge status={slo.status} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>Target: <strong>{slo.targetPercent}%</strong></span>
                        <span>Current: <strong style={{ color: slo.currentPercent < slo.targetPercent ? 'var(--status-critical)' : 'var(--status-healthy)' }}>{slo.currentPercent}%</strong></span>
                        <span>Error Budget: <strong>{slo.errorBudgetRemainingPercent}%</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
