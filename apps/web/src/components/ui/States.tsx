import React, { type ReactNode } from 'react';
import { RefreshIcon, AlertTriangleIcon } from './Icons.tsx';

export function LoadingState({ message = 'Fetching telemetry signals...' }: { message?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '12px',
        color: 'var(--text-muted)',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          border: '2px solid var(--border-subtle)',
          borderTopColor: 'var(--brand)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{message}</span>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function EmptyState({
  title = 'No Telemetry Available',
  description = 'No signals matched your active filters or time window.',
  action,
  icon,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        gap: '8px',
      }}
    >
      <div style={{ color: 'var(--text-subtle)', marginBottom: '4px' }}>
        {icon || <AlertTriangleIcon />}
      </div>
      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
        {title}
      </h4>
      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', maxWidth: '380px', margin: 0 }}>
        {description}
      </p>
      {action && <div style={{ marginTop: '10px' }}>{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Telemetry Ingestion Error',
  message = 'Failed to load telemetry from endpoint.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        textAlign: 'center',
        gap: '8px',
        backgroundColor: 'var(--status-critical-bg)',
        border: '1px solid var(--status-critical-border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <span style={{ color: 'var(--status-critical)' }}>
        <AlertTriangleIcon />
      </span>
      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--status-critical)', margin: 0 }}>
        {title}
      </h4>
      <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', maxWidth: '420px', margin: 0 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            padding: '5px 12px',
            fontSize: '11.5px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
        >
          <RefreshIcon /> Retry Query
        </button>
      )}
    </div>
  );
}
