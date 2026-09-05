# CLOUDPULSE — Terraform Infrastructure as Code (IaC) Guide

## 1. Directory Structure

```
infra/terraform/
├── versions.tf               # Terraform CLI & AWS Provider versions
├── providers.tf              # AWS provider setup with default resource tags
├── variables.tf              # Input variable declarations & defaults
├── outputs.tf                # Provisioned resource IDs, endpoints & ARNs
├── main.tf                   # Root module orchestrating submodules
├── terraform.tfvars.example  # Staging / Production variable values
├── backend.tf.example        # S3 + DynamoDB state locking configuration
└── modules/
    ├── vpc/                  # Multi-AZ VPC, subnets, IGW, and NAT GW
    ├── security/             # Least-privilege Security Groups (ALB + ECS)
    ├── iam/                  # Task Execution & Task Runtime IAM Roles
    ├── ecr/                  # ECR repositories with lifecycle cleanup
    ├── alb/                  # Application Load Balancer & path-based routing
    ├── ecs/                  # ECS Fargate Cluster, Task Definitions, and Services
    └── observability/        # CloudWatch Alarms & Observability Dashboards
```

---

## 2. Terraform State Management

### Local Development / Evaluation
By default, Terraform uses local state (`terraform.tfstate`) in `.gitignore` to avoid requiring external AWS resources for inspection or plan validation.

### Production Remote State
For collaborative and CI/CD deployments:
1. Create an S3 bucket (`cloudpulse-terraform-state`) with Server-Side Encryption and Versioning enabled.
2. Create a DynamoDB table (`cloudpulse-terraform-locks`) with partition key `LockID` (Type: `String`).
3. Enable `backend.tf.example`:
```hcl
terraform {
  backend "s3" {
    bucket         = "cloudpulse-terraform-state"
    key            = "environments/production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "cloudpulse-terraform-locks"
    encrypt        = true
  }
}
```

---

## 3. How to Validate & Plan Safely

```bash
cd infra/terraform

# 1. Format check
terraform fmt -check -recursive

# 2. Initialize provider modules (local backend)
terraform init -backend=false

# 3. Validate syntax and resource arguments
terraform validate

# 4. Generate an execution plan without modifying cloud resources
terraform plan -var-file="terraform.tfvars.example"
```

> [!CAUTION]
> **Safety Boundary**: Never execute `terraform apply` against real AWS accounts during evaluation phases. Real deployment must be an explicit, planned operational step.
