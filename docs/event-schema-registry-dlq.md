# CLOUDPULSE: Event Schema Registry & Dead Letter Queue (DLQ)

---

## 1. Schema Definitions & Versioning

| Event Type | Version | Provider | Required Fields | Compatibility | Status |
| :--- | :---: | :---: | :--- | :---: | :---: |
| `pod.crashloop` | `v1.2.0` | `kubernetes` | `exitCode`, `restartCount`, `reason` | `BACKWARD_COMPATIBLE` | **`ACTIVE`** |
| `database.connection.exhaustion` | `v1.0.0` | `aws` | `activeConnections`, `maxConnections` | `BACKWARD_COMPATIBLE` | **`ACTIVE`** |
| `cost.anomaly.detected` | `v2.0.0` | `multi-cloud` | `expectedSpendPerHour`, `observedSpendPerHour`, `anomalyMultiplier` | `BACKWARD_COMPATIBLE` | **`ACTIVE`** |
| `security.policy.violation` | `v1.1.0` | `aws` | `policyName`, `principal`, `actionDenied` | `BACKWARD_COMPATIBLE` | **`ACTIVE`** |

---

## 2. Dead Letter Queue & Controlled Retry

- Events failing schema validation or missing required attributes are automatically routed to the Dead Letter Queue (`/api/v1/event-intelligence/dlq`).
- SRE operators can inspect failure reasons and trigger controlled retries with exponential backoff and zero infinite loop conditions.
