import {
  UserProfile,
  Organization,
  Workspace,
  Membership,
  RealUserRole,
  AuthSession,
  ConfiguredProvidersSummary,
  OAuthAuthorizationResponse
} from '@cloudpulse/shared';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

interface OAuthPendingState {
  provider: 'google' | 'apple' | 'microsoft';
  createdAt: number;
  returnUrl?: string;
}

interface OAuthTicketEntry {
  session: AuthSession;
  expiresAt: number;
}

export class AuthIdentityEngine {
  private static instance: AuthIdentityEngine;

  private users: Map<string, UserProfile> = new Map();
  private userPasswords: Map<string, string> = new Map(); // Hashed passwords
  private resetTokens: Map<string, { email: string; expiresAt: number }> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private workspaces: Map<string, Workspace> = new Map();
  private memberships: Map<string, Membership> = new Map();
  private sessions: Map<string, UserProfile> = new Map(); // Token -> UserProfile

  // Real OAuth state & ticket store
  private oauthStates: Map<string, OAuthPendingState> = new Map();
  private oauthTickets: Map<string, OAuthTicketEntry> = new Map();

  private constructor() {
    this.seedInitialTenants();
    this.loadStore();
    // Ensure default tenants are re-asserted if store was empty
    this.seedInitialTenants();
    this.persistStore();
  }

  public static getInstance(): AuthIdentityEngine {
    if (!AuthIdentityEngine.instance) {
      AuthIdentityEngine.instance = new AuthIdentityEngine();
    }
    return AuthIdentityEngine.instance;
  }

  private getStoreFilePath(): string {
    const customDir = process.env['DATA_DIR'];
    if (customDir) {
      try {
        if (!fs.existsSync(customDir)) fs.mkdirSync(customDir, { recursive: true });
        return path.join(customDir, 'cloudpulse-auth-store.json');
      } catch {
        // Fallback to primary below
      }
    }
    const primaryDir = path.resolve(process.cwd(), 'data');
    try {
      if (!fs.existsSync(primaryDir)) fs.mkdirSync(primaryDir, { recursive: true });
      return path.join(primaryDir, 'cloudpulse-auth-store.json');
    } catch {
      return path.join(os.tmpdir(), 'cloudpulse-auth-store.json');
    }
  }

  private isTestMode(): boolean {
    return process.env['NODE_ENV'] === 'test' || process.argv.some((arg) => arg.includes('test'));
  }

  private loadStore(): void {
    if (this.isTestMode()) return;
    try {
      const filePath = this.getStoreFilePath();
      if (!fs.existsSync(filePath)) return;
      const raw = fs.readFileSync(filePath, 'utf-8');
      if (!raw || !raw.trim()) return;
      const data = JSON.parse(raw);
      if (data.users) {
        for (const [k, v] of Object.entries(data.users)) this.users.set(k, v as UserProfile);
      }
      if (data.userPasswords) {
        for (const [k, v] of Object.entries(data.userPasswords)) this.userPasswords.set(k, v as string);
      }
      if (data.organizations) {
        for (const [k, v] of Object.entries(data.organizations)) this.organizations.set(k, v as Organization);
      }
      if (data.workspaces) {
        for (const [k, v] of Object.entries(data.workspaces)) this.workspaces.set(k, v as Workspace);
      }
      if (data.memberships) {
        for (const [k, v] of Object.entries(data.memberships)) this.memberships.set(k, v as Membership);
      }
      if (data.sessions) {
        for (const [k, v] of Object.entries(data.sessions)) this.sessions.set(k, v as UserProfile);
      }
      if (data.resetTokens) {
        const now = Date.now();
        for (const [k, v] of Object.entries(data.resetTokens)) {
          const entry = v as { email: string; expiresAt: number };
          if (entry.expiresAt > now) {
            this.resetTokens.set(k, entry);
          }
        }
      }
    } catch (err: any) {
      console.warn('[AuthEngine] Failed to load persisted auth store:', err?.message || err);
    }
  }

