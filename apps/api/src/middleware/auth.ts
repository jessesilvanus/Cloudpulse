import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '@cloudpulse/shared';
import { SecurityEngine } from '../services/security-engine.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  operator: 2,
  admin: 3
};

const DEFAULT_USERS: Record<string, User> = {
  'viewer-token': {
    id: 'usr-viewer-01',
    email: 'viewer@cloudpulse.internal',
    name: 'Observability Viewer',
    role: 'viewer',
    createdAt: '2026-01-01T00:00:00Z'
  },
  'operator-token': {
    id: 'usr-operator-01',
    email: 'operator@cloudpulse.internal',
    name: 'SRE On-Call Operator',
    role: 'operator',
    createdAt: '2026-01-01T00:00:00Z'
  },
  'admin-token': {
    id: 'usr-admin-01',
    email: 'admin@cloudpulse.internal',
    name: 'Platform Security Admin',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00Z'
  }
};

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const securityEngine = SecurityEngine.getInstance();

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const user = DEFAULT_USERS[token];

    if (user) {
      req.user = user;
      securityEngine.logSecurityEvent({
        eventType: 'AUTH_SUCCESS',
        actor: user.email,
        role: user.role,
        resource: req.path,
        action: req.method,
        status: 'allow',
        ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
        details: `Authenticated as ${user.role} (${user.name})`
      });
      return next();
    } else {
      securityEngine.logSecurityEvent({
        eventType: 'AUTH_FAILURE',
        actor: 'unknown',
        role: 'viewer',
        resource: req.path,
        action: req.method,
        status: 'deny',
        ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
        details: `Invalid bearer token provided: ${token.substring(0, 4)}***`
      });
    }
  }

  // Fallback to anonymous viewer for read-only convenience
  req.user = {
    id: 'usr-anonymous',
    email: 'anonymous@cloudpulse.internal',
    name: 'Anonymous Viewer',
    role: 'viewer',
    createdAt: '2026-01-01T00:00:00Z'
  };
  next();
}

export function requireRole(minimumRole: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    const userLevel = user ? ROLE_HIERARCHY[user.role] : 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole];
    const securityEngine = SecurityEngine.getInstance();

    if (userLevel < requiredLevel) {
      securityEngine.logSecurityEvent({
        eventType: 'PERMISSION_DENIED',
        actor: user?.email || 'anonymous',
        role: user?.role || 'viewer',
        resource: req.path,
        action: req.method,
        status: 'deny',
        ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
        details: `Access denied: Action requires role '${minimumRole}', current role is '${user?.role || 'none'}'`
      });


      return res.status(403).json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: This operation requires role '${minimumRole}' or higher. Current role: '${user?.role || 'viewer'}'.`
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      });
    }

    next();
  };
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
  );
  next();
}
