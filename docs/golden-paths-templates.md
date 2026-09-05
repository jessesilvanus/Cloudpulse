# CLOUDPULSE: Golden Paths & Infrastructure Templates

---

## 1. Golden Paths Catalog

| ID | Name | Category | Base Template | Owner | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `gp-node-microservice` | Production Node.js / TS Microservice | `MICROSERVICE` | `tmpl-node-express` | Platform Engineering | **`ACTIVE`** |
| `gp-k8s-api` | Secure Kubernetes API Gateway | `KUBERNETES_SERVICE` | `tmpl-k8s-helm` | Platform Engineering | **`ACTIVE`** |
| `gp-event-worker` | High-Throughput Async Worker | `WORKER` | `tmpl-aws-ecs-fargate` | Core Backend Team | **`ACTIVE`** |
| `gp-database` | Multi-AZ PostgreSQL RDS Instance | `DATABASE` | `tmpl-rds-postgres` | Data Platform Team | **`ACTIVE`** |

---

## 2. Infrastructure Templates

### 1. `tmpl-node-express` (Node.js Express + TypeScript)
- **Target**: Kubernetes
- **Files Generated**: `src/index.ts`, `Dockerfile`, `deploy/kubernetes/deployment.yaml`
- **Policies Enforced**: `pol-non-root-container`, `pol-mandatory-tagging`

### 2. `tmpl-k8s-helm` (Production Helm Chart)
- **Target**: Kubernetes
- **Files Generated**: `Chart.yaml`, `values.yaml`, `templates/deployment.yaml`, `templates/hpa.yaml`
- **Policies Enforced**: `pol-non-root-container`, `pol-default-deny-network`

### 3. `tmpl-aws-ecs-fargate` (AWS ECS Fargate Task)
- **Target**: AWS
- **Files Generated**: `infra/terraform/modules/ecs/main.tf`, `infra/terraform/modules/ecs/variables.tf`
- **Policies Enforced**: `pol-no-wildcard-iam`, `pol-ebs-kms-encryption`

### 4. `tmpl-rds-postgres` (Terraform AWS RDS PostgreSQL)
- **Target**: AWS
- **Files Generated**: `infra/terraform/modules/rds/main.tf`, `infra/terraform/modules/rds/outputs.tf`
- **Policies Enforced**: `pol-rds-storage-encrypted`, `pol-rds-backup-retention`
