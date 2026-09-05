# AWS API Relationship Discovery & Evidence Model

## Evidence Categorization Standard

Every discovered edge in CLOUDPULSE is assigned a strict evidence category:

1. **`CONFIRMED`**:
   - Explicitly returned by an AWS API response (e.g. `elasticloadbalancing:DescribeTargetHealth`, `ec2:DescribeSecurityGroups`).
   - Confidence: `HIGH`.
2. **`DERIVED`**:
   - Synthesized from multiple explicit AWS facts (e.g. Subnet Route Table $\rightarrow$ NAT Gateway $\rightarrow$ Internet Gateway).
   - Confidence: `MEDIUM` to `HIGH`.
3. **`INFERRED`**:
   - Statistically or heuristically correlated from metrics or access logs without direct configuration pointers.
   - Confidence: `LOW` to `MEDIUM`.
4. **`UNKNOWN`**:
   - Relationship cannot be verified with available permissions.
