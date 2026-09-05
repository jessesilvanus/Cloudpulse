# CLOUDPULSE — Kubernetes Security & Hardening Guide

## 1. Zero-Trust Pod Isolation (NetworkPolicies)

Every microservice in the `cloudpulse` namespace is protected by zero-trust Kubernetes NetworkPolicies:

1. **Default Deny Ingress**: All inbound connections across the namespace are blocked by default.
2. **Strict Ingress Filtering**:
   - `api-gateway` accepts traffic exclusively from the Ingress controller on port 4000.
   - `order-service` accepts traffic exclusively from `api-gateway` pods on port 4001.
   - `payment-service` accepts traffic exclusively from `order-service` pods on port 4002.
   - Telemetry stores accept traffic exclusively from within the namespace.

---

## 2. Pod Security Standards (Restricted)

The `cloudpulse` namespace enforces the Kubernetes `restricted` Pod Security Standard:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000 # (or 101 for Nginx)
  fsGroup: 1000
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
```

---

## 3. Least-Privilege RBAC

Workloads operate under the `cloudpulse-workloads` ServiceAccount:
- `automountServiceAccountToken: false` (Prevents automatic mounting of Kubernetes API tokens unless explicitly required).
- Restricted namespace-scoped `Role` with read-only permissions for config inspection.
- **Zero ClusterRoleBindings or cluster-admin access**.
