import { Request, Response, NextFunction } from 'express';
import { RealCloudPulsePlatformEngine } from '../services/real-cloudpulse-platform-engine.js';
import { AuthenticatedRequest } from './auth.js';

export function createRateLimiter(tier: 'AUTH' | 'CLOUD_CONNECT' | 'SEARCH_GRAPH' | 'AI_ANALYST' | 'DEFAULT') {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const identifier = authReq.user?.id || req.ip || req.socket.remoteAddress || 'anonymous-client';
    const key = `${tier}:${identifier}`;

    const engine = RealCloudPulsePlatformEngine.getInstance();
    const result = engine.checkRateLimit(key, tier);

    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.resetSeconds.toString());

    if (!result.allowed) {
      const err = engine.createStandardError(
        'RATE_LIMITED',
        `Rate limit exceeded for tier '${tier}'. Try again in ${result.resetSeconds} seconds.`,
        { tier, limit: result.limit, resetSeconds: result.resetSeconds },
        req.headers['x-request-id'] as string,
        result.resetSeconds
      );
      res.setHeader('Retry-After', result.resetSeconds.toString());
      return res.status(429).json({
        ok: false,
        error: err,
        meta: { timestamp: err.timestamp, version: '0.0.2' }
      });
    }

    next();
  };
}

export const platformRateLimiter = createRateLimiter;
export default createRateLimiter;

