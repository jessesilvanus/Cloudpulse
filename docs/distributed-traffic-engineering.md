# CLOUDPULSE: Distributed Traffic Engineering & Load Balancing

---

## 1. Weighted Traffic Distributions

| Service Name | Routing Mode | Stable Version (Weight) | Canary Version (Weight) | Error Rate | Latency P95 | Hourly Spend Est. |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `order-service` | `CANARY` | `v2.3.0` (**90%**) | `v2.4.0-canary` (**10%**) | $0.02\%$ | $12.1\text{ ms}$ | $\$0.32/\text{hr}$ |
| `api-gateway` | `STATIC` | `v2.4.0` (**100%**) | N/A | $0.01\%$ | $4.8\text{ ms}$ | $\$0.35/\text{hr}$ |
| `payment-service` | `STATIC` | `v1.9.0` (**100%**) | N/A | $1.20\%$ | $28.5\text{ ms}$ | $\$0.22/\text{hr}$ |

---

## 2. Load Balancing Strategies

- **Round Robin**: Default for stateless ingress API gateways.
- **Least Connections**: Applied to transactional backend services (`order-service`).
- **Latency-Based Routing**: Reroutes cross-zone requests to minimum latency pods during peak traffic.
