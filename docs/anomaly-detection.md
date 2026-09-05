# CLOUDPULSE — Statistical Anomaly Detection & False-Positive Gating

## 1. Rolling Baseline Mathematical Model

CLOUDPULSE evaluates time-series telemetry using a 30-day historical rolling baseline:

$$\mu_t = \alpha x_t + (1 - \alpha) \mu_{t-1}, \quad \sigma_t^2 = \alpha (x_t - \mu_t)^2 + (1 - \alpha) \sigma_{t-1}^2$$

The Z-score standard deviation metric is calculated:
$$Z = \frac{|x_t - \mu_t|}{\sigma_t}$$

### Anomaly Severity Classification:
- **CRITICAL**: $Z \ge 4.0$ or $>100\%$ deviation from nominal threshold (e.g. DB connection pool starvation).
- **HIGH**: $3.0 \le Z < 4.0$ or $>50\%$ deviation (e.g. P99 latency breach).
- **MEDIUM**: $2.0 \le Z < 3.0$ or resource threshold crossing ($>80\%$).
- **LOW**: $1.5 \le Z < 2.0$ (transient fluctuation).

---

## 2. False-Positive Mitigation & Alert Cooldown
- **Hysteresis & Minimum Duration**: Anomalies must persist for at least 3 consecutive sampling intervals before triggering SRE notifications.
- **Deduplication Window**: Multiple anomalies sharing identical service tags within a 15-minute window are consolidated into a single unified incident.
