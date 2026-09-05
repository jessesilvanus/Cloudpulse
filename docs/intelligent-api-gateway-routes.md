# CLOUDPULSE: Intelligent API Gateway & Route Configurations

---

## 1. Route Registry Matrix

| Route ID | Path Pattern | Method | Target Service | Rate Limit | Timeout | Retries | CB Threshold |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: |
| `route-api-health` | `/health` | `GET` | `api-gateway` | $500\text{ RPS}$ | $1,000\text{ ms}$ | $2\times$ | $50\%$ |
| `route-orders-checkout` | `/api/v1/orders/checkout` | `POST` | `order-service` | $200\text{ RPS}$ | $3,000\text{ ms}$ | $3\times$ | $25\%$ |
| `route-orders-checkout-canary` | `/api/v1/orders/checkout` | `POST` | `order-service` (v2.4) | $50\text{ RPS}$ | $3,000\text{ ms}$ | $3\times$ | $15\%$ |
| `route-payments-charge` | `/api/v1/payments/charge` | `POST` | `payment-service` | $150\text{ RPS}$ | $5,000\text{ ms}$ | $2\times$ | $30\%$ |
