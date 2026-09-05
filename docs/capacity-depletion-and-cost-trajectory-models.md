# Capacity Depletion & Cost Trajectory Models

## Mathematical Formulations

### 1. Linear Trend Extrapolation (Storage Capacity)
\[
\text{Storage}(t) = \text{Storage}_0 - r \cdot t
\]
Where $r = 1.8\text{ GB/day}$ derived via Ordinary Least Squares ($R^2 = 0.94$):
\[
t_{\text{breach}} = \frac{45.0\text{ GB} - 10.0\text{ GB}}{1.8\text{ GB/day}} \approx 19.4\text{ days}
\]

### 2. Holt-Winters Double Exponential Smoothing (Cost Forecasting)
\[
L_t = \alpha Y_t + (1 - \alpha)(L_{t-1} + b_{t-1})
\]
\[
b_t = \beta (L_t - L_{t-1}) + (1 - \beta)b_{t-1}
\]
\[
F_{t+k} = L_t + k \cdot b_t
\]
Evaluated with $\alpha = 0.2$, $\beta = 0.1$, yielding $\$210.00/\text{mo}$ projected spend (95% CI: $\$198.50 - \$221.50$).
