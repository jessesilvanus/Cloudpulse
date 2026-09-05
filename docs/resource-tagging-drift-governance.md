# CLOUDPULSE: Multi-Cloud Resource Inventory, Tag Governance & Drift

---

## 1. Multi-Cloud Resource Inventory

| Resource ID | Provider | Resource Target | Service | Environment | Owner | Cost Center | Status |
| :--- | :---: | :--- | :--- | :---: | :--- | :---: | :---: |
| `res-gw-01` | `kubernetes` | `k8s-deployment/api-gateway` | `api-gateway` | `production` | Platform Lead | `CC-PLATFORM-101` | **`HEALTHY`** |
| `res-ord-01` | `kubernetes` | `k8s-deployment/order-service` | `order-service` | `production` | Order Squad | `CC-BACKEND-202` | **`HEALTHY`** |
| `res-pay-01` | `kubernetes` | `k8s-deployment/payment-service` | `payment-service` | `production` | Payment Squad | `CC-PAYMENTS-303` | **`HEALTHY`** |
| `res-rds-01` | `aws` | `aws_rds/order-db-primary` | `order-service` | `production` | Order Squad | `CC-BACKEND-202` | **`HEALTHY`** |
| `res-ebs-qa` | `aws` | `aws_ebs/vol-unattached-qa-99` | `order-service` | `staging` | QA Lead | `CC-BACKEND-202` | **`NON_COMPLIANT`** |
| `res-sqs-01` | `aws` | `aws_sqs/payment-events-queue` | `payment-service` | `production` | Payment Squad | `CC-PAYMENTS-303` | **`HEALTHY`** |

---

## 2. Configuration Drift Detection

- **Desired State (Terraform / GitOps)**: Monitored infrastructure specifications.
- **Actual State (Cloud Provider API / OTel Telemetry)**: Live observed resource attributes.
- **Drift Findings**: If live configuration diverges without an approved Pull Request, a `DRIFT_DETECTED` violation is dispatched immediately.
