# CLOUDPULSE: Time-Series Forecasting & Predictive Capacity Planning

---

## 1. Forecasting Horizons & Bounds

$$\hat{y}(t+h) \pm z_{\alpha/2} \cdot \hat{\sigma}_h \implies [P_{lower}, P_{upper}]$$

| Forecast Target | Entity Scope | Current Value | Horizon | Predicted Value | Confidence Interval | Confidence % | Risk Level |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `CPU_UTILIZATION` | `api-gateway` | $42.5\%$ | $+6\text{h}$ | $64.0\%$ | $[58.0\%, 72.0\%]$ | $88.5\%$ | `MEDIUM` |
| `CPU_UTILIZATION` | `api-gateway` | $42.5\%$ | $+24\text{h}$ | $78.5\%$ | $[70.0\%, 86.0\%]$ | $82.0\%$ | `HIGH` |
| `MEMORY_UTILIZATION` | `order-service` | $58.0\%$ | $+6\text{h}$ | $66.5\%$ | $[62.0\%, 71.0\%]$ | $91.0\%$ | `LOW` |
| `STORAGE_EXHAUSTION` | `order-db-primary-volume` | $72.0\%$ | $+72\text{h}$ | $92.5\%$ | $[88.0\%, 96.0\%]$ | $86.0\%$ | `HIGH` |

---

## 2. Predictive Capacity Exhaustion

$$\text{Time to Threshold} = \frac{\text{Threshold} - \text{Current Utilization}}{\text{Daily Growth Rate}}$$

- `order-db-primary-volume`: Reaching $90\%$ saturation in **`18.4 hours`** (Recommendation: Expand EBS volume to 1TB).
- `eks-prod-us-east-1-nodepool`: Stable compute capacity with $> 30\text{ days}$ headroom.
