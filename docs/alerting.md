# CLOUDPULSE — Alerting Architecture & Routing

## 1. Alert Severities & Meanings

| Severity | Color Code | Operational Meaning | Response SLA |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | `Red` | Rapid error budget burn (>14.4x) or complete service outage. | Immediate (< 5 min) |
| **HIGH** | `Orange` | Significant degradation (>6x burn rate) or elevated P99 latency. | < 30 min |
| **MEDIUM** | `Yellow` | Resource saturation (>80% CPU/Memory) or minor error blip. | < 4 hours |
| **LOW** | `Blue` | Transient anomaly or approaching non-critical threshold. | Next business day |
| **INFO** | `Slate` | Normal operational events (Deployment complete, HPA scaled). | Informational only |

---

## 2. Alert Fingerprinting & Deduplication
To prevent alert storms and fatigue during cascading failures:
- Alerts are grouped by `serviceId` + `alertType` + `environment`.
- When multiple downstream services fail due to an upstream root cause (e.g. `api-gateway` $\rightarrow$ `order-service` $\rightarrow$ `payment-service`), alerts are grouped into a single unified incident.
