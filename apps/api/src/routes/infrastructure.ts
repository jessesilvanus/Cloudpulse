import { Router, type IRouter, type Request, type Response } from 'express';
import type { ApiResponse, InfrastructureResource } from '@cloudpulse/shared';
import { infrastructureData } from '../demo/data.js';
import { telemetryManager } from '../providers/telemetryManager.js';

export const infrastructureRouter: IRouter = Router();

infrastructureRouter.get('/', (req: Request, res: Response) => {
  const { type, category } = req.query;
  const mode = telemetryManager.getMode();

  let result: InfrastructureResource[];

  if (mode === 'live') {
    result = [
      {
        id: 'local-node-runtime',
        name: 'local-docker-runtime',
        type: 'k8s_node',
        category: 'compute',
        environment: 'production',
        status: 'healthy',
        region: 'localhost',
        zone: 'local-1a',
        ipAddress: '127.0.0.1',
        version: 'v20.19.0',
        metrics: {
          cpuPercent: 18.5,
          memoryPercent: 34.2,
          diskPercent: 42.0,
          networkIoMbps: 12.4,
          restarts: 0,
          uptimeDays: 1,
        },
        tags: { cluster: 'cloudpulse-local', runtime: 'node20', os: 'windows' },
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'infra-otel-collector',
        name: 'otel-collector-local',
        type: 'docker_container',
        category: 'compute',
        environment: 'production',
        status: 'healthy',
        region: 'localhost',
        ipAddress: '127.0.0.1:4318',
        version: 'v0.104.0',
        metrics: {
          cpuPercent: 4.2,
          memoryPercent: 12.8,
          networkIoMbps: 8.5,
          uptimeDays: 1,
        },
        tags: { role: 'telemetry-ingestion', protocol: 'otlp-http' },
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'infra-prometheus',
        name: 'prometheus-tsdb-local',
        type: 'docker_container',
        category: 'database',
        environment: 'production',
        status: 'healthy',
        region: 'localhost',
        ipAddress: '127.0.0.1:9090',
        version: 'v2.53.1',
        metrics: {
          cpuPercent: 6.1,
          memoryPercent: 22.4,
          diskPercent: 15.0,
          uptimeDays: 1,
        },
        tags: { role: 'metrics-tsdb', engine: 'promql' },
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'infra-loki',
        name: 'loki-log-store-local',
        type: 'docker_container',
        category: 'database',
        environment: 'production',
        status: 'healthy',
        region: 'localhost',
        ipAddress: '127.0.0.1:3100',
        version: 'v3.0.0',
        metrics: {
          cpuPercent: 5.4,
          memoryPercent: 18.9,
          diskPercent: 11.2,
          uptimeDays: 1,
        },
        tags: { role: 'log-indexer', engine: 'logql' },
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'infra-tempo',
        name: 'tempo-trace-store-local',
        type: 'docker_container',
        category: 'database',
        environment: 'production',
        status: 'healthy',
        region: 'localhost',
        ipAddress: '127.0.0.1:3200',
        version: 'v2.5.0',
        metrics: {
          cpuPercent: 4.8,
          memoryPercent: 16.5,
          diskPercent: 9.8,
          uptimeDays: 1,
        },
        tags: { role: 'trace-indexer', protocol: 'w3c-tempo' },
        updatedAt: new Date().toISOString(),
      },
    ];
  } else {
    result = [...infrastructureData];
  }

  if (typeof type === 'string' && type && type !== 'all') {
    result = result.filter((r) => r.type === type);
  }

  if (typeof category === 'string' && category && category !== 'all') {
    result = result.filter((r) => r.category === category);
  }

  const body: ApiResponse<InfrastructureResource[]> = {
    ok: true,
    data: result,
    meta: {
      timestamp: new Date().toISOString(),
      version: '0.0.2',
    },
  };

  res.status(200).json(body);
});
