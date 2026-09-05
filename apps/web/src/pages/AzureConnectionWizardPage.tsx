import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cloudConnectionsApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { LoadingState } from '../components/ui/States.tsx';
import { CheckCircleIcon, AlertTriangleIcon } from '../components/ui/Icons.tsx';
import type { AzureSetupGuideStep, CloudConnection } from '@cloudpulse/shared';

export function AzureConnectionWizardPage() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<AzureSetupGuideStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [existingConnection, setExistingConnection] = useState<CloudConnection | null>(null);

  // Form fields
  const [displayName, setDisplayName] = useState('Production-Azure-Subscription-01');
  const [tenantId, setTenantId] = useState('72f988bf-86f1-41af-91ab-2d7cd011db47');
  const [subscriptionId, setSubscriptionId] = useState('a41d9e20-36b1-4d92-8092-18bc9401f82e');
  const [clientId, setClientId] = useState('sp-cloudpulse-azure-connector');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectResult, setConnectResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function loadGuide() {
      try {
        setLoading(true);
        const res = await cloudConnectionsApi.getAzureSetupInfo();
        setSteps(res.steps || []);

        const conns = await cloudConnectionsApi.getCloudConnections();
        const az = conns.find((c: CloudConnection) => c.provider === 'AZURE' && c.status === 'CONNECTED');
        if (az) {
          setExistingConnection(az);
          if (az.displayName) setDisplayName(az.displayName);
          if (az.tenantId) setTenantId(az.tenantId);
          if (az.subscriptionId) setSubscriptionId(az.subscriptionId);
        }
      } catch (err) {
        console.error('Failed to load Azure setup info:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGuide();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setConnectResult(null);

    try {
      const conn = await cloudConnectionsApi.connectAzure({
        displayName,
        tenantId,
        subscriptionId,
        clientId
      });

      if (conn.status === 'CONNECTED') {
        setConnectResult({
          success: true,
          message: `Successfully connected Microsoft Azure subscription '${conn.displayName}'! Live discovery and continuous inventory normalization activated.`
        });
        setExistingConnection(conn);
      } else {
        setConnectResult({
          success: false,
          message: `Azure connection returned status ${conn.status}. Please ensure Reader role is granted to Service Principal in Azure Subscription IAM.`
        });
      }
    } catch (err: any) {
      setConnectResult({
        success: false,
        message: err.message || 'Failed to connect Azure subscription.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Microsoft Azure connection setup guide..." />;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Connect Microsoft Azure (Entra ID + ARM)"
        subtitle="Least-privilege read-only authorization for Azure Subscriptions, Resource Groups, Defender for Cloud, and Azure Monitor"
        actions={
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/settings')}
          >
            ← Back to Settings
          </button>
        }
      />

      {existingConnection && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔷</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                Azure Subscription Currently Connected: {existingConnection.displayName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Tenant: {existingConnection.tenantId} · Subscription ID: {existingConnection.subscriptionId || existingConnection.accountIdentifier}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/cloud-overview')}
            >
              View Multi-Cloud Overview →
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.4fr) minmax(320px, 1fr)', gap: '18px' }}>
        {/* Left Column: 8-Step Interactive Guided Walkthrough */}
        <Card
          title="Azure Least-Privilege Setup Guide"
          subtitle="8-Step Azure CLI & Portal Walkthrough (No long-lived master keys)"
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

                {step.cliCommand && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Azure CLI Command:
                    </div>
                    <div
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#0f172a',
                        color: '#38bdf8',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11.5px',
                        borderRadius: '4px',
                        border: '1px solid #1e293b',
                        overflowX: 'auto',
                        userSelect: 'all'
                      }}
                    >
                      {step.cliCommand}
                    </div>
                  </div>
                )}

                {step.portalPath && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    <strong>Azure Portal Path:</strong> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{step.portalPath}</span>
                  </div>
                )}

                {step.requiredPermissions && step.requiredPermissions.length > 0 && (
                  <div style={{ fontSize: '11.5px' }}>
                    <strong>Permissions Used:</strong>{' '}
                    {step.requiredPermissions.map((p) => (
                      <span
                        key={p}
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
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    borderLeft: '3px solid var(--color-primary)'
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
          title="Azure Connection Authorization"
          subtitle="Authorize CloudPulse using Microsoft Entra Application Identity"
          badge={<StatusBadge status="operational" label="ENTRA OIDC" />}
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
                placeholder="e.g. Production-Azure-Subscription-01"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Directory (Tenant) ID
              </label>
              <input
                type="text"
                className="input"
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
                placeholder="e.g. 72f988bf-86f1-41af-91ab-2d7cd011db47"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Target Subscription ID
              </label>
              <input
                type="text"
                className="input"
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                value={subscriptionId}
                onChange={(e) => setSubscriptionId(e.target.value)}
                required
                placeholder="e.g. a41d9e20-36b1-4d92-8092-18bc9401f82e"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Application (Client) ID / Service Principal
              </label>
              <input
                type="text"
                className="input"
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g. sp-cloudpulse-azure-connector"
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
              🔒 <strong>Zero Client Secret Exposure:</strong> Credentials and tokens are verified strictly on the secure backend. No client secrets are stored in local storage or browser cookies.
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
              {isSubmitting ? 'Validating & Connecting...' : 'Connect Microsoft Azure'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
