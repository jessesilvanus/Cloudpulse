# CLOUDPULSE — Cloud Cost & FinOps Optimization Guide

## 1. AWS Cost Breakdown (Monthly Estimates for `us-east-1`)

| Component | Sizing / Allocation | Monthly Estimated Cost | Cost Category | FinOps Optimization Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **ECS Fargate Tasks** | 4 tasks $\times$ 0.25 vCPU, 0.5 GB RAM | **~$15.00 / mo** | Compute | Use Fargate Spot for non-production environments to save up to 70%. |
| **Application Load Balancer**| 1 ALB with 3 Target Groups | **~$18.00 / mo** + LCU | Ingress | Consolidate path routing onto single ALB rather than separate ALBs per service. |
| **Amazon ECR** | 5 Repositories (~10 GB images) | **~$1.00 / mo** | Storage | Enforce 14-day untagged lifecycle expiration and max 30 tagged image retention. |
| **CloudWatch Logs** | ~5 GB ingestion / month | **~$2.50 / mo** | Observability | 30-day retention policy avoids perpetual storage fees. |
| **NAT Gateway (Optional)** | 1 Multi-AZ NAT GW | **~$32.00 / mo** + data | Network | **Disabled by default** (`enable_nat_gateway = false`). Tasks use public IPs or VPC Endpoints. |
| **Total Base Cost** | **Without NAT Gateway** | **~$36.50 / month** | Total | Extremely economical for portfolio / staging deployments. |

---

## 2. Key Cost Traps to Avoid

1. **NAT Gateway Sprawl**: Deploying NAT Gateways in multiple AZs adds ~$64/month in baseline fees alone before data processing. In CLOUDPULSE Terraform, `enable_nat_gateway = false` by default.
2. **Orphaned Load Balancers**: Leaving idle ALBs running incurs ~$0.0225/hour continuously.
3. **Uncapped ECR Image Storage**: Accumulating hundreds of gigabytes of untagged CI build images over time. Managed via `aws_ecr_lifecycle_policy`.
4. **Log Retention Defaulting to "Never Expire"**: Default CloudWatch log groups never expire, steadily accumulating storage fees. Managed via `retention_in_days = 30`.

---

## 3. How to Destroy Cloud Infrastructure Cleanly

When terminating an AWS cloud environment to prevent ongoing charges:

```bash
cd infra/terraform

# Review destruction plan
terraform plan -destroy -var-file="terraform.tfvars.example"

# Destroy all cloud resources
terraform destroy -auto-approve -var-file="terraform.tfvars.example"
```
