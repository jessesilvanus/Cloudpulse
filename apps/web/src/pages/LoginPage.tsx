import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { authApi } from '../api/client.ts';
import { ShieldIcon } from '../components/ui/Icons.tsx';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('PLATFORM_ENGINEER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { user, isAuthenticated, login, initiateOAuth, register, configuredProviders } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rawReturnUrl = (location.state as any)?.from?.pathname;
  const returnUrl = rawReturnUrl && rawReturnUrl !== '/login' && rawReturnUrl !== '/register' ? rawReturnUrl : '/overview';

  useEffect(() => {
    document.title = 'CLOUDPULSE — Real-Time Cloud Intelligence & Operations Platform';
    if (isAuthenticated && user) {
      if (user.onboardingCompleted === false) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(returnUrl, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, returnUrl]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        await login({ email, password });
        setSuccessMsg('Signed in successfully. Loading workspace...');
        setTimeout(() => navigate(returnUrl), 400);
      } else if (mode === 'REGISTER') {
        await register({ name, email, password, role });
        setSuccessMsg('Enterprise account created! Redirecting to cloud connection onboarding...');
        setTimeout(() => navigate('/onboarding'), 400);
      } else if (mode === 'FORGOT') {
        const res = await authApi.forgotPassword(email);
        setSuccessMsg(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'microsoft' | 'apple') => {
    setError(null);
    setLoading(true);
    try {
      await initiateOAuth(provider, returnUrl);
    } catch (err: any) {
      const providerLabel = provider === 'google' ? 'Google Workspace' : provider === 'microsoft' ? 'Microsoft 365' : 'Apple ID';
      setError(err.message || `${providerLabel} OAuth is not configured on this server.`);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* ── Left Column: Enterprise Branding & Capability Overview ── */}
        <div className={styles.leftColumn}>
          {/* Brand Header */}
          <div className={styles.brandHeader}>
            <div className={styles.brandIcon}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" aria-hidden="true">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className={styles.brandTitleGroup}>
              <h1 className={styles.brandTitle}>CLOUDPULSE</h1>
              <span className={styles.brandTagline}>Real-Time Cloud Intelligence & Operations Platform</span>
            </div>
          </div>

          {/* Product Statement */}
          <p className={styles.productStatement}>
            Unified intelligence, continuous governance, FinOps, SRE, and controlled automation across multi-cloud and Kubernetes environments.
          </p>

          {/* Platform Capability Pillars */}
          <div className={styles.pillarsGrid}>
            <div className={styles.pillarCard}>
              <div className={styles.pillarIcon}>⚡</div>
              <div className={styles.pillarText}>
                <div className={styles.pillarTitle}>Cloud Intelligence</div>
                <div className={styles.pillarDesc}>Real-time topology, cross-cloud asset graph & live telemetry.</div>
              </div>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarIcon}>🛡️</div>
              <div className={styles.pillarText}>
                <div className={styles.pillarTitle}>Security & Zero Trust</div>
                <div className={styles.pillarDesc}>Least-privilege IAM, posture audit & compliance guardrails.</div>
              </div>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarIcon}>💰</div>
              <div className={styles.pillarText}>
                <div className={styles.pillarTitle}>FinOps & Economics</div>
                <div className={styles.pillarDesc}>Unit cost tracking, budget governance & waste anomaly detection.</div>
              </div>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarIcon}>📈</div>
              <div className={styles.pillarText}>
                <div className={styles.pillarTitle}>SRE & Resilience</div>
                <div className={styles.pillarDesc}>Service SLOs, automated runbooks & blast radius simulation.</div>
              </div>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarIcon}>☸️</div>
              <div className={styles.pillarText}>
                <div className={styles.pillarTitle}>Kubernetes Operations</div>
                <div className={styles.pillarDesc}>Cluster health, workload lifecycles & pod mesh observability.</div>
              </div>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarIcon}>🔒</div>
              <div className={styles.pillarText}>
                <div className={styles.pillarTitle}>Controlled Operations</div>
                <div className={styles.pillarDesc}>Two-Person Control, dry-run safety & audit-logged remediation.</div>
              </div>
            </div>
          </div>

          {/* Cloud Infrastructure Separation Notice */}
          <div className={styles.separationNotice}>
            <div className={styles.separationIcon}>
              <ShieldIcon />
            </div>
            <div className={styles.separationContent}>
              <span className={styles.separationTitle}>Identity & Cloud Infrastructure Separation</span>
              Signing in to CLOUDPULSE does not grant CLOUDPULSE access to your cloud environment.
              <span className={styles.separationSubtext}>
                After signing in, you can securely connect AWS, Azure, Google Cloud, or Kubernetes using least-privilege IAM trust policies and read-only roles.
              </span>
            </div>
          </div>
        </div>

        {/* ── Right Column: Authentication Form Card ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              {mode === 'LOGIN'
                ? 'Sign in to CLOUDPULSE'
                : mode === 'REGISTER'
                ? 'Create Enterprise Account'
                : 'Reset Your Password'}
            </h2>
            <p className={styles.cardSubtitle}>
              {mode === 'LOGIN'
                ? 'Authenticate to access your organization workspace & telemetry.'
                : mode === 'REGISTER'
                ? 'Create a verified account for your cloud engineering team.'
                : 'Enter your registered email to receive recovery instructions.'}
            </p>
          </div>

          {error && (
            <div role="alert" className={styles.alertError}>
              <span aria-hidden="true">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div role="status" className={styles.alertSuccess}>
              <span aria-hidden="true">✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Social Sign-In (Only active/configured providers) */}
          {mode !== 'FORGOT' && (
            <div className={styles.oauthList}>
              {configuredProviders?.google?.enabled && (
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                  aria-label="Continue with Google Workspace"
                  className={styles.oauthButton}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              )}

              {configuredProviders?.microsoft?.enabled && (
                <button
                  type="button"
                  onClick={() => handleOAuth('microsoft')}
                  disabled={loading}
                  aria-label="Continue with Microsoft 365"
                  className={styles.oauthButton}
                >
                  <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden="true">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  <span>Continue with Microsoft</span>
                </button>
              )}

              {configuredProviders?.apple?.enabled && (
                <button
                  type="button"
                  onClick={() => handleOAuth('apple')}
                  disabled={loading}
                  aria-label="Continue with Apple"
                  className={styles.oauthButton}
                >
                  <svg width="15" height="16" viewBox="0 0 170 170" fill="currentColor" aria-hidden="true">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.07-7.6-7.85-11.75-14.35-6.3-9.98-11.22-21.72-14.76-35.24-3.53-13.52-5.3-26.16-5.3-37.92 0-14.63 3.65-26.83 10.96-36.6 7.3-9.78 16.59-14.76 27.87-14.94 4.35 0 9.4 1.14 15.15 3.42 5.75 2.27 9.53 3.47 11.35 3.59 1.63 0 5.66-1.28 12.1-3.83 6.43-2.55 11.9-3.71 16.39-3.48 12.18.63 21.73 4.88 28.66 12.74-10.66 6.44-15.89 15.34-15.69 26.71.21 8.93 3.67 16.3 10.38 22.12 6.71 5.82 14.65 9.17 23.82 10.05-2.07 6.1-4.75 12.44-8.03 19.03zM119.22 33.02c0-7.39 2.64-14.28 7.92-20.67 5.29-6.39 11.76-10.45 19.42-12.19.76 4.35.53 8.78-.69 13.29-1.22 4.51-3.6 8.84-7.14 13-4.24 4.89-8.94 8.21-14.1 9.96-1.85.65-3.65 1.05-5.41 1.2-0.09-1.5-.13-2.73-.13-3.69z" />
                  </svg>
                  <span>Continue with Apple</span>
                </button>
              )}

              <div className={styles.divider}>
                <div className={styles.dividerLine} />
                <span className={styles.dividerText}>or continue with email</span>
                <div className={styles.dividerLine} />
              </div>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className={styles.form}>
            {mode === 'REGISTER' && (
              <>
                <div className={styles.inputGroup}>
                  <label htmlFor="reg-name" className={styles.inputLabel}>
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="reg-role" className={styles.inputLabel}>
                    Platform Role
                  </label>
                  <select
                    id="reg-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={styles.inputField}
                  >
                    <option value="OWNER">Owner (Full Admin)</option>
                    <option value="ADMIN">Platform Admin</option>
                    <option value="PLATFORM_ENGINEER">Platform / SRE Engineer</option>
                    <option value="SECURITY">Security Lead / Auditor</option>
                    <option value="FINOPS">FinOps Specialist</option>
                    <option value="DEVELOPER">Developer / Service Lead</option>
                    <option value="READ_ONLY">Read Only Observer</option>
                  </select>
                </div>
              </>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="auth-email" className={styles.inputLabel}>
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@enterprise.io"
                autoComplete="email"
                className={styles.inputField}
              />
            </div>

            {mode !== 'FORGOT' && (
              <div className={styles.inputGroup}>
                <div className={styles.inputLabel}>
                  <label htmlFor="auth-password">Password</label>
                  {mode === 'LOGIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessMsg(null);
                        setMode('FORGOT');
                      }}
                      className={styles.linkButton}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete={mode === 'LOGIN' ? 'current-password' : 'new-password'}
                  className={styles.inputField}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading
                ? 'Authenticating...'
                : mode === 'LOGIN'
                ? 'Sign In →'
                : mode === 'REGISTER'
                ? 'Create Account & Continue →'
                : 'Send Password Reset Link →'}
            </button>
          </form>

          {/* Mode Switcher Links */}
          <div className={styles.modeSwitch}>
            {mode === 'LOGIN' ? (
              <div>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMsg(null);
                    setMode('REGISTER');
                  }}
                  className={styles.linkButton}
                >
                  Create Account
                </button>
              </div>
            ) : mode === 'REGISTER' ? (
              <div>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMsg(null);
                    setMode('LOGIN');
                  }}
                  className={styles.linkButton}
                >
                  Sign In
                </button>
              </div>
            ) : (
              <div>
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMsg(null);
                    setMode('LOGIN');
                  }}
                  className={styles.linkButton}
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>

          <div className={styles.securityBadge}>
            🔒 SOC 2 Type II Certified · SAML 2.0 / OIDC Compliant · 256-bit TLS
          </div>
        </div>
      </div>
    </div>
  );
}

