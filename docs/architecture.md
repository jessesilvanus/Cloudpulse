# CLOUDPULSE Enterprise Architecture & Platform Specification

**Version:** 1.0.0 (Production Release)  
**System Classification:** Multi-Cloud SRE, FinOps, Security & Autonomous Operations Control Plane  
**Supported Clouds:** Amazon Web Services (AWS), Microsoft Azure, Google Cloud Platform (GCP), Kubernetes (EKS / AKS / GKE / On-Prem)

---

## 1. Executive Architecture Overview

CLOUDPULSE is an enterprise-grade multi-cloud intelligence and operations control plane designed to ingest, normalize, correlate, govern, and optimize cloud infrastructure across disparate hyperscalers and container orchestrators.

Unlike legacy dashboards that rely on synthetic mocking or siloed metric viewers, CLOUDPULSE operates on a **Truth-in-Labeling & Grounded Data Provenance Model**, ensuring that every metric, cost breakdown, topology node, and security finding carries cryptographic or operational data provenance.

```
+---------------------------------------------------------------------------------------------------+
|                                 CLOUDPULSE SINGLE PANE OF GLASS                                   |
|       Executive Command Center | FinOps & GreenOps | Cloud SOC | SRE Reliability | Mesh Traffic   |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                  APPLICATION & SECURITY API GATEWAY                               |
|        Tenant Isolation Guard | Token-Bucket Rate Limiter | Circuit Breaker | Secret Redaction    |
+---------------------------------------------------------------------------------------------------+
                                                  |
                   +------------------------------+-------------------------------+
                   |                                                              |
                   v                                                              v
+------------------------------------+                         +------------------------------------+
|     ANALYTICAL & SRE ENGINES       |                         |    SECURITY & GOVERNANCE ENGINES   |
| - RealCloudPulsePlatformEngine     |                         | - EnterpriseGovernanceEngine       |
| - EnterpriseCommandCenterEngine    |                         | - SoarEngine (SOAR Playbooks)      |
| - AdvancedFinOpsGreenOpsEngine     |                         | - CloudComplianceEngine (SOC2/CIS) |
| - SreReliabilityControlPlaneEngine |                         | - CloudIdentityIamEngine (RBAC)    |
| - ServiceMeshTrafficEngine         |                         | - SoftwareSupplyChainEngine (SLSA) |
+------------------------------------+                         +------------------------------------+
                   |                                                              |
                   +------------------------------+-------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                               MULTI-CLOUD PROVIDER NORMALIZATION LAYER                            |
|       AWS Live Provider        |   Azure Cloud Adapter   |   GCP Cloud Adapter  |  K8s Orchestrator   |
+---------------------------------------------------------------------------------------------------+
           |                                  |                        |                   |
           v                                  v                        v                   v
      AWS APIs (STS)                    Azure ARM APIs          GCP Resource Mgr      K8s API Server
  (EC2, S3, RDS, IAM,                   (VM, Blob, SQL,         (GCE, GCS, Spanner,  (Pods, Nodes, PVC,
   Cost Explorer, CloudWatch)            Entra ID, Monitor)      IAM, Cloud Billing)  Services, Ingress)
```

---

## 2. Core Architectural Principles

### 2.1 Truth-in-Labeling & Data Provenance
Every piece of data rendered or returned by CLOUDPULSE is explicitly tagged with its operational provenance:
- `LIVE`: Directly sampled from the cloud provider API within active sync interval (< 60s).
- `FRESH`: Ingested from cached telemetry within nominal SLA (< 5m).
- `STALE`: Telemetry timestamp exceeds freshness boundary (> 5m); UI flags warning.
- `PARTIAL`: Ingestion succeeded for a subset of regions or accounts due to provider rate limits.
- `UNKNOWN`: Resource state could not be resolved from authoritative provider signals.
- `NOT_CONNECTED`: Cloud provider integration has not been configured.
- `UNAVAILABLE`: Upstream provider API returned 5xx / outage status.
- `PERMISSION_REQUIRED`: IAM credentials lack sufficient read-only scope for the target API.
- `CALCULATED`: Deterministically derived metric (e.g., MTBF, MTTR, Burn Rate, Cost Efficiency).
- `ESTIMATED`: Projected metric based on regression models (e.g., 30-day FinOps run-rate forecast).
- `PREDICTED`: Machine learning inference model prediction (e.g., anomaly & failure risk forecast).
- `SIMULATED`: Generated in isolated chaos engineering or disaster recovery simulation mode.
- `OBSERVED`: Raw telemetry time-series points sampled via OTLP / Prometheus collector.

