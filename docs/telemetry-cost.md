# CLOUDPULSE — Telemetry Cost Control & Sampling Strategies

## 1. Dynamic Trace Sampling

To avoid runaway telemetry storage costs while maintaining complete error visibility, CLOUDPULSE implements tail-based and probabilistic sampling:

| Environment | Success Sampling Rate | Error Sampling Rate | Estimated Volume |
| :--- | :---: | :---: | :---: |
| **Development** | `100%` (1.0) | `100%` (1.0) | $\approx 2.5 \text{ MB/hour}$ |
| **Staging** | `25%` (0.25) | `100%` (1.0) | $\approx 8.0 \text{ MB/hour}$ |
| **Production** | `5%` (0.05) | `100%` (1.0) | $\approx 48.5 \text{ MB/hour}$ |

---

## 2. Retention Policies
- **Prometheus TSDB**: 15 days high-resolution (15s scrape interval), 90 days aggregated.
- **Loki Structured Logs**: 14 days standard retention.
- **OTel Distributed Traces**: 7 days full waterfall retention.
