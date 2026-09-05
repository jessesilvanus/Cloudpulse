import { Router, Request, Response } from 'express';
import { AuthIdentityEngine } from '../services/auth-identity-engine.js';

export const authRouter: Router = Router();
const authEngine = AuthIdentityEngine.getInstance();

authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, provider, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ ok: false, error: { message: 'Name and email are required.' } });
    }
    const session = authEngine.register({ name, email, password, provider, role });
    return res.status(201).json({ ok: true, data: session });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: { message: err.message } });
  }
});

authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ ok: false, error: { message: 'Email is required.' } });
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
  const frontendBaseUrl = process.env['FRONTEND_BASE_URL'] || 'http://localhost:5173';

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
  const frontendBaseUrl = process.env['FRONTEND_BASE_URL'] || 'http://localhost:5173';

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

authRouter.post('/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ ok: false, error: { message: 'Email is required.' } });
  }
  const result = authEngine.forgotPassword(email);
  return res.json({ ok: true, data: result });
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

authRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  if (token) {
    authEngine.logout(token);
  }
  return res.json({ ok: true, data: { message: 'Logged out successfully.' } });
});
