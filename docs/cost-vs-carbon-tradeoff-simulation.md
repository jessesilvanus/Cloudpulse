# CLOUDPULSE: Cost vs. Carbon Tradeoff Simulation & What-If Scenarios

---

## 1. What-If GreenOps Simulation Engine

$$\text{Scenario}(\Delta\text{Traffic}, \text{Region}) \implies \begin{cases} \Delta\text{Spend (\$)} \\ \Delta\text{CO}_2\text{e (\%)} \\ \Delta\text{Latency (ms)} \end{cases}$$

---

## 2. Multi-Cloud GreenOps Tradeoff Example

- **Scenario**: 1.5x traffic surge + migration of batch processing to `eu-west-1` (Ireland).
- **Simulated Tradeoff**:
  - **Estimated Spend Delta**: $+\$245.00/\text{month}$
  - **Estimated Carbon Impact**: **`-24.5% CO2e`** (due to $82\%$ clean energy grid in Ireland)
  - **Estimated Network Latency**: $+18\text{ms}$ (Transatlantic RTT)
  - **Classification**: `SIMULATED`
