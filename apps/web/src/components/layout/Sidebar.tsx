import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  OverviewIcon,
  ServicesIcon,
  MetricsIcon,
  LogsIcon,
  TracesIcon,
  AlertsIcon,
  IncidentsIcon,
  SlosIcon,
  InfrastructureIcon,
  SettingsIcon,
  SystemStatusIcon,
  ShieldIcon,
  OrganizationIcon,
  DollarSignIcon,
  TopologyIcon,
  SparklesIcon,
} from '../ui/Icons.tsx';

interface NavItemConfig {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  badgeSeverity?: 'critical' | 'warning' | 'info';
}

const OBSERVE_ITEMS: NavItemConfig[] = [
  { path: '/overview', label: 'Global Command Center', icon: <OverviewIcon /> },
  { path: '/decisions', label: 'Executive Decisions', icon: <SparklesIcon />, badge: 3, badgeSeverity: 'warning' },
  { path: '/operations', label: 'Operations Control Plane', icon: <SparklesIcon />, badge: 3, badgeSeverity: 'critical' },
  { path: '/aws-observability', label: 'AWS Observability', icon: <MetricsIcon />, badge: 1, badgeSeverity: 'warning' },
  { path: '/services', label: 'Services', icon: <ServicesIcon /> },
  { path: '/metrics', label: 'Metrics Explorer', icon: <MetricsIcon /> },
  { path: '/logs', label: 'Log Stream', icon: <LogsIcon /> },
  { path: '/traces', label: 'Tracing & Spans', icon: <TracesIcon /> },
];

const RELIABILITY_ITEMS: NavItemConfig[] = [
  { path: '/sre', label: 'SRE & Reliability Control', icon: <SparklesIcon />, badge: 2, badgeSeverity: 'warning' },
  { path: '/resilience', label: 'Resilience & DR Control', icon: <TopologyIcon />, badge: 2, badgeSeverity: 'critical' },
  { path: '/alerts', label: 'Alert Center', icon: <AlertsIcon />, badge: 3, badgeSeverity: 'critical' },
  { path: '/incidents', label: 'Incidents', icon: <IncidentsIcon />, badge: 1, badgeSeverity: 'critical' },
  { path: '/aws-incidents', label: 'AWS Incident RCA', icon: <IncidentsIcon />, badge: 1, badgeSeverity: 'warning' },
  { path: '/aws-predictive', label: 'AWS Early Warnings', icon: <SparklesIcon />, badge: 3, badgeSeverity: 'info' },
  { path: '/slos', label: 'SLOs & Budgets', icon: <SlosIcon />, badge: 2, badgeSeverity: 'warning' },
];

const SECURITY_ITEMS: NavItemConfig[] = [
  { path: '/security', label: 'Security & Posture', icon: <ShieldIcon />, badge: 1, badgeSeverity: 'warning' },
  { path: '/aws-governance', label: 'AWS Governance & Rules', icon: <ShieldIcon />, badge: 1, badgeSeverity: 'warning' },
  { path: '/aws-drift', label: 'AWS Drift & Baselines', icon: <TopologyIcon />, badge: 1, badgeSeverity: 'warning' },
  { path: '/aws-remediation', label: 'AWS Remediation Plans', icon: <ShieldIcon />, badge: 1, badgeSeverity: 'warning' },
  { path: '/aws-auto-healing', label: 'AWS Auto-Healing & Repair', icon: <TopologyIcon />, badge: 2, badgeSeverity: 'info' },
  { path: '/aws-simulator', label: 'AWS Policy Simulator', icon: <ShieldIcon />, badge: 2, badgeSeverity: 'info' },
  { path: '/aws-governance-intelligence', label: 'Governance Intelligence', icon: <ShieldIcon />, badge: 1, badgeSeverity: 'warning' },
  { path: '/aws-governance-decisions', label: 'Governance Decisions', icon: <TopologyIcon />, badge: 1, badgeSeverity: 'warning' },
  { path: '/aws-knowledge-graph', label: 'Knowledge Graph', icon: <TopologyIcon />, badge: 5, badgeSeverity: 'info' },
  { path: '/investigate', label: 'Cloud Investigation', icon: <SparklesIcon />, badge: 3, badgeSeverity: 'info' },
];

