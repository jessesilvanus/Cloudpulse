# CLOUDPULSE: Real-Time Decision Engine & Event Correlation

---

## 1. Multi-Dimensional Correlation Groups

| Group ID | Correlated Name | Primary Service | Triggering Events | Root Cause Hypothesis | Status | Decision Generated |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `corr-grp-001` | API Gateway Memory Saturation & CrashLoop | `api-gateway` | `evt-k8s-pod-101` (`pod.crashloop`) | Container memory limit ($512\text{Mi}$) breached under sustained burst traffic. | **`ACTIVE`** | `dec-001` (Auto-Scale) |
| `corr-grp-002` | Order Service PostgreSQL Pool Exhaustion | `order-service` | `evt-db-conn-102` (`database.connection.exhaustion`) | Connection pool leak during high-concurrency order placement transactions. | **`ACTIVE`** | `dec-002` (Recycle Pool) |

---

## 2. Real-Time Decision Rules

```
RULE: dec-rule-k8s-scale
CONDITION: IF pod.crashloop == true AND restartCount >= 3
EVIDENCE: exitCode 137 (OOMKilled) + Prometheus Memory 100%
CONFIDENCE: 96%
RECOMMENDED ACTION: Scale api-gateway replicas from 3 to 5 and increase memory limit to 1024Mi.
POLICY GATE: REQUIRES_OPERATOR_APPROVAL (Phase 27 Human Approval Gating)
```
