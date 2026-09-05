# CLOUDPULSE — AWS Cost Explorer Integration & IAM Permissions

## 1. Least-Privilege IAM Policy for Cost Explorer

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CostExplorerReadOnly",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ce:GetAnomalies",
        "ce:GetDimensionValues",
        "ce:GetTags"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 2. Billing API Failure Handling & Caching

1. **TTL Caching**: Cost Explorer responses are cached in memory for **4 hours** to prevent hitting AWS rate limits ($0.01 per query).
2. **Graceful Fallback**: If AWS Cost Explorer returns `AccessDenied` or times out, CLOUDPULSE cleanly displays `Billing data not connected` without disrupting live SRE telemetry or observability dashboards.
