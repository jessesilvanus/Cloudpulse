# CLOUDPULSE — Comprehensive Security Architecture

## 1. Defense-in-Depth Control Plane

CLOUDPULSE layers security controls across every level of the application stack:

```mermaid
flowchart TD
    Edge["Edge Network Layer (TLS 1.3, ALB Security Groups, WAF)"]
    K8sNet["Kubernetes Network Isolation (Calico Default-Deny NetworkPolicies)"]
    Container["Container Hardening (USER node/101, drop ALL capabilities, read-only FS)"]
    AuthLayer["Identity & Access Layer (RBAC, OIDC Token Validation, JWT)"]
    PolicyLayer["Policy-as-Code Guardrails (Zero-Trust Evaluation Engine)"]
    AuditLayer["Audit & Forensics Layer (Append-Only Immutable Event Log)"]

    Edge --> K8sNet --> Container --> AuthLayer --> PolicyLayer --> AuditLayer
```

---

## 2. Workload Identities & Non-Root Execution
All containers enforce:
- Non-root user execution (`USER node` in Node.js, `USER 101` in Nginx).
- Read-only root filesystems where applicable.
- `allowPrivilegeEscalation: false`.
- Dropped Linux capabilities (`drop: ["ALL"]`).
