# CLOUDPULSE: Mathematical RTO & RPO Tracking

---

## 1. Mathematical Formulation & Measurement

For each tier-1 microservice:

$$\text{RTO Compliance} = \begin{cases} \text{WITHIN\_TARGET} & \text{if } t_{\text{recovery}} \le t_{\text{target\_rto}} \\ \text{EXCEEDED} & \text{if } t_{\text{recovery}} > t_{\text{target\_rto}} \\ \text{NOT\_MEASURED} & \text{if unverified} \end{cases}$$

$$\text{RPO Compliance} = \begin{cases} \text{WITHIN\_TARGET} & \text{if } \Delta t_{\text{data\_loss}} \le \Delta t_{\text{target\_rpo}} \\ \text{EXCEEDED} & \text{if } \Delta t_{\text{data\_loss}} > \Delta t_{\text{target\_rpo}} \\ \text{NOT\_MEASURED} & \text{if unverified} \end{cases}$$

---

## 2. Service Recovery Objectives

| Service Name | Strategy | Target RTO | Actual RTO | RTO Status | Target RPO | Actual RPO | RPO Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `api-gateway` | `WARM_STANDBY` | $5.0\text{ min}$ | **`2.5 min`** | **`WITHIN_TARGET`** | $0\text{ min}$ | **`0 min`** | **`WITHIN_TARGET`** |
| `order-service` | `HOT_STANDBY` | $10.0\text{ min}$ | **`4.8 min`** | **`WITHIN_TARGET`** | $1.0\text{ min}$ | **`0.2 min`** | **`WITHIN_TARGET`** |
| `payment-service` | `PILOT_LIGHT` | $15.0\text{ min}$ | **`6.2 min`** | **`WITHIN_TARGET`** | $0\text{ min}$ | **`0 min`** | **`WITHIN_TARGET`** |
