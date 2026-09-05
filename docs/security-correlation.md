# CLOUDPULSE — Security Correlation & Attack Path Graph

## 1. Multi-Signal Security Sequence Correlation

CLOUDPULSE groups individual security events across time and entity boundaries into structured attack sequences:

```mermaid
graph LR
    FailedAuth["1. FAILED_AUTH (198.51.100.24)"] --> RoleProbe["2. STS AssumeRole Probe"]
    RoleProbe --> WafBlock["3. AWS WAF Rate-Limit Throttle"]
    WafBlock --> Incident["4. SOC Incident Created (sinc-001)"]
```

---

## 2. Risk Score Formulation

$$\text{Risk Score} = \text{Base Severity} \times \text{Detection Confidence} \times \text{Asset Criticality Multiplier}$$

- **`HIGH CONFIDENCE`**: Deterministic rule match on corroborated audit logs.
- **`MEDIUM CONFIDENCE`**: Statistical anomaly matching baseline deviation.
- **`LOW CONFIDENCE`**: Isolated uncorroborated event.
