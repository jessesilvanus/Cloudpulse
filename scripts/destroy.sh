#!/usr/bin/env bash
set -euo pipefail

echo "=================================================================="
echo " CLOUDPULSE — Destroy AWS Cloud Infrastructure (FinOps Teardown)"
echo "=================================================================="

AWS_REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${ENVIRONMENT:-production}"

read -p "Are you sure you want to DESTROY all CloudPulse AWS resources? (y/N): " CONFIRM
if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

cd infra/terraform
terraform destroy -auto-approve \
  -var="aws_region=${AWS_REGION}" \
  -var="environment=${ENVIRONMENT}"

echo "✓ All CloudPulse AWS infrastructure has been completely destroyed."
