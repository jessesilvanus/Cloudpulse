# CLOUDPULSE: Multi-Dimensional Event Correlation Engine

---

## 1. Correlation Scoring Formulation

$$\text{Correlation Score} = w_t \cdot T + w_s \cdot S + w_r \cdot R + w_{tr} \cdot Tr + w_d \cdot D + w_{dep} \cdot Dep$$

Where:
- $T$ = Temporal proximity weight ($0.25$)
- $S$ = Service identity match ($0.20$)
- $R$ = Resource identity match ($0.15$)
- $Tr$ = W3C Distributed Trace correlation ($0.15$)
- $D$ = Deployment version relationship ($0.15$)
- $Dep$ = Upstream/Downstream dependency link ($0.10$)

---

## 2. Example Correlation Event Pair

- **Primary Event**: `evt-deploy-001` (Rolling deployment `v2.4.0` completed across 3 replicas of `order-service`)
- **Correlated Event**: `evt-metric-002` (P95 latency normalized to $14.2\text{ms}$ post-warmup)
- **Correlation Score**: **`0.94 / 1.0`**
- **Relationship Reason**: *Post-deployment latency normalization observed within 5 minutes on same service target.*
