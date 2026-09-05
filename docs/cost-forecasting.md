# CLOUDPULSE — Cloud Cost Forecasting & Pacing Models

## 1. Run-Rate Extrapolation Model

CLOUDPULSE extrapolates month-end projected cloud spend based on calendar progression and weighted moving averages:

$$\text{Projected Spend}_{\text{MonthEnd}} = \text{Spend}_{\text{Current}} + \left( \frac{\text{Spend}_{\text{Current}}}{\text{Elapsed Days}} \times \text{Remaining Days} \right)$$

---

## 2. Confidence Bands & Data Sufficiency
- **`HIGH CONFIDENCE`**: $>14$ days of continuous daily billing telemetry.
- **`MEDIUM CONFIDENCE`**: $5 - 14$ days of billing telemetry.
- **`INSUFFICIENT DATA`**: $<5$ days of billing telemetry (labels limitations explicitly).
