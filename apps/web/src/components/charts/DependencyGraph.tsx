import React from 'react';
import type { Service } from '@cloudpulse/shared';
import { StatusBadge } from '../ui/StatusBadge.tsx';

interface DependencyGraphProps {
  currentService: Service;
  allServices: Service[];
  onSelectService?: (serviceId: string) => void;
}

export function DependencyGraph({ currentService, allServices, onSelectService }: DependencyGraphProps) {
  // Upstream callers (services that have currentService in their dependencies)
  const upstreams = allServices.filter((s) =>
    s.dependencies.some((d) => d.targetServiceId === currentService.id || d.targetServiceName === currentService.name)
  );

  // Downstream targets (currentService's dependencies)
  const downstreams = currentService.dependencies;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 20px',
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        minHeight: '220px',
        gap: '24px',
        overflowX: 'auto',
      }}
    >
      {/* Upstream Callers Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '180px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Upstream Callers ({upstreams.length})
        </div>
        {upstreams.length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
            No upstream microservices (Edge Ingress)
          </div>
        ) : (
          upstreams.map((u) => (
            <div
              key={u.id}
              onClick={() => onSelectService && onSelectService(u.id)}
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                cursor: onSelectService ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {u.name}
                </span>
                <StatusBadge status={u.status} showDot={false} size="sm" />
              </div>
              <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {u.requestRate} req/s · {u.errorRate}% err
              </span>
            </div>
          ))
        )}
      </div>

      {/* SVG Connecting Flow Arrow Left */}
      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--border-strong)', flexShrink: 0 }}>
        <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
          <path d="M4 12 H40 M32 4 L40 12 L32 20" stroke="var(--brand)" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* Center Focus Node: Current Service */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-elevated)',
          border: '2px solid var(--brand)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 0 20px var(--brand-glow)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          minWidth: '220px',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff' }}>
            {currentService.name}
          </span>
          <StatusBadge status={currentService.status} size="sm" />
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          {currentService.description}
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>{currentService.requestRate} req/s</span>
          <span>{currentService.errorRate}% err</span>
          <span>{currentService.latencyP99Ms}ms p99</span>
        </div>
      </div>

      {/* SVG Connecting Flow Arrow Right */}
      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--border-strong)', flexShrink: 0 }}>
        <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
          <path d="M4 12 H40 M32 4 L40 12 L32 20" stroke="var(--brand)" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* Downstream Dependencies Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Downstream Dependencies ({downstreams.length})
        </div>
        {downstreams.length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
            No downstream dependencies
          </div>
        ) : (
          downstreams.map((d) => (
            <div
              key={d.targetServiceId}
              onClick={() => onSelectService && onSelectService(d.targetServiceId)}
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                cursor: onSelectService ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {d.targetServiceName}
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontFamily: 'var(--font-mono)',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  {d.type}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                <span>{d.callRateRps} rps</span>
                <span style={{ color: d.errorRatePercent > 5 ? 'var(--status-critical)' : 'var(--text-muted)' }}>
                  {d.errorRatePercent}% err
                </span>
                <span>{d.p99LatencyMs}ms p99</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
