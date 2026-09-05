export const API_VERSION = 'v1' as const;

export const API_ROUTES = {
  health: '/health',
  overview: `/api/${API_VERSION}/overview`,
  services: `/api/${API_VERSION}/services`,
  metrics: `/api/${API_VERSION}/metrics`,
  logs: `/api/${API_VERSION}/logs`,
  traces: `/api/${API_VERSION}/traces`,
  alerts: `/api/${API_VERSION}/alerts`,
  incidents: `/api/${API_VERSION}/incidents`,
  slos: `/api/${API_VERSION}/slos`,
  infrastructure: `/api/${API_VERSION}/infrastructure`,
  systemStatus: `/api/${API_VERSION}/system-status`,
  simulation: `/api/${API_VERSION}/simulation`,
} as const;

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES];

export const REFRESH_INTERVALS = [
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: 'Off', value: 0 },
] as const;

export const TIME_RANGES = [
  { label: 'Last 15m', value: '15m' },
  { label: 'Last 1h', value: '1h' },
  { label: 'Last 6h', value: '6h' },
  { label: 'Last 24h', value: '24h' },
  { label: 'Last 7d', value: '7d' },
] as const;
