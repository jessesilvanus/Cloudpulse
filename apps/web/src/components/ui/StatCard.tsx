import React, { type ReactNode } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from './Icons.tsx';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  changePercent?: number;
  changePeriod?: string;
  status?: 'healthy' | 'warning' | 'critical' | 'info' | 'neutral';
  sparkline?: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  unit,
  subValue,
  changePercent,
  changePeriod = 'vs last period',
  status = 'neutral',
  sparkline,
  icon,
  onClick,
}: StatCardProps) {
  let valueColor = 'var(--text-primary)';
  let accentBorder = 'var(--border-subtle)';

  switch (status) {
    case 'healthy':
      valueColor = 'var(--status-healthy)';
      accentBorder = 'rgba(16, 185, 129, 0.25)';
      break;
    case 'warning':
      valueColor = 'var(--status-warning)';
      accentBorder = 'rgba(245, 158, 11, 0.25)';
      break;
    case 'critical':
      valueColor = 'var(--status-critical)';
      accentBorder = 'rgba(239, 68, 68, 0.30)';
      break;
    case 'info':
      valueColor = 'var(--status-info)';
      accentBorder = 'rgba(14, 165, 233, 0.25)';
      break;
  }

  const isPositiveTrend = changePercent !== undefined && changePercent > 0;
  const isZeroTrend = changePercent === 0;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: `1px solid ${accentBorder}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: 0,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.12s, border-color 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        {icon && <span style={{ color: 'var(--text-muted)', display: 'flex' }}>{icon}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '22px',
            fontWeight: 700,
            lineHeight: 1.1,
            color: valueColor,
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {unit}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', gap: '8px' }}>
        {changePercent !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: isZeroTrend
                ? 'var(--text-muted)'
                : isPositiveTrend
                ? 'var(--status-warning)'
                : 'var(--status-healthy)',
            }}
          >
            {isPositiveTrend ? <ArrowUpIcon /> : <ArrowDownIcon />}
            <span>{Math.abs(changePercent)}%</span>
            <span style={{ color: 'var(--text-subtle)', marginLeft: '3px', fontFamily: 'var(--font-sans)', fontSize: '10.5px' }}>
              {changePeriod}
            </span>
          </div>
        )}

        {subValue && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subValue}
          </span>
        )}

        {sparkline && <div style={{ marginLeft: 'auto' }}>{sparkline}</div>}
      </div>
    </div>
  );
}

interface CardProps {
  title?: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  padding?: string;
  style?: React.CSSProperties;
}

export function Card({ title, subtitle, badge, actions, children, padding = '16px', style }: CardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minWidth: 0,
        ...style,
      }}
    >
      {(title || actions || subtitle) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
            paddingBottom: subtitle ? '0' : '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {title && (
              <h3
                style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  margin: 0,
                }}
              >
                {title}
              </h3>
            )}
            {badge}
          </div>
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{actions}</div>}
        </div>
      )}

      {subtitle && (
        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
          {subtitle}
        </p>
      )}

      {children}
    </div>
  );
}
