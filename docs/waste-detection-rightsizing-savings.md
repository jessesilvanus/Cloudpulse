# CLOUDPULSE: Waste Detection, Rightsizing & Savings Opportunities

---

## 1. Prioritized Optimization Opportunities

| Opportunity ID | Target Resource | Category | Current Configuration | Recommended Action | Monthly Savings | Annualized Savings | Confidence | Risk |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `opt-ebs-idle` | `aws_ebs/vol-unattached-qa-99` | **`STORAGE_WASTE`** | 250GB gp3 unattached | Snapshot to S3 and delete unattached volume | **`$20.00`** | $\$240.00$ | $98\%$ | `LOW` |
| `opt-rds-rightsize` | `aws_rds/order-db-primary` | **`RIGHTSIZING`** | db.t4g.medium Multi-AZ | Purchase 1-Year All-Upfront Savings Plan | **`$52.50`** | $\$630.00$ | $92\%$ | `LOW` |
| `opt-k8s-limits` | `k8s-deployment/payment-service` | **`CONTAINER_RIGHTSIZING`** | 3 pods @ 500m CPU | Adjust request bounds to 250m & enable KEDA | **`$70.00`** | $\$840.00$ | $90\%$ | `LOW` |

---

## 2. Total Potential Recoverable Savings

- **Monthly Recoverable Spend**: **`$142.50 / mo`**
- **Annualized Recoverable Spend**: **`$1,710.00 / yr`**
