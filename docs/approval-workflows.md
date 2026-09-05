# CLOUDPULSE: Human Approval Workflows & Separation of Duties

---

## 1. Approval Architecture

CLOUDPULSE enforces a strict human-in-the-loop approval gate for any remediation action classified as `MEDIUM_RISK`, `HIGH_RISK`, or `CRITICAL_RISK`:

```typescript
export interface ApprovalRequest {
  id: string;
  incidentId: string;
  actionId: string;
  requestedBy: string;
  requestedAt: string;
  approver?: string;
  decision: ApprovalRequestState; // PENDING, APPROVED, REJECTED, EXPIRED, CANCELLED
  decidedAt?: string;
  reason?: string;
  risk: PlaybookRiskLevel;
  expectedImpact: string;
  rollbackSteps?: string;
  expiresAt: string;
}
```

---

## 2. Invariants & Safety Rules

1. **Separation of Duties**: The operator or service account requesting approval cannot approve their own request ($\text{requester} \neq \text{approver}$).
2. **Mandatory Expiration**: Every approval request defines an explicit `expiresAt` timestamp (default: 2 hours). Expired requests transition to `EXPIRED` and cannot be executed.
3. **Transparent Blast Radius**: Approval modals present the exact affected resource ARN/ID, planned configuration changes, expected workload impact, and documented rollback steps.
4. **Immutable Audit Trail**: Approval decisions (`APPROVED` / `REJECTED`) are recorded immutably in the Phase 18 audit log with operator identity and justification.
