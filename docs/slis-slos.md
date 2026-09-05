# CLOUDPULSE — SLIs and SLOs Mathematical Specifications

## 1. Service Level Indicators (SLIs)

### A. Availability SLI
The proportion of valid HTTP requests that returned successful response codes (non-5xx):

$$\text{SLI}_{\text{Availability}} = \frac{\sum \text{Successful Requests } (\text{HTTP } < 500)}{\sum \text{Total Valid Requests}} \times 100\%$$

### B. Latency Compliance SLI
The proportion of requests completed faster than the defined latency threshold $T$ (e.g. $T = 200\text{ms}$):

$$\text{SLI}_{\text{Latency}} = \frac{\sum \text{Requests with } \text{Duration} \le T}{\sum \text{Total Valid Requests}} \times 100\%$$

### C. Error Rate SLI
The proportion of requests that resulted in server errors:

$$\text{SLI}_{\text{Error Rate}} = \frac{\sum \text{Failed Requests } (\text{HTTP } \ge 500)}{\sum \text{Total Valid Requests}} \times 100\%$$

---

## 2. Service Level Objectives (SLOs)

| Service | SLO Type | Target | Compliance Window | Objective Description |
| :--- | :--- | :---: | :---: | :--- |
| **API Gateway** | Availability | `99.95%` | 30 Days (Rolling) | Core ingress API gateway availability |
| **API Gateway** | Latency | `99.00%` | 30 Days (Rolling) | P99 response latency $\le 200\text{ms}$ |
| **Order Service** | Availability | `99.90%` | 30 Days (Rolling) | Order processing Saga coordinator availability |
| **Order Service** | Latency | `99.00%` | 30 Days (Rolling) | P99 response latency $\le 500\text{ms}$ |
| **Payment Service** | Availability | `99.90%` | 30 Days (Rolling) | Payment verification sandbox availability |
| **Payment Service** | Latency | `99.00%` | 30 Days (Rolling) | P99 response latency $\le 300\text{ms}$ |
