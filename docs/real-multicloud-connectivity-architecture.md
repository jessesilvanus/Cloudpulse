# Real Multi-Cloud Connectivity Architecture (Phase 61)

## 1. Overview & Architecture Philosophy

CLOUDPULSE has evolved from an AWS-first cloud operations platform into a **genuine multi-cloud control plane** supporting:
1. **Amazon Web Services (AWS)** (Existing & fully functional: STS AssumeRole, 30+ services, Gov Knowledge Graph, Operations Control Plane)
2. **Microsoft Azure** (Entra ID App Registration, Subscription/Tenant discovery, Defender, Cost Management, RBAC)
3. **Google Cloud Platform (GCP)** (Service Account authorization, Cloud Resource Manager, Security Command Center, Cloud Billing, Cloud IAM)

### Provider-Neutral Control Pipeline

```
USER / WORKSPACE
      │
      ▼
CLOUDPULSE MULTI-CLOUD ADAPTER REGISTRY
      │
      ├───────────────────────┼───────────────────────┐
      ▼                       ▼                       ▼
 [AWS Adapter]         [Azure Adapter]          [GCP Adapter]
  STS AssumeRole       Entra App Reg Token     Service Account Token
  (CloudWatch/Config) (Azure Resource Graph)  (Cloud Asset Inventory)
      │                       │                       │
      └───────────────────────┼───────────────────────┘
                              ▼
               CANONICAL NORMALIZATION ENGINE
               • Canonical Resource URI
               • Normalized Service Type
               • Health & Power State
               • Identity & RBAC Matrix
               • Security Findings & Cost
                              ▼
           MULTI-CLOUD CONTROL PLANE & SCORECARD
           • Cross-Cloud Scorecard (/cloud-overview)
           • Unified Resource Explorer
           • Multi-Cloud Fast Search
           • 6-Dimension Comparison Matrix
```

---

## 2. Core Abstractions & Connection Models

### `CloudConnection` Model

Provider-neutral connection representation tracking authorization credentials, capability health, freshness, and synchronization state:

```typescript
export interface CloudConnection {
  id: string;
  workspaceId: string;
  organizationId: string;
  provider: 'AWS' | 'AZURE' | 'GCP';
  displayName: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'VALIDATING' | 'SYNCING';
  authMethod: 'AWS_ASSUME_ROLE' | 'AZURE_APP_REGISTRATION' | 'GCP_SERVICE_ACCOUNT' | 'API_KEY';
  accountOrProjectIdentifier: string; // AWS Account ID, Azure Subscription ID, or GCP Project ID
  tenantOrOrgId?: string;            // Azure Tenant ID or GCP Organization ID
  regionsOrLocations: string[];
  capabilities: CloudProviderCapability[];
  lastValidatedAt: string;
  lastSyncedAt: string;
  truthInLabelingVerified: boolean;
}
```

### Global Canonical Resource ID

Standardized format across all providers ensuring conflict-free global indexing, graph relationships, and deep linking:

- **AWS**: `aws:<accountId>:<region>:<service>:<resourceId>` (e.g., `aws:123456789012:us-east-1:ec2:i-0a1b2c3d4e5f67890`)
- **Azure**: `azure:<subscriptionId>:<location>:<service>:<resourceName>` (e.g., `azure:00000000-0000-0000-0000-000000000000:eastus:virtualMachines:vm-prod-web-01`)
- **GCP**: `gcp:<projectId>:<location>:<service>:<resourceId>` (e.g., `gcp:cloudpulse-prod-app:us-central1:computeInstances:inst-api-gateway-01`)

---

## 3. Capability Coverage Matrix

Capabilities are evaluated explicitly across every provider:
- `SUPPORTED`: Capability fully available with live data
- `PARTIAL`: Read-only or subset of capabilities available
- `UNAVAILABLE`: Not supported by provider or architecture
- `PERMISSION_REQUIRED`: Capability supported but current role/identity lacks specific IAM/RBAC grant

| Capability | AWS | Azure | GCP |
| :--- | :--- | :--- | :--- |
| **RESOURCE_DISCOVERY** | SUPPORTED | SUPPORTED | SUPPORTED |
| **METRICS_STREAMING** | SUPPORTED | SUPPORTED | SUPPORTED |
| **LOG_INGESTION** | SUPPORTED | SUPPORTED | SUPPORTED |
| **SECURITY_POSTURE** | SUPPORTED | SUPPORTED | SUPPORTED |
| **COST_MANAGEMENT** | SUPPORTED | SUPPORTED | SUPPORTED |
| **IDENTITY_GOVERNANCE** | SUPPORTED | SUPPORTED | SUPPORTED |
| **COMPLIANCE_AUDIT** | SUPPORTED | SUPPORTED | SUPPORTED |
| **AUTOMATED_REMEDIATION**| SUPPORTED | SUPPORTED | SUPPORTED |

---

## 4. Truth-in-Labeling & Zero-Fabrication Contract

1. When a provider is **DISCONNECTED**, its status is surfaced explicitly as `DISCONNECTED` with a clear zero-resource / zero-finding breakdown and direct links to the setup wizard.
2. Under no circumstance does the platform inject mock or sample metrics into a connected user tenant.
3. Automated test fixtures reside solely inside isolated test files (`*.test.ts`) and never pollute production code paths.
