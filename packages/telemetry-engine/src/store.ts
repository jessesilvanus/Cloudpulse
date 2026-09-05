import type {
  Span,
  Trace,
  LogEntry,
  MetricDatapoint,
  SpanEvent,
} from '@cloudpulse/shared';

export interface RawSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  serviceName: string;
  kind: 'SERVER' | 'CLIENT' | 'INTERNAL' | 'PRODUCER' | 'CONSUMER';
  startTimeUnixNano: number;
  endTimeUnixNano: number;
  statusCode: 'UNSET' | 'OK' | 'ERROR';
  statusMessage?: string;
  attributes: Record<string, string | number | boolean>;
  events?: { name: string; timeUnixNano: number; attributes?: Record<string, any> }[];
}

export interface MetricSample {
  metricName: string;
  timestamp: number; // ms
  value: number;
  labels: Record<string, string>;
}

export class TelemetryStore {
  private spansByTraceId = new Map<string, RawSpan[]>();
  private traceMetadata = new Map<string, { rootService: string; operation: string; durationMs: number; statusCode: 'OK' | 'ERROR'; startTime: string }>();
  private logs: LogEntry[] = [];
  private metrics: MetricSample[] = [];

  // ── TRACE INGESTION & QUERY ───────────────────────────────────────────────

  public ingestSpan(span: RawSpan): void {
    if (!this.spansByTraceId.has(span.traceId)) {
      this.spansByTraceId.set(span.traceId, []);
    }
    const traceSpans = this.spansByTraceId.get(span.traceId)!;
    traceSpans.push(span);

    // Update trace index metadata
    const rootSpan = traceSpans.find((s) => !s.parentSpanId) || traceSpans[0];
    const minStart = Math.min(...traceSpans.map((s) => s.startTimeUnixNano));
    const maxEnd = Math.max(...traceSpans.map((s) => s.endTimeUnixNano));
    const durationMs = Math.max(1, Math.round((maxEnd - minStart) / 1_000_000));
    const hasError = traceSpans.some((s) => s.statusCode === 'ERROR');

    this.traceMetadata.set(span.traceId, {
      rootService: rootSpan.serviceName,
      operation: rootSpan.name,
      durationMs,
      statusCode: hasError ? 'ERROR' : 'OK',
      startTime: new Date(Math.round(minStart / 1_000_000)).toISOString(),
    });
  }

