# CLOUDPULSE: Evidence-Based Change Correlation & Incident Linking

---

## 1. Correlation Principles

- **No False Causality**: Clearly distinguish `LIKELY_RELATED`, `CORRELATED`, `POSSIBLE_CONTRIBUTOR`, and `EVIDENCE_INSUFFICIENT`.
- **Temporal & Resource Adjacency**: Group mutations occurring within a 15–45 minute window affecting related resources in the AWS topology graph.

---

## 2. Active Change Correlation Chains

- **Chain `corr-sg-drift-001`**:
  - *Trigger*: `AuthorizeSecurityGroupIngress` by `sarah.connor` (Port 22 $\rightarrow$ 0.0.0.0/0).
  - *Downstream*: Inbound connection attempt surge on edge ALB ingress.
  - *Relationship*: `LIKELY_RELATED` (Confidence: 98.5%).
- **Chain `corr-lambda-deploy-002`**:
  - *Trigger*: `UpdateFunctionConfiguration` by `ci-deployer` (Memory: 256MB $\rightarrow$ 512MB).
  - *Downstream*: Execution duration reduction (45ms avg) and slight cost increase.
  - *Relationship*: `CORRELATED` (Confidence: 99.0%).
