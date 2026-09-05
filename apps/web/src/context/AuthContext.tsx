import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi } from '../api/client.ts';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: string;
  role: string;
  status: string;
  organizationId: string;
  workspaceId: string;
  onboardingCompleted?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: string;
  createdAt: string;
  ownerId: string;
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface ConfiguredProviderDetail {
  enabled: boolean;
  name: string;
  configured: boolean;
  allowsRegistration?: boolean;
  authUrl?: string;
  reason?: string;
}

export interface ConfiguredProviders {
  emailPassword: { enabled: boolean; allowsRegistration: boolean };
  google: ConfiguredProviderDetail;
  microsoft: ConfiguredProviderDetail;
  apple: ConfiguredProviderDetail;
}

interface AuthContextType {
  user: UserProfile | null;
  organization: Organization | null;
  workspace: Workspace | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  configuredProviders: ConfiguredProviders | null;
  login: (credentials: { email: string; password?: string }) => Promise<any>;
  initiateOAuth: (provider: 'google' | 'microsoft' | 'apple', returnUrl?: string) => Promise<void>;
  completeOAuth: (ticket: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'microsoft' | 'apple', profile: { email: string; name: string }) => Promise<void>;
  register: (payload: { name: string; email: string; password?: string; provider?: string; role?: string }) => Promise<any>;
  completeOnboarding: () => Promise<void>;
  logout: () => Promise<void>;
  setWorkspace: (ws: Workspace) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('cloudpulse_token') : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [configuredProviders, setConfiguredProviders] = useState<ConfiguredProviders | null>(null);

  const fetchSession = async () => {
    const currentToken = localStorage.getItem('cloudpulse_token');
    if (!currentToken) {
      setUser(null);
      setOrganization(null);
      setWorkspaceState(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getCurrentUser();
      if (res?.user) {
        setUser(res.user);
        setOrganization(res.organization || null);
        setWorkspaceState(res.workspace || null);
        if (res.workspace?.id) {
          localStorage.setItem('cloudpulse_workspace_id', res.workspace.id);
        }
      } else {
        localStorage.removeItem('cloudpulse_token');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('cloudpulse_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Fetch honest configured identity providers
    authApi
      .getConfiguredProviders()
      .then((p) => setConfiguredProviders(p))
      .catch(() => {
        // Honest fallback: Only email/password enabled if provider check fails
        setConfiguredProviders({
          emailPassword: { enabled: true, allowsRegistration: true },
          google: { enabled: false, name: 'Google Workspace', configured: false, reason: 'Provider check failed' },
          microsoft: { enabled: false, name: 'Microsoft 365', configured: false, reason: 'Provider check failed' },
          apple: { enabled: false, name: 'Apple ID', configured: false, reason: 'Provider check failed' },
        });
      });

    // 2. Validate active session token
    fetchSession();
  }, []);

  const login = async (credentials: { email: string; password?: string }) => {
    const res = await authApi.login(credentials);
    if (res?.token) {
      localStorage.setItem('cloudpulse_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setOrganization(res.organization || null);
      setWorkspaceState(res.workspace || null);
      if (res.workspace?.id) {
        localStorage.setItem('cloudpulse_workspace_id', res.workspace.id);
      }
    }
    return res;
  };

  const initiateOAuth = async (provider: 'google' | 'microsoft' | 'apple', returnUrl?: string) => {
    const res = await authApi.getAuthorizationUrl(provider, returnUrl);
    if (res?.authorizationUrl) {
      // Real browser redirect to official provider authorization consent screen
      window.location.href = res.authorizationUrl;
    } else {
      const label = provider === 'google' ? 'Google Workspace' : provider === 'microsoft' ? 'Microsoft 365' : 'Apple ID';
      throw new Error(`${label} OAuth is not configured on this server.`);
    }
  };

  const completeOAuth = async (ticket: string) => {
    const res = await authApi.exchangeTicket(ticket);
    if (res?.token) {
      localStorage.setItem('cloudpulse_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setOrganization(res.organization || null);
      setWorkspaceState(res.workspace || null);
      if (res.workspace?.id) {
        localStorage.setItem('cloudpulse_workspace_id', res.workspace.id);
      }
    }
  };

  const loginWithOAuth = async (provider: 'google' | 'microsoft' | 'apple', profile: { email: string; name: string }) => {
    let res: any;
    if (provider === 'google') {
      res = await authApi.loginWithGoogle(profile);
    } else if (provider === 'microsoft') {
      res = await authApi.loginWithMicrosoft(profile);
    } else {
      res = await authApi.loginWithApple(profile);
    }

    if (res?.token) {
      localStorage.setItem('cloudpulse_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setOrganization(res.organization || null);
      setWorkspaceState(res.workspace || null);
      if (res.workspace?.id) {
        localStorage.setItem('cloudpulse_workspace_id', res.workspace.id);
      }
    }
  };

  const register = async (payload: { name: string; email: string; password?: string; provider?: string; role?: string }) => {
    const res = await authApi.register(payload);
    if (res?.token) {
      localStorage.setItem('cloudpulse_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setOrganization(res.organization || null);
      setWorkspaceState(res.workspace || null);
      if (res.workspace?.id) {
        localStorage.setItem('cloudpulse_workspace_id', res.workspace.id);
      }
    }
    return res;
  };

  const completeOnboarding = async () => {
    try {
      const res = await authApi.completeOnboarding();
      if (res?.user) {
        setUser(res.user);
      } else {
        setUser((prev) => (prev ? { ...prev, onboardingCompleted: true } : null));
      }
    } catch {
      setUser((prev) => (prev ? { ...prev, onboardingCompleted: true } : null));
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore in offline/network failure
    } finally {
      localStorage.removeItem('cloudpulse_token');
      localStorage.removeItem('cloudpulse_workspace_id');
      setToken(null);
      setUser(null);
      setOrganization(null);
      setWorkspaceState(null);
    }
  };

  const setWorkspace = (ws: Workspace) => {
    setWorkspaceState(ws);
    localStorage.setItem('cloudpulse_workspace_id', ws.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        workspace,
        token,
        isAuthenticated: !!user,
        isLoading,
        configuredProviders,
        login,
        initiateOAuth,
        completeOAuth,
        loginWithOAuth,
        register,
        completeOnboarding,
        logout,
        setWorkspace,
        refreshUser: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
