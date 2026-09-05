#!/usr/bin/env bash
set -euo pipefail

# ── CLOUDPULSE AWS Production Deployment Script ───────────────────────────────
echo "=================================================================="
echo " CLOUDPULSE — AWS ECS Fargate Production Deployment Automation"
echo "=================================================================="

AWS_REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${ENVIRONMENT:-production}"
PROJECT_NAME="cloudpulse"
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "v0.0.3")

echo "[1/5] Checking AWS authentication and caller identity..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "  ✓ Connected to AWS Account: ${ACCOUNT_ID} (Region: ${AWS_REGION})"

echo "[2/5] Initializing Terraform and validating modules..."
cd infra/terraform
terraform init -backend=false
terraform validate

echo "[3/5] Provisioning Core Infrastructure & ECR Repositories..."
terraform apply -auto-approve \
  -target=module.vpc \
  -target=module.security \
  -target=module.iam \
  -target=module.ecr \
  -var="aws_region=${AWS_REGION}" \
  -var="environment=${ENVIRONMENT}"

ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
echo "  ✓ Authenticating Docker with Amazon ECR: ${ECR_REGISTRY}..."
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

cd ../..

echo "[4/5] Building and Pushing Production Multi-Stage Docker Images..."
SERVICES=("cloudpulse-web:apps/web/Dockerfile" "cloudpulse-api:apps/api/Dockerfile" "api-gateway:services/api-gateway/Dockerfile" "order-service:services/order-service/Dockerfile" "payment-service:services/payment-service/Dockerfile")

for SVC_PAIR in "${SERVICES[@]}"; do
  SVC_NAME="${SVC_PAIR%%:*}"
  DOCKERFILE="${SVC_PAIR##*:}"
  REPO_URI="${ECR_REGISTRY}/${PROJECT_NAME}/${ENVIRONMENT}/${SVC_NAME}"
  
  echo "  -> Building ${SVC_NAME} (${REPO_URI}:${GIT_SHA})..."
  docker build -t "${REPO_URI}:${GIT_SHA}" -t "${REPO_URI}:latest" -f "${DOCKERFILE}" .
  docker push "${REPO_URI}:${GIT_SHA}"
  docker push "${REPO_URI}:latest"
done

echo "[5/5] Deploying ECS Compute, Load Balancer & Observability..."
cd infra/terraform
terraform apply -auto-approve \
  -var="aws_region=${AWS_REGION}" \
  -var="environment=${ENVIRONMENT}"

ALB_ENDPOINT=$(terraform output -raw alb_http_endpoint)

echo "=================================================================="
echo " ✓ CLOUDPULSE AWS PRODUCTION DEPLOYMENT COMPLETE!"
echo " Public Endpoint: ${ALB_ENDPOINT}"
echo "=================================================================="
