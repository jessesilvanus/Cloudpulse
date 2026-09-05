import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, CloseIcon } from '../ui/Icons.tsx';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  category: 'Service' | 'Trace' | 'Metric' | 'Reliability' | 'Navigation' | 'Security' | 'FinOps' | 'Resilience' | 'Compliance' | 'AI';
  title: string;
  subtitle: string;
  path: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  { id: '1', category: 'Navigation', title: 'Enterprise Command Center', subtitle: 'Health score 88.4/100, executive briefing, situation room', path: '/overview' },
  { id: '2', category: 'Navigation', title: 'Services Catalog', subtitle: 'Service topology, golden signals, and dependency tree', path: '/services' },
  { id: '3', category: 'Navigation', title: 'Metrics Explorer', subtitle: 'Prometheus-compatible multi-metric analyzer', path: '/metrics' },
  { id: '4', category: 'Navigation', title: 'Log Stream', subtitle: 'Structured log explorer with Log → Trace correlation', path: '/logs' },
  { id: '5', category: 'Navigation', title: 'Distributed Tracing', subtitle: 'OpenTelemetry span waterfall & latency breakdown', path: '/traces' },
  { id: '6', category: 'Navigation', title: 'Active Alerts', subtitle: 'Firing alerts, trigger conditions, and thresholds', path: '/alerts' },
  { id: '7', category: 'Navigation', title: 'Incident Response', subtitle: 'SEV1–SEV4 incident commander workspace', path: '/incidents' },
  { id: '8', category: 'Navigation', title: 'SLOs & Error Budgets', subtitle: 'Multi-window burn rates and SLA tracking', path: '/slos' },
  { id: '9', category: 'Navigation', title: 'Infrastructure Inventory', subtitle: 'Kubernetes nodes, pods, and AWS cloud topology', path: '/infrastructure' },
  { id: '10', category: 'Service', title: 'payment-service', subtitle: 'Tier-1 · Status: Healthy · Sandbox & fault simulator', path: '/services/svc-payment' },
  { id: '11', category: 'Service', title: 'order-service', subtitle: 'Tier-1 · Status: Healthy · Saga orchestrator', path: '/services/svc-orders' },
  { id: '12', category: 'Service', title: 'api-gateway', subtitle: 'Tier-1 · Status: Healthy · 4850 req/s ingress', path: '/services/svc-gateway' },
  { id: '13', category: 'Security', title: 'Zero Trust Security Posture', subtitle: 'Score: 88.0% · JIT access, MFA, and SOC event correlation', path: '/overview' },
  { id: '14', category: 'Compliance', title: 'Policy-as-Code Governance', subtitle: 'Score: 88.5% · CIS, NIST SP 800-53, SOC 2 controls', path: '/overview' },
  { id: '15', category: 'FinOps', title: 'Advanced FinOps & GreenOps', subtitle: '$1,440.00 spend · $185.00/mo realized savings · 420.5 kg CO2e', path: '/overview' },
  { id: '16', category: 'Resilience', title: 'Disaster Recovery & Chaos', subtitle: '91.0% readiness · 42s multi-region failover RTO verified', path: '/overview' },
  { id: '17', category: 'AI', title: 'Predictive Intelligence & AI', subtitle: 'Capacity forecast, memory headroom warning (28d horizon)', path: '/overview' },
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const filteredItems = COMMAND_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        e.preventDefault();
        navigate(filteredItems[selectedIndex].path);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
        backgroundColor: 'rgba(0, 0, 0, 0.70)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ color: 'var(--brand)', display: 'flex' }}>
            <SearchIcon />
          </span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services, metrics, traces, incidents, alerts..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '13.5px',
              color: 'var(--text-primary)',
            }}
          />
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <CloseIcon />
          </button>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '6px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              No matches found for "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                    cursor: 'pointer',
                    gap: '12px',
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: isSelected ? '#fff' : 'var(--text-primary)' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.subtitle}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Command Bar Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-canvas)',
            fontSize: '10.5px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span>Use ↑↓ to navigate · Enter to select · Esc to close</span>
          <span>CLOUDPULSE Quick Search</span>
        </div>
      </div>
    </div>
  );
}
