# CLOUDPULSE: Policy-as-Code Engine & Evaluation Lifecycle

---

## 1. Declarative Policy Definition

Policies are defined with deterministic expression rules and evaluation modes:

| Policy ID | Category | Severity | Evaluation Mode | Rule Expression | Status |
| :--- | :--- | :---: | :---: | :--- | :---: |
| `pol-mandatory-tags` | `COST` | **`HIGH`** | Continuous | `tags.owner != null && tags.team != null && tags.costCenter != null` | **`ACTIVE`** |
| `pol-signed-images` | `SUPPLY_CHAIN` | **`CRITICAL`** | Continuous | `resource.signatureStatus == "VALID" && resource.provenanceStatus == "VERIFIED"` | **`ACTIVE`** |
| `pol-encrypted-backups` | `BACKUP` | **`HIGH`** | Scheduled | `backup.encrypted == true && backup.retentionDays >= 30` | **`ACTIVE`** |
| `pol-nonroot-containers` | `SECURITY` | **`HIGH`** | Continuous | `securityContext.runAsNonRoot == true && securityContext.readOnlyRootFilesystem == true` | **`ACTIVE`** |

---

## 2. Evaluation State Invariants

- **`PASS`**: Verified complete compliance with observed configuration proof.
- **`FAIL`**: Deterministic rule failure with explicit `observedValue` vs `expectedValue` evidence.
- **`WARN`**: Minor configuration divergence under observation.
- **`UNKNOWN`**: Missing telemetry or unverified status — **CRITICAL**: Never treated as `PASS`.
