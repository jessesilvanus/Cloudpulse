import { useState, useEffect, useCallback, useRef } from 'react';
import {
  api,
  type ServiceFilterParams,
  type MetricFilterParams,
  type LogFilterParams,
  type TraceFilterParams,
  type AlertFilterParams,
  type IncidentFilterParams,
  type SloFilterParams,
  type InfraFilterParams,
} from './client.ts';
import type {
  OverviewData,
  Service,
  MetricSummary,
  LogEntry,
  Trace,
  Alert,
  Incident,
  SloDefinition,
  InfrastructureResource,
  SystemComponentStatus,
  FaultInjectionConfig,
} from '@cloudpulse/shared';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = [],
  pollIntervalMs = 0
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const result = await queryFn();
      if (isMounted.current) {
        setData(result);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Unknown API error');
      }
    } finally {
      if (isMounted.current && !isBackground) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute(false);

    if (pollIntervalMs > 0) {
      const timer = setInterval(() => {
        execute(true);
      }, pollIntervalMs);
      return () => clearInterval(timer);
    }
  }, [execute, pollIntervalMs]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: () => execute(false),
  };
}

// ── Specialized Domain Hooks ──────────────────────────────────────────────────

export function useOverview(pollInterval = 10000) {
  return useApiQuery<OverviewData>(() => api.getOverview(), [], pollInterval);
}

export function useServices(params?: ServiceFilterParams, pollInterval = 15000) {
  return useApiQuery<Service[]>(
    () => api.getServices(params),
    [params?.environment, params?.status, params?.team],
    pollInterval
  );
}

export function useServiceDetail(id: string) {
  return useApiQuery<Service>(() => api.getServiceById(id), [id]);
}

export function useMetrics(params?: MetricFilterParams, pollInterval = 10000) {
  return useApiQuery<MetricSummary[]>(
    () => api.getMetrics(params),
    [params?.metric, params?.service],
    pollInterval
  );
}

export function useLogs(params?: LogFilterParams, pollInterval = 5000) {
  return useApiQuery<LogEntry[]>(
    () => api.getLogs(params),
    [params?.service, params?.level, params?.traceId, params?.q],
    pollInterval
  );
}

export function useTraces(params?: TraceFilterParams, pollInterval = 10000) {
  return useApiQuery<Trace[]>(
    () => api.getTraces(params),
    [params?.service, params?.status, params?.minDuration],
    pollInterval
  );
}

export function useTraceDetail(id: string) {
  return useApiQuery<Trace>(() => api.getTraceById(id), [id]);
}

export function useAlerts(params?: AlertFilterParams, pollInterval = 10000) {
  return useApiQuery<Alert[]>(
    () => api.getAlerts(params),
    [params?.severity, params?.state, params?.service],
    pollInterval
  );
}

export function useIncidents(params?: IncidentFilterParams, pollInterval = 10000) {
  return useApiQuery<Incident[]>(
    () => api.getIncidents(params),
    [params?.severity, params?.state, params?.service],
    pollInterval
  );
}

export function useIncidentDetail(id: string) {
  return useApiQuery<Incident>(() => api.getIncidentById(id), [id]);
}

export function useSlos(params?: SloFilterParams, pollInterval = 15000) {
  return useApiQuery<SloDefinition[]>(
    () => api.getSlos(params),
    [params?.status, params?.service],
    pollInterval
  );
}

export function useInfrastructure(params?: InfraFilterParams) {
  return useApiQuery<InfrastructureResource[]>(
    () => api.getInfrastructure(params),
    [params?.type, params?.category],
    20000
  );
}

export function useSystemStatus() {
  return useApiQuery<SystemComponentStatus[]>(() => api.getSystemStatus(), [], 15000);
}

export function useSimulation() {
  return useApiQuery<FaultInjectionConfig>(() => api.getSimulation(), [], 10000);
}
