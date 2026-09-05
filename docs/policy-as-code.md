# CLOUDPULSE — Policy-as-Code & Guardrails

## 1. Machine-Readable Policy Catalog

```json
[
  {
    "id": "pol-no-wildcard-iam",
    "name": "Disallow Wildcard IAM Policies",
    "severity": "critical",
    "effect": "DENY",
    "resourceTypes": ["iam_policy", "governance_role"],
    "condition": "Action contains '*' and Principal is not EmergencyBreakGlass"
  },
  {
    "id": "pol-no-public-storage",
    "name": "Enforce Private Cloud Storage",
    "severity": "critical",
    "effect": "DENY",
    "resourceTypes": ["storage_bucket"],
    "condition": "BucketPolicy contains Principal: '*' or PublicAccessBlock is disabled"
  },
  {
    "id": "pol-non-root-container",
    "name": "Enforce Non-Root Container Execution",
    "severity": "high",
    "effect": "DENY",
    "resourceTypes": ["kubernetes_deployment", "kubernetes_pod"],
    "condition": "SecurityContext runAsNonRoot != true or runAsUser == 0"
  },
  {
    "id": "pol-ebs-kms-encryption",
    "name": "Enforce KMS Storage Encryption",
    "severity": "high",
    "effect": "DENY",
    "resourceTypes": ["ebs_volume"],
    "condition": "Encrypted != true"
  }
]
```

---

## 2. Policy Simulation Engine
Evaluates:
$$\text{PolicyEvaluation}(\text{Identity}, \text{Resource}, \text{Action}, \text{Context}) \longrightarrow \{\text{ALLOW}, \text{DENY}\}$$
With explicit matching policy metadata and evidence logging.
