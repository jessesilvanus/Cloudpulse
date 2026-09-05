# CLOUDPULSE: Controlled Autonomous Remediation & Action Catalog

---

## 1. Controlled Action Catalog & Risk Bounds

| Action Type | Risk Level | Required Role | Required Approval | Rollback Supported | Simulation Supported |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `SCALE_SERVICE` | **`MEDIUM`** | `sre` | **`YES`** | **`YES`** | **`YES`** |
| `RESTART_SERVICE` | **`MEDIUM`** | `sre` | **`YES`** | **`YES`** | **`YES`** |
| `ROLLBACK_DEPLOYMENT` | **`HIGH`** | `sre-lead` | **`YES`** | **`YES`** | **`YES`** |
| `CLEAR_CACHE` | **`LOW`** | `engineer` | `NO` (Sandbox) | `NO` | **`YES`** |
| `RUN_HEALTH_CHECK` | **`LOW`** | `viewer` | `NO` | `NO` | **`YES`** |

---

## 2. Command Safety Invariant

- **Zero Arbitrary Execution**: The AI engine never generates or executes raw shell scripts, raw SQL, or raw cloud CLI strings.
- **Adapter Validation**: All actions execute strictly through validated, parameterized provider adapters (`KubernetesAdapter`, `AWSAdapter`).
