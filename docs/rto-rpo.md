# CLOUDPULSE — Recovery Time & Point Objectives (RTO / RPO)

## 1. Mathematical Definitions
- **Recovery Time Objective (RTO)**: Maximum acceptable duration from failure detection until service traffic is fully restored.
  $$\text{Observed RTO} = T_{\text{Restored}} - T_{\text{Failure Detected}}$$
- **Recovery Point Objective (RPO)**: Maximum acceptable duration of transactional data loss.
  $$\text{Observed RPO} = T_{\text{Failure Timestamp}} - T_{\text{Latest Recovered State}}$$

---

## 2. Component RTO & RPO Specifications

| Component | Tier | Target RTO | Observed RTO | Target RPO | Observed RPO | Status | Classification |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`api-gateway`** | Tier 0 | 30s | **8.4s** | 0s | **0s** | `PASS` | `TESTED` |
| **`order-service`** | Tier 0 | 45s | **11.2s** | 0s | **0s** | `PASS` | `TESTED` |
| **`payment-service`** | Tier 0 | 45s | **12.6s** | 0s | **0s** | `PASS` | `TESTED` |
| **`telemetry-engine`** | Tier 1 | 120s | **18.5s** | 60s | **4.2s** | `PASS` | `TESTED` |
