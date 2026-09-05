# CLOUDPULSE: Remediation Workflows & Exception Governance

---

## 1. 6-Stage Remediation Workflow

```
[STAGE 1: DETECT]
  └─ Continuous policy engine flags non-compliant configuration
[STAGE 2: ANALYZE]
  └─ Extract blast radius, owner attribution, and root cause evidence
[STAGE 3: APPROVE]
  └─ Gated human operator approval for production state modification
[STAGE 4: REMEDIATE]
  └─ Execute idempotent remediation script (e.g., attach tags, purge idle storage)
[STAGE 5: VERIFY]
  └─ Re-evaluate policy engine against live telemetry; verify PASS
[STAGE 6: CLOSE]
  └─ Update violation status to RESOLVED and record immutable audit entry
```

---

## 2. Time-Bounded Exception Governance

- **Mandatory Expiration**: Every exception must possess an explicit expiration date (`expiresAt`).
- **Automatic Expiration Reversal**: Once an exception reaches its expiration date, suppressed violations automatically transition back to `OPEN`.
- **Approved Exception (`exc-001`)**:
  - *Resource*: `aws_ebs/vol-unattached-qa-99`
  - *Reason*: Temporary 30-day snapshot archive retention during QA test migration.
  - *Owner*: QA Engineering Lead (Approved by: Compliance Officer)
  - *Expires*: `2026-09-15T00:00:00Z`
