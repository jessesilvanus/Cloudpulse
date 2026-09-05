import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/client.ts';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = 'CLOUDPULSE — Reset Password';
    if (!token) {
      setError('No reset token found. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('No reset token found. Please request a new password reset link.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired or already been used.');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.09) 0%, #090c10 75%)',
    boxSizing: 'border-box',
  };

  const formCardStyle: React.CSSProperties = {
    background: 'var(--bg-card, #111827)',
    border: '1px solid var(--border-default, #1e293b)',
    borderRadius: '12px',
    padding: '32px 28px',
    width: '100%',
    maxWidth: '420px',
    boxSizing: 'border-box',
    boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
  };

  return (
    <div style={cardStyle}>
      <div style={formCardStyle}>
        {/* Brand Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.06em', marginBottom: '6px' }}>
            CLOUDPULSE
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', margin: '0 0 6px 0' }}>
            Set New Password
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', margin: 0, lineHeight: 1.5 }}>
            Enter a new password for your CLOUDPULSE account.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div role="alert" style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            borderRadius: '6px',
            fontSize: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span aria-hidden>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success State */}
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <p style={{ fontSize: '14px', color: 'var(--text-primary, #f1f5f9)', margin: '0 0 20px 0', fontWeight: 600 }}>
              Password reset successfully!
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: '0 0 24px 0' }}>
              You can now sign in with your new password.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                padding: '11px 24px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label htmlFor="new-password" style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)' }}>
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                disabled={!token}
                style={{
                  width: '100%',
                  padding: '10px 13px',
                  borderRadius: '6px',
                  background: 'var(--bg-elevated, #1e293b)',
                  border: '1px solid var(--border-subtle, #334155)',
                  color: 'var(--text-primary, #f1f5f9)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label htmlFor="confirm-password" style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)' }}>
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                disabled={!token}
                style={{
                  width: '100%',
                  padding: '10px 13px',
                  borderRadius: '6px',
                  background: 'var(--bg-elevated, #1e293b)',
                  border: '1px solid var(--border-subtle, #334155)',
                  color: 'var(--text-primary, #f1f5f9)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              style={{
                marginTop: '6px',
                padding: '11px 16px',
                borderRadius: '6px',
                background: loading || !token ? '#475569' : '#3b82f6',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: loading || !token ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background-color 0.15s, opacity 0.15s',
              }}
            >
              {loading ? 'Resetting Password...' : 'Reset Password →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit' }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
