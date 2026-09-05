import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger.js';
import { RealCloudPulsePlatformEngine } from '../services/real-cloudpulse-platform-engine.js';
import { PlatformErrorCode } from '@cloudpulse/shared';

export function standardizedErrorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const engine = RealCloudPulsePlatformEngine.getInstance();
  const rawMessage = err?.message || 'An unexpected internal server error occurred.';
  const sanitizedMessage = engine.sanitizeSecrets(rawMessage);

  const statusCode = err?.status || err?.statusCode || 500;
  let errorCode: PlatformErrorCode = 'INTERNAL_ERROR';

  if (statusCode === 400) errorCode = 'VALIDATION_FAILED';
  else if (statusCode === 401) errorCode = 'AUTHENTICATION_REQUIRED';
  else if (statusCode === 403) errorCode = 'FORBIDDEN';
  else if (statusCode === 404) errorCode = 'NOT_FOUND';
  else if (statusCode === 409) errorCode = 'CONFLICT';
  else if (statusCode === 429) errorCode = 'RATE_LIMITED';
  else if (statusCode === 503) errorCode = 'PROVIDER_UNAVAILABLE';

  const isProd = process.env['NODE_ENV'] === 'production';
  const publicMessage = isProd && statusCode >= 500
    ? 'An internal error occurred. Operational telemetry has been dispatched.'
    : sanitizedMessage;

  const standardError = engine.createStandardError(
    errorCode,
    publicMessage,
    isProd ? undefined : { originalError: sanitizedMessage },
    req.headers['x-request-id'] as string
  );

  logger.error('HTTP Request Error Handled', {
    code: errorCode,
    statusCode,
    path: req.path,
    method: req.method,
    message: sanitizedMessage
  });

  res.status(statusCode).json({
    ok: false,
    error: standardError,
    meta: {
      timestamp: standardError.timestamp,
      version: '0.0.2'
    }
  });
}
