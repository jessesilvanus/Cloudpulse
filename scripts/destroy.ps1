# CLOUDPULSE — Windows PowerShell AWS Teardown Script
$ErrorActionPreference = "Stop"

Write-Host "==================================================================" -ForegroundColor Red
Write-Host " CLOUDPULSE — Destroy AWS Cloud Infrastructure (FinOps Teardown)" -ForegroundColor Red
Write-Host "==================================================================" -ForegroundColor Red

$AwsRegion = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }
$Environment = if ($env:ENVIRONMENT) { $env:ENVIRONMENT } else { "production" }

$Confirm = Read-Host "Are you sure you want to DESTROY all CloudPulse AWS resources? (y/N)"
if ($Confirm -ne "y" -and $Confirm -ne "Y") {
  Write-Host "Aborted." -ForegroundColor Yellow
  exit 0
}

Set-Location "infra/terraform"
terraform destroy -auto-approve `
  -var="aws_region=$AwsRegion" `
  -var="environment=$Environment"

Write-Host "✓ All CloudPulse AWS infrastructure has been completely destroyed." -ForegroundColor Green
