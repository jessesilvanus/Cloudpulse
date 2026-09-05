import React from 'react';
import type { ServiceStatus, SloStatus } from '@cloudpulse/shared';

type StatusType = ServiceStatus | SloStatus | 'operational' | 'down' | 'active' | 'resolved' | 'pending';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, showDot = true, size = 'sm' }: StatusBadgeProps) {
  let colorClass = 'var(--status-neutral)';
  let bgClass = 'var(--status-neutral-bg)';
  let borderClass = 'rgba(255, 255, 255, 0.08)';
  let displayLabel = label || status;

  switch (status) {
    case 'healthy':
    case 'met':
    case 'operational':
    case 'resolved':
      colorClass = 'var(--status-healthy)';
      bgClass = 'var(--status-healthy-bg)';
      borderClass = 'var(--status-healthy-border)';
      displayLabel = label || (status === 'met' ? 'SLO Met' : 'Healthy');
      break;
    case 'degraded':
    case 'at_risk':
    case 'pending':
      colorClass = 'var(--status-warning)';
      bgClass = 'var(--status-warning-bg)';
      borderClass = 'var(--status-warning-border)';
      displayLabel = label || (status === 'at_risk' ? 'At Risk' : 'Degraded');
      break;
    case 'unhealthy':
    case 'breached':
    case 'down':
      colorClass = 'var(--status-critical)';
      bgClass = 'var(--status-critical-bg)';
      borderClass = 'var(--status-critical-border)';
      displayLabel = label || (status === 'breached' ? 'Breached' : 'Unhealthy');
      break;
  }

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '5px' : '6px',
        padding: isSmall ? '2px 7px' : '4px 9px',
        borderRadius: 'var(--radius-sm)',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: 600,
        lineHeight: 1.4,
        color: colorClass,
        backgroundColor: bgClass,
        border: `1px solid ${borderClass}`,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {showDot && (
        <span
          style={{
            width: isSmall ? '6px' : '7px',
            height: isSmall ? '6px' : '7px',
            borderRadius: '50%',
            backgroundColor: colorClass,
            flexShrink: 0,
          }}
        />
      )}
      {displayLabel}
    </span>
  );
}
