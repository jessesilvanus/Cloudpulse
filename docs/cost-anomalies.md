# CLOUDPULSE — Cost Anomaly Detection & Budget Alerts

## 1. Statistical Cost Anomaly Detection

CLOUDPULSE utilizes a transparent 30-day statistical moving baseline:

$$\mu = \frac{1}{N} \sum_{i=1}^N \text{Cost}_i, \quad \sigma = \sqrt{\frac{1}{N} \sum_{i=1}^N (\text{Cost}_i - \mu)^2}$$

An anomaly is flagged when:
$$\text{Observed Daily Cost} > \mu + 2.5\sigma \quad \text{or} \quad \frac{\text{Observed} - \mu}{\mu} > 25\%$$

---

## 2. Multi-Threshold Budget Alerts

| Threshold | Severity | Action |
| :--- | :--- | :--- |
| **50% Consumed** | `INFO` | Mid-cycle pacing notification. |
| **80% Consumed** | `WARNING` | SRE review ticket generated. |
| **95% Consumed** | `CRITICAL` | On-call paging alert & scale-up hold recommendation. |
| **> 100% Consumed** | `BREACHED` | Engineering leadership escalation. |

---

## 3. Cost Anomaly Root Cause Analysis & Incidents
- **Signal Correlation**: Anomalies automatically correlate with recent Git deployments, horizontal pod autoscaling spikes, and cross-AZ data transfer bursts.
- **Cost Incidents**: Severe anomalies ($>100\%$ deviation or unexpected spend $> \$100/\text{day}$) automatically create a tracked FinOps Cost Incident for structured remediation.

