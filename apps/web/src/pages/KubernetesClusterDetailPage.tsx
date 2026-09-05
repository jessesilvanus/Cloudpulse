import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { kubernetesOperationsApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { Tabs } from '../components/ui/Tabs.tsx';
import { LoadingState } from '../components/ui/States.tsx';

export function KubernetesClusterDetailPage() {
  const { clusterId } = useParams<{ clusterId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any | null>(null);
  const [graph, setGraph] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [executingOp, setExecutingOp] = useState(false);
  const [opSuccess, setOpSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (clusterId) {
      loadClusterDetail(clusterId);
    }
  }, [clusterId]);

  const loadClusterDetail = async (id: string) => {
    setLoading(true);
    try {
      const data = await kubernetesOperationsApi.getKubernetesClusterDetail(id);
      setDetail(data);
      const graphData = await kubernetesOperationsApi.getKubernetesClusterGraph(id);
      setGraph(graphData);
    } catch (err) {
      console.error('Failed to load cluster detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRollback = async (opId: string) => {
    if (!clusterId) return;
    setExecutingOp(true);
    try {
      const res = await kubernetesOperationsApi.executeKubernetesOperation(clusterId, opId);
      setOpSuccess(`Operation executed with Fresh-Read Verification! State: ${res.freshReadVerification?.observedState}`);
      await loadClusterDetail(clusterId);
    } catch (err) {
      console.error('Execution failed:', err);
    } finally {
      setExecutingOp(false);
    }
  };

  if (loading) {
    return <LoadingState message="Inspecting cluster topology, nodes, and workloads..." />;
  }

  if (!detail) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Cluster Not Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>Could not load details for cluster "{clusterId}".</p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/kubernetes')}>
          Return to Command Center
        </button>
      </div>
    );
  }

  const { cluster, nodes, workloads, pods, services, rbac, securityFindings, governance, operations } = detail;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title={`☸️ ${cluster?.clusterName}`}
        subtitle={`Canonical ID: ${cluster?.canonicalId} · Version: ${cluster?.clusterVersion} · Region: ${cluster?.region}`}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/kubernetes')}>
              ← Back to Clusters
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => loadClusterDetail(clusterId!)}>
              🔄 Refresh State
            </button>
          </div>
        }
      />

      {opSuccess && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--status-healthy)', fontSize: '13px' }}>
          ✓ {opSuccess}
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'overview', label: '🖥️ Overview & Nodes' },
          { id: 'workloads', label: '📦 Workloads & Pods' },
          { id: 'networking', label: '🌐 Networking & Ingress' },
          { id: 'rbac', label: '🔒 RBAC & Identities' },
          { id: 'governance', label: '🛡️ Governance & Security' },
          { id: 'graph', label: '🕸️ Knowledge Graph' },
          { id: 'operations', label: '⚡ Operations & What-If' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab: Overview & Nodes */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <Card title="CPU Capacity" subtitle="Cluster-wide compute">
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>24 Cores</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Allocatable: 22.5 Cores (42.5% utilized)</div>
            </Card>
            <Card title="Memory Capacity" subtitle="Cluster-wide memory">
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>96 GiB RAM</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Allocatable: 90 GiB (65.8% utilized)</div>
            </Card>
            <Card title="Governance Compliance" subtitle="CIS Kubernetes Benchmark">
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--status-healthy)' }}>{governance?.overallComplianceScore}%</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>4 policies evaluated</div>
            </Card>
          </div>

          <Card title="Worker Nodes Topology" subtitle="Registered CoreV1 nodes with allocatable capacity and conditions">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Node Name</th>
                    <th>Status</th>
                    <th>Zone</th>
                    <th>Instance Type</th>
                    <th>CPU / Mem Usage</th>
                    <th>Kubelet Version</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes?.map((node: any) => (
                    <tr key={node.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{node.name}</td>
                      <td><StatusBadge status="healthy" /></td>
                      <td>{node.zone}</td>
                      <td><code>{node.instanceType}</code></td>
                      <td style={{ color: 'var(--text-primary)' }}>CPU: {node.metrics?.cpuUsagePercent}% · Mem: {node.metrics?.memoryUsagePercent}%</td>
                      <td>{node.kubeletVersion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Workloads & Pods */}
      {activeTab === 'workloads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Workload Deployments" subtitle="AppsV1 Deployments & DaemonSets">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Workload Name</th>
                    <th>Namespace</th>
                    <th>Replicas</th>
                    <th>Image</th>
                    <th>Rollout State</th>
                    <th>Health</th>
                  </tr>
                </thead>
                <tbody>
                  {workloads?.map((wl: any) => (
                    <tr key={wl.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{wl.name}</td>
                      <td><code>{wl.namespace}</code></td>
                      <td>{wl.readyReplicas} / {wl.desiredReplicas}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{wl.imageReferences[0]}</td>
                      <td style={{ color: wl.rolloutState === 'ROLLOUT_SUCCESSFUL' ? 'var(--status-healthy)' : 'var(--status-critical)' }}>{wl.rolloutState}</td>
                      <td><StatusBadge status={wl.healthStatus === 'HEALTHY' ? 'healthy' : 'degraded'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Pod Container Diagnostics" subtitle="CoreV1 Pods with container states and restart counts">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Pod Name</th>
                    <th>Node</th>
                    <th>Phase</th>
                    <th>Restarts</th>
                    <th>Diagnosed State</th>
                  </tr>
                </thead>
                <tbody>
                  {pods?.map((pod: any) => (
                    <tr key={pod.id} style={{ backgroundColor: pod.reasons?.length > 0 ? 'rgba(239, 68, 68, 0.08)' : undefined }}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pod.name}</td>
                      <td>{pod.nodeName}</td>
                      <td>{pod.phase}</td>
                      <td style={{ fontWeight: 700 }}>{pod.restartCount}</td>
                      <td>
                        {pod.reasons?.length > 0 ? (
                          <span style={{ color: 'var(--status-critical)', fontWeight: 700 }}>⚠️ {pod.reasons.join(', ')}</span>
                        ) : (
                          <span style={{ color: 'var(--status-healthy)' }}>Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Networking */}
      {activeTab === 'networking' && (
        <Card title="Services & Ingresses" subtitle="CoreV1 Services & NetworkingV1 Ingresses">
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Type</th>
                  <th>Cluster IP</th>
                  <th>External Endpoint</th>
                  <th>Exposure</th>
                </tr>
              </thead>
              <tbody>
                {services?.map((svc: any) => (
                  <tr key={svc.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{svc.name}</td>
                    <td>{svc.type}</td>
                    <td><code>{svc.clusterIp}</code></td>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{svc.externalIp || 'None'}</td>
                    <td><span style={{ fontWeight: 700 }}>{svc.exposure}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: RBAC */}
      {activeTab === 'rbac' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <Card title="ServiceAccounts">
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{rbac?.serviceAccountsCount}</div>
            </Card>
            <Card title="Roles">
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{rbac?.rolesCount}</div>
            </Card>
            <Card title="ClusterRoles">
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{rbac?.clusterRolesCount}</div>
            </Card>
            <Card title="ClusterRoleBindings">
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{rbac?.clusterRoleBindingsCount}</div>
            </Card>
          </div>

          <Card title="Privileged ServiceAccounts" subtitle="Evaluated for wildcard (*) permissions and cluster-admin bindings">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rbac?.privilegedServiceAccounts?.map((sa: any, idx: number) => (
                <div key={idx} style={{ padding: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{sa.name}</strong> (namespace: <code>{sa.namespace}</code>)
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Bound to: {sa.clusterRolesBound.join(', ')}</div>
                  </div>
                  {sa.hasWildcardPermissions && (
                    <span style={{ padding: '2px 8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--status-critical)', borderRadius: '4px', fontWeight: 700 }}>
                      WILDCARD PERMISSIONS
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Governance & Security */}
      {activeTab === 'governance' && (
        <Card title="Security & Governance Policy Findings" subtitle="Audited against Pod Security Standards and RBAC least privilege">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {securityFindings?.map((sec: any) => (
              <div key={sec.id} style={{ padding: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{sec.title}</strong>
                  <span style={{ padding: '2px 8px', backgroundColor: sec.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: sec.severity === 'CRITICAL' ? 'var(--status-critical)' : 'var(--status-warning)', borderRadius: '4px', fontWeight: 700 }}>
                    {sec.severity}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>{sec.description}</p>
                <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Evidence: {sec.evidence}</div>
                <div style={{ color: 'var(--status-healthy)' }}>Remediation: {sec.remediationSuggestion}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab: Knowledge Graph */}
      {activeTab === 'graph' && (
        <Card title="Cross-Domain Cloud ↔ Kubernetes Knowledge Graph" subtitle="Attributed relationships between AWS VPC/ALB, EKS Nodes, and Container Pods">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Graph Nodes ({graph?.nodes?.length || 0})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                {graph?.nodes?.map((node: any) => (
                  <div key={node.id} style={{ padding: '6px 10px', backgroundColor: 'var(--bg-canvas)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{node.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{node.type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Attributed Edges ({graph?.edges?.length || 0})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                {graph?.edges?.map((edge: any, idx: number) => (
                  <div key={idx} style={{ padding: '8px', backgroundColor: 'var(--bg-canvas)', borderRadius: '4px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{edge.source}</span>
                      <span style={{ color: '#60a5fa', fontWeight: 700 }}>→ {edge.relationship} →</span>
                      <span style={{ color: 'var(--text-primary)' }}>{edge.target}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Evidence: {edge.evidence}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Operations & What-If */}
      {activeTab === 'operations' && (
        <Card title="Operations Work Queue & Safe Remediation" subtitle="Pre-flight checks, What-If simulation, and fresh-read verification">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {operations?.map((op: any) => (
              <div key={op.id} style={{ padding: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{op.title}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target: {op.targetKind}/{op.targetName} ({op.targetNamespace})</div>
                  </div>
                  <span style={{ padding: '2px 8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--status-warning)', borderRadius: '4px', fontWeight: 700, fontSize: '11px' }}>
                    {op.status}
                  </span>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--bg-canvas)', borderRadius: '4px', fontSize: '12px' }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Pre-Flight Safety Checks:</strong>
                  <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {op.preflightChecks?.map((check: any, idx: number) => (
                      <div key={idx} style={{ color: 'var(--text-primary)' }}>
                        ✓ {check.name} — <span style={{ color: 'var(--text-muted)' }}>{check.details}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{op.simulationSummary}</span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleExecuteRollback(op.id)}
                    disabled={executingOp}
                  >
                    {executingOp ? 'Executing...' : 'Execute Rollback →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
