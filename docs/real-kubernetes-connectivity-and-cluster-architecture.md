# Real Kubernetes Connectivity & Cluster Architecture (Phase 62)

## 1. Overview & Architectural Pipeline

CLOUDPULSE transforms Kubernetes into a **first-class infrastructure domain** that seamlessly bridges cloud providers (AWS EKS, Azure AKS, Google GKE, and self-managed clusters) into the unified observability, security, governance, FinOps, and operations control plane.

```
CLOUD CONNECTION (AWS / Azure / GCP)
      │
      ▼
KUBERNETES CONNECTION (EKS / AKS / GKE / Self-Managed)
      │
      ▼
AUTHENTICATION & LEAST-PRIVILEGE RBAC TOKEN
  • AWS IAM / IRSA Token
  • Azure Entra / AAD Token
  • Google Cloud IAM Token
  • ServiceAccount Bearer Token
      │
      ▼
CLUSTER DISCOVERY & TELEMETRY INGESTION
  • CoreV1 (Nodes, Namespaces, Pods, Services, PVs, PVCs, Events)
  • AppsV1 (Deployments, StatefulSets, DaemonSets, ReplicaSets)
  • BatchV1 (Jobs, CronJobs)
  • NetworkingV1 (Ingresses, NetworkPolicies)
  • RbacV1 (Roles, ClusterRoles, RoleBindings, ClusterRoleBindings)
  • AutoscalingV2 (HorizontalPodAutoscalers)
  • Metrics API / Prometheus TSDB
      │
      ▼
CANONICAL NORMALIZATION & GRAPH BINDING
  • Canonical Resource URI: k8s:<provider>:<scope>:<kind>:<name>
  • Cloud ↔ Kubernetes Cross-Domain Edges (EKS -> VPC -> ALB -> Node -> Pod)
      │
      ▼
CLOUDPULSE CONTROL PLANE & COMMAND CENTER (/kubernetes)
```

---

## 2. Supported Kubernetes Flavors & Auth Methods

| Platform | Provider Tag | Primary Auth Mechanism | Scoped Access |
| :--- | :--- | :--- | :--- |
| **Amazon EKS** | `EKS` | AWS IAM / IRSA / STS EKS presigned token | Read-only ClusterRole across namespaces |
| **Azure AKS** | `AKS` | Microsoft Entra / AAD token exchange | Azure RBAC + Kubernetes Reader Role |
| **Google GKE** | `GKE` | Google Cloud IAM OAuth2 bearer token | GKE RBAC viewer role binding |
| **Self-Managed** | `SELF_MANAGED` | ServiceAccount bearer token | Least-privilege read-only ClusterRole |

---

## 3. Canonical Normalization Models

### `KubernetesCluster`
```typescript
export interface KubernetesCluster {
  id: string;
  canonicalId: string; // k8s:provider:scope:clusterName
  workspaceId: string;
  provider: KubernetesProvider;
  cloudScope: string;
  clusterName: string;
  clusterVersion: string;
  region: string;
  status: 'HEALTHY' | 'DEGRADED' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  nodeCount: number;
  namespaceCount: number;
  workloadCount: number;
  podCount: number;
  apiHealth: 'HEALTHY' | 'DEGRADED' | 'UNREACHABLE';
  cpuCapacityCores: number;
  cpuAllocatableCores: number;
  memoryCapacityBytes: number;
  memoryAllocatableBytes: number;
  capabilities: KubernetesCapability[];
  observedAt: string;
  freshness: 'LIVE' | 'FRESH' | 'STALE' | 'PARTIAL' | 'UNKNOWN';
}
```

### `KubernetesPod` Condition Diagnostics
Condition detection is strictly backed by live CoreV1 container states:
- `CrashLoopBackOff`: Container in waiting state with `CrashLoopBackOff` reason and restart count > 0.
- `ImagePullBackOff`: Container in waiting state with image registry lookup failure.
- `OOMKilled`: Container in terminated state with exit code 137 or OOM flag.
- `Pending` / `Unschedulable`: Pod in Pending phase due to insufficient CPU/Memory allocatable capacity.

---

## 4. Truth-in-Labeling & Zero-Fabrication Contract

1. When a Kubernetes cluster is **DISCONNECTED**, its status is surfaced explicitly as `DISCONNECTED` with 0 nodes and 0 workloads.
2. Under no circumstance are fake pods or sample utilization metrics injected into a connected user tenant.
3. Test fixtures exist solely inside isolated test files (`*.test.ts`).
