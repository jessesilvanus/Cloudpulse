# CLOUDPULSE — Workload Migration Assessment

## 1. AWS EKS to GCP GKE Migration Assessment

| Dimension | Details |
| :--- | :--- |
| **Workload Name** | CLOUDPULSE Microservices Stack (`api-gateway`, `order-service`, `payment-service`) |
| **Source Provider** | AWS (Amazon EKS / us-east-1) |
| **Target Provider** | GCP (Google Kubernetes Engine / us-central1) |
| **Portability Ratio** | **`92%`** |
| **Estimated Complexity** | **`LOW`** |
| **Overall Migration Risk** | **`LOW`** |

---

## 2. Component Migration Breakdown
- **Portable Components (No Changes Needed)**:
  - OCI Container images (`Node.js 20 Alpine`).
  - Kubernetes Helm 3 chart templates (`Deployments`, `Services`, `ConfigMaps`).
  - OpenTelemetry W3C trace propagation & span generation.
  - Prometheus TSDB metrics and Loki structured log schemas.
- **Provider-Specific Adaptations**:
  - AWS IAM Roles for Service Accounts (`IRSA`) $\longrightarrow$ GCP Workload Identity bindings.
  - AWS ALB Ingress annotations $\longrightarrow$ GKE Ingress controller configuration.
