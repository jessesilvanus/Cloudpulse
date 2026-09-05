# Non-Invasive Remediation Safety & Exemption Governance

## Remediation Safety Blueprint

All governance remediations are non-invasive and follow the controlled lifecycle:
```
DETECTED ──> RECOMMENDATION ──> PLAN ──> IMPACT ANALYSIS ──> APPROVAL ──> EXECUTION ──> VERIFICATION
```

### Remediation Blueprint for `gov-find-ec2-01`
- **Action**: Enable Detailed Monitoring on instance `i-078a1bc49281e7f02`.
- **Command**: `aws ec2 monitor-instances --instance-ids i-078a1bc49281e7f02`
- **Operational Risk**: `LOW`
- **Rollback**: `aws ec2 unmonitor-instances --instance-ids i-078a1bc49281e7f02`
- **Verification Method**: Query CloudWatch metric periodicity and verify 60s timestamp intervals.

---

## Governed Exemptions

Policy exemptions are strictly time-bounded and require formal security owner approval:
- **Exemption ID**: `exm-dev-ec2-01`
- **Target Resource**: `i-088fbc91e772a11b0`
- **Reason**: Ephemeral sandbox test instance terminated nightly by AWS EventBridge rule.
- **Approved By**: `security-lead@cloudpulse.io`
- **Duration**: 14 days remaining (`ACTIVE`)
