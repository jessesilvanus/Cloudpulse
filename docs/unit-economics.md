# CLOUDPULSE — Resource Unit Economics

## 1. Unit Cost Metrics

CLOUDPULSE maps infrastructure spend directly to business transaction volume:

$$\text{Unit Cost}_{\text{Request}} = \frac{\text{Total Ingress Infrastructure Cost}}{\text{Total Processed Ingress Requests}}$$

| Metric Name | Unit | Unit Cost | Monthly Volume | Monthly Total Cost | Trend |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Cost per Ingress Request** | per 10,000 requests | **`$1.42`** | 3,892,000 | $\$552.80$ | $-3.5\%$ |
| **Cost per Confirmed Order** | per 100 orders | **`$0.85`** | 17,480 | $\$148.50$ | $-1.8\%$ |

---

## 2. Cost vs Performance & Reliability Trade-Offs
- Evaluating unit cost alongside P95 latency ensures efficiency gains never compromise customer SLO commitments.
