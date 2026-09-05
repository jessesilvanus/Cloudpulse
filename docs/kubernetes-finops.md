# CLOUDPULSE — Kubernetes FinOps & Workload Efficiency

## 1. Kubernetes Workload Efficiency Metrics

CLOUDPULSE audits requested vs consumed resources across all active pods:

| Workload | Requested CPU / Mem | Consumed CPU / Mem | CPU Efficiency | Memory Efficiency | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`api-gateway`** | `200m` / `256Mi` | `65m` / `112Mi` | `42.0%` | `44.0%` | **`BALANCED`** |
| **`order-service`** | `200m` / `256Mi` | `85m` / `138Mi` | `51.0%` | `54.0%` | **`BALANCED`** |
| **`payment-service`**| `200m` / `256Mi` | `45m` / `98Mi` | `22.5%` | `38.0%` | **`OVERPROVISIONED`** |

---

## 2. Cluster Idle Waste Attribution
- **Total Requested CPU**: $4.0 \text{ Cores}$.
- **Total Used CPU**: $1.85 \text{ Cores}$ ($46.3\%$ efficiency).
- **Estimated Monthly Idle Waste**: $\approx \$48.60/\text{month}$.
- **Remediation**: Rightsize `payment-service` and utilize Horizontal Pod Autoscaling (HPA) to scale pods dynamically with traffic bursts.
