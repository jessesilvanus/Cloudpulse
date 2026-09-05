import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const ticket = searchParams.get('ticket');
    const oauthError = searchParams.get('error') || searchParams.get('error_description');

    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      setProcessing(false);
      return;
    }

    if (!ticket) {
      setError('Missing OAuth authentication exchange ticket.');
      setProcessing(false);
      return;
    }

    completeOAuth(ticket)
      .then(() => {
        // Clean ticket from browser history/URL
        if (typeof window !== 'undefined' && window.history.replaceState) {
          window.history.replaceState({}, '', '/overview');
        }
        navigate('/overview', { replace: true });
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to exchange OAuth authorization ticket.');
        setProcessing(false);
      });
  }, [searchParams, completeOAuth, navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--brand)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 0 24px var(--brand-glow)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" aria-hidden="true">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>

        {processing ? (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>
              Completing Authentication
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Verifying provider identity and initializing your secure workspace...
            </p>
            <div style={{ marginTop: '20px', color: 'var(--brand)', fontSize: '13px', fontWeight: 600 }}>
              Please wait...
            </div>
          </>
        ) : error ? (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-critical)', margin: '0 0 8px 0' }}>
              Authentication Failed
            </h2>
            <div
              style={{
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid var(--status-critical)',
                borderRadius: '6px',
                fontSize: '12.5px',
                color: 'var(--status-critical)',
                margin: '16px 0',
                textAlign: 'left',
              }}
            >
              ⚠️ {error}
            </div>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                marginTop: '8px',
                padding: '10px 20px',
                borderRadius: '6px',
                backgroundColor: 'var(--brand)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              Back to Sign In
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}
