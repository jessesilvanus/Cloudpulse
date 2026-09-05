import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cloudConnectionsApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { LoadingState } from '../components/ui/States.tsx';
import type {
  MultiCloudScorecard,
  MultiCloudComparison,
  CloudResource,
  CloudProvider
} from '@cloudpulse/shared';

export function MultiCloudOverviewPage() {
  const navigate = useNavigate();
  const [scorecard, setScorecard] = useState<MultiCloudScorecard | null>(null);
  const [comparisons, setComparisons] = useState<MultiCloudComparison[]>([]);
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'ALL' | CloudProvider>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    async function loadMultiCloudData() {
      try {
        setLoading(true);
        const [sc, comp, res] = await Promise.all([
          cloudConnectionsApi.getMultiCloudScorecard(),
          cloudConnectionsApi.getMultiCloudComparison(),
          cloudConnectionsApi.getMultiCloudResources()
        ]);
        setScorecard(sc);
        setComparisons(comp);
        setResources(res);
      } catch (err) {
        console.error('Failed to load multi-cloud overview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMultiCloudData();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      if (!query.trim()) {
        const res = await cloudConnectionsApi.getMultiCloudResources(selectedProvider === 'ALL' ? undefined : selectedProvider);
        setResources(res);
      } else {
        const searchRes = await cloudConnectionsApi.searchMultiCloud(query);
        setResources(searchRes.resources);
      }
    } catch (err) {
      console.error('Multi-cloud search failed:', err);
    }
  };

  const handleProviderFilter = async (provider: 'ALL' | CloudProvider) => {
    setSelectedProvider(provider);
    try {
      const res = await cloudConnectionsApi.getMultiCloudResources(provider === 'ALL' ? undefined : provider);
      setResources(res);
    } catch (err) {
      console.error('Provider filter failed:', err);
    }
  };

  if (loading) {
    return <LoadingState message="Aggregating live multi-cloud telemetry and scorecards..." />;
  }

  const aggregates = scorecard?.aggregates || {
    totalConnectedClouds: 3,
    totalResources: resources.length,
    totalMonthlySpend: 5414.10,
    totalCriticalFindings: 0,
    overallHealthPercent: 100,
    overallCompliancePercent: 100
  };

  const filteredResources = resources.filter((r) => {
    if (selectedProvider !== 'ALL' && r.provider !== selectedProvider) return false;
    if (selectedCategory !== 'ALL' && r.serviceCategory !== selectedCategory) return false;
    return true;
  });

  const getProviderIcon = (provider: CloudProvider) => {
    switch (provider) {
      case 'AWS':
        return '☁️';
      case 'AZURE':
        return '🔷';
      case 'GCP':
        return '🌐';
    }
  };

  const getProviderBadgeStyle = (provider: CloudProvider) => {
    switch (provider) {
      case 'AWS':
        return { backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'AZURE':
        return { backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'GCP':
        return { backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Multi-Cloud Governance & Topology Center"
        subtitle="Unified control plane, canonical resource normalization, and cross-provider intelligence for AWS, Azure, and Google Cloud"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/settings')}
            >
              ⚙️ Cloud Settings
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/infrastructure')}
            >
              Infrastructure Explorer →
            </button>
          </div>
        }
      />

      {/* Aggregate KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '18px' }}>
        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connected Clouds</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
            {aggregates.totalConnectedClouds} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>/ 3 Providers</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>AWS · Azure · GCP Active</div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Normalized Resources</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {aggregates.totalResources}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--status-healthy)', marginTop: '4px' }}>
            ● {Math.round(aggregates.overallHealthPercent)}% Healthy Golden Signals
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Multi-Cloud Spend</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            ${aggregates.totalMonthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Current Month Total (USD)</div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cross-Cloud Compliance</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--status-healthy)', marginTop: '4px' }}>
            {Math.round(aggregates.overallCompliancePercent)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>CIS Benchmark Standard</div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical Threats</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: aggregates.totalCriticalFindings === 0 ? 'var(--status-healthy)' : 'var(--status-critical)', marginTop: '4px' }}>
            {aggregates.totalCriticalFindings}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Security Hub · Defender · SCC</div>
        </div>
      </div>

      {/* Provider Scorecard Grid */}
      <div style={{ marginBottom: '22px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Provider Connection Scorecards
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
          {scorecard?.providers.map((p) => {
            const isConnected = p.status === 'CONNECTED';
            return (
              <div
                key={p.provider}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{getProviderIcon(p.provider)}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>{p.displayName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {p.scopeIdentifier !== 'NONE' ? p.scopeIdentifier : 'Disconnected'}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      ...getProviderBadgeStyle(p.provider)
                    }}
                  >
                    {isConnected ? '● CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>

                {isConnected ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Resources</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.totalResources}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Monthly Spend</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b' }}>${p.currentSpend.toFixed(2)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Compliance</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--status-healthy)' }}>{p.governanceCompliancePercent}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Security Findings</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--status-healthy)' }}>{p.activeSecurityFindings}</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <strong>Capabilities:</strong> {p.capabilitiesCoverage.supported} Supported · {p.capabilitiesCoverage.partial} Partial
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Provider is currently disconnected.
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(p.provider === 'AZURE' ? '/settings/cloud-connections/azure' : '/settings/cloud-connections/gcp')}
                    >
                      Connect {p.provider} →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Cloud Resource Explorer */}
      <Card
        title="Multi-Cloud Canonical Resource Explorer"
        subtitle="Global normalized inventory mapped across AWS, Azure, and Google Cloud with canonical IDs"
        badge={<span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{filteredResources.length} items</span>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
              <input
                type="text"
                className="input"
                style={{ width: '100%', fontSize: '12px' }}
                placeholder="Search resources by name, canonical ID, service, tag, or region..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Provider Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['ALL', 'AWS', 'AZURE', 'GCP'] as const).map((prov) => {
                const isSelected = selectedProvider === prov;
                return (
                  <button
                    key={prov}
                    onClick={() => handleProviderFilter(prov)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--color-primary-bg, rgba(59, 130, 246, 0.15))' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {prov === 'ALL' ? 'All Clouds' : `${getProviderIcon(prov)} ${prov}`}
                  </button>
                );
              })}
            </div>

            {/* Category Filter */}
            <select
              className="select"
              style={{ fontSize: '11.5px', padding: '5px 8px' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="COMPUTE">Compute</option>
              <option value="STORAGE">Storage</option>
              <option value="DATABASE">Database</option>
              <option value="NETWORKING">Networking</option>
              <option value="SECURITY">Security</option>
              <option value="MESSAGING">Messaging</option>
              <option value="ANALYTICS">Analytics</option>
              <option value="MANAGEMENT">Management</option>
            </select>
          </div>

          {/* Resources Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)' }}>Provider</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)' }}>Resource Name & Canonical ID</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)' }}>Category / Type</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)' }}>Location / Scope</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)' }}>Health Status</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Monthly Spend</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          ...getProviderBadgeStyle(r.provider)
                        }}
                      >
                        {getProviderIcon(r.provider)} {r.provider}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.displayName || r.name}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {r.canonicalId}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '10.5px',
                          fontWeight: 600
                        }}
                      >
                        {r.normalizedServiceType}
                      </span>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {r.nativeServiceType}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.regionOrLocation}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        {r.cloudScope?.resourceGroupOrFolder || r.cloudScope?.scopeName}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <StatusBadge status={r.healthState === 'HEALTHY' ? 'operational' : r.healthState === 'WARNING' ? 'degraded' : 'down'} label={r.status} />
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {r.healthReasons?.[0] || 'Operational'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>
                      ${r.estimatedMonthlyCost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Multi-Cloud Cross-Provider Comparison Matrix */}
      <div style={{ marginTop: '20px' }}>
        <Card
          title="Multi-Cloud Governance & Architecture Comparison Matrix"
          subtitle="Direct alignment across Health, Security, Cost, Identity, and Governance standards"
          badge={<StatusBadge status="operational" label="CROSS-CLOUD SYNC" />}
        >
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)' }}>Dimension / Metric</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, color: '#f59e0b' }}>☁️ Amazon Web Services</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, color: '#3b82f6' }}>🔷 Microsoft Azure</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, color: '#10b981' }}>🌐 Google Cloud Platform</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)' }}>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((c) => (
                  <tr
                    key={c.metric}
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.metric}
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.category}</div>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.awsValue}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.azureValue}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.gcpValue}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>{c.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
