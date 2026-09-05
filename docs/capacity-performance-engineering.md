# CLOUDPULSE: Capacity Planning & Performance Engineering

---

## 1. Capacity Headroom Formulation

$$\text{CPU Headroom} = 100\% - \text{CPU Utilization}$$
$$\text{Memory Headroom} = 100\% - \text{Memory Utilization}$$

### Observed Workload Headroom

| Service | CPU Util | Memory Util | CPU Headroom | Memory Headroom | 7-Day Forecast | Risk State |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `api-gateway` | $24.5\%$ | $38.2\%$ | **`75.5%`** | **`61.8%`** | $28.0\%$ | **`HEALTHY`** |
| `order-service` | $32.1\%$ | $44.6\%$ | **`67.9%`** | **`55.4%`** | $36.5\%$ | **`HEALTHY`** |
| `payment-service` | $18.7\%$ | $29.4\%$ | **`81.3%`** | **`70.6%`** | $21.0\%$ | **`HEALTHY`** |

---

## 2. Multi-Quantile Latency Percentile Distribution

- **P50**: Median user experience ($< 15\text{ms}$)
- **P75**: 75th percentile latency ($< 25\text{ms}$)
- **P90**: 90th percentile latency ($< 35\text{ms}$)
- **P95**: Baseline SLO target ($42.5\text{ms}$, SLA target $< 150\text{ms}$)
- **P99**: Tail latency ($< 85\text{ms}$)
