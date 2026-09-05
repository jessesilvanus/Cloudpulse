# AWS Security Capability Matrix & Posture Evaluation

## Capability Statuses

1. **`CONNECTED`**: Service is actively streaming findings or accessible via API queries.
2. **`AVAILABLE`**: Service is active but has produced zero findings in the evaluation window.
3. **`NOT_ENABLED`**: Service is not enabled or provisioned in the target region.
4. **`PERMISSION_REQUIRED`**: Cross-account IAM role lacks read permissions to query the service.
5. **`UNAVAILABLE`**: Account is in disconnected mode or network connectivity is down.

---

## High-Risk Network Exposure Finding (`sec-aws-01`)

- **Resource**: `sg-cloudpulse-ingress-sec` (AWS::EC2::SecurityGroup)
- **Severity**: `HIGH`
- **Observed Evidence**: CloudTrail `AuthorizeSecurityGroupIngress` executed by `sarah.connor` (ASSUMED_ROLE) authorizing `0.0.0.0/0` on TCP Port 22.
- **Calculated Risk**: Score 78.5/100 (HIGH). Exposure to automated internet brute-force attacks.
- **Remediation**:
  ```hcl
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
  ```
- **Compliance Alignments**:
  - NIST SP 800-53: `AC-4` (Information Flow Enforcement)
  - CIS AWS Foundations Benchmark: `4.1` (Restrict 0.0.0.0/0 to Port 22)
  - SOC 2 Type II: `CC6.6` (Boundary Protection)
