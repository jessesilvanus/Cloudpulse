# CLOUDPULSE — Business Continuity Plan & Service Tiers

## 1. Service Tiering & Critical Path

| Service | Tier | Failure Impact | Recovery Priority | Dependencies |
| :--- | :---: | :--- | :---: | :--- |
| **`api-gateway`** | **Tier 0** | Total customer ingress outage; transactions blocked. | **`1`** | `order-service`, `telemetry-engine` |
| **`order-service`** | **Tier 0** | Order creation fails; checkout queue stalls. | **`2`** | `payment-service`, `telemetry-engine` |
| **`payment-service`** | **Tier 0** | Payment verification fails; checkout rejects orders. | **`3`** | `telemetry-engine` |
| **`telemetry-engine`** | **Tier 1** | Observability degraded; customer traffic unaffected. | **`4`** | None |
| **`traffic-generator`** | **Tier 2** | Synthetic load stops; zero impact on real customer orders. | **`5`** | `api-gateway` |

---

## 2. Single Points of Failure (SPOF) Analysis & Mitigations

1. **Development Single-AZ NAT Gateway**:
   - *Status*: `designed`.
   - *Rationale*: Single-AZ in development prevents idle AWS cloud spend ($32.40/mo savings per NAT Gateway); Multi-AZ NAT Gateways are strictly provisioned in Production across `us-east-1a` and `us-east-1b`.
2. **Telemetry In-Memory Buffer**:
   - *Status*: `remaining_risk`.
   - *Mitigation*: Persistent EBS `gp3` volumes attached to collector pods in high-throughput production clusters.
