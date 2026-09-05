/**
 * Typed configuration loaded from environment variables.
 * All env access is centralized here — no scattered `process.env` reads.
 */

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  corsOrigin: string;
  apiVersion: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function parsePort(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid PORT value: ${raw}`);
  }
  return parsed;
}

function parseNodeEnv(raw: string | undefined): AppConfig['nodeEnv'] {
  if (raw === 'production' || raw === 'test') return raw;
  return 'development';
}

export function loadConfig(): AppConfig {
  return {
    port: parsePort(process.env['PORT'], 3001),
    nodeEnv: parseNodeEnv(process.env['NODE_ENV']),
    corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
    apiVersion: process.env['API_VERSION'] ?? 'v1',
  };
}
