import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cloudConnectionsApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { LoadingState } from '../components/ui/States.tsx';
import type { GcpSetupGuideStep, CloudConnection } from '@cloudpulse/shared';

export function GcpConnectionWizardPage() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<GcpSetupGuideStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [existingConnection, setExistingConnection] = useState<CloudConnection | null>(null);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [connectResult, setConnectResult] = useState<{ success: boolean; message: string } | null>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const isFromOnboarding = searchParams.get('from') === 'onboarding';

  useEffect(() => {
    async function loadGuide() {
      try {
        setLoading(true);
        const res = await cloudConnectionsApi.getGcpSetupInfo();
        setSteps(res.steps || []);

        const conns = await cloudConnectionsApi.getCloudConnections();
        const gcp = conns?.find((c: CloudConnection) => c.provider === 'GCP');
        if (gcp) {
          setExistingConnection(gcp);
          if (gcp.displayName) setDisplayName(gcp.displayName);
          if (gcp.projectId) setProjectId(gcp.projectId);
          if (gcp.clientEmail) setClientEmail(gcp.clientEmail);
        }
      } catch (err) {
        console.error('Failed to load GCP setup info:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGuide();
  }, []);

  const handleDisconnect = async () => {
    if (!existingConnection) return;
    try {
      setIsDisconnecting(true);
      await cloudConnectionsApi.disconnectConnection(existingConnection.id);
      setExistingConnection((prev) => prev ? { ...prev, status: 'NOT_CONNECTED', dataSource: 'NOT_CONNECTED' } : null);
      setConnectResult({ success: true, message: 'Google Cloud project disconnected.' });
    } catch (err: any) {
      setConnectResult({ success: false, message: err.message || 'Failed to disconnect GCP project.' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRevalidate = async () => {
    if (!existingConnection) return;
    try {
      setIsRevalidating(true);
      setConnectResult(null);
      const res = await cloudConnectionsApi.revalidateConnection(existingConnection.id);
      if (res?.status) {
        setExistingConnection((prev) => prev ? { ...prev, status: res.status, dataSource: res.dataSource } : null);
        setConnectResult({
          success: res.status === 'CONNECTED',
          message: res.status === 'CONNECTED' ? 'GCP connection verified successfully.' : `GCP validation status: ${res.status}`
        });
      }
    } catch (err: any) {
      setConnectResult({ success: false, message: err.message || 'Revalidation failed.' });
    } finally {
      setIsRevalidating(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setConnectResult(null);

    try {
      const payload: { displayName: string; projectId: string; clientEmail?: string; projectNumber?: string } = {
        displayName: displayName.trim() || 'GCP Project',
        projectId: projectId.trim(),
      };
      if (clientEmail.trim()) {
        payload.clientEmail = clientEmail.trim();
      }
      if (projectNumber.trim()) {
        payload.projectNumber = projectNumber.trim();
      }
      const conn = await cloudConnectionsApi.connectGcp(payload);

      if (conn.status === 'CONNECTED') {
        setConnectResult({
          success: true,
          message: `Successfully connected Google Cloud Project '${conn.displayName}'! Live discovery and continuous inventory normalization activated.`
        });
        setExistingConnection(conn);
      } else {
        setExistingConnection(conn);
        setConnectResult({
          success: false,
          message: `GCP connection returned status ${conn.status}. ${conn.metadata?.errorDetails?.message || 'Please ensure Viewer role is granted to Service Account in IAM.'}`
        });
      }
    } catch (err: any) {
      setConnectResult({
        success: false,
        message: err.message || 'Failed to connect Google Cloud project.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Google Cloud Platform connection setup guide..." />;
  }

  const isConnected = existingConnection?.status === 'CONNECTED';

  return (
    <div className="page-container">
      <PageHeader
        title="Connect Google Cloud Platform (GCP IAM)"
        subtitle="Least-privilege read-only authorization for GCP Projects, Cloud Asset Inventory, Security Command Center, and Cloud Monitoring"
        actions={
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(isFromOnboarding ? '/onboarding' : '/settings')}
          >
            {isFromOnboarding ? '← Back to Onboarding' : '← Back to Settings'}
          </button>
        }
      />

      {existingConnection && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🌐</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  Google Cloud Project: {existingConnection.displayName}
                </div>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                    color: isConnected ? 'var(--status-healthy)' : 'var(--text-muted)',
                  }}
                >
                  ● {existingConnection.status}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                Project ID: {existingConnection.projectId || existingConnection.accountIdentifier} · Service Account: {existingConnection.clientEmail || 'Not configured'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleRevalidate}
              disabled={isRevalidating}
            >
              {isRevalidating ? 'Validating...' : '🔄 Revalidate'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              style={{ color: 'var(--status-critical)' }}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
            {isConnected && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/cloud-overview')}
              >
                View Multi-Cloud Overview →
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.4fr) minmax(320px, 1fr)', gap: '18px' }}>
        {/* Left Column: 8-Step Interactive Guided Walkthrough */}
        <Card
          title="GCP Least-Privilege Setup Guide"
          subtitle="8-Step Google Cloud CLI & Console Walkthrough (No master service account keys)"
          badge={<span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}>Step {activeStep} of {steps.length}</span>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Step navigation pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
              {steps.map((step) => {
                const isCurrent = step.stepNumber === activeStep;
                return (
                  <button
                    key={step.stepNumber}
                    onClick={() => setActiveStep(step.stepNumber)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '16px',
                      border: isCurrent ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                      backgroundColor: isCurrent ? 'var(--color-primary-bg, rgba(59, 130, 246, 0.15))' : 'var(--bg-surface)',
                      color: isCurrent ? 'var(--color-primary)' : 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: isCurrent ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {step.stepNumber}. {step.title.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Current Step Detailed Card */}
            {steps.filter((s) => s.stepNumber === activeStep).map((step) => (
              <div
                key={step.stepNumber}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Step {step.stepNumber}: {step.title}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                    {step.description}
                  </div>
                </div>

                {step.gcloudCommand && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      gcloud CLI Command:
                    </div>
                    <div
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#0f172a',
                        color: '#34d399',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11.5px',
                        borderRadius: '4px',
                        border: '1px solid #1e293b',
                        overflowX: 'auto',
                        userSelect: 'all'
                      }}
                    >
                      {step.gcloudCommand}
                    </div>
                  </div>
                )}

                {step.consolePath && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    <strong>Google Cloud Console Path:</strong> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{step.consolePath}</span>
                  </div>
                )}

                {step.requiredRoles && step.requiredRoles.length > 0 && (
                  <div style={{ fontSize: '11.5px' }}>
                    <strong>Roles Granted:</strong>{' '}
                    {step.requiredRoles.map((r) => (
                      <span
                        key={r}
                        style={{
                          display: 'inline-block',
                          padding: '1px 6px',
                          marginRight: '4px',
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '3px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10.5px'
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(52, 211, 153, 0.08)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    borderLeft: '3px solid #10b981'
                  }}
                >
                  💡 <strong>Verification Hint:</strong> {step.verificationHint}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={activeStep <= 1}
                    onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                  >
                    ← Previous Step
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={activeStep >= steps.length}
                    onClick={() => setActiveStep((prev) => Math.min(steps.length, prev + 1))}
                  >
                    Next Step →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column: Connection Form */}
        <Card
          title="GCP Connection Authorization"
          subtitle="Authorize CloudPulse using dedicated Service Account Identity"
          badge={<StatusBadge status="operational" label="CLOUD IAM" />}
        >
          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Connection Display Name
              </label>
              <input
                type="text"
                className="input"
                style={{ width: '100%' }}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="e.g. cloudpulse-production-gcp-01"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Google Cloud Project ID
              </label>
              <input
                type="text"
                className="input"
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                placeholder="e.g. cloudpulse-production-gcp-01"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Service Account Client Email
              </label>
              <input
                type="text"
                className="input"
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="e.g. cloudpulse-connector@project.iam.gserviceaccount.com"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Project Number (Optional)
              </label>
              <input
                type="text"
                className="input"
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                placeholder="e.g. 819238471920"
              />
            </div>

            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                color: 'var(--text-muted)'
              }}
            >
              🔒 <strong>Zero Private Key Exposure:</strong> Authentication is handled server-side via Workload Identity or secure backend credentials. No private keys are stored in the frontend.
            </div>

            {connectResult && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: connectResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${connectResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  color: connectResult.success ? 'var(--status-healthy)' : 'var(--status-critical)',
                  fontSize: '12px'
                }}
              >
                {connectResult.message}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px 0', fontSize: '13px', fontWeight: 700 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Validating & Connecting...' : 'Connect Google Cloud'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
