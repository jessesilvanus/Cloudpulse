# CLOUDPULSE Multi-Cloud Connection & Integration Guide

**Version:** 1.0.0 (Production Release)  
**Supported Clouds:** AWS, Azure, GCP, Kubernetes (EKS / AKS / GKE / On-Prem)  
**Security Baseline:** Read-Only Principle of Least Privilege (PoLP)

---

## 1. Overview of Multi-Cloud Ingestion

CLOUDPULSE connects to hyperscalers and container clusters exclusively through secure, audited, read-only mechanisms. No write credentials or root keys are ever stored or required for normal observability, inventory discovery, FinOps aggregation, or compliance auditing.

---

## 2. Amazon Web Services (AWS) Setup

### 2.1 Recommended Connection Method: Cross-Account IAM Role via STS
CLOUDPULSE uses AWS Security Token Service (STS) `AssumeRole` with an external ID for cross-account authentication.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/CloudPulseSaaSConnectorRole"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "cp-tenant-customer-uuid-2026"
        }
      }
    }
  ]
}
```

### 2.2 Required AWS IAM Managed Policies
Attach the following standard AWS managed policies to your connector role:
- `arn:aws:iam::aws:policy/SecurityAudit`
- `arn:aws:iam::aws:policy/job-function/ViewOnlyAccess`

### 2.3 Additional Scoped Read Permissions (FinOps & Organizations)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudPulseFinOpsAndOrgRead",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ce:GetDimensionValues",
        "organizations:DescribeOrganization",
        "organizations:ListAccounts",
        "organizations:ListOrganizationalUnitsForParent",
        "cloudwatch:GetMetricData",
        "cloudwatch:ListMetrics"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 3. Microsoft Azure Setup

### 3.1 App Registration & Service Principal
1. Register a new Application in **Microsoft Entra ID** (e.g., `CloudPulse-MultiCloud-Collector`).
2. Generate an OAuth2 Client Secret or configure Certificate-Based Authentication.
3. Record the `Tenant ID`, `Client ID`, and `Client Secret`.

### 3.2 Required Azure Role-Based Access Control (RBAC)
Assign the following built-in roles at the Subscription or Management Group level:
- `Reader` (Allows inventory querying of Virtual Machines, Virtual Networks, AKS clusters, Storage Accounts)
- `Cost Management Reader` (Allows querying of Azure Cost Management & Billing APIs)
- `Security Reader` (Allows ingestion of Microsoft Defender for Cloud security recommendations)

---

## 4. Google Cloud Platform (GCP) Setup

### 4.1 Workload Identity Federation / Service Account
1. Create a dedicated Service Account in your Google Cloud Project: `cloudpulse-collector@<project-id>.iam.gserviceaccount.com`.
2. Configure **Workload Identity Federation** (recommended) or download a credential JSON key.

### 4.2 Required GCP IAM Roles
Grant the following read-only roles at the Project or Folder/Organization level:
- `roles/viewer` (Read access to Compute Engine, Google Kubernetes Engine, Cloud Storage, Cloud SQL)
- `roles/billing.viewer` (Read access to Cloud Billing reports and SKU cost breakdowns)
- `roles/monitoring.viewer` (Read access to Cloud Monitoring time-series metrics)
- `roles/resourcemanager.organizationViewer` (Read access to GCP Resource Manager hierarchy)

---

## 5. Kubernetes Cluster Setup

### 5.1 RBAC ClusterRole & ServiceAccount
Deploy the following minimal RBAC manifest to your cluster (EKS, AKS, GKE, or On-Premises):

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cloudpulse-agent
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cloudpulse-reader
rules:
  - apiGroups: [""]
    resources: ["nodes", "namespaces", "pods", "services", "persistentvolumes", "persistentvolumeclaims", "events"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "daemonsets", "statefulsets", "replicasets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["networking.k8s.io"]
    resources: ["ingresses", "networkpolicies"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["metrics.k8s.io"]
    resources: ["nodes", "pods"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cloudpulse-reader-binding
subjects:
  - kind: ServiceAccount
    name: cloudpulse-agent
    namespace: kube-system
roleRef:
  kind: ClusterRole
  name: cloudpulse-reader
  apiGroup: rbac.authorization.k8s.io
```

---

## 6. Connection Validation & Health Probes

CLOUDPULSE continuously probes connection latency and credential freshness via `/health/dependencies`:
- **AWS API Probe:** Validates STS session token & describes default region VPC.
- **Azure API Probe:** Checks Entra ID token renewal & ARM subscription reachability.
- **GCP API Probe:** Executes lightweight Project Resource Manager ping.
- **Kubernetes Probe:** Validates cluster API server latency and Informer watch stream health.
