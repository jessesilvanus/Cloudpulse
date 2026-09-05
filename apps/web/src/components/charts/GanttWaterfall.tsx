import React, { useState } from 'react';
import type { Trace, Span } from '@cloudpulse/shared';
import { Drawer } from '../ui/Drawer.tsx';
import { SeverityBadge } from '../ui/SeverityBadge.tsx';

interface GanttWaterfallProps {
  trace: Trace;
}

export function GanttWaterfall({ trace }: GanttWaterfallProps) {
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(null);

  const flattenSpans = (spans: Span[], depth = 0): { span: Span; depth: number }[] => {
    const list: { span: Span; depth: number }[] = [];
    for (const s of spans) {
      list.push({ span: s, depth });
      if (s.children && s.children.length > 0) {
        list.push(...flattenSpans(s.children, depth + 1));
      }
    }
    return list;
  };

  const allSpans = flattenSpans(trace.spans);
  const totalDuration = trace.durationMs || 1;

  // Service colors map
  const getServiceColor = (name: string) => {
    switch (name) {
      case 'api-gateway': return '#3b82f6';
      case 'auth-service': return '#10b981';
      case 'order-service': return '#f59e0b';
      case 'payment-service': return '#ef4444';
      case 'inventory-service': return '#0ea5e9';
      default: return '#8b5cf6';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
      {/* Trace Timeline Ruler */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-subtle)',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          padding: '6px 12px',
        }}
      >
        <div style={{ width: '320px', flexShrink: 0, fontWeight: 700 }}>SERVICE & OPERATION</div>
        <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
          <span>0ms</span>
          <span>{(totalDuration * 0.25).toFixed(0)}ms</span>
          <span>{(totalDuration * 0.50).toFixed(0)}ms</span>
          <span>{(totalDuration * 0.75).toFixed(0)}ms</span>
          <span>{totalDuration}ms</span>
        </div>
      </div>

      {/* Spans List */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {allSpans.map(({ span, depth }) => {
          const isError = span.statusCode === 'ERROR';
          const offsetPercent = (span.startOffsetMs / totalDuration) * 100;
          const widthPercent = Math.max(1.5, (span.durationMs / totalDuration) * 100);
          const serviceColor = getServiceColor(span.serviceName);

          return (
            <div
              key={span.id}
              onClick={() => setSelectedSpan(span)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                backgroundColor: selectedSpan?.id === span.id ? 'var(--bg-active)' : 'transparent',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={(e) => {
                if (selectedSpan?.id !== span.id) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (selectedSpan?.id !== span.id) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Service & Operation Label */}
              <div
                style={{
                  width: '320px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  paddingLeft: `${depth * 16}px`,
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '2px',
                    backgroundColor: serviceColor,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {span.serviceName}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: isError ? 'var(--status-critical)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={span.name}
                >
                  {span.name}
                </span>
              </div>

              {/* Gantt Bar Timeline */}
              <div style={{ flex: 1, position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
                {/* Background grid line markers */}
                <div style={{ position: 'absolute', left: '25%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255,255,255,0.03)' }} />
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255,255,255,0.03)' }} />
                <div style={{ position: 'absolute', left: '75%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255,255,255,0.03)' }} />

                {/* Timeline Duration Bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${offsetPercent}%`,
                    width: `${widthPercent}%`,
                    height: '14px',
                    borderRadius: '3px',
                    backgroundColor: isError ? 'var(--status-critical)' : serviceColor,
                    opacity: 0.85,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 4px',
                    minWidth: '4px',
                  }}
                >
                  {widthPercent > 10 && (
                    <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono)', color: '#fff', fontWeight: 600 }}>
                      {span.durationMs}ms
                    </span>
                  )}
                </div>

                {widthPercent <= 10 && (
                  <span
                    style={{
                      position: 'absolute',
                      left: `calc(${offsetPercent + widthPercent}% + 6px)`,
                      fontSize: '9.5px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {span.durationMs}ms
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Span Detail Drawer */}
      <Drawer
        isOpen={selectedSpan !== null}
        onClose={() => setSelectedSpan(null)}
        title={selectedSpan?.name || 'Span Details'}
        subtitle={`Span ID: ${selectedSpan?.id} · Service: ${selectedSpan?.serviceName}`}
        badge={
          selectedSpan?.statusCode === 'ERROR' ? (
            <SeverityBadge severity="critical" label="ERROR" />
          ) : (
            <SeverityBadge severity="low" label="OK" />
          )
        }
      >
        {selectedSpan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Span Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Service Name</div>
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedSpan.serviceName}
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Execution Duration</div>
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: selectedSpan.statusCode === 'ERROR' ? 'var(--status-critical)' : 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedSpan.durationMs} ms
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Span Kind</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedSpan.kind}
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Start Offset</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  +{selectedSpan.startOffsetMs} ms from root
                </div>
              </div>
            </div>

            {/* Status Message if Error */}
            {selectedSpan.statusMessage && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--status-critical-bg)',
                  border: '1px solid var(--status-critical-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-critical)', marginBottom: '4px' }}>
                  SPAN ERROR MESSAGE
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {selectedSpan.statusMessage}
                </div>
              </div>
            )}

            {/* OpenTelemetry Semantic Attributes */}
            <div>
              <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                OpenTelemetry Semantic Attributes
              </h4>
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
                    {Object.entries(selectedSpan.attributes).map(([key, val]) => (
                      <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: 'var(--brand)', width: '40%' }}>
                          {key}
                        </td>
                        <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {String(val)}
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
