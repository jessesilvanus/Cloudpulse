# Graph Evidence Model & Provenance

## 1. Real-Data-First Provenance
In accordance with CLOUDPULSE core principles, every node and edge within the Governance Knowledge Graph is strictly grounded in real AWS evidence.

### Provenance Classifications:
| Provenance Label | Meaning | Primary Source Services |
| :--- | :--- | :--- |
| `LIVE_AWS_EC2` | Freshly fetched from active AWS EC2 API | `DescribeInstances`, `DescribeSecurityGroups` |
| `LIVE_AWS_S3` | Freshly fetched from active AWS S3 API | `GetBucketAcl`, `GetBucketPolicyStatus` |
| `LIVE_AWS_RDS` | Freshly fetched from active AWS RDS API | `DescribeDBClusters`, `DescribeDBInstances` |
| `LIVE_AWS_IAM` | Freshly fetched from active AWS IAM API | `GetUser`, `GetRole`, `GetPolicy` |
| `LIVE_AWS_GUARDDUTY` | Freshly fetched threat telemetry | `ListFindings`, `GetFindings` |
| `LIVE_AWS_CONFIG_RULE` | Configuration drift state from AWS Config | `GetComplianceDetailsByConfigRule` |
| `LIVE_AWS_CLOUDTRAIL` | Real mutation events from CloudTrail audit trail | `LookupEvents` |
| `LIVE_AWS_CLOUDWATCH` | Real metric datapoints from CloudWatch | `GetMetricData` |
| `LIVE_AWS_COST_EXPLORER` | Cost and usage telemetry | `GetCostAndUsage` |
| `CALCULATED_POLICY_ENGINE` | Deterministic policy evaluation | CloudPulse Policy Engine |
| `CALCULATED_DECISION_ENGINE` | Synthesized governance decision | CloudPulse Governance Decision Engine |
| `CALCULATED_REMEDIATION_PLAN` | Validated repair plan | CloudPulse Remediation Orchestrator |

---

## 2. Evidence Strength Classification
Each graph edge is explicitly categorized into one of four evidence strengths:
- **`CONFIRMED`**: Direct, immutable evidence from a single authoritative AWS API response (e.g., IAM role attachment on EC2, CloudTrail actor record).
- **`DERIVED`**: Deterministically computed by linking multiple confirmed events (e.g., CloudTrail `PutBucketAcl` triggering an AWS Config `DRIFT` event).
- **`INFERRED`**: Statistically correlated relationship based on co-occurring metric bursts or traffic trends.
- **`UNKNOWN`**: Insufficient telemetry or permission to confirm the relationship.

---

## 3. Tenant Isolation & Multi-Account Safety
- Graph queries strictly enforce workspace boundaries (`x-workspace-id`).
- Unconnected or unauthorized workspaces receive empty graph datasets (`nodeCount: 0`, `edgeCount: 0`) without leaking multi-tenant topology.
