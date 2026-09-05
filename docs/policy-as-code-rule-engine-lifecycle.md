# CLOUDPULSE: Policy-as-Code Rule Engine & Enforcement Lifecycle

---

## 1. Declarative Policy Evaluation

$$\text{Policy}(\text{Resource}) \implies \begin{cases} \text{PASS}, & \text{Rule criteria satisfied} \\ \text{FAIL (BLOCK)}, & \text{Enforcement mode: BLOCKING} \\ \text{WARNING}, & \text{Enforcement mode: AUDIT} \end{cases}$$

- **`pol-mandatory-kms-encryption`**: Evaluates `resource.encryption.kmsKeyId != null` (BLOCKING).
- **`pol-iam-mfa-required`**: Evaluates `identity.mfaActive == true` for privileged roles (BLOCKING).
- **`pol-k8s-non-root`**: Evaluates `pod.spec.securityContext.runAsNonRoot == true` (AUDIT).
