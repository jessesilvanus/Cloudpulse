# CLOUDPULSE Platform Production Hardening & Deployment Architecture

## 1. Executive Architecture Overview

CLOUDPULSE has been hardened into an enterprise-grade, resilient, observable, and multi-tenant cloud intelligence and operations platform. The system operates across hybrid and multi-cloud environments (AWS, Azure, GCP, Kubernetes) with zero-compromise truth-in-labeling, defense-in-depth tenant isolation, and self-observability.

```
                                 ┌─────────────────────────────────────────┐
                                 │       CloudPulse Web Frontend UI        │
                                 │     (React + TypeScript + Vite SPA)     │
                                 └────────────────────┬────────────────────┘
                                                      │ HTTPS / WSS
                                                      ▼
                                 ┌─────────────────────────────────────────┐
                                 │      CloudPulse API Gateway Server      │
                                 │   (Express + TypeScript Node.js v20)    │
                                 └────┬──────────────┬──────────────┬──────┘
                                      │              │              │
           ┌──────────────────────────┴──┐           │              └──┬───────────────────────────┐
           ▼                             ▼           │                 ▼                           ▼
┌──────────────────────┐  ┌───────────────────────┐  │   ┌───────────────────────────┐  ┌──────────────────────┐
│  Multi-Tier Probes   │  │ Tenant Isolation &    │  │   │  Rate Limiting & Circuit  │  │  Multi-Cloud Sync    │
│  /health/live        │  │ IDOR Prevention Guard │  │   │  Breakers (Token Bucket)  │  │  Workers & DLQ       │
│  /health/ready       │  │ (Mandatory Tenant Scp)│  │   │  Auth, Cloud, Search, AI  │  │  AWS, Azure, GCP, K8s│
│  /health/dependencies│  └───────────────────────┘  │   └───────────────────────────┘  └──────────────────────┘
└──────────────────────┘                             ▼
                                   ┌───────────────────────────────────┐
                                   │ RealCloudPulsePlatformEngine      │
                                   │  - Internal Self-Observability    │
                                   │  - Internal SLOs & Error Budgets  │
                                   │  - Hosting Unit Economics ($ MTD) │
                                   │  - Secret Sanitization Engine     │
                                   │  - Graceful Shutdown Coordinator  │
                                   └─────────────────┬─────────────────┘
                                                     │
               ┌───────────────────────┬─────────────┴─────────┬───────────────────────┐
               ▼                       ▼                       ▼                       ▼
      ┌─────────────────┐    ┌──────────────────┐    ┌───────────────────┐    ┌─────────────────┐
      │ Aurora Postgres │    │  In-Memory TSDBs │    │ OTLP Telemetry Rx │    │ Cloud Providers │
      │ Connection Pool │    │ Prometheus/Loki/ │    │ (gRPC/HTTP 4318)  │    │ AWS, Azure, GCP,│
      │ 4/30 active     │    │ Tempo Ring Buffer│    │ Ring Buffer Ingest│    │ Kubernetes EKS  │
      └─────────────────┘    └──────────────────┘    └───────────────────┘    └─────────────────┘
```

---

## 2. Multi-Tier Health Probing Architecture

CLOUDPULSE provides three distinct probing endpoints to decouple process liveness from external cloud-provider availability:

### 2.1 Liveness Probe (`/health/live`)
- **HTTP Endpoint**: `GET /health/live`
- **Purpose**: Kubernetes kubelet container liveness check.
- **Criteria**: Validates that the Node.js event loop is responsive, the HTTP server is accepting connections, and core process memory is within boundaries.
- **Response**: `{ status: "ok", uptimeSeconds: 237, timestamp: "2026-09-05T02:50:28.000Z" }`
- **Isolation Guarantee**: NEVER fails due to external cloud adapter connectivity issues.

### 2.2 Readiness Probe (`/health/ready`)
- **HTTP Endpoint**: `GET /health/ready`
- **Purpose**: Kubernetes Service endpoint routing check.
- **Criteria**: Validates that internal subsystems (DB connection pool, in-memory TSDB ring buffers, telemetry collector port 4318) are initialized and ready to serve live traffic.
- **Response**: `{ status: "ready", initialized: true, uptimeSeconds: 237, timestamp: "..." }`

