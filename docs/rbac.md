# CLOUDPULSE — Role-Based Access Control (RBAC) Architecture

## 1. Application RBAC Matrix

CLOUDPULSE implements a hierarchical 3-tier role authorization model:

| Capability / API Scope | Viewer (`viewer`) | Operator (`operator`) | Admin (`admin`) |
| :--- | :---: | :---: | :---: |
| **View Dashboards, Metrics, Logs & Traces** | ✅ | ✅ | ✅ |
| **View Services, Health, and SLO Status** | ✅ | ✅ | ✅ |
| **View Alerts & Incidents** | ✅ | ✅ | ✅ |
| **View Security Posture & Findings** | ✅ | ✅ | ✅ |
| **Acknowledge Alerts & Update Incidents** | ❌ | ✅ | ✅ |
| **Execute Safe Automated Remediations** | ❌ | ✅ | ✅ |
| **Update Security Findings Status** | ❌ | ✅ | ✅ |
| **Modify Alert Policies & Simulation Mode** | ❌ | ❌ | ✅ |
| **Manage Users, Roles & Security Settings** | ❌ | ❌ | ✅ |

---

## 2. Kubernetes Workload RBAC

Workloads operate under the dedicated `cloudpulse-workloads` ServiceAccount:
- `automountServiceAccountToken: false` prevents accidental token exposure inside container filesystems.
- Scoped strictly to read-only `Role` for pod/configmap inspection in the `cloudpulse` namespace.
- **Zero ClusterRoles or cluster-admin bindings**.
