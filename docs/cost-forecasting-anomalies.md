# CLOUDPULSE: Spend Forecasting, Trend Models & Anomaly Detection

---

## 1. Predictive Spend Forecasting Models

The platform evaluates ARIMA(1,1,1) time-series forecasting models with seasonal 7-day rolling baselines:

| Service | Current Monthly Spend | 30-Day Forecast | Projected Trend | Confidence Level |
| :--- | :---: | :---: | :---: | :---: |
| `api-gateway` | $\$210.50$ | **`$222.00`** | $+5.4\%$ | **`HIGH`** |
| `order-service` | $\$256.50$ | **`$271.00`** | $+5.6\%$ | **`HIGH`** |
| `payment-service` | $\$155.00$ | **`$165.00`** | $+6.4\%$ | **`HIGH`** |

---

## 2. Statistical Cost Anomaly Detection

$$\text{Variance \%} = \frac{\text{Actual Spend} - \text{Expected Spend}}{\text{Expected Spend}} \times 100\%$$

- **Detected Anomaly (`anom-001`)**:
  - *Service*: `order-service`
  - *Baseline Expected*: $\$6.20 / \text{day}$
  - *Actual Spend Observed*: $\$14.80 / \text{day}$ ($+138.7\%$ spike)
  - *Severity*: **`MEDIUM`** (Status: `INVESTIGATING`)
  - *Root Cause Explanation*: Automated chaos resilience drill triggered elevated cross-AZ snapshot data replication.
