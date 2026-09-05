/**
 * Structured logger utility.
 * Outputs JSON in production, human-readable in development.
 * Replace with Pino or Winston in a later phase when structured log shipping is needed.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function formatEntry(entry: LogEntry): string {
  const isDev = process.env['NODE_ENV'] !== 'production';
  if (isDev) {
    const { level, message, timestamp, ...rest } = entry;
    const prefix = `[${timestamp}] ${level.toUpperCase().padEnd(5)} ${message}`;
    const extras = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
    return prefix + extras;
  }
  return JSON.stringify(entry);
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };
  const formatted = formatEntry(entry);
  if (level === 'error' || level === 'warn') {
    process.stderr.write(formatted + '\n');
  } else {
    process.stdout.write(formatted + '\n');
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
};
