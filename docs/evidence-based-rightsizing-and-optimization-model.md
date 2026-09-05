# CLOUDPULSE: Evidence-Based Rightsizing & Optimization Engine

---

## 1. Principles of Real Optimization Recommendations

1. **Grounded in Continuous Telemetry**: Every recommendation must cite exact CloudWatch metric time-series data over at least 14 days.
2. **Explainable Rationale**: Show the observed utilization vs. threshold headroom.
3. **Estimated Savings**: Clearly labeled as `ESTIMATED` based on standard AWS On-Demand or Savings Plan pricing.

---

## 2. Active Optimization Opportunities

- **EC2 Worker Rightsizing (`i-091a44bb83912ca81`)**:
  - *Evidence*: 14-day P95 CPU utilization at 18.4%.
  - *Action*: Downsize instance from `m6i.large` ($140.00/mo) to `m6i.medium` ($70.00/mo).
  - *Estimated Benefit*: **`+$45.00/mo net savings`** (Confidence: 92.5%).
- **S3 Telemetry Lake Glacier Tiering (`cloudpulse-telemetry-audit-lake-prod`)**:
  - *Evidence*: 68% of object volume has not been accessed in over 90 days.
  - *Action*: Configure S3 Lifecycle rule to transition stale objects to S3 Glacier Flexible Retrieval.
  - *Estimated Benefit*: **`+$28.00/mo net savings`** (Confidence: 96.0%).
