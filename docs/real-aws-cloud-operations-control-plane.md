# Real AWS Cloud Operations Control Plane

## 1. Overview
The **CLOUDPULSE Cloud Operations Control Plane** transforms the platform into an active, continuous cloud operating system.

Rather than fragmenting operations across disjointed dashboards for CloudWatch alarms, CloudTrail changes, AWS Config drifts, GuardDuty security alerts, and FinOps costs, the Control Plane continuously observes connected AWS infrastructure and synthesizes operational signals into structured, safe workflows:

```
REAL AWS TELEMETRY
  │
  ▼
DETECTION (CloudWatch / CloudTrail / GuardDuty / Config)
  │
  ▼
CORRELATION (Knowledge Graph & Blast Radius)
  │
  ▼
INVESTIGATION (Automated Root-Cause Evidence Graph)
  │
  ▼
IMPACT ANALYSIS (Upstream / Downstream Dependencies)
  │
  ▼
DECISION ENGINE (Governance Decision / Remediation Plan)
  │
  ▼
WHAT-IF SIMULATION (Non-Mutating Change Validation)
  │
  ▼
PRE-FLIGHT CHECKS & APPROVAL GATES (Level 0–4 Automation)
  │
  ▼
CONTROLLED AWS EXECUTION (Allowlisted Structured Mutator)
  │
  ▼
FRESH AWS READ VERIFICATION (True State Comparison)
  │
  ▼
EFFECTIVENESS & POST-MORTEM STORYLINE
```

---

## 2. Core Data Models

### `CloudOperation`
Represents an active operational mitigation, security containment, or configuration upgrade:

```typescript
export interface CloudOperation {
  id: string; // e.g. "op-s3-public-access-mitigation"
  tenantId: string;
  workspaceId: string;
  accountId: string;
  region: string;
  title: string;
  description: string;
  operationType: OperationType;
  targetResourceIds: string[];
  triggerType: 'EVENT' | 'ALARM' | 'ANOMALY' | 'POLICY_VIOLATION' | 'DRIFT' | 'MANUAL' | 'PREDICTION';
  detectionSource: string;
  incidentId?: string;
  investigationId?: string;
  decisionId?: string;
  simulationId?: string;
  remediationPlanId?: string;
  priority: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  state: OperationState;
  preconditions: CloudOperationPrecondition[];
  approvalState: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  automationLevel: 0 | 1 | 2 | 3 | 4;
  executionState: 'IDLE' | 'PREFLIGHT_CHECK' | 'EXECUTING' | 'COMPLETED' | 'BLOCKED' | 'FAILED';
  verificationState: 'PENDING' | 'VERIFYING' | 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'FAILED' | 'UNKNOWN';
  rollbackState: 'NOT_APPLICABLE' | 'AVAILABLE' | 'IN_PROGRESS' | 'ROLLED_BACK' | 'FAILED' | 'UNAVAILABLE';
  evidenceIds: string[];
  confidence: KnowledgeEvidenceConfidence;
  freshness: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  provenance: 'CALCULATED';
}
```

---

## 3. Global Cloud Health Scoring

The Control Plane provides holistic health separation across cloud domains:
- **Account Health**: AWS Organization connection and OU compliance.
- **Region Health**: Multi-region latency and regional service availability.
- **Service Health**: EKS, ECS, Lambda, API Gateway error rates.
- **Resource Health**: EC2 CPU/memory, S3 buckets, RDS Aurora storage headroom.
- **Governance Health**: CIS AWS Benchmark v3.0 compliance and AWS Config rules.
- **Security Health**: GuardDuty findings, Inspector CVEs, public exposure risk.
- **Observability Health**: Metric TSDB ingestion, distributed tracing spans, and log streams.
- **FinOps Health**: Spend anomaly detection and budget burn trajectories.
- **Resilience Health**: Multi-AZ failover readiness and automated backup validation.

---

## 4. REST API Endpoints

- `GET /api/v1/cloud-connections/aws/operations/situation`: Live operational situation model.
- `GET /api/v1/cloud-connections/aws/operations`: Work queue of operations with priority and state filtering.
- `GET /api/v1/cloud-connections/aws/operations/:id`: Single operation detail view.
- `PATCH /api/v1/cloud-connections/aws/operations/:id/state`: Transition state with server-side legal transition validation.
- `GET /api/v1/cloud-connections/aws/operations/:id/preflight`: Evaluate pre-flight checks and blockers.
- `POST /api/v1/cloud-connections/aws/operations/:id/execute`: Execute allowlisted operation with fresh-read verification.
- `POST /api/v1/cloud-connections/aws/operations/:id/rollback`: Execute safe automated rollback.
- `GET /api/v1/cloud-connections/aws/operations/timeline`: Unified operational timeline (1h, 6h, 24h, 7d).
- `GET /api/v1/cloud-connections/aws/operations/:id/storyline`: 10-stage operational storyline.
- `GET /api/v1/cloud-connections/aws/operations/safe-actions`: Registered safe action allowlist.
- `POST /api/v1/cloud-connections/aws/operations/copilot`: AI Operations Copilot conversational assistant.
