# CLOUDPULSE: SLI / SLO Engine & Mathematical Formulations

---

## 1. Service Level Indicators (SLIs)

SLIs represent quantifiable measurements of service behavior over rolling evaluation windows:

### 1. Ingress Successful Requests Ratio (Availability)
$$\text{SLI}_{\text{avail}} = \frac{\sum \text{rate}\left(\text{http\_requests\_total}\{\text{status} \not\approx \text{"5.."}\}[30\text{d}]\right)}{\sum \text{rate}\left(\text{http\_requests\_total}[30\text{d}]\right)} \times 100\%$$
- *Current Observed Attainment*: **`99.98%`**

### 2. P95 Ingress Gateway Latency
$$\text{SLI}_{\text{lat}} = \text{histogram\_quantile}\left(0.95, \sum \text{rate}\left(\text{http\_request\_duration\_ms\_bucket}[5\text{m}]\right)\right)$$
- *Current Observed Attainment*: **`42.5ms`** (Target: $< 150\text{ms}$)

### 3. Order Processing Success Ratio
$$\text{SLI}_{\text{ord}} = \frac{\sum \text{rate}\left(\text{order\_processed\_total}\{\text{status}=\text{"success"}\}[30\text{d}]\right)}{\sum \text{rate}\left(\text{order\_processed\_total}[30\text{d}]\right)} \times 100\%$$
- *Current Observed Attainment*: **`99.95%`**

---

## 2. Service Level Objectives (SLOs)

| SLO ID | Service | Metric | Target | Warning Threshold | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `slo-gw-avail` | `api-gateway` | 30d Availability | $\ge 99.9\%$ | $99.92\%$ | **`HEALTHY`** |
| `slo-gw-lat` | `api-gateway` | P95 Latency | $< 150\text{ms}$ | $120\text{ms}$ | **`HEALTHY`** |
| `slo-ord-avail` | `order-service` | 30d Success Rate | $\ge 99.9\%$ | $99.92\%$ | **`HEALTHY`** |
| `slo-pay-avail` | `payment-service` | 30d Settlement | $\ge 99.9\%$ | $99.91\%$ | **`HEALTHY`** |
