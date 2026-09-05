import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogs } from '../api/hooks.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { FilterBar, SelectFilter } from '../components/ui/FilterBar.tsx';
import { Drawer } from '../components/ui/Drawer.tsx';
import { LoadingState, ErrorState } from '../components/ui/States.tsx';
import type { LogEntry } from '@cloudpulse/shared';
import { TracesIcon, ServicesIcon } from '../components/ui/Icons.tsx';

export function LogsPage() {
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const navigate = useNavigate();

  const { data: logs, loading, error, refetch } = useLogs(
    {
      service: serviceFilter !== 'all' ? serviceFilter : undefined,
      level: levelFilter !== 'all' ? levelFilter : undefined,
      q: search || undefined,
    },
    5000
  );

  if (loading && !logs) {
    return (
      <div className="page-container">
        <LoadingState message="Streaming logs from Loki collector..." />
      </div>
    );
  }

  if (error && !logs) {
    return (
      <div className="page-container">
        <ErrorState title="Log Aggregator Error" message={error} onRetry={refetch} />
      </div>
    );
  }

  const allLogs = logs || [];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'FATAL':
      case 'ERROR': return 'var(--status-critical)';
      case 'WARN': return 'var(--status-warning)';
      case 'INFO': return 'var(--brand)';
      case 'DEBUG': return 'var(--text-muted)';
      default: return 'var(--text-secondary)';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'FATAL':
      case 'ERROR': return 'var(--status-critical-bg)';
      case 'WARN': return 'var(--status-warning-bg)';
      case 'INFO': return 'rgba(59, 130, 246, 0.12)';
      default: return 'var(--bg-subtle)';
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Log Stream Explorer"
        subtitle="Centralized structured log stream with OpenTelemetry Trace ID correlation and real-time regex filtering"
        badge={
          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            Loki Stream Engine v3.0
          </span>
        }
      />

      {/* Search & Severity Filters */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder='Search logs or filter e.g. "timeout", error, connection...'
        totalCount={allLogs.length}
        filters={
          <>
            <SelectFilter
              label="Level"
              value={levelFilter}
              onChange={setLevelFilter}
              options={[
                { label: 'All Levels', value: 'all' },
                { label: 'ERROR', value: 'ERROR' },
                { label: 'WARN', value: 'WARN' },
                { label: 'INFO', value: 'INFO' },
                { label: 'DEBUG', value: 'DEBUG' },
              ]}
            />
            <SelectFilter
              label="Service"
              value={serviceFilter}
              onChange={setServiceFilter}
              options={[
                { label: 'All Services', value: 'all' },
                { label: 'api-gateway', value: 'api-gateway' },
                { label: 'auth-service', value: 'auth-service' },
                { label: 'order-service', value: 'order-service' },
                { label: 'payment-service', value: 'payment-service' },
                { label: 'inventory-service', value: 'inventory-service' },
              ]}
            />
          </>
        }
      />

      {/* Dense Monospaced Log Stream Container */}
      <Card padding="0">
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
          {/* Table Header */}
          <div
            style={{
              display: 'flex',
              padding: '8px 12px',
              borderBottom: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-subtle)',
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ width: '150px', flexShrink: 0 }}>TIMESTAMP (UTC)</div>
            <div style={{ width: '70px', flexShrink: 0 }}>LEVEL</div>
            <div style={{ width: '140px', flexShrink: 0 }}>SERVICE</div>
            <div style={{ flex: 1 }}>MESSAGE</div>
            <div style={{ width: '160px', flexShrink: 0, textAlign: 'right' }}>TRACE CORRELATION</div>
          </div>

          {/* Log Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '680px', overflowY: 'auto' }}>
            {allLogs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No log entries matched your filter parameters.
              </div>
            ) : (
              allLogs.map((log) => {
                const levelColor = getLevelColor(log.level);
                const levelBg = getLevelBg(log.level);

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '7px 12px',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s',
                      backgroundColor: selectedLog?.id === log.id ? 'var(--bg-active)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedLog?.id !== log.id) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedLog?.id !== log.id) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Timestamp */}
                    <div style={{ width: '150px', flexShrink: 0, color: 'var(--text-muted)', fontSize: '11px' }}>
                      {new Date(log.timestamp).toISOString().slice(11, 23)}
                    </div>

                    {/* Level */}
                    <div style={{ width: '70px', flexShrink: 0 }}>
                      <span
                        style={{
                          padding: '1px 5px',
                          borderRadius: '2px',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: levelColor,
                          backgroundColor: levelBg,
                          display: 'inline-block',
                        }}
                      >
                        {log.level}
                      </span>
                    </div>

                    {/* Service */}
                    <div style={{ width: '140px', flexShrink: 0, fontWeight: 600, color: 'var(--brand)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.service}
                    </div>

                    {/* Message */}
                    <div style={{ flex: 1, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '10px' }}>
                      {log.message}
                    </div>

                    {/* Trace ID Tag */}
                    <div style={{ width: '160px', flexShrink: 0, textAlign: 'right' }}>
                      {log.traceId ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/traces');
                          }}
                          title="Open Distributed Trace Waterfall"
                          style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: 'var(--status-purple-bg)',
                            color: 'var(--status-purple)',
                            fontSize: '10px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <TracesIcon /> {log.traceId.slice(0, 12)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-subtle)', fontSize: '10px' }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {/* ── Log Detail Drawer ─────────────────────────────────────────────── */}
      <Drawer
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Structured Log Detail"
        subtitle={`Log ID: ${selectedLog?.id} · ${selectedLog?.service}`}
        width="680px"
        footer={
          selectedLog?.traceId ? (
            <button
              onClick={() => {
                navigate('/traces');
                setSelectedLog(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--brand)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <TracesIcon /> Jump to Correlated Trace Waterfall →
            </button>
          ) : undefined
        }
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Service</div>
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--brand)', marginTop: '2px' }}>
                  {selectedLog.service}
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Severity Level</div>
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: getLevelColor(selectedLog.level), marginTop: '2px' }}>
                  {selectedLog.level}
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Timestamp</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {new Date(selectedLog.timestamp).toISOString()}
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Trace Correlation</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--status-purple)', marginTop: '2px' }}>
                  {selectedLog.traceId || 'None'}
                </div>
              </div>
            </div>

            {/* Log Message */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Log Message Body
              </div>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: selectedLog.level === 'ERROR' ? 'var(--status-critical)' : 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {selectedLog.message}
              </div>
            </div>

            {/* Structured Attributes JSON */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Structured Attributes & Metadata
              </div>
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    {Object.entries(selectedLog.attributes).map(([key, val]) => (
                      <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: 'var(--brand)', width: '35%' }}>
                          {key}
                        </td>
                        <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
