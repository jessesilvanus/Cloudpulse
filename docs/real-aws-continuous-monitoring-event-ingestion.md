# CLOUDPULSE: Real AWS Continuous Monitoring & Event Ingestion Pipeline

---

## 1. Executive Summary

Phase 43 establishes the **Real AWS Continuous Monitoring, Event Ingestion & Change Intelligence** engine:

```
                      REAL CONNECTED AWS ESTATE
            (CloudTrail Digest Logs, EventBridge Bus, CloudWatch)
                                 │
                                 ▼
                     BOUNDED WINDOW INGESTION
                    (1h, 6h, 24h, 7d Rate-Limited)
                                 │
                                 ▼
                    DEDUPLICATION & VALIDATION
                   (Hash Key: Account + Source + Action + Time)
                                 │
                                 ▼
                     NORMALIZATION (CloudEvent)
               (Actor, Action, Resource, State Transition)
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
          HIGH-RISK GUARD   CORRELATION CHAIN   CROSS-DOMAIN IMPACT
         (Port 22, SCP)   (Deployment -> Drift) (Sec, FinOps, SRE)
                 │               │               │
                 └───────────────┼───────────────┘
                                 │
                                 ▼
                  SITUATION ROOM & COMMAND CENTER
                    (100% Truthful Live Stream)
```

---

## 2. Ingestion Checkpoints & Synchronization

- **State Lifecycle**: `IDLE` $\rightarrow$ `SYNCING` $\rightarrow$ `HEALTHY` (or `DEGRADED`).
- **Bounded Window Sync**: Prevents unbounded fetch storms by querying discrete time intervals (`1h`, `6h`, `24h`, `7d`).
- **Cursor Checkpoint**: Tracks `lastSuccessfulSync`, `lastEventTimestamp`, and opaque cursor token.
