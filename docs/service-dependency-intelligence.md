# CLOUDPULSE: Service Dependency Intelligence & Cascading Failure Protection

---

## 1. Upstream / Downstream Dependency Topology

```
                  ┌──────────────────────┐
                  │     api-gateway      │  (Tier 0 - Ingress)
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │    order-service     │  (Tier 0 - Saga Coordinator)
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   payment-service    │  (Tier 1 - Settlement Sandbox)
                  └──────────────────────┘
```

---

## 2. Dependency Risk & Blast Radius Analysis

- **Critical Dependency Path**: `api-gateway` $\longrightarrow$ `order-service` $\longrightarrow$ `payment-service`.
- **Fault Isolation Strategy**: Payment service includes circuit breaker fallback; failures in `payment-service` degrade order checkout gracefully without crashing `api-gateway`.
- **Observability Signal**: Cross-service W3C trace ID propagation guarantees complete span correlation during dependency outages.
