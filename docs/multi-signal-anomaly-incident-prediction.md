# CLOUDPULSE: Multi-Signal Anomaly Detection & Incident Prediction

---

## 1. Multi-Signal Anomaly Situations

- **Situation 01**: `api-gateway` P99 latency shifted from baseline $45.0\text{ms}$ to $64.1\text{ms}$ ($+42.4\%$ deviation) due to upstream checkout ingress bursts.
- **Situation 02**: `payment-service` working set memory reached $83.2\%$ ($+28.0\%$ deviation) correlated with retry buffer accumulation and 1 CrashLoopBackOff pod.

---

## 2. Incident Probability Prediction

$$\text{Risk}(\text{payment-service}) = 68.5\% \text{ Probability of Reliability Incident over next 6 hours}$$

- **Contributing Signals**:
  1. Payment P99 latency increased by $42.4\%$
  2. Container memory at $83.2\%$ (cgroup threshold $90\%$)
  3. Downstream API gateway retry rate $+15\%$
- **Recommended Action**: Scale `payment-service` to 4 replicas and increase container memory limit by 512Mi.
