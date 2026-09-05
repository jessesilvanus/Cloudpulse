import { AsyncLocalStorage } from 'node:async_hooks';
import crypto from 'node:crypto';

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceFlags?: number;
}

export interface SpanData {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  serviceName: string;
  kind: 'SERVER' | 'CLIENT' | 'INTERNAL';
  startTimeUnixNano: number;
  endTimeUnixNano?: number;
  statusCode: 'OK' | 'ERROR';
  statusMessage?: string;
  attributes: Record<string, string | number | boolean>;
}

// Global async context for active trace context across async boundaries
const asyncLocalStorage = new AsyncLocalStorage<SpanContext>();

export class OpenTelemetrySDK {
  private serviceName: string;
  private otelCollectorEndpoint: string;
  private spanQueue: SpanData[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(serviceName: string, endpoint = 'http://localhost:4318') {
    this.serviceName = serviceName;
    this.otelCollectorEndpoint = endpoint;

    // Start background flush loop every 500ms
    this.flushTimer = setInterval(() => this.flush(), 500);
    if (this.flushTimer.unref) this.flushTimer.unref();
  }

  public getServiceName(): string {
    return this.serviceName;
  }

  public generateTraceId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  public generateSpanId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  public parseTraceparent(header?: string): SpanContext | null {
    if (!header) return null;
    // Format: 00-{traceId}-{spanId}-{flags}
    const parts = header.trim().split('-');
    if (parts.length >= 4 && parts[1].length === 32 && parts[2].length === 16) {
      return {
        traceId: parts[1],
        spanId: this.generateSpanId(),
        parentSpanId: parts[2],
        traceFlags: parseInt(parts[3], 16) || 1,
      };
    }
    return null;
  }

  public formatTraceparent(ctx: SpanContext): string {
    return `00-${ctx.traceId}-${ctx.spanId}-01`;
  }

  public runWithContext<T>(ctx: SpanContext, fn: () => T): T {
    return asyncLocalStorage.run(ctx, fn);
  }

  public getActiveContext(): SpanContext | undefined {
    return asyncLocalStorage.getStore();
  }

  public startSpan(
    name: string,
    kind: 'SERVER' | 'CLIENT' | 'INTERNAL',
    parentCtx?: SpanContext,
    initialAttributes: Record<string, string | number | boolean> = {}
  ): {
    span: SpanData;
    end: (status?: 'OK' | 'ERROR', message?: string) => void;
    setAttribute: (key: string, value: string | number | boolean) => void;
  } {
    const activeCtx = parentCtx || this.getActiveContext();
    const traceId = activeCtx?.traceId || this.generateTraceId();
    const spanId = activeCtx?.spanId || this.generateSpanId();
    const parentSpanId = activeCtx?.parentSpanId;

    const span: SpanData = {
      traceId,
      spanId,
      parentSpanId,
      name,
      serviceName: this.serviceName,
      kind,
      startTimeUnixNano: Date.now() * 1_000_000,
      statusCode: 'OK',
      attributes: {
        'service.name': this.serviceName,
        'telemetry.sdk.name': 'cloudpulse-otel-sdk',
        'telemetry.sdk.language': 'nodejs',
        ...initialAttributes,
      },
    };

    return {
      span,
      setAttribute: (key: string, value: string | number | boolean) => {
        span.attributes[key] = value;
      },
      end: (status = 'OK', message?: string) => {
        span.endTimeUnixNano = Date.now() * 1_000_000;
        span.statusCode = status;
        if (message) span.statusMessage = message;
        this.spanQueue.push(span);
      },
    };
  }

  public async flush(): Promise<void> {
    if (this.spanQueue.length === 0) return;
    const batch = [...this.spanQueue];
    this.spanQueue = [];

    try {
      // Ingest into OpenTelemetry Collector / Telemetry Engine
      await fetch(`${this.otelCollectorEndpoint}/api/telemetry/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spans: batch }),
      });
    } catch {
      // Ignore network errors in local dev if receiver is momentarily restarting
    }
  }
}

let activeSDK: OpenTelemetrySDK | null = null;

export function initOpenTelemetry(serviceName: string, endpoint?: string): OpenTelemetrySDK {
  activeSDK = new OpenTelemetrySDK(serviceName, endpoint || process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318');
  return activeSDK;
}

export function getOpenTelemetry(): OpenTelemetrySDK {
  if (!activeSDK) {
    activeSDK = new OpenTelemetrySDK('unknown-service');
  }
  return activeSDK;
}
