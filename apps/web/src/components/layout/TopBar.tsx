import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SearchIcon, RefreshIcon } from '../ui/Icons.tsx';
import { TIME_RANGES, REFRESH_INTERVALS } from '@cloudpulse/shared';
import { useAuth } from '../../context/AuthContext.tsx';

interface TopBarProps {
  onOpenCommandPalette: () => void;
  onRefresh?: () => void;
  refreshInterval: number;
  onRefreshIntervalChange: (interval: number) => void;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const ROUTE_TITLES: Record<string, string> = {
  '/overview': 'Operational Overview',
  '/services': 'Services Catalog & Dependencies',
  '/metrics': 'Metrics Explorer',
  '/logs': 'Log Aggregator & Stream',
  '/traces': 'Distributed Tracing & Spans',
  '/alerts': 'Alert Management & Rules',
  '/incidents': 'Incident Command Center',
  '/slos': 'SLOs & Error Budgets',
  '/infrastructure': 'Infrastructure & Cloud Topology',
  '/settings': 'Platform Settings & Simulation',
  '/system-status': 'System Internal Status',
};

function getRouteTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith('/services/')) return 'Service Deep Inspection';
  if (pathname.startsWith('/traces/')) return 'Distributed Trace Waterfall';
  if (pathname.startsWith('/alerts/')) return 'Alert Rule Inspector';
  if (pathname.startsWith('/incidents/')) return 'Incident Workspace';
  if (pathname.startsWith('/slos/')) return 'SLO Objective Detail';
  return 'CloudPulse';
}

export function TopBar({
  onOpenCommandPalette,
  onRefresh,
  refreshInterval,
  onRefreshIntervalChange,
  timeRange,
  onTimeRangeChange,
}: TopBarProps) {
  const { pathname } = useLocation();
  const title = getRouteTitle(pathname);

  const [utcTime, setUtcTime] = useState<string>('');
  const [telemetryMode, setTelemetryMode] = useState<'live' | 'demo'>('live');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);

    // Fetch active telemetry mode
    fetch('http://localhost:3001/api/v1/telemetry/status')
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.mode) setTelemetryMode(d.data.mode);
      })
      .catch(() => {});

    return () => clearInterval(interval);
  }, []);

  const toggleMode = async () => {
    const nextMode = telemetryMode === 'live' ? 'demo' : 'live';
    try {
      await fetch('http://localhost:3001/api/v1/telemetry/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: nextMode }),
      });
      setTelemetryMode(nextMode);
      if (onRefresh) onRefresh();
    } catch {
      // Ignore in dev
    }
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        gap: '14px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left: Breadcrumbs & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>CloudPulse</span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </span>
        </div>

        {/* Telemetry Mode Toggle Badge */}
        <button
          onClick={toggleMode}
          title="Click to toggle between LIVE and DEMO telemetry mode"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '10px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            backgroundColor: telemetryMode === 'live' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
            color: telemetryMode === 'live' ? 'var(--status-healthy)' : 'var(--text-muted)',
            border: `1px solid ${telemetryMode === 'live' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: telemetryMode === 'live' ? 'var(--status-healthy)' : 'var(--text-muted)',
            }}
          />
          {telemetryMode === 'live' ? 'LIVE LOCAL TELEMETRY' : 'DEMO TELEMETRY'}
        </button>
      </div>

      {/* Center: Command / Search Quick Bar */}
      <button
        onClick={onOpenCommandPalette}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-muted)',
          fontSize: '12px',
          width: '300px',
          maxWidth: '320px',
          textAlign: 'left',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
      >
        <SearchIcon />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Search services, metrics, logs, traces...
        </span>
        <kbd
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            padding: '1px 5px',
            borderRadius: '3px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Right: Controls, Auto-refresh & Live Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* Time Window Select */}
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
          style={{
            padding: '4px 8px',
            fontSize: '11.5px',
            fontFamily: 'var(--font-mono)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {TIME_RANGES.map((r) => (
            <option key={r.value} value={r.value} style={{ backgroundColor: 'var(--bg-elevated)' }}>
              {r.label}
            </option>
          ))}
        </select>

        {/* Auto Refresh Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <select
            value={refreshInterval}
            onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
            style={{
              padding: '4px 6px',
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {REFRESH_INTERVALS.map((int) => (
              <option key={int.value} value={int.value} style={{ backgroundColor: 'var(--bg-elevated)' }}>
                {int.label}
              </option>
            ))}
          </select>

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Manual Refresh"
              style={{
                padding: '5px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <RefreshIcon />
            </button>
          )}
        </div>

        {/* UTC Clock */}
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            paddingLeft: '4px',
          }}
        >
          {utcTime}
        </span>

        {/* User Identity & Logout */}
        <UserHeaderProfile />
      </div>
    </header>
  );
}

function UserHeaderProfile() {
  const { user, workspace, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="btn btn-primary btn-sm"
        style={{ fontSize: '11px', padding: '4px 10px' }}
      >
        Sign In
      </button>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '10px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {user.name}
        </span>
        <span style={{ fontSize: '9.5px', color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>
          {user.role} · {workspace?.name || 'Workspace'}
        </span>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        title="Sign Out of CLOUDPULSE"
        style={{
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          fontSize: '11px',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--status-critical)';
          e.currentTarget.style.borderColor = 'var(--status-critical)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