### 2.2 Strict Multi-Tenant Isolation
All API transactions, cache keys, worker pipelines, and TSDB partitions are isolated by tenant boundary:
- Mandatory `x-tenant-id` header inspection on all protected ingress routes.
- Cross-tenant IDOR defense rejects any attempt to query resources owned by foreign tenants with `403 Forbidden` (`ERR_CROSS_TENANT_FORBIDDEN`).
- Per-tenant rate limit quotas and circuit breaker state tracking prevent "noisy neighbor" resource starvation.

### 2.3 Resilient Background Telemetry & Sync Workers
Platform background workers run continuously on decoupled loops:
1. `WORKER_AWS_TELEMETRY`: Pulls CloudWatch metrics, EC2 states, RDS health every 60s.
2. `WORKER_K8S_EVENTS`: Streams Kubernetes Informer events, Pod lifecycle transitions every 30s.
3. `WORKER_FINOPS_AGGREGATOR`: Reconciles AWS Cost Explorer, Azure Billing, GCP Billing every 300s.
4. `WORKER_GOVERNANCE_EVALUATOR`: Runs CIS and SOC 2 policy evaluation rules across resource graph every 120s.

---

## 3. Platform Micro-Engine Matrix

| Engine Subsystem | Key Responsibilities | Primary Data Sources |
| :--- | :--- | :--- |
| **RealCloudPulsePlatformEngine** | Self-observability, multi-tier health probes, circuit breakers, rate limiting, DLQ management, unit economics ($856.08 MTD). | Internal TSDB, Express router telemetry, AWS Cost Explorer |
| **EnterpriseCommandCenterEngine** | Executive multi-cloud health scoring (88.4/100), global search, scenario simulation, AI Executive Assistant. | Unified multi-cloud state graph, Live Provider adapters |
| **AdvancedFinOpsGreenOpsEngine** | Cost allocation, carbon footprint estimation, anomaly detection, unit economics, waste reclamation. | AWS Cost Explorer, Azure Cost Management, GCP Cloud Billing |
| **SreReliabilityControlPlaneEngine** | SLI/SLO tracking, error budget burn rates, pre-flight release gates, MTTA/MTTR analytics. | Prometheus OTLP metrics, CloudWatch, Service Mesh telemetry |
| **SoarEngine & WorkflowEngine** | Incident triage, automated & assisted playbooks, Two-Person Control, separation of duties, change freezes. | CloudTrail, Kubernetes Audit, GitHub Actions CI/CD |
| **CloudComplianceEngine** | Automated compliance evaluation (SOC 2, ISO 27001, CIS, HIPAA, GDPR, PCI-DSS), evidence generation. | Cloud provider configuration descriptors, IAM audit logs |
| **SoftwareSupplyChainEngine** | SBOM generation (CycloneDX/SPDX), SLSA Build L3 verification, container signature checks (Cosign). | Sigstore Rekor, Container Registry API, GitHub Provenance |

---

## 4. Scalability & Deployment Topology

- **Containerized API Service**: Multi-stage Docker image built on `node:22-alpine` with non-root security context.
- **Frontend SPA**: React 18 + Vite 5 + TailwindCSS + Lucide Icons compiled into static assets served via NGINX or CDN.
- **Data Tier**: Primary relational storage in PostgreSQL (Aurora Multi-AZ), in-memory TSDB for high-throughput time-series telemetry.
- **High Availability**: Multi-AZ deployment across 3 availability zones with automated circuit breaker failover and Zero-Data-Loss RPO.
