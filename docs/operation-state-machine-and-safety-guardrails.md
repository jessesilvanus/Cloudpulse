# Operation State Machine & Safety Guardrails

## 1. Overview
The **CLOUDPULSE Operation State Machine** ensures all cloud operations follow a rigorous, non-bypassable sequence of safety verification steps before, during, and after mutation.

---

## 2. State Machine Transitions

```
               ┌──────────────┐
               │   DETECTED   │
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │   TRIAGED    │
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │ INVESTIGATING│
               └──────┬───────┘
                      │
                      ▼
            ┌───────────────────┐
            │ IMPACT_ASSESSMENT │
            └─────────┬─────────┘
                      │
                      ▼
            ┌───────────────────┐
            │  DECISION_READY   │
            └─────────┬─────────┘
                      │
                      ▼
           ┌─────────────────────┐
           │ SIMULATION_REQUIRED │
           └──────────┬──────────┘
                      │
                      ▼
            ┌───────────────────┐
            │    PLAN_READY     │
            └─────────┬─────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌───────────────┐           ┌───────────────┐
│APPROVAL_REQD  │           │   APPROVED    │ (Auto-Level 3/4)
└───────┬───────┘           └───────┬───────┘
        │ Approved                  │
        └─────────────►─────────────┘
                      │
                      ▼
               ┌──────────────┐
               │  EXECUTING   │
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │  VERIFYING   │ ◄── Fresh AWS Read Verification
               └──────┬───────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   VERIFIED   │ │PARTIAL_VERIF │ │    FAILED    │
└───────┬──────┘ └──────┬───────┘ └──────┬───────┘
        │               │                │ Rollback
        ▼               ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   RESOLVED   │ │ INVESTIGATE  │ │ ROLLED_BACK  │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 3. Pre-Flight Engine

Before any mutation is allowed to enter `EXECUTING`, the Pre-Flight Engine validates:
1. **Authenticated Session & Tenant Isolation**: Caller is authenticated with active workspace permissions.
2. **Target Resource Existence**: Target AWS ARN exists in the Knowledge Graph index.
3. **Action Allowlist Validation**: Action type is registered in the Safe Action Catalog.
4. **IAM Role Boundaries**: Execution role has exact least-privilege permissions without wildcard grants.
5. **Concurrency & Idempotency Locks**: No conflicting mutations or parallel executions on the target resource.
6. **Simulation Safety Proof**: Non-mutating What-If simulation completed with zero broken dependencies.

---

## 4. Fresh-Read Verification Engine

CLOUDPULSE adheres to **Never Trust Mutation Responses Alone**:
1. After an allowlisted mutation succeeds (e.g. `s3:PutPublicAccessBlock`), the engine immediately queries the fresh AWS API (`s3:GetPublicAccessBlock`).
2. Observed configuration is compared against the target state.
3. Only if the fresh read matches target parameters does the operation transition to `VERIFIED`.
4. If drift persists, the state is marked `PARTIALLY_VERIFIED` or `FAILED`.

---

## 5. Automation Levels

| Level | Name | Description | Requires Operator Approval |
| :--- | :--- | :--- | :--- |
| **0** | `OBSERVE` | Passive telemetry collection and detection only. | N/A |
| **1** | `RECOMMEND` | Generates impact analysis and suggested remediation. | Yes |
| **2** | `APPROVAL_REQUIRED` | Prepares simulation and plan; awaits human approval. | Yes |
| **3** | `SAFE_AUTO_REMEDIATE` | Fully reversible low-risk actions auto-execute. | No (Guarded) |
| **4** | `GUARDED_AUTOMATION` | Automated self-healing with circuit breaker limits. | No (Guarded) |

---

## 6. Loop Protection & Anti-Flapping

To prevent infinite remediation loops (e.g. Event $\rightarrow$ Remediation $\rightarrow$ Event $\rightarrow$ Remediation):
- **Cooldown Windows**: Minimum 15-minute cooldown between automated actions on the same resource.
- **Idempotency Keys**: Unique transaction tokens preventing duplicate executions.
- **Circuit Breakers**: Tripping after 3 failed attempts, blocking further automated dispatches and notifying on-call.
