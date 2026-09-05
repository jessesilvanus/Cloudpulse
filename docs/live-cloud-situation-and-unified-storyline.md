# Live Cloud Situation Room & Unified Operational Storyline

## 1. Overview
The **CLOUDPULSE Live Cloud Situation Room** brings holistic, multi-dimensional operational visibility to the entire connected AWS estate. Rather than isolating operational data across disparate CloudWatch alarms, CloudTrail audit logs, AWS Config compliance reports, and GuardDuty findings, CLOUDPULSE continuously correlates every signal across 9 cloud operational domains and synthesizes chronological, end-to-end **10-Stage Operational Storylines**.

---

## 2. Live Cloud Situation Architecture

The `CloudSituation` data model represents the global operational state of an AWS tenant at any given moment:

```typescript
export interface CloudSituation {
  tenantId: string;
  workspaceId: string;
  accountId: string;
  globalHealthScore: number; // 0 - 100
  statusSummary: string;
  healthScores: CloudSituationGlobalHealth;
  activeIncidentsCount: number;
  criticalSecurityAlertsCount: number;
  governanceRegressionsCount: number;
  costAnomaliesCount: number;
  degradedResourcesCount: number;
  highRiskChangesCount: number;
  operationsQueueSummary: {
    total: number;
    pendingApproval: number;
    inFlight: number;
    recentlyVerified: number;
    blocked: number;
  };
  awsDataHealth: CloudSituationAwsDataHealth;
  lastEvaluatedAt: string;
  provenance: 'CALCULATED';
}
```

### 2.1 Multi-Domain Health Decomposition
Global health is mathematically aggregated across nine distinct operational dimensions:
1. **Account Health**: AWS Organizations hierarchy, root MFA compliance, and SCP alignment.
2. **Region Health**: Multi-region latency, regional API error rates, and AWS Service Health status.
3. **Service Health**: EKS cluster stability, Lambda error rates, ECS task health, and API Gateway latency.
4. **Resource Health**: EC2 CPU/RAM utilization, RDS Aurora storage IOPS, and S3 bucket quotas.
5. **Governance Health**: CIS AWS Foundations Benchmark compliance, tag coverage, and AWS Config compliance.
6. **Security Health**: GuardDuty threat detections, Inspector v2 CVE scores, and IAM credential exposure.
7. **Observability Health**: Metric TSDB ingestion health, OpenTelemetry tracing pipeline status, and log freshness.
8. **FinOps Health**: Real-time AWS Cost Explorer burn-rate trajectories, anomaly detection, and idle resource waste.
9. **Resilience Health**: Cross-AZ failover testing, RDS automated backup retention, and RTO/RPO target adherence.

---

## 3. Unified 24-Hour Operational Timeline

The Operational Timeline merges diverse AWS and CLOUDPULSE events into a single, filterable, chronological event stream:

```typescript
export interface OperationalTimelineItem {
  id: string;
  timestamp: string;
  domain: 'SECURITY' | 'GOVERNANCE' | 'OBSERVABILITY' | 'FINOPS' | 'INCIDENT' | 'INFRASTRUCTURE' | 'OPERATION';
  eventType: string; // e.g. "CloudTrail:ModifySecurityGroupRules", "CloudWatch:AlarmHighCpu"
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  summary: string;
  targetResourceId?: string;
  actor?: string;
  operationId?: string;
  provenance: 'REAL_AWS' | 'CALCULATED';
}
```

Supported timeframes:
- **1 Hour**: High-resolution operational triage during active incidents.
- **6 Hours**: Incident lifecycle context and immediate pre-change baselines.
- **24 Hours**: Standard daily SRE operational review and daily change correlation.
- **7 Days**: Weekly governance drift, reliability trend analysis, and capacity planning.

---

## 4. 10-Stage Operational Storyline

