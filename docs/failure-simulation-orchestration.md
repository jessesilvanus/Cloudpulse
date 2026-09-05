# CLOUDPULSE: Failure Simulation & Recovery Orchestration

---

## 1. Safe Failure Simulation Scenarios

- **Region Failure (`scen-region-fail`)**: Simulates total outage of `us-east-1`. Ingress traffic automatically rerouted to `us-west-2` via Global Accelerator with standby replica promotion ($90\text{s RTO}$, $15\text{s RPO}$).
- **Database Failure (`scen-db-fail`)**: Simulates RDS primary crash. Multi-AZ standby replica in `us-east-1b` promoted with zero data loss ($45\text{s RTO}$, $0\text{s RPO}$).

---

## 2. 7-Stage Recovery Workflow

```
[STAGE 1: PRECHECK]
  └─ Validate target cloud credentials, quota, and secondary cluster health
[STAGE 2: BACKUP]
  └─ Verify latest consistent snapshot and transaction log boundary
[STAGE 3: RESTORE]
  └─ Launch replica compute & database instances from verified backup
[STAGE 4: DEPENDENCY_RECOVERY]
  └─ Reconnect message queues, caching layers, and IAM policies
[STAGE 5: SERVICE_RECOVERY]
  └─ Spin up microservice pods and execute startup readiness probes
[STAGE 6: TRAFFIC_RECOVERY]
  └─ Shift Ingress traffic via DNS Global Accelerator weight adjustment
[STAGE 7: VALIDATION]
  └─ Verify distributed traces, error rates < 0.1%, and synthetic orders
```
