# AWS Cost Allocation & Tag Governance

## Tag-Based Cost Attribution Model

Cost records are attributed across mandatory enterprise governance tags:

1. **`Environment: Production`**: `$476.50` (78.8%)
2. **`Environment: Staging`**: `$128.00` (21.2%)
3. **`Owner: Platform-Core`**: `$380.00` (62.9%)
4. **Untagged Resources**: `$34.50` (5.7% — Flagged as governance violation)

---

## Service Spend Distribution

- **Amazon EC2**: `$245.00` (40.5%)
- **Amazon RDS**: `$185.00` (30.6%)
- **Amazon S3**: `$82.50` (13.6%)
- **Amazon EKS**: `$72.00` (11.9%)
- **AWS Lambda**: `$20.00` (3.4%)
