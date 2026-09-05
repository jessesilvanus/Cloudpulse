# CLOUDPULSE: Truth-in-Labeling & Data Provenance Matrix

---

## 1. Provenance Classification Tiers

| Classification | Meaning | Examples in Platform |
| :--- | :--- | :--- |
| `LIVE` | Ingested in real-time from running services via OpenTelemetry or OTel/Prometheus. | Ingress HTTP RPS, P99 Latency, 5xx Error Rates, Microservice Spans. |
| `CALCULATED` | Mathematically derived from observed system telemetry and SLA models. | Enterprise Health Score (88.4/100), Burn Rates, Unit Economics per Order. |
| `ESTIMATED` | Statistical or formula-based estimation grounded in industry constants. | GreenOps Regional Carbon Emissions (420.5 kg CO2e), Energy PUE. |
| `SIMULATED` | Executed in a sandbox or modeled drill environment without modifying production. | Multi-Region Failover Drill (42s RTO), Fault Injection, Chaos Experiments. |
| `PREDICTED` | Time-series forecasting model outputs projecting future risk horizons. | Pod Memory Headroom Warning (28d horizon), Cost Forecasts. |
| `UNKNOWN` | Insufficient data collected; no unsupported claims or hallucinations made. | Missing external cloud provider credentials. |