const INFRASTRUCTURE_ITEMS: NavItemConfig[] = [
  { path: '/cloud-overview', label: 'Multi-Cloud Overview', icon: <OrganizationIcon />, badge: 3, badgeSeverity: 'info' },
  { path: '/kubernetes', label: 'Kubernetes Clusters', icon: <InfrastructureIcon />, badge: 1, badgeSeverity: 'warning' },
  { path: '/infrastructure', label: 'Infrastructure', icon: <InfrastructureIcon /> },
  { path: '/aws-topology', label: 'AWS Topology & Blast', icon: <TopologyIcon />, badge: 4, badgeSeverity: 'info' },
  { path: '/accounts', label: 'AWS Accounts & Orgs', icon: <OrganizationIcon />, badge: 4, badgeSeverity: 'info' },
  { path: '/finops', label: 'FinOps & Economics', icon: <DollarSignIcon />, badge: 3, badgeSeverity: 'info' },
];

const WORKFLOW_ITEMS: NavItemConfig[] = [
  { path: '/work', label: 'Work Items & Collaboration', icon: <SparklesIcon />, badge: 3, badgeSeverity: 'warning' },
  { path: '/changes/calendar', label: 'Governed Changes & Freezes', icon: <TopologyIcon />, badge: 1, badgeSeverity: 'info' },
  { path: '/notifications', label: 'Notification Center', icon: <AlertsIcon />, badge: 1, badgeSeverity: 'info' },
];

const SYSTEM_ITEMS: NavItemConfig[] = [
  { path: '/platform', label: 'Platform Health & Ops', icon: <SystemStatusIcon /> },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
  { path: '/system-status', label: 'System Status', icon: <SystemStatusIcon /> },
];

export function Sidebar() {
  const renderNavGroup = (title: string, items: NavItemConfig[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '16px' }}>
      <div
        style={{
          padding: '0 16px 6px',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {title}
      </div>
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '7px 16px',
            fontSize: '12.5px',
            fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent',
            transition: 'background-color 0.1s, color 0.1s',
            userSelect: 'none',
          })}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'inherit',
              opacity: 0.9,
            }}
          >
            {item.icon}
          </span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.label}
          </span>
          {item.badge !== undefined && item.badge > 0 && (
            <span
              style={{
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: '#fff',
                backgroundColor:
                  item.badgeSeverity === 'critical'
                    ? 'var(--status-critical)'
                    : item.badgeSeverity === 'warning'
                    ? 'var(--status-warning)'
                    : 'var(--brand)',
              }}
            >
              {item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        height: '100vh',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
      }}
    >
      {/* Platform Branding */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 16px',
          height: 'var(--header-height)',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px var(--brand-glow)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', color: '#fff' }}>
              CLOUDPULSE
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                padding: '1px 4px',
                borderRadius: '3px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: 'var(--brand)',
              }}
            >
              SRE
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
            Cloud Observability
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ flex: 1, padding: '14px 0', overflowY: 'auto' }}>
        {renderNavGroup('Workflow & Approvals', WORKFLOW_ITEMS)}
        {renderNavGroup('Observe', OBSERVE_ITEMS)}
        {renderNavGroup('Reliability', RELIABILITY_ITEMS)}
        {renderNavGroup('Security', SECURITY_ITEMS)}
        {renderNavGroup('Infrastructure', INFRASTRUCTURE_ITEMS)}
        {renderNavGroup('System', SYSTEM_ITEMS)}
      </div>

      {/* Sidebar Footer: System Status & Portfolio Creator */}
      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-canvas)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot" />
            <span style={{ fontSize: '11px', color: 'var(--status-healthy)', fontWeight: 600 }}>
              Operational
            </span>
          </div>
          <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            v1.0.0 (FINAL)
          </span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Created by <strong>Jesse Silvanus</strong></span>
        </div>
      </div>
    </aside>
  );
}
