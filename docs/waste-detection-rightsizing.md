# CLOUDPULSE: Cloud Waste Elimination & Workload Rightsizing

---

## 1. Cloud Waste Findings Catalog

| Finding ID | Resource | Service | Waste Category | Current Spend | Monthly Savings | Confidence |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| `waste-001` | `aws_ebs/vol-unattached-qa-99` | `order-service` | `UNUSED_STORAGE` | $\$28.00 / \text{mo}$ | **`$28.00`** | **`HIGH`** |
| `waste-002` | `k8s-pod/traffic-gen-idle` | `api-gateway` | `UNDERUTILIZED` | $\$35.00 / \text{mo}$ | **`$25.00`** | **`HIGH`** |

---

## 2. Workload Rightsizing Recommendations

| Target Workload | Current Allocation | Recommended Allocation | Peak Utilization | Monthly Savings | Risk |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `payment-service` | $1000\text{m CPU}, 1024\text{Mi Mem}$ | $500\text{m CPU}, 512\text{Mi Mem}$ | $18.7\%$ | **`$42.50`** | **`SAFE`** |
| `api-gateway` | $1000\text{m CPU}, 1024\text{Mi Mem}$ | $600\text{m CPU}, 768\text{Mi Mem}$ | $24.5\%$ | **`$38.00`** | **`SAFE`** |
