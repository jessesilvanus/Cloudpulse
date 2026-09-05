# Action Allowlist & Precondition Engine

## Registered Allowlisted Actions

Only registered, server-side verified actions may execute within the auto-healing control plane:

1. **`AWS_EC2_ENABLE_DETAILED_MONITORING`**:
   - Resource Type: `AWS::EC2::Instance`
   - Risk: `LOW_RISK_CHANGE`
   - Preconditions: Instance exists, running state, no protection tag (`CloudPulse:Protected=true`).
   - Verification: Fresh DescribeInstances probe asserting `Monitoring.State == "enabled"`.

2. **`AWS_S3_ENABLE_PUBLIC_ACCESS_BLOCK`**:
   - Resource Type: `AWS::S3::Bucket`
   - Risk: `MEDIUM_RISK_CHANGE`
   - Preconditions: Bucket exists in connected account, human approval granted for production.
   - Verification: Fresh GetPublicAccessBlock probe asserting all 4 protection flags true.
