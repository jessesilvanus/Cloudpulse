import React from 'react';
import type { AlertSeverity, IncidentSeverity } from '@cloudpulse/shared';

type SeverityType = AlertSeverity | IncidentSeverity;

interface SeverityBadgeProps {
  severity: SeverityType;
  label?: string;
  size?: 'sm' | 'md';
}

export function SeverityBadge({ severity, label, size = 'sm' }: SeverityBadgeProps) {
  let color = 'var(--text-muted)';
  let bg = 'var(--status-neutral-bg)';
  let border = 'rgba(255, 255, 255, 0.08)';

  switch (severity) {
    case 'critical':
    case 'sev1':
      color = 'var(--status-critical)';
      bg = 'var(--status-critical-bg)';
      border = 'var(--status-critical-border)';
      break;
    case 'high':
    case 'sev2':
      color = '#f97316';
      bg = 'rgba(249, 115, 22, 0.12)';
      border = 'rgba(249, 115, 22, 0.30)';
      break;
    case 'medium':
    case 'sev3':
      color = 'var(--status-warning)';
      bg = 'var(--status-warning-bg)';
      border = 'var(--status-warning-border)';
      break;
    case 'low':
    case 'sev4':
      color = 'var(--status-info)';
      bg = 'var(--status-info-bg)';
      border = 'var(--status-info-border)';
      break;
    case 'info':
      color = 'var(--text-muted)';
      bg = 'var(--bg-subtle)';
      border = 'var(--border-subtle)';
      break;
  }

  const isSmall = size === 'sm';
  const displayLabel = label || severity.toUpperCase();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isSmall ? '1px 6px' : '3px 8px',
        borderRadius: 'var(--radius-sm)',
        fontSize: isSmall ? '10.5px' : '11.5px',
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        lineHeight: 1.4,
        color,
        backgroundColor: bg,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {displayLabel}
    </span>
  );
}
