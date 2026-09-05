# CLOUDPULSE: Human Approval Gating & Separation of Duties (SoD)

---

## 1. Separation of Duties Enforced

- **Requester**: `sre-engineer-01`
- **Approver**: `sre-lead-02`
- **SoD Policy Invariant**: `requester !== approver`. An engineer cannot approve their own action request.
- **Approval Lifecycle**: `PENDING` $\rightarrow$ `APPROVED` $\rightarrow$ `EXECUTED`. Expired approvals ($> 1\text{ hour}$) cannot be executed.
