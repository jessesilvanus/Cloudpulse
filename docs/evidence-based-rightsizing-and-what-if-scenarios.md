# Evidence-Based Rightsizing & What-If Scenario Simulations

## Optimization Opportunities Ledger

### 1. `opt-aws-01`: EC2 Instance Downsizing
- **Target**: `i-09f18a29b8c71e4a1` (`AWS::EC2::Instance`)
- **Current Type**: `t3.xlarge` (4 vCPU, 16GB) $\rightarrow$ **Recommended**: `t3.large` (2 vCPU, 8GB)
- **Evidence**: 14-day CloudWatch P95 CPU utilization is 4.8% with memory utilization peak at 38.2%.
- **Estimated Savings**: **$45.00 / month** (Confidence: 96%)

### 2. `opt-aws-02`: S3 Storage Tiering
- **Target**: `cloudpulse-telemetry-audit-lake-prod` (`AWS::S3::Bucket`)
- **Action**: Add Lifecycle Transition to S3 Glacier Flexible Retrieval after 30 days.
- **Evidence**: 92% of audit logs unread after 14 days.
- **Estimated Savings**: **$28.50 / month** (Confidence: 94%)

### 3. `opt-aws-03`: Unattached EBS Volume Cleanup
- **Target**: `vol-0a817f2948b712c9e` (`AWS::EC2::Volume`)
- **Action**: Delete unattached gp3 50GB volume.
- **Evidence**: Volume in `available` state for 14 consecutive days with 0 IOPS.
- **Estimated Savings**: **$4.00 / month** (Confidence: 99%)

---

## What-If Scenario Simulator

The What-If Simulator calculates dynamic hypothetical cost deltas using the baseline model ($604.50/mo):
- **EC2 Compute Scaling Factor**: `0.5x` to `2.0x`
- **S3 Storage Growth Factor**: `0.5x` to `3.0x`
- **Downsized Overprovisioned Instances**: `0` to `5` instances ($45/mo reduction each)
- **Output Label**: Strict `WHAT-IF / ESTIMATED` provenance banner.
