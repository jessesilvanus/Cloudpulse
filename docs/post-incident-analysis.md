# CLOUDPULSE: Post-Incident Analysis & Corrective Actions

---

## 1. Post-Incident Review (PIR) Framework

Every resolved security or reliability incident triggers a structured Post-Incident Review to foster blameless engineering culture and continuous operational improvement:

```typescript
export interface PostIncidentReview {
  id: string;
  incidentId: string;
  rootCause: string;
  trigger: string;
  impact: string;
  timeline: {
    timestamp: string;
    phase: string;
    description: string;
  }[];
  whatWorked: string[];
  whatFailed: string[];
  lessonsLearned: {
    category: string;
    lesson: string;
  }[];
  correctiveActions: {
    id: string;
    description: string;
    owner: string;
    priority: string;
    status: 'open' | 'in_progress' | 'completed';
    dueDate: string;
  }[];
  createdAt: string;
}
```

---

## 2. 5 Whys Root Cause Analysis

PIRs utilize the 5 Whys methodology to uncover underlying architectural and process root causes rather than stopping at surface-level symptoms:
1. *Why was kubectl exec attached to the production pod?* $\rightarrow$ The engineer needed an immediate memory heap dump.
2. *Why was a live heap dump required?* $\rightarrow$ The order-service experienced transient DB connection pool timeouts.
3. *Why could this not be diagnosed via metrics?* $\rightarrow$ Continuous heap profiling was not enabled in staging.
4. *Why was continuous profiling missing?* $\rightarrow$ Ephemeral debug container tooling was not included in the standard Helm chart.
5. *Root Cause*: Lack of ephemeral container profiling in the base service template necessitated manual live pod execution.

---

## 3. Corrective Action Tracking

Action items are tracked with assigned team owners, priority levels, explicit due dates, and lifecycle statuses (`open` $\rightarrow$ `in_progress` $\rightarrow$ `completed`).
