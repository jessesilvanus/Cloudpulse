import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { cloudConnectionsApi, kubernetesOperationsApi } from '../api/client.ts';
import { ShieldIcon, SparklesIcon } from '../components/ui/Icons.tsx';
import type { CloudConnection } from '@cloudpulse/shared';
import styles from './OnboardingPage.module.css';

export function OnboardingPage() {
  const { user, workspace, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [k8sClusters, setK8sClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const [conns, clusters] = await Promise.all([
        cloudConnectionsApi.getCloudConnections().catch(() => []),
        kubernetesOperationsApi.getKubernetesConnections().catch(() => [])
      ]);
      setConnections(conns || []);
      setK8sClusters(clusters || []);
    } catch (err) {
      console.error('Failed to load active cloud connections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'CLOUDPULSE — First-Time Cloud Setup & Discovery';
    loadConnections();
  }, []);

  const handleDisconnect = async (connId: string) => {
    try {
      await cloudConnectionsApi.disconnectConnection(connId);
      await loadConnections();
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  const handleProceed = async () => {
    try {
      setCompleting(true);
      await completeOnboarding();
    } catch (err) {
      console.error('Error completing onboarding:', err);
    } finally {
      setCompleting(false);
      navigate('/overview');
    }
  };

  const awsConn = connections.find((c) => c.provider === 'AWS');
  const azureConn = connections.find((c) => c.provider === 'AZURE');
  const gcpConn = connections.find((c) => c.provider === 'GCP');
  const k8sConn = k8sClusters.find((c: any) => c.status === 'CONNECTED') || k8sClusters[0];

  const hasAnyConnection = connections.some((c) => c.status === 'CONNECTED') || k8sClusters.some((k: any) => k.status === 'CONNECTED');
  const connectedCount = connections.filter((c) => c.status === 'CONNECTED').length + k8sClusters.filter((k: any) => k.status === 'CONNECTED').length;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Header Section ── */}
        <div className={styles.headerSection}>
          <div className={styles.badge}>
            <SparklesIcon />
            <span>First-Time Setup & Cloud Discovery</span>
          </div>

          <h1 className={styles.pageTitle}>WELCOME TO CLOUDPULSE</h1>
          <p className={styles.pageSubtitle}>
            Connect your cloud environment to start analyzing multi-cloud topology, real-time observability, FinOps economics, and security posture.
          </p>
        </div>

        {/* ── 5-Step Progress Tracker ── */}
        <div className={styles.progressTracker} role="navigation" aria-label="Onboarding Progress">
          {/* Step 1: Account */}
          <div className={styles.progressStep}>
            <div className={`${styles.stepIndicator} ${styles.stepCompleted}`} aria-label="Step 1 completed">
              ✓
            </div>
            <div className={styles.stepContent}>
              <span className={styles.stepLabel}>1. ACCOUNT</span>
              <span className={styles.stepSub}>{user?.name || 'Verified User'}</span>
            </div>
          </div>

          {/* Step 2: Workspace */}
          <div className={styles.progressStep}>
            <div className={`${styles.stepIndicator} ${styles.stepCompleted}`} aria-label="Step 2 completed">
              ✓
            </div>
            <div className={styles.stepContent}>
              <span className={styles.stepLabel}>2. WORKSPACE</span>
              <span className={styles.stepSub}>{workspace?.name || 'Production Cloud Estate'}</span>
            </div>
          </div>

          {/* Step 3: Cloud Connection */}
          <div className={styles.progressStep}>
            <div
              className={`${styles.stepIndicator} ${hasAnyConnection ? styles.stepCompleted : styles.stepActive}`}
              aria-label="Step 3 cloud connection"
            >
              {hasAnyConnection ? '✓' : '●'}
            </div>
            <div className={styles.stepContent}>
              <span className={styles.stepLabel}>3. CLOUD</span>
              <span className={styles.stepSub}>
                {hasAnyConnection ? `${connectedCount} Connected` : 'Pending Connection'}
              </span>
            </div>
          </div>

          {/* Step 4: Sync */}
          <div className={styles.progressStep}>
            <div
              className={`${styles.stepIndicator} ${hasAnyConnection ? styles.stepCompleted : styles.stepPending}`}
              aria-label="Step 4 sync"
            >
              {hasAnyConnection ? '✓' : '○'}
            </div>
            <div className={styles.stepContent}>
              <span className={styles.stepLabel}>4. SYNC</span>
              <span className={styles.stepSub}>
                {hasAnyConnection ? 'Inventory Synced' : 'Awaiting Connection'}
              </span>
            </div>
          </div>

          {/* Step 5: Ready */}
          <div className={styles.progressStep}>
            <div
              className={`${styles.stepIndicator} ${hasAnyConnection ? styles.stepCompleted : styles.stepPending}`}
              aria-label="Step 5 ready"
            >
              {hasAnyConnection ? '✓' : '○'}
            </div>
            <div className={styles.stepContent}>
              <span className={styles.stepLabel}>5. READY</span>
              <span className={styles.stepSub}>
                {hasAnyConnection ? 'Observability Live' : 'Pending Connection'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Architecture & Security Info Box ── */}
        <div className={styles.infoBox}>
          <div className={styles.infoIcon} aria-hidden="true">
            <ShieldIcon />
          </div>
          <div className={styles.infoText}>
            <strong className={styles.infoTitle}>
              How CLOUDPULSE Connects to Your Cloud:
            </strong>
            CLOUDPULSE uses secure, least-privilege read-only role delegation (AWS IAM AssumeRole with External ID, Azure Entra ID Service Principals, GCP IAM Service Accounts, and Kubernetes Read-Only ClusterRoles).
            <span className={styles.infoSub}>
              No long-lived root access keys are ever stored or transmitted. You maintain full control to revoke role permissions at any time in your cloud provider console.
            </span>
          </div>
        </div>

        {/* ── Provider Cards Grid ── */}
        <div className={styles.providerGrid}>
          {/* Card 1: AWS */}
          <div className={`${styles.providerCard} ${awsConn?.status === 'CONNECTED' ? styles.providerCardConnected : ''}`}>
            <div>
              <div className={styles.cardHeader}>
                <div className={styles.providerBrand}>
                  <div className={styles.providerIcon}>☁️</div>
                  <div className={styles.providerInfo}>
                    <h2 className={styles.providerName}>Amazon Web Services</h2>
                    <span className={styles.providerMethod}>Cross-Account IAM Role + STS Identity</span>
                  </div>
                </div>
                <span
                  className={`${styles.statusBadge} ${
                    awsConn?.status === 'CONNECTED' ? styles.badgeConnected : styles.badgeNotConnected
                  }`}
                >
                  ● {awsConn?.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONNECTED'}
                </span>
              </div>

              <div className={styles.cardBody}>
                <p className={styles.providerDesc}>
                  Continuous discovery of EC2, S3, RDS, EKS, Lambda, CloudWatch alarms, and Cost Explorer economics across all accessible AWS regions.
                </p>

                {awsConn?.status === 'CONNECTED' && (
                  <div className={styles.connectedDetails}>
                    <span>Account: <strong style={{ color: 'var(--text-primary)' }}>{awsConn.accountIdentifier}</strong></span>
                    <span>10/10 Permissions</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button
                type="button"
                className={`${styles.btnConnect} ${awsConn?.status === 'CONNECTED' ? styles.btnConnected : ''}`}
                onClick={() => navigate('/settings/cloud-connections/aws?from=onboarding')}
              >
                {awsConn?.status === 'CONNECTED' ? '⚙️ Reconfigure AWS' : 'Connect AWS →'}
              </button>
              {awsConn?.status === 'CONNECTED' && (
                <button
                  type="button"
                  className={styles.btnDisconnect}
                  onClick={() => handleDisconnect(awsConn.id)}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Azure */}
          <div className={`${styles.providerCard} ${azureConn?.status === 'CONNECTED' ? styles.providerCardConnected : ''}`}>
            <div>
              <div className={styles.cardHeader}>
                <div className={styles.providerBrand}>
                  <div className={styles.providerIcon}>🔷</div>
                  <div className={styles.providerInfo}>
                    <h2 className={styles.providerName}>Microsoft Azure</h2>
                    <span className={styles.providerMethod}>Entra ID App + ARM Reader Role</span>
                  </div>
                </div>
                <span
                  className={`${styles.statusBadge} ${
                    azureConn?.status === 'CONNECTED' ? styles.badgeConnected : styles.badgeNotConnected
                  }`}
                >
                  ● {azureConn?.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONNECTED'}
                </span>
              </div>

              <div className={styles.cardBody}>
                <p className={styles.providerDesc}>
                  Monitor Azure Subscriptions, Resource Groups, Virtual Machines, AKS, Azure SQL, Cosmos DB, and Defender for Cloud posture.
                </p>

                {azureConn?.status === 'CONNECTED' && (
                  <div className={styles.connectedDetails}>
                    <span>Subscription: <strong style={{ color: 'var(--text-primary)' }}>{azureConn.accountIdentifier}</strong></span>
                    <span>ARM Reader</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button
                type="button"
                className={`${styles.btnConnect} ${azureConn?.status === 'CONNECTED' ? styles.btnConnected : ''}`}
                onClick={() => navigate('/settings/cloud-connections/azure?from=onboarding')}
              >
                {azureConn?.status === 'CONNECTED' ? '⚙️ Reconfigure Azure' : 'Connect Azure →'}
              </button>
              {azureConn?.status === 'CONNECTED' && (
                <button
                  type="button"
                  className={styles.btnDisconnect}
                  onClick={() => handleDisconnect(azureConn.id)}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Google Cloud */}
          <div className={`${styles.providerCard} ${gcpConn?.status === 'CONNECTED' ? styles.providerCardConnected : ''}`}>
            <div>
              <div className={styles.cardHeader}>
                <div className={styles.providerBrand}>
                  <div className={styles.providerIcon}>🟢</div>
                  <div className={styles.providerInfo}>
                    <h2 className={styles.providerName}>Google Cloud Platform</h2>
                    <span className={styles.providerMethod}>GCP Service Account + Viewer Role</span>
                  </div>
                </div>
                <span
                  className={`${styles.statusBadge} ${
                    gcpConn?.status === 'CONNECTED' ? styles.badgeConnected : styles.badgeNotConnected
                  }`}
                >
                  ● {gcpConn?.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONNECTED'}
                </span>
              </div>

              <div className={styles.cardBody}>
                <p className={styles.providerDesc}>
                  Discover GCP Projects, Cloud Asset Inventory, Compute Engine, GKE clusters, Cloud Storage, and Security Command Center findings.
                </p>

                {gcpConn?.status === 'CONNECTED' && (
                  <div className={styles.connectedDetails}>
                    <span>Project: <strong style={{ color: 'var(--text-primary)' }}>{gcpConn.accountIdentifier}</strong></span>
                    <span>IAM Viewer</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button
                type="button"
                className={`${styles.btnConnect} ${gcpConn?.status === 'CONNECTED' ? styles.btnConnected : ''}`}
                onClick={() => navigate('/settings/cloud-connections/gcp?from=onboarding')}
              >
                {gcpConn?.status === 'CONNECTED' ? '⚙️ Reconfigure GCP' : 'Connect Google Cloud →'}
              </button>
              {gcpConn?.status === 'CONNECTED' && (
                <button
                  type="button"
                  className={styles.btnDisconnect}
                  onClick={() => handleDisconnect(gcpConn.id)}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* Card 4: Kubernetes */}
          <div className={`${styles.providerCard} ${k8sConn?.status === 'CONNECTED' ? styles.providerCardConnected : ''}`}>
            <div>
              <div className={styles.cardHeader}>
                <div className={styles.providerBrand}>
                  <div className={styles.providerIcon}>☸️</div>
                  <div className={styles.providerInfo}>
                    <h2 className={styles.providerName}>Kubernetes Platform</h2>
                    <span className={styles.providerMethod}>EKS · AKS · GKE · Read-Only ClusterRole</span>
                  </div>
                </div>
                <span
                  className={`${styles.statusBadge} ${
                    k8sConn?.status === 'CONNECTED' ? styles.badgeConnected : styles.badgeNotConnected
                  }`}
                >
                  ● {k8sConn?.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONNECTED'}
                </span>
              </div>

              <div className={styles.cardBody}>
                <p className={styles.providerDesc}>
                  Unified multi-cluster control plane monitoring pods, nodes, workloads, namespaces, ingress routing, and pod failure correlations.
                </p>

                {k8sConn?.status === 'CONNECTED' && (
                  <div className={styles.connectedDetails}>
                    <span>Cluster: <strong style={{ color: 'var(--text-primary)' }}>{k8sConn.name || k8sConn.displayName || 'k8s-cluster'}</strong></span>
                    <span>ClusterRole</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button
                type="button"
                className={`${styles.btnConnect} ${k8sConn?.status === 'CONNECTED' ? styles.btnConnected : ''}`}
                onClick={() => navigate('/settings/cloud-connections/kubernetes?from=onboarding')}
              >
                {k8sConn?.status === 'CONNECTED' ? '⚙️ Reconfigure Kubernetes' : 'Connect Kubernetes →'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer / Proceed Bar ── */}
        <div className={styles.footerBar}>
          <div className={styles.footerText}>
            {hasAnyConnection
              ? '✓ At least one cloud environment is connected.'
              : 'You can connect additional providers anytime in Platform Settings.'}
          </div>

          <button
            type="button"
            className={styles.btnProceed}
            onClick={handleProceed}
            disabled={completing}
          >
            {completing
              ? 'Saving Workspace State...'
              : hasAnyConnection
              ? 'Enter Command Center →'
              : 'Skip & Go to Dashboard →'}
          </button>
        </div>
      </div>
    </div>
  );
}
