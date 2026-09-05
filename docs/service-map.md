# CLOUDPULSE — Dynamic Service Dependency Map

## 1. Derived Topology & Health Evaluation

The service map is derived dynamically from live distributed trace parent-child relationships and Prometheus metrics:

```mermaid
flowchart LR
    Gateway["api-gateway\n(Rate: 125.4 rps | Error: 0.8% | P95: 85ms)\n[HEALTHY]"]
    Order["order-service\n(Rate: 94.2 rps | Error: 1.1% | P95: 110ms)\n[HEALTHY]"]
    Payment["payment-service\n(Rate: 68.5 rps | Error: 3.4% | P95: 340ms)\n[DEGRADED]"]

    Gateway -->|94.2 rps / 110ms| Order
    Order -->|68.5 rps / 340ms| Payment
```

---

## 2. Health Scoring Formulation
$$\text{ServiceHealth} = \begin{cases} 
\text{CRITICAL} & \text{if ErrorRate} > 5\% \text{ or P95} > 1000\text{ms} \\
\text{DEGRADED} & \text{if ErrorRate} > 2\% \text{ or P95} > 300\text{ms} \\
\text{HEALTHY} & \text{otherwise}
\end{cases}$$
