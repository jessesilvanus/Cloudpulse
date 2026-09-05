# CLOUDPULSE: Unit Economics & Business Impact Modeling

---

## 1. Operational Unit Economics

| Service | Monthly Spend | Monthly Throughput | Unit Cost Metric | Calculated Unit Cost |
| :--- | :---: | :---: | :--- | :---: |
| `api-gateway` | $\$136.00$ | $6,245,800\text{ req}$ | Cost per HTTP Request | **`$0.0000218 / req`** |
| `order-service` | $\$299.20$ | $364,500\text{ orders}$ | Cost per Placed Order | **`$0.0008208 / order`** |
| `payment-service` | $\$111.00$ | $582,100\text{ txns}$ | Cost per Authorized Transaction | **`$0.0001907 / txn`** |

---

## 2. Business Impact & Cost of Downtime

| Service | Business Criticality | Estimated Downtime Cost / Hour | User Impact Description | Source |
| :--- | :---: | :---: | :--- | :---: |
| `api-gateway` | **`CRITICAL`** | **`$25,000.00 / hr`** | Complete platform unavailability and cart abandonment | `CONFIGURED_ESTIMATE` |
| `order-service` | **`CRITICAL`** | **`$18,000.00 / hr`** | Checkout failure and delayed order fulfillment | `CONFIGURED_ESTIMATE` |
| `payment-service` | **`CRITICAL`** | **`$12,500.00 / hr`** | Payment processing authorization timeout | `CONFIGURED_ESTIMATE` |
