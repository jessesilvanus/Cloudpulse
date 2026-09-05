# CLOUDPULSE: AWS IAM Role Setup & Permission Diagnostics Matrix

---

## 1. Cross-Account Trust Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::718293041526:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "cp-ext-ws-production-8f92a10c"
        }
      }
    }
  ]
}
```

---

## 2. Least-Privilege Read-Only Permission Matrix

| Permission | Purpose | Impact if Missing | Status |
| :--- | :--- | :--- | :---: |
| `sts:GetCallerIdentity` | Account identity verification | Core connection check fails | **GRANTED** |
| `ec2:DescribeRegions` | Region discovery | Multi-region inventory empty | **GRANTED** |
| `ec2:DescribeInstances` | Compute workload discovery | EC2 instances unavailable | **GRANTED** |
| `ec2:DescribeVpcs` | Network topology | VPC & Subnet topology empty | **GRANTED** |
| `s3:ListAllMyBuckets` | Object storage audit | S3 bucket count unavailable | **GRANTED** |
| `rds:DescribeDBInstances` | Relational database topology | Aurora/RDS status unavailable | **GRANTED** |
| `lambda:ListFunctions` | Serverless discovery | Lambda function metrics empty | **GRANTED** |
| `cloudwatch:GetMetricData` | Real-time golden metrics | Telemetry charts unavailable | **GRANTED** |
| `iam:GetAccountSummary` | Zero-Trust hygiene audit | Security posture score partial | **GRANTED** |
| `ce:GetCostAndUsage` | Cost Explorer billing data | FinOps monthly spend unavailable | **GRANTED** |
