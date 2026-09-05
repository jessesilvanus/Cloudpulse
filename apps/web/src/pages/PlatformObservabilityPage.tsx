import React, { useState, useEffect } from 'react';
import {
  PlatformOverviewSummary,
  PlatformHealthCheckResult,
  PlatformMetrics,
  PlatformSlo,
  PlatformSyncWorkerStatus,
  PlatformIncident,
  PlatformMaintenanceWindow,
  PlatformCostRecord
} from '@cloudpulse/shared';
import { platformApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/Card.tsx';
import { StatCard } from '../components/ui/StatCard.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { SeverityBadge } from '../components/ui/SeverityBadge.tsx';

function ServerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="8" x="2" y="2" rx="2" /><rect width="20" height="8" x="2" y="14" rx="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" /><line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}

function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  );
}

function CpuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
    </svg>
  );
}

function ZapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function RotateCwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
    </svg>
  );
}

function SlidersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" /><line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" /><line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" />
      <line x1="1" x2="7" y1="14" y2="14" /><line x1="9" x2="15" y1="8" y2="8" /><line x1="17" x2="23" y1="16" y2="16" />
    </svg>
  );
}

function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function DollarSignIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export const PlatformObservabilityPage: React.FC = () => {
  const [overview, setOverview] = useState<PlatformOverviewSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'dependencies' | 'slos' | 'workers' | 'ratelimits' | 'costs' | 'incidents'
  >('overview');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [maintTitle, setMaintTitle] = useState<string>('');
  const [maintReason, setMaintReason] = useState<string>('');
  const [maintScope, setMaintScope] = useState<any>('DATABASE_MIGRATION');
  const [showMaintModal, setShowMaintModal] = useState<boolean>(false);

  const fetchPlatformData = async () => {
    try {
      setRefreshing(true);
      const data = await platformApi.getPlatformOverview();
      setOverview(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load platform observability telemetry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
    const interval = setInterval(fetchPlatformData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleScheduleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await platformApi.schedulePlatformMaintenance({
        title: maintTitle,
        reason: maintReason,
        scope: maintScope,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString()
      });
      setShowMaintModal(false);
      setMaintTitle('');
      setMaintReason('');
      await fetchPlatformData();
    } catch (err: any) {
      alert(`Failed to schedule maintenance: ${err.message}`);
    }
  };

  const handleCancelMaintenance = async () => {
    if (!confirm('Are you sure you want to cancel active platform maintenance?')) return;
    try {
      await platformApi.cancelPlatformMaintenance();
      await fetchPlatformData();
    } catch (err: any) {
      alert(`Failed to cancel maintenance: ${err.message}`);
    }
  };

  if (loading && !overview) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RotateCwIcon className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--color-primary, #3b82f6)' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading CloudPulse Platform Telemetry...</div>
          <div style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.875rem' }}>Probing internal self-observability, workers & SLOs</div>
        </div>
      </div>
    );
  }

  const health = overview?.health;
  const metrics = overview?.metrics;
  const slos = overview?.slos || [];
  const workers = overview?.workers || [];
  const costs = overview?.costs;
  const rateLimits = overview?.rateLimits;
  const incidents = overview?.activeIncidents || [];
  const maintenance = overview?.activeMaintenance;

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Maintenance Banner */}
      {maintenance && (
        <div
          style={{
            background: 'rgba(234, 179, 8, 0.15)',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            borderRadius: '8px',
            padding: '12px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangleIcon style={{ color: '#eab308' }} width={22} height={22} />
            <div>
              <strong style={{ color: '#eab308', marginRight: '8px' }}>Active Platform Maintenance:</strong>
              <span>{maintenance.title} ({maintenance.reason})</span>
            </div>
          </div>
          <button
            onClick={handleCancelMaintenance}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            End Maintenance
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Platform Observability & Infrastructure Control"
        subtitle="Real-time self-observability, internal SLO attainment, multi-cloud sync workers, rate-limiting circuit breakers, and hosting unit economics for CLOUDPULSE."
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowMaintModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              <SlidersIcon width={15} height={15} />
              Schedule Maintenance
            </button>
            <button
              onClick={fetchPlatformData}
              disabled={refreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--color-primary, #3b82f6)',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              <RotateCwIcon width={15} height={15} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Top Stat Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <StatCard
          label="Platform Health"
          value={health?.status || 'HEALTHY'}
          subValue={`Environment: ${overview?.environment.toUpperCase()} | ${health?.uptimeSeconds ? Math.floor(health.uptimeSeconds / 60) : 0}m Uptime`}
          status={health?.status === 'HEALTHY' ? 'healthy' : 'warning'}
          icon={<ServerIcon width={20} height={20} />}
        />
        <StatCard
          label="Throughput & Latency"
          value={`${metrics?.requestsPerSecond.toFixed(1)} req/s`}
          subValue={`P99: ${metrics?.apiLatency.p99}ms | P50: ${metrics?.apiLatency.p50}ms | Error: ${metrics?.errorRatePercent}%`}
          status="healthy"
          icon={<ZapIcon width={20} height={20} />}
        />
        <StatCard
          label="Internal SLO Attainment"
          value={`${slos.filter((s) => s.status === 'HEALTHY').length} / ${slos.length} Healthy`}
          subValue={`Min Error Budget: ${slos.length ? Math.min(...slos.map((s) => s.errorBudgetRemainingPercent)) : 100}% remaining`}
          status="healthy"
          icon={<ActivityIcon width={20} height={20} />}
        />
        <StatCard
          label="Platform Hosting Spend"
          value={`$${costs?.totalMonthToDateUsd.toFixed(2)} MTD`}
          subValue="Compute, Aurora DB, TSDBs, AI & Egress"
          status="neutral"
          icon={<DollarSignIcon width={20} height={20} />}
        />
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}
      >
        {[
          { id: 'overview', label: 'Platform Overview', icon: <LayersIcon width={16} height={16} /> },
          { id: 'dependencies', label: 'Component & Dependency Health', icon: <ServerIcon width={16} height={16} /> },
          { id: 'slos', label: 'Internal SLOs & Error Budgets', icon: <ActivityIcon width={16} height={16} /> },
          { id: 'workers', label: 'Sync Workers & DLQ', icon: <RotateCwIcon width={16} height={16} /> },
          { id: 'ratelimits', label: 'Rate Limiting & Circuit Breakers', icon: <ShieldCheckIcon width={16} height={16} /> },
          { id: 'costs', label: 'Hosting Unit Economics', icon: <DollarSignIcon width={16} height={16} /> },
          { id: 'incidents', label: 'Platform Incidents', icon: <AlertTriangleIcon width={16} height={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === tab.id ? '#60a5fa' : 'var(--color-text-muted, #94a3b8)',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Platform Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          {/* Internal Telemetry Dials */}
          <Card>
            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                <CpuIcon width={18} height={18} style={{ color: '#3b82f6' }} />
                Platform Runtime & Resource Consumption
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Container CPU Utilization</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', margin: '4px 0' }}>
                    {metrics?.cpuUsagePercent}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Allocated: 2.0 vCPU quota</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Node.js Memory Footprint</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b82f6', margin: '4px 0' }}>
                    {metrics?.memoryUsageMb.toFixed(1)} MB
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{metrics?.memoryUsagePercent}% of 1024 MB limit</div>
                </div>
              </div>

              <div style={{ fontSize: '0.875rem', fontWeight: 600, margin: '16px 0 8px' }}>Internal Queues & Backpressure</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {metrics?.queues.map((q) => (
                  <div
                    key={q.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{q.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Rate: {q.processingRatePerSec}/s | Avg Wait: {q.avgWaitTimeMs}ms</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: q.depth > 50 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: q.depth > 50 ? '#ef4444' : '#10b981',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        Depth: {q.depth}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Core Subsystem Component Health */}
          <Card>
            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                <ShieldCheckIcon width={18} height={18} style={{ color: '#10b981' }} />
                Platform Core Subsystem Health
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {health?.components.map((comp) => (
                  <div
                    key={comp.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{comp.name}</div>
                      <StatusBadge status={comp.status === 'HEALTHY' ? 'healthy' : 'degraded'} label={comp.status} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>{comp.message}</div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#64748b' }}>
                      <span>Latency: <strong>{comp.latencyMs}ms</strong></span>
                      <span>Uptime: <strong>{comp.uptimePercent}%</strong></span>
                      <span>Error Rate: <strong>{comp.errorRatePercent}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Dependencies */}
      {activeTab === 'dependencies' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
          {/* Database Connection Pool */}
          <Card>
            <div style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DatabaseIcon width={18} height={18} style={{ color: '#3b82f6' }} />
                Database Pool & Storage Engine
              </h4>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '14px' }}>
                Status: <StatusBadge status="healthy" label="HEALTHY" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Query Latency</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{health?.dependencies.database.latencyMs} ms</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pool Connections</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                    {health?.dependencies.database.connectionPoolActive} active / {health?.dependencies.database.connectionPoolMax} max
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* OTLP Telemetry Ingestion Engine */}
          <Card>
            <div style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ActivityIcon width={18} height={18} style={{ color: '#10b981' }} />
                OpenTelemetry Ingestion Engine
              </h4>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '14px' }}>
                Receiver: Port {health?.dependencies.telemetryEngine.otlpReceiverPort} (OTLP/HTTP & gRPC)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ingestion Rate</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{health?.dependencies.telemetryEngine.ingestionRatePerSec} req/s</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ring Buffer</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{health?.dependencies.telemetryEngine.bufferUtilizationPercent}% used</div>
                </div>
              </div>
            </div>
          </Card>

          {/* In-Memory TSDBs */}
          <Card>
            <div style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayersIcon width={18} height={18} style={{ color: '#8b5cf6' }} />
                Prometheus / Loki / Tempo TSDBs
              </h4>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '14px' }}>
                In-Memory TSDB Buffer: {health?.dependencies.inMemoryTsdb.memoryUsageMb} MB
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Metrics</div>
                  <div style={{ fontWeight: 700 }}>{health?.dependencies.inMemoryTsdb.metricsCount.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Logs</div>
                  <div style={{ fontWeight: 700 }}>{health?.dependencies.inMemoryTsdb.logsCount.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Traces</div>
                  <div style={{ fontWeight: 700 }}>{health?.dependencies.inMemoryTsdb.tracesCount.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Multi-Cloud Provider Adapters */}
          <Card>
            <div style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ZapIcon width={18} height={18} style={{ color: '#f59e0b' }} />
                Connected Cloud Adapters
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { name: 'AWS CloudWatch & SecurityHub', data: health?.dependencies.cloudAdapters.aws },
                  { name: 'Azure Resource Graph & Monitor', data: health?.dependencies.cloudAdapters.azure },
                  { name: 'GCP Cloud Operations & SCC', data: health?.dependencies.cloudAdapters.gcp },
                  { name: 'Kubernetes API Server (EKS)', data: health?.dependencies.cloudAdapters.kubernetes }
                ].map((p) => (
                  <div
                    key={p.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '8px 12px',
                      borderRadius: '4px'
                    }}
                  >
                    <span style={{ fontSize: '0.85rem' }}>{p.name}</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: p.data?.status === 'CONNECTED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                        color: p.data?.status === 'CONNECTED' ? '#10b981' : '#94a3b8'
                      }}
                    >
                      {p.data?.status} {p.data?.latencyMs ? `(${p.data.latencyMs}ms)` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: SLOs & Error Budgets */}
      {activeTab === 'slos' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
            {slos.map((slo) => (
              <Card key={slo.id}>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{slo.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{slo.id} | Tier: {slo.tier}</div>
                    </div>
                    <StatusBadge status={slo.status === 'HEALTHY' ? 'healthy' : 'degraded'} label={slo.status} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '12px 0 6px' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{slo.actualPercent}%</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Target: {slo.targetPercent}% ({slo.windowDays}d window)</div>
                  </div>

                  {/* Error Budget Bar */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                      <span>Error Budget Remaining</span>
                      <span>{slo.errorBudgetRemainingPercent}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${slo.errorBudgetRemainingPercent}%`,
                          height: '100%',
                          background: slo.errorBudgetRemainingPercent > 30 ? '#10b981' : '#f59e0b',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>1h Burn: <strong>{slo.burnRate1h}x</strong></span>
                    <span>24h Burn: <strong>{slo.burnRate24h}x</strong></span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Sync Workers & DLQ */}
      {activeTab === 'workers' && (
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 16px' }}>Multi-Cloud Synchronization Background Workers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {workers.map((w) => (
              <Card key={w.id}>
                <div style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{w.name}</div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa'
                      }}
                    >
                      {w.provider}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px' }}>
                    Status: <strong style={{ color: '#10b981' }}>{w.status}</strong> | Checkpoint: {w.checkpointId}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                    <div>Last Run: {new Date(w.lastRunAt).toLocaleTimeString()}</div>
                    <div>Next Run: {new Date(w.nextRunAt).toLocaleTimeString()}</div>
                    <div>Duration: {w.runDurationMs}ms</div>
                    <div>Success: {w.successRate}%</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <h3 style={{ fontSize: '1.1rem', margin: '0 0 16px' }}>Dead Letter Queue (DLQ) & Failed Task Ledger</h3>
          <Card>
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
              <CheckCircleIcon width={36} height={36} style={{ color: '#10b981', margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, fontSize: '1rem', color: '#fff' }}>DLQ is Empty</div>
              <div style={{ fontSize: '0.85rem' }}>All multi-cloud background tasks and sync jobs completed without unrecoverable errors.</div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Rate Limiting & Circuit Breakers */}
      {activeTab === 'ratelimits' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          <Card>
            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Differentiated Rate Limiting Policies</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { tier: 'AUTH', desc: 'Login, Password Reset & Token Issuance', limit: '10 req / min' },
                  { tier: 'CLOUD_CONNECT', desc: 'Cloud Account Connection & Verification', limit: '20 req / min' },
                  { tier: 'SEARCH_GRAPH', desc: 'Knowledge Graph Traversal & Global Search', limit: '60 req / min' },
                  { tier: 'AI_ANALYST', desc: 'Natural Language Executive Briefings', limit: '15 req / min' },
                  { tier: 'DEFAULT', desc: 'General Telemetry & Dashboard APIs', limit: '120 req / min' }
                ].map((r) => (
                  <div
                    key={r.tier}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.tier} Tier</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.desc}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#3b82f6', fontSize: '0.85rem' }}>{r.limit}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Cloud SDK Circuit Breakers</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {rateLimits?.circuitBreakers.map((cb) => (
                  <div
                    key={cb.target}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cb.target}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Failures: {cb.failureCount} / 5 Threshold</div>
                    </div>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: cb.state === 'CLOSED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: cb.state === 'CLOSED' ? '#10b981' : '#ef4444'
                      }}
                    >
                      {cb.state}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 6: Platform Infrastructure Costs */}
      {activeTab === 'costs' && (
        <Card>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>CloudPulse Platform Hosting Unit Economics</h3>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Infrastructure spend consumed by CloudPulse's own compute, databases, TSDB storage, and AI calls.
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Month-to-Date</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                  ${costs?.totalMonthToDateUsd.toFixed(2)}
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '10px 12px' }}>Category</th>
                    <th style={{ padding: '10px 12px' }}>Resource Description</th>
                    <th style={{ padding: '10px 12px' }}>Rate ($/hr)</th>
                    <th style={{ padding: '10px 12px' }}>Month-to-Date ($)</th>
                    <th style={{ padding: '10px 12px' }}>Provenance</th>
                    <th style={{ padding: '10px 12px' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {costs?.breakdown.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{item.category}</td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{item.resourceName}</td>
                      <td style={{ padding: '12px' }}>${item.costUsdPerHour.toFixed(3)}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>${item.costUsdMonthToDate.toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa'
                          }}
                        >
                          {item.provenance}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: item.trendPercent <= 0 ? '#10b981' : '#f59e0b' }}>
                        {item.trendPercent > 0 ? `+${item.trendPercent}%` : `${item.trendPercent}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 7: Platform Incidents */}
      {activeTab === 'incidents' && (
        <Card>
          <div style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Internal Platform Operational Incidents</h3>
            {incidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                <CheckCircleIcon width={32} height={32} style={{ color: '#10b981', margin: '0 auto 8px' }} />
                <div>Zero active or historical platform incidents.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '16px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <SeverityBadge severity={inc.severity === 'P0_CRITICAL' ? 'critical' : inc.severity === 'P1_HIGH' ? 'high' : 'medium'} />
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{inc.title}</span>
                      </div>
                      <StatusBadge status={inc.status === 'RESOLVED' ? 'resolved' : 'degraded'} label={inc.status} />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px' }}>{inc.impactSummary}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                      <strong>Root Cause:</strong> {inc.rootCause}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      <strong>Remediation:</strong> {inc.remediationAction}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Schedule Maintenance Modal */}
      {showMaintModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: '#1e293b',
              padding: '24px',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '500px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem' }}>Schedule Platform Maintenance</h3>
            <form onSubmit={handleScheduleMaintenance}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Maintenance Title
                </label>
                <input
                  type="text"
                  value={maintTitle}
                  onChange={(e) => setMaintTitle(e.target.value)}
                  placeholder="e.g. Database Index Optimization"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Reason & Impact Details
                </label>
                <textarea
                  value={maintReason}
                  onChange={(e) => setMaintReason(e.target.value)}
                  placeholder="Describe operational reasons and expected duration"
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Scope
                </label>
                <select
                  value={maintScope}
                  onChange={(e) => setMaintScope(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="DATABASE_MIGRATION">Database Migration</option>
                  <option value="BACKGROUND_SYNC">Background Sync Maintenance</option>
                  <option value="AI_SUBSYSTEM">AI Subsystem Upgrade</option>
                  <option value="FULL_PLATFORM">Full Platform Maintenance</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: '1px solid #475569',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: '#3b82f6',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformObservabilityPage;