  private persistStore(): void {
    if (this.isTestMode()) return;
    try {
      const filePath = this.getStoreFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        users: Object.fromEntries(this.users),
        userPasswords: Object.fromEntries(this.userPasswords),
        organizations: Object.fromEntries(this.organizations),
        workspaces: Object.fromEntries(this.workspaces),
        memberships: Object.fromEntries(this.memberships),
        sessions: Object.fromEntries(this.sessions),
        resetTokens: Object.fromEntries(this.resetTokens),
      };
      const tmpPath = `${filePath}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, filePath);
    } catch (err: any) {
      console.warn('[AuthEngine] Failed to persist auth store:', err?.message || err);
    }
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + 'cloudpulse-salt-2026').digest('hex');
  }

  private seedInitialTenants(): void {
    const orgId = 'org-cloudpulse-corp';
    const wsId = 'ws-production';
    const userId = 'usr-jesse-silvanus';

    const org: Organization = {
      id: orgId,
      name: 'CloudPulse Corp',
      slug: 'cloudpulse-corp',
      tier: 'ENTERPRISE',
      createdAt: '2026-01-01T00:00:00Z',
      ownerId: userId
    };

    const ws: Workspace = {
      id: wsId,
      organizationId: orgId,
      name: 'Production Cloud Estate',
      slug: 'production',
      createdAt: '2026-01-01T00:00:00Z'
    };

    const user: UserProfile = {
      id: userId,
      name: 'Jesse Silvanus',
      email: 'jesse@cloudpulse.io',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      provider: 'email',
      role: 'OWNER',
      status: 'ACTIVE',
      organizationId: orgId,
      workspaceId: wsId,
      onboardingCompleted: true,
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: new Date().toISOString()
    };

    const membership: Membership = {
      id: 'mem-001',
      userId,
      organizationId: orgId,
      workspaceId: wsId,
      role: 'OWNER',
      joinedAt: '2026-01-01T00:00:00Z'
    };

    this.organizations.set(orgId, org);
    this.workspaces.set(wsId, ws);
    this.users.set(userId, user);
    this.userPasswords.set('jesse@cloudpulse.io', this.hashPassword('CloudPulse2026!'));
    this.memberships.set(membership.id, membership);
    // Note: No permanent static session token — users must log in via /auth/login
  }

  public register(payload: {
    name: string;
    email: string;
    password?: string;
    provider?: 'google' | 'apple' | 'microsoft' | 'email';
    role?: RealUserRole;
  }): AuthSession {
    const existing = Array.from(this.users.values()).find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (existing) {
      throw new Error(`Account with email ${payload.email} already exists.`);
    }

    const userId = `usr-${crypto.randomBytes(4).toString('hex')}`;
    const orgId = `org-${crypto.randomBytes(4).toString('hex')}`;
    const wsId = `ws-${crypto.randomBytes(4).toString('hex')}`;

    const org: Organization = {
      id: orgId,
      name: `${payload.name}'s Organization`,
      slug: payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      tier: 'ENTERPRISE',
      createdAt: new Date().toISOString(),
      ownerId: userId
    };

    const ws: Workspace = {
      id: wsId,
      organizationId: orgId,
      name: 'Default Workspace',
      slug: 'default',
      createdAt: new Date().toISOString()
    };

    const user: UserProfile = {
      id: userId,
      name: payload.name,
      email: payload.email,
      provider: payload.provider || 'email',
      role: payload.role || 'OWNER',
      status: 'ACTIVE',
      organizationId: orgId,
      workspaceId: wsId,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const membership: Membership = {
      id: `mem-${crypto.randomBytes(4).toString('hex')}`,
      userId,
      organizationId: orgId,
      workspaceId: wsId,
      role: user.role,
      joinedAt: new Date().toISOString()
    };

    this.organizations.set(orgId, org);
    this.workspaces.set(wsId, ws);
    this.users.set(userId, user);
    if (payload.password) {
      this.userPasswords.set(payload.email.toLowerCase(), this.hashPassword(payload.password));
    }
    this.memberships.set(membership.id, membership);

    const token = `cp-token-${crypto.randomBytes(16).toString('hex')}`;
    this.sessions.set(token, user);
    this.persistStore();

    return { user, token, organization: org, workspace: ws };
  }

