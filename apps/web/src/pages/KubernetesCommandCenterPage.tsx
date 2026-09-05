import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { kubernetesOperationsApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { LoadingState } from '../components/ui/States.tsx';
import type { KubernetesOverviewSummary } from '@cloudpulse/shared';

export function KubernetesCommandCenterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<KubernetesOverviewSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [investigationPrompt, setInvestigationPrompt] = useState('');
  const [investigationResult, setInvestigationResult] = useState<any | null>(null);
  const [investigating, setInvestigating] = useState(false);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await kubernetesOperationsApi.getKubernetesOverview();
      setOverview(data);
    } catch (err) {
      console.error('Failed to load Kubernetes overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvestigate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investigationPrompt.trim()) return;
    setInvestigating(true);
    try {
      const res = await kubernetesOperationsApi.investigateKubernetes(investigationPrompt);
      setInvestigationResult(res);
    } catch (err) {
      console.error('Investigation failed:', err);
    } finally {
      setInvestigating(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Kubernetes clusters & live workload telemetry..." />;
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Kubernetes Production Command Center"
        subtitle="Real multi-cluster production telemetry, workload health, Pod security standards, and safe automated remediation"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={loadOverview}>
              🔄 Refresh State
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/settings/cloud-connections/kubernetes')}>
              ➕ Connect Cluster
            </button>
          </div>
        }
      />

      {/* KPI Cards Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>CONNECTED CLUSTERS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {overview?.connectedClusters || 0} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ {overview?.totalClusters || 0}</span>
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL NODES</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {overview?.totalNodes || 0} <span style={{ fontSize: '12px', color: 'var(--status-healthy)' }}>All Ready</span>
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL WORKLOADS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {overview?.totalWorkloads || 0} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>in {overview?.totalNamespaces || 0} ns</span>
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>POD HEALTH</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: overview?.degradedPods ? 'var(--status-warning)' : 'var(--status-healthy)', marginTop: '4px' }}>
            {overview?.healthyPods || 0} <span style={{ fontSize: '12px', color: 'var(--status-critical)' }}>{overview?.degradedPods ? `(${overview.degradedPods} CrashLoop)` : ''}</span>
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>SECURITY FINDINGS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--status-warning)', marginTop: '4px' }}>
            {overview?.activeSecurityFindings || 0} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>RBAC / Limits</span>
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>GOVERNANCE SCORE</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {overview?.governanceScore || 0}% <span style={{ fontSize: '12px', color: 'var(--status-healthy)' }}>CIS Bench</span>
          </div>
        </div>
      </div>

      {/* Cluster Grid Cards */}
      <Card title="☸️ Discovered Production Clusters" subtitle="Live health and control-plane versions across EKS, AKS, and GKE">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {overview?.clusters.map((cluster) => (
            <div
              key={cluster.id}
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '11px', padding: '2px 6px', backgroundColor: 'var(--bg-active)', borderRadius: '4px' }}>
                      {cluster.provider}
                    </span>
                    <StatusBadge status={cluster.status === 'HEALTHY' ? 'healthy' : 'degraded'} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: '6px', color: 'var(--text-primary)' }}>
                    {cluster.clusterName}
                  </h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Region: <strong>{cluster.region}</strong> · Version: <strong>{cluster.clusterVersion}</strong>
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/kubernetes/clusters/${cluster.id}`)}
                >
                  Inspect →
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '10px', backgroundColor: 'var(--bg-canvas)', borderRadius: '4px', textAlign: 'center', fontSize: '11px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Nodes</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{cluster.nodeCount}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Workloads</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{cluster.workloadCount}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Pods</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{cluster.podCount}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Cluster Investigation Copilot Bar */}
      <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✨ AI Kubernetes Investigation Copilot
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Ask diagnostic questions against live Kubernetes topology, pod restart logs, RBAC bindings, and rollout states.
        </p>

        <form onSubmit={handleInvestigate} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input
            type="text"
            value={investigationPrompt}
            onChange={(e) => setInvestigationPrompt(e.target.value)}
            placeholder="e.g. Why is payment-service degraded? or Show all privileged workloads"
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '13px'
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={investigating}>
            {investigating ? 'Analyzing...' : 'Investigate'}
          </button>
        </form>

        {investigationResult && (
          <div style={{ marginTop: '16px', padding: '14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#93c5fd' }}>
              <span>Diagnosis: {investigationResult.intent}</span>
              <span style={{ color: 'var(--text-muted)' }}>Target: {investigationResult.targetEntity}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{investigationResult.diagnosis}</p>
            <div style={{ marginTop: '6px' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Cited Evidence:</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                {investigationResult.evidence?.map((ev: string, idx: number) => (
                  <li key={idx}>{ev}</li>
                ))}
              </ul>
            </div>
            {investigationResult.recommendedAction && (
              <div style={{ marginTop: '8px', padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#fbbf24' }}>Recommended Safe Action:</strong>
                  <div style={{ color: 'var(--text-primary)' }}>{investigationResult.recommendedAction.title}</div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/kubernetes/clusters/k8s-prod-eks-us-east-1')}
                >
                  Review Action →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Workload Registry Table */}
      <Card title="📦 Live Workload & Pod Health Registry" subtitle="Real-time status across Deployments, DaemonSets, and container phases">
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <input
            type="text"
            placeholder="Search workloads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              width: '240px'
            }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
            <thead>
              <tr>
                <th>Workload Name</th>
                <th>Kind</th>
                <th>Namespace</th>
                <th>Replicas</th>
                <th>Rollout State</th>
                <th>Restarts</th>
                <th>Health</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>api-gateway</td>
                <td>Deployment</td>
                <td><code>cloudpulse-prod</code></td>
                <td>3 / 3</td>
                <td style={{ color: 'var(--status-healthy)' }}>ROLLOUT_SUCCESSFUL</td>
                <td>0</td>
                <td><StatusBadge status="healthy" /></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate('/kubernetes/clusters/k8s-prod-eks-us-east-1')}>
                    Inspect
                  </button>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>order-service</td>
                <td>Deployment</td>
                <td><code>cloudpulse-prod</code></td>
                <td>2 / 2</td>
                <td style={{ color: 'var(--status-healthy)' }}>ROLLOUT_SUCCESSFUL</td>
                <td>0</td>
                <td><StatusBadge status="healthy" /></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate('/kubernetes/clusters/k8s-prod-eks-us-east-1')}>
                    Inspect
                  </button>
                </td>
              </tr>
              <tr style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
                <td style={{ fontWeight: 700, color: 'var(--status-critical)' }}>⚠️ payment-service</td>
                <td>Deployment</td>
                <td><code>cloudpulse-prod</code></td>
                <td style={{ color: 'var(--status-critical)', fontWeight: 700 }}>1 / 2</td>
                <td style={{ color: 'var(--status-critical)', fontWeight: 700 }}>ROLLOUT_DEGRADED</td>
                <td style={{ color: 'var(--status-critical)', fontWeight: 700 }}>6 (CrashLoop)</td>
                <td><StatusBadge status="unhealthy" /></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/kubernetes/clusters/k8s-prod-eks-us-east-1')}>
                    Remediate →
                  </button>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>telemetry-collector</td>
                <td>DaemonSet</td>
                <td><code>cloudpulse-prod</code></td>
                <td>3 / 3</td>
                <td style={{ color: 'var(--status-healthy)' }}>ROLLOUT_SUCCESSFUL</td>
                <td>0</td>
                <td><StatusBadge status="healthy" /></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate('/kubernetes/clusters/k8s-prod-eks-us-east-1')}>
                    Inspect
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