### 2.3 Deep Dependency Probe (`/health/dependencies`)
- **HTTP Endpoint**: `GET /health/dependencies`
- **Purpose**: Comprehensive status inspection of backing dependencies, storage engines, and connected cloud adapters.
- **Dependencies Audited**:
  - `database`: Aurora PostgreSQL connection pool (`latencyMs`, `connectionPoolActive`, `connectionPoolMax`).
  - `telemetryEngine`: OpenTelemetry receiver (`otlpReceiverPort: 4318`, `ingestionRatePerSec`, `bufferUtilizationPercent`).
  - `inMemoryTsdb`: TSDB buffer (`metricsCount`, `logsCount`, `tracesCount`, `memoryUsageMb`).
  - `cloudAdapters`: Multi-cloud adapter statuses for AWS, Azure, GCP, and Kubernetes.

---

## 3. Defense-in-Depth & Tenant Isolation

1. **Mandatory Header Validation**: The `tenantIsolationGuard` and `requireTenantIsolation` middlewares inspect `x-tenant-id` on incoming requests.
2. **IDOR Defense**: `guardTenantResource(req, targetTenantId)` blocks cross-tenant query attempts and logs operational security events.
3. **Structured RFC Error Responses**: All authorization rejections return standardized `FORBIDDEN` platform errors without disclosing internal resource schemas or data structures.

---

## 4. Differentiated Rate Limiting & Circuit Breakers

### Rate Limiting Policies (Token Bucket Algorithm)
- **AUTH Tier**: 10 requests / minute (Password reset, login, token refresh)
- **CLOUD_CONNECT Tier**: 20 requests / minute (Cloud account linking and IAM role validation)
- **SEARCH_GRAPH Tier**: 60 requests / minute (Knowledge graph traversals and asset search)
- **AI_ANALYST Tier**: 15 requests / minute (Natural language copilot and grounding queries)
- **DEFAULT Tier**: 120 requests / minute (General operational telemetry and dashboard polling)

### Standard RFC Rate Limit Headers
Every response includes:
- `X-RateLimit-Limit`: Maximum tokens permitted per window.
- `X-RateLimit-Remaining`: Tokens available in the current window.
- `X-RateLimit-Reset`: Seconds until token refill.
- `Retry-After`: Provided on HTTP 429 Too Many Requests.

### Cloud SDK Circuit Breakers
- **Target APIs**: AWS CloudWatch/SecurityHub, Azure Resource Graph/Monitor, GCP Cloud Operations/SCC, Kubernetes API Server.
- **States**: `CLOSED` (Normal operation), `OPEN` (Tripped after 5 consecutive failures), `HALF_OPEN` (30s trial window).
- **Protection**: Prevents thread exhaustion and cascading failures during upstream cloud provider degradation.

---

## 5. Multi-Cloud Sync Workers & Dead Letter Queue (DLQ)

- **Worker Pool**: 4 dedicated background sync workers (AWS, Azure, GCP, Kubernetes) executing on defined intervals.
- **Checkpointing**: Every sync execution records an immutable checkpoint ID (e.g. `aws-chk-884912`, `az-chk-301984`) to support incremental synchronization.
- **DLQ Management**: Failed tasks exceeding 3 retries are placed in the Dead Letter Queue. Operators can inspect and trigger governed manual retries via `POST /api/v1/platform/workers/dlq/:id/retry`.

---

## 6. Deployment Topologies

### 6.1 Production Kubernetes Deployment
- Deployment manifests located at `deploy/kubernetes/api/deployment.yaml`.
- Configured with `HorizontalPodAutoscaler` (2-8 replicas), `PodDisruptionBudget` (`minAvailable: 1`), and `securityContext` (`runAsNonRoot: true`, `readOnlyRootFilesystem: false`, `drop: [ALL]`).

### 6.2 Production Docker Compose Stack
- Defined at `infra/docker-compose.prod.yml`.
- Includes web frontend, API gateway, microservices (Order, Payment), OTel Collector, Prometheus TSDB, Loki log store, and Tempo distributed tracing engine.
