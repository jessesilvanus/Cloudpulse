# CLOUDPULSE: Error Budget Management & Burn Rate Alerting

---

## 1. Error Budget Mathematical Formulation

The total error budget is the allowable unreliability over a 30-day rolling window:

$$\text{Total Error Budget} = 100\% - \text{SLO Target}$$
$$\text{Consumed Budget} = \frac{100\% - \text{Observed SLI}}{\text{Total Error Budget}} \times 100\%$$
$$\text{Remaining Error Budget} = 100\% - \text{Consumed Budget}$$

---

## 2. Multi-Window Burn Rate Calculations

Burn rate represents the rate at which the error budget is being consumed relative to the allowable rate ($1.0 = \text{exhausts 100\% budget in exactly 30 days}$):

$$\text{Burn Rate} = \frac{\text{Error Rate Observed}}{\text{Allowable Error Rate}}$$

### Burn Alert Thresholds

| Alert Level | Burn Rate Factor | 30-Day Budget Consumed In | Action Triggered |
| :---: | :---: | :---: | :--- |
| **`SLOW_BURN`** | $2.0\times - 5.0\times$ | $6 - 15\text{ days}$ | Slack notification to service team during working hours. |
| **`FAST_BURN`** | $5.0\times - 14.4\times$ | $2 - 6\text{ days}$ | Page on-call primary SRE engineer; initiate investigation. |
| **`CRITICAL_BURN`** | $> 14.4\times$ | $< 48\text{ hours}$ | Page incident commander; auto-trigger deployment freeze. |

---

## 3. Reliability Gates for CI/CD

| Decision | Policy Condition | Deployment Action |
| :---: | :--- | :--- |
| **`PASS`** | Remaining budget $> 20\%$ AND burn rate $\le 1.0$ | Automated deployment proceeds seamlessly. |
| **`WARN`** | Remaining budget $5\% - 20\%$ OR active `SLOW_BURN` | Deployment continues with explicit SRE team warning notification. |
| **`BLOCK`** | Remaining budget $< 5\%$ OR active `CRITICAL_BURN` | Deployment blocked until error budget recovers above threshold. |
