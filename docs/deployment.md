# CLOUDPULSE — Production Deployment & Rollout Guide

## 1. Prerequisites for Real AWS Deployment

Before executing a live deployment to AWS:

1. **AWS IAM Credentials**: Configure AWS CLI with an IAM user or role with permissions for VPC, IAM, ECR, ECS, ALB, and CloudWatch.
2. **Domain & SSL Certificate (Optional)**: If HTTPS is required, request an ACM certificate in `us-east-1` and provide `certificate_arn` and `enable_https = true`.
3. **Terraform CLI**: Install Terraform $\ge 1.5.0$.
4. **Docker CLI**: Install Docker for building and pushing images to ECR.

---

## 2. Step-by-Step Deployment Procedure

### Step 1: Provision Core Infrastructure & ECR Repositories

```bash
cd infra/terraform
terraform init
terraform apply -target=module.vpc -target=module.security -target=module.iam -target=module.ecr
```

### Step 2: Build and Push Docker Images to ECR

```bash
# Log in to Amazon ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account_id>.dkr.ecr.us-east-1.amazonaws.com

# Build, tag, and push images
docker build -t <account_id>.dkr.ecr.us-east-1.amazonaws.com/cloudpulse/production/cloudpulse-web:latest -f apps/web/Dockerfile .
docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/cloudpulse/production/cloudpulse-web:latest

docker build -t <account_id>.dkr.ecr.us-east-1.amazonaws.com/cloudpulse/production/cloudpulse-api:latest -f apps/api/Dockerfile .
docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/cloudpulse/production/cloudpulse-api:latest

docker build -t <account_id>.dkr.ecr.us-east-1.amazonaws.com/cloudpulse/production/api-gateway:latest -f services/api-gateway/Dockerfile .
docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/cloudpulse/production/api-gateway:latest

docker build -t <account_id>.dkr.ecr.us-east-1.amazonaws.com/cloudpulse/production/order-service:latest -f services/order-service/Dockerfile .
docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/cloudpulse/production/order-service:latest

docker build -t <account_id>.dkr.ecr.us-east-1.amazonaws.com/cloudpulse/production/payment-service:latest -f services/payment-service/Dockerfile .
docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/cloudpulse/production/payment-service:latest
```

### Step 3: Provision Compute, Load Balancer & Observability

```bash
terraform apply
```

### Step 4: Access SRE Console

Retrieve the ALB DNS name from Terraform outputs:
```bash
terraform output alb_http_endpoint
```

---

## 3. Rollback Procedure

In the event of a deployment regression:
1. Roll back ECS task definition to previous active revision:
```bash
aws ecs update-service --cluster cloudpulse-production-cluster --service cloudpulse-production-api-service --task-definition cloudpulse-production-api:<previous_revision>
```
2. ECS will execute a rolling update with zero downtime, waiting for health checks on new tasks to pass before terminating old tasks.