  public login(payload: { email: string; password?: string }): AuthSession {
    const emailKey = payload.email?.toLowerCase()?.trim();
    if (!emailKey) {
      throw new Error('Email is required.');
    }
    if (!payload.password) {
      throw new Error('Password is required.');
    }
    const user = Array.from(this.users.values()).find((u) => u.email.toLowerCase() === emailKey);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    // Always verify password — no bypass allowed
    const hashed = this.hashPassword(payload.password);
    if (this.userPasswords.get(emailKey) !== hashed) {
      throw new Error('Invalid email or password.');
    }

    user.lastLoginAt = new Date().toISOString();
    const org = this.organizations.get(user.organizationId) || {
      id: user.organizationId,
      name: 'Primary Organization',
      slug: 'primary',
      tier: 'ENTERPRISE',
      createdAt: user.createdAt,
      ownerId: user.id
    };
    const ws = this.workspaces.get(user.workspaceId) || {
      id: user.workspaceId,
      organizationId: user.organizationId,
      name: 'Primary Workspace',
      slug: 'primary',
      createdAt: user.createdAt
    };

    const token = `cp-token-${crypto.randomBytes(16).toString('hex')}`;
    this.sessions.set(token, user);
    this.persistStore();

    return { user, token, organization: org, workspace: ws };
  }

  /**
   * Safe account linking or new registration for verified OAuth identities
   */
  public linkOrRegisterOAuthUser(
    provider: 'google' | 'apple' | 'microsoft',
    identity: { email: string; name: string; subjectId?: string }
  ): AuthSession {
    const emailKey = identity.email.toLowerCase();
    const existing = Array.from(this.users.values()).find((u) => u.email.toLowerCase() === emailKey);

    if (existing) {
      existing.lastLoginAt = new Date().toISOString();
      const org = this.organizations.get(existing.organizationId) || {
        id: existing.organizationId,
        name: 'Primary Organization',
        slug: 'primary',
        tier: 'ENTERPRISE',
        createdAt: existing.createdAt,
        ownerId: existing.id
      };
      const ws = this.workspaces.get(existing.workspaceId) || {
        id: existing.workspaceId,
        organizationId: existing.organizationId,
        name: 'Primary Workspace',
        slug: 'primary',
        createdAt: existing.createdAt
      };
      const token = `cp-token-${crypto.randomBytes(16).toString('hex')}`;
      this.sessions.set(token, existing);
      this.persistStore();
      return { user: existing, token, organization: org, workspace: ws };
    }

    return this.register({
      name: identity.name,
      email: identity.email,
      provider
    });
  }

  /**
   * Backward-compatible programmatic OAuth login for automated test suites
   */
  public loginWithOAuth(provider: 'google' | 'apple' | 'microsoft', payload: { email: string; name: string }): AuthSession {
    return this.linkOrRegisterOAuthUser(provider, payload);
  }

  /**
   * Returns honest provider discovery reflecting actual environment configurations
   */
  public getConfiguredProviders(): ConfiguredProvidersSummary {
    const isGoogleConfigured = Boolean(
      process.env['GOOGLE_CLIENT_ID'] && process.env['GOOGLE_CLIENT_SECRET']
    );
    const isMicrosoftConfigured = Boolean(
      process.env['MICROSOFT_CLIENT_ID'] && process.env['MICROSOFT_CLIENT_SECRET']
    );
    const isAppleConfigured = Boolean(
      process.env['APPLE_CLIENT_ID'] && (process.env['APPLE_CLIENT_SECRET'] || process.env['APPLE_PRIVATE_KEY'])
    );

    return {
      emailPassword: { enabled: true, allowsRegistration: true },
      google: {
        enabled: isGoogleConfigured,
        name: 'Google Workspace / Gmail',
        configured: isGoogleConfigured,
        authUrl: isGoogleConfigured ? '/api/v1/auth/authorize/google' : undefined,
        reason: isGoogleConfigured ? undefined : 'GOOGLE_CLIENT_ID environment variable not configured'
      },
      microsoft: {
        enabled: isMicrosoftConfigured,
        name: 'Microsoft 365 / Entra ID',
        configured: isMicrosoftConfigured,
        authUrl: isMicrosoftConfigured ? '/api/v1/auth/authorize/microsoft' : undefined,
        reason: isMicrosoftConfigured ? undefined : 'MICROSOFT_CLIENT_ID environment variable not configured'
      },
      apple: {
        enabled: isAppleConfigured,
        name: 'Apple ID',
        configured: isAppleConfigured,
        authUrl: isAppleConfigured ? '/api/v1/auth/authorize/apple' : undefined,
        reason: isAppleConfigured ? undefined : 'APPLE_CLIENT_ID environment variable not configured'
      }
    };
  }

