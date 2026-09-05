# CLOUDPULSE — Remediation Workflows & Approval Gates

## 1. Safe Remediation Model

1. **Default Mode**: `RECOMMEND ONLY` — prevents accidental service outages or unapproved changes.
2. **Approval Gating**: Potentially disruptive actions (`IAM_CHANGE`, `TERRAFORM_CHANGE`, `KUBERNETES_CHANGE`) require explicit approval from an authenticated Operator or Admin.
3. **Verification**: After remediation execution, the policy is re-evaluated to confirm state transition ($\text{FAIL} \rightarrow \text{CHANGE} \rightarrow \text{PASS}$).
