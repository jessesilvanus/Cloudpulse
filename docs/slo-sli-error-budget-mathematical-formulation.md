# SLO, SLI & Error Budget Mathematical Formulation (Phase 63)

## 1. Service Level Indicators (SLI)

An **SLI** is a quantifiable metric that represents service behavior over a specific measurement window \(W\).

### 1.1 Availability SLI (Request-Based)
For a service processing discrete requests:
$$\text{SLI}_{\text{avail}} = \frac{\sum \text{Good Requests (HTTP status } < 500\text{)}}{\sum \text{Total Valid Requests}} \times 100\%$$

### 1.2 Latency SLI (Percentile-Based)
For request duration thresholds (e.g. \(T_{\text{threshold}} = 200\text{ms}\)):
$$\text{SLI}_{\text{lat}} = \frac{\sum \text{Requests where Latency} \le T_{\text{threshold}}}{\sum \text{Total Valid Requests}} \times 100\%$$

### 1.3 Quality & Saturation SLI
$$\text{SLI}_{\text{quality}} = \frac{\sum \text{Requests served without degraded/fallback payload}}{\sum \text{Total Valid Requests}} \times 100\%$$

---

## 2. Service Level Objectives (SLO) & Error Budgets

### 2.1 SLO Target Attainment
An SLO specifies an objective target percentage \(T_{\text{target}}\) (e.g., \(99.9\%\)) over a rolling time window \(W\) (e.g., 30 days):
$$\text{Attainment} = \text{SLI}_{\text{observed}}(W)$$
$$\text{SLO State} = \begin{cases} 
\text{ACHIEVING} & \text{if } \text{Attainment} \ge T_{\text{target}} \\
\text{AT\_RISK} & \text{if } T_{\text{target}} - \delta \le \text{Attainment} < T_{\text{target}} \\
\text{BREACHED} & \text{if } \text{Attainment} < T_{\text{target}} - \delta \\
\text{INSUFFICIENT\_DATA} & \text{if Telemetry Coverage} < 50\%
\end{cases}$$

### 2.2 Total & Remaining Error Budget
The total allowed error budget fraction is:
$$B_{\text{total}} = 1.0 - \frac{T_{\text{target}}}{100}$$

For a 30-day window with \(T_{\text{target}} = 99.9\%\), \(B_{\text{total}} = 0.001\) (or \(0.1\%\) bad events).

The consumed budget fraction is:
$$B_{\text{consumed}} = 1.0 - \frac{\text{Attainment}}{100}$$

The remaining error budget percentage is:
$$B_{\text{remaining}}\% = \max\left(0, \frac{B_{\text{total}} - B_{\text{consumed}}}{B_{\text{total}}} \times 100\%\right)$$

---

## 3. Multi-Window Error Budget Burn Rate

### 3.1 Mathematical Definition of Burn Rate
A **Burn Rate of \(1.0\times\)** means the error budget will be depleted in exactly the full SLO window period (e.g., exactly 30 days / 720 hours).

$$\text{Burn Rate } R_{\text{burn}}(w) = \frac{\text{Bad Rate in window } w}{B_{\text{total}}} = \frac{1.0 - \frac{\text{SLI}(w)}{100}}{1.0 - \frac{T_{\text{target}}}{100}}$$

### 3.2 Multi-Window Multi-Burn-Rate Alerting
To prevent both alert fatigue and delayed detection, CLOUDPULSE evaluates burn rates across multiple rolling windows simultaneously:

| Window Size | Burn Rate Threshold | Budget Consumed | Time to 100% Depletion | Alert Severity |
| :--- | :--- | :--- | :--- | :--- |
| **1 Hour** | $\ge 14.4\times$ | $2.0\%$ in 1h | 50 Hours | `CRITICAL` (PagerDuty/On-Call) |
| **6 Hours** | $\ge 6.0\times$ | $5.0\%$ in 6h | 120 Hours | `HIGH` (Incident Ticket) |
| **24 Hours** | $\ge 3.0\times$ | $10.0\%$ in 24h | 240 Hours (10 Days) | `MEDIUM` (Team Warning) |
| **3 Days (72h)** | $\ge 1.0\times$ | $10.0\%$ in 72h | 720 Hours (30 Days) | `LOW` (SRE Review) |

### 3.3 Forecasted Time to Exhaustion
$$\text{Hours to Exhaustion} = \frac{B_{\text{remaining}}\%}{100\%} \times \frac{W_{\text{total hours}}}{R_{\text{burn}}(24\text{h})}$$

---

## 4. Multi-Dimensional Explainable Reliability Score (0–100)

CLOUDPULSE calculates an 8-dimensional composite reliability score for each service:

$$S_{\text{overall}} = \sum_{i=1}^{8} w_i \cdot s_i - P_{\text{truth}}$$

| Dimension | Weight ($w_i$) | Description |
| :--- | :--- | :--- |
| **1. SLO Attainment** | $0.25$ | Percentage of active SLOs meeting targets |
| **2. Error Rate Health** | $0.15$ | Ratio of successful requests vs target tolerance |
| **3. Latency Performance** | $0.15$ | P95 and P99 latency adherence vs SLA/SLO bounds |
| **4. Incident Impact** | $0.15$ | Active SEV-1/SEV-2 incident deductions |
| **5. Dependency Health** | $0.10$ | Upstream and downstream dependency health scores |
| **6. Change Stability** | $0.10$ | Deployment frequency vs change failure rate |
| **7. Recovery Effectiveness** | $0.05$ | MTTR speed and post-remediation recovery verification |
| **8. Observability Coverage** | $0.05$ | Metric, trace, log, and event coverage ratio |

### Grade Classification
- **Grade A+**: $95.0 \le S \le 100.0$
- **Grade A**: $90.0 \le S < 95.0$
- **Grade B**: $80.0 \le S < 90.0$
- **Grade C**: $70.0 \le S < 80.0$
- **Grade D**: $60.0 \le S < 70.0$
- **Grade F**: $S < 60.0$
- **UNKNOWN**: Telemetry coverage $< 20\%$ or missing signals.
