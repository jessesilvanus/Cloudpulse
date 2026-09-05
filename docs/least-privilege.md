# CLOUDPULSE — Least Privilege & Permission Utilization Analysis

## 1. Permission Utilization Mathematical Formula

$$\text{Excessive Permissions Ratio} = \frac{P_{\text{granted}} - P_{\text{used}}}{P_{\text{granted}}}$$

### Risk Tiers:
- **`CRITICAL`**: Ratio $> 0.70$ (e.g. `legacy-ci-bot` with 32 granted vs 2 used $\rightarrow 94\%$ excess).
- **`MEDIUM`**: $0.40 \le \text{Ratio} \le 0.70$.
- **`LOW`**: Ratio $< 0.40$ (e.g. `payment-service-sa` with 6 granted vs 5 used $\rightarrow 16\%$ excess).

---

## 2. Wildcard Detection
- Flags IAM actions containing `*` on data-plane and control-plane services.
- Recommends explicit granular action replacement (e.g. `s3:*` $\longrightarrow$ `s3:GetObject`, `s3:PutObject`).
