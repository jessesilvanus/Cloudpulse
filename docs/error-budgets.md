# CLOUDPULSE — Error Budgets & Multi-Window Burn Rates

## 1. Error Budget Formula

The Error Budget represents the total allowable unreliability during an SLO rolling window (30 days):

$$\text{Error Budget} = 1 - \text{SLO Target}$$

For a `99.9%` Availability SLO:
$$\text{Error Budget} = 1 - 0.999 = 0.001 \quad (0.1\%)$$

In minutes over a 30-day window ($30 \times 24 \times 60 = 43,200\text{ minutes}$):
$$\text{Budget in Minutes} = 43,200 \times 0.001 = 43.2\text{ minutes of allowable downtime}$$

---

## 2. Multi-Window Burn Rate Calculations

Burn rate is the multiplier of the rate at which the error budget is being consumed relative to the allowed budget rate:

$$\text{Burn Rate} = \frac{\text{Observed Error Rate}}{\text{Allowed Error Rate Budget}}$$

### Multi-Window Burn Rate Alerting Matrix:

| Severity | Short Window (5m) | Long Window (1h) | Budget Consumed in Period | Paging Action |
| :--- | :---: | :---: | :---: | :--- |
| **CRITICAL (Page)** | **14.4x** | **14.4x** | 2% in 1 hour | Immediate SEV1 Page (On-call) |
| **HIGH (Ticket)** | **6.0x** | **6.0x** | 5% in 6 hours | Warning ticket / Slack alert |
| **MEDIUM (Log)** | **1.0x** | **1.0x** | 10% in 3 days | Daily SRE review |
