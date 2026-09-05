# CLOUDPULSE: Cost Governance, Tagging Enforcement & Optimization Pipeline

---

## 1. Cost Allocation & Tagging Governance

- **Allocation Coverage**: **`100.0%`** across all active cloud and Kubernetes resources.
- **Mandatory Cost Dimensions**: `team`, `owner`, `environment`, `costCenter`, `service`.
- **Policy Enforcement**: Policy-as-Code rules (`pol-mandatory-tagging`, `pol-cost-center-required`) automatically flag or block untagged resources.

---

## 2. Optimization Opportunities Pipeline

| ID | Optimization Type | Target Service | Potential Monthly Savings | Priority | Approval Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `opt-001` | `RIGHTSIZE` | `payment-service` | **`$42.50`** | `P1` | **`APPROVED`** |
| `opt-002` | `UNUSED_STORAGE` | `order-service` | **`$28.00`** | `P2` | **`REVIEWING`** |
| `opt-003` | `SCHEDULING` | `api-gateway` | **`$25.00`** | `P2` | **`IDENTIFIED`** |
| **Total Opportunities** | — | — | **`$142.50`** | — | — |