  public getTrace(traceId: string): Trace | null {
    const rawSpans = this.spansByTraceId.get(traceId);
    if (!rawSpans || rawSpans.length === 0) return null;

    const minStart = Math.min(...rawSpans.map((s) => s.startTimeUnixNano));
    const maxEnd = Math.max(...rawSpans.map((s) => s.endTimeUnixNano));
    const totalDurationMs = Math.max(1, Math.round((maxEnd - minStart) / 1_000_000));

    // Convert raw spans into nested Span domain models
    const spanMap = new Map<string, Span>();
    const rootSpans: Span[] = [];
    const servicesInvolved = new Set<string>();

    for (const raw of rawSpans) {
      servicesInvolved.add(raw.serviceName);
      const startOffsetMs = Math.max(0, Math.round((raw.startTimeUnixNano - minStart) / 1_000_000));
      const durationMs = Math.max(1, Math.round((raw.endTimeUnixNano - raw.startTimeUnixNano) / 1_000_000));

      const events: SpanEvent[] | undefined = raw.events?.map((e) => ({
        name: e.name,
        timestamp: new Date(Math.round(e.timeUnixNano / 1_000_000)).toISOString(),
        attributes: e.attributes,
      }));

      const span: Span = {
        id: raw.spanId,
        traceId: raw.traceId,
        parentId: raw.parentSpanId || null,
        name: raw.name,
        serviceName: raw.serviceName,
        kind: raw.kind,
        startTime: new Date(Math.round(raw.startTimeUnixNano / 1_000_000)).toISOString(),
        startOffsetMs,
        durationMs,
        statusCode: raw.statusCode,
        statusMessage: raw.statusMessage,
        attributes: raw.attributes,
        events,
        children: [],
      };
      spanMap.set(span.id, span);
    }

    // Build hierarchy tree
    for (const span of spanMap.values()) {
      if (span.parentId && spanMap.has(span.parentId)) {
        const parent = spanMap.get(span.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(span);
      } else {
        rootSpans.push(span);
      }
    }

    // Calculate maximum depth
    const calcDepth = (spans: Span[]): number => {
      if (spans.length === 0) return 0;
      return 1 + Math.max(...spans.map((s) => calcDepth(s.children || [])), 0);
    };

    const rootSpan = rootSpans[0] || rawSpans[0];
    const hasError = rawSpans.some((s) => s.statusCode === 'ERROR');

    return {
      id: traceId,
      rootService: rootSpan.serviceName,
      operation: rootSpan.name,
      durationMs: totalDurationMs,
      statusCode: hasError ? 'ERROR' : 'OK',
      spanCount: rawSpans.length,
      depth: calcDepth(rootSpans),
      servicesInvolved: Array.from(servicesInvolved),
      startTime: new Date(Math.round(minStart / 1_000_000)).toISOString(),
      spans: rootSpans,
    };
  }

  public listTraces(filter?: {
    service?: string | undefined;
    status?: string | undefined;
    limit?: number | undefined;
  }): Trace[] {
    const list: Trace[] = [];
    const limit = filter?.limit || 50;

    for (const [traceId, meta] of Array.from(this.traceMetadata.entries()).reverse()) {
      if (filter?.service && filter.service !== 'all' && meta.rootService !== filter.service) {
        continue;
      }
      if (filter?.status && filter.status !== 'all' && meta.statusCode !== filter.status) {
        continue;
      }
      const fullTrace = this.getTrace(traceId);
      if (fullTrace) {
        list.push(fullTrace);
        if (list.length >= limit) break;
      }
    }
    return list;
  }

  // ── LOG INGESTION & QUERY ─────────────────────────────────────────────────

  public ingestLog(log: LogEntry): void {
    this.logs.unshift(log);
    if (this.logs.length > 5000) {
      this.logs.pop();
    }
  }

  public queryLogs(filter?: {
    service?: string | undefined;
    level?: string | undefined;
    traceId?: string | undefined;
    q?: string | undefined;
    limit?: number | undefined;
  }): LogEntry[] {
    let result = this.logs;

    if (filter?.service && filter.service !== 'all') {
      result = result.filter((l) => l.service === filter.service);
    }
    if (filter?.level && filter.level !== 'all') {
      result = result.filter((l) => l.level === filter.level);
    }
    if (filter?.traceId) {
      result = result.filter((l) => l.traceId === filter.traceId);
    }
    if (filter?.q) {
      const qLower = filter.q.toLowerCase();
      result = result.filter(
        (l) =>
          l.message.toLowerCase().includes(qLower) ||
          l.service.toLowerCase().includes(qLower) ||
          (l.traceId && l.traceId.toLowerCase().includes(qLower))
      );
    }

    return result.slice(0, filter?.limit || 100);
  }

  // ── METRICS INGESTION & QUERY ─────────────────────────────────────────────

  public ingestMetricSample(sample: MetricSample): void {
    this.metrics.push(sample);
    if (this.metrics.length > 20000) {
      this.metrics.shift();
    }
  }

  public queryMetricRange(
    metricName: string,
    startMs: number,
    endMs: number,
    stepMs = 15000,
    filterLabels?: Record<string, string>
  ): MetricDatapoint[] {
    const relevant = this.metrics.filter((m) => {
      if (m.metricName !== metricName) return false;
      if (m.timestamp < startMs || m.timestamp > endMs) return false;
      if (filterLabels) {
        for (const [k, v] of Object.entries(filterLabels)) {
          if (v && v !== 'all' && m.labels[k] !== v) return false;
        }
      }
      return true;
    });

    if (relevant.length === 0) {
      return [];
    }

    // Bucket into step intervals
    const buckets = new Map<number, number[]>();
    for (const sample of relevant) {
      const bucketKey = Math.floor(sample.timestamp / stepMs) * stepMs;
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey)!.push(sample.value);
    }

    const datapoints: MetricDatapoint[] = [];
    const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a - b);

    for (const key of sortedKeys) {
      const vals = buckets.get(key)!;
      const avg = vals.reduce((sum, v) => sum + v, 0) / vals.length;
      datapoints.push({
        timestamp: new Date(key).toISOString(),
        value: Math.round(avg * 100) / 100,
      });
    }

    return datapoints;
  }

  public getStats(): { traceCount: number; spanCount: number; logCount: number; metricSampleCount: number } {
    let spanCount = 0;
    for (const spans of this.spansByTraceId.values()) {
      spanCount += spans.length;
    }
    return {
      traceCount: this.spansByTraceId.size,
      spanCount,
      logCount: this.logs.length,
      metricSampleCount: this.metrics.length,
    };
  }
}

export const telemetryStore = new TelemetryStore();
