# CLOUDPULSE: Developer Self-Service, AI Platform Assistant & Tenancy Isolation

---

## 1. Developer Self-Service Capabilities

- **Service Creation**: Instantiate microservices using tested Golden Paths.
- **Environment Provisioning**: Request ephemeral development sandboxes and staging environments.
- **Deployments**: Trigger progressive rollouts with automated health verification.
- **Observability Glass Pane**: Directly inspect correlated logs in Loki, traces in Tempo, and golden signal metrics in Prometheus.
- **FinOps Visibility**: Review monthly cost forecasts and rightsizing recommendations.

---

## 2. AI Platform Assistant Capabilities & Safety Boundaries

- **Capabilities**: Translates natural language requirements into recommended templates, explains policy denials, and suggests SRE reliability improvements.
- **Safety Invariants**:
  - **NO Direct Provisioning**: Cannot bypass validation or approval gates.
  - **NO Fake Resources**: Grounded exclusively in verified catalog definitions.
  - **NO Autonomous Production Deletions**: High-risk changes require human approval via SOAR.