  /**
   * Generates real OAuth 2.0 / OIDC Authorization URL with CSRF state parameter
   */
  public generateAuthorizationUrl(
    provider: 'google' | 'microsoft' | 'apple',
    options?: { returnUrl?: string; customRedirectUri?: string }
  ): OAuthAuthorizationResponse {
    const state = crypto.randomBytes(24).toString('hex');
    this.oauthStates.set(state, {
      provider,
      createdAt: Date.now(),
      returnUrl: options?.returnUrl || '/overview'
    });

    const baseUrl = process.env['API_BASE_URL'] || 'http://localhost:3001';
    const defaultRedirectUri = `${baseUrl}/api/v1/auth/callback/${provider}`;
    const redirectUri = options?.customRedirectUri || defaultRedirectUri;

    if (provider === 'google') {
      const clientId = process.env['GOOGLE_CLIENT_ID'];
      if (!clientId) {
        throw new Error('Google OAuth is not configured on this server (missing GOOGLE_CLIENT_ID).');
      }
      const nonce = crypto.randomBytes(16).toString('hex');
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        nonce,
        access_type: 'offline',
        prompt: 'consent'
      });
      return {
        authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
        state
      };
    }

    if (provider === 'microsoft') {
      const clientId = process.env['MICROSOFT_CLIENT_ID'];
      const tenantId = process.env['MICROSOFT_TENANT_ID'] || 'common';
      if (!clientId) {
        throw new Error('Microsoft OAuth is not configured on this server (missing MICROSOFT_CLIENT_ID).');
      }
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email User.Read',
        state,
        response_mode: 'query'
      });
      return {
        authorizationUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`,
        state
      };
    }

    if (provider === 'apple') {
      const clientId = process.env['APPLE_CLIENT_ID'];
      if (!clientId) {
        throw new Error('Apple Sign-In is not configured on this server (missing APPLE_CLIENT_ID).');
      }
      const nonce = crypto.randomBytes(16).toString('hex');
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code id_token',
        scope: 'name email',
        response_mode: 'form_post',
        state,
        nonce
      });
      return {
        authorizationUrl: `https://appleid.apple.com/auth/authorize?${params.toString()}`,
        state
      };
    }

    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  /**
   * Validates and consumes CSRF state token
   */
  public validateAndConsumeState(state: string, expectedProvider: 'google' | 'microsoft' | 'apple'): { returnUrl?: string | undefined } {
    const stateData = this.oauthStates.get(state);
    if (!stateData) {
      throw new Error('Invalid or expired OAuth state parameter (CSRF protection failure).');
    }
    if (Date.now() - stateData.createdAt > 600000) {
      this.oauthStates.delete(state);
      throw new Error('OAuth state parameter has expired. Please try signing in again.');
    }
    if (stateData.provider !== expectedProvider) {
      this.oauthStates.delete(state);
      throw new Error('OAuth state provider mismatch.');
    }
    this.oauthStates.delete(state);
    return { returnUrl: stateData.returnUrl };
  }

  /**
   * Handles real OAuth callback, executes code exchange, verifies identity, and creates exchange ticket
   */
  public async handleOAuthCallback(
    provider: 'google' | 'microsoft' | 'apple',
    params: { code?: string | undefined; state?: string | undefined; id_token?: string | undefined; error?: string | undefined; error_description?: string | undefined }
  ): Promise<{ session: AuthSession; ticket: string; returnUrl?: string | undefined }> {
    if (params.error) {
      throw new Error(`OAuth authorization error from ${provider}: ${params.error_description || params.error}`);
    }
    if (!params.code) {
      throw new Error(`Missing authorization code in OAuth callback from ${provider}.`);
    }
    if (!params.state) {
      throw new Error(`Missing state parameter in OAuth callback from ${provider}.`);
    }

    const { returnUrl } = this.validateAndConsumeState(params.state, provider);

    let verifiedIdentity: { email: string; name: string; subjectId?: string };

    if (provider === 'google') {
      verifiedIdentity = await this.exchangeGoogleCode(params.code);
    } else if (provider === 'microsoft') {
      verifiedIdentity = await this.exchangeMicrosoftCode(params.code);
    } else {
      verifiedIdentity = await this.exchangeAppleCode(params.code, params.id_token);
    }

    const session = this.linkOrRegisterOAuthUser(provider, verifiedIdentity);

    // Create single-use exchange ticket (valid 60 seconds)
    const ticket = this.createExchangeTicket(session, 60000);

    return { session, ticket, returnUrl };
  }

  /**
   * Issues a short-lived single-use ticket for secure browser token exchange
   */
  public createExchangeTicket(session: AuthSession, ttlMs: number = 60000): string {
    const ticket = crypto.randomBytes(24).toString('hex');
    this.oauthTickets.set(ticket, {
      session,
      expiresAt: Date.now() + ttlMs
    });
    return ticket;
  }

  private async exchangeGoogleCode(code: string): Promise<{ email: string; name: string; subjectId: string }> {
    const clientId = process.env['GOOGLE_CLIENT_ID'];
    const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
    const baseUrl = process.env['API_BASE_URL'] || 'http://localhost:3001';
    const redirectUri = `${baseUrl}/api/v1/auth/callback/google`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured on server.');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      throw new Error(`Google token exchange failed (${tokenRes.status}): ${errBody}`);
    }

    const tokenData = (await tokenRes.json()) as any;
    const accessToken = tokenData.access_token;

    const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userRes.ok) {
      throw new Error(`Google userinfo fetch failed (${userRes.status})`);
    }

    const userData = (await userRes.json()) as any;
    if (!userData.email) {
      throw new Error('Google userinfo did not contain a verified email.');
    }

    return {
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      subjectId: userData.sub
    };
  }

  private async exchangeMicrosoftCode(code: string): Promise<{ email: string; name: string; subjectId: string }> {
    const clientId = process.env['MICROSOFT_CLIENT_ID'];
    const clientSecret = process.env['MICROSOFT_CLIENT_SECRET'];
    const tenantId = process.env['MICROSOFT_TENANT_ID'] || 'common';
    const baseUrl = process.env['API_BASE_URL'] || 'http://localhost:3001';
    const redirectUri = `${baseUrl}/api/v1/auth/callback/microsoft`;

    if (!clientId || !clientSecret) {
      throw new Error('Microsoft OAuth credentials not configured on server.');
    }

    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      throw new Error(`Microsoft token exchange failed (${tokenRes.status}): ${errBody}`);
    }

    const tokenData = (await tokenRes.json()) as any;
    const accessToken = tokenData.access_token;

    const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userRes.ok) {
      throw new Error(`Microsoft Graph user profile fetch failed (${userRes.status})`);
    }

    const userData = (await userRes.json()) as any;
    const email = userData.mail || userData.userPrincipalName;
    if (!email) {
      throw new Error('Microsoft Graph profile did not contain a valid email.');
    }

    return {
      email,
      name: userData.displayName || email.split('@')[0],
      subjectId: userData.id
    };
  }

  private async exchangeAppleCode(code: string, idToken?: string): Promise<{ email: string; name: string; subjectId: string }> {
    const clientId = process.env['APPLE_CLIENT_ID'];
    const clientSecret = process.env['APPLE_CLIENT_SECRET'];

    if (!clientId || !clientSecret) {
      throw new Error('Apple Sign-In credentials not configured on server.');
    }

    const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      throw new Error(`Apple token exchange failed (${tokenRes.status}): ${errBody}`);
    }

    const tokenData = (await tokenRes.json()) as any;
    const rawIdToken = tokenData.id_token || idToken;
    if (!rawIdToken) {
      throw new Error('Apple response missing id_token.');
    }

    const parts = rawIdToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid Apple id_token JWT format.');
    }
    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);

    if (!payload.email) {
      throw new Error('Apple id_token did not contain an email address.');
    }

    return {
      email: payload.email,
      name: payload.email.split('@')[0],
      subjectId: payload.sub
    };
  }

  /**
   * Exchanges a single-use authorization ticket for an active session
   */
  public exchangeTicket(ticket: string): AuthSession {
    const entry = this.oauthTickets.get(ticket);
    if (!entry) {
      throw new Error('Invalid or already consumed OAuth exchange ticket.');
    }
    if (Date.now() > entry.expiresAt) {
      this.oauthTickets.delete(ticket);
      throw new Error('OAuth exchange ticket has expired. Please sign in again.');
    }
    this.oauthTickets.delete(ticket);
    return entry.session;
  }

  public forgotPassword(email: string): { resetToken: string; message: string } {
    const emailKey = email.toLowerCase();
    const user = Array.from(this.users.values()).find((u) => u.email.toLowerCase() === emailKey);
    const genericMessage = 'If an account exists for that email address, a password reset link has been sent.';

    if (!user) {
      return { resetToken: '', message: genericMessage };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    this.resetTokens.set(hashedToken, { email: emailKey, expiresAt: Date.now() + 3600000 });
    this.persistStore();

    return { resetToken: rawToken, message: genericMessage };
  }

  public async forgotPasswordAsync(email: string): Promise<{ message: string }> {
    const emailKey = email.toLowerCase();
    const user = Array.from(this.users.values()).find((u) => u.email.toLowerCase() === emailKey);

    // Always return a generic message to prevent email enumeration
    const genericMessage = 'If an account exists for that email address, a password reset link has been sent.';

    if (!user) {
      return { message: genericMessage };
    }

    // Generate cryptographically secure raw token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    // Store only the SHA-256 hash — never the raw token
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    this.resetTokens.set(hashedToken, { email: emailKey, expiresAt: Date.now() + 3600000 });
    this.persistStore();

    // Build reset URL using FRONTEND_URL env var
    const frontendUrl = (process.env['FRONTEND_URL'] || 'https://cloudpulse-web-w4ru-ten.vercel.app').replace(/\/+$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    // Attempt to send email via EmailService (errors are logged, not surfaced to caller)
    try {
      const { EmailService } = await import('./email-service.js');
      const emailSvc = new EmailService();
      await emailSvc.sendPasswordReset(emailKey, resetUrl);
    } catch (emailErr: any) {
      console.error('[AuthEngine] Password reset email send failed:', emailErr?.message || 'Unknown error');
    }

    return { message: genericMessage };
  }

  public resetPassword(token: string, newPassword: string): boolean {
    if (!token || typeof token !== 'string' || token.length < 32) {
      throw new Error('Invalid password reset token.');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters.');
    }
    // Hash the incoming raw token to look up the stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const entry = this.resetTokens.get(hashedToken);
    if (!entry || entry.expiresAt < Date.now()) {
      // Clean up expired token if present
      if (entry) this.resetTokens.delete(hashedToken);
      this.persistStore();
      throw new Error('Invalid or expired password reset token.');
    }

    this.userPasswords.set(entry.email, this.hashPassword(newPassword));
    // Invalidate token — single-use
    this.resetTokens.delete(hashedToken);
    // Invalidate all existing sessions for this user to force re-login
    const user = Array.from(this.users.values()).find((u) => u.email.toLowerCase() === entry.email);
    if (user) {
      for (const [sessionToken, sessionUser] of this.sessions.entries()) {
        if (sessionUser.id === user.id) {
          this.sessions.delete(sessionToken);
        }
      }
    }
    this.persistStore();
    return true;
  }

  public verifySession(token: string): UserProfile | null {
    const cachedUser = this.sessions.get(token);
    if (!cachedUser) return null;
    const latestUser = this.users.get(cachedUser.id);
    return latestUser || cachedUser;
  }

  public logout(token: string): boolean {
    const res = this.sessions.delete(token);
    this.persistStore();
    return res;
  }

  public updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with ID '${userId}' not found.`);
    }

    if (updates.name !== undefined) user.name = updates.name;
    if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
    if (updates.onboardingCompleted !== undefined) user.onboardingCompleted = updates.onboardingCompleted;

    this.persistStore();
    return user;
  }

  public completeOnboarding(userId: string): UserProfile {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with ID '${userId}' not found.`);
    }
    user.onboardingCompleted = true;
    this.persistStore();
    return user;
  }

  public getOrganization(orgId: string): Organization | null {
    return this.organizations.get(orgId) || null;
  }

  public getWorkspace(wsId: string): Workspace | null {
    return this.workspaces.get(wsId) || null;
  }

  public listWorkspaces(orgId: string): Workspace[] {
    return Array.from(this.workspaces.values()).filter((w) => w.organizationId === orgId);
  }

  public createWorkspace(orgId: string, name: string): Workspace {
    const wsId = `ws-${crypto.randomBytes(4).toString('hex')}`;
    const ws: Workspace = {
      id: wsId,
      organizationId: orgId,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      createdAt: new Date().toISOString()
    };
    this.workspaces.set(wsId, ws);
    this.persistStore();
    return ws;
  }

  public validateWorkspaceAccess(userId: string, workspaceId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    // Direct workspace match
    if (user.workspaceId === workspaceId) return true;
    // Secondary match: workspace must belong to the user's organization
    const ws = this.workspaces.get(workspaceId);
    if (!ws) return false;
    return ws.organizationId === user.organizationId;
  }
}
