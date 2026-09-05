import { getOpenTelemetry } from './tracer.js';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  service: string;
  environment: string;
  message: string;
  traceId?: string;
  spanId?: string;
  attributes?: Record<string, any>;
}

class StructuredLogger {
  private endpoint: string;

  constructor(endpoint = 'http://localhost:4318') {
    this.endpoint = endpoint;
  }

  private emit(level: LogLevel, message: string, attributes?: Record<string, any>): void {
    const sdk = getOpenTelemetry();
    const activeCtx = sdk.getActiveContext();

    const logEntry: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      service: sdk.getServiceName(),
      environment: process.env.NODE_ENV || 'development',
      message,
      traceId: activeCtx?.traceId,
      spanId: activeCtx?.spanId,
      attributes: attributes || {},
    };

    // Print to stdout in JSON format
    const output = JSON.stringify(logEntry);
    if (level === 'ERROR') {
      console.error(output);
    } else if (level === 'WARN') {
      console.warn(output);
    } else {
      console.log(output);
    }

    // Push asynchronously to Loki / Telemetry Engine
    fetch(`${this.endpoint}/api/telemetry/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: [logEntry] }),
    }).catch(() => {
      // Ignore background push errors during local dev
    });
  }

  public info(message: string, attributes?: Record<string, any>): void {
    this.emit('INFO', message, attributes);
  }

  public warn(message: string, attributes?: Record<string, any>): void {
    this.emit('WARN', message, attributes);
  }

  public error(message: string, attributes?: Record<string, any>): void {
    this.emit('ERROR', message, attributes);
  }

  public debug(message: string, attributes?: Record<string, any>): void {
    this.emit('DEBUG', message, attributes);
  }
}

export const logger = new StructuredLogger(process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318');
