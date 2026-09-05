# CLOUDPULSE — Governance Risk Management & Exceptions

## 1. Governance Risk Scoring

$$\text{Governance Risk Score} = \sum_{\text{findings}} \left(\text{Finding Severity Multiplier} \times \text{Asset Exposure} \times (1 - \text{Mitigation Factor})\right)$$

- **`CRITICAL` (0)**: Zero active critical findings.
- **`HIGH` (1)**: Single planned remediation on legacy CI bot.
- **`MEDIUM` (2)**: Non-blocking tag variances.
- **`LOW` (4)**: Minor informational notices.

---

## 2. Policy Exceptions Governance
- All exceptions require explicit business justification, owner designation, and strict expiration dates ($<90\text{d}$).
- Zero permanent or anonymous exceptions permitted.
