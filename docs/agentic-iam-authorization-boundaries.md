# CLOUDPULSE: Agentic IAM Authorization Boundaries & Safety Gates

---

## 1. AI Agent Permission Boundaries

- Autonomous AI agents operate under dedicated service identities with explicit permission boundaries:
  - **Permitted Actions**: Read telemetry (`metrics:get`, `traces:get`), query service mesh topology, inspect Kubernetes pod failure reasons.
  - **Strictly Prohibited Actions**: Deleting production databases, modifying IAM roles directly, or altering production traffic routes without human operator sign-off.
- All recommended remediations must be reviewed and approved by human operators with Separation of Duties.
