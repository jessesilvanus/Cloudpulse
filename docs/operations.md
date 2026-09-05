# CLOUDPULSE Production Operations & SRE Runbook

**Version:** 1.0.0 (Production Release)  
**Audience:** Site Reliability Engineers (SRE), Platform Engineers, Cloud Administrators  
**Internal Platform SLO:** 99.95% Availability | p95 Latency < 120ms | p99 Latency < 350ms

---

## 1. Deployment & Infrastructure Architecture

CLOUDPULSE runs as a containerized micro-service stack deployable to AWS EKS, Azure AKS, Google GKE, or standalone Docker environments.

### 1.1 Docker Deployment
```bash
# Build production container image
docker build -t cloudpulse-api:1.0.0 apps/api

# Run container with production environment variables
docker run -d \
  --name cloudpulse-api \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e DATABASE_URL="postgresql://cloudpulse:secret@aurora-cluster.internal:5432/cloudpulse" \
  cloudpulse-api:1.0.0
```

### 1.2 Kubernetes Pod Health Probes
Configure Kubernetes liveness, readiness, and startup probes matching the multi-tier platform endpoints:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 2
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 2
  failureThreshold: 2
```

---

## 2. Health Probes & Deep Dependency Diagnostics

CLOUDPULSE provides 3 distinct health probe tiers to prevent cascading outages:

1. **`/health/live` (Liveness Probe):**
   - Returns `200 OK` if the Node.js event loop is running.
   - Used by Kubernetes kubelet to restart stuck containers.
2. **`/health/ready` (Readiness Probe):**
   - Returns `200 OK` if database connection pool and internal memory TSDB are initialized.
   - Used by Ingress load balancers to route live user traffic.
3. **`/health/dependencies` (Deep Dependency Probe):**
   - Inspects status, latency, and buffer capacity of PostgreSQL, OTLP collector, TSDB, Background Workers, and Cloud Provider adapters.
   - Returns `200 OK` with non-blocking status even if external clouds are degraded, preventing cascading restarts.

---

## 3. Background Sync Workers & DLQ Management

CLOUDPULSE maintains 4 dedicated background sync loops:
- `WORKER_AWS_TELEMETRY` (60s interval)
- `WORKER_K8S_EVENTS` (30s interval)
- `WORKER_FINOPS_AGGREGATOR` (300s interval)
- `WORKER_GOVERNANCE_EVALUATOR` (120s interval)

### 3.1 Dead Letter Queue (DLQ) Operational Commands
Failed ingestion jobs (e.g. transient AWS API throttling or network blips) are automatically routed to the DLQ after 3 exponential backoff retries.

```bash
# View pending DLQ jobs
curl -H "x-tenant-id: tenant-cloudpulse-main" http://localhost:3001/api/v1/platform/workers

# Retry specific failed DLQ job
curl -X POST \
  -H "x-tenant-id: tenant-cloudpulse-main" \
  -H "Content-Type: application/json" \
  -d '{"jobId": "dlq-job-123"}' \
  http://localhost:3001/api/v1/platform/dlq/retry
```

---

## 4. Internal SLO & Error Budget Tracking

CLOUDPULSE continuously measures its own operational performance against 4 core Service Level Objectives:

| Service Level Objective (SLO) | Target | Current Observed | Error Budget Remaining | Status |
| :--- | :--- | :--- | :--- | :--- |
| **API Availability** | 99.95% | 99.98% | 60.0% | HEALTHY |
| **Query p95 Latency** | < 120ms | 48.2ms | 59.8% | HEALTHY |
| **Telemetry Ingestion Throughput** | > 100/s | 142.5/s | 100.0% | HEALTHY |
| **Background Sync Freshness** | < 180s | 68.4s | 62.0% | HEALTHY |

---

## 5. Hosting Unit Economics & Cloud Cost Monitoring

CLOUDPULSE self-monitors its internal hosting infrastructure costs, maintaining a baseline of **\$856.08 Month-to-Date (MTD)**:

- **Compute Tier (EKS 3x t3.xlarge):** \$362.88 MTD (\$0.504/hr)
- **Database Tier (Aurora Multi-AZ PostgreSQL):** \$417.60 MTD (\$0.580/hr)
- **Observability TSDB (Prometheus & Loki EBS gp3):** \$39.60 MTD (\$0.055/hr)
- **AI Subsystem (Gemini 2.5 Flash Token Ingestion):** \$8.64 MTD (\$0.012/hr)
- **Network Egress (Cross-AZ & Cloud Ingress/Egress):** \$27.36 MTD (\$0.038/hr)
- **Total MTD Cost:** \$856.08 USD
