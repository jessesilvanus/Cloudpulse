# CLOUDPULSE — Distributed Tracing & Span Waterfall

## 1. W3C Context Propagation

Every incoming request generates standard W3C `traceparent` headers:
```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
              │  └───────────── traceId ────────────┘ └─ spanId ──┘  └─ flags
```

---

## 2. Span Waterfall Model

```
api-gateway: POST /orders/checkout        [██████████████████████████████] 142ms
  └─ order-service: POST /orders/process    [███████████████████████] 118ms
      └─ payment-service: POST /authorize     [█████████████] 65ms
```

- Spans record precise start timestamps, duration, status code, and sanitized attributes.
- Failed spans capture sanitized error messages without exposing credentials.
