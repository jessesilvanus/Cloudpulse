# Azure and GCP Provider Adapters & Canonical Normalization (Phase 61)

## 1. Microsoft Azure Provider Adapter (`AzureCloudAdapter`)

### Authorization & Setup Mechanism
The Azure adapter utilizes **Microsoft Entra ID App Registrations** with cross-tenant multi-tenant or single-tenant service principal authentication.

1. **Authentication Token Lifecycle**:
   - `POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token`
   - Scope: `https://management.azure.com/.default`
   - Yields bearer token with explicit expiration and auto-refresh.

2. **Required RBAC Roles**:
   - `Reader` (Subscription scope)
   - `Security Reader` (Microsoft Defender for Cloud)
   - `Cost Management Reader` (Azure Cost Management)

3. **8-Step Setup Guide**:
   - Registered at `GET /api/v1/cloud-connections/azure/setup-info` and guided via `/settings/cloud-connections/azure`.

### Normalized Azure Services

| Normalized Type | Azure Native Resource | Discovery API / Resource Graph |
| :--- | :--- | :--- |
| `COMPUTE_VM` | `Microsoft.Compute/virtualMachines` | Azure Resource Graph / Compute REST |
| `OBJECT_STORAGE` | `Microsoft.Storage/storageAccounts` | Storage Accounts API |
| `RELATIONAL_DATABASE` | `Microsoft.Sql/servers/databases` | Azure SQL Database API |
| `KUBERNETES_CLUSTER` | `Microsoft.ContainerService/managedClusters` | AKS API |
| `SERVERLESS_FUNCTION` | `Microsoft.Web/sites` (Function App) | App Service REST API |
| `VIRTUAL_NETWORK` | `Microsoft.Network/virtualNetworks` | Network Management API |
| `LOAD_BALANCER` | `Microsoft.Network/applicationGateways` | Application Gateway REST |
| `KEY_VAULT` | `Microsoft.KeyVault/vaults` | Key Vault Management API |
| `NOSQL_DATABASE` | `Microsoft.DocumentDB/databaseAccounts` | Cosmos DB API |
| `EVENT_QUEUE` | `Microsoft.ServiceBus/namespaces` | Service Bus REST API |
| `LOG_WORKSPACE` | `Microsoft.OperationalInsights/workspaces` | Azure Monitor / Log Analytics |
| `SECURITY_GROUP` | `Microsoft.Network/networkSecurityGroups` | NSG Management API |

---

## 2. Google Cloud Platform Provider Adapter (`GcpCloudAdapter`)

### Authorization & Setup Mechanism
The GCP adapter utilizes a dedicated **Google Cloud Service Account** with granular IAM role assignments.

1. **Authentication & Token Lifecycle**:
   - Service account private key / OAuth2 token exchange with `https://oauth2.googleapis.com/token`.
   - Scope: `https://www.googleapis.com/auth/cloud-platform`.

2. **Required IAM Roles**:
   - `roles/viewer` (Project level resource inspection)
   - `roles/securitycenter.findingsViewer` (Security Command Center findings)
   - `roles/billing.viewer` (Cloud Billing account cost data)
   - `roles/iam.securityReviewer` (Cloud IAM policy analysis)
   - `roles/monitoring.viewer` (Cloud Monitoring metrics)

3. **8-Step Setup Guide**:
   - Registered at `GET /api/v1/cloud-connections/gcp/setup-info` and guided via `/settings/cloud-connections/gcp`.

### Normalized GCP Services

| Normalized Type | GCP Native Resource | Discovery API |
| :--- | :--- | :--- |
| `COMPUTE_VM` | `compute.googleapis.com/Instance` | Compute Engine API v1 |
| `OBJECT_STORAGE` | `storage.googleapis.com/Bucket` | Cloud Storage JSON API v1 |
| `RELATIONAL_DATABASE` | `sqladmin.googleapis.com/Instance` | Cloud SQL Admin API v1 |
| `KUBERNETES_CLUSTER` | `container.googleapis.com/Cluster` | Kubernetes Engine API v1 |
| `SERVERLESS_FUNCTION` | `run.googleapis.com/Service` | Cloud Run Admin API v2 |
| `VIRTUAL_NETWORK` | `compute.googleapis.com/Network` | Compute Engine VPC Network API |
| `LOAD_BALANCER` | `compute.googleapis.com/UrlMap` | Cloud Load Balancing API |
| `KEY_VAULT` | `secretmanager.googleapis.com/Secret` | Secret Manager API v1 |
| `DATA_WAREHOUSE` | `bigquery.googleapis.com/Dataset` | BigQuery REST API v2 |
| `TOPIC_PUBSUB` | `pubsub.googleapis.com/Topic` | Cloud Pub/Sub API v1 |
| `LOG_WORKSPACE` | `logging.googleapis.com/LogSink` | Cloud Logging API v2 |
| `SECURITY_GROUP` | `compute.googleapis.com/Firewall` | Compute Engine Firewall API |

---

## 3. Canonical Normalization Pipeline

```typescript
export interface CloudResource {
  canonicalId: string;              // provider:scope:region:type:id
  provider: 'AWS' | 'AZURE' | 'GCP';
  scopeIdentifier: string;          // Account ID / Subscription ID / Project ID
  region: string;                   // us-east-1, eastus, us-central1
  nativeId: string;
  nativeType: string;               // e.g. Microsoft.Compute/virtualMachines
  normalizedType: CloudNormalizedServiceType; // e.g. COMPUTE_VM
  displayName: string;
  tags: Record<string, string>;
  status: 'RUNNING' | 'STOPPED' | 'PROVISIONING' | 'DEGRADED' | 'ERROR' | 'UNKNOWN';
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  costMonthlyEstimated: number;
  publiclyAccessible: boolean;
  encryptionState: 'ENCRYPTED_CUSTOMER_KEY' | 'ENCRYPTED_DEFAULT' | 'UNENCRYPTED' | 'UNKNOWN';
  lastDiscoveredAt: string;
}
```
