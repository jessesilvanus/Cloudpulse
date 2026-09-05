# CLOUDPULSE Enterprise Cloud Workflow Architecture (Phase 64)

## Overview

The **CLOUDPULSE Enterprise Cloud Workflow Engine** elevates CLOUDPULSE from an individual operator observability console into a multi-user, governed enterprise cloud operations control plane. It integrates real cross-cloud telemetry, security findings, Kubernetes workloads, and FinOps metrics into an actionable, lifecycle-managed operational pipeline.

---

## 1. Core Workflow Pipeline

Every operational event in CLOUDPULSE follows an immutable, evidence-backed 10-step lifecycle:

```
[ DISCOVERY ] ──> [ ASSIGNMENT ] ──> [ COLLABORATION ] ──> [ REVIEW ] ──> [ DECISION ]
       │
       └──> [ APPROVAL ] ──> [ EXECUTION ] ──> [ VERIFICATION ] ──> [ POST-ACTION REVIEW ] ──> [ AUDIT ]
```

1. **Discovery**: Live telemetry (SLO breach, security finding, drift, or manual change) instantiates a `CloudWorkItem`.
2. **Assignment**: Resource ownership resolution maps the item to an owning team with SLA countdown tracking.
3. **Collaboration**: Engineers swarm on the issue with threaded comments and rich `EvidenceReference` citations (metrics, logs, traces, blast radius findings).
4. **Review**: Multi-pillar review packs (Security, FinOps, Governance, Reliability, Simulation) automatically validate proposed changes.
5. **Decision**: Stakeholders record explicit approval or rejection decisions with auditable justifications.
6. **Approval**: Enforces policy gates including **Strict Two-Person Control** (segregation of duties).
7. **Execution**: Automated or guided execution of changes within scheduled maintenance windows (subject to freeze gating).
8. **Verification**: Live fresh-read probes confirm recovery before closing the change or incident.
9. **Post-Action Review (PIR)**: Automated post-incident reviews capture 5-whys, root causes, and corrective action items.
10. **Audit**: Immutable, tamper-evident timeline logs preserve the full cryptographic event history.

---

## 2. Resource Ownership & Truth-in-Labeling

CloudPulse resolves resource and issue ownership using multi-source provenance:

| Provenance Level | Source | Confidence | Description |
| :--- | :--- | :--- | :--- |
| `SERVICE_CATALOG` | Central Service Catalog | 100% | Explicitly mapped service-to-team registry |
| `KUBERNETES` | Pod/Deployment Labels | 95% | Kube annotations (`app.kubernetes.io/managed-by`, `team`) |
| `TAGS` | Cloud Provider Tags | 90% | AWS/Azure/GCP Resource Tags (`Owner`, `Team`, `Squad`) |
| `EXPLICIT_CONFIG`| Workspace Policy | 85% | Declarative workspace routing rules |
| `UNKNOWN` | Uninstrumented / Untagged | 0% | Truth-in-labeling fallback (`UNKNOWN / INSUFFICIENT DATA`) |

---

## 3. Work Items Inbox Architecture (`/work`)

The Unified Inbox categorizes work items across 8 operational sections:
- `MY_WORK`: Items assigned directly to the active user.
- `TEAM_WORK`: Unassigned and in-flight items owned by the user's primary team.
- `UNASSIGNED`: Triaged items awaiting team or engineer assignment.
- `WAITING_FOR_APPROVAL`: Items blocked on human approval decisions.
- `WAITING_FOR_VERIFICATION`: Remediated items undergoing live telemetry health checks.
- `BLOCKED`: Items blocked by dependencies, change freezes, or capacity limits.
- `OVERDUE`: Items exceeding SLA response or resolution thresholds.
- `RECENTLY_COMPLETED`: Resolved items retained for audit and handoff reviews.

---

## 4. Multi-Disciplinary Cloud Teams & Escalation Policies

Teams are defined with distinct operational roles, permissions, and multi-tier escalation policies:
- **Roles**: `WORKSPACE_ADMIN`, `ORG_ADMIN`, `SRE`, `SECURITY_ANALYST`, `FINOPS_ANALYST`, `OPERATOR`, `ENGINEER`, `APPROVER`, `VIEWER`.
- **Escalation Tiers**: Multi-tier countdowns trigger escalation from on-call primary to secondary, team leads, and incident commanders if acknowledgement SLAs are breached.
- **Handover Notes**: Structured shift handoffs preserve context and state during cross-regional rotation handoffs.

---

## 5. Unified REST API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/workflow/summary` | `GET` | Executive workflow summary, active items, pending approvals, and workload balancing |
| `/api/v1/workflow/teams` | `GET`, `POST` | List and create multi-disciplinary operational teams |
| `/api/v1/workflow/teams/:id` | `GET` | Retrieve team detail, members, on-call status, and escalation tiers |
| `/api/v1/workflow/items` | `GET` | Multi-criteria filtered work items inbox (section, priority, status, provider) |
| `/api/v1/workflow/items/:id/assign` | `POST` | Assign work item to user or team with timeline logging |
| `/api/v1/workflow/items/:id/status` | `POST` | Update lifecycle status with reason |
| `/api/v1/workflow/items/:id/escalate` | `POST` | Trigger escalation level advancement |
| `/api/v1/workflow/items/:id/handoff` | `POST` | Shift handover with mandatory handover notes |
| `/api/v1/workflow/items/:id/comments` | `GET`, `POST` | Threaded comments with `EvidenceReference` citations |
| `/api/v1/workflow/items/:id/timeline` | `GET` | Tamper-evident activity timeline events |
| `/api/v1/workflow/approvals` | `GET` | Enterprise approval requests with Two-Person Control policies |
| `/api/v1/workflow/approvals/:id/decide` | `POST` | Record human decision (`APPROVED` / `REJECTED`) |
| `/api/v1/workflow/changes` | `GET`, `POST` | Governed change requests with multi-pillar review pack |
| `/api/v1/workflow/maintenance-windows` | `GET` | Scheduled maintenance windows with recurring days and times |
| `/api/v1/workflow/change-freezes` | `GET` | Active change freezes with emergency override gating |
| `/api/v1/workflow/notifications` | `GET` | Role-based notifications with unread tracking |
| `/api/v1/workflow/briefings/:incidentId` | `GET` | Evidence-backed incident briefing with hypotheses and timeline |
| `/api/v1/workflow/postmortems` | `GET` | Post-Incident Reviews (PIR) and corrective action items |
| `/api/v1/workflow/action-items` | `GET` | Operational action items tracking |
| `/api/v1/workflow/ai-copilot` | `POST` | AI SRE / Workflow Copilot grounded in real workflow records |
