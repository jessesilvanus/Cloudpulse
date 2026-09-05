# CLOUDPULSE: AWS Change Intelligence & Actor Attribution Model

---

## 1. Actor Normalization Matrix

| Actor Type | CloudTrail Identity Source | Normalized Principal | Sanitization |
| :--- | :--- | :--- | :--- |
| `ASSUMED_ROLE` | `sts:AssumeRole` session | `AROA...:session-name` | Zero secrets or temporary tokens exposed |
| `IAM_USER` | `iam:CreateAccessKey` user | `AIDA...:username` | Source IP captured, user agent recorded |
| `AWS_SERVICE` | AWS Service Principal | `lambda.amazonaws.com` | Internal AWS context tagged |
| `ROOT` | Root account credentials | `Account:718293041526` | Immediate CRITICAL alert raised |

---

## 2. High-Risk Change Detection Rules

1. **Unrestricted Ingress (Port 22 / 3389)**:
   - *Trigger*: `AuthorizeSecurityGroupIngress` with `0.0.0.0/0` CIDR on sensitive management ports.
   - *Risk*: `HIGH`
   - *Impact*: Security VIOLATION
2. **SCP Blocked Policy Attachment**:
   - *Trigger*: `AttachRolePolicy` on privileged role returning `AccessDenied` / SCP policy violation.
   - *Risk*: `CRITICAL`
   - *Impact*: Security VIOLATION
3. **Storage Encryption Downgrade**:
   - *Trigger*: `DeleteBucketEncryption` or disable KMS.
   - *Risk*: `HIGH`
   - *Impact*: Compliance VIOLATION
