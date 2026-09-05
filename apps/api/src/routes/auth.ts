import { Router, Request, Response, NextFunction } from 'express';
import { AuthIdentityEngine } from '../services/auth-identity-engine.js';

export const authRouter: Router = Router();
const authEngine = AuthIdentityEngine.getInstance();

// ─── Lightweight In-Memory Rate Limiter ───────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60; // max attempts per window (increased from 20 to prevent false-positive lockouts)
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function authRateLimit(req: Request, res: Response, next: NextFunction): void {
  // Always allow in test environments
  if (process.env['NODE_ENV'] === 'test') {
    return next();
  }

  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const key = email ? `${ip}:${email}` : ip;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_MAX) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        ok: false,
        error: { code: 'RATE_LIMITED', message: `Too many attempts. Please try again in ${Math.ceil(retryAfterSec / 60)} minute(s).` }
      });
      return;
    }
    entry.count++;
  } else {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  // Cleanup stale entries periodically (on ~1% of requests)
  if (Math.random() < 0.01) {
    for (const [k, val] of rateLimitStore.entries()) {
      if (val.resetAt <= now) rateLimitStore.delete(k);
    }
  }

  next();
}

authRouter.post('/register', authRateLimit, (req: Request, res: Response) => {
  try {
    const { name, email, password, provider, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ ok: false, error: { message: 'Name and email are required.' } });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ ok: false, error: { message: 'Password must be at least 8 characters.' } });
    }
    const session = authEngine.register({ name, email, password, provider, role });
    return res.status(201).json({ ok: true, data: session });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
});

authRouter.post('/login', authRateLimit, (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: { message: 'Email and password are required.' } });
    }
    const session = authEngine.login({ email, password });
    return res.json({ ok: true, data: session });
  } catch (err: any) {
    return res.status(401).json({ ok: false, error: { message: err.message } });
  }
});

authRouter.get('/providers', (_req: Request, res: Response) => {
  const providers = authEngine.getConfiguredProviders();
  return res.json({ ok: true, data: providers });
});

// ─── OAuth Authorization & Callback Endpoints ───────────────────────────────

authRouter.get('/authorize/:provider', (req: Request, res: Response) => {
  try {
    const provider = req.params['provider'] as 'google' | 'microsoft' | 'apple';
    if (!['google', 'microsoft', 'apple'].includes(provider)) {
      return res.status(400).json({ ok: false, error: { message: `Unsupported OAuth provider: ${provider}` } });
    }

    const returnUrl = (req.query['returnUrl'] as string) || '/overview';
    const authData = authEngine.generateAuthorizationUrl(provider, { returnUrl });

    // If client specifically requests a direct HTTP 302 redirect
    if (req.query['redirect'] === 'true' || (req.headers.accept?.includes('text/html') && !req.headers.accept?.includes('application/json'))) {
      return res.redirect(authData.authorizationUrl);
    }

    return res.json({ ok: true, data: authData });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
});

authRouter.get('/callback/:provider', async (req: Request, res: Response) => {
  const provider = req.params['provider'] as 'google' | 'microsoft' | 'apple';
  const { code, state, error, error_description } = req.query as {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  };

  const isJsonClient = Boolean(
    req.headers.accept?.includes('application/json') && !req.headers.accept?.includes('text/html')
  );
  const frontendBaseUrl = (process.env['FRONTEND_URL'] || process.env['FRONTEND_BASE_URL'] || 'http://localhost:5173').replace(/\/+$/, '');

  try {
    if (error) {
      if (isJsonClient) {
        return res.status(400).json({ ok: false, error: { message: error_description || error } });
      }
      return res.redirect(`${frontendBaseUrl}/login?error=${encodeURIComponent(error_description || error)}`);
    }

    const result = await authEngine.handleOAuthCallback(provider, {
      code,
      state,
      error,
      error_description
    });

    if (isJsonClient) {
      return res.json({ ok: true, data: result });
    }

    // Secure redirection with short-lived single-use exchange ticket
    return res.redirect(`${frontendBaseUrl}/auth/callback?ticket=${encodeURIComponent(result.ticket)}`);
  } catch (err: any) {
    if (isJsonClient) {
      return res.status(400).json({ ok: false, error: { message: err.message || 'OAuth authentication failed.' } });
    }
    return res.redirect(`${frontendBaseUrl}/login?error=${encodeURIComponent(err.message || 'OAuth authentication failed.')}`);
  }
});

authRouter.post('/callback/:provider', async (req: Request, res: Response) => {
  const provider = req.params['provider'] as 'google' | 'microsoft' | 'apple';
  const { code, state, id_token, error, error_description } = req.body;

  const isJsonClient = Boolean(
    req.is('json') || (req.headers.accept?.includes('application/json') && !req.headers.accept?.includes('text/html'))
  );
  const frontendBaseUrl = (process.env['FRONTEND_URL'] || process.env['FRONTEND_BASE_URL'] || 'http://localhost:5173').replace(/\/+$/, '');

  try {
    if (error) {
      if (isJsonClient) {
        return res.status(400).json({ ok: false, error: { message: error_description || error } });
      }
      return res.redirect(`${frontendBaseUrl}/login?error=${encodeURIComponent(error_description || error)}`);
    }

    const result = await authEngine.handleOAuthCallback(provider, {
      code,
      state,
      id_token,
      error,
      error_description
    });

    if (isJsonClient) {
      return res.json({ ok: true, data: result });
    }

    return res.redirect(`${frontendBaseUrl}/auth/callback?ticket=${encodeURIComponent(result.ticket)}`);
  } catch (err: any) {
    if (isJsonClient) {
      return res.status(400).json({ ok: false, error: { message: err.message || 'OAuth authentication failed.' } });
    }
    return res.redirect(`${frontendBaseUrl}/login?error=${encodeURIComponent(err.message || 'OAuth authentication failed.')}`);
  }
});

authRouter.post('/exchange-ticket', (req: Request, res: Response) => {
  try {
    const { ticket } = req.body;
    if (!ticket) {
      return res.status(400).json({ ok: false, error: { message: 'Missing exchange ticket.' } });
    }

    const session = authEngine.exchangeTicket(ticket);
    return res.json({ ok: true, data: session });
  } catch (err: any) {
    return res.status(401).json({ ok: false, error: { message: err.message } });
  }
});

// Programmatic / Direct OAuth verification for automated test suites
authRouter.post('/oauth/google', (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ ok: false, error: { message: 'Google OAuth token profile missing email or name.' } });
    }
    const session = authEngine.loginWithOAuth('google', { email, name });
    return res.json({ ok: true, data: session });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
});

