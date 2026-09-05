# CLOUDPULSE: SOAR Response Playbooks Specification

---

## 1. Response Playbook Architecture

Playbooks are version-controlled, deterministic workflow specifications defining defensive incident response steps:

```typescript
export interface ResponsePlaybook {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  trigger: string;
  steps: PlaybookStep[];
  approvalPolicy: 'AUTO' | 'APPROVAL_REQUIRED' | 'MANUAL_ONLY';
  version: string;
  status: 'DRAFT' | 'TESTING' | 'ACTIVE' | 'DISABLED' | 'DEPRECATED';
  enabled: boolean;
  successRatePercent: number;
}
```

---

## 2. Playbook Step Types

| Step Type | Risk Level | Approval Required | Description |
| :--- | :---: | :---: | :--- |
| `NOTIFY` | `SAFE` | No | Broadcasts incident alert to security Slack channels and on-call schedules. |
| `CREATE_TICKET` | `SAFE` | No | Creates Jira/ServiceNow tracking ticket with 5-W evidence links. |
| `ADD_TAG` | `LOW_RISK` | No | Tags affected cloud/K8s resource with `IncidentStatus=quarantined`. |
| `CAPTURE_CONTEXT` | `SAFE` | No | Captures runtime thread dumps, IAM sessions, and active network connections. |
| `INCREASE_MONITORING` | `LOW_RISK` | No | Increases Prometheus scraping rate and Loki log verbosity for affected pods. |
| `COLLECT_LOG_REFERENCE` | `SAFE` | No | Queries and archives relevant Loki log streams to permanent audit storage. |
| `RUN_DIAGNOSTIC` | `SAFE` | No | Executes non-destructive health checks, curl probes, and DNS lookups. |
| `REQUEST_APPROVAL` | `HIGH_RISK` | **Yes** | Queues human authorization gate for potentially disruptive infrastructure changes. |
| `VERIFY_STATE` | `SAFE` | No | Audits post-remediation configuration against declared policy invariants. |
| `ISOLATE_HOST` | `CRITICAL_RISK` | **Yes** | Attaches default-deny NetworkPolicy or isolates EC2 security group. |
| `ROTATE_SECRET` | `MEDIUM_RISK` | **Yes** | Triggers automated secret rotation in AWS Secrets Manager / Vault. |

---

## 3. Seeded Playbook Catalog

### `pb-iam-containment-01`: IAM Compromised Role Isolation & Session Revocation
- **Severity**: `critical`
- **Approval Policy**: `APPROVAL_REQUIRED`
- **Steps**:
  1. `step-01-notify`: Broadcast incident to Security Incident Commander (`SAFE`).
  2. `step-02-capture`: Snapshot active session credentials and CloudTrail audit log (`SAFE`).
  3. `step-03-request-approval`: Request operator approval to detach wildcard policy (`HIGH_RISK`, approval required).
  4. `step-04-verify`: Verify IAM policy state and confirm zero active STS sessions (`SAFE`).

### `pb-k8s-audit-review-02`: Kubernetes Workload Diagnostic & Runtime Verification
- **Severity**: `medium`
- **Approval Policy**: `AUTO`
- **Steps**:
  1. `step-k8s-01-logs`: Extract stdout/stderr streams to Loki audit bucket (`SAFE`).
  2. `step-k8s-02-metrics`: Increase Prometheus scrape frequency for affected pod (`LOW_RISK`).
  3. `step-k8s-03-verify`: Verify container health probe and rootfs immutability (`SAFE`).
