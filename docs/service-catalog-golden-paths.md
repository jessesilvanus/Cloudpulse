# CLOUDPULSE: Service Catalog & Standardized Golden Paths

---

## 1. Approved Service Catalog Matrix

| Service Identifier | Display Name | Category | Provider | Supported Environments | Risk Level | Monthly Cost Model | Provisioning Mode |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- | :---: |
| `microservice-workload` | Kubernetes Microservice Workload | `KUBERNETES` | `kubernetes` | dev, test, staging, prod | **`MEDIUM`** | $\$35.00/\text{pod/mo}$ | `AUTOMATED` |
| `managed-postgresql` | AWS RDS PostgreSQL Database | `DATABASE` | `aws` | dev, staging, prod | **`HIGH`** | $\$145.00/\text{mo}$ (Multi-AZ) | `APPROVAL_GATED` |
| `redis-token-cache` | ElastiCache Redis Cluster | `DATABASE` | `aws` | dev, staging, prod | **`LOW`** | $\$45.00/\text{mo}$ (cache.t4g) | `AUTOMATED` |
| `event-messaging-queue` | AWS SQS Standard & FIFO Queue | `MESSAGING` | `aws` | dev, test, staging, prod | **`LOW`** | $\$0.40/\text{M req}$ | `AUTOMATED` |
| `secure-object-storage` | S3 Secure Object Storage Bucket | `STORAGE` | `aws` | dev, staging, prod | **`MEDIUM`** | $\$0.023/\text{GB/mo}$ | `AUTOMATED` |
| `egress-nat-gateway` | High-Availability NAT Gateway | `NETWORKING` | `aws` | prod | **`MEDIUM`** | $\$41.00/\text{mo} + \text{data}$ | `APPROVAL_GATED` |
