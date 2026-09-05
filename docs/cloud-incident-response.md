# CLOUDPULSE: Cloud Incident Response & SOAR Architecture

---

## 1. Executive Summary

CLOUDPULSE Phase 19 delivers an enterprise **Security Orchestration, Automation, and Response (SOAR)** platform engineered specifically for modern cloud infrastructure, Kubernetes workloads, and hybrid environments. The platform transforms raw SOC detections into structured, defensible, and audited incident response workflows.

```
                           SECURITY EVENTS & DETECTIONS
                                (CloudTrail, K8s Audit, OTel)
                                             │
                                             ▼
                                  AUTOMATED TRIAGE ENGINE
                             (What, Why, Evidence, Confidence)
                                             │
                                             ▼
                                 INCIDENT RESPONSE ENGINE
                                (P1–P4 Priority & Lifecycle)
                                             │
                                             ▼
                                      PLAYBOOK ENGINE
                               (Defensive Structured Actions)
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
               SAFE AUTOMATION                                APPROVAL QUEUE
         (Telemetry, Context, Tags)                     (High-Risk State Changes)
                      │                                             │
                      │                                             ▼
                      │                                      HUMAN APPROVAL
                      │                                  (Separation of Duties)
                      │                                             │
                      └──────────────────────┬──────────────────────┘
                                             │
                                             ▼
                                 RESPONSE EXECUTION ENGINE
                                   (Idempotency & Locks)
                                             │
                                             ▼
                                  CLOSED-LOOP VERIFICATION
                                (Fail → Execute → Pass Audit)
                                             │
                                             ▼
                                     RECOVERY WORKFLOW
                                   (Post-Incident Review)
```

---

## 2. Response Incident Model

Every security incident is tracked via the `ResponseIncident` domain schema:

```typescript
export interface ResponseIncident {
  id: string;
  title: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  priority: ResponseIncidentPriority; // P1, P2, P3, P4
  status: ResponseIncidentState;
  source: string;
  detections: string[];
  affectedAssets: string[];
  riskScore: number;
  assignedTo?: string;
  incidentCommander?: string;
  triageDetails?: {
    what: string;
    why: string;
    evidence: string[];
    confidence: 'high' | 'medium' | 'low';
    recommendedPlaybookId?: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}
```

---

## 3. Incident Priority Classification

| Priority | Level | Target MTTA | Target MTTR | Description |
| :---: | :--- | :---: | :---: | :--- |
| **P1** | **CRITICAL** | $< 5\text{ min}$ | $< 30\text{ min}$ | Active privilege escalation, credential theft, or unauthorized data exfiltration. |
| **P2** | **HIGH** | $< 15\text{ min}$ | $< 2\text{ hours}$ | Critical vulnerability exposure, security logging disabled, or brute force burst. |
| **P3** | **MEDIUM** | $< 1\text{ hour}$ | $< 8\text{ hours}$ | Interactive Kubernetes pod exec session, IAM policy drift, or staging anomaly. |
| **P4** | **LOW** | $< 4\text{ hours}$ | $< 24\text{ hours}$ | Minor tagging deviation, informational compliance notice, or non-disruptive alert. |

---

## 4. Incident Lifecycle States

1. **`NEW`**: Incident created from normalized SOC detection.
2. **`TRIAGED`**: Automated triage engine evaluated priority, confidence, and recommended playbook.
3. **`INVESTIGATING`**: Operator assigned, capturing telemetry and contextual evidence.
4. **`AWAITING_APPROVAL`**: High-risk remediation action paused pending operator authorization.
5. **`RESPONDING`**: Defensive playbook steps executing under active execution lock.
6. **`VERIFYING`**: Closed-loop verification confirming threat elimination.
7. **`RECOVERING`**: Workload health, network routes, and baseline logging verified.
8. **`RESOLVED`**: Threat neutralized; incident verified and marked resolved.
9. **`CLOSED`**: Post-Incident Review (PIR) signed off and corrective actions logged.
