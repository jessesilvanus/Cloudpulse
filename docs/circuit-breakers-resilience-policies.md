# CLOUDPULSE: Circuit Breakers, Retry Policies & Resilience Policies

---

## 1. Circuit Breaker State Transitions

```
[ CLOSED ] ──(Failure Threshold Exceeded)──► [ OPEN ]
     ▲                                          │
     │                                     (Cooldown)
     │                                          ▼
     └───(Success Threshold Met)─────── [ HALF_OPEN ]
```

- **Current Status**:
  - `api-gateway`: **`CLOSED`** ($0$ failures)
  - `order-service`: **`CLOSED`** ($1$ failure)
  - `payment-service`: **`OPEN`** ($14$ consecutive upstream timeout failures, tripping circuit protection)
