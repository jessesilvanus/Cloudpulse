# Cross-Account IAM Role Diagnostics Matrix

## Secure Cross-Account Role Assumption Pattern

CLOUDPULSE connects to member AWS accounts strictly via IAM Role Assumption with an enforced External ID:

```
[CloudPulse Platform]
         │
         ▼ (sts:AssumeRole with ExternalId: ext-cloudpulse-ws-prod)
[Target Account: arn:aws:iam::<AccountID>:role/CloudPulseReadOnlyRole]
         │
         ▼ (Scoped Read-Only Session)
[Query: CloudWatch, Config, EC2, S3, RDS, Cost Explorer]
```

---

## 6-Point Service Access Diagnostic Rubric

| Domain | Required IAM API Actions | Verified Status |
| :--- | :--- | :---: |
| **Resource Access** | `ec2:Describe*`, `s3:List*`, `rds:Describe*`, `lambda:List*`, `eks:List*` | `HEALTHY` |
| **IAM Access** | `iam:List*`, `iam:Get*`, `iam:GenerateCredentialReport` | `HEALTHY` |
| **Event Access** | `cloudtrail:LookupEvents`, `events:ListRules` | `HEALTHY` |
| **Security Access** | `securityhub:GetFindings`, `config:GetCompliance*` | `HEALTHY` |
| **Cost Explorer** | `ce:GetCostAndUsage`, `ce:GetDimensionValues` | `HEALTHY` / `PERMISSION_REQUIRED` |
| **Observability** | `cloudwatch:GetMetricData`, `logs:FilterLogEvents` | `HEALTHY` |
