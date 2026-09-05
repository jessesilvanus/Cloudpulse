# AWS Organizations Hierarchy & OU Topology

## Organization Structure

- **Organization ID**: `o-cloudpulse-corp-root`
- **Management Account**: `718293041526` (`CloudPulse-Production-Primary`)
- **Feature Set**: `ALL`
- **Root Unit**: `r-root-01` (`CloudPulse Root Organization`)

---

## Organizational Units (OUs)

### 1. Production Workloads (`ou-prod-workloads`)
- **Parent**: `r-root-01`
- **Member Accounts**:
  - `718293041526`: Primary production compute (EKS, RDS Aurora, Lambda, ALB).
  - `950182746391`: Security & audit log aggregation lake (S3, CloudTrail digests).

### 2. Staging & Development (`ou-nonprod-dev`)
- **Parent**: `r-root-01`
- **Member Accounts**:
  - `839201746152`: Pre-production and staging workloads.
  - `104829175938`: Legacy testing sandbox (`sts:AssumeRole` permission required).
