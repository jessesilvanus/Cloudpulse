# CLOUDPULSE: Kubernetes Autoscaling, Safety Guards & FinOps

---

## 1. Horizontal Pod Autoscaler (HPA) Rules

| Workload Name | Min Replicas | Max Replicas | Target CPU % | Current CPU % | Scaling Action |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `order-service` | 2 | 10 | $70\%$ | $45\%$ | **HOLD** (Stable) |
| `api-gateway` | 3 | 12 | $75\%$ | $32\%$ | **HOLD** (Stable) |

---

## 2. FinOps Safety Limits

- To prevent runaway cluster auto-scaling costs, scaling caps are enforced at maximum $50$ replicas per workload, with namespace resource quotas capping total cluster CPU allocations at $24$ cores for `cloudpulse-prod`.
