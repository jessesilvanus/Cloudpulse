# CLOUDPULSE — Capacity & Resource Forecasting

## 1. Multi-Horizon Forecasting Model

CLOUDPULSE forecasts compute and memory growth over multiple operational horizons:

$$\hat{y}_{t+h} = \beta_0 + \beta_1 (t + h) + S(t + h)$$

Where:
- $\beta_0, \beta_1$ are linear trend coefficients derived from historical 7-day rolling telemetry.
- $S(t)$ represents cyclic hourly traffic seasonality.

---

## 2. Confidence Bands ($95\%$ Confidence Interval)

$$\text{Upper Band} = \hat{y}_{t+h} + 1.96 \cdot \sigma_e \sqrt{1 + \frac{1}{N} + \frac{(t+h - \bar{t})^2}{\sum (t_i - \bar{t})^2}}$$
$$\text{Lower Band} = \hat{y}_{t+h} - 1.96 \cdot \sigma_e \sqrt{1 + \frac{1}{N} + \frac{(t+h - \bar{t})^2}{\sum (t_i - \bar{t})^2}}$$

### Supported Time Horizons:
1. **1 Hour**: Short-term burst prediction for reactive HPA scale-out.
2. **6 Hours**: Workday peak load preparation.
3. **24 Hours**: Daily resource saturation risk detection.
4. **7 Days**: Infrastructure capacity planning and Spot node allocation.
