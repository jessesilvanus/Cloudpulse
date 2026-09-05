# CLOUDPULSE — Three-Pillar Telemetry Correlation

## 1. Trace $\leftrightarrow$ Log $\leftrightarrow$ Metric Correlation

Every request ties the three pillars together with standard W3C correlation identifiers:

```
[Prometheus TSDB Metric Spike]
  └── payment_service_latency_seconds P95 > 300ms
        │
        ▼
[Correlated Distributed Trace]
  └── traceId: tr-002-payment-timeout (Duration: 1850ms, Status: 504)
        │
        ▼
[Correlated Loki Structured Logs]
  └── {"level": "error", "traceId": "tr-002-payment-timeout", "msg": "DB Connection Pool Exhaustion"}
        │
        ▼
[Correlated SRE Incident]
  └── Incident ID: inc-001-payment-degradation (SEV1)
```
