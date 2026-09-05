# CLOUDPULSE — Compliance & Security Controls Mapping

## 1. Mapped Frameworks

CLOUDPULSE maps its implemented technical controls to industry standards:

| Framework | Control ID | Title | Status | Implemented Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **CIS Kubernetes** | `5.2.6` | Minimize the admission of root containers | `Compliant` | `USER node` / `USER 101` across all Dockerfiles and Pod specs. |
| **CIS Kubernetes** | `5.3.2` | Ensure Namespaces have Network Policies | `Compliant` | Default-deny NetworkPolicy in `deploy/kubernetes/networkpolicies.yaml`. |
| **CIS AWS Foundations** | `1.16` | IAM policies attached only to roles | `Compliant` | Dedicated least-privilege IAM roles for ECS, EKS, and OIDC. |
| **OWASP Top 10** | `A01:2021`| Broken Access Control | `Compliant` | Hierarchical RBAC middleware (`viewer` $\le$ `operator` $\le$ `admin`). |
| **OWASP Top 10** | `A02:2021`| Cryptographic Failures | `Compliant` | TLS 1.3 on ALB; zero plaintext secrets in Git repository. |
| **OWASP Top 10** | `A09:2021`| Security Logging and Monitoring Failures | `Compliant` | Immutable Security Audit Log capturing all auth and permission events. |
