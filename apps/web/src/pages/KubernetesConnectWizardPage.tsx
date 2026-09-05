import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { kubernetesOperationsApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import type { KubernetesProvider } from '@cloudpulse/shared';

export function KubernetesConnectWizardPage() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const isFromOnboarding = searchParams.get('from') === 'onboarding';

  const [provider, setProvider] = useState<KubernetesProvider>('EKS');
  const [clusterName, setClusterName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [cloudScope, setCloudScope] = useState('');
  const [authMethod, setAuthMethod] = useState<'AWS_IAM_IRSA' | 'AZURE_ENTRA_AAD' | 'GCP_IAM' | 'SERVICE_ACCOUNT_TOKEN'>('AWS_IAM_IRSA');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleProviderChange = (p: KubernetesProvider) => {
    setProvider(p);
    if (p === 'EKS') {
      setAuthMethod('AWS_IAM_IRSA');
      setRegion('us-east-1');
      setCloudScope('');
    } else if (p === 'AKS') {
      setAuthMethod('AZURE_ENTRA_AAD');
      setRegion('eastus');
      setCloudScope('');
    } else if (p === 'GKE') {
      setAuthMethod('GCP_IAM');
      setRegion('us-central1');
      setCloudScope('');
    } else {
      setAuthMethod('SERVICE_ACCOUNT_TOKEN');
      setRegion('on-prem');
      setCloudScope('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clusterName || !endpoint) {
      setError('Cluster Name and Endpoint Reference are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const conn = await kubernetesOperationsApi.connectKubernetesCluster({
        name: clusterName,
        provider,
        clusterEndpointReference: endpoint,
        authorizationMethod: authMethod,
        regionOrLocation: region,
        cloudAccountOrProject: cloudScope || undefined
      });

      if (conn?.status === 'CONNECTED') {
        navigate(isFromOnboarding ? '/onboarding' : '/kubernetes');
      } else {
        setError(`Cluster registered with status '${conn?.status || 'AUTH_REQUIRED'}'. ${conn?.error || 'Cluster endpoint authentication (KUBECONFIG or Service Account Token) required.'}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Kubernetes cluster.');
    } finally {
      setSubmitting(false);
    }
  };

  const rbacYaml = `# CLOUDPULSE Least-Privilege Read-Only ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cloudpulse-readonly-role
rules:
- apiGroups: ["", "apps", "batch", "networking.k8s.io", "storage.k8s.io", "autoscaling"]
  resources: ["nodes", "namespaces", "pods", "services", "deployments", "statefulsets", "daemonsets", "jobs", "persistentvolumes", "persistentvolumeclaims", "ingresses", "horizontalpodautoscalers"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cloudpulse-readonly-binding
subjects:
- kind: ServiceAccount
  name: cloudpulse-agent
  namespace: kube-system
roleRef:
  kind: ClusterRole
  name: cloudpulse-readonly-role
  apiGroup: rbac.authorization.k8s.io`;

  const copyRbac = () => {
    navigator.clipboard.writeText(rbacYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Connect Kubernetes Production Cluster"
        subtitle="Authorize CLOUDPULSE to securely discover and monitor real Kubernetes clusters across EKS, AKS, GKE, or Self-Managed infrastructure"
        actions={
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(isFromOnboarding ? '/onboarding' : '/kubernetes')}>
            {isFromOnboarding ? '← Back to Onboarding' : '← Cancel'}
          </button>
        }
      />

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--status-critical)', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* 1. Flavor Selection */}
      <Card title="1. Select Kubernetes Flavor & Infrastructure Provider">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {[
            { id: 'EKS', label: 'Amazon EKS', desc: 'AWS IAM / IRSA auth' },
            { id: 'AKS', label: 'Azure AKS', desc: 'Entra / AAD auth' },
            { id: 'GKE', label: 'Google GKE', desc: 'Google Cloud IAM' },
            { id: 'SELF_MANAGED', label: 'Self-Managed', desc: 'ServiceAccount token' },
          ].map((p) => {
            const selected = provider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProviderChange(p.id as any)}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: selected ? '2px solid var(--brand)' : '1px solid var(--border-subtle)',
                  backgroundColor: selected ? 'var(--bg-active)' : 'var(--bg-card)',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{p.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.desc}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 2. RBAC Template */}
      <Card
        title="2. Least-Privilege Read-Only RBAC Manifest"
        subtitle="CLOUDPULSE operates in strict read-only mode by default"
        badge={
          <button className="btn btn-secondary btn-sm" onClick={copyRbac}>
            {copied ? '✓ Copied!' : '📋 Copy YAML'}
          </button>
        }
      >
        <pre style={{ padding: '12px', backgroundColor: 'var(--bg-canvas)', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflowX: 'auto', maxHeight: '160px' }}>
          {rbacYaml}
        </pre>
      </Card>

      {/* 3. Form */}
      <Card title="3. Cluster Connection Parameters">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Cluster Display Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. prod-eks-us-east-1"
                value={clusterName}
                onChange={(e) => setClusterName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                API Server Endpoint Reference
              </label>
              <input
                type="text"
                required
                placeholder="e.g. https://B812948124981.gr7.us-east-1.eks.amazonaws.com"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Region / Location
              </label>
              <input
                type="text"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                {provider === 'EKS' ? 'AWS Account ID' : provider === 'AKS' ? 'Azure Subscription ID' : 'GCP Project ID'}
              </label>
              <input
                type="text"
                required
                value={cloudScope}
                onChange={(e) => setCloudScope(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/kubernetes')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Validating...' : 'Validate & Connect Cluster →'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
