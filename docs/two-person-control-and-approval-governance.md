# Two-Person Control & Enterprise Approval Governance (Phase 64)

## 1. Segregation of Duties & Two-Person Control Principle

In high-risk production environments, critical actions (production Kubernetes autoscaling, database migrations, security group modifications, and destructive operations) introduce severe blast radius potential.

CLOUDPULSE implements **Strict Server-Side Two-Person Control**:
- When `requiresTwoPersonControl: true`, the engine strictly prohibits the requester from approving their own request.
- Attempting self-approval throws an immediate, immutable rejection error:
  ```
  TWO-PERSON CONTROL VIOLATION: Requester is prohibited from approving their own request. Segregation of duties is mandatory.
  ```

---

## 2. Approval Policy Matrix

| Policy Tier | Risk Level | Min Approvals | Requires Two-Person Control | Authorized Roles | Default Expiration |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Critical Infrastructure** | `CRITICAL` | 2 | **YES** | `ORG_ADMIN`, `WORKSPACE_ADMIN`, `SRE` | 24 Hours |
| **High-Risk Change** | `HIGH` | 1 | **YES** | `APPROVER`, `SRE`, `SECURITY_ANALYST` | 12 Hours |
| **Standard Change** | `MEDIUM` | 1 | NO | `ENGINEER`, `OPERATOR`, `SRE` | 48 Hours |
| **Low-Risk Standard** | `LOW` | 0 (Auto-Pass) | NO | All Roles | Instant |

---

## 3. Server-Side Enforcement Flow

```
   [ Change Proposed / Remediation Triggered ]
                      │
                      ▼
   [ Check Risk Level & Approval Policy ]
                      │
        ┌─────────────┴─────────────┐
        │                           │
  [ Low Risk ]              [ High/Critical Risk ]
        │                           │
  (Auto-Approved)         (Create Approval Request)
                                    │
                                    ▼
                         [ Approver Attempts Action ]
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
      [ Approver == Requester? ]             [ Role Authorized? ]
                  │                                   │
                 YES                                  NO
                  │                                   │
                  ▼                                   ▼
        [ THROW ERROR: ]                    [ THROW ERROR: ]
     Two-Person Control Violation        Policy Role Violation
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    │ NO VIOLATIONS
                                    ▼
                          [ Record Decision ]
                                    │
                       (Check Min Approvals Met)
                                    │
                                    ▼
                          [ Status -> APPROVED ]
```

---

## 4. Evidence-Backed Decision Recording

Every approval decision requires:
- `approverUserId` & `approverName`: Authenticated operator identity.
- `verifiedRole`: Role token matching policy requirements.
- `decidedAt`: High-resolution ISO timestamp.
- `comment`: Mandatory rationale citing reviewed blast radius simulations, rollback plans, and staging test results.
- `decision`: Explicit `APPROVED` or `REJECTED`.
