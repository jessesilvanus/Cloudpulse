# CLOUDPULSE: Multi-Cloud Resilience Scorecard & Heatmap

---

## 1. Resilience Scoring Formulation

$$\text{Resilience Score} = 0.25 \cdot R_{\text{redundancy}} + 0.25 \cdot B_{\text{backup}} + 0.25 \cdot D_{\text{drills}} + 0.25 \cdot O_{\text{rto\_rpo}}$$

- Overall Resilience Score: **`95.5 / 100`**

---

## 2. Service Resilience Heatmap

| Service Name | Criticality | Resilience Score | SPOF Count | Target RTO | Actual RTO | Target RPO | Actual RPO | Last Drill |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `api-gateway` | **`CRITICAL`** | **`96.0`** | 1 (NAT GW) | $5\text{m}$ | **`2.5m`** | $0\text{m}$ | **`0m`** | **`PASSED`** |
| `order-service` | **`CRITICAL`** | **`95.0`** | 0 | $10\text{m}$ | **`4.8m`** | $1\text{m}$ | **`0.2m`** | **`PASSED`** |
| `payment-service` | **`CRITICAL`** | **`95.5`** | 0 | $15\text{m}$ | **`6.2m`** | $0\text{m}$ | **`0m`** | **`PASSED`** |
