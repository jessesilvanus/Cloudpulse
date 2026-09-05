import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { cloudConnectionsApi } from '../api/client.ts';
import { Card } from '../components/ui/StatCard.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { CheckCircleIcon, ShieldIcon, SparklesIcon, AlertTriangleIcon } from '../components/ui/Icons.tsx';
import type { CloudConnection } from '@cloudpulse/shared';

export function OnboardingPage() {
  const { user, workspace } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConnections() {
      try {
        setLoading(true);
        const conns = await cloudConnectionsApi.getCloudConnections();
        setConnections(conns || []);
      } catch (err) {
        console.error('Failed to load active cloud connections:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConnections();
  }, []);

  const awsConn = connections.find((c) => c.provider === 'AWS');
  const azureConn = connections.find((c) => c.provider === 'AZURE');
  const gcpConn = connections.find((c) => c.provider === 'GCP');
  const k8sConn = connections.find((c) => c.provider === 'KUBERNETES');

  const hasAnyConnection = connections.some((c) => c.status === 'CONNECTED');
  const connectedCount = connections.filter((c) => c.status === 'CONNECTED').length;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.06) 0%, var(--bg-canvas) 60%)',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Onboarding Header */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--brand)',
              fontSize: '11.5px',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            <SparklesIcon />
            <span>FIRST-TIME SETUP & CLOUD DISCOVERY</span>
          </div>

          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              letterSpacing: '0.02em',
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
            }}
          >
            WELCOME TO CLOUDPULSE
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Connect your cloud environment to start analyzing multi-cloud topology, real-time observability, FinOps economics, and security posture.
          </p>
        </div>

        {/* Onboarding Progress Pipeline */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Step 1: Account */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--status-healthy)', fontWeight: 700, fontSize: '14px' }}>✓</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>1. ACCOUNT</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{user?.name || 'Verified User'}</div>
            </div>
          </div>

          <div style={{ height: '1px', width: '24px', backgroundColor: 'var(--border-default)', display: 'none' }} />

          {/* Step 2: Workspace */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--status-healthy)', fontWeight: 700, fontSize: '14px' }}>✓</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>2. WORKSPACE</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{workspace?.name || 'Production Cloud Estate'}</div>
            </div>
          </div>

          {/* Step 3: Cloud Connection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                color: hasAnyConnection ? 'var(--status-healthy)' : 'var(--brand)',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              {hasAnyConnection ? '✓' : '●'}
            </span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>3. CLOUD</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {hasAnyConnection ? `${connectedCount} Connected` : 'Pending Connection'}
              </div>
            </div>
          </div>

          {/* Step 4: Sync */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                color: hasAnyConnection ? 'var(--status-healthy)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              {hasAnyConnection ? '✓' : '○'}
            </span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: hasAnyConnection ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                4. SYNC
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {hasAnyConnection ? 'Inventory Synced' : 'Awaiting Connection'}
              </div>
            </div>
          </div>

          {/* Step 5: Ready */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                color: hasAnyConnection ? 'var(--status-healthy)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              {hasAnyConnection ? '✓' : '○'}
            </span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: hasAnyConnection ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                5. READY
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {hasAnyConnection ? 'Observability Live' : 'Command Center'}
              </div>
            </div>
          </div>
        </div>

        {/* Identity vs Cloud Connection Explanation Box */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <div style={{ color: 'var(--brand)', marginTop: '2px' }}>
            <ShieldIcon />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
              How CLOUDPULSE Connects to Your Cloud:
            </strong>
            CLOUDPULSE uses secure, least-privilege read-only role delegation (AWS IAM AssumeRole with External ID, Azure Entra ID Service Principals, GCP IAM Service Accounts, and Kubernetes Read-Only ClusterRoles).
            <span style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)' }}>
              No long-lived root access keys are ever stored or transmitted. You maintain full control to revoke role permissions at any time in your cloud provider console.
            </span>
          </div>
        </div>

        {/* Cloud Provider Connection Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
          {/* 1. AWS Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: `1px solid ${awsConn?.status === 'CONNECTED' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>☁️</span>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Amazon Web Services
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Cross-Account IAM Role + STS Identity
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    backgroundColor: awsConn?.status === 'CONNECTED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                    color: awsConn?.status === 'CONNECTED' ? 'var(--status-healthy)' : 'var(--text-muted)',
                  }}
                >
                  ● {awsConn?.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONNECTED'}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                Continuous discovery of EC2, S3, RDS, EKS, Lambda, CloudWatch alarms, and Cost Explorer economics across all accessible AWS regions.
              </p>

              {awsConn?.status === 'CONNECTED' && (
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Account: <strong style={{ color: 'var(--text-primary)' }}>{awsConn.accountIdentifier}</strong> · 10/10 Permissions Granted
                </div>
              )}
            </div>

            <button
              type="button"
              className={awsConn?.status === 'CONNECTED' ? 'btn btn-secondary' : 'btn btn-primary'}
              onClick={() => navigate('/settings/cloud-connections/aws')}
              style={{ width: '100%', fontWeight: 700, justifyContent: 'center' }}
            >
              {awsConn?.status === 'CONNECTED' ? '⚙️ Reconfigure AWS Connection' : 'Connect AWS →'}
            </button>
          </div>

          {/* 2. Azure Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: `1px solid ${azureConn?.status === 'CONNECTED' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🔷</span>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Microsoft Azure
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Entra ID App + ARM Reader Role
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    backgroundColor: azureConn?.status === 'CONNECTED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                    color: azureConn?.status === 'CONNECTED' ? 'var(--status-healthy)' : 'var(--text-muted)',
                  }}
                >
                  ● {azureConn?.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONNECTED'}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                Monitor Azure Subscriptions, Resource Groups, Virtual Machines, AKS, Azure SQL, Cosmos DB, and Defender for Cloud posture.
              </p>

              {azureConn?.status === 'CONNECTED' && (
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Subscription: <strong style={{ color: 'var(--text-primary)' }}>{azureConn.accountIdentifier}</strong>
                </div>
              )}
            </div>

            <button
              type="button"
              className={azureConn?.status === 'CONNECTED' ? 'btn btn-secondary' : 'btn btn-primary'}
              onClick={() => navigate('/settings/cloud-connections/azure')}
              style={{ width: '100%', fontWeight: 700, justifyContent: 'center' }}
            >
              {azureConn?.status === 'CONNECTED' ? '⚙️ Reconfigure Azure Connection' : 'Connect Azure →'}
            </button>
          </div>

          {/* 3. Google Cloud Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: `1px solid ${gcpConn?.status === 'CONNECTED' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🟢</span>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Google Cloud Platform
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      GCP Service Account + Viewer Role
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    backgroundColor: gcpConn?.status === 'CONNECTED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                    color: gcpConn?.status === 'CONNECTED' ? 'var(--status-healthy)' : 'var(--text-muted)',
                  }}
                >
                  ● {gcpConn?.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONNECTED'}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                Discover GCP Projects, Cloud Asset Inventory, Compute Engine, GKE clusters, Cloud Storage, and Security Command Center findings.
              </p>

              {gcpConn?.status === 'CONNECTED' && (
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Project: <strong style={{ color: 'var(--text-primary)' }}>{gcpConn.accountIdentifier}</strong>
                </div>
              )}
            </div>

            <button
              type="button"
              className={gcpConn?.status === 'CONNECTED' ? 'btn btn-secondary' : 'btn btn-primary'}
              onClick={() => navigate('/settings/cloud-connections/gcp')}
              style={{ width: '100%', fontWeight: 700, justifyContent: 'center' }}
            >
              {gcpConn?.status === 'CONNECTED' ? '⚙️ Reconfigure GCP Connection' : 'Connect Google Cloud →'}
            </button>
          </div>

          {/* 4. Kubernetes Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: `1px solid ${k8sConn?.status === 'CONNECTED' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>☸️</span>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Kubernetes Platform
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      EKS · AKS · GKE · Read-Only ClusterRole
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    backgroundColor: k8sConn?.status === 'CONNECTED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                    color: k8sConn?.status === 'CONNECTED' ? 'var(--status-healthy)' : 'var(--text-muted)',
                  }}
                >
                  ● {k8sConn?.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONNECTED'}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                Unified multi-cluster control plane monitoring pods, nodes, workloads, namespaces, ingress routing, and pod failure correlations.
              </p>

              {k8sConn?.status === 'CONNECTED' && (
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Cluster: <strong style={{ color: 'var(--text-primary)' }}>{k8sConn.displayName}</strong>
                </div>
              )}
            </div>

            <button
              type="button"
              className={k8sConn?.status === 'CONNECTED' ? 'btn btn-secondary' : 'btn btn-primary'}
              onClick={() => navigate('/settings/cloud-connections/kubernetes')}
              style={{ width: '100%', fontWeight: 700, justifyContent: 'center' }}
            >
              {k8sConn?.status === 'CONNECTED' ? '⚙️ Reconfigure Kubernetes' : 'Connect Kubernetes →'}
            </button>
          </div>
        </div>

        {/* Bottom Actions: Continue or Skip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '20px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {hasAnyConnection
              ? '✓ At least one cloud environment is connected.'
              : 'You can connect additional providers anytime in Platform Settings.'}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/overview')}
              style={{ padding: '10px 20px', fontWeight: 700 }}
            >
              {hasAnyConnection ? 'Enter Command Center →' : 'Skip & Go to Dashboard →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
