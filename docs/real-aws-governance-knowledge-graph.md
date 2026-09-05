# Real AWS Governance Knowledge Graph

## 1. Overview
The **CLOUDPULSE Governance Knowledge Graph** transforms disparate operational, security, compliance, drift, telemetry, cost, and remediation domains into a single, unified, evidence-driven property graph.

Rather than maintaining separate silos for CloudTrail changes, AWS Config drifts, GuardDuty findings, CloudWatch metrics, and FinOps costs, the Knowledge Graph models AWS entities as strongly-typed graph nodes and connects them through directed, evidence-backed relationships with explicit confidence levels.

---

## 2. Core Architecture & Ontology

```
                           ┌────────────────────────────┐
                           │      AWS Account (IAM)     │
                           └─────────────┬──────────────┘
                                         │ CONTAINS
                                         ▼
                           ┌────────────────────────────┐
                           │     AWS Region (us-east-1) │
                           └─────────────┬──────────────┘
                                         │ RUNS
                                         ▼
                           ┌────────────────────────────┐
             ┌────────────►│   AWS EC2 / S3 Resource    │◄────────────┐
             │             └─────────────┬──────────────┘             │
             │                           │                            │
   PROTECTED_BY                          │ VIOLATES / DRIFTS_FROM     │ COSTS / OBSERVED_BY
             │                           ▼                            │
┌────────────┴───────────┐ ┌────────────────────────────┐ ┌───────────┴──────────┐
│  Governance Control &  │ │ Policy Violation / Config  │ │ CloudWatch Metrics & │
│  Baseline (CIS AWS)    │ │ Drift / Security Finding   │ │ FinOps Monthly Cost  │
└────────────────────────┘ └─────────────┬──────────────┘ └──────────────────────┘
                                         │
                                         ▼
                           ┌────────────────────────────┐
                           │ Governance Decision Engine │
                           │ & Controlled Self-Repair   │
                           └────────────────────────────┘
```

---

## 3. Node Types (`CloudKnowledgeNodeType`)
| Node Type | Domain | Real AWS Evidence Source | Example Entity |
| :--- | :--- | :--- | :--- |
| `ACCOUNT` | Multi-Account | AWS Organizations | `acc-839201746152` (AWS Production Account) |
| `REGION` | Infrastructure | AWS Global Infrastructure | `reg-us-east-1` (US-East-1 N. Virginia) |
| `SERVICE` | Cloud Services | AWS Service Catalog | `srv-ec2`, `srv-s3`, `srv-rds` |
| `RESOURCE` | Cloud Assets | EC2 / S3 / RDS describe APIs | `i-08f331920acb119a0`, `s3-cloudpulse-prod-audit-logs-2026` |
| `IDENTITY` | IAM | AWS IAM `GetUser` / `ListUsers` | `usr-admin-alex`, `usr-deployer-ci` |
| `ROLE` | IAM | AWS IAM `GetRole` | `role-cloudpulse-workload-execution` |
| `POLICY` | Policy Engine | CloudPulse Policy Engine | `pol-s3-public-access-block` |
| `CONTROL` | Governance | Governance Control Registry | `ctrl-s3-public-block`, `ctrl-ec2-imdsv2` |
| `BASELINE` | Governance | CIS AWS Foundations v3.0 | `bsl-aws-cis-v3-prod` |
| `DRIFT` | Configuration | AWS Config Rule Evaluation | `drf-s3-block-public-acls` |
| `SECURITY_FINDING` | Security | AWS GuardDuty / Inspector | `sec-guardduty-unusual-api`, `sec-inspector-cve-2026-runner` |
| `CHANGE` | Auditing | AWS CloudTrail | `chg-2026-09-03-s3-bucket-acl` |
| `METRIC` | Observability | Amazon CloudWatch | `met-ec2-cpu-utilization` |
| `INCIDENT` | Reliability | CloudPulse Incident Engine | `inc-aws-2026-001` |
| `COST_RECORD` | FinOps | AWS Cost Explorer | `cst-ec2-runner-monthly` |
| `PREDICTION` | Predictive Ops| CloudPulse ML / Extrapolation| `prd-aurora-storage-exhaustion` |
| `REMEDIATION` | Remediation | CloudPulse Remediation Engine | `rem-s3-enable-public-access-block` |
| `GOVERNANCE_DECISION` | Governance | Decision Engine | `dec-s3-harden-public-block` |
| `EXCEPTION` | Policy | Exemption Registry | `exp-staging-debug-window` |
| `COMPLIANCE_CONTROL` | Compliance | CIS / SOC2 / NIST Mapping | `cmp-cis-2.1.1-s3` |

---

## 4. Relationship Types (`CloudKnowledgeRelationshipType`)
- `OWNS`: Account $\rightarrow$ Infrastructure
- `CONTAINS`: Account $\rightarrow$ Region $\rightarrow$ VPC
- `RUNS`: Region $\rightarrow$ EC2 / S3 / RDS Resource
- `DEPENDS_ON`: Resource $\rightarrow$ Downstream Database / Dependency
- `CONNECTS_TO`: Resource $\rightarrow$ Ingress Gateway / Target Group
- `ASSUMES`: IAM User $\rightarrow$ IAM Role (STS)
- `AUTHORIZES`: IAM Role $\rightarrow$ EC2 Instance Profile
- `GOVERNED_BY`: Resource $\rightarrow$ Baseline / Decision
- `PROTECTED_BY`: Resource $\rightarrow$ Governance Control
- `VIOLATES`: Resource $\rightarrow$ Active Governance Policy
- `DRIFTS_FROM`: Resource $\rightarrow$ Config Drift Event
- `CAUSED_BY`: Change $\rightarrow$ IAM Actor
- `TRIGGERED`: Change $\rightarrow$ Configuration Drift
- `AFFECTS`: Resource $\rightarrow$ Security Finding / CVE
- `OBSERVED_BY`: Resource $\rightarrow$ CloudWatch Metric
- `IMPACTS`: Resource $\rightarrow$ Live Incident
- `COSTS`: Resource $\rightarrow$ FinOps Cost Record
- `REMEDIATED_BY`: Resource $\rightarrow$ Remediation Plan
- `PREDICTED_BY`: Resource $\rightarrow$ Predictive Trend / Forecast
- `EXEMPTED_BY`: Resource $\rightarrow$ Approved Policy Exemption
- `BELONGS_TO`: Control $\rightarrow$ Compliance Framework Standard

---

## 5. Non-Mutating Safety Guarantees
- The Knowledge Graph Engine is strictly **READ-ONLY / ANALYTICAL**.
- Graph operations (summary, traversal, path tracing, risk profiling, diff calculation) **never mutate AWS resources**.
- Any remediation action suggested or linked in the graph continues to require explicit routing through the **Phase 53 / 54 controlled execution and verification pipeline**.
