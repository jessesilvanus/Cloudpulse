import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { RealCloudPulsePlatformEngine } from '../services/real-cloudpulse-platform-engine.js';

export function tenantIsolationGuard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = req.user;
  const userTenantId = (user as any)?.tenantId || 'tenant-cloudpulse-main';
  const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
  const queryTenantId = req.query['tenantId'] as string | undefined;
  const requestedTenantId = headerTenantId || queryTenantId;

  const engine = RealCloudPulsePlatformEngine.getInstance();
  const validation = engine.validateTenantContext(requestedTenantId, userTenantId, req.path);

  if (!validation.valid) {
    const standardError = engine.createStandardError(
      'FORBIDDEN',
      validation.error || 'Access Denied: Cross-tenant access is restricted.',
      { requestedTenantId, userTenantId, path: req.path },
      req.headers['x-request-id'] as string
    );
    return res.status(403).json({
      ok: false,
      error: standardError,
      meta: { timestamp: standardError.timestamp, version: '0.0.2' }
    });
  }

  // Bind verified tenant context to request
  (req as any).tenantId = userTenantId;
  next();
}

export function requireTenantIsolation(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return res.status(401).json({
      ok: false,
      code: 'ERR_TENANT_CONTEXT_MISSING',
      message: 'Mandatory tenant header (x-tenant-id) is required for this route.'
    });
  }
  (req as any).tenantId = tenantId;
  next();
}

export function guardTenantResource(req: Request, resourceTenantId: string) {
  const callerTenantId = (req as any).tenantId || req.headers['x-tenant-id'];
  if (callerTenantId !== resourceTenantId) {
    const error: any = new Error(`Access Denied: Resource belongs to tenant '${resourceTenantId}' but caller is in '${callerTenantId}'`);
    error.statusCode = 403;
    error.code = 'ERR_UNAUTHORIZED_RESOURCE_ACCESS';
    throw error;
  }
}
