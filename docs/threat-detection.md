# CLOUDPULSE — Threat Detection Rules & Event Normalization

## 1. Detection Rule Catalog

| Rule ID | Rule Name | Target Source | Severity | Trigger Condition | Confidence |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **`rule-failed-auth-burst`** | Failed Authentication Burst | `iam` | `HIGH` | $>5$ failed logins within $300\text{s}$ from single IP. | **`HIGH`** |
| **`rule-privilege-escalation`** | Unauthorized Role Policy Edit | `cloud_audit` | `CRITICAL` | IAM policy attached with wildcard `*` permissions. | **`HIGH`** |
| **`rule-k8s-exec-container`** | Production Pod Exec Session | `k8s_audit` | `MEDIUM` | Interactive exec attached to production namespace pod. | **`HIGH`** |

---

## 2. Standardized Event Normalization
Every security event is normalized into `SecurityEvent` capturing timestamp, provider, account, region, source, eventType, severity, actor, resource, sourceIP, action, and allow/deny status without losing raw provider reference context.
