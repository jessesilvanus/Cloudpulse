# Multi-Cloud Governance & Cross-Provider Scorecard (Phase 61)

## 1. Multi-Cloud Command Center (`/cloud-overview`)

The **Multi-Cloud Overview Command Center** provides a single-pane-of-glass operations and governance interface across AWS, Microsoft Azure, and Google Cloud Platform.

### Scorecard Aggregation Metrics

```typescript
export interface MultiCloudScorecard {
  workspaceId: string;
  organizationId: string;
  evaluatedAt: string;
  providers: MultiCloudScorecardItem[];
  aggregates: {
    totalConnectedClouds: number;
    totalResources: number;
    totalMonthlySpend: number;
    totalCriticalFindings: number;
    overallHealthPercent: number;
    overallCompliancePercent: number;
  };
  provenance: 'CALCULATED';
}
```

---

## 2. Six-Dimension Cross-Cloud Comparison Matrix

The platform evaluates cross-cloud parity, efficiency, and posture across 6 key operational dimensions:

| Dimension | AWS Metric | Azure Metric | GCP Metric | Status | Strategic Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Health & Reliability** | EC2/RDS SLA | VM/SQL Health | GCE/Cloud SQL SLA | `BALANCED` | Multi-cloud health meets target SLAs. |
| **Security & Compliance**| GuardDuty / CIS 1.4 | Defender Score | SCC Tier-1 | `AWS_OPTIMIZED` | Enable Azure Defender for Cloud automated assessments. |
| **Governance & Drift** | Config Rules (92%) | Policy Initiative (88%) | Org Constraints (85%) | `BALANCED` | Standardize tag governance across all 3 providers. |
| **FinOps & Spend** | Cost Allocation | Azure Cost Mgt | Cloud Billing | `ACTION_NEEDED` | Review idle instances and unattached disks. |
| **Identity & Access** | IAM Least Privilege | Entra Conditional | IAM Role Binding | `AWS_OPTIMIZED` | Review elevated roles and service account keys in GCP. |
| **Observability** | CloudWatch Metrics | Azure Monitor | Cloud Monitoring | `BALANCED` | Trace correlation active across all providers. |

---

## 3. Global Multi-Cloud Resource Explorer & Fast Search

The unified resource explorer allows operators to filter by provider (`ALL`, `AWS`, `AZURE`, `GCP`), health status (`HEALTHY`, `WARNING`, `CRITICAL`), service type (`COMPUTE_VM`, `OBJECT_STORAGE`, `KUBERNETES_CLUSTER`, etc.), and execute real-time search queries against canonical IDs, resource names, and tags.

### Supported API Endpoints:
- `GET /api/v1/cloud-connections/multicloud/scorecard`
- `GET /api/v1/cloud-connections/multicloud/resources`
- `GET /api/v1/cloud-connections/multicloud/comparison`
- `GET /api/v1/cloud-connections/multicloud/search?q={query}`
- `GET /api/v1/cloud-connections/azure/setup-info`
- `GET /api/v1/cloud-connections/gcp/setup-info`
