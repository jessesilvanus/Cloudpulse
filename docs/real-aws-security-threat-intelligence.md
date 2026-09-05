# Real AWS Security, Audit & Threat Intelligence Architecture

## Overview

Phase 44 establishes the **Real AWS Security, Audit & Threat Intelligence Control Plane** in CLOUDPULSE. Connected mode is strictly grounded in evidence from the authenticated user's AWS account (`718293041526`), delivering transparent posture scoring, capability discovery, privilege escalation risk mapping, and IaC remediation.

```
                      REAL CONNECTED AWS ESTATE
      (IAM, CloudTrail, Config, Security Hub, S3, RDS, EC2 VPC)
                                 │
                                 ▼
                     SECURITY ADAPTER & AUDIT
                 (Least-Privilege Non-Destructive)
                                 │
                                 ▼
               PROVIDER-NEUTRAL NORMALIZATION (CloudPulse)
               (Evidence, Framework Mappings, State Diffs)
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
          CAPABILITY MATRIX    PRIVILEGE RISK    COMPLIANCE MAPPINGS
         (Enabled vs Missing)  (Graph Analysis)  (NIST, CIS, SOC 2)
                 │               │               │
                 └───────────────┼───────────────┘
                                 │
                                 ▼
              CALCULATED SECURITY SCORE & CONTROL PLANE
                   (100% Truthful Provenance)
```

---

## Security Source Capability Matrix

CLOUDPULSE does not assume every AWS security service is configured or enabled. The platform discovers and transparently reports on each source's availability:

| Security Source | Connected Status | Reason / Diagnostic Note |
| :--- | :---: | :--- |
| **AWS CloudTrail** | `CONNECTED` | S3 Digest stream and API lookups operational in `us-east-1`. |
| **AWS IAM** | `CONNECTED` | Global IAM credential report and role boundary checks active. |
| **AWS Config** | `CONNECTED` | Configuration recorder and continuous compliance evaluation active. |
| **AWS Security Hub** | `CONNECTED` | Aggregated finding ingestion operational in `us-east-1`. |
| **Amazon GuardDuty** | `NOT_ENABLED` | Detector is not enabled in `us-east-1` for account `718293041526`. |
| **Amazon Inspector** | `PERMISSION_REQUIRED` | Missing `inspector2:ListFindings` permission in cross-account IAM role. |

---

## Security Posture Scoring Rubric

The security score is explicitly labeled **`CALCULATED`** and never misattributed as an AWS-native metric.

- **Base Score**: 100.0
- **Deductions**:
  - `CRITICAL` Open Finding: -20.0 pts
  - `HIGH` Open Finding: -10.0 pts
  - `MEDIUM` Open Finding: -3.0 pts
- **Visibility Coverage**: Calculated as active security services over total discoverable services (4 / 6 = 67.0%), labeled `PARTIAL_SECURITY_VISIBILITY`.

---

## Privilege Escalation Risk Paths

Privilege risk is calculated by evaluating attached policies against organizational boundaries:

```
[Identity: CloudPulseReadOnlyRole]
       │
       ▼ (Permission: iam:AttachRolePolicy)
[Target: AdministratorAccess]
       │
       ▼ (Guardrail: AWS Organization SCP policy-guard-root)
[Result: BLOCKED & RESOLVED]
```
