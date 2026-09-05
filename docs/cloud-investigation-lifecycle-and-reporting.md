# Cloud Investigation Lifecycle & Reporting

## 1. Overview
The **CLOUDPULSE Investigation Management System** tracks complex multi-step investigations from initial anomaly detection through evidence collection, hypothesis generation, simulation, governance decision creation, and verified resolution.

---

## 2. Investigation State Machine

```
              ┌──────────────┐
              │     OPEN     │ (Case created)
              └──────┬───────┘
                     │ Start query & graph discovery
                     ▼
              ┌──────────────┐
              │  ANALYZING   │
              └──────┬───────┘
                     │ Attach query results & telemetry
                     ▼
              ┌──────────────────────┐
              │  EVIDENCE_COLLECTED  │
              └──────┬───────────────┘
                     │ Formulate root cause theory
                     ▼
              ┌──────────────────────┐
              │  HYPOTHESIS_FORMED   │
              └──────┬───────────────┘
                     │ Verify fix via What-If Simulator
                     ▼
              ┌───────────────────────┐
              │  SIMULATION_REQUIRED  │
              └──────┬────────────────┘
                     │ Convert to Phase 57 Governance Decision
                     ▼
              ┌──────────────────────┐
              │    DECISION_READY    │ ───► Converted to Governance Decision
              └──────┬───────────────┘
                     │ Controlled auto-repair & re-check
                     ▼
              ┌──────────────┐
              │   RESOLVED   │
              └──────┬───────┘
                     │ Archive case
                     ▼
              ┌──────────────┐
              │   ARCHIVED   │
              └──────────────┘
```

---

## 3. Investigation Entity Schema

```typescript
export interface CloudInvestigation {
  id: string; // e.g. "inv-aws-s3-public-exposure-01"
  tenantId: string;
  workspaceId: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: InvestigationStatus;
  scope: string;
  rootCauseHypothesis?: string;
  queries: CloudQuery[];
  evidenceNodeIds: string[];
  timeline: InvestigationTimelineEvent[];
  decisionId?: string; // Linked Phase 57 Governance Decision
  simulationId?: string; // Linked Phase 55 What-If Simulation
  remediationPlanId?: string; // Linked Phase 54 Remediation Plan
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  provenance: 'CALCULATED';
}
```

---

## 4. Integration with Phase 57 Governance Decisions

When an investigation reaches the `HYPOTHESIS_FORMED` or `DECISION_READY` stage, operators can click **Convert to Governance Decision**:
1. The investigation generates or links to a Phase 57 Governance Decision (e.g. `dec-s3-harden-public-block`).
2. The decision inherits the investigation's root-cause hypothesis, affected asset list, and risk level.
3. The investigation timeline appends a `DECISION` event with the target decision ID.
4. Operators can proceed seamlessly to What-If simulation and Phase 54 controlled auto-repair.

---

## 5. Exportable Executive Reports

The investigation engine generates formal executive summary reports (`InvestigationReport`) ready for audit and management review:
- **Executive Summary**: Overview of findings, root cause, and timeline.
- **Risk Findings**: Categorized security, governance, and reliability findings with cited AWS evidence.
- **Risk Path Diagram**: Graph path showing how actors, changes, drifts, and incidents connect.
- **Recommended Actions**: Prioritized remediation steps.
- **Export Formats**: JSON payload via REST API and markdown export via UI modal.
