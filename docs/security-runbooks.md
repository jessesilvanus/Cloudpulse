# CLOUDPULSE — Security Incident Runbooks

## 1. Compromised Credential & Secret Revocation (`srb-credential-leak`)
- **Severity**: `CRITICAL`
- **Detection**: TruffleHog CI alert, anomalous CloudTrail IAM activity, or unauthorized API login.
- **Containment**: Immediately deactivate IAM role or SSM parameter key; force user session termination.
- **Remediation**: Rotate credential, update secret store, and trigger graceful rolling restart.
- **Verification**: Verify old credential returns HTTP 401 Unauthorized; verify application reconnects with new credential.

---

## 2. Unauthorized RBAC Privilege Escalation (`srb-unauthorized-access`)
- **Severity**: `HIGH`
- **Detection**: Spikes in `PERMISSION_DENIED` events in Security Audit Log.
- **Containment**: Suspend offending user token and block source IP at ALB.
- **Remediation**: Reset user role to least-privilege `viewer` in authorization database.
- **Verification**: Confirm protected administrative endpoints return HTTP 403 Forbidden.