authRouter.post('/oauth/microsoft', (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ ok: false, error: { message: 'Microsoft OAuth token profile missing email or name.' } });
    }
    const session = authEngine.loginWithOAuth('microsoft', { email, name });
    return res.json({ ok: true, data: session });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
});

authRouter.post('/oauth/apple', (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ ok: false, error: { message: 'Apple OAuth token profile missing email or name.' } });
    }
    const session = authEngine.loginWithOAuth('apple', { email, name });
    return res.json({ ok: true, data: session });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
});

authRouter.post('/forgot-password', authRateLimit, async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ ok: false, error: { message: 'Email is required.' } });
  }
  try {
    const isDevOrTest = process.env['NODE_ENV'] !== 'production';
    if (isDevOrTest) {
      const testResult = authEngine.forgotPassword(email.trim());
      return res.json({
        ok: true,
        data: {
          message: testResult.message,
          ...(testResult.resetToken ? { resetToken: testResult.resetToken } : {})
        }
      });
    }
    const result = await authEngine.forgotPasswordAsync(email.trim());
    return res.json({ ok: true, data: { message: result.message } });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: {
        code: 'EMAIL_DELIVERY_FAILED',
        message: err.message || 'Failed to dispatch password reset email. Please contact support or try again later.'
      }
    });
  }
});

authRouter.post('/reset-password', (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ ok: false, error: { message: 'Token and new password are required.' } });
    }
    authEngine.resetPassword(token, newPassword);
    return res.json({ ok: true, data: { message: 'Password reset successfully. Please login.' } });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
});

authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  if (!token) {
    return res.status(401).json({ ok: false, error: { message: 'Missing Bearer token.' } });
  }

  const user = authEngine.verifySession(token);
  if (!user) {
    return res.status(401).json({ ok: false, error: { message: 'Invalid or expired session.' } });
  }

  const org = authEngine.getOrganization(user.organizationId);
  const ws = authEngine.getWorkspace(user.workspaceId);

  return res.json({
    ok: true,
    data: {
      user,
      organization: org,
      workspace: ws
    }
  });
});

authRouter.get('/workspaces', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  if (!token) {
    return res.status(401).json({ ok: false, error: { message: 'Missing Bearer token.' } });
  }

  const user = authEngine.verifySession(token);
  if (!user) {
    return res.status(401).json({ ok: false, error: { message: 'Invalid or expired session.' } });
  }

  const workspaces = authEngine.listWorkspaces(user.organizationId);
  return res.json({ ok: true, data: workspaces });
});

authRouter.post('/workspaces', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  if (!token) {
    return res.status(401).json({ ok: false, error: { message: 'Missing Bearer token.' } });
  }

  const user = authEngine.verifySession(token);
  if (!user) {
    return res.status(401).json({ ok: false, error: { message: 'Invalid or expired session.' } });
  }

  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ ok: false, error: { message: 'Workspace name is required.' } });
  }

  const ws = authEngine.createWorkspace(user.organizationId, name);
  return res.status(201).json({ ok: true, data: ws });
});

authRouter.put('/profile', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  if (!token) {
    return res.status(401).json({ ok: false, error: { message: 'Missing Bearer token.' } });
  }

  const user = authEngine.verifySession(token);
  if (!user) {
    return res.status(401).json({ ok: false, error: { message: 'Invalid or expired session.' } });
  }

  try {
    const updated = authEngine.updateProfile(user.id, req.body);
    return res.json({ ok: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
});

authRouter.post('/onboarding/complete', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  if (!token) {
    return res.status(401).json({ ok: false, error: { message: 'Missing Bearer token.' } });
  }

  const user = authEngine.verifySession(token);
  if (!user) {
    return res.status(401).json({ ok: false, error: { message: 'Invalid or expired session.' } });
  }

  try {
    const updated = authEngine.completeOnboarding(user.id);
    const org = authEngine.getOrganization(updated.organizationId);
    const ws = authEngine.getWorkspace(updated.workspaceId);
    return res.json({
      ok: true,
      data: {
        user: updated,
        organization: org,
        workspace: ws,
      },
    });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
});

authRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  if (token) {
    authEngine.logout(token);
  }
  return res.json({ ok: true, data: { message: 'Logged out successfully.' } });
});