Every active or historical `CloudOperation` is synthesized into an end-to-end 10-Stage Storyline that explains the complete cause-and-effect chain:

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌──────────────┐     ┌───────────┐
│ 1. BEFORE │ ──► │2. TRIGGER │ ──► │ 3. CHANGE │ ──► │4. DEGRADATION│ ──► │ 5. IMPACT │
└───────────┘     └───────────┘     └───────────┘     └──────────────┘     └───────────┘
                                                                                 │
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌──────────────┐          │
│ 10. AFTER │ ◄── │ 9. VERIFY │ ◄── │ 8. ACTION │ ◄── │ 7. DECISION  │ ◄────────┘
└───────────┘     └───────────┘     └───────────┘     └──────────────┘
                                                             ▲
                                                             │
                                                      ┌──────────────┐
                                                      │6.INVESTIGATE │
                                                      └──────────────┘
```

### 4.1 Storyline Stages
1. **STAGE 1 — BEFORE (Baseline State)**: Normal operational metrics, low error rates, and healthy SLO baselines prior to deviation.
2. **STAGE 2 — TRIGGER (Initial Detection)**: Initial CloudWatch alarm, GuardDuty anomaly, or AWS Config rule evaluation.
3. **STAGE 3 — CHANGE (Root Change Event)**: CloudTrail management event (e.g., IAM role modification, Security Group ingress update, deployment).
4. **STAGE 4 — DEGRADATION (Resource Impact)**: Latency spikes, error budget burn, or unauthorized access exposure.
5. **STAGE 5 — IMPACT (Business & Dependency Blast Radius)**: Downstream microservices, impacted customer transactions, and financial risk.
6. **STAGE 6 — INVESTIGATION (Root-Cause Correlation)**: Knowledge graph path analysis connecting the trigger to the root change event.
7. **STAGE 7 — DECISION (Policy & What-If Simulation)**: Selection of the optimal safe remediation action and validation through non-mutating simulation.
8. **STAGE 8 — ACTION (Controlled Execution)**: Execution of an allowlisted mutation with IAM least-privilege role boundaries.
9. **STAGE 9 — VERIFICATION (Fresh AWS Read)**: Live AWS API query verifying that the target resource state matches desired specifications.
10. **STAGE 10 — AFTER (Post-Remediation State)**: Return to normal operational metrics, closed incidents, and documented post-mortem records.

---

## 5. AI Operations Copilot

The **CLOUDPULSE AI Operations Copilot** is a domain-specific assistant grounded strictly in real AWS telemetry and Knowledge Graph facts.

### 5.1 Non-Mutating Guarantee
The Copilot operates under strict read-only safety guarantees:
- **Zero Direct Mutation**: The Copilot cannot directly invoke AWS mutation APIs.
- **Evidence-Backed Reasoning**: Every recommendation must cite specific AWS resource ARNs, CloudWatch metric names, and CloudTrail event IDs.
- **Structured Action Output**: When proposing an action, the Copilot outputs a structured `SafeActionDefinition` payload that enters the standard approval and pre-flight validation workflow.

### 5.2 Intent Classification
The Copilot classifies operator intent into 6 core categories:
1. `EXPLAIN_SITUATION`: Summarizes overall cloud health, active incidents, and degraded resources.
2. `INVESTIGATE_INCIDENT`: Analyzes root causes using Knowledge Graph dependency paths and telemetry correlations.
3. `SIMULATE_CHANGE`: Evaluates blast radius and dependency impacts of a proposed infrastructure change.
4. `RECOMMEND_REMEDIATION`: Suggests allowlisted remediation workflows with risk scores and rollback steps.
5. `QUERY_GRAPH`: Executes natural language queries against AWS resource relationships and topology.
6. `GENERAL_SRE_ASSIST`: Answers architectural, compliance, and best-practice questions using the CIS AWS Benchmark and Well-Architected Framework.

---

## 6. AWS Data Health & Provenance Labeling

In accordance with CLOUDPULSE **Truth-in-Labeling** principles:
- **`REAL_AWS`**: Telemetry and configuration retrieved directly from active AWS APIs (CloudWatch, CloudTrail, AWS Config, GuardDuty, EC2, S3, IAM).
- **`CALCULATED`**: Aggregated metrics derived mathematically from real AWS telemetry (Health Scores, Blast Radius, Storylines).
- **`DISCONNECTED`**: Displayed with clear degraded indicators when AWS credentials or network access are unavailable.
