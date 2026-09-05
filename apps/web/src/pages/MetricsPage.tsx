import React, { useState } from 'react';
import { useMetrics } from '../api/hooks.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart.tsx';
import { LoadingState, ErrorState } from '../components/ui/States.tsx';
import { DataTable, type Column } from '../components/ui/DataTable.tsx';
import type { MetricSummary, MetricDatapoint } from '@cloudpulse/shared';

export function MetricsPage() {
  const [selectedMetricName, setSelectedMetricName] = useState<string>('http_requests_total');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [aggregation, setAggregation] = useState<string>('avg');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const { data: metrics, loading, error, refetch } = useMetrics(undefined, 10000);

  if (loading && !metrics) {
    return (
      <div className="page-container">
        <LoadingState message="Connecting to Prometheus Metrics TSDB..." />
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="page-container">
        <ErrorState title="Metrics Query Failed" message={error} onRetry={refetch} />
      </div>
    );
  }

  const allMetrics = metrics || [];
  const activeMetric = allMetrics.find((m) => m.metricName === selectedMetricName) || allMetrics[0];

  const tableColumns: Column<MetricDatapoint>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp (UTC)',
      sortable: true,
      sortValue: (d) => d.timestamp,
      render: (d) => <span style={{ fontFamily: 'var(--font-mono)' }}>{new Date(d.timestamp).toISOString()}</span>,
    },
    {
      key: 'value',
      header: `Value (${activeMetric?.unit || ''})`,
      sortable: true,
      sortValue: (d) => d.value,
      align: 'right',
      render: (d) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand)' }}>
          {d.value} {activeMetric?.unit}
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Metrics Explorer"
        subtitle="Prometheus-compatible multi-dimensional time-series metric querying, aggregation, and statistical distribution"
        badge={
          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            TSDB Prometheus v2.53
          </span>
        }
      />

      {/* Query Bar Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '14px',
          alignItems: 'start',
        }}
      >
        {/* LEFT: Metric & Query Controls Panel */}
        <Card title="Metrics Catalog & Query" padding="14px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Metric Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Target Metric
              </label>
              <select
                value={selectedMetricName}
                onChange={(e) => setSelectedMetricName(e.target.value)}
                style={{
                  padding: '6px 8px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              >
                {allMetrics.map((m) => (
                  <option key={m.metricName} value={m.metricName} style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    {m.metricName}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Scope */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Service Filter
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                style={{
                  padding: '6px 8px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              >
                <option value="all">All Services (Cluster Wide)</option>
                <option value="api-gateway">api-gateway</option>
                <option value="auth-service">auth-service</option>
                <option value="order-service">order-service</option>
                <option value="payment-service">payment-service</option>
                <option value="inventory-service">inventory-service</option>
              </select>
            </div>

            {/* Aggregation Function */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Aggregation Func
              </label>
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value)}
                style={{
                  padding: '6px 8px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              >
                <option value="avg">avg_over_time()</option>
                <option value="sum">sum(rate())</option>
                <option value="p95">quantile(0.95)</option>
                <option value="p99">quantile(0.99)</option>
                <option value="max">max_over_time()</option>
              </select>
            </div>

            {/* PromQL Preview Box */}
            <div
              style={{
                padding: '10px',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--brand)',
                wordBreak: 'break-all',
              }}
            >
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                PromQL Query
              </div>
              {selectedService === 'all'
                ? `${aggregation}(rate(${selectedMetricName}[5m]))`
                : `${aggregation}(rate(${selectedMetricName}{service="${selectedService}"}[5m]))`}
            </div>

            {/* Chart Type Toggle */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <button
                onClick={() => setChartType('area')}
                style={{
                  flex: 1,
                  padding: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: chartType === 'area' ? 'var(--brand)' : 'var(--bg-subtle)',
                  color: chartType === 'area' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Area Fill
              </button>
              <button
                onClick={() => setChartType('line')}
                style={{
                  flex: 1,
                  padding: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: chartType === 'line' ? 'var(--brand)' : 'var(--bg-subtle)',
                  color: chartType === 'line' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Line Plot
              </button>
            </div>
          </div>
        </Card>

        {/* CENTER & RIGHT: Main Metric Visualization & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          {activeMetric && (
            <>
              {/* Header Details Card */}
              <Card
                title={activeMetric.displayName}
                subtitle={activeMetric.description}
                actions={
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setViewMode('chart')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: viewMode === 'chart' ? 'var(--bg-elevated)' : 'transparent',
                        border: '1px solid var(--border-subtle)',
                        color: viewMode === 'chart' ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      Visualization
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: viewMode === 'table' ? 'var(--bg-elevated)' : 'transparent',
                        border: '1px solid var(--border-subtle)',
                        color: viewMode === 'table' ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      Datapoints ({activeMetric.series.length})
                    </button>
                  </div>
                }
              >
                {viewMode === 'chart' ? (
                  <div style={{ padding: '8px 0' }}>
                    <TimeSeriesChart
                      data={activeMetric.series}
                      unit={activeMetric.unit}
                      color="#3b82f6"
                      type={chartType}
                      height={260}
                    />
                  </div>
                ) : (
                  <DataTable
                    data={activeMetric.series}
                    columns={tableColumns}
                    keyExtractor={(d) => d.timestamp}
                    pageSize={8}
                  />
                )}
              </Card>

              {/* Statistical Distribution Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Current Value</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--brand)', marginTop: '2px' }}>
                    {activeMetric.currentValue} <span style={{ fontSize: '11px' }}>{activeMetric.unit}</span>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Average</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {activeMetric.avgValue} <span style={{ fontSize: '11px' }}>{activeMetric.unit}</span>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Minimum</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {activeMetric.minValue} <span style={{ fontSize: '11px' }}>{activeMetric.unit}</span>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Maximum</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {activeMetric.maxValue} <span style={{ fontSize: '11px' }}>{activeMetric.unit}</span>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>P95 Percentile</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--status-warning)', marginTop: '2px' }}>
                    {activeMetric.p95Value} <span style={{ fontSize: '11px' }}>{activeMetric.unit}</span>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>P99 Percentile</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-critical)', marginTop: '2px' }}>
                    {activeMetric.p99Value} <span style={{ fontSize: '11px' }}>{activeMetric.unit}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
