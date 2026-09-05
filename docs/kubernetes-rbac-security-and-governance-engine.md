# Kubernetes RBAC, Security & Governance Engine (Phase 62)

## 1. RBAC & Identity Analysis

The CLOUDPULSE Kubernetes RBAC Engine inspects:
- **`ServiceAccount`** definitions and namespace bounds.
- **`Role`** and **`ClusterRole`** rules.
- **`RoleBinding`** and **`ClusterRoleBinding`** associations.

### Privileged Identity & Wildcard Rule Detection
- Identifies ServiceAccounts bound to `cluster-admin` with wildcard `*` verbs or `*` apiGroups.
- Flags dangerous access patterns (e.g. Secrets access in non-secure namespaces, exec privileges).

```typescript
export interface KubernetesRbacSummary {
  serviceAccountsCount: number;
  rolesCount: number;
  clusterRolesCount: number;
  roleBindingsCount: number;
  clusterRoleBindingsCount: number;
  privilegedServiceAccounts: {
    name: string;
    namespace: string;
    clusterRolesBound: string[];
    hasWildcardPermissions: boolean;
    hasSecretsAccess: boolean;
  }[];
}
```

---

## 2. Pod Security Standards & Security Findings

Audits CoreV1 pod container `securityContext` specs against Pod Security Standards (Privileged, Baseline, Restricted):

| Rule ID | Rule Title | Severity | Security Risk |
| :--- | :--- | :--- | :--- |
| `K8S-RBAC-001` | Cluster-Admin Bound to ServiceAccount | `CRITICAL` | Excessive cluster-wide privilege / lateral movement |
| `K8S-SEC-001` | Privileged Container Execution | `CRITICAL` | Host root escape and container breakout |
| `K8S-SEC-002` | HostPath Volume Mount | `HIGH` | Node filesystem tampering / host access |
| `K8S-SEC-003` | Root User Execution (`runAsUser: 0`) | `HIGH` | Violation of non-root execution policy |
| `K8S-RES-002` | Missing Resource Limits | `MEDIUM` | Noisy-neighbor CPU/Memory exhaustion |

---

## 3. Kubernetes Governance Policies & CIS Benchmark

Continuous automated compliance evaluation against 4 core policy sets:

1. **`K8S-GOV-001: Disallow Privileged Containers`**: Validates `securityContext.privileged !== true` across all production workloads.
2. **`K8S-GOV-002: Enforce CPU & Memory Limits`**: Checks `spec.containers[].resources.limits` declarations.
3. **`K8S-GOV-003: Require Least-Privilege ServiceAccounts`**: Flags wildcard permissions and broad cluster-admin grants.
4. **`K8S-GOV-004: Require NetworkPolicy Namespace Isolation`**: Audits ingress/egress default-deny rules.
