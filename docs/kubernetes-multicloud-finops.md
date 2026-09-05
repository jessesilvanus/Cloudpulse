# CLOUDPULSE: Kubernetes & Multi-Cloud Cost Optimization

---

## 1. Kubernetes Workload Efficiency Breakdown

$$\text{Efficiency \%} = \frac{\text{Actual Usage}}{\text{Requested Resource Limit}} \times 100\%$$

| Workload | Requested CPU | Actual CPU | CPU Efficiency | Requested RAM | Actual RAM | RAM Efficiency | Monthly Cost |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `api-gateway` | $1000\text{m}$ | $245\text{m}$ | **`24.5%`** | $1024\text{Mi}$ | $391\text{Mi}$ | **`38.2%`** | $\$142.50$ |
| `order-service` | $1000\text{m}$ | $321\text{m}$ | **`32.1%`** | $1024\text{Mi}$ | $456\text{Mi}$ | **`44.6%`** | $\$184.00$ |
| `payment-service` | $1000\text{m}$ | $187\text{m}$ | **`18.7%`** | $1024\text{Mi}$ | $301\text{Mi}$ | **`29.4%`** | $\$110.00$ |

---

## 2. Multi-Cloud Spend Normalization

| Provider | Monthly Spend | Share Percentage | Primary Workload Driver |
| :--- | :---: | :---: | :--- |
| **Kubernetes (Compute)** | **`$436.50`** | $70.2\%$ | `order-service` ($184.00$) |
| **AWS Cloud (Managed)** | **`$185.50`** | $29.8\%$ | `aws_rds/order-db-primary` ($72.50$) |
| **Total Multi-Cloud Spend** | **`$622.00`** | **`100.0%`** | — |
