# CLOUDPULSE — Recovery Testing & Automated Health Self-Healing

## 1. Automated Kubernetes Self-Healing

1. **Pod Termination Self-Healing**:
   - `ReplicaSet` controller monitors active pod endpoints and immediately requests replacement pod upon eviction/kill.
2. **Liveness & Readiness Probes**:
   - `/health/liveness` failure triggers Kubelet container restart.
   - `/health/ready` failure pauses Service endpoint routing without dropping overall cluster traffic.
3. **Pod Disruption Budgets (PDB)**:
   - Configured with `minAvailable: 1` / `maxUnavailable: 0` ensuring rolling maintenance drains worker nodes without downtime.

---

## 2. Operational Runbook Executions
- Runbooks tested via automated simulations (`rrb-pod-failure` and `rrb-deployment-rollback`).
