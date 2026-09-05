# CLOUDPULSE — Threat Model & Attack Vector Analysis

## 1. Threat Matrix

| Threat Category | Attack Vector | Potential Impact | Likelihood | Implemented Mitigation |
| :--- | :--- | :--- | :---: | :--- |
| **Credential Leakage** | Hardcoding AWS keys or tokens in Git repository | Full cloud environment compromise | Low | Static AST secret scan + TruffleHog in CI + AWS OIDC. |
| **Privilege Escalation** | Low-privilege user calling administrative remediation APIs | Unauthorized cluster restart or state change | Medium | Hierarchical RBAC middleware (`requireRole('operator'/'admin')`). |
| **Container Breakout** | Exploiting application vulnerability to gain host root access | Host node compromise | Low | Non-root execution (`USER node`), dropped Linux capabilities (`drop: ALL`), read-only root filesystems. |
| **Lateral Movement** | Attacker pivoting from compromised frontend to internal payment service | Unauthorized internal data access | Medium | Zero-trust Kubernetes NetworkPolicies (Default-deny ingress). |
| **Denial of Service** | Resource starvation via high request bursts | System unresponsiveness | Medium | CPU/Memory requests & limits, express request limits, and HPA auto-scaling. |
| **Supply Chain Vulnerability** | Malicious upstream npm package or container image | Code injection | Medium | `pnpm install --frozen-lockfile`, `pnpm audit`, and Trivy container scanning in CI. |
