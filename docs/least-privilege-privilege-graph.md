# CLOUDPULSE: Least Privilege Analysis & Privilege Graphs

---

## 1. Least Privilege Findings

| Finding ID | Role Target | Finding Type | Severity | Unused Perms % | Remediation Recommendation |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `find-iam-01` | `Role-Admin` | `WILDCARD_PERMISSION` | **HIGH** | $45.0\%$ | Replace wildcard Action `*` with scoped resource-specific IAM actions. |
| `find-iam-02` | `Role-Developer` | `UNUSED_PERMISSION` | **LOW** | $12.5\%$ | Remove unused permission `cloudwatch:PutMetricData` (not exercised in 90 days). |

---

## 2. Privilege Escalation Path Detection

- Identifies indirect role assumption chains (e.g., `Developer` $\rightarrow$ `AssumeRole` $\rightarrow$ `Operator` $\rightarrow$ `Production Mutations`) and flags unmonitored transition paths.
