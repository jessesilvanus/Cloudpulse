# CLOUDPULSE: Microservice Health Scoring & Root Cause Ranking

---

## 1. Microservices Health & Topology

| Service | Health Status | Health Score | Availability | P95 Latency | Error Rate | RPS | Observed Dependencies |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `api-gateway` | **`HEALTHY`** | **`99.2`** | $99.99\%$ | $8.5\text{ms}$ | $0.01\%$ | $240.5$ | `order-service` ($6.2\text{ms}$), `payment-service` ($7.1\text{ms}$) |
| `order-service` | **`HEALTHY`** | **`98.8`** | $99.98\%$ | $14.2\text{ms}$ | $0.02\%$ | $125.4$ | `aws_rds/order-db-primary` ($3.5\text{ms}$), `payment-service` ($8.4\text{ms}$) |
| `payment-service` | **`HEALTHY`** | **`98.5`** | $99.97\%$ | $18.0\text{ms}$ | $0.03\%$ | $98.2$ | `aws_sqs/payment-events-queue` ($4.1\text{ms}$), `redis-cache` ($1.2\text{ms}$) |

---

## 2. Root Cause Candidate Ranking

- **Candidate ID `rc-sim-001`**: *Upstream payment gateway timeout during high checkout burst*
- **Confidence**: **`92.5%`** (Category: `DEPENDENCY`, Status: `CONFIRMED`)
- **Evidence Chain**:
  1. Payment service span latency exceeded $5000\text{ms}$ on 12 calls.
  2. Downstream SQS dead-letter queue spike correlated within $15\text{ seconds}$.
  3. Redis token cache hit ratio remained $99.9\%$ (excluding local cache fault).
