# CLOUDPULSE — Windows PowerShell AWS Production Deployment Script
$ErrorActionPreference = "Stop"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " CLOUDPULSE — AWS ECS Fargate Production Deployment Automation" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

$AwsRegion = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }
$Environment = if ($env:ENVIRONMENT) { $env:ENVIRONMENT } else { "production" }
$ProjectName = "cloudpulse"

Write-Host "[1/5] Checking AWS authentication and caller identity..." -ForegroundColor Yellow
$AccountId = (aws sts get-caller-identity --query Account --output text)
Write-Host "  ✓ Connected to AWS Account: $AccountId (Region: $AwsRegion)" -ForegroundColor Green

Write-Host "[2/5] Initializing Terraform and validating modules..." -ForegroundColor Yellow
Set-Location "infra/terraform"
terraform init -backend=false
terraform validate

Write-Host "[3/5] Provisioning Core Infrastructure & ECR Repositories..." -ForegroundColor Yellow
terraform apply -auto-approve `
  -target=module.vpc `
  -target=module.security `
  -target=module.iam `
  -target=module.ecr `
  -var="aws_region=$AwsRegion" `
  -var="environment=$Environment"

$EcrRegistry = "$AccountId.dkr.ecr.$AwsRegion.amazonaws.com"
Write-Host "  ✓ Authenticating Docker with Amazon ECR: $EcrRegistry..." -ForegroundColor Green
aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin $EcrRegistry

Set-Location "../.."

Write-Host "[4/5] Building and Pushing Production Docker Images..." -ForegroundColor Yellow
$Services = @(
  @{ Name = "cloudpulse-web"; Dockerfile = "apps/web/Dockerfile" },
  @{ Name = "cloudpulse-api"; Dockerfile = "apps/api/Dockerfile" },
  @{ Name = "api-gateway"; Dockerfile = "services/api-gateway/Dockerfile" },
  @{ Name = "order-service"; Dockerfile = "services/order-service/Dockerfile" },
  @{ Name = "payment-service"; Dockerfile = "services/payment-service/Dockerfile" }
)

foreach ($svc in $Services) {
  $RepoUri = "$EcrRegistry/$ProjectName/$Environment/$($svc.Name)"
  Write-Host "  -> Building $($svc.Name) ($RepoUri:latest)..." -ForegroundColor White
  docker build -t "$RepoUri:latest" -f $($svc.Dockerfile) .
  docker push "$RepoUri:latest"
}

Write-Host "[5/5] Deploying ECS Compute, Load Balancer & Observability..." -ForegroundColor Yellow
Set-Location "infra/terraform"
terraform apply -auto-approve `
  -var="aws_region=$AwsRegion" `
  -var="environment=$Environment"

$AlbEndpoint = (terraform output -raw alb_http_endpoint)

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " ✓ CLOUDPULSE AWS PRODUCTION DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host " Public Endpoint: $AlbEndpoint" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan
