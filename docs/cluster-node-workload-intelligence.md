# CLOUDPULSE: Cluster, Node & Workload Intelligence

---

## 1. Managed Clusters Inventory

| Cluster Name | Provider | Region | Version | Health Score | Nodes | Pods | Storage Alloc. | Spend Est. |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `eks-prod-us-east-1` | AWS EKS | `us-east-1` | `v1.30.2` | **97.5** | 4 | 22 | $480\text{ GB} / 1000\text{ GB}$ | $\$980.50/\text{mo}$ |
| `aks-staging-west-eu` | Azure AKS | `westeurope` | `v1.29.6` | **94.0** | 2 | 6 | $120\text{ GB} / 500\text{ GB}$ | $\$320.00/\text{mo}$ |

---

## 2. Workload Health Matrix

- **`api-gateway`**: 3/3 Replicas Ready (CPU Limit: 2.0 Cores, Memory Limit: 2048Mi)
- **`order-service`**: 4/4 Replicas Ready (CPU Limit: 4.0 Cores, Memory Limit: 4096Mi)
- **`payment-service`**: 2/3 Replicas Ready (1 Pod in `CrashLoopBackOff` due to OOMKilled exit code 137)
