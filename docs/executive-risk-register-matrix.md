# CLOUDPULSE: Executive Risk Register & Probability × Impact Matrix

---

## 1. Enterprise Risk Matrix

| Risk ID | Title | Category | Probability | Impact | Score | Owner | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :---: |
| `risk-rds-unencrypted-snap` | Unencrypted Database Snapshots | `COMPLIANCE` | `MEDIUM` | `HIGH` | **78** | `database-admins@enterprise.io` | `OPEN` |
| `risk-k8s-root-container` | Kubernetes Container Running as Root | `SECURITY` | `LOW` | `HIGH` | **72** | `platform-team@enterprise.io` | `MITIGATING` |
| `risk-aurora-io-growth` | Aurora I/O Spend Accumulation | `COST` | `HIGH` | `LOW` | **54** | `finops-team@enterprise.io` | `OPEN` |

$$\text{Risk Score} = \text{Probability Score} \times \text{Impact Score} \times \text{Asset Criticality Multiplier}$$
