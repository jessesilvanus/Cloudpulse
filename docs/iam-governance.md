# CLOUDPULSE — IAM Governance & Privileged Access Inventory

## 1. Identity & Privileged Access Inventory

| Identity ID | Name | Type | Provider | Privileged? | Risk Score | Scope & Roles |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`id-admin-01`** | `platform-admin` | User | Local | **YES** | `65` | `GlobalPlatformAdministrator (*)` |
| **`id-svc-payment`** | `payment-service-sa` | Workload | Kubernetes | **NO** | `12` | `PaymentServiceWorkloadRole` (Scoped secrets/config) |
| **`id-svc-telemetry`**| `telemetry-engine-sa`| Workload | Kubernetes | **NO** | `15` | `TelemetryServiceWorkloadRole` |
| **`id-legacy-ci`** | `legacy-ci-bot` | Service | AWS | **YES** | `82` | `LegacyAwsCiDeployer` (**`s3:*` Wildcard Flagged**) |

---

## 2. Break-Glass Emergency Access Architecture
- **Criteria**: Break-glass credentials exist only for disaster recovery or complete control plane lockout.
- **Auditing**: Every emergency activation triggers an immediate SEV1 alert to on-call security and records an immutable audit log entry.
