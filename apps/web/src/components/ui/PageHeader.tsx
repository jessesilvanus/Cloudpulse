import React, { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, subtitle, badge, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              <span style={{ color: i === breadcrumbs.length - 1 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                {b.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1
            style={{
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {title}
          </h1>
          {badge}
        </div>

        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>

      {subtitle && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

export function SectionHeader({ title, subtitle, badge, actions }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h2
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
        </h2>
        {badge}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {subtitle && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{subtitle}</span>}
        {actions}
      </div>
    </div>
  );
}
