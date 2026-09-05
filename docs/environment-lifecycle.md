# CLOUDPULSE: Multi-Tier Environment Management & Lifecycle

---

## 1. Environment Tiers & Lifecycle States

```
                REQUESTED
                    │
                    ▼
              POLICY GATES
      (Security, Governance, Cost, Reliability)
                    │
                    ▼
               PROVISIONING
        (Terraform Plan / Helm Render)
                    │
                    ▼
                  READY ◄──────────┐
                    │              │
                    ▼              │ (Self-Healing)
                 DEGRADED ─────────┘
                    │
                    ▼
             DESTROY_PENDING
                    │
                    ▼
                DESTROYED
```

---

## 2. Environment Inventory & Monthly Cost Breakdown

| Environment ID | Service | Tier | Provider | Region | Monthly Cost Estimate | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `env-gw-prod` | `api-gateway` | `PRODUCTION` | Kubernetes | `us-east-1` | **`$142.50`** | **`READY`** |
| `env-gw-staging` | `api-gateway` | `STAGING` | Kubernetes | `us-east-1` | **`$68.00`** | **`READY`** |
| `env-ord-prod` | `order-service` | `PRODUCTION` | Kubernetes | `us-east-1` | **`$184.00`** | **`READY`** |
| `env-ord-staging` | `order-service` | `STAGING` | Kubernetes | `us-east-1` | **`$72.50`** | **`READY`** |
| `env-pay-prod` | `payment-service` | `PRODUCTION` | Kubernetes | `us-east-1` | **`$110.00`** | **`READY`** |
| `env-pay-staging` | `payment-service` | `STAGING` | Kubernetes | `us-east-1` | **`$45.00`** | **`READY`** |
