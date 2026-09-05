# CLOUDPULSE — Cloud Cost Model & Data Classification

## 1. Data Source Hierarchy

| Classification | Source | Accuracy | Typical Use Case |
| :--- | :--- | :---: | :--- |
| **REAL** | AWS Cost Explorer / Cost & Usage Report | 100% | Verified monthly AWS invoice reconciliation. |
| **ESTIMATED** | Kubernetes Node & Request Allocation Formula | ~90% | Microservice pod cost attribution. |
| **DEMO** | Local Development Cost Provider | Synthetic | Local development and offline verification. |

---

## 2. Cost Unit Metrics
- **Compute (EKS/EC2)**: Hourly instance rate ($0.0125/hr for `t3.medium` Spot, $0.0416/hr On-Demand).
- **Networking (ALB/NAT)**: Hourly provisioned rate + per-GB data processed ($0.0225/hr + $0.008/GB).
- **Storage (EBS/ECR)**: Monthly provisioned GB rate ($0.08/GB-mo for `gp3`, $0.10/GB-mo for ECR).
- **Observability (CloudWatch)**: Ingested GB log rate ($0.50/GB ingested).
