# CLOUDPULSE — Resilience Engine & Service Profiles

## 1. Service Resilience Profiles

| Service | Tier | Provider / Region | RTO Target | RPO Target | Replication Strategy | Failover Strategy | Score | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`api-gateway`** | `Tier 0` | AWS us-east-1 | $30\text{s}$ | $0\text{s}$ | Multi-AZ (2 Replicas) | ALB Health Target Rerouting | **`98%`** | **`RESILIENT`** |
| **`order-service`** | `Tier 0` | AWS us-east-1 | $45\text{s}$ | $0\text{s}$ | Multi-AZ (2 Replicas) | K8s Service Endpoint Balancing | **`96%`** | **`RESILIENT`** |
| **`payment-service`**| `Tier 0` | AWS us-east-1 | $45\text{s}$ | $0\text{s}$ | Multi-AZ (2 Replicas) | K8s Endpoints + Circuit Breaker | **`94%`** | **`RESILIENT`** |
| **`telemetry-engine`**| `Tier 1` | AWS us-east-1 | $120\text{s}$ | $60\text{s}$ | Single Ingestor + TSDB | Buffer Spillover to Memory | **`92%`** | **`RESILIENT`** |

---

## 2. Mathematical Resilience Score

$$\text{Resilience Score} = \text{Redundancy (20)} + \text{Backup (18)} + \text{Health Probes (20)} + \text{Self-Healing (20)} + \text{RTO/RPO (18)} = 96\% \quad (\textbf{Grade A+})$$
