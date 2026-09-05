# CLOUDPULSE: Compliance Evidence Chain & End-to-End Auditability

---

## 1. Immutable Evidence Chain Structure

$$\text{Control} \longrightarrow \text{Policy} \longrightarrow \text{Resource} \longrightarrow \text{Telemetry} \longrightarrow \text{Evidence} \longrightarrow \text{Remediation} \longrightarrow \text{Verification}$$

- **Step 1: Control Requirement**: NIST SP 800-53 r5 (SC-28 Protection of Information at Rest).
- **Step 2: Policy Rule**: `pol-mandatory-kms-encryption`.
- **Step 3: Observed Resource**: `arn:aws:rds:us-east-1:123456789012:snapshot:order-db-manual-snap-01`.
- **Step 4: Evidence Record**: Snapshot was created without KMS Key ARN (`OBSERVED`, confidence: $99.0\%$).
- **Step 5: Remediation & Verification**: Automated re-encryption using primary KMS CMK (`VERIFIED`).
